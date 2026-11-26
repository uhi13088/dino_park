import { FIRST_EXPEDITION } from '@dino-park/game-data';
import {
  EARLY_SYNTHESIS_SAFETY_FLAG,
  MaterialQuality,
  ResearchMaterial,
  type ScoutMission,
  type ScoutReward,
} from '@dino-park/shared';
import type { Prisma, ScoutAssignment } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ParkOperationsService } from '../park/park-operations.service';
import { ScoutExpeditionService } from './scout-expedition.service';
import { scoutAbilities, scoutMissionBlock, scoutRewardForDispatch } from './scout-mission.rules';
import { FIRST_EXPEDITION_RECEIPT_STEPS } from './expedition-state';
import { grantScoutExpeditionReward } from './scout-reward';
import type { ScoutWorld } from './scout-world';
import * as scoutWorld from './scout-world';

const now = new Date('2026-11-22T01:01:00.000Z');
const startedAt = new Date('2026-11-22T01:00:00.000Z');
const first = {
  id: FIRST_EXPEDITION.id,
  legacyMissionId: FIRST_EXPEDITION.id,
  title: '초원 정찰',
  seconds: 60,
  gold: 100,
  reward: { type: 'egg', speciesId: FIRST_EXPEDITION.speciesId, hatchSeconds: 60 },
  gate: { platform: true, once: true, noDuplicateEgg: true },
} satisfies ScoutMission;

function world() {
  return {
    park: { level: 5, firstSynthesis: null },
    platformReady: true,
    legacyBlocked: false,
    firstIguanodonRecorded: false,
    claimed: new Set<string>(),
    claimedDrives: new Set<string>(),
    registered: new Set<string>(),
    owned: new Set<string>(),
    flags: new Set<string>(),
    eggs: [],
    assignments: [],
  } as unknown as ScoutWorld;
}

describe('scout fuel by destination', () => {
  const marineMission = 'natural-target-plesiosaurus';

  afterEach(() => jest.restoreAllMocks());

  function setup(explorationEnergy = 0) {
    const state: ScoutWorld = {
      ...world(),
      park: {
        ...world().park,
        level: 50,
        firstSynthesis: { claimedAt: now, exhibitedAt: now },
        scouts: [{ id: 'scout', parkId: 'park', slot: 1, experience: 15, hiredAt: now }],
      },
      labLevel: 25,
      research: new Map([
        ['gene-uncommon-carnivore', 1],
        ['exp-deep-expedition', 3],
      ]),
      currency: {
        id: 'currency',
        userId: 'user',
        explorationEnergy,
        energyLastRechargedAt: now,
        gold: 10_000,
        diamond: 0,
        dna: 0,
        updatedAt: now,
      },
    };
    let clock = now;
    const tx = {
      $queryRaw: jest.fn(async () => [{ now: clock }]),
      currency: {
        update: jest.fn(async ({ data }: Prisma.CurrencyUpdateArgs) => {
          if (typeof data.gold === 'object' && data.gold.decrement)
            state.currency.gold -= data.gold.decrement;
          if (typeof data.explorationEnergy === 'number')
            state.currency.explorationEnergy = data.explorationEnergy;
          if (data.energyLastRechargedAt instanceof Date)
            state.currency.energyLastRechargedAt = data.energyLastRechargedAt;
          return state.currency;
        }),
      },
      transaction: { create: jest.fn() },
      scoutAssignment: {
        create: jest.fn(async ({ data }: { data: ScoutAssignment }) => {
          state.assignments.push({ ...data, id: 'report' });
        }),
      },
    };
    jest.spyOn(scoutWorld, 'loadScoutWorld').mockResolvedValue(state);
    const prisma = { $transaction: (run: (context: typeof tx) => unknown) => run(tx) };
    const operations = { settleInTransaction: jest.fn() };
    const service = new ScoutExpeditionService(
      prisma as unknown as PrismaService,
      operations as unknown as ParkOperationsService,
    );
    return {
      service,
      tx,
      state,
      advance: (minutes: number) => {
        clock = new Date(now.getTime() + minutes * 60_000);
      },
    };
  }

  it('dispatches the shared egg mission from the coast with an empty tank and preserves the recharge clock', async () => {
    const { service, state, tx } = setup();
    await expect(
      service.dispatch('user', {
        scoutId: 'scout',
        spotId: 'quiet-bay',
        missionId: marineMission,
      }),
    ).resolves.toMatchObject({ fuel: 0 });
    expect(state.assignments).toHaveLength(1);
    expect(state.currency.energyLastRechargedAt).toBe(now);
    expect(tx.currency.update.mock.calls[0][0].data).not.toHaveProperty('explorationEnergy');
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
  });

  it('blocks the same egg in deep sea, then consumes five naturally recovered fuel exactly once', async () => {
    const { service, state, tx, advance } = setup();
    const request = { scoutId: 'scout', spotId: 'continental-shelf', missionId: marineMission };
    await expect(service.dispatch('user', request)).rejects.toThrow('탐험 연료가 부족해요.');
    expect(tx.currency.update).not.toHaveBeenCalled();
    expect(state.assignments).toHaveLength(0);

    advance(50);
    await expect(service.dispatch('user', request)).resolves.toMatchObject({ fuel: 0 });
    await service.dispatch('user', request);
    expect(tx.currency.update).toHaveBeenCalledTimes(1);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(state.currency.energyLastRechargedAt.getTime()).toBe(now.getTime() + 3_000_000);
    expect(state.assignments).toHaveLength(1);
  });

  it('uses ten for a long-range expedition in a land region', async () => {
    const { service, state, tx } = setup(9);
    const request = {
      scoutId: 'scout',
      spotId: 'collapse-crystal',
      missionId: 'mission.mineral-cave.crystal-core.v1',
    };
    await expect(service.dispatch('user', request)).rejects.toThrow('탐험 연료가 부족해요.');
    state.currency.explorationEnergy = 10;
    await expect(service.dispatch('user', request)).resolves.toMatchObject({ fuel: 0 });
    expect(tx.currency.update).toHaveBeenCalledTimes(1);
  });
});

