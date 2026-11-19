import { FIRST_EXPEDITION } from '@dino-park/game-data';
import { FirstExpeditionService } from './first-expedition.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';

function fixture() {
  let id = 0;
  const now = new Date();
  const state = {
    user: { id: 'owner', tutorialStep: 0 },
    park: {
      id: 'park',
      userId: 'owner',
      level: 2,
      exp: 0,
      gridSizeX: 20,
      gridSizeY: 20,
      buildings: [{ id: 'platform', typeId: 'visitor-viewing-platform', status: 'ACTIVE' }],
      dinosaurs: [] as Array<Record<string, unknown>>,
      dinosaurCollections: [] as Array<{ speciesId: string }>,
    },
    currency: { gold: 10000, explorationEnergy: 30, energyLastRechargedAt: now },
    mission: null as Record<string, unknown> | null,
    eggs: [] as Array<Record<string, unknown>>,
    receipts: new Set<string>(),
    transactions: [] as unknown[],
  };
  const update = (object: Record<string, unknown>, data: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'decrement' in value)
        object[key] = Number(object[key]) - Number(value.decrement);
      else object[key] = value;
    }
    return object;
  };
  const tx = {
    park: {
      findUnique: jest.fn(async () => state.park),
      findUniqueOrThrow: jest.fn(async () => state.park),
      update: jest.fn(async ({ data }) => update(state.park, data)),
    },
    user: {
      findUniqueOrThrow: jest.fn(async () => state.user),
      updateMany: jest.fn(async ({ data }) => {
        state.user.tutorialStep = data.tutorialStep;
        return { count: 1 };
      }),
    },
    currency: {
      findUniqueOrThrow: jest.fn(async () => state.currency),
      update: jest.fn(async ({ data }) => update(state.currency, data)),
    },
    exploration: {
      findUnique: jest.fn(async ({ where }) =>
        where.id ? (state.mission?.id === where.id ? state.mission : null) : state.mission,
      ),
      count: jest.fn(async () => 0),
      create: jest.fn(async ({ data }) => {
        state.mission = {
          id: `mission-${++id}`,
          status: 'IN_PROGRESS',
          startedAt: now,
          missionStep: 0,
          ...data,
        };
        return state.mission;
      }),
      update: jest.fn(async ({ data }) => update(state.mission!, data)),
    },
    hatchingQueue: {
      findUnique: jest.fn(
        async ({ where }) =>
          state.eggs.find((egg) =>
            where.id ? egg.id === where.id : egg.sourceExplorationId === where.sourceExplorationId,
          ) ?? null,
      ),
      findMany: jest.fn(async () => state.eggs.filter((egg) => !egg.completed)),
      create: jest.fn(async ({ data }) => {
        const egg = {
          id: `egg-${++id}`,
          completed: false,
          readyToStart: false,
          claimedDinosaurId: null,
          startedAt: now,
          sourceExplorationId: null,
          ...data,
        };
        state.eggs.push(egg);
        return egg;
      }),
      update: jest.fn(async ({ where, data }) =>
        update(state.eggs.find((egg) => egg.id === where.id)!, data),
      ),
    },
    dinosaur: {
      create: jest.fn(async ({ data }) => {
        const dinosaur = {
          id: `dino-${++id}`,
          createdAt: now,
          level: 1,
          exp: 0,
          nickname: null,
          ...data,
        };
        state.park.dinosaurs.push(dinosaur);
        return dinosaur;
      }),
    },
    dinosaurCollection: {
      upsert: jest.fn(async ({ create }) => {
        if (!state.park.dinosaurCollections.some((entry) => entry.speciesId === create.speciesId))
          state.park.dinosaurCollections.push(create);
        return create;
      }),
    },
    storyFlag: {
      createMany: jest.fn(async ({ data }) => {
        if (state.receipts.has(data.flagId)) return { count: 0 };
        state.receipts.add(data.flagId);
        return { count: 1 };
      }),
    },
    driveRun: {
      findUnique: jest.fn(),
    },
    transaction: {
      create: jest.fn(async (args) => {
        state.transactions.push(args);
        return args.data;
      }),
    },
  };
  // Row-lock equivalent for concurrency tests; a rejected callback leaves the chain usable.
  let last = Promise.resolve<unknown>(undefined);
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => {
      const task = last.then(() => callback(tx));
      last = task.catch(() => undefined);
      return task;
    }),
  };
  const operations = { settleInTransaction: jest.fn(async () => undefined) };
  return {
    state,
    tx,
    operations,
    service: new FirstExpeditionService(
      prisma as unknown as PrismaService,
      operations as unknown as ParkOperationsService,
    ),
  };
}

