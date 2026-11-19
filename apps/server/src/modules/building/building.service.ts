import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Building, BuildingStatus, Prisma } from '@prisma/client';
import { FIRST_HYBRID_HABITAT_ID, MAX_BUILDING_LEVEL, PARK_ADMISSION } from '@dino-park/shared';
import { ParkOperationsService } from '../park/park-operations.service';
import { admissionSnapshot, contains, type AdmissionWorld } from '../park/park-admission.logic';
import {
  getBuildingById,
  getEarlyProductionRecipe,
  getViewingPlatformUpgrade,
} from '@dino-park/game-data';
import { ResourcesService } from '../resources/resources.service';
import {
  getViewingPlatformProgressBlock,
  hasClaimedFirstHero,
  isBuilderBusy,
} from './building-upgrade.logic';

/**
 * 건물 레벨별 업그레이드 비용
 * 공식: baseCost * (1.5 ^ (level - 1))
 */
function getUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.5, level - 1));
}

/**
 * 건물 레벨별 업그레이드 시간 (초)
 * 공식: baseTime * level
 */
function getUpgradeTime(baseTime: number, level: number): number {
  return baseTime * level;
}

/**
 * 건물 보너스 계산
 * 레벨에 따라 보너스 증가
 */
function calculateBuildingBonus(baseBonus: number, level: number): number {
  return baseBonus * (1 + (level - 1) * 0.2); // 레벨당 20% 증가
}

function requiresExhibitionRoute(typeId: string) {
  return typeId === FIRST_HYBRID_HABITAT_ID || typeId === 'habitat-carnivore';
}

