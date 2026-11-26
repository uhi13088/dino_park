import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  ENTRANCE_RESEARCH,
  ENVIRONMENT_ADAPTATION_RESEARCH,
  FIELD_MAPPING_RESEARCH,
  PARK_GROWTH_OPERATIONS_MILESTONES,
  PARK_LEVEL_EIGHT_GROWTH,
  PARK_LEVEL_SEVEN_GROWTH,
  PARK_LEVEL_SIX_GROWTH,
  getParkMidgameGrowth,
  growthFacilityHasCompletedLevel,
} from '@dino-park/game-data';
import {
  FIRST_HYBRID_LAB_ID,
  MAX_PARK_LEVEL,
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  getParkLevelExperience,
  type DriveMissionId,
  type ParkEarlyGrowthResponse,
  type ParkEarlyGrowthStage,
  type ParkGrowthGoal,
  type ParkGrowthGoalId,
  type ParkGrowthResponse,
  type ParkGrowthRouteId,
  type ParkGrowthStage,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { admissionSnapshot } from './park-admission.logic';
import { readParkMidgameGrowth } from './park-midgame-growth';
import { ParkOperationsService, getParkOccupancy } from './park-operations.service';

type Tx = Prisma.TransactionClient;

const { goalIds } = PARK_LEVEL_SIX_GROWTH;
const goalReceiptId = (stage: ParkGrowthStage, id: string) =>
  isEarlyStage(stage)
    ? `park-${stage}-${id}`
    : `park-growth-${String(stage).padStart(2, '0')}-${id}`;
const routeIds = ['operations', 'exploration'] as const;
const routeReceiptId = (stage: ParkGrowthStage, id: ParkGrowthRouteId) =>
  `park-${stage}-route-${id}`;
const mediumMissions = ['dna1', 'dna2', 'culture', 'catalyst'] as const;

const stages = {
  5: {
    growth: PARK_LEVEL_SIX_GROWTH,
    research: ENTRANCE_RESEARCH,
    researchName: '입장 수속 Lv.1',
  },
  6: {
    growth: PARK_LEVEL_SEVEN_GROWTH,
    research: ENVIRONMENT_ADAPTATION_RESEARCH,
    researchName: '환경 적응 Lv.1',
  },
  7: {
    growth: PARK_LEVEL_EIGHT_GROWTH,
    research: FIELD_MAPPING_RESEARCH,
    researchName: '현장 지도화 Lv.1',
  },
} as const;

function parseStage(value: string | undefined): ParkGrowthStage {
  if (value === undefined || value === '5') return 5;
  if (value === '6') return 6;
  if (value === '7') return 7;
  const midgame = /^([89]|1[0-4])$/.test(value) && getParkMidgameGrowth(Number(value));
  if (midgame) return midgame.stage;
  throw new BadRequestException('파크 성장 단계는 5부터 14까지 선택할 수 있어요.');
}

function isEarlyStage(stage: ParkGrowthStage): stage is ParkEarlyGrowthStage {
  return stage === 5 || stage === 6 || stage === 7;
}

@Injectable()
export class ParkGrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly resources: ResourcesService,
  ) {}

  private async readEarly(tx: Tx, userId: string, now: Date, stage: ParkEarlyGrowthStage) {
    const { growth, research: researchPlan, researchName } = stages[stage];
    const { targetLevel } = growth;
    const { technologyId, level: technologyLevel, labLevel, costs, durationSeconds } = researchPlan;
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      select: {
        id: true,
        level: true,
        exp: true,
        gridSizeX: true,
        gridSizeY: true,
        isOpen: true,
        admissionCareCompleted: true,
        visitorDepartures: true,
        totalVisitors: true,
        firstSynthesis: { select: { claimedAt: true, exhibitedAt: true } },
        growthClaims: { select: { goalId: true, xp: true } },
        technologyResearch: {
          where: {
            OR: [{ technologyId, level: technologyLevel }, { completesAt: { gt: now } }],
          },
          select: { technologyId: true, level: true, completesAt: true },
        },
        buildings: true,
        dinosaurs: true,
      },
    });
    const labReady = park.buildings.some(
      (building) =>
        building.typeId === FIRST_HYBRID_LAB_ID &&
        growthFacilityHasCompletedLevel(building, labLevel),
    );
    const research = park.technologyResearch.find(
      ({ technologyId: id, level }) => id === technologyId && level === technologyLevel,
    );
    const researchDone = !!research && research.completesAt <= now;
    const unlocked = park.level >= growth.startsAtLevel && !!park.firstSynthesis?.claimedAt;
    const receipts = new Map(park.growthClaims.map(({ goalId, xp }) => [goalId, xp]));
    const stageReceiptIds = [
      ...goalIds.map((id) => goalReceiptId(stage, id)),
      ...routeIds.map((id) => routeReceiptId(stage, id)),
    ];
    const stageXpReceived = stageReceiptIds.reduce((sum, id) => sum + (receipts.get(id) ?? 0), 0);
    const remainingXp = Math.max(0, getParkLevelExperience(stage) - stageXpReceived);
    const stageComplete = park.level >= targetLevel;
    const goal = (
      id: ParkGrowthGoalId,
      progress: number,
      xp: number,
      target = 1,
    ): ParkGrowthGoal => ({
      id,
      xp,
      progress,
      target,
      status:
        receipts.has(goalReceiptId(stage, id)) || (stage > 5 && stageComplete)
          ? 'claimed'
          : !unlocked
            ? 'locked'
            : progress >= target
              ? 'claimable'
              : 'incomplete',
    });
    let goals: ParkGrowthGoal[] = [];
    if (stage === 5) {
      const { rewardXp, paidVisitorTarget } = PARK_LEVEL_SIX_GROWTH;
      const fieldCompleted =
        unlocked &&
        !!(await tx.driveRun.findFirst({
          where: {
            parkId: park.id,
            missionId: PARK_LEVEL_SIX_CATALYST_MISSION_ID,
            status: 'CLAIMED',
            claimedAt: { not: null },
          },
          select: { id: true },
        }));
      goals = [
        // The first synthesis required a completed lab, even if it was later removed.
        goal('facility', Number(labReady || !!park.firstSynthesis?.claimedAt), rewardXp),
        goal('research', Number(researchDone), rewardXp),
        goal('field', Number(fieldCompleted), rewardXp),
        goal(
          'operation',
          Math.min(paidVisitorTarget, park.totalVisitors),
          rewardXp,
          paidVisitorTarget,
        ),
      ];
    } else if (stage === 6) {
      goals = [
        goal(
          'research',
          Number(researchDone),
          receipts.get(goalReceiptId(stage, 'research')) ??
            Math.min(PARK_LEVEL_SEVEN_GROWTH.rewardXp.research, remainingXp),
        ),
      ];
    }

    let routes: ParkEarlyGrowthResponse['routes'];
    if (stage !== 5) {
      const claimedRoute = routeIds.find((id) => receipts.has(routeReceiptId(stage, id))) ?? null;
      const milestone = PARK_GROWTH_OPERATIONS_MILESTONES[stage];
      const snapshot = admissionSnapshot(park, now.getTime());
      const exhibits = snapshot.exhibits.size;
      const visitors = getParkOccupancy(park.visitorDepartures, now.getTime());
      const achieved =
        (snapshot.admittingVisitors &&
          exhibits >= milestone.exhibits &&
          visitors >= milestone.visitors) ||
        !!(await tx.storyFlag.findUnique({
          where: { userId_flagId: { userId, flagId: milestone.flagId } },
          select: { id: true },
        }));
      const commonReady = stage === 7 || receipts.has(goalReceiptId(stage, 'research'));
      const historyFilters: Prisma.DriveRunWhereInput[] = [];
      if (park.firstSynthesis?.exhibitedAt) {
        historyFilters.push({
          missionId: { in: [...mediumMissions] },
          createdAt: { gte: park.firstSynthesis.exhibitedAt },
        });
      }
      if (stage === 7) historyFilters.push({ missionId: PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID });
      const completedRows =
        unlocked && historyFilters.length
          ? await tx.driveRun.findMany({
              where: {
                parkId: park.id,
                status: 'CLAIMED',
                claimedAt: { not: null },
                OR: historyFilters,
              },
              distinct: ['missionId'],
              select: { missionId: true },
            })
          : [];
      const completed = new Set(completedRows.map(({ missionId }) => missionId));
      const trackedMissions: DriveMissionId[] = [
        ...mediumMissions,
        PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
      ];
      const completedMissions = trackedMissions.filter((missionId) => completed.has(missionId));
      const expeditionReady =
        completed.has('culture') &&
        (stage === 6
          ? completed.has('dna1') || completed.has('dna2')
          : researchDone &&
            completed.has('dna1') &&
            completed.has('dna2') &&
            completed.has('catalyst') &&
            completed.has(PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID));
      const status = (ready: boolean): ParkGrowthGoal['status'] => {
        if (stageComplete || claimedRoute) return 'claimed';
        if (!unlocked) return 'locked';
        return commonReady && ready ? 'claimable' : 'incomplete';
      };
      routes = {
        rewardXp:
          stageComplete || claimedRoute
            ? 0
            : Math.max(0, remainingXp - (commonReady ? 0 : goals[0].xp)),
        claimedRoute,
        operations: {
          status: status(achieved),
          achieved,
          exhibits,
          visitors,
          targetExhibits: milestone.exhibits,
          targetVisitors: milestone.visitors,
        },
        exploration: {
          status: status(expeditionReady),
          completedMissions,
          researchCompleted: researchDone,
        },
      };
    }
    const needsStageUnlock = stage > 5 && !unlocked;
    const researchStatus: ParkEarlyGrowthResponse['research']['status'] = research
      ? researchDone
        ? 'completed'
        : 'running'
      : labReady && !needsStageUnlock
        ? 'available'
        : 'locked';
    const blockedByResearch =
      researchStatus === 'available' &&
      park.technologyResearch.some(({ completesAt }) => completesAt > now);
    let unavailableReason: string | null = null;
    if (researchStatus === 'locked') {
      unavailableReason = needsStageUnlock
        ? `첫 스테고케라톱스를 수령하고 파크 Lv.${stage}에 도달하면 ${researchName}을 연구할 수 있어요.`
        : 'DNA 연구소 Lv.1을 완공하면 연구할 수 있어요.';
    } else if (blockedByResearch) {
      unavailableReason = '다른 연구를 마친 뒤에 시작할 수 있어요.';
    } else if (researchStatus === 'available') {
      const currency = await tx.currency.findUniqueOrThrow({
        where: { userId },
        select: { gold: true },
      });
      const materials = await tx.resourceInventory.findMany({
        where: { parkId: park.id, material: { in: ['wood', 'stone'] }, quality: 0 },
        select: { material: true, amount: true },
      });
      const stock = new Map(materials.map(({ material, amount }) => [material, amount]));
      if (currency.gold < costs.gold) unavailableReason = '연구에 필요한 골드가 부족해요.';
      else if ((stock.get('wood') ?? 0) < costs.wood) unavailableReason = '목재가 부족해요.';
      else if ((stock.get('stone') ?? 0) < costs.stone) unavailableReason = '석재가 부족해요.';
    }

    const state: ParkEarlyGrowthResponse = {
      stage,
      unlocked,
      level: park.level,
      exp: park.exp,
      expForNextLevel: getParkLevelExperience(park.level),
      targetLevel,
      goals,
      ...(routes ? { routes } : {}),
      research: {
        status: researchStatus,
        completesAt: research?.completesAt.toISOString() ?? null,
        costs,
        durationSeconds,
        entranceBonusPercent: stage === 5 ? ENTRANCE_RESEARCH.bonusPercent : 0,
        ...(stage === 6
          ? { careDecayReductionPercent: ENVIRONMENT_ADAPTATION_RESEARCH.careDecayReductionPercent }
          : {}),
        ...(blockedByResearch ? { blockedByResearch } : {}),
        unavailableReason,
      },
    };
    return { park, state };
  }

  private read(tx: Tx, userId: string, now: Date, stage: ParkGrowthStage) {
    if (isEarlyStage(stage)) return this.readEarly(tx, userId, now, stage);
    const definition = getParkMidgameGrowth(stage);
    if (!definition) throw new NotFoundException('성장 단계를 찾을 수 없어요.');
    return readParkMidgameGrowth(tx, userId, now, definition, (id) => goalReceiptId(stage, id));
  }

  getState(userId: string, value?: `${ParkEarlyGrowthStage}`): Promise<ParkEarlyGrowthResponse>;
  getState(userId: string, value?: string): Promise<ParkGrowthResponse>;
  async getState(userId: string, value?: string): Promise<ParkGrowthResponse> {
    const stage = parseStage(value);
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      return (await this.read(tx, userId, new Date(), stage)).state;
    });
  }

  claim(
    userId: string,
    goalId: string,
    value?: `${ParkEarlyGrowthStage}`,
  ): Promise<ParkEarlyGrowthResponse>;
  claim(userId: string, goalId: string, value?: string): Promise<ParkGrowthResponse>;
  async claim(userId: string, goalId: string, value?: string): Promise<ParkGrowthResponse> {
    const stage = parseStage(value);
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      const { park, state } = await this.read(tx, userId, now, stage);
      const goal = state.goals.find(({ id }) => id === goalId);
      if (!goal) {
        if (
          goalIds.some((id) => id === goalId) &&
          park.growthClaims.some(({ goalId: id }) => id === goalReceiptId(stage, goalId))
        )
          return state;
        throw new NotFoundException('성장 목표를 찾을 수 없어요.');
      }
      if (goal.status === 'claimed') return state;
      if (goal.status === 'locked')
        throw new BadRequestException(
          `첫 스테고케라톱스를 수령하고 파크 Lv.${stage}에 도달해주세요.`,
        );
      if (goal.status !== 'claimable')
        throw new BadRequestException('성장 목표를 먼저 달성해주세요.');

      await this.writeClaim(tx, park, goalReceiptId(stage, goal.id), goal.xp);
      return (await this.read(tx, userId, now, stage)).state;
    });
  }

  async claimRoute(userId: string, value: string, rawStage?: string) {
    const stage = parseStage(rawStage);
    const routeId = routeIds.find((id) => id === value);
    if ((stage !== 6 && stage !== 7) || !routeId)
      throw new NotFoundException('성장 경로를 찾을 수 없어요.');
    return this.prisma.$transaction(async (tx) => {
      // Settlement holds the park row lock until the receipt and experience are committed.
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      const { park, state } = await this.readEarly(tx, userId, now, stage);
      const routes = state.routes!;
      const route = routes[routeId];
      if (route.status === 'claimed') return state;
      if (route.status === 'locked') {
        throw new BadRequestException(
          `첫 스테고케라톱스를 수령하고 파크 Lv.${stage}에 도달해주세요.`,
        );
      }
      if (state.goals.some((goal) => goal.id === 'research' && goal.status !== 'claimed')) {
        throw new BadRequestException('환경 적응 연구 보상을 먼저 받아주세요.');
      }
      if (route.status !== 'claimable')
        throw new BadRequestException('성장 경로의 목표를 먼저 달성해주세요.');
      await this.writeClaim(tx, park, routeReceiptId(stage, routeId), routes.rewardXp);
      return (await this.readEarly(tx, userId, now, stage)).state;
    });
  }

  private async writeClaim(
    tx: Tx,
    park: { id: string; level: number; exp: number },
    goalId: string,
    xp: number,
  ) {
    const claim = await tx.parkGrowthClaim.createMany({
      data: { parkId: park.id, goalId, xp },
      skipDuplicates: true,
    });
    if (!claim.count || park.level >= MAX_PARK_LEVEL) return;
    let level = park.level;
    let exp = park.exp + xp;
    while (level < MAX_PARK_LEVEL && exp >= getParkLevelExperience(level)) {
      exp -= getParkLevelExperience(level);
      level++;
    }
    await tx.park.update({
      where: { id: park.id },
      data: { level, exp: level === MAX_PARK_LEVEL ? 0 : exp },
    });
  }

  async startResearch(userId: string, value?: string) {
    const stage = parseStage(value);
    if (!isEarlyStage(stage))
      throw new BadRequestException('DNA 연구소의 기술 연구에서 시작해주세요.');
    const { research: researchPlan, researchName } = stages[stage];
    const { technologyId, level: technologyLevel, costs, durationSeconds } = researchPlan;
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      const { park, state } = await this.readEarly(tx, userId, now, stage);
      if (state.research.status === 'running' || state.research.status === 'completed')
        return state;
      if (state.research.unavailableReason)
        throw new BadRequestException(state.research.unavailableReason);

      await this.resources.consumeMaterials(tx, park.id, { wood: costs.wood, stone: costs.stone });
      await this.resources.spendGold(tx, userId, costs.gold, `기술 연구: ${researchName}`);
      await tx.parkTechnologyResearch.create({
        data: {
          parkId: park.id,
          technologyId,
          level: technologyLevel,
          startedAt: now,
          completesAt: new Date(now.getTime() + durationSeconds * 1000),
        },
      });
      return (await this.readEarly(tx, userId, now, stage)).state;
    });
  }
}
