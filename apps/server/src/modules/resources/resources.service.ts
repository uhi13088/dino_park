import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  EARLY_PRODUCTION_RECIPES,
  EARLY_RESOURCES,
  EARLY_RESOURCE_CAPACITY,
  getBuildingById,
  getEarlyProductionRecipe,
  getViewingPlatformCompletedLevel,
  getViewingPlatformStats,
  getViewingPlatformUpgrade,
} from '@dino-park/game-data';
import {
  PARK_ADMISSION,
  type EarlyResourceMaterial,
  type ResourcesResponse,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';
import {
  getViewingPlatformProgressBlock,
  hasClaimedFirstHero,
  isBuilderBusy,
} from '../building/building-upgrade.logic';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  private stockKey(parkId: string, material: string) {
    return { parkId_material_quality: { parkId, material, quality: 0 } };
  }

  private async amount(tx: Tx, parkId: string, material: string) {
    return (
      (await tx.resourceInventory.findUnique({ where: this.stockKey(parkId, material) }))?.amount ??
      0
    );
  }

  async getResources(userId: string): Promise<ResourcesResponse> {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      return this.state(tx, userId);
    });
  }

  /** Record a debit in the caller's transaction after taking the park/currency locks. */
  async spendGold(tx: Tx, userId: string, amount: number, reason: string, id?: string) {
    const debit = await tx.currency.updateMany({
      where: { userId, gold: { gte: amount } },
      data: { gold: { decrement: amount } },
    });
    if (!debit.count) throw new BadRequestException('골드가 부족합니다.');
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    await tx.transaction.create({
      data: {
        id,
        userId,
        type: 'SPEND',
        currencyType: 'gold',
        amount: -amount,
        reason,
        balanceAfter: currency.gold,
      },
    });
  }

  /** Called inside a transaction after its park/currency locks. */
  async consumeMaterials(
    tx: Tx,
    parkId: string,
    materials: Partial<Record<EarlyResourceMaterial, number>>,
  ) {
    for (const [material, quantity] of Object.entries(materials)) {
      if (!Number.isInteger(quantity) || quantity <= 0)
        throw new BadRequestException('자재 수량을 확인해주세요.');
      const debit = await tx.resourceInventory.updateMany({
        where: { parkId, material, quality: 0, amount: { gte: quantity } },
        data: { amount: { decrement: quantity } },
      });
      if (!debit.count)
        throw new BadRequestException(
          `${EARLY_RESOURCES.find((resource) => resource.id === material)?.name ?? material}가 부족합니다.`,
        );
    }
  }

  async purchase(
    userId: string,
    material: string,
    quantity: number,
    requestId?: string,
  ): Promise<ResourcesResponse> {
    const resource = EARLY_RESOURCES.find((item) => item.id === material);
    if (
      !resource ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > EARLY_RESOURCE_CAPACITY
    )
      throw new BadRequestException('구매할 자재와 수량을 확인해주세요.');
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const park = await tx.park.findUniqueOrThrow({ where: { userId } });
      if (park.level < 2)
        throw new BadRequestException('기본 자원은 파크 Lv.2부터 준비할 수 있어요.');
      if (resource.id === 'metal' && !(await hasClaimedFirstHero(tx, park.id)))
        throw new BadRequestException('첫 스테고케라톱스를 수령하면 금속을 구매할 수 있어요.');
      const receiptId = requestId ? `resource-purchase:${userId}:${requestId}` : undefined;
      const reason = `기본 물자 구매: ${resource.name} ${quantity}개`;
      if (receiptId) {
        const receipt = await tx.transaction.findUnique({ where: { id: receiptId } });
        if (receipt) {
          if (receipt.reason !== reason)
            throw new BadRequestException('이 요청의 구매 자재와 수량을 다시 확인해주세요.');
          return this.state(tx, userId);
        }
      }
      const current = await this.amount(tx, park.id, material);
      if (current + quantity > EARLY_RESOURCE_CAPACITY)
        throw new BadRequestException(
          `종류별 보관 한도 ${EARLY_RESOURCE_CAPACITY}개를 넘어요. 필요한 수량만 구매해주세요.`,
        );
      await this.spendGold(tx, userId, resource.buyPrice * quantity, reason, receiptId);
      await tx.resourceInventory.upsert({
        where: this.stockKey(park.id, material),
        create: { parkId: park.id, material, quality: 0, amount: quantity },
        update: { amount: { increment: quantity } },
      });
      return this.state(tx, userId);
    });
  }

  async startProduction(
    userId: string,
    buildingId: string,
    lots: number,
  ): Promise<ResourcesResponse> {
    if (!Number.isInteger(lots) || lots < 1 || lots > 3)
      throw new BadRequestException('생산량은 기본 1~3회분으로 선택해주세요.');
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const park = await tx.park.findUniqueOrThrow({ where: { userId } });
      const building = await tx.building.findFirst({ where: { id: buildingId, parkId: park.id } });
      if (!building) throw new NotFoundException('내 생산 시설을 찾을 수 없습니다.');
      const recipe = getEarlyProductionRecipe(building.typeId);
      if (!recipe || building.status !== 'ACTIVE')
        throw new BadRequestException('완공된 벌목장이나 채석장에서 생산을 시작해주세요.');
      if (await tx.productionJob.findUnique({ where: { activeSlot: building.id } }))
        throw new BadRequestException('이 시설의 생산품을 먼저 수령해주세요.');
      const quantity = recipe.batchQuantity * lots;
      if ((await this.amount(tx, park.id, recipe.material)) + quantity > EARLY_RESOURCE_CAPACITY)
        throw new BadRequestException(
          '완료 물량을 보관할 공간이 부족해요. 생산량을 줄이거나 자재를 먼저 사용해주세요.',
        );
      const costGold = recipe.batchCost * lots;
      await this.spendGold(
        tx,
        userId,
        costGold,
        `자원 생산: ${getBuildingById(building.typeId)?.nameKo} ${lots}회분`,
      );
      await tx.productionJob.create({
        data: {
          parkId: park.id,
          buildingId: building.id,
          activeSlot: building.id,
          material: recipe.material,
          lots,
          quantity,
          costGold,
          readyAt: new Date(Date.now() + recipe.batchSeconds * lots * 1000),
        },
      });
      return this.state(tx, userId);
    });
  }

  async claimProduction(userId: string, jobId: string): Promise<ResourcesResponse> {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const park = await tx.park.findUniqueOrThrow({ where: { userId } });
      const job = await tx.productionJob.findFirst({ where: { id: jobId, parkId: park.id } });
      if (!job) throw new NotFoundException('내 생산 작업을 찾을 수 없습니다.');
      if (job.claimedAt) return this.state(tx, userId);
      if (job.readyAt.getTime() > Date.now())
        throw new BadRequestException('아직 생산 중이에요. 완료 시각을 기다려주세요.');
      const current = await this.amount(tx, park.id, job.material);
      if (current + job.quantity > EARLY_RESOURCE_CAPACITY)
        throw new BadRequestException(
          '재고 공간이 부족해요. 완료된 생산품은 시설에 보관되니 자재를 사용한 뒤 수령해주세요.',
        );
      const receipt = await tx.productionJob.updateMany({
        where: { id: job.id, claimedAt: null, activeSlot: job.buildingId },
        data: { claimedAt: new Date(), activeSlot: null },
      });
      if (!receipt.count) return this.state(tx, userId);
      const stock = await tx.resourceInventory.upsert({
        where: this.stockKey(park.id, job.material),
        create: { parkId: park.id, material: job.material, quality: 0, amount: job.quantity },
        update: { amount: { increment: job.quantity } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'EARN',
          currencyType: job.material,
          amount: job.quantity,
          reason: '생산품 수령',
          balanceAfter: stock.amount,
        },
      });
      return this.state(tx, userId);
    });
  }

  private async state(tx: Tx, userId: string): Promise<ResourcesResponse> {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: {
        buildings: true,
        resourceInventory: true,
        productionJobs: { where: { claimedAt: null } },
      },
    });
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const stock = (material: string) =>
      park.resourceInventory.find((item) => item.material === material && item.quality === 0)
        ?.amount ?? 0;
    const platform = park.buildings.find(
      (building) => building.typeId === PARK_ADMISSION.platformTypeId,
    );
    const claimedFirstHero = await hasClaimedFirstHero(tx, park.id);
    const busy = park.buildings.filter(isBuilderBusy).length;
    const platformUpgrade: ResourcesResponse['platformUpgrade'] = platform
      ? this.platformUpgradeState(
          platform,
          park.level,
          claimedFirstHero,
          busy,
          currency.gold,
          stock,
        )
      : null;
    return {
      gold: currency.gold,
      parkLevel: park.level,
      capacityPerMaterial: EARLY_RESOURCE_CAPACITY,
      inventory: EARLY_RESOURCES.filter(
        (resource) => resource.id !== 'metal' || claimedFirstHero,
      ).map((resource) => ({
        material: resource.id,
        name: resource.name,
        amount: stock(resource.id),
        buyPrice: resource.buyPrice,
      })),
      facilities: EARLY_PRODUCTION_RECIPES.map((recipe) => {
        const type = getBuildingById(recipe.buildingTypeId)!;
        const building = park.buildings.find((item) => item.typeId === recipe.buildingTypeId);
        const job = building
          ? park.productionJobs.find((item) => item.buildingId === building.id)
          : undefined;
        return {
          typeId: type.id,
          name: type.nameKo,
          unlockLevel: type.unlockCondition.parkLevel,
          cost: type.baseCost ?? type.unlockCondition.cost.gold,
          constructionSeconds: type.constructionTime ?? 60,
          building: building
            ? {
                id: building.id,
                status: building.status,
                completesAt: building.completesAt?.toISOString() ?? null,
              }
            : null,
          recipe: {
            material: recipe.material,
            batchQuantity: recipe.batchQuantity,
            batchCost: recipe.batchCost,
            batchSeconds: recipe.batchSeconds,
            maxLots: recipe.maxLots,
          },
          job: job
            ? {
                id: job.id,
                lots: job.lots,
                quantity: job.quantity,
                readyAt: job.readyAt.toISOString(),
                ready: job.readyAt.getTime() <= Date.now(),
                claimBlocked: stock(job.material) + job.quantity > EARLY_RESOURCE_CAPACITY,
              }
            : null,
        };
      }),
      platformUpgrade,
    };
  }

  private platformUpgradeState(
    platform: { id: string; status: string; level: number; completesAt: Date | null },
    parkLevel: number,
    claimedFirstHero: boolean,
    busy: number,
    gold: number,
    stock: (material: string) => number,
  ): NonNullable<ResourcesResponse['platformUpgrade']> {
    const upgrading = platform.status === 'UPGRADING';
    const level = getViewingPlatformCompletedLevel(platform.level, upgrading);
    const upgrade = getViewingPlatformUpgrade(level + 1);
    const materials = upgrade?.materials ?? { wood: 0, stone: 0 };
    const completesAt = isBuilderBusy(platform)
      ? (platform.completesAt?.toISOString() ?? null)
      : null;
    let reason: string | null = '이번 관람대 확장을 마쳤어요.';
    if (platform.status !== 'ACTIVE') reason = '관람대 공사 중이에요.';
    else if (upgrade) {
      reason = getViewingPlatformProgressBlock(parkLevel, claimedFirstHero, upgrade);
      if (!reason && busy >= (claimedFirstHero ? 2 : 1))
        reason = '진행 중인 공사를 먼저 마쳐주세요.';
      if (!reason && gold < upgrade.gold) reason = '확장 골드가 부족해요.';
      if (
        !reason &&
        Object.entries(materials).some(([material, quantity]) => stock(material) < quantity)
      )
        reason = upgrade.materials.metal
          ? '확장에 필요한 목재·석재·금속을 준비해주세요.'
          : '확장에 필요한 목재와 석재를 준비해주세요.';
    }
    return {
      buildingId: platform.id,
      level,
      targetLevel: platform.status === 'CONSTRUCTING' ? null : (upgrade?.targetLevel ?? null),
      completesAt,
      available: reason === null,
      reason,
      cost: { gold: upgrade?.gold ?? 0, ...materials },
      seconds: upgrade?.seconds ?? 0,
      targetCapacity: upgrade?.capacity ?? getViewingPlatformStats(level).capacity,
    };
  }
}
