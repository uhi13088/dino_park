import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ENTRANCE_RESEARCH, PARK_LEVEL_SIX_GROWTH } from '@dino-park/game-data';
import {
  FIRST_HYBRID_LAB_ID,
  MAX_PARK_LEVEL,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  getParkLevelExperience,
  type ParkGrowthGoalId,
  type ParkGrowthResponse,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { ParkOperationsService } from './park-operations.service';

type Tx = Prisma.TransactionClient;

const { startsAtLevel, targetLevel, rewardXp, paidVisitorTarget, goalIds } = PARK_LEVEL_SIX_GROWTH;
const { technologyId, level: technologyLevel, costs, durationSeconds } = ENTRANCE_RESEARCH;
const goalReceiptId = (id: ParkGrowthGoalId) => `park-${startsAtLevel}-${id}`;

@Injectable()
export class ParkGrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly resources: ResourcesService,
  ) {}

  private async read(tx: Tx, userId: string, now: Date) {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      select: {
        id: true,
        level: true,
        exp: true,
        totalVisitors: true,
        firstSynthesis: { select: { claimedAt: true } },
        growthClaims: { select: { goalId: true } },
        technologyResearch: {
          where: { technologyId, level: technologyLevel },
          select: { completesAt: true },
        },
        buildings: {
          where: { typeId: FIRST_HYBRID_LAB_ID, level: { gte: ENTRANCE_RESEARCH.labLevel } },
          select: { status: true, level: true },
        },
      },
    });
    const labReady = park.buildings.some(
      ({ status, level }) =>
        status === 'ACTIVE' || (status === 'UPGRADING' && level > ENTRANCE_RESEARCH.labLevel),
    );
    const research = park.technologyResearch[0];
    const researchDone = !!research && research.completesAt <= now;
    const unlocked = park.level >= startsAtLevel && !!park.firstSynthesis?.claimedAt;
    const progress: Record<ParkGrowthGoalId, number> = {
      // The first synthesis could only start in a completed laboratory. The receipt
      // also recognizes that earlier completion if the original building was removed.
      facility: Number(labReady || !!park.firstSynthesis?.claimedAt),
      research: Number(researchDone),
      field: unlocked
        ? Number(
            !!(await tx.driveRun.findFirst({
              where: {
                parkId: park.id,
                missionId: PARK_LEVEL_SIX_CATALYST_MISSION_ID,
                status: 'CLAIMED',
                claimedAt: { not: null },
              },
              select: { id: true },
            })),
          )
        : 0,
      operation: Math.min(paidVisitorTarget, park.totalVisitors),
    };
    const receipts = new Set(park.growthClaims.map(({ goalId }) => goalId));
    const researchStatus: ParkGrowthResponse['research']['status'] = research
      ? researchDone
        ? 'completed'
        : 'running'
      : labReady
        ? 'available'
        : 'locked';
    let unavailableReason: string | null = null;
    if (researchStatus === 'locked')
      unavailableReason = 'DNA 연구소 Lv.1을 완공하면 연구할 수 있어요.';
    if (researchStatus === 'available') {
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

    const state: ParkGrowthResponse = {
      unlocked,
      level: park.level,
      exp: park.exp,
      expForNextLevel: getParkLevelExperience(park.level),
      targetLevel,
      goals: goalIds.map((id) => {
        const target = id === 'operation' ? paidVisitorTarget : 1;
        return {
          id,
          xp: rewardXp,
          progress: progress[id],
          target,
          status: receipts.has(goalReceiptId(id))
            ? 'claimed'
            : !unlocked
              ? 'locked'
              : progress[id] >= target
                ? 'claimable'
                : 'incomplete',
        };
      }),
      research: {
        status: researchStatus,
        completesAt: research?.completesAt.toISOString() ?? null,
        costs,
        durationSeconds,
        entranceBonusPercent: ENTRANCE_RESEARCH.bonusPercent,
        unavailableReason,
      },
    };
    return { park, state };
  }

  async getState(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      return (await this.read(tx, userId, new Date())).state;
    });
  }

  async claim(userId: string, goalId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      const { park, state } = await this.read(tx, userId, now);
      const goal = state.goals.find(({ id }) => id === goalId);
      if (!goal) throw new NotFoundException('성장 목표를 찾을 수 없어요.');
      if (goal.status === 'claimed') return state;
      if (goal.status === 'locked')
        throw new BadRequestException('첫 스테고케라톱스를 수령하고 파크 Lv.5에 도달해주세요.');
      if (goal.status !== 'claimable')
        throw new BadRequestException('성장 목표를 먼저 달성해주세요.');

      const claim = await tx.parkGrowthClaim.createMany({
        data: { parkId: park.id, goalId: goalReceiptId(goal.id), xp: goal.xp },
        skipDuplicates: true,
      });
      if (claim.count && park.level < MAX_PARK_LEVEL) {
        let level = park.level;
        let exp = park.exp + goal.xp;
        while (level < MAX_PARK_LEVEL && exp >= getParkLevelExperience(level)) {
          exp -= getParkLevelExperience(level);
          level++;
        }
        await tx.park.update({
          where: { id: park.id },
          data: { level, exp: level === MAX_PARK_LEVEL ? 0 : exp },
        });
      }
      return (await this.read(tx, userId, now)).state;
    });
  }

  async startResearch(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = new Date();
      const { park, state } = await this.read(tx, userId, now);
      if (state.research.status === 'running' || state.research.status === 'completed')
        return state;
      if (state.research.unavailableReason)
        throw new BadRequestException(state.research.unavailableReason);

      await this.resources.consumeMaterials(tx, park.id, { wood: costs.wood, stone: costs.stone });
      await this.resources.spendGold(tx, userId, costs.gold, '기술 연구: 입장 수속 Lv.1');
      await tx.parkTechnologyResearch.create({
        data: {
          parkId: park.id,
          technologyId,
          level: technologyLevel,
          startedAt: now,
          completesAt: new Date(now.getTime() + durationSeconds * 1000),
        },
      });
      return (await this.read(tx, userId, now)).state;
    });
  }
}
