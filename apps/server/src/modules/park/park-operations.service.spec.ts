import { ParkOperationsService } from './park-operations.service';
import { ParkShuttleService } from './park-shuttle.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { AT, world, building, dinosaur } from './park-admission.fixtures';
import { admissionSnapshot, currentDinosaurState } from './park-admission.logic';
import { MARINE_OBSERVATION_FLAG } from '../story/story-scene-gates';
import { emptySafariLayout } from '@dino-park/shared';
import {
  GOLD_VAULT_ID,
  getResearchFacilityUpgrade,
  PARK_GROWTH_OPERATIONS_MILESTONES,
} from '@dino-park/game-data';

function setup() {
  const park = {
    ...world(),
    id: 'park',
    userId: 'user',
    level: 1,
    exp: 0,
    economySettledAt: new Date(AT),
    onlineUntil: new Date(AT + 3600000),
    visitorRemainder: 0,
    visitorDepartures: [] as number[],
    maintenanceRemainder: 0,
    totalVisitors: 0,
    totalAdmissionGold: 0,
    firstVisitorsRewarded: false,
  };
  const currency = { gold: 10000 };
  const storyFlags = new Set<string>();
  const patch = (target: object, data: Record<string, unknown>) => {
    for (const [field, value] of Object.entries(data)) {
      (target as Record<string, unknown>)[field] =
        value && typeof value === 'object' && 'increment' in value
          ? Number((target as Record<string, unknown>)[field]) + Number(value.increment)
          : value;
    }
    return target;
  };
  const tx = {
    $queryRaw: jest.fn(),
    park: {
      findUnique: jest.fn(async () => park),
      findUniqueOrThrow: jest.fn(async () => park),
      update: jest.fn(async ({ data }) => patch(park, data)),
    },
    currency: {
      findUniqueOrThrow: jest.fn(async () => currency),
      update: jest.fn(async ({ data }) => patch(currency, data)),
      updateMany: jest.fn(async ({ where, data }) => {
        if (currency.gold < where.gold.gte) return { count: 0 };
        currency.gold -= data.gold.decrement;
        return { count: 1 };
      }),
    },
    transaction: { create: jest.fn() },
    storyFlag: {
      findMany: jest.fn(async ({ where }) =>
        where.flagId.in
          .filter((id: string) => storyFlags.has(id))
          .map((flagId: string) => ({ flagId })),
      ),
      createMany: jest.fn(async ({ data }) => {
        for (const { flagId } of data) storyFlags.add(flagId);
      }),
    },
    building: {
      update: jest.fn(async ({ where, data }) => {
        const found = park.buildings.find(({ id }) => id === where.id);
        return found ? patch(found, data) : null;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        park.buildings.filter((b) => where.id.in.includes(b.id)).forEach((b) => patch(b, data));
      }),
    },
    dinosaur: {
      update: jest.fn(async ({ where, data }) => {
        const found = park.dinosaurs.find(({ id }) => id === where.id);
        return found ? patch(found, data) : null;
      }),
    },
  };
  const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) };
  const service = new ParkOperationsService(prisma as unknown as PrismaService);
  const resources = new ResourcesService(prisma as unknown as PrismaService, service);
  const shuttle = new ParkShuttleService(prisma as unknown as PrismaService, service, resources);
  const settle = (seconds: number) =>
    service.settleInTransaction(tx as never, 'user', false, new Date(AT + seconds * 1000));
  return { service, shuttle, settle, tx, park, currency, storyFlags };
}