@Injectable()
export class BuildingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly resources: ResourcesService,
  ) {}

  private async assertBuilderSlot(
    tx: Prisma.TransactionClient,
    parkId: string,
    buildings: Building[],
    claimedFirstHero?: boolean,
  ) {
    const busy = buildings.filter(isBuilderBusy).length;
    if (busy === 0) return;
    const earnedSecondSlot =
      busy === 1 && (claimedFirstHero ?? (await hasClaimedFirstHero(tx, parkId)));
    if (!earnedSecondSlot) throw new BadRequestException('진행 중인 공사를 먼저 마쳐주세요.');
  }

  private assertExhibitionRoute(park: AdmissionWorld, buildingId: string, now: number) {
    const snapshot = admissionSnapshot(park, now);
    if (!snapshot.connectedPlatformIds.length || !snapshot.connectedHabitatIds.includes(buildingId))
      throw new BadRequestException(
        '입구에서 관람대와 서식지까지 길이 이어지는 곳을 선택해주세요.',
      );
  }

  /**
   * 유저의 건물 목록 조회
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    const buildings = await this.prisma.building.findMany({
      where: { parkId: park.id },
      orderBy: { createdAt: 'desc' },
    });

    return buildings.map((building: Building) => this.enrichBuildingData(building));
  }

  /**
   * 건물 상세 조회
   */
  async getById(id: string, userId?: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        park: {
          select: { userId: true },
        },
      },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    if (userId && building.park.userId !== userId) {
      throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
    }

    return this.enrichBuildingData(building);
  }

  /**
   * 건물 건설
   */
  async construct(userId: string, typeId: string, positionX: number, positionY: number) {
    const type = getBuildingById(typeId);
    if (!type) throw new BadRequestException('알 수 없는 시설입니다.');
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const park = await tx.park.findUnique({
        where: { userId },
        include: { buildings: true, dinosaurs: true },
      });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
      if (park.level < type.unlockCondition.parkLevel)
        throw new BadRequestException(
          `파크 Lv.${type.unlockCondition.parkLevel}부터 지을 수 있어요.`,
        );
      await this.assertBuilderSlot(tx, park.id, park.buildings);
      if (
        typeId === PARK_ADMISSION.platformTypeId &&
        park.buildings.some((b) => b.typeId === typeId)
      )
        throw new BadRequestException(
          '첫 관람대는 이미 준비됐어요. 확장은 다음 단계에서 열립니다.',
        );
      if (
        getEarlyProductionRecipe(typeId) &&
        park.buildings.some((building) => building.typeId === typeId)
      )
        throw new BadRequestException(
          '이 생산 시설은 이미 준비돼 있어요. 기존 시설에서 생산을 시작해주세요.',
        );
      if (!this.operations.positionFree(park, null, positionX, positionY, typeId))
        throw new BadRequestException(
          '파크 안에서 다른 시설·공룡과 겹치지 않는 칸을 선택해주세요.',
        );
      const cost = type.baseCost ?? type.unlockCondition.cost.gold;
      const seconds = type.constructionTime ?? 60;
      const completesAt = new Date(Date.now() + seconds * 1000);
      if (typeId === PARK_ADMISSION.platformTypeId) {
        const preview = {
          id: 'preview',
          parkId: park.id,
          typeId,
          level: 1,
          positionX,
          positionY,
          status: BuildingStatus.ACTIVE,
          assignedGreatFigureId: null,
          completesAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const before = admissionSnapshot(park, Date.now());
        const after = admissionSnapshot(
          { ...park, buildings: [...park.buildings, preview] },
          Date.now(),
        );
        if (!after.canOpen || after.capacity <= before.capacity)
          throw new BadRequestException('입구와 서식지에 방문객 길이 이어지는 곳에 지어주세요.');
      }
      if (getEarlyProductionRecipe(typeId) || type.unlockCondition.cost.materials) {
        const now = Date.now();
        const before = admissionSnapshot(park, now);
        const proposed = {
          id: 'production-preview',
          parkId: park.id,
          typeId,
          level: 1,
          positionX,
          positionY,
          status: BuildingStatus.ACTIVE,
          assignedGreatFigureId: null,
          completesAt: null,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        };
        const preview = { ...park, buildings: [...park.buildings, proposed] };
        if (requiresExhibitionRoute(typeId)) this.assertExhibitionRoute(preview, proposed.id, now);
        if (before.canOpen && !admissionSnapshot(preview, now).canOpen)
          throw new BadRequestException('방문객 길을 막지 않는 위치에 시설을 놓아주세요.');
      }
      if (type.unlockCondition.cost.materials)
        await this.resources.consumeMaterials(tx, park.id, type.unlockCondition.cost.materials);
      const debit = await tx.currency.updateMany({
        where: { userId, gold: { gte: cost } },
        data: { gold: { decrement: cost } },
      });
      if (!debit.count) throw new BadRequestException('골드가 부족합니다.');
      const building = await tx.building.create({
        data: {
          parkId: park.id,
          typeId,
          positionX,
          positionY,
          status: BuildingStatus.CONSTRUCTING,
          completesAt,
        },
      });
      const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: -cost,
          reason: `시설 건설: ${type.nameKo}`,
          balanceAfter: currency.gold,
        },
      });
      return {
        ...this.enrichBuildingData(building),
        goldSpent: cost,
        constructionTime: seconds,
        completesAt,
      };
    });
  }

  /**
   * 건설/업그레이드 완료 체크
   */
  async checkCompletion(buildingId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const building = await tx.building.findUnique({
        where: { id: buildingId },
        include: { park: { select: { userId: true } } },
      });
      if (!building) throw new NotFoundException('건물을 찾을 수 없습니다.');
      if (building.park.userId !== userId)
        throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
      return {
        completed: building.status === BuildingStatus.ACTIVE,
        building: this.enrichBuildingData(building),
        remainingSeconds: building.completesAt
          ? Math.max(0, Math.ceil((building.completesAt.getTime() - Date.now()) / 1000))
          : 0,
      };
    });
  }

  /**
   * 건물 즉시 완료 (다이아 사용)
   */
  async instantComplete(buildingId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const building = await tx.building.findUnique({
        where: { id: buildingId },
        include: { park: { select: { userId: true } } },
      });
      if (!building) throw new NotFoundException('건물을 찾을 수 없습니다.');
      if (building.park.userId !== userId)
        throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
      if (building.status === BuildingStatus.ACTIVE) return this.enrichBuildingData(building);
      if (
        building.typeId === PARK_ADMISSION.platformTypeId &&
        building.status === BuildingStatus.UPGRADING &&
        getViewingPlatformUpgrade(building.level)?.materials.metal
      )
        throw new BadRequestException('관람대 Lv.3 이상은 공사 시간이 지나면 완공돼요.');
      const debit = await tx.currency.updateMany({
        where: { userId, diamond: { gte: 10 } },
        data: { diamond: { decrement: 10 } },
      });
      if (!debit.count) throw new BadRequestException('다이아가 부족합니다.');
      const updated = await tx.building.update({
        where: { id: buildingId },
        data: { status: BuildingStatus.ACTIVE, completesAt: null },
      });
      return { ...this.enrichBuildingData(updated), diamondSpent: 10 };
    });
  }

  /**
   * 건물 업그레이드
   */
  async upgrade(buildingId: string, userId: string, targetLevel?: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const building = await tx.building.findUnique({
        where: { id: buildingId },
        include: { park: { include: { buildings: true } } },
      });
      if (!building) throw new NotFoundException('건물을 찾을 수 없습니다.');
      if (building.park.userId !== userId)
        throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
      const nextLevel = building.level + 1;
      if (targetLevel !== undefined) {
        if (targetLevel <= building.level)
          return { ...this.enrichBuildingData(building), goldSpent: 0 };
        if (targetLevel !== nextLevel)
          throw new BadRequestException('현재 시설의 다음 레벨을 확인해주세요.');
      }
      if (building.status !== BuildingStatus.ACTIVE)
        throw new BadRequestException('완공된 시설을 선택해주세요.');
      const type = getBuildingById(building.typeId);
      const maximumLevel = type?.maxLevel ?? MAX_BUILDING_LEVEL;
      if (building.level >= maximumLevel)
        throw new BadRequestException('현재 준비된 최대 레벨입니다.');
      const isPlatform = building.typeId === PARK_ADMISSION.platformTypeId;
      const platformUpgrade = isPlatform ? getViewingPlatformUpgrade(nextLevel) : undefined;
      const claimedFirstHero = platformUpgrade?.materials.metal
        ? await hasClaimedFirstHero(tx, building.parkId)
        : undefined;
      if (platformUpgrade) {
        const block = getViewingPlatformProgressBlock(
          building.park.level,
          Boolean(claimedFirstHero),
          platformUpgrade,
        );
        if (block) throw new BadRequestException(block);
      }
      await this.assertBuilderSlot(tx, building.parkId, building.park.buildings, claimedFirstHero);
      const baseCost = type?.baseCost ?? type?.unlockCondition.cost.gold ?? 1000;
      const upgradeCost = platformUpgrade?.gold ?? getUpgradeCost(baseCost, nextLevel);
      const upgradeTime =
        platformUpgrade?.seconds ?? getUpgradeTime(type?.constructionTime ?? 60, nextLevel);
      if (platformUpgrade)
        await this.resources.consumeMaterials(tx, building.park.id, platformUpgrade.materials);
      const debit = await tx.currency.updateMany({
        where: { userId, gold: { gte: upgradeCost } },
        data: { gold: { decrement: upgradeCost } },
      });
      if (!debit.count) throw new BadRequestException('골드가 부족합니다.');
      const completesAt = new Date(Date.now() + upgradeTime * 1000);
      const updated = await tx.building.update({
        where: { id: buildingId },
        data: { status: BuildingStatus.UPGRADING, level: { increment: 1 }, completesAt },
      });
      const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: -upgradeCost,
          reason: `시설 확장: ${type?.nameKo ?? building.typeId}`,
          balanceAfter: currency.gold,
        },
      });
      return {
        ...this.enrichBuildingData(updated),
        goldSpent: upgradeCost,
        upgradeTime,
        completesAt,
      };
    });
  }

  /**
   * 위인 배치
   */
  async assignGreatFigure(buildingId: string, userId: string, greatFigureId: string) {
    const building = await this.getById(buildingId, userId);

    if (building.status !== BuildingStatus.ACTIVE) {
      throw new BadRequestException('건설/업그레이드 중인 건물입니다.');
    }

    // 위인 소유 확인
    const userGreatFigure = await this.prisma.userGreatFigure.findFirst({
      where: {
        id: greatFigureId,
        userId,
      },
    });

    if (!userGreatFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    // 이미 다른 건물에 배치되어 있는지 확인
    if (userGreatFigure.assignedBuildingId && userGreatFigure.assignedBuildingId !== buildingId) {
      throw new BadRequestException('이미 다른 건물에 배치된 위인입니다.');
    }

    // 기존 배치된 위인 해제 + 새 위인 배치
    await this.prisma.$transaction([
      // 기존 위인 해제
      this.prisma.userGreatFigure.updateMany({
        where: { assignedBuildingId: buildingId },
        data: { assignedBuildingId: null },
      }),
      // 새 위인 배치
      this.prisma.userGreatFigure.update({
        where: { id: greatFigureId },
        data: { assignedBuildingId: buildingId },
      }),
      // 건물에 위인 ID 저장
      this.prisma.building.update({
        where: { id: buildingId },
        data: { assignedGreatFigureId: greatFigureId },
      }),
    ]);

    return this.getById(buildingId, userId);
  }

  /**
   * 위인 해제
   */
  async unassignGreatFigure(buildingId: string, userId: string) {
    const building = await this.getById(buildingId, userId);

    if (!building.assignedGreatFigureId) {
      throw new BadRequestException('배치된 위인이 없습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.userGreatFigure.updateMany({
        where: { assignedBuildingId: buildingId },
        data: { assignedBuildingId: null },
      }),
      this.prisma.building.update({
        where: { id: buildingId },
        data: { assignedGreatFigureId: null },
      }),
    ]);

    return this.getById(buildingId, userId);
  }

  /**
   * 건물 이동
   */
  async move(buildingId: string, userId: string, positionX: number, positionY: number) {
    const owned = await this.getById(buildingId, userId);
    if (owned.typeId === PARK_ADMISSION.entranceTypeId) {
      await this.operations.moveEntrance(userId, positionX, positionY);
      return this.getById(buildingId, userId);
    }
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const park = await tx.park.findUnique({
        where: { userId },
        include: { buildings: true, dinosaurs: true },
      });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
      const building = park.buildings.find((b) => b.id === buildingId);
      if (!building) throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
      if (
        building.typeId === FIRST_HYBRID_HABITAT_ID &&
        park.dinosaurs.some(
          (dinosaur) =>
            dinosaur.isInPark &&
            contains(building, { x: dinosaur.positionX, y: dinosaur.positionY }),
        )
      )
        throw new BadRequestException('서식지에 있는 공룡을 먼저 배치 대기로 옮겨주세요.');
      if (!this.operations.positionFree(park, buildingId, positionX, positionY))
        throw new BadRequestException('다른 시설·공룡과 겹치지 않는 파크 안의 칸을 선택해주세요.');
      if (requiresExhibitionRoute(building.typeId)) {
        const preview = park.buildings.map((candidate) =>
          candidate.id === buildingId
            ? { ...candidate, positionX, positionY, status: BuildingStatus.ACTIVE }
            : candidate,
        );
        this.assertExhibitionRoute({ ...park, buildings: preview }, buildingId, Date.now());
      }
      const updated = await tx.building.update({
        where: { id: buildingId },
        data: { positionX, positionY },
      });
      return this.enrichBuildingData(updated);
    });
  }

  /**
   * 건물 철거
   */
  async demolish(buildingId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const building = await tx.building.findUnique({
        where: { id: buildingId },
        include: { park: { select: { userId: true } } },
      });
      if (!building) throw new NotFoundException('건물을 찾을 수 없습니다.');
      if (building.park.userId !== userId)
        throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
      if ([PARK_ADMISSION.entranceTypeId, 'habitat-grassland'].includes(building.typeId))
        throw new BadRequestException(
          '기본 입구와 초원은 철거할 수 없어요. 무료 이동을 이용해주세요.',
        );
      if (
        getEarlyProductionRecipe(building.typeId) &&
        (await tx.productionJob.findUnique({ where: { activeSlot: building.id } }))
      )
        throw new BadRequestException('생산품을 먼저 수령한 뒤 시설을 철거해주세요.');
      if (building.typeId === FIRST_HYBRID_HABITAT_ID) {
        const dinosaurs = await tx.dinosaur.findMany({
          where: { parkId: building.parkId, isInPark: true },
        });
        if (
          dinosaurs.some((dinosaur) =>
            contains(building, { x: dinosaur.positionX, y: dinosaur.positionY }),
          )
        )
          throw new BadRequestException('서식지에 있는 공룡을 먼저 배치 대기로 옮겨주세요.');
      }
      const synthesis = await tx.firstSynthesisJob.findFirst({
        where: { parkId: building.parkId, labId: building.id, claimedAt: null },
        select: { parkId: true },
      });
      if (synthesis) throw new BadRequestException('합성 결과를 수령한 뒤 연구소를 철거해주세요.');
      if (building.assignedGreatFigureId)
        await tx.userGreatFigure.updateMany({
          where: { assignedBuildingId: buildingId },
          data: { assignedBuildingId: null },
        });
      const type = getBuildingById(building.typeId);
      const baseCost = type?.baseCost ?? type?.unlockCondition.cost.gold ?? 1000;
      let invested = 0;
      for (let level = 1; level <= building.level; level++)
        invested +=
          (building.typeId === PARK_ADMISSION.platformTypeId
            ? getViewingPlatformUpgrade(level)?.gold
            : undefined) ?? getUpgradeCost(baseCost, level);
      const refund = Math.floor(invested * 0.5);
      await tx.building.delete({ where: { id: buildingId } });
      await tx.currency.update({ where: { userId }, data: { gold: { increment: refund } } });
      return { demolished: true, goldRefund: refund };
    });
  }

  /**
   * 건물 보너스 계산
   */
  async calculateBonus(buildingId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    // game-data에서 건물 보너스 정보 가져오기
    const buildingData = getBuildingById(building.typeId);
    const baseBonus = buildingData?.baseBonus || 5;

    let bonus = calculateBuildingBonus(baseBonus, building.level);

    // 위인 배치 시 추가 보너스
    if (building.assignedGreatFigureId) {
      const greatFigure = await this.prisma.userGreatFigure.findUnique({
        where: { id: building.assignedGreatFigureId },
      });

      if (greatFigure) {
        // 위인 레벨에 따른 추가 보너스
        bonus += greatFigure.level * 2; // 위인 레벨당 2%
      }
    }

    return {
      buildingId,
      typeId: building.typeId,
      level: building.level,
      baseBonus,
      totalBonus: Math.floor(bonus),
      hasGreatFigure: !!building.assignedGreatFigureId,
    };
  }

  /**
   * 건물 데이터 보강 (추가 정보 계산)
   */
  private enrichBuildingData(building: Building) {
    // game-data에서 건물 정보 가져오기
    const buildingData = getBuildingById(building.typeId);
    const baseCost = buildingData?.baseCost ?? buildingData?.unlockCondition.cost.gold ?? 1000;
    const baseBonus = buildingData?.baseBonus || 5;

    const maximumLevel = buildingData?.maxLevel ?? MAX_BUILDING_LEVEL;
    const nextLevelCost =
      building.level < maximumLevel
        ? building.typeId === PARK_ADMISSION.platformTypeId
          ? (getViewingPlatformUpgrade(building.level + 1)?.gold ?? null)
          : getUpgradeCost(baseCost, building.level + 1)
        : null;

    const currentBonus = calculateBuildingBonus(baseBonus, building.level);

    return {
      ...building,
      currentBonus: Math.floor(currentBonus),
      nextLevelCost,
      maxLevel: maximumLevel,
      isMaxLevel: building.level >= maximumLevel,
    };
  }
}