describe('scout mission prerequisites', () => {
  it('protects the first egg from old and active scout routes', () => {
    const state = world();
    expect(scoutMissionBlock(state, first, 1)).toBeUndefined();
    state.legacyBlocked = true;
    expect(scoutMissionBlock(state, first, 1)?.blockedReason).toContain('기존 탐험');
    state.legacyBlocked = false;
    state.firstIguanodonRecorded = true;
    expect(scoutMissionBlock(state, first, 1)?.blockedReason).toContain('이미 수령');
    state.firstIguanodonRecorded = false;
    state.registered.add(FIRST_EXPEDITION.speciesId);
    expect(scoutMissionBlock(state, first, 1)?.blockedReason).toContain('이미 수령');
  });

  it('requires claimed early samples, locks old rewards until exhibition and leaves first yields fixed', () => {
    const state = world();
    const sample = {
      ...first,
      id: 'dna2',
      legacyMissionId: 'dna2',
      reward: {
        type: 'materials',
        items: [{ material: ResearchMaterial.DNA, quality: MaterialQuality.MIDDLE, amount: 10 }],
      },
      gate: { safety: true, claimed: ['dna1'], afterExhibitionToRepeat: true },
    } satisfies ScoutMission;
    expect(scoutMissionBlock(state, sample, 3)?.blockedReason).toContain('2장 안전');
    state.flags.add(EARLY_SYNTHESIS_SAFETY_FLAG);
    expect(scoutMissionBlock(state, sample, 3)?.blockedReason).toContain('보상을 수령');
    state.claimedDrives.add('dna1');
    expect(scoutMissionBlock(state, sample, 3)).toBeUndefined();
    expect(scoutRewardForDispatch(state, sample, 3)).toBe(sample.reward);
    state.claimedDrives.add('dna2');
    expect(scoutMissionBlock(state, sample, 3)?.blockedReason).toContain('전시');
    state.park.firstSynthesis = { claimedAt: now, exhibitedAt: now };
    expect(scoutMissionBlock(state, sample, 3)).toBeUndefined();
  });

  it('gates new riskier assignments using the dispatched scout rank', () => {
    const state = world();
    const reserved = { ...first, gate: { responseLevel: 3 } };
    expect(scoutAbilities(4).responseLevel).toBe(1);
    expect(
      scoutMissionBlock(state, reserved, scoutAbilities(14).responseLevel)?.blockedReason,
    ).toContain('Lv.3');
    expect(scoutMissionBlock(state, reserved, scoutAbilities(15).responseLevel)).toBeUndefined();
  });
});

