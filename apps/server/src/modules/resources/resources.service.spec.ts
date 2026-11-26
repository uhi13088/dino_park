import { ResourcesService } from './resources.service';
import { MaterialQuality, ResearchMaterial } from '@dino-park/shared';
import {
  FUEL_DEPOT_TYPE_ID,
  RESEARCH_STORAGE_ID,
  getResearchFacilityUpgrade,
} from '@dino-park/game-data';
import { BuildingService } from '../building/building.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';
import { AT, building, world } from '../park/park-admission.fixtures';

interface Where {
  id?: string;
  parkId?: string;
  userId?: string;
  activeSlot?: string;
  claimedAt?: null;
  material?: string;
  quality?: number;
  amount?: { gte: number };
  gold?: { gte: number };
  parkId_material_quality?: { parkId: string; material: string; quality: number };
}
interface Stock {
  id: string;
  parkId: string;
  material: string;
  quality: number;
  amount: number;
}
interface Job {
  id: string;
  parkId: string;
  buildingId: string;
  activeSlot: string | null;
  material: string;
  lots: number;
  quantity: number;
  costGold: number;
  startedAt: Date;
  readyAt: Date;
  claimedAt: Date | null;
}
const patch = (target: object, data: Record<string, unknown>) => {
  const row = target as Record<string, unknown>;
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in value)
      row[key] = Number(row[key]) + Number(value.increment);
    else if (value && typeof value === 'object' && 'decrement' in value)
      row[key] = Number(row[key]) - Number(value.decrement);
    else row[key] = value;
  }
  return target;
};