async function finishMission(f: ReturnType<typeof fixture>) {
  await f.service.start('owner', 'grassland');
  const id = f.state.mission!.id as string;
  for (const [step, clue] of FIRST_EXPEDITION.clues.entries())
    await f.service.choose('owner', id, step, clue.correctChoiceId);
  return id;
}

describe('first expedition and nursery', () => {
  it('shares the hatching slot but preserves the designated parent timer and once-only XP', async () => {
    const f = fixture();
    const now = new Date();
    f.state.park.level = 3;
    f.state.eggs.push({
      id: 'trike-egg',
      userId: 'owner',
      eggType: 'uncommon',
      speciesId: 'triceratops',
      sourceDriveId: 'drive-123',
      completesAt: now,
      readyToStart: true,
      completed: false,
    });
    f.tx.driveRun.findUnique.mockResolvedValue({
      reward: { type: 'egg', speciesId: 'triceratops', hatchSeconds: 3600 },
    });
    await f.service.startHatching('owner', 'trike-egg');
    const egg = f.state.eggs[0];
    expect((egg.completesAt as Date).getTime() - (egg.startedAt as Date).getTime()).toBe(3_600_000);
    await expect(f.service.claimHatching('owner', 'trike-egg')).rejects.toThrow('아직 알');
    egg.completesAt = new Date(0);
    await Promise.all([
      f.service.claimHatching('owner', 'trike-egg'),
      f.service.claimHatching('owner', 'trike-egg'),
    ]);
    expect(f.state.park.dinosaurs).toHaveLength(1);
    expect(f.state.park.dinosaurCollections).toEqual([
      expect.objectContaining({ speciesId: 'triceratops' }),
    ]);
    expect(f.state.park.exp).toBe(800);
  });

  it('requires the completed platform, then charges once even for concurrent resumes', async () => {
    const f = fixture();
    f.state.park.buildings[0].status = 'CONSTRUCTING';
    await expect(f.service.start('owner', 'grassland')).rejects.toThrow('관람대');
    expect(f.state.currency.gold).toBe(10000);
    f.state.park.buildings[0].status = 'ACTIVE';
    const results = await Promise.all([
      f.service.start('owner', 'grassland'),
      f.service.start('owner', 'grassland'),
    ]);
    expect(results.map((result) => result.mission?.id)).toEqual(['mission-1', 'mission-1']);
    expect(f.state.currency.gold).toBe(9900);
    expect(f.state.currency.explorationEnergy).toBe(25);
    expect(f.tx.exploration.create).toHaveBeenCalledTimes(1);
  });

  it('cannot finish through time, future steps, mistakes or duplicate step submission', async () => {
    const f = fixture();
    await f.service.start('owner', 'grassland');
    const id = f.state.mission!.id as string;
    f.state.mission!.startedAt = new Date(0);
    expect((await f.service.getState('owner')).stage).toBe('exploring');
    await expect(f.service.claim('owner', id)).rejects.toThrow('세 단서');
    await expect(f.service.choose('owner', id, 2, 'nest')).rejects.toThrow('앞의 단서');
    const wrong = await f.service.choose('owner', id, 0, 'rocks');
    expect(wrong.feedback?.correct).toBe(false);
    expect(wrong.mission?.step).toBe(0);
    await Promise.all([
      f.service.choose('owner', id, 0, 'footprints'),
      f.service.choose('owner', id, 0, 'footprints'),
    ]);
    expect((await f.service.getState('owner')).mission?.step).toBe(1);
    expect(f.state.currency.gold).toBe(9900);
    expect(f.state.currency.explorationEnergy).toBe(25);
  });

  it('stores the designated egg, starts manually and never claims before 60 seconds', async () => {
    const f = fixture();
    const id = await finishMission(f);
    await Promise.all([f.service.claim('owner', id), f.service.claim('owner', id)]);
    const state = await f.service.getState('owner');
    expect(state.stage).toBe('egg');
    expect(state.egg).toMatchObject({
      speciesId: 'iguanodon',
      status: 'stored',
      completesAt: null,
    });
    expect(f.state.eggs).toHaveLength(1);
    const egg = f.state.eggs[0];
    await expect(f.service.claimHatching('owner', egg.id as string)).rejects.toThrow('부화를 시작');
    const start = await f.service.startHatching('owner', egg.id as string);
    expect(start.stage).toBe('hatching');
    expect(start.egg?.remainingSeconds).toBe(60);
    await expect(f.service.claimHatching('owner', egg.id as string)).rejects.toThrow('아직 알');
    expect(f.state.park.dinosaurs).toHaveLength(0);
  });

  it('grants one healthy owned dinosaur and one codex record/XP, preserving manual placement', async () => {
    const f = fixture();
    const id = await finishMission(f);
    await f.service.claim('owner', id);
    const egg = f.state.eggs[0];
    await f.service.startHatching('owner', egg.id as string);
    egg.completesAt = new Date(0);
    await Promise.all([
      f.service.claimHatching('owner', egg.id as string),
      f.service.claimHatching('owner', egg.id as string),
    ]);
    const state = await f.service.getState('owner');
    expect(state.stage).toBe('placement');
    expect(state.dinosaur).toMatchObject({
      speciesId: 'iguanodon',
      happiness: 100,
      hunger: 0,
      isInPark: false,
    });
    expect(f.state.park.dinosaurs).toHaveLength(1);
    expect(f.state.park.dinosaurCollections).toHaveLength(1);
    expect(f.state.park.level).toBe(3);
    expect(f.state.receipts.size).toBe(1);
    f.state.park.dinosaurs[0].isInPark = true;
    expect((await f.service.getState('owner')).stage).toBe('complete');
    expect(f.state.user.tutorialStep).toBe(10);
  });

  it('recognizes old collection or owned progress without charging or granting a bonus', async () => {
    const f = fixture();
    f.state.park.dinosaurCollections.push({ speciesId: 'iguanodon' });
    expect((await f.service.start('owner', 'grassland')).stage).toBe('complete');
    expect(f.state.currency.gold).toBe(10000);
    expect(f.state.park.exp).toBe(0);
    expect(f.state.mission).toBeNull();
  });

  it('keeps a stored egg when legacy incubation fills the basic slot; hatchery means total three', async () => {
    const f = fixture();
    const id = await finishMission(f);
    await f.service.claim('owner', id);
    f.state.eggs.push({
      id: 'legacy',
      userId: 'owner',
      speciesId: 'parasaurolophus',
      eggType: 'common',
      completed: false,
      readyToStart: false,
      completesAt: new Date(0),
      claimedDinosaurId: null,
    });
    await expect(f.service.startHatching('owner', f.state.eggs[0].id as string)).rejects.toThrow(
      '슬롯이 가득',
    );
    expect(f.state.eggs[0].readyToStart).toBe(true);
    f.state.park.buildings.push({ id: 'hatchery', typeId: 'research-hatchery', status: 'ACTIVE' });
    const state = await f.service.startHatching('owner', f.state.eggs[0].id as string);
    expect(state.hatchingSlots).toEqual({ used: 2, total: 3 });
  });

  it('recovers legacy random eggs with stable natural species, and rejects foreign mutation', async () => {
    const f = fixture();
    f.state.eggs.push({
      id: 'legacy',
      userId: 'owner',
      speciesId: null,
      eggType: 'common',
      completed: false,
      readyToStart: false,
      sourceExplorationId: null,
      completesAt: new Date(0),
      claimedDinosaurId: null,
    });
    await f.service.claimHatching('owner', 'legacy');
    const id = f.state.eggs[0].claimedDinosaurId;
    await f.service.claimHatching('owner', 'legacy');
    expect(f.state.park.dinosaurs).toHaveLength(1);
    expect(f.state.eggs[0].claimedDinosaurId).toBe(id);
    expect(f.state.receipts.size).toBe(0);
    await expect(f.service.claimHatching('intruder', 'legacy')).rejects.toThrow('보유한 알');
  });
  it('does not trust a skipped tutorial number as mission completion, and protects foreign missions', async () => {
    const f = fixture();
    f.state.user.tutorialStep = 999;
    expect((await f.service.getState('owner')).stage).toBe('available');
    await f.service.start('owner', 'grassland');
    const id = f.state.mission!.id as string;
    await expect(f.service.choose('intruder', id, 0, 'footprints')).rejects.toThrow('첫 탐험');
    await expect(f.service.claim('intruder', id)).rejects.toThrow('첫 탐험');
    expect(f.state.mission!.missionStep).toBe(0);
    expect(f.state.eggs).toHaveLength(0);
  });

  it('keeps the mission unopened when either preparation resource is insufficient', async () => {
    const f = fixture();
    f.state.currency.gold = 99;
    await expect(f.service.start('owner', 'grassland')).rejects.toThrow('준비비');
    f.state.currency.gold = 100;
    f.state.currency.explorationEnergy = 4;
    f.state.currency.energyLastRechargedAt = new Date();
    await expect(f.service.start('owner', 'grassland')).rejects.toThrow('에너지');
    expect(f.state.currency.gold).toBe(100);
    expect(f.state.mission).toBeNull();
  });
});