describe('park shuttle operations', () => {
  const oneBus = { busCount: 1, departureIntervalSeconds: 30 } as const;
  const twoBuses = { ...oneBus, busCount: 2 };

  beforeEach(() => jest.useFakeTimers().setSystemTime(AT));
  afterEach(() => jest.useRealTimers());

  function midwayPark() {
    const s = setup();
    s.park.level = 10;
    s.park.firstVisitorsRewarded = true;
    s.park.buildings.push(building('far', 'habitat-grassland', 2, 2));
    s.park.dinosaurs.push({ ...dinosaur('trike', 'triceratops'), positionX: 3, positionY: 3 });
    s.currency.gold = 20_000;
    return s;
  }

  it('requires the midway level, connected exhibits and enough gold for a bus purchase', async () => {
    const s = setup();
    await expect(s.shuttle.buyVehicle('user', 'request')).rejects.toThrow('파크 Lv.10');
    s.park.level = 10;
    await expect(s.shuttle.buyVehicle('user', 'request')).rejects.toThrow('전시를 2곳');
    const eligible = midwayPark();
    eligible.currency.gold = 5_999;
    await expect(eligible.shuttle.buyVehicle('user', 'request')).rejects.toThrow('골드가 부족');
    expect(eligible.currency.gold).toBe(5_999);
    expect(eligible.park.shuttleService).toBeUndefined();
    expect(eligible.tx.transaction.create).not.toHaveBeenCalled();
  });

  it('charges once per purchase and rejects assignment beyond the number of purchased buses', async () => {
    const s = midwayPark();
    expect((await s.shuttle.buyVehicle('user', 'request')).shuttle).toMatchObject({
      ownedBusCount: 1,
      unassignedBusCount: 1,
      destinations: [{ exhibitId: 'far', distance: 19 }],
    });
    await s.shuttle.buyVehicle('user', 'request');
    expect(s.currency.gold).toBe(14_000);
    expect(s.tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(s.tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: -6_000,
        balanceAfter: 14_000,
        reason: '셔틀버스 구매',
      }),
    });
    await expect(s.shuttle.setRoute('user', 'far', twoBuses)).rejects.toThrow('차량을 회수');
    await expect(s.shuttle.setRoute('user', 'grass', oneBus)).rejects.toThrow('먼 전시');

    await s.shuttle.setRoute('user', 'far', oneBus);
    s.park.dinosaurs.pop();
    expect((await s.service.getOperations('user')).shuttle?.destinations[0].route).toMatchObject({
      status: 'disconnected',
      estimate: null,
    });
    const released = await s.shuttle.setRoute('user', 'far', { ...oneBus, busCount: 0 });
    expect(released.shuttle).toMatchObject({
      unlocked: false,
      ownedBusCount: 1,
      unassignedBusCount: 1,
      destinations: [],
    });
  });

  it('reduces the distant exhibit travel penalty and adds settled upkeep only while operating', async () => {
    const s = midwayPark();
    const control = midwayPark();
    const before = await s.service.getOperations('user');
    await s.shuttle.buyVehicle('user', 'first');
    await s.shuttle.buyVehicle('user', 'second');
    const after = await s.shuttle.setRoute('user', 'far', twoBuses);
    const route = after.shuttle!.destinations[0].route!;
    expect(route.status).toBe('running');
    expect(route.estimate).toMatchObject({ departureIntervalSeconds: 50, hourlyGold: 144 });
    expect(after.hourlyMaintenance - before.hourlyMaintenance).toBe(144);
    expect(
      after.admission!.exhibits.find(({ id }) => id === 'far')!.satisfactionPercent,
    ).toBeGreaterThan(
      before.admission!.exhibits.find(({ id }) => id === 'far')!.satisfactionPercent,
    );
    expect(after.admission!.exhibits.find(({ id }) => id === 'grass')).toEqual(
      before.admission!.exhibits.find(({ id }) => id === 'grass'),
    );
    expect(after.visitorsPerMinute).toBe(before.visitorsPerMinute);
    expect(after.occupancy?.capacity).toBe(before.occupancy?.capacity);

    s.park.onlineUntil = control.park.onlineUntil = new Date(AT + 60_000);
    const operating = await s.settle(60);
    const withoutBus = await control.settle(60);
    expect(operating.maintenance - withoutBus.maintenance).toBeGreaterThanOrEqual(2);
    expect(operating.gross).toBe(withoutBus.gross);
    jest.setSystemTime(AT + 60_000);
    const closed = await s.service.setOpen('user', false);
    await control.service.setOpen('user', false);
    expect(closed.shuttle?.destinations[0].route?.status).toBe('closed');
    expect(closed.hourlyMaintenance).toBe(before.hourlyMaintenance);
    s.park.onlineUntil = control.park.onlineUntil = new Date(AT + 3_660_000);
    expect((await s.settle(3660)).maintenance).toBe((await control.settle(3660)).maintenance);
  });
});

