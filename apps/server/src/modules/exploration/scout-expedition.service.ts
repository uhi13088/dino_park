import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  getScoutFuelCost,
  getScoutMission,
  getScoutSpot,
  SCOUT_MISSIONS,
} from '@dino-park/game-data';
import {
  scoutTravelSeconds,
  type DispatchScoutRequest,
  type ScoutExpeditionState,
  type ScoutReport,
  type ScoutReward,
} from '@dino-park/shared';
import type { Prisma, ScoutAssignment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';
import { getExpeditionEnergy } from './expedition-state';
import { scoutAbilities, scoutMissionBlock, scoutRewardForDispatch } from './scout-mission.rules';
import { grantScoutExpeditionReward } from './scout-reward';
import {
  loadScoutWorld,
  restoreLegacyHatchingExperience,
  scoutClock,
  type ScoutWorld,
} from './scout-world';

const HIRE_COSTS = [0, 500, 1000, 2000];

function hireBlock(world: ScoutWorld) {
  const cost = HIRE_COSTS[world.park.scouts.length];
  if (cost === undefined) return '탐험가는 최대 4명까지 고용할 수 있어요.';
  if (cost === 0 && !world.platformReady) return '첫 관람대를 먼저 완공하세요.';
  if (world.currency.diamond < cost) return '다이아가 부족해요.';
  return undefined;
}

function scoutReport(assignment: ScoutAssignment): ScoutReport {
  return {
    id: assignment.id,
    spotId: assignment.spotId,
    missionId: assignment.missionId,
    readyAt: assignment.completesAt.toISOString(),
    reward: assignment.reward as ScoutReward,
  };
}

function response(world: ScoutWorld, now: Date): ScoutExpeditionState {
  const scouts = world.park.scouts.map(({ id, slot, experience }) => {
    const assignment = world.assignments.find(({ scoutId }) => scoutId === id);
    return {
      id,
      name: `탐험가 ${slot}`,
      experience,
      ...scoutAbilities(experience),
      assignment: assignment ? scoutReport(assignment) : null,
    };
  });
  const responseLevel = Math.max(1, ...scouts.map((scout) => scout.responseLevel));
  const missions = Object.fromEntries(
    SCOUT_MISSIONS.map((mission) => [
      mission.id,
      scoutMissionBlock(world, mission, responseLevel) ?? {},
    ]),
  );
  const hireBlockedReason = hireBlock(world);
  const fuel = getExpeditionEnergy(world.currency, now);
  return {
    serverNow: now.toISOString(),
    gold: world.currency.gold,
    fuel: fuel.value,
    fuelMax: fuel.capacity,
    diamond: world.currency.diamond,
    scouts,
    hireDiamondCost: HIRE_COSTS[scouts.length] ?? null,
    ...(hireBlockedReason ? { hireBlockedReason } : {}),
    missions,
    ...(world.lastReport ? { lastReport: scoutReport(world.lastReport) } : {}),
  };
}

@Injectable()
export class ScoutExpeditionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  private async inPark<T>(
    userId: string,
    perform: (tx: Prisma.TransactionClient, world: ScoutWorld, now: Date) => Promise<T>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const now = await scoutClock(tx);
      return perform(tx, await loadScoutWorld(tx, userId, now), now);
    });
  }

  getState(userId: string) {
    return this.inPark(userId, async (tx, world, now) => {
      await restoreLegacyHatchingExperience(tx, userId, world, now);
      return response(world, now);
    });
  }

  hire(userId: string, slot: number) {
    return this.inPark(userId, async (tx, world, now) => {
      if (world.park.scouts.some((scout) => scout.slot === slot)) return response(world, now);
      const reason = hireBlock(world);
      if (reason) throw new BadRequestException(reason);
      const index = world.park.scouts.length;
      if (slot !== index + 1)
        throw new BadRequestException('다음 탐험가부터 순서대로 고용해주세요.');
      const cost = HIRE_COSTS[index];
      if (cost > 0) {
        const currency = await tx.currency.update({
          where: { userId },
          data: { diamond: { decrement: cost } },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: 'SPEND',
            currencyType: 'diamond',
            amount: -cost,
            reason: '탐험가 고용',
            balanceAfter: currency.diamond,
          },
        });
      }
      await tx.scout.create({ data: { parkId: world.park.id, slot, hiredAt: now } });
      return response(await loadScoutWorld(tx, userId, now), now);
    });
  }

  dispatch(userId: string, { scoutId, spotId, missionId }: DispatchScoutRequest) {
    const mission = getScoutMission(missionId);
    if (!mission || !getScoutSpot(spotId)?.missionIds.includes(missionId))
      throw new NotFoundException('이 장소에서 찾을 수 있는 조사 목표가 아니에요.');

    return this.inPark(userId, async (tx, world, now) => {
      const scout = world.park.scouts.find(({ id }) => id === scoutId);
      if (!scout) throw new NotFoundException('고용한 탐험가를 찾을 수 없어요.');
      const active = world.assignments.find((assignment) => assignment.scoutId === scoutId);
      if (active) {
        if (active.spotId === spotId && active.missionId === missionId) return response(world, now);
        throw new BadRequestException('이 탐험가의 보고서를 먼저 수령해주세요.');
      }
      const abilities = scoutAbilities(scout.experience);
      const reason = scoutMissionBlock(world, mission, abilities.responseLevel);
      if (reason?.blockedReason) throw new BadRequestException(reason.blockedReason);
      if (world.currency.gold < mission.gold)
        throw new BadRequestException('탐험 준비비가 부족해요.');
      const fuelCost = getScoutFuelCost(spotId, missionId);
      const fuel = fuelCost > 0 ? getExpeditionEnergy(world.currency, now) : null;
      if (fuel && fuel.value < fuelCost) throw new BadRequestException('탐험 연료가 부족해요.');
      if (fuel || mission.gold > 0) {
        const currency = await tx.currency.update({
          where: { userId },
          data: {
            gold: { decrement: mission.gold },
            ...(fuel && {
              explorationEnergy: fuel.value - fuelCost,
              energyLastRechargedAt: fuel.last,
            }),
          },
        });
        if (mission.gold > 0) {
          await tx.transaction.create({
            data: {
              userId,
              type: 'SPEND',
              currencyType: 'gold',
              amount: -mission.gold,
              reason: `${mission.title} 준비`,
              balanceAfter: currency.gold,
            },
          });
        }
      }
      const seconds = scoutTravelSeconds(mission.seconds, abilities.mobilityLevel);
      await tx.scoutAssignment.create({
        data: {
          scoutId,
          activeSlot: scoutId,
          spotId,
          missionId,
          legacyMissionId: mission.legacyMissionId,
          reward: scoutRewardForDispatch(world, mission, abilities.searchLevel),
          startedAt: now,
          completesAt: new Date(now.getTime() + seconds * 1000),
        },
      });
      return response(await loadScoutWorld(tx, userId, now), now);
    });
  }

  claim(userId: string, id: string) {
    return this.inPark(userId, async (tx, world, now) => {
      const assignment = await tx.scoutAssignment.findFirst({
        where: { id, scout: { parkId: world.park.id } },
      });
      if (!assignment) throw new NotFoundException('탐험 보고서를 찾을 수 없어요.');
      const lastReport = scoutReport(assignment);
      if (assignment.claimedAt) return { ...response(world, now), lastReport };
      if (assignment.completesAt > now)
        throw new BadRequestException('탐험가가 아직 조사 중이에요.');

      const taken = await tx.scoutAssignment.updateMany({
        where: { id, claimedAt: null },
        data: { claimedAt: now, activeSlot: null },
      });
      if (!taken.count)
        return { ...response(await loadScoutWorld(tx, userId, now), now), lastReport };
      await grantScoutExpeditionReward(
        tx,
        userId,
        world.park.id,
        assignment,
        assignment.reward as ScoutReward,
        now,
      );
      await tx.scout.update({
        where: { id: assignment.scoutId },
        data: { experience: { increment: 1 } },
      });
      return { ...response(await loadScoutWorld(tx, userId, now), now), lastReport };
    });
  }
}
