import { ParkOperationsService } from './park-operations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AT, world, building } from './park-admission.fixtures';
import { admissionSnapshot } from './park-admission.logic';

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
    maintenanceRemainder: 0,
    totalVisitors: 0,
    totalAdmissionGold: 0,
    firstVisitorsRewarded: false,
  };
  const currency = { gold: 10000 };
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
    },
    transaction: { create: jest.fn() },
    building: {
      updateMany: jest.fn(async ({ where, data }) => {
        park.buildings.filter((b) => where.id.in.includes(b.id)).forEach((b) => patch(b, data));
      }),
    },
  };
  const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) };
  const service = new ParkOperationsService(prisma as unknown as PrismaService);
  const settle = (seconds: number) =>
    service.settleInTransaction(tx as never, 'user', false, new Date(AT + seconds * 1000));
  return { service, settle, tx, park, currency };
}

describe('server admission settlement', () => {
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
    const cash = day.currency.gold;
    await day.settle(25 * 3600);
    expect(day.currency.gold).toBe(cash);
    const short = setup();
    short.park.onlineUntil = new Date(AT);
    await short.settle(60);
    expect(short.park.totalVisitors).toBe(6);
    expect(short.park.totalAdmissionGold).toBe(120);
  });
  it('integrates a finished deck at its timer boundary rather than backdating capacity', async () => {
    const s = setup(),
      deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.status = 'CONSTRUCTING';
    deck.completesAt = new Date(AT + 30000);
    s.park.buildings.push(deck);
    await s.settle(60);
    expect(s.park.totalVisitors).toBe(15); // 6 before completion + 9.75 afterward.
    expect(s.park.visitorRemainder).toBeCloseTo(0.75);
    expect(deck.status).toBe('ACTIVE');
    expect(deck.completesAt).toBeNull();
  });

  it('returns the platform level with its effective capacity through upgrade completion', async () => {
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
      expect(upgrading.capacity).toBe(32);

      jest.setSystemTime(AT + 120000);
      const completed = await s.service.getOperations('user');
      expect(completed.viewingPlatform).toEqual({
        id: 'deck',
        level: 2,
        status: 'ACTIVE',
        completesAt: null,
      });
      expect(completed.capacity).toBe(52);
    } finally {
      jest.useRealTimers();
    }
  });

  it('settles high-demand admissions and the new platform upkeep at the Lv.5 completion boundary', async () => {
    const s = setup();
    const deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.level = 5;
    deck.status = 'UPGRADING';
    deck.completesAt = new Date(AT + 60000);
    s.park.buildings.push(deck);
    s.park.dinosaurs[0].competitiveStats = { appeal: 45, speed: 50, stamina: 50, aggression: 50 };

    const before = admissionSnapshot(s.park, AT + 59999);
    const after = admissionSnapshot(s.park, AT + 60000);
    expect(before.capacity).toBe(92);
    expect(after.capacity).toBe(100);
    expect(after.hourlyMaintenance - before.hourlyMaintenance).toBe(4);

    const result = await s.settle(120);
    expect(result.visitors).toBe(192);
    expect(result.gross).toBe(3840);
    expect(s.park.totalAdmissionGold).toBe(3840);
    expect(deck.status).toBe('ACTIVE');
    expect((await s.settle(120)).gross).toBe(0);
  });

  it('raises the entrance cap only from the research completion timestamp', async () => {
    const s = setup();
    const deck = building('deck', 'visitor-viewing-platform', 11, 10);
    deck.level = 5;
    s.park.buildings.push(deck);
    s.park.dinosaurs[0].competitiveStats = { appeal: 45, speed: 50, stamina: 50, aggression: 50 };
    s.park.technologyResearch = [{ completesAt: new Date(AT + 60000) }];

    expect(admissionSnapshot(s.park, AT + 59999).capacity).toBe(100);
    expect(admissionSnapshot(s.park, AT + 60000).capacity).toBe(104);
    const result = await s.settle(120);
    expect(result).toMatchObject({ visitors: 204, gross: 4080 });
  });
});
