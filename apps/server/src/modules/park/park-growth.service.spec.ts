import {
  getScoutMission,
  PARK_GROWTH_OPERATIONS_MILESTONES,
  PARK_MIDGAME_GROWTH,
} from '@dino-park/game-data';
import {
  FIRST_HYBRID_LAB_ID,
  getParkLevelExperience,
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  type ScoutReward,
  MaterialQuality,
} from '@dino-park/shared';
import { BuildingStatus, type Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ResourcesService } from '../resources/resources.service';
import { ParkGrowthService } from './park-growth.service';
import type { ParkOperationsService } from './park-operations.service';
import { building, dinosaur, world } from './park-admission.fixtures';
import { retainDemolishedGrowthFacility } from './park-midgame-growth';

const TIME = Date.parse('2026-11-19T06:00:00Z');

function recordResearch(
  park: ReturnType<typeof setup>['park'],
  technologyId: string,
  level: number,
) {
  park.technologyResearch.push({ technologyId, level, completesAt: new Date(TIME) });
}

function setup() {
  const park = {
    ...world(),
    id: 'park',
    level: 5,
    exp: 35,
    totalVisitors: 100,
    firstSynthesis: {
      claimedAt: new Date(TIME - 1000) as Date | null,
      exhibitedAt: new Date(TIME - 500) as Date | null,
    },
    visitorDepartures: [] as number[],
    growthClaims: [] as { goalId: string; xp: number }[],
    technologyResearch: [] as { technologyId: string; level: number; completesAt: Date }[],
    dinosaurCollections: [] as { speciesId: string }[],
  };
  park.buildings.push(building('lab', FIRST_HYBRID_LAB_ID, 4, 10));
  const missions: { missionId: string; createdAt: Date; claimedAt: Date | null; status: string }[] =
    [];
  const completeMission = (missionId: string, createdAt = TIME) =>
    missions.push({
      missionId,
      createdAt: new Date(createdAt),
      claimedAt: new Date(TIME),
      status: 'CLAIMED',
    });
  const facilityHistory: { flagId: string }[] = [];
  const assignments: { missionId: string; reward: ScoutReward; claimedAt: Date | null }[] = [];
  const tx = {
    park: {
      findUniqueOrThrow: jest.fn(async () => park),
      update: jest.fn(async ({ data }) => Object.assign(park, data)),
    },
    parkGrowthClaim: {
      createMany: jest.fn(async ({ data }) => {
        if (park.growthClaims.some(({ goalId }) => goalId === data.goalId)) return { count: 0 };
        park.growthClaims.push(data);
        return { count: 1 };
      }),
    },
    parkTechnologyResearch: {
      create: jest.fn(async ({ data }) => park.technologyResearch.push(data)),
    },
    storyFlag: {
      findUnique: jest.fn(async () => null as { id: string } | null),
      findMany: jest.fn(async () => facilityHistory),
      createMany: jest.fn(async ({ data }) => {
        facilityHistory.push(...data);
        return { count: data.length };
      }),
    },
    scoutAssignment: {
      findMany: jest.fn(async ({ where }) =>
        assignments.filter(
          ({ claimedAt, missionId }) =>
            claimedAt && claimedAt <= where.claimedAt.lte && where.missionId.in.includes(missionId),
        ),
      ),
    },
    driveRun: {
      findFirst: jest.fn(async () => ({ id: 'successful-drive' }) as { id: string } | null),
      findMany: jest.fn(async ({ where }) =>
        missions.filter(
          (mission) =>
            mission.status === where.status &&
            mission.claimedAt &&
            where.OR.some(
              (item: { missionId: string | { in: string[] }; createdAt?: { gte: Date } }) =>
                typeof item.missionId === 'string'
                  ? item.missionId === mission.missionId
                  : item.missionId.in.includes(mission.missionId) &&
                    mission.createdAt >= item.createdAt!.gte,
            ),
        ),
      ),
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
  return { park, tx, service, operations, resources, missions, completeMission, assignments };
}

function addExhibits(park: ReturnType<typeof setup>['park'], extra: 2 | 3) {
  park.buildings.push(
    building('hybrid', 'habitat-hybrid-zone', 13, 5),
    building('second-grass', 'habitat-grassland', 5, 4),
  );
  park.dinosaurs.push(
    { ...dinosaur('hybrid-dinosaur', 'stegoceratops'), positionX: 13, positionY: 5 },
    { ...dinosaur('trike', 'triceratops'), positionX: 6, positionY: 5 },
  );
  if (extra === 3) {
    park.buildings.push(building('third-grass', 'habitat-grassland', 13, 10));
    park.dinosaurs.push({ ...dinosaur('igua', 'iguanodon'), positionX: 14, positionY: 11 });
  }
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
    park.technologyResearch = [
      { technologyId: 'ops-entry', level: 1, completesAt: new Date(TIME) },
    ];
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

describe('operations and exploration advancement', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(TIME));
  afterEach(() => jest.useRealTimers());

  it('locks an unearned stage and reports only what may be claimed on that stage', async () => {
    const { service, tx, resources } = setup();
    const state = await service.getState('user', '6');
    expect(state).toMatchObject({ stage: 6, unlocked: false, targetLevel: 7 });
    expect(state.goals).toEqual([
      { id: 'research', progress: 0, target: 1, status: 'locked', xp: 1257 },
    ]);
    expect(state.routes).toMatchObject({
      rewardXp: 3774,
      operations: { status: 'locked', targetExhibits: 3, targetVisitors: 50 },
      exploration: { status: 'locked', completedMissions: [] },
    });
    await expect(service.claimRoute('user', 'operations', '6')).rejects.toThrow('파크 Lv.6');
    await expect(service.startResearch('user', '6')).rejects.toThrow('파크 Lv.6');
    await expect(service.claimRoute('user', 'operations')).rejects.toThrow('성장 경로');
    await expect(service.claimRoute('user', 'invalid', '6')).rejects.toThrow('성장 경로');
    await expect(service.getState('user', '15')).rejects.toThrow(/5부터 14/);
    expect(tx.parkGrowthClaim.createMany).not.toHaveBeenCalled();
    expect(resources.spendGold).not.toHaveBeenCalled();
  });

  it('qualifies with actual open exhibits and attendance only after the shared research receipt', async () => {
    const { park, service, tx } = setup();
    park.level = 6;
    park.exp = 0;
    park.totalVisitors = 900;
    addExhibits(park, 2);
    park.visitorDepartures = Array(49).fill(TIME + 60_000);
    park.technologyResearch.push({
      technologyId: 'care-adaptation',
      level: 1,
      completesAt: new Date(TIME),
    });
    expect((await service.getState('user', '6')).routes?.operations).toMatchObject({
      exhibits: 3,
      visitors: 49,
      achieved: false,
      status: 'incomplete',
    });
    park.visitorDepartures.push(TIME + 60_000);
    expect((await service.getState('user', '6')).routes?.operations).toMatchObject({
      exhibits: 3,
      visitors: 50,
      achieved: true,
      status: 'incomplete',
    });
    await expect(service.claimRoute('user', 'operations', '6')).rejects.toThrow('환경 적응');
    await service.claim('user', 'research', '6');
    park.isOpen = false;
    expect((await service.getState('user', '6')).routes?.operations).toMatchObject({
      achieved: false,
      status: 'incomplete',
    });
    park.isOpen = true;
    const completed = await service.claimRoute('user', 'operations', '6');
    expect(completed).toMatchObject({
      stage: 6,
      level: 7,
      exp: 0,
      routes: {
        rewardXp: 0,
        claimedRoute: 'operations',
        operations: { status: 'claimed' },
        exploration: { status: 'claimed' },
      },
    });
    expect(await service.claimRoute('user', 'exploration', '6')).toEqual(completed);
    expect(park.growthClaims).toEqual([
      { parkId: 'park', goalId: 'park-6-research', xp: 1257 },
      { parkId: 'park', goalId: 'park-6-route-operations', xp: 3774 },
    ]);
    expect(tx.parkGrowthClaim.createMany).toHaveBeenCalledTimes(2);
  });

  it('uses post-exhibition claimed medium missions and pays the remaining legacy budget only', async () => {
    const { park, service, completeMission, missions, tx } = setup();
    park.level = 6;
    park.exp = 2514;
    park.growthClaims.push(
      { goalId: 'park-6-facility', xp: 1257 },
      { goalId: 'park-6-research', xp: 1257 },
      { goalId: 'park-5-field', xp: 897 },
    );
    completeMission('dna1', TIME - 1000);
    completeMission('culture', TIME - 1000);
    missions.push({
      missionId: 'dna2',
      createdAt: new Date(TIME),
      claimedAt: null,
      status: 'REWARD',
    });
    expect((await service.getState('user', '6')).routes?.exploration).toMatchObject({
      status: 'incomplete',
      completedMissions: [],
    });
    completeMission('dna2');
    completeMission('culture');
    const ready = await service.getState('user', '6');
    expect(ready.routes).toMatchObject({
      rewardXp: 2517,
      operations: { status: 'incomplete' },
      exploration: { status: 'claimable', completedMissions: ['dna2', 'culture'] },
    });
    expect(ready.goals[0]).toMatchObject({ status: 'claimed', xp: 1257 });
    expect(await service.claim('user', 'facility', '6')).toEqual(ready);
    expect(tx.parkGrowthClaim.createMany).not.toHaveBeenCalled();
    const completed = await service.claimRoute('user', 'exploration', '6');
    expect(completed).toMatchObject({ level: 7, exp: 0, routes: { claimedRoute: 'exploration' } });
    expect(park.growthClaims.at(-1)).toMatchObject({
      goalId: 'park-6-route-exploration',
      xp: 2517,
    });
  });

  it('awards 6,640 XP using persistent operations evidence without a security-center upgrade', async () => {
    const { park, service, tx } = setup();
    park.level = 7;
    park.exp = 0;
    park.totalVisitors = 900;
    addExhibits(park, 3);
    park.visitorDepartures = Array(69).fill(TIME + 60_000);
    expect((await service.getState('user', '7')).routes?.operations).toMatchObject({
      exhibits: 4,
      visitors: 69,
      achieved: false,
      status: 'incomplete',
    });
    park.visitorDepartures = [];
    park.isOpen = false;
    tx.storyFlag.findUnique.mockResolvedValue({ id: 'qualified-while-open' });
    const ready = await service.getState('user', '7');
    expect(ready).toMatchObject({
      stage: 7,
      targetLevel: 8,
      goals: [],
      routes: {
        rewardXp: 6640,
        operations: {
          exhibits: 4,
          visitors: 0,
          targetVisitors: 70,
          achieved: true,
          status: 'claimable',
        },
      },
    });
    expect(tx.storyFlag.findUnique).toHaveBeenLastCalledWith({
      where: {
        userId_flagId: { userId: 'user', flagId: PARK_GROWTH_OPERATIONS_MILESTONES[7].flagId },
      },
      select: { id: true },
    });
    const completed = await service.claimRoute('user', 'operations', '7');
    expect(completed).toMatchObject({ level: 8, exp: 0, routes: { claimedRoute: 'operations' } });
    expect(park.growthClaims).toEqual([
      { parkId: 'park', goalId: 'park-7-route-operations', xp: 6640 },
    ]);
  });

  it('requires field mapping, a claimed resurvey and the full medium set before expedition advances to Lv.8', async () => {
    const { park, service, completeMission } = setup();
    park.level = 7;
    park.exp = 1660;
    park.growthClaims.push({ goalId: 'park-7-field', xp: 1660 });
    for (const missionId of ['dna1', 'dna2', 'culture', 'catalyst']) completeMission(missionId);
    expect((await service.getState('user', '7')).routes?.exploration.status).toBe('incomplete');
    park.technologyResearch.push({
      technologyId: 'exp-field-mapping',
      level: 1,
      completesAt: new Date(TIME + 60_000),
    });
    completeMission(PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID);
    expect((await service.getState('user', '7')).routes?.exploration).toMatchObject({
      status: 'incomplete',
      researchCompleted: false,
    });
    jest.setSystemTime(TIME + 60_000);
    const ready = await service.getState('user', '7');
    expect(ready.routes).toMatchObject({
      rewardXp: 4980,
      exploration: {
        status: 'claimable',
        researchCompleted: true,
        completedMissions: [
          'dna1',
          'dna2',
          'culture',
          'catalyst',
          PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
        ],
      },
    });
    expect(await service.claimRoute('user', 'exploration', '7')).toMatchObject({
      level: 8,
      exp: 0,
      routes: { claimedRoute: 'exploration' },
    });
    expect(park.growthClaims.at(-1)?.xp).toBe(4980);
  });

  it('returns completed old stages without retroactive route XP', async () => {
    const { park, service, tx } = setup();
    park.level = 8;
    const done = await service.claimRoute('user', 'operations', '7');
    expect(done.routes).toMatchObject({
      claimedRoute: null,
      rewardXp: 0,
      operations: { status: 'claimed' },
    });
    expect(tx.parkGrowthClaim.createMany).not.toHaveBeenCalled();
  });

  it('uses a single researcher and retains stage-specific costs and restrictions', async () => {
    const { park, service, resources, tx } = setup();
    park.level = 6;
    await service.startResearch('user');
    expect((await service.getState('user', '6')).research).toMatchObject({
      status: 'available',
      blockedByResearch: true,
      unavailableReason: expect.stringContaining('다른 연구'),
    });
    await expect(service.startResearch('user', '7')).rejects.toThrow('파크 Lv.7');
    await expect(service.startResearch('user', '6')).rejects.toThrow('다른 연구');
    jest.setSystemTime(TIME + 60_000);
    const started = await service.startResearch('user', '6');
    expect(started.research).toMatchObject({
      status: 'running',
      completesAt: new Date(TIME + 120_000).toISOString(),
      careDecayReductionPercent: 2,
    });
    expect(await service.startResearch('user', '6')).toEqual(started);
    expect(resources.spendGold).toHaveBeenLastCalledWith(
      tx,
      'user',
      500,
      '기술 연구: 환경 적응 Lv.1',
    );
    jest.setSystemTime(TIME + 120_000);
    park.level = 7;
    park.firstSynthesis.claimedAt = null;
    await expect(service.startResearch('user', '7')).rejects.toThrow('첫 스테고케라톱스');
    park.firstSynthesis.claimedAt = new Date(TIME);
    const mapped = await service.startResearch('user', '7');
    expect(mapped.research).toMatchObject({
      status: 'running',
      completesAt: new Date(TIME + 180_000).toISOString(),
      costs: { gold: 400, wood: 5, stone: 5 },
    });
    expect(await service.startResearch('user', '7')).toEqual(mapped);
    expect(resources.consumeMaterials).toHaveBeenCalledTimes(3);
    expect(resources.spendGold).toHaveBeenLastCalledWith(
      tx,
      'user',
      400,
      '기술 연구: 현장 지도화 Lv.1',
    );
  });
});

describe('park growth Lv.8 through Lv.15', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(TIME));
  afterEach(() => jest.useRealTimers());

  it('requires a claimed first hero, the source level and a completed alternative', async () => {
    const { park, service } = setup();
    park.level = 8;
    park.totalVisitors = 1600;
    park.firstSynthesis.claimedAt = null;
    await expect(service.claim('user', 'operation', '8')).rejects.toThrow('첫 스테고케라톱스');
    park.firstSynthesis.claimedAt = new Date(TIME);
    await expect(service.claim('user', 'operation', '9')).rejects.toThrow('파크 Lv.9');
    await expect(service.claim('user', 'facility', '8')).rejects.toThrow('성장 목표를 먼저');
    const state = await service.getState('user', '9');
    expect('research' in state).toBe(false);
    expect(state.goals).toContainEqual(
      expect.objectContaining({
        id: 'facility',
        status: 'locked',
        alternatives: [
          expect.objectContaining({ typeId: 'research-dna-lab', level: 5, status: 'incomplete' }),
        ],
      }),
    );
  });

  it('accepts a claimed matching mission reward and requires a hatched animal for ownership', async () => {
    const { park, service, assignments } = setup();
    park.level = 8;
    const missionId = 'mission.mineral-cave.basic-stabilizer.v1';
    const reward = getScoutMission(missionId)!.reward;
    if (reward.type !== 'materials') throw new Error('expected a material mission');
    assignments.push(
      { missionId, reward, claimedAt: null },
      {
        missionId,
        reward: {
          type: 'materials',
          items: [{ ...reward.items[0], quality: MaterialQuality.MIDDLE }],
        },
        claimedAt: new Date(TIME),
      },
    );
    await expect(service.claim('user', 'field', '8')).rejects.toThrow('성장 목표를 먼저');
    assignments.push({ missionId, reward, claimedAt: new Date(TIME) });
    expect(
      (await service.claim('user', 'field', '8')).goals.find(({ id }) => id === 'field')?.status,
    ).toBe('claimed');
    park.level = 10;
    const gallimimusMissionId = 'gene-target-gallimimus';
    assignments.push({
      missionId: gallimimusMissionId,
      reward: getScoutMission(gallimimusMissionId)!.reward,
      claimedAt: new Date(TIME),
    });
    await expect(service.claim('user', 'field', '10')).rejects.toThrow('성장 목표를 먼저');
    park.dinosaurCollections.push({ speciesId: 'gallimimus' });
    expect(
      (await service.claim('user', 'field', '10')).goals.find(({ id }) => id === 'field')?.status,
    ).toBe('claimed');
  });

  it('retains a demolished facility only for ranks it actually finished', async () => {
    const { park, tx, service } = setup();
    park.level = 9;
    const lab = park.buildings.find(({ typeId }) => typeId === FIRST_HYBRID_LAB_ID)!;
    lab.level = 5;
    lab.status = BuildingStatus.UPGRADING;
    await retainDemolishedGrowthFacility(tx as unknown as Prisma.TransactionClient, 'user', lab);
    park.buildings = park.buildings.filter(({ id }) => id !== lab.id);
    expect(
      (await service.getState('user', '8')).goals.find(({ id }) => id === 'facility')?.status,
    ).toBe('claimable');
    expect(
      (await service.getState('user', '9')).goals.find(({ id }) => id === 'facility')?.status,
    ).toBe('incomplete');
  });

  it('uses every approved XP budget to advance one level and deduplicates claims across the transition', async () => {
    const { park, service, assignments } = setup();
    park.level = 8;
    park.exp = 0;
    const lab = park.buildings.find(({ typeId }) => typeId === FIRST_HYBRID_LAB_ID)!;
    const approvedXp = [8444, 10439, 12619, 14980, 17520, 20236, 23123];
    for (const { stage, targetLevel, labPreparation, goals } of PARK_MIDGAME_GROWTH) {
      expect(park.level).toBe(stage);
      lab.level = labPreparation;
      for (const { alternatives } of goals) {
        const condition = alternatives[0];
        switch (condition.kind) {
          case 'research':
            if (stage === 12) recordResearch(park, 'care-adaptation', 3);
            else if (stage === 13) recordResearch(park, 'ops-entry', 2);
            else recordResearch(park, condition.technologyId, condition.level);
            break;
          case 'dispatch':
            assignments.push({
              missionId: condition.missionId,
              reward: getScoutMission(condition.missionId)!.reward,
              claimedAt: new Date(TIME),
            });
            break;
          case 'owned':
            park.dinosaurCollections.push({ speciesId: condition.speciesId });
            break;
          case 'paid':
            park.totalVisitors = condition.amount;
            break;
        }
      }
      const state = await service.getState('user', String(stage));
      const awarded = state.goals.reduce((total, goal) => total + goal.xp, 0);
      expect(awarded).toBe(approvedXp[stage - 8]);
      expect(awarded).toBe(getParkLevelExperience(stage));
      expect(state.goals.every(({ status }) => status === 'claimable')).toBe(true);
      for (const { id } of goals) {
        const claimed = await service.claim('user', id, String(stage));
        expect(await service.claim('user', id, String(stage))).toEqual(claimed);
      }
      expect(park.level).toBe(targetLevel);
      expect(park.exp).toBe(0);
    }
    expect(park.growthClaims).toHaveLength(28);
    expect(park.growthClaims[0].goalId).toBe('park-growth-08-facility');
    expect(park.growthClaims[27].goalId).toBe('park-growth-14-operation');
  });
});
