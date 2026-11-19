import { PARK_LEVEL_SIX_CATALYST_MISSION_ID } from '@dino-park/shared';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ResourcesService } from '../resources/resources.service';
import { ParkGrowthService } from './park-growth.service';
import type { ParkOperationsService } from './park-operations.service';

const TIME = Date.parse('2026-11-19T06:00:00Z');

function setup() {
  const park = {
    id: 'park',
    level: 5,
    exp: 35,
    totalVisitors: 100,
    firstSynthesis: { claimedAt: new Date(TIME) as Date | null },
    growthClaims: [] as { goalId: string; xp: number }[],
    technologyResearch: [] as { completesAt: Date }[],
    buildings: [{ status: 'ACTIVE', level: 1 }],
  };
  const tx = {
    park: {
      findUniqueOrThrow: jest.fn(async () => park),
      update: jest.fn(async ({ data }) => Object.assign(park, data)),
    },
    parkGrowthClaim: {
      createMany: jest.fn(async ({ data }) => {
        park.growthClaims.push(data);
        return { count: 1 };
      }),
    },
    parkTechnologyResearch: {
      create: jest.fn(async ({ data }) => park.technologyResearch.push(data)),
    },
    driveRun: {
      findFirst: jest.fn(async () => ({ id: 'successful-drive' }) as { id: string } | null),
    },
    currency: { findUniqueOrThrow: jest.fn(async () => ({ gold: 500 })) },
    resourceInventory: {
      findMany: jest.fn(async () => [
        { material: 'wood', amount: 5 },
        { material: 'stone', amount: 5 },
      ]),
    },
  };
  const prisma = { $transaction: jest.fn(async (run) => run(tx)) };
  const operations = { settleInTransaction: jest.fn() };
  const resources = { consumeMaterials: jest.fn(), spendGold: jest.fn() };
  const service = new ParkGrowthService(
    prisma as unknown as PrismaService,
    operations as unknown as ParkOperationsService,
    resources as unknown as ResourcesService,
  );
  return { park, tx, service, operations, resources };
}

describe('first park growth milestone', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(TIME));
  afterEach(() => jest.useRealTimers());

  it('locks XP until the hero has been claimed and retains actual historical evidence', async () => {
    const { park, service, tx } = setup();
    park.firstSynthesis.claimedAt = null;
    expect((await service.getState('user')).goals.every((goal) => goal.status === 'locked')).toBe(
      true,
    );
    await expect(service.claim('user', 'facility')).rejects.toThrow('첫 스테고케라톱스');
    expect(tx.parkGrowthClaim.createMany).not.toHaveBeenCalled();

    park.firstSynthesis.claimedAt = new Date(TIME);
    park.buildings = [];
    const state = await service.getState('user');
    expect(state.goals.find(({ id }) => id === 'facility')).toMatchObject({ status: 'claimable' });
    expect(state.goals.find(({ id }) => id === 'operation')).toMatchObject({ progress: 100 });
  });

  it('grants the four one-time rewards in any order without changing border or grid data', async () => {
    const { park, service, tx } = setup();
    park.technologyResearch = [{ completesAt: new Date(TIME) }];
    const progress = await service.claim('user', 'field');
    expect(progress).toMatchObject({ level: 5, exp: 932, expForNextLevel: 3623 });
    expect(await service.claim('user', 'field')).toEqual(progress);
    await service.claim('user', 'operation');
    await service.claim('user', 'facility');
    const completed = await service.claim('user', 'research');
    expect(completed).toMatchObject({ level: 6, exp: 0, targetLevel: 6 });
    expect(completed.goals.map(({ status }) => status)).toEqual(Array(4).fill('claimed'));
    expect(park.growthClaims.map(({ xp }) => xp)).toEqual(Array(4).fill(897));
    expect(tx.park.update).toHaveBeenLastCalledWith({
      where: { id: 'park' },
      data: { level: 6, exp: 0 },
    });
    expect(tx.parkGrowthClaim.createMany).toHaveBeenCalledTimes(4);
    expect(tx.driveRun.findFirst).toHaveBeenCalledWith({
      where: {
        parkId: 'park',
        missionId: PARK_LEVEL_SIX_CATALYST_MISSION_ID,
        status: 'CLAIMED',
        claimedAt: { not: null },
      },
      select: { id: true },
    });
  });

  it('holds XP for research or a drive that is not yet complete, and starts a single timed research job', async () => {
    const { park, service, resources, tx } = setup();
    tx.driveRun.findFirst.mockResolvedValue(null);
    await expect(service.claim('user', 'field')).rejects.toThrow('성장 목표를 먼저');
    const now = await service.startResearch('user');
    expect(now.research).toMatchObject({
      status: 'running',
      completesAt: new Date(TIME + 60_000).toISOString(),
      costs: { gold: 500, wood: 5, stone: 5 },
      entranceBonusPercent: 4,
    });
    await expect(service.claim('user', 'research')).rejects.toThrow('성장 목표를 먼저');
    expect(await service.startResearch('user')).toEqual(now);
    expect(resources.consumeMaterials).toHaveBeenCalledTimes(1);
    expect(resources.spendGold).toHaveBeenCalledWith(tx, 'user', 500, '기술 연구: 입장 수속 Lv.1');
    jest.setSystemTime(TIME + 60_000);
    expect((await service.getState('user')).research.status).toBe('completed');
    await service.claim('user', 'research');
    expect(park.exp).toBe(932);
  });
});
