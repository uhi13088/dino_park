import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  TECHNOLOGY_CATALOG,
  getBuildingById,
  getResearchFacilityUpgrade,
  getTechnology,
  RESEARCH_LAB_ID,
} from '@dino-park/game-data';
import type {
  ResearchFacilityState,
  ResearchStateResponse,
  ResearchTechnologyState,
} from '@dino-park/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isBuilderBusy } from '../building/building-upgrade.logic';
import { getParkStorageLimits } from '../economy/park-storage-limits';
import { ParkOperationsService } from '../park/park-operations.service';
import { ResourcesService } from '../resources/resources.service';
import {
  highestCompletedFacilityLevel,
  researchFacilityBlock,
  researchFacilityCap,
  researchFacilityLevel,
} from './research-facilities';
import {
  completedTechnologyLevels,
  describePrerequisite,
  isConnectedResearch,
  missingFunds,
  quoteResearchRank,
  RESEARCH_FACILITY_IDS,
  RESEARCH_MATERIALS,
  RESEARCHER_CAPACITY,
} from './technology-progress';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ResearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly resources: ResourcesService,
  ) {}

  private async read(tx: Tx, userId: string, now: Date) {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: {
        buildings: true,
        firstSynthesis: { select: { claimedAt: true } },
        technologyResearch: { orderBy: { completesAt: 'asc' } },
        resourceInventory: {
          where: { quality: 0, material: { in: [...RESEARCH_MATERIALS] } },
          select: { material: true, amount: true },
        },
      },
    });
    const { gold } = await tx.currency.findUniqueOrThrow({
      where: { userId },
      select: { gold: true },
    });
    const { goldCapacity, capacityPerMaterial } = await getParkStorageLimits(tx, park.id, now);
    const amounts = new Map(
      park.resourceInventory.map(({ material, amount }) => [material, amount]),
    );
    const stock = {
      wood: amounts.get('wood') ?? 0,
      stone: amounts.get('stone') ?? 0,
      metal: amounts.get('metal') ?? 0,
    };
    const activeResearch = park.technologyResearch.filter(({ technologyId }) =>
      getTechnology(technologyId),
    );
    const completed = completedTechnologyLevels(activeResearch, now);
    const pending = activeResearch.filter(({ completesAt }) => completesAt > now);
    const firstHero = !!park.firstSynthesis?.claimedAt;
    const context = {
      labLevel: highestCompletedFacilityLevel(park.buildings, RESEARCH_LAB_ID),
      parkLevel: park.level,
      firstHero,
      completed,
      activeJobs: pending.length,
      gold,
      goldCapacity,
      capacityPerMaterial,
      stock,
    };
    return { park, pending, context };
  }

  private response(
    { park, pending, context }: Awaited<ReturnType<ResearchService['read']>>,
    now: Date,
  ): ResearchStateResponse {
    const { completed, gold, goldCapacity, capacityPerMaterial, stock, firstHero } = context;
    const technologies = TECHNOLOGY_CATALOG.map((technology): ResearchTechnologyState => {
      const completedLevel = completed.get(technology.id) ?? 0;
      const rank = technology.ranks.find(({ level }) => level === completedLevel + 1);
      return {
        id: technology.id,
        name: technology.name,
        family: technology.family,
        connected: isConnectedResearch(technology.id),
        maxLevel: technology.ranks.length,
        completedLevel,
        prerequisites: technology.prerequisites.map((prerequisite) =>
          describePrerequisite(prerequisite, completed),
        ),
        next: rank ? quoteResearchRank(technology, rank, context) : null,
      };
    });
    const cap = researchFacilityCap(completed);
    const busy = park.buildings.filter(isBuilderBusy).length;
    const facilities = RESEARCH_FACILITY_IDS.map((typeId): ResearchFacilityState => {
      const building = park.buildings
        .filter((item) => item.typeId === typeId)
        .sort(
          (left, right) =>
            researchFacilityLevel(right) - researchFacilityLevel(left) || right.level - left.level,
        )[0];
      const completedLevel = building ? researchFacilityLevel(building) : 0;
      const plan =
        !building || building.status === 'ACTIVE'
          ? getResearchFacilityUpgrade(typeId, (building?.level ?? 0) + 1)
          : undefined;
      const name = getBuildingById(typeId)?.nameKo ?? typeId;
      const unavailableReason = plan
        ? (researchFacilityBlock(plan, park.level, firstHero, completed) ??
          (plan.durationSeconds > 0 && busy >= (firstHero ? 2 : 1)
            ? '진행 중인 공사를 먼저 마쳐주세요.'
            : missingFunds(plan.costs, gold, stock, goldCapacity, capacityPerMaterial)))
        : undefined;
      return {
        typeId,
        name,
        completedLevel,
        effect: getResearchFacilityUpgrade(typeId, completedLevel)?.effect ?? 0,
        cap,
        building: building
          ? {
              id: building.id,
              level: building.level,
              status: building.status,
              completesAt: building.completesAt?.toISOString() ?? null,
            }
          : null,
        next: plan
          ? {
              level: plan.level,
              parkLevel: plan.parkLevel,
              effect: plan.effect,
              costs: plan.costs,
              durationSeconds: plan.durationSeconds,
              minimumDurationSeconds: plan.minimumDurationSeconds,
              ...(plan.prerequisite
                ? { prerequisite: describePrerequisite(plan.prerequisite, completed) }
                : {}),
              ...(unavailableReason ? { unavailableReason } : {}),
            }
          : null,
      };
    });
    return {
      serverNow: now.toISOString(),
      parkLevel: park.level,
      gold,
      goldCapacity,
      capacityPerMaterial,
      stock,
      queue: {
        capacity: RESEARCHER_CAPACITY,
        jobs: pending.map((job) => ({
          technologyId: job.technologyId,
          name: getTechnology(job.technologyId)?.name ?? job.technologyId,
          level: job.level,
          startedAt: job.startedAt.toISOString(),
          completesAt: job.completesAt.toISOString(),
        })),
      },
      technologies,
      facilities,
    };
  }

  getState(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      return this.response(await this.read(tx, userId, now), now);
    });
  }

  start(userId: string, technologyId: string, level: number) {
    const technology = getTechnology(technologyId);
    if (!technology) throw new NotFoundException('기술을 찾을 수 없어요.');
    const rank = technology.ranks.find((rank) => rank.level === level);
    if (!rank) throw new BadRequestException('이 기술에 해당 연구 단계가 없어요.');
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      const world = await this.read(tx, userId, now);
      const { park, context } = world;
      const completedLevel = context.completed.get(technologyId) ?? 0;
      const alreadyStarted = world.pending.some(
        (job) => job.technologyId === technologyId && job.level === level,
      );
      if (level <= completedLevel || alreadyStarted) return this.response(world, now);
      if (level !== completedLevel + 1)
        throw new BadRequestException('직전 단계 연구를 먼저 완료하세요.');
      const quote = quoteResearchRank(technology, rank, context);
      if (quote.unavailableReason) throw new BadRequestException(quote.unavailableReason);
      const materials = Object.fromEntries(
        RESEARCH_MATERIALS.filter((material) => quote.costs[material] > 0).map((material) => [
          material,
          quote.costs[material],
        ]),
      );
      await this.resources.consumeMaterials(tx, park.id, materials);
      if (quote.costs.gold > 0)
        await this.resources.spendGold(
          tx,
          userId,
          quote.costs.gold,
          `기술 연구: ${technology.name} Lv.${level}`,
        );
      await tx.parkTechnologyResearch.create({
        data: {
          parkId: park.id,
          technologyId,
          level,
          startedAt: now,
          completesAt: new Date(now.getTime() + quote.durationSeconds * 1000),
        },
      });
      return this.response(await this.read(tx, userId, now), now);
    });
  }
}