describe('entrance orientation', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(AT));
  afterEach(() => jest.useRealTimers());

  it('persists a corner rotation without moving the gate and reroutes visitors to its new exit', async () => {
    const s = setup();
    const entrance = s.park.buildings.find(({ id }) => id === 'gate')!;
    Object.assign(entrance, { positionX: 16, positionY: 16 });

    expect((await s.service.getOperations('user')).entrance).toMatchObject({ side: 'bottom' });
    expect(admissionSnapshot(s.park, AT).visitorPaths.get('grass')?.[0]).toEqual({ x: 18, y: 15 });

    const rotated = await s.service.moveEntrance('user', 16, 16, 'right');
    expect(rotated.entrance).toMatchObject({ x: 16, y: 16, side: 'right' });
    expect(entrance.entranceSide).toBe('right');
    expect(admissionSnapshot(s.park, AT).visitorPaths.get('grass')?.[0]).toEqual({ x: 15, y: 18 });
    expect((await s.service.getOperations('user')).entrance).toMatchObject({ side: 'right' });

    const legacySamePlot = await s.service.moveEntrance('user', 16, 16);
    expect(legacySamePlot.entrance).toMatchObject({ side: 'right' });
    const legacyOtherPlot = await s.service.moveEntrance('user', 11, 16);
    expect(legacyOtherPlot.entrance).toMatchObject({ x: 11, y: 16, side: 'bottom' });
    expect(entrance.entranceSide).toBe('bottom');
  });

  it('rejects a direction that does not touch the boundary at the chosen plot', async () => {
    const s = setup();
    await expect(s.service.moveEntrance('user', 11, 16, 'right')).rejects.toThrow(
      '선택한 방향이 파크 테두리에 닿지 않아요.',
    );
    expect(s.tx.building.update).not.toHaveBeenCalled();
  });

  it('rejects rotating an open park onto an obstructed exit', async () => {
    const s = setup();
    const entrance = s.park.buildings.find(({ id }) => id === 'gate')!;
    Object.assign(entrance, { positionX: 16, positionY: 16, entranceSide: 'bottom' });
    s.park.buildings.push(building('obstacle', 'amenity-bench', 15, 18));

    expect(admissionSnapshot(s.park, AT).canOpen).toBe(true);
    await expect(s.service.moveEntrance('user', 16, 16, 'right')).rejects.toThrow(
      '방문객 길이 이어지는 위치로 옮겨주세요.',
    );
    expect(s.tx.building.update).not.toHaveBeenCalled();
  });

  it('protects the safari lane when rotating the gate with the park closed', async () => {
    const s = setup();
    const entrance = s.park.buildings.find(({ id }) => id === 'gate')!;
    Object.assign(entrance, { positionX: 16, positionY: 16, entranceSide: 'bottom' });
    s.park.isOpen = false;
    s.park.safariLayout = { path: [{ x: 15, y: 18 }] };

    await expect(s.service.moveEntrance('user', 16, 16, 'right')).rejects.toThrow(
      '입구 안쪽 통로는 사파리 울타리와 지프길을 피해주세요.',
    );
    expect(s.tx.building.update).not.toHaveBeenCalled();
  });

  it('suggests a new gate location with an exit outside the safari after park expansion', async () => {
    const s = setup();
    s.park.gridSizeX = 28;
    s.park.gridSizeY = 28;
    s.park.isOpen = false;
    const layout = emptySafariLayout();
    layout.zones.herbivore.tiles = Array.from({ length: 9 }, (_, i) => ({
      x: 12 + (i % 3),
      y: 21 + Math.floor(i / 3),
    }));
    s.park.safariLayout = { layout: JSON.parse(JSON.stringify(layout)) };

    const { suggestedEntrance } = await s.service.getOperations('user');
    expect(suggestedEntrance).toEqual({ x: 9, y: 24 });
    const moved = await s.service.moveEntrance('user', suggestedEntrance!.x, suggestedEntrance!.y);
    expect(moved.entrance).toMatchObject({ x: 9, y: 24, side: 'bottom' });
  });
});