function fixture() {
  let state = {
    park: { ...world(), id: 'park', userId: 'user', level: 3, exp: 0 },
    currency: { gold: 10000, explorationEnergy: 30, energyLastRechargedAt: new Date(AT) },
    inventory: [] as Stock[],
    jobs: [] as Job[],
    transactions: [] as Record<string, unknown>[],
    heroClaimedAt: null as Date | null,
    nextId: 1,
  };
  state.park.buildings.push(building('lumber', 'production-lumberyard', 12, 8));
  const tx = {
    park: {
      findUnique: jest.fn(async () => state.park),
      findUniqueOrThrow: jest.fn(async () => ({
        ...state.park,
        resourceInventory: state.inventory,
        productionJobs: state.jobs.filter((job) => !job.claimedAt),
      })),
    },
    currency: {
      findUniqueOrThrow: jest.fn(async () => state.currency),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) =>
        patch(state.currency, data),
      ),
      updateMany: jest.fn(
        async ({ where, data }: { where: Where; data: Record<string, unknown> }) => {
          if (state.currency.gold < (where.gold?.gte ?? 0)) return { count: 0 };
          patch(state.currency, data);
          return { count: 1 };
        },
      ),
    },
    resourceInventory: {
      findUnique: jest.fn(
        async ({ where }: { where: Where }) =>
          state.inventory.find(
            (item) =>
              item.parkId === where.parkId_material_quality?.parkId &&
              item.material === where.parkId_material_quality?.material &&
              item.quality === where.parkId_material_quality?.quality,
          ) ?? null,
      ),
      upsert: jest.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: Where;
          create: Omit<Stock, 'id'>;
          update: Record<string, unknown>;
        }) => {
          const current = state.inventory.find(
            (item) =>
              item.parkId === where.parkId_material_quality?.parkId &&
              item.material === where.parkId_material_quality?.material &&
              item.quality === where.parkId_material_quality?.quality,
          );
          if (current) {
            patch(current, update);
            return current;
          }
          const stock = { id: `stock-${state.nextId++}`, ...create };
          state.inventory.push(stock);
          return stock;
        },
      ),
      updateMany: jest.fn(
        async ({ where, data }: { where: Where; data: Record<string, unknown> }) => {
          const current = state.inventory.find(
            (item) =>
              item.parkId === where.parkId &&
              item.material === where.material &&
              item.quality === where.quality &&
              item.amount >= (where.amount?.gte ?? 0),
          );
          if (!current) return { count: 0 };
          patch(current, data);
          return { count: 1 };
        },
      ),
    },
    productionJob: {
      findUnique: jest.fn(
        async ({ where }: { where: Where }) =>
          state.jobs.find((job) => job.activeSlot === where.activeSlot) ?? null,
      ),
      findFirst: jest.fn(
        async ({ where }: { where: Where }) =>
          state.jobs.find((job) => job.id === where.id && job.parkId === where.parkId) ?? null,
      ),
      create: jest.fn(async ({ data }: { data: Omit<Job, 'id' | 'startedAt' | 'claimedAt'> }) => {
        if (state.jobs.some((job) => job.activeSlot === data.activeSlot))
          throw new Error('Unique active production slot');
        const job = {
          id: `job-${state.nextId++}`,
          startedAt: new Date(),
          claimedAt: null,
          ...data,
        };
        state.jobs.push(job);
        return job;
      }),
      updateMany: jest.fn(
        async ({ where, data }: { where: Where; data: Record<string, unknown> }) => {
          const job = state.jobs.find(
            (item) =>
              item.id === where.id && !item.claimedAt && item.activeSlot === where.activeSlot,
          );
          if (!job) return { count: 0 };
          patch(job, data);
          return { count: 1 };
        },
      ),
    },
    building: {
      findMany: jest.fn(async () => state.park.buildings),
      create: jest.fn(async ({ data }) => {
        const facility = {
          ...building(`building-${state.nextId++}`, data.typeId, data.positionX, data.positionY),
          ...data,
          createdAt: new Date(),
        };
        state.park.buildings.push(facility);
        return facility;
      }),
      findFirst: jest.fn(
        async ({ where }: { where: Where }) =>
          state.park.buildings.find(
            (item) => item.id === where.id && item.parkId === where.parkId,
          ) ?? null,
      ),
      findUnique: jest.fn(async ({ where }: { where: Where }) => {
        const b = state.park.buildings.find((item) => item.id === where.id);
        return b ? { ...b, park: state.park } : null;
      }),
      update: jest.fn(async ({ where, data }: { where: Where; data: Record<string, unknown> }) => {
        const b = state.park.buildings.find((item) => item.id === where.id)!;
        patch(b, data);
        return b;
      }),
    },
    firstSynthesisJob: {
      findUnique: jest.fn(async () => ({ claimedAt: state.heroClaimedAt })),
    },
    transaction: {
      findUnique: jest.fn(
        async ({ where }: { where: Where }) =>
          state.transactions.find((transaction) => transaction.id === where.id) ?? null,
      ),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.transactions.push(data);
        return data;
      }),
    },
  };
  let queue: Promise<unknown> = Promise.resolve();
  const prisma = {
    $transaction: jest.fn((callback: (context: typeof tx) => Promise<unknown>) => {
      const run = queue.then(async () => {
        const before = structuredClone(state);
        try {
          return await callback(tx);
        } catch (error) {
          state = before;
          throw error;
        }
      });
      queue = run.catch(() => undefined);
      return run;
    }),
  };
  const prismaService = prisma as unknown as PrismaService;
  const operations = new ParkOperationsService(prismaService);
  jest.spyOn(operations, 'settleInTransaction').mockImplementation(async () => {
    for (const facility of state.park.buildings) {
      if (facility.completesAt && facility.completesAt.getTime() <= Date.now()) {
        facility.status = 'ACTIVE';
        facility.completesAt = null;
      }
    }
    return { visitors: 0, gross: 0, maintenance: 0, elapsedHours: 0, settledAt: new Date() };
  });
  const service = new ResourcesService(prismaService, operations);
  const buildings = new BuildingService(prismaService, operations, service);
  const stock = (material: string, amount: number, quality = 0) =>
    state.inventory.push({
      id: `stock-${state.nextId++}`,
      parkId: 'park',
      material,
      quality,
      amount,
    });
  return { service, buildings, tx, state: () => state, stock };
}