describe('scout completion receipts', () => {
  function setup() {
    const tx = {
      exploration: {
        findUnique: jest.fn(async (): Promise<{ id: string; status: string } | null> => null),
        create: jest.fn(async () => ({ id: 'exploration' })),
        update: jest.fn(async () => ({ id: 'old-first' })),
      },
      hatchingQueue: { create: jest.fn() },
      user: { updateMany: jest.fn() },
      driveRun: { create: jest.fn(async () => ({ id: 'drive' })) },
      resourceInventory: { upsert: jest.fn() },
    };
    return { tx, prisma: tx as unknown as Prisma.TransactionClient };
  }

  it('creates the historical first receipt and queues a normal hatch', async () => {
    const { tx, prisma } = setup();
    await grantScoutExpeditionReward(
      prisma,
      'owner',
      'park',
      {
        missionId: first.id,
        legacyMissionId: first.legacyMissionId,
        startedAt,
        completesAt: now,
      },
      first.reward,
      now,
    );
    expect(tx.exploration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'owner',
        missionId: FIRST_EXPEDITION.id,
        status: 'CLAIMED',
        missionStep: FIRST_EXPEDITION_RECEIPT_STEPS,
      }),
    });
    expect(tx.hatchingQueue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'owner',
        sourceExplorationId: 'exploration',
        readyToStart: true,
      }),
    });
    expect(tx.driveRun.create).not.toHaveBeenCalled();
  });

  it('reuses an unfinished manual row for a newly completed scout report', async () => {
    const { tx, prisma } = setup();
    tx.exploration.findUnique.mockResolvedValue({ id: 'old-first', status: 'IN_PROGRESS' });
    const report = { missionId: first.id, legacyMissionId: first.id, startedAt, completesAt: now };
    await grantScoutExpeditionReward(prisma, 'owner', 'park', report, first.reward, now);
    expect(tx.exploration.create).not.toHaveBeenCalled();
    expect(tx.exploration.update).toHaveBeenCalledWith({
      where: { id: 'old-first' },
      data: expect.objectContaining({ status: 'CLAIMED', completedAt: now }),
    });
    expect(tx.hatchingQueue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sourceExplorationId: 'old-first', readyToStart: true }),
    });
  });

  it('does not overwrite a completed manual report or grant its egg twice', async () => {
    const { tx, prisma } = setup();
    tx.exploration.findUnique.mockResolvedValue({ id: 'old-first', status: 'COMPLETED' });
    const report = { missionId: first.id, legacyMissionId: first.id, startedAt, completesAt: now };
    await expect(
      grantScoutExpeditionReward(prisma, 'owner', 'park', report, first.reward, now),
    ).rejects.toThrow('이미 완료');
    expect(tx.exploration.update).not.toHaveBeenCalled();
    expect(tx.hatchingQueue.create).not.toHaveBeenCalled();
  });

  it('preserves early growth dates and persists each material of a report once', async () => {
    const { tx, prisma } = setup();
    const reward: ScoutReward = {
      type: 'materials',
      items: [
        { material: ResearchMaterial.DNA, quality: MaterialQuality.MIDDLE, amount: 10 },
        { material: ResearchMaterial.DNA, quality: MaterialQuality.LOW, amount: 2 },
      ],
    };
    await grantScoutExpeditionReward(
      prisma,
      'owner',
      'park',
      {
        missionId: 'new-map-dna1',
        legacyMissionId: 'dna1',
        startedAt,
        completesAt: now,
      },
      reward,
      now,
    );
    expect(tx.driveRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CLAIMED',
          missionId: 'dna1',
          createdAt: startedAt,
          claimedAt: now,
        }),
      }),
    );
    expect(tx.resourceInventory.upsert).toHaveBeenCalledTimes(2);
    expect(tx.resourceInventory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { amount: { increment: 10 } },
      }),
    );
  });
});