describe('server admission settlement', () => {
  it('records marine observation only once, after paid admissions reach a researched and safe exhibit', async () => {
    const s = setup();
    s.park.buildings.push(building('aquarium', 'habitat-marine-aquarium', 3, 7));
    s.park.dinosaurs.push({ ...dinosaur('aquatic', 'plesiosaurus'), positionX: 4, positionY: 8 });

    await s.settle(45);
    expect(s.park.totalVisitors).toBeGreaterThan(0);
    expect(s.storyFlags.has(MARINE_OBSERVATION_FLAG)).toBe(false);

    s.park.technologyResearch = [
      { technologyId: 'care-marine', level: 1, completesAt: new Date(AT + 45_000) },
    ];
    await s.settle(90);
    expect(s.storyFlags.has(MARINE_OBSERVATION_FLAG)).toBe(false);

    s.park.buildings.push({
      ...building('security', 'operation-security-center', 3, 3),
      createdAt: new Date(AT + 90_000),
    });
    const previous = s.park.totalVisitors;
    await s.settle(180);
    expect(s.park.totalVisitors).toBeGreaterThan(previous);
    expect(s.storyFlags.has(MARINE_OBSERVATION_FLAG)).toBe(true);

    await s.settle(300);
    expect(s.tx.storyFlag.createMany).toHaveBeenCalledTimes(1);
  });

  it('records both operations milestones reached together with valid exhibits, even after attendance drops', async () => {
    const s = setup();
    s.park.level = 6;
    s.park.firstVisitorsRewarded = true;
    s.park.onlineUntil = new Date(AT + 120_000);
    s.park.buildings.push(
      building('hybrid', 'habitat-hybrid-zone', 13, 5),
      building('second-grass', 'habitat-grassland', 5, 4),
      building('third-grass', 'habitat-grassland', 13, 10),
    );
    s.park.dinosaurs.push(
      { ...dinosaur('hybrid', 'stegoceratops'), positionX: 13, positionY: 5 },
      { ...dinosaur('trike', 'triceratops'), positionX: 6, positionY: 5 },
      { ...dinosaur('igua', 'iguanodon'), positionX: 14, positionY: 11 },
    );

    await s.settle(300);
    expect(s.park.visitorDepartures.length).toBeLessThan(50);
    expect(s.tx.storyFlag.createMany).toHaveBeenCalledWith({
      data: ([6, 7] as const).map((stage) => ({
        userId: 'user',
        flagId: PARK_GROWTH_OPERATIONS_MILESTONES[stage].flagId,
        value: true,
      })),
      skipDuplicates: true,
    });
  });

  it('retains operations attained after reaching Lv.8 through exploration without repeating writes', async () => {
    const s = setup();
    s.park.level = 8;
    s.park.firstVisitorsRewarded = true;
    s.park.buildings.push(
      building('hybrid', 'habitat-hybrid-zone', 13, 5),
      building('second-grass', 'habitat-grassland', 5, 4),
      building('third-grass', 'habitat-grassland', 13, 10),
    );
    s.park.dinosaurs.push(
      { ...dinosaur('hybrid', 'stegoceratops'), positionX: 13, positionY: 5 },
      { ...dinosaur('trike', 'triceratops'), positionX: 6, positionY: 5 },
      { ...dinosaur('igua', 'iguanodon'), positionX: 14, positionY: 11 },
    );

    const priorFlag = PARK_GROWTH_OPERATIONS_MILESTONES[6].flagId;
    const newFlag = PARK_GROWTH_OPERATIONS_MILESTONES[7].flagId;
    s.storyFlags.add(priorFlag);
    await s.settle(120);
    expect(s.park.visitorDepartures).toHaveLength(84);
    expect(s.tx.storyFlag.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'user', flagId: newFlag, value: true }],
      skipDuplicates: true,
    });
    await s.settle(130);
    s.park.isOpen = false;
    await s.settle(251);
    expect(s.park.visitorDepartures).toHaveLength(0);
    expect(s.storyFlags).toEqual(new Set([priorFlag, newFlag]));
    expect(s.tx.storyFlag.createMany).toHaveBeenCalledTimes(1);
  });

  it('does not award growth for attendees remaining when a park has already closed', async () => {
    const s = setup();
    s.park.level = 6;
    s.park.isOpen = false;
    s.park.buildings.push(
      building('hybrid', 'habitat-hybrid-zone', 13, 5),
      building('second-grass', 'habitat-grassland', 5, 4),
    );
    s.park.dinosaurs.push(
      { ...dinosaur('hybrid', 'stegoceratops'), positionX: 13, positionY: 5 },
      { ...dinosaur('trike', 'triceratops'), positionX: 6, positionY: 5 },
    );
    s.park.visitorDepartures = Array(50).fill(AT + 60_000);

    await s.settle(1);
    expect(s.park.visitorDepartures).toHaveLength(50);
    expect(s.tx.storyFlag.createMany).not.toHaveBeenCalled();
  });

  it('retains the original habitat completion boundary after settling the build', async () => {
    const s = setup();
    const hour = 3_600_000;
    const habitat = s.park.buildings.find(({ id }) => id === 'grass')!;
    habitat.status = 'CONSTRUCTING';
    habitat.completesAt = new Date(AT + hour);
    s.park.technologyResearch = [{ technologyId: 'care-adaptation', completesAt: new Date(AT) }];
    await s.settle(7_200);
    expect(habitat.status).toBe('ACTIVE');
    expect(habitat.completesAt).toBeNull();
    expect(s.park.dinosaurs[0].careProgress).toEqual({ at: AT + 2 * hour, savedMs: 72_000 });
    expect(currentDinosaurState(s.park.dinosaurs[0], AT + 2 * hour, s.park)).toMatchObject({
      hunger: 9,
    });
  });

  it('settles with identical earnings and visitors over the shifted decay boundaries', async () => {
    const whole = setup();
    const split = setup();
    for (const { park } of [whole, split]) {
      park.dinosaurs[0].happiness = 20;
      park.dinosaurs[0].hunger = 79;
      park.technologyResearch = [
        { technologyId: 'care-adaptation', completesAt: new Date(AT + 300_000) },
      ];
    }
    await whole.settle(3_600);
    for (const time of [300, 729, 1_455, 1_812, 2_100, 3_600]) await split.settle(time);
    expect(split.park.totalVisitors).toBe(whole.park.totalVisitors);
    expect(split.currency.gold).toBe(whole.currency.gold);
    expect(split.park.visitorRemainder).toBeCloseTo(whole.park.visitorRemainder, 7);
  });
  it('settles paid visitors once, keeps fractional residue, and awards the first ten XP once without moving existing borders', async () => {
    const s = setup();
    await s.settle(50);
    expect(s.park.totalVisitors).toBe(10);
    expect(s.park.totalAdmissionGold).toBe(200);
    expect(s.park.firstVisitorsRewarded).toBe(true);
    expect(s.park.level).toBe(2);
    expect(s.park.gridSizeX).toBe(20);
    const cash = s.currency.gold;
    await s.settle(50);
    expect(s.currency.gold).toBe(cash);
    expect(s.park.exp).toBe(0);
    await s.settle(51);
    expect(s.park.visitorRemainder).toBeCloseTo(0.2);
    expect(s.park.totalVisitors).toBe(10);
    expect(s.tx.$queryRaw).toHaveBeenCalled();
  });
  it('keeps settlement time monotonic when an older concurrent request reaches the lock later', async () => {
    const s = setup();
    await s.settle(60);
    const cash = s.currency.gold;
    const visitors = s.park.totalVisitors;
    await s.settle(30);
    expect(s.park.economySettledAt).toEqual(new Date(AT + 60000));
    expect(s.park.totalVisitors).toBe(visitors);
    expect(s.currency.gold).toBe(cash);
    await s.settle(61);
    expect(s.park.totalVisitors).toBe(12);
  });

  it('replaces departing guests with arrivals at the same time while keeping occupancy within 24', async () => {
    const s = setup();
    expect(await s.settle(120)).toMatchObject({ visitors: 24, gross: 480 });
    expect(s.park.visitorDepartures).toHaveLength(24);
    expect(s.park.visitorDepartures[0]).toBe(AT + 125000);
    expect((await s.settle(124)).visitors).toBe(0);
    expect(await s.settle(125)).toMatchObject({ visitors: 1, gross: 20 });
    expect(s.park.visitorDepartures).toHaveLength(24);
    expect(s.park.visitorDepartures[0]).toBe(AT + 130000);
    expect(s.park.visitorDepartures[s.park.visitorDepartures.length - 1]).toBe(AT + 245000);
  });

  it('drains stored visitors when closed, and no new tickets or queued traffic appear', async () => {
    const s = setup();
    await s.settle(60);
    s.park.isOpen = false;
    expect(s.park.visitorDepartures).toHaveLength(12);
    expect(await s.settle(125)).toMatchObject({ visitors: 0, gross: 0 });
    expect(s.park.visitorDepartures).toHaveLength(11);
    expect(await s.settle(180)).toMatchObject({ visitors: 0, gross: 0 });
    expect(s.park.visitorDepartures).toHaveLength(0);
    s.park.isOpen = true;
    expect(await s.settle(185)).toMatchObject({ visitors: 1, gross: 20 });
    expect(s.park.visitorDepartures).toEqual([AT + 305000]);
  });

  it('lets visitors leave while a full vault blocks new admissions', async () => {
    const s = setup();
    await s.settle(120);
    s.currency.gold = 25000;
    expect(await s.settle(125)).toMatchObject({ visitors: 0, gross: 0 });
    expect(s.park.visitorDepartures).toHaveLength(23);
    expect(s.park.visitorRemainder).toBe(0);
  });

  it('resumes admission above the initial gold cap when the vault upgrade becomes effective', async () => {
    const withVault = () => {
      const s = setup();
      s.currency.gold = 25_000;
      s.park.buildings.push({
        ...building('vault', GOLD_VAULT_ID, 2, 2),
        status: 'UPGRADING',
        level: 2,
        completesAt: new Date(AT + 60_000),
      });
      return s;
    };
    const single = withVault();
    const separate = withVault();
    await single.settle(120);
    expect(await separate.settle(60)).toMatchObject({ visitors: 0, gross: 0 });
    expect((await separate.settle(120)).visitors).toBeGreaterThan(0);
    expect(separate.park.totalAdmissionGold).toBe(single.park.totalAdmissionGold);
    expect(separate.currency.gold).toBe(single.currency.gold);
    expect(separate.currency.gold).toBeGreaterThan(25_000);
    expect(getResearchFacilityUpgrade(GOLD_VAULT_ID, 2)!.effect).toBeGreaterThan(
      separate.currency.gold,
    );
  });

  it('honors existing visitors when an exhibit becomes unavailable and never bills rejected traffic', async () => {
    const s = setup();
    const extra = building('hybrid', 'habitat-hybrid-zone', 13, 5);
    s.park.buildings.push(extra);
    const stego = { ...dinosaur('stego', 'stegoceratops'), positionX: 13, positionY: 5 };
    s.park.dinosaurs.push(stego);
    expect(await s.settle(120)).toMatchObject({ visitors: 44, gross: 880 });
    stego.isInPark = false;
    expect(await s.settle(175)).toMatchObject({ visitors: 0, gross: 0 });
    expect(s.park.visitorDepartures).toHaveLength(24);
    expect(await s.settle(180)).toMatchObject({ visitors: 1, gross: 20 });
    expect(s.park.visitorDepartures).toHaveLength(23);
    expect(s.park.totalVisitors).toBe(45);
  });

  it('starts legacy saves with historical totals and no fabricated current occupants', async () => {
    jest.useFakeTimers().setSystemTime(AT);
    try {
      const s = setup();
      Reflect.deleteProperty(s.park, 'visitorDepartures');
      s.park.totalVisitors = 150;
      s.park.totalAdmissionGold = 3000;
      s.park.firstVisitorsRewarded = true;
      const initial = await s.service.getOperations('user');
      expect(initial.occupancy).toEqual({ current: 0, capacity: 24, visitSeconds: 120 });
      expect(initial).toMatchObject({ totalVisitors: 150, totalAdmissionGold: 3000 });
      jest.setSystemTime(AT + 5000);
      expect(await s.service.getOperations('user')).toMatchObject({
        occupancy: { current: 1, capacity: 24, visitSeconds: 120 },
        totalVisitors: 151,
        totalAdmissionGold: 3020,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('preserves income and maintenance when polling is partitioned across care-state boundaries', async () => {
    const whole = setup(),
      split = setup();
    whole.park.buildings.push(building('deck', 'visitor-viewing-platform', 11, 10));
    split.park.buildings.push(building('deck', 'visitor-viewing-platform', 11, 10));
    await whole.settle(9999);
    for (let second = 17; second < 9999; second += 17) await split.settle(second);
    await split.settle(9999);
    expect(split.park.totalVisitors).toBe(whole.park.totalVisitors);
    expect(split.park.totalAdmissionGold).toBe(whole.park.totalAdmissionGold);
    expect(split.currency.gold).toBe(whole.currency.gold);
    expect(split.park.visitorRemainder).toBeCloseTo(whole.park.visitorRemainder, 8);
    expect(split.park.maintenanceRemainder).toBeCloseTo(whole.park.maintenanceRemainder, 8);
    expect(split.park.visitorDepartures).toEqual(whole.park.visitorDepartures);
  });
  it('uses offline 50% once and stops both income and maintenance at eight hours', async () => {
    const eight = setup(),
      day = setup();
    eight.park.onlineUntil = new Date(AT);
    day.park.onlineUntil = new Date(AT);
    await eight.settle(8 * 3600);
    await day.settle(24 * 3600);
    expect(day.park.totalVisitors).toBe(eight.park.totalVisitors);
    expect(day.currency.gold).toBe(eight.currency.gold);
    expect(day.park.visitorDepartures).toHaveLength(0);
    const cash = day.currency.gold;
    await day.settle(25 * 3600);
    expect(day.currency.gold).toBe(cash);
    const short = setup();
    short.park.onlineUntil = new Date(AT);
    await short.settle(60);
    expect(short.park.totalVisitors).toBe(6);
    expect(short.park.totalAdmissionGold).toBe(120);
  });

  it('continues departures after the offline earnings window ends', async () => {
    const s = setup();
    const end = 8 * 3600;
    s.park.onlineUntil = new Date(AT);
    s.park.economySettledAt = new Date(AT + (end - 10) * 1000);
    s.park.dinosaurs[0].lastFedAt = s.park.economySettledAt;
    expect(await s.settle(end)).toMatchObject({ visitors: 1, gross: 20 });
    expect(s.park.visitorDepartures).toHaveLength(1);
    expect(await s.settle(end + 119)).toMatchObject({ visitors: 0, gross: 0 });
    expect(s.park.visitorDepartures).toHaveLength(1);
    expect(await s.settle(end + 120)).toMatchObject({ visitors: 0, gross: 0 });
    expect(s.park.visitorDepartures).toHaveLength(0);
  });

  it('credits whole tickets and receipts, then resumes without paying for blocked visitors', async () => {
    const s = setup();
    s.currency.gold = 24975;
    expect(await s.settle(50)).toMatchObject({ visitors: 1, gross: 20, maintenance: 1 });
    expect(s.currency.gold).toBe(24994);
    expect(s.park).toMatchObject({
      totalVisitors: 1,
      totalAdmissionGold: 20,
      visitorRemainder: 0,
      firstVisitorsRewarded: false,
    });
    expect(s.tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'EARN', amount: 20, balanceAfter: 24995 }),
    });

    s.currency.gold -= 1000;
    expect(await s.settle(51)).toMatchObject({ visitors: 0, gross: 0 });
    expect(await s.settle(55)).toMatchObject({ visitors: 1, gross: 20 });
    expect(s.park.totalVisitors).toBe(2);
    expect(s.park.totalAdmissionGold).toBe(40);
  });

  it('preserves an existing over-cap balance while normal upkeep still applies', async () => {
    const s = setup();
    s.currency.gold = 60000;
    s.park.visitorRemainder = 0.9;
    expect(await s.settle(60)).toMatchObject({ visitors: 0, gross: 0, maintenance: 1 });
    expect(s.currency.gold).toBe(59999);
    expect(s.park.visitorRemainder).toBe(0);
    expect(s.tx.transaction.create).toHaveBeenCalledTimes(1);
  });

  it('only starts admitting again after upkeep has made room for a whole ticket', async () => {
    const s = setup();
    s.currency.gold = 24981;
    expect(await s.settle(42)).toMatchObject({ visitors: 0, gross: 0, maintenance: 1 });
    expect(s.currency.gold).toBe(24980);
    expect(await s.settle(43)).toMatchObject({ visitors: 1, gross: 20, maintenance: 0 });
    expect(s.currency.gold).toBe(25000);
  });

  it('posts aggregate upkeep before admission when that keeps reported balances within the limit', async () => {
    const s = setup();
    s.currency.gold = 25000;
    expect(await s.settle(900)).toMatchObject({ visitors: 1, gross: 20, maintenance: 23 });
    expect(s.tx.transaction.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({ type: 'SPEND', amount: -23, balanceAfter: 24977 }),
    });
    expect(s.tx.transaction.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ type: 'EARN', amount: 20, balanceAfter: s.currency.gold }),
    });
    expect(s.currency.gold).toBe(24997);
  });

  it('produces the same capped admissions and upkeep across online and offline polling partitions', async () => {
    const whole = setup();
    const split = setup();
    for (const s of [whole, split]) {
      s.currency.gold = 24955;
      s.park.onlineUntil = new Date(AT + 15000);
    }
    const day = 86400;
    await whole.settle(day);
    for (let second = 37; second < 28815; second += 37) await split.settle(second);
    await split.settle(day);
    expect(whole.park.totalVisitors).toBeGreaterThan(0);
    expect(whole.currency.gold).toBeLessThanOrEqual(25000);
    expect(split.currency.gold).toBe(whole.currency.gold);
    expect(split.park.totalVisitors).toBe(whole.park.totalVisitors);
    expect(split.park.totalAdmissionGold).toBe(whole.park.totalAdmissionGold);
    expect(split.park.visitorRemainder).toBeCloseTo(whole.park.visitorRemainder, 8);
    expect(split.park.maintenanceRemainder).toBeCloseTo(whole.park.maintenanceRemainder, 8);
    expect(await whole.settle(day + 3600)).toMatchObject({ visitors: 0, gross: 0, maintenance: 0 });
  });

  it('reports a paused vault independently of the operating admission estimate', async () => {
    jest.useFakeTimers().setSystemTime(AT);
    try {
      const s = setup();
      s.currency.gold = 24981;
      const paused = await s.service.getOperations('user');
      expect(paused.visitorsPerMinute).toBe(12);
      expect(paused.goldVault).toEqual({ capacity: 25000, admissionPaused: true });
      s.currency.gold = 24980;
      expect((await s.service.getOperations('user')).goldVault).toEqual({
        capacity: 25000,
        admissionPaused: false,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('integrates a finished deck upkeep at its timer boundary without changing admissions', async () => {
    const s = setup(),
      deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.status = 'CONSTRUCTING';
    deck.completesAt = new Date(AT + 30000);
    s.park.buildings.push(deck);
    await s.settle(60);
    expect(s.park.totalVisitors).toBe(12);
    expect(s.park.visitorRemainder).toBeCloseTo(0);
    expect(s.park.maintenanceRemainder).toBeCloseTo((95 + 115) / 120 - 1);
    expect(deck.status).toBe('ACTIVE');
    expect(deck.completesAt).toBeNull();
  });

  it('integrates a new occupied zone only after completion', async () => {
    const s = setup();
    const habitat = building('hybrid', 'habitat-hybrid-zone', 13, 5);
    habitat.status = 'CONSTRUCTING';
    habitat.completesAt = new Date(AT + 30000);
    s.park.buildings.push(habitat);
    s.park.dinosaurs.push({ ...dinosaur('stego', 'stegoceratops'), positionX: 13, positionY: 5 });
    expect(await s.settle(60)).toMatchObject({ visitors: 17, gross: 340 }); // 6 + 11
    expect(habitat.status).toBe('ACTIVE');
  });

  it('returns the effective local viewing experience through upgrade completion', async () => {
    jest.useFakeTimers().setSystemTime(AT);
    try {
      const s = setup(),
        deck = building('deck', 'visitor-viewing-platform', 11, 10);
      deck.level = 2;
      deck.status = 'UPGRADING';
      deck.completesAt = new Date(AT + 120000);
      s.park.buildings.push(deck);

      const upgrading = await s.service.getOperations('user');
      expect(upgrading.viewingPlatform).toEqual({
        id: 'deck',
        level: 2,
        status: 'UPGRADING',
        completesAt: new Date(AT + 120000).toISOString(),
      });
      expect(upgrading.capacity).toBe(12);
      expect(upgrading.admission?.platformImpact).toMatchObject({
        buildingId: 'deck',
        fromLevel: 1,
        toLevel: 2,
        exhibitId: 'grass',
        before: { crowdingPercent: 17, satisfactionPercent: 75 },
        after: { crowdingPercent: 0, satisfactionPercent: 85 },
      });

      jest.setSystemTime(AT + 120000);
      const completed = await s.service.getOperations('user');
      expect(completed.viewingPlatform).toEqual({
        id: 'deck',
        level: 2,
        status: 'ACTIVE',
        completesAt: null,
      });
      expect(completed.capacity).toBe(12);
      expect(completed.admission?.exhibits[0]).toMatchObject({
        crowdingPercent: 0,
        satisfactionPercent: 85,
      });
      expect(completed.admission?.platformImpact).toMatchObject({
        buildingId: 'deck',
        fromLevel: 2,
        toLevel: 3,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps receipts at the exhibit rate when a Lv.5 deck changes the upkeep', async () => {
    const s = setup();
    const deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.level = 5;
    deck.status = 'UPGRADING';
    deck.completesAt = new Date(AT + 60000);
    s.park.buildings.push(deck);
    s.park.dinosaurs[0].competitiveStats = { appeal: 45, speed: 50, stamina: 50, aggression: 50 };

    const before = admissionSnapshot(s.park, AT + 59999);
    const after = admissionSnapshot(s.park, AT + 60000);
    expect(before.capacity).toBe(12);
    expect(after.capacity).toBe(12);
    expect(after.hourlyMaintenance - before.hourlyMaintenance).toBe(4);

    const result = await s.settle(120);
    expect(result.visitors).toBe(24);
    expect(result.gross).toBe(480);
    expect(s.park.totalAdmissionGold).toBe(480);
    expect(deck.status).toBe('ACTIVE');
    expect((await s.settle(120)).gross).toBe(0);
  });

  it('raises the entrance cap only from the research completion timestamp', async () => {
    const s = setup();
    s.park.dinosaurs[0].competitiveStats = { appeal: 45, speed: 50, stamina: 50, aggression: 50 };
    const positions = [
      [0, 0],
      [4, 0],
      [8, 0],
      [12, 0],
      [16, 0],
      [0, 4],
      [4, 4],
      [8, 4],
      [12, 4],
      [16, 4],
    ];
    positions.forEach(([x, y], index) => {
      s.park.buildings.push(building(`habitat-${index}`, 'habitat-grassland', x, y));
      s.park.dinosaurs.push({
        ...dinosaur(`dino-${index}`),
        positionX: x + 1,
        positionY: y + 1,
      });
    });
    s.park.technologyResearch = [{ technologyId: 'ops-entry', completesAt: new Date(AT + 60000) }];

    expect(admissionSnapshot(s.park, AT + 59999).capacity).toBe(100);
    expect(admissionSnapshot(s.park, AT + 60000).capacity).toBe(104);
    const result = await s.settle(120);
    expect(result).toMatchObject({ visitors: 204, gross: 4080 });
  });
});