describe('ordinary resources and production transactions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(AT);
  });
  afterEach(() => jest.useRealTimers());

  it('purchases exact units into the single ordinary stock without quality or extra energy costs', async () => {
    const f = fixture();
    const result = await f.service.purchase('user', 'wood', 20);
    expect(result.gold).toBe(9600);
    expect(result.inventory.find((item) => item.material === 'wood')?.amount).toBe(20);
    expect(f.state().inventory).toHaveLength(1);
    expect(f.state().inventory[0].quality).toBe(0);
    expect(f.state().transactions).toHaveLength(1);
  });

  it('converts three same-quality materials into one and consumes each quality request once', async () => {
    const f = fixture();
    f.state().heroClaimedAt = new Date(AT);
    f.stock(ResearchMaterial.DNA, 9, MaterialQuality.LOW);
    f.stock(ResearchMaterial.CATALYST, 5, MaterialQuality.LOW);
    const middle = {
      material: ResearchMaterial.DNA,
      fromQuality: MaterialQuality.LOW as const,
      quantity: 3,
      requestId: 'research-middle',
    };
    await Promise.all([
      f.service.upgradeQuality('user', middle),
      f.service.upgradeQuality('user', middle),
    ]);
    const result = await f.service.upgradeQuality('user', {
      ...middle,
      fromQuality: MaterialQuality.MIDDLE,
      quantity: 1,
      requestId: 'research-high',
    });
    expect(result.gold).toBe(9700);
    expect(result.researchMaterials?.filter((item) => item.amount > 0)).toEqual([
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.LOW, amount: 5 },
      { material: ResearchMaterial.DNA, quality: MaterialQuality.HIGH, amount: 1 },
    ]);
    expect(f.state().transactions).toHaveLength(2);
  });

  it('keeps quality stock intact when a player cannot afford the conversion', async () => {
    const f = fixture();
    f.state().heroClaimedAt = new Date(AT);
    f.state().currency.gold = 49;
    f.stock(ResearchMaterial.DNA, 3, MaterialQuality.LOW);
    await expect(
      f.service.upgradeQuality('user', {
        material: ResearchMaterial.DNA,
        fromQuality: MaterialQuality.LOW,
        quantity: 1,
        requestId: 'unaffordable-quality',
      }),
    ).rejects.toThrow('골드가 부족');
    expect(f.state().inventory).toMatchObject([{ quality: MaterialQuality.LOW, amount: 3 }]);
    expect(f.state().transactions).toEqual([]);
  });
  it('starts one selected three-lot job once and serializes two starts at one facility', async () => {
    const f = fixture();
    const started = await Promise.allSettled([
      f.service.startProduction('user', 'lumber', 3),
      f.service.startProduction('user', 'lumber', 1),
    ]);
    expect(started.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(f.state().currency.gold).toBe(9400);
    expect(f.state().jobs).toHaveLength(1);
    expect(f.state().jobs[0]).toMatchObject({
      quantity: 60,
      costGold: 600,
      lots: 3,
      activeSlot: 'lumber',
    });
    expect(f.state().jobs[0].readyAt.getTime()).toBe(AT + 900000);
  });
  it('rejects early claims, then claims once despite concurrent requests and retries an old receipt safely', async () => {
    const f = fixture();
    await f.service.startProduction('user', 'lumber', 1);
    const id = f.state().jobs[0].id;
    await expect(f.service.claimProduction('user', id)).rejects.toThrow('아직 생산 중');
    jest.setSystemTime(AT + 300000);
    await Promise.all([
      f.service.claimProduction('user', id),
      f.service.claimProduction('user', id),
    ]);
    expect(f.state().inventory[0].amount).toBe(20);
    expect(f.state().currency.gold).toBe(9800);
    await f.service.startProduction('user', 'lumber', 1);
    await f.service.claimProduction('user', id);
    expect(f.state().inventory[0].amount).toBe(20);
    expect(f.state().jobs.filter((job) => !job.claimedAt)).toHaveLength(1);
  });
  it('preserves the whole completed selected quantity when storage becomes full', async () => {
    const f = fixture();
    await f.service.startProduction('user', 'lumber', 3);
    const id = f.state().jobs[0].id;
    f.stock('wood', 50);
    jest.setSystemTime(AT + 900000);
    await expect(f.service.claimProduction('user', id)).rejects.toThrow('재고 공간');
    expect(f.state().jobs[0].claimedAt).toBeNull();
    expect(f.state().jobs[0].quantity).toBe(60);
    expect(f.state().currency.gold).toBe(9400);
    f.state().inventory[0].amount = 30;
    const received = await f.service.claimProduction('user', id);
    expect(received.inventory[0].amount).toBe(90);
    expect(f.state().currency.gold).toBe(9400);
  });
  it('builds the depot at Lv.2, queues fuel on a full tank and preserves the full batch until room is available', async () => {
    const f = fixture();
    f.state().park.level = 2;
    const depot = await f.buildings.construct('user', FUEL_DEPOT_TYPE_ID, 14, 3);
    expect(depot.completesAt?.getTime()).toBe(AT + 60_000);
    expect(f.state().currency.gold).toBe(9000);
    await expect(f.service.startProduction('user', depot.id, 1)).rejects.toThrow('완공된');

    jest.setSystemTime(AT + 60_000);
    await f.service.startProduction('user', depot.id, 2);
    const { id } = f.state().jobs[0];
    expect(f.state().jobs[0]).toMatchObject({ material: 'fuel', quantity: 10, costGold: 600 });
    expect(f.state().jobs[0].readyAt.getTime()).toBe(AT + 1_260_000);
    await expect(f.service.claimProduction('user', id)).rejects.toThrow('아직 생산 중');

    jest.setSystemTime(AT + 1_260_000);
    const ready = await f.service.getResources('user');
    expect(ready.fuel).toEqual({ amount: 30, capacity: 30, nextRechargeAt: null });
    expect(ready.facilities.find(({ typeId }) => typeId === FUEL_DEPOT_TYPE_ID)?.job).toMatchObject(
      { ready: true, claimBlocked: true, quantity: 10 },
    );
    await expect(f.service.claimProduction('user', id)).rejects.toThrow('보급소에 보관');
    expect(f.state().jobs[0].claimedAt).toBeNull();

    f.state().currency.explorationEnergy = 20;
    f.state().currency.energyLastRechargedAt = new Date();
    const [first, retry] = await Promise.all([
      f.service.claimProduction('user', id),
      f.service.claimProduction('user', id),
    ]);
    expect(first.fuel.amount).toBe(30);
    expect(retry.fuel.amount).toBe(30);
    expect(f.state().currency.gold).toBe(8400);
    expect(
      f.state().transactions.filter(({ currencyType }) => currencyType === 'fuel'),
    ).toHaveLength(1);
    expect(f.state().inventory).toEqual([]);
    expect(first.inventory.map(({ material }) => material)).not.toContain('fuel');
  });

  it('buys only fuel that fits after natural recovery with exactly one debit on request replay', async () => {
    const f = fixture();
    f.state().currency.explorationEnergy = 25;
    jest.setSystemTime(AT + 900_000);
    expect((await f.service.getResources('user')).fuel).toEqual({
      amount: 26,
      capacity: 30,
      nextRechargeAt: new Date(AT + 1_200_000).toISOString(),
    });
    await expect(f.service.purchase('user', 'fuel', 5, 'too-much')).rejects.toThrow('남은 공간');
    const [first, retry] = await Promise.all([
      f.service.purchase('user', 'fuel', 4, 'fuel-receipt'),
      f.service.purchase('user', 'fuel', 4, 'fuel-receipt'),
    ]);
    expect(first.fuel.amount).toBe(30);
    expect(retry.fuel.amount).toBe(30);
    expect(f.state().currency.gold).toBe(9600);
    expect(f.state().transactions).toEqual([expect.objectContaining({ amount: -400 })]);
    expect(f.state().inventory).toEqual([]);
  });

  it('preserves existing fuel above the cap and prevents a new gold top-up', async () => {
    const f = fixture();
    f.state().currency.explorationEnergy = 39;
    expect((await f.service.getResources('user')).fuel).toEqual({
      amount: 39,
      capacity: 30,
      nextRechargeAt: null,
    });
    await expect(f.service.purchase('user', 'fuel', 1)).rejects.toThrow('남은 공간');
    expect(f.state().currency).toMatchObject({ gold: 10000, explorationEnergy: 39 });
  });

  it('rejects foreign facilities/jobs, unsupported resources, fractional inputs and overflowing purchases without spending', async () => {
    const f = fixture();
    await expect(f.service.startProduction('user', 'someone-elses-factory', 1)).rejects.toThrow(
      '내 생산 시설',
    );
    await expect(f.service.claimProduction('user', 'foreign-job')).rejects.toThrow('내 생산 작업');
    await expect(f.service.purchase('user', 'metal', 1)).rejects.toThrow();
    await expect(f.service.purchase('user', 'wood', 1.5)).rejects.toThrow();
    await expect(f.service.startProduction('user', 'lumber', 4)).rejects.toThrow();
    f.stock('stone', 95);
    await expect(f.service.purchase('user', 'stone', 10)).rejects.toThrow('보관 한도');
    expect(f.state().currency.gold).toBe(10000);
    expect(f.state().transactions).toHaveLength(0);
  });
  it('consumes the exact platform materials and gold once, with a real upgrade timer', async () => {
    const f = fixture();
    f.state().park.buildings.push(building('platform', 'visitor-viewing-platform', 12, 10));
    f.stock('wood', 20);
    f.stock('stone', 10);
    const results = await Promise.allSettled([
      f.buildings.upgrade('platform', 'user'),
      f.buildings.upgrade('platform', 'user'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(f.state().currency.gold).toBe(7000);
    expect(f.state().inventory.map((item) => item.amount)).toEqual([0, 0]);
    expect(f.state().park.buildings.find((item) => item.id === 'platform')).toMatchObject({
      level: 2,
      status: 'UPGRADING',
    });
    expect(
      f
        .state()
        .park.buildings.find((item) => item.id === 'platform')
        ?.completesAt?.getTime(),
    ).toBe(AT + 120000);
  });
  it('rolls back an earlier material debit if the other material or gold is insufficient', async () => {
    const f = fixture();
    f.state().park.buildings.push(building('platform', 'visitor-viewing-platform', 12, 10));
    f.stock('wood', 20);
    f.stock('stone', 9);
    await expect(f.buildings.upgrade('platform', 'user')).rejects.toThrow('석재');
    expect(f.state().inventory.map((item) => item.amount)).toEqual([20, 9]);
    expect(f.state().currency.gold).toBe(10000);
    f.state().inventory[1].amount = 10;
    f.state().currency.gold = 2999;
    await expect(f.buildings.upgrade('platform', 'user')).rejects.toThrow('골드');
    expect(f.state().inventory.map((item) => item.amount)).toEqual([20, 10]);
    expect(f.state().currency.gold).toBe(2999);
  });
  it('opens ordinary metal after the first hero claim and records a retried purchase once', async () => {
    const f = fixture();
    const requestId = 'ac4d7964-60c0-4f3c-a822-c60fbab63b38';
    expect(
      (await f.service.getResources('user')).inventory.map(({ material }) => material),
    ).toEqual(['wood', 'stone']);
    await expect(f.service.purchase('user', 'metal', 10, requestId)).rejects.toThrow('수령하면');
    f.state().heroClaimedAt = new Date(AT);
    const [purchased, repeated] = await Promise.all([
      f.service.purchase('user', 'metal', 10, requestId),
      f.service.purchase('user', 'metal', 10, requestId),
    ]);
    expect(purchased).toEqual(repeated);
    expect(purchased.inventory.find(({ material }) => material === 'metal')).toEqual({
      material: 'metal',
      name: '금속',
      amount: 10,
      buyPrice: 80,
    });
    expect(f.state().inventory).toMatchObject([{ material: 'metal', amount: 10, quality: 0 }]);
    await expect(f.service.purchase('user', 'metal', 11, requestId)).rejects.toThrow('다시 확인');
    expect(f.state().transactions).toHaveLength(1);
    expect(f.state().currency.gold).toBe(9200);
  });

  it('upgrades Lv.2 to 5 in order, preserves the last completed level pending, and never retries into a new level', async () => {
    const f = fixture();
    f.state().park.level = 5;
    f.state().currency.gold = 30000;
    const deck = building('platform', 'visitor-viewing-platform', 12, 10);
    deck.level = 2;
    f.state().park.buildings.push(deck);
    f.stock('wood', 120);
    f.stock('stone', 120);
    f.stock('metal', 40);
    expect((await f.service.getResources('user')).platformUpgrade?.reason).toContain('수령하면');
    await expect(f.buildings.upgrade('platform', 'user', 3)).rejects.toThrow('수령하면');
    f.state().heroClaimedAt = new Date(AT);
    await expect(f.buildings.upgrade('platform', 'user', 4)).rejects.toThrow('다음 레벨');
    for (const [level, gold, wood, stone, metal, seconds, targetCapacity] of [
      [3, 4000, 30, 20, 10, 120, 60],
      [4, 5700, 30, 20, 10, 300, 80],
      [5, 7800, 46, 23, 12, 600, 100],
    ]) {
      expect((await f.service.getResources('user')).platformUpgrade).toMatchObject({
        level: level - 1,
        targetLevel: level,
        available: true,
        cost: { gold, wood, stone, metal },
        seconds,
        targetCapacity,
      });
      const beginsAt = Date.now();
      const [started, repeated] = await Promise.all([
        f.buildings.upgrade('platform', 'user', level),
        f.buildings.upgrade('platform', 'user', level),
      ]);
      expect(started).toMatchObject({ level, status: 'UPGRADING', goldSpent: gold });
      expect(repeated).toMatchObject({ level, status: 'UPGRADING', goldSpent: 0 });
      expect((await f.service.getResources('user')).platformUpgrade).toMatchObject({
        level: level - 1,
        targetLevel: level,
        available: false,
        completesAt: new Date(beginsAt + seconds * 1000).toISOString(),
      });
      await expect(f.buildings.instantComplete('platform', 'user')).rejects.toThrow('공사 시간');
      jest.setSystemTime(beginsAt + seconds * 1000);
      expect(await f.buildings.upgrade('platform', 'user', level)).toMatchObject({
        level,
        status: 'ACTIVE',
        goldSpent: 0,
      });
    }
    expect((await f.service.getResources('user')).platformUpgrade).toMatchObject({
      level: 5,
      targetLevel: null,
      available: false,
      completesAt: null,
    });
    expect(f.state().currency.gold).toBe(12500);
    expect(f.state().inventory.map(({ amount }) => amount)).toEqual([14, 57, 8]);
    expect(f.state().transactions).toHaveLength(3);
  });

  it('allows the second builder after the first claim and charges nothing for a missing metal cost', async () => {
    const f = fixture();
    f.state().park.level = 5;
    f.state().heroClaimedAt = new Date(AT);
    const deck = building('platform', 'visitor-viewing-platform', 12, 10);
    deck.level = 2;
    f.state().park.buildings.push(deck);
    const lumber = f.state().park.buildings.find(({ id }) => id === 'lumber')!;
    lumber.status = 'CONSTRUCTING';
    lumber.completesAt = new Date(AT + 600000);
    f.stock('wood', 30);
    f.stock('stone', 20);
    f.stock('metal', 9);
    await expect(f.buildings.upgrade('platform', 'user', 3)).rejects.toThrow('금속');
    expect(f.state().transactions).toHaveLength(0);
    expect(f.state().inventory.map(({ amount }) => amount)).toEqual([30, 20, 9]);
    f.state().inventory[2].amount = 10;
    expect((await f.service.getResources('user')).platformUpgrade?.available).toBe(true);
    await expect(f.buildings.upgrade('platform', 'user', 3)).resolves.toMatchObject({
      level: 3,
      goldSpent: 4000,
    });
  });

  it('uses completed warehouse capacity for larger purchases and raises it at the upgrade boundary', async () => {
    const { service, state } = fixture();
    const before = getResearchFacilityUpgrade(RESEARCH_STORAGE_ID, 1)!.effect;
    const after = getResearchFacilityUpgrade(RESEARCH_STORAGE_ID, 2)!.effect;
    const finish = AT + 60_000;
    state().currency.gold = 100_000;
    state().park.buildings.push({
      ...building('warehouse', RESEARCH_STORAGE_ID, 2, 2),
      level: 2,
      status: 'UPGRADING',
      completesAt: new Date(finish),
    });

    await expect(service.purchase('user', 'wood', before)).resolves.toMatchObject({
      capacityPerMaterial: before,
    });
    await expect(service.purchase('user', 'wood', 1)).rejects.toThrow('보관 한도');
    jest.setSystemTime(finish);
    await expect(service.purchase('user', 'wood', after - before)).resolves.toMatchObject({
      capacityPerMaterial: after,
      inventory: expect.arrayContaining([
        { material: 'wood', name: '목재', amount: after, buyPrice: 20 },
      ]),
    });
  });
});
