import { SECURITY_CENTER_TYPE_ID } from '@dino-park/game-data';
import type { Prisma } from '@prisma/client';
import {
  emptySafariLayout,
  getSafariDinosaurPositions,
  getSafariExpansionGold,
  getSafariGate,
  getSafariTour,
  inspectSafariLayout,
  isSafariRouteUsable,
  type SafariLayout,
  type SafariTile,
} from '@dino-park/shared';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ResourcesService } from '../resources/resources.service';
import { AT, building, dinosaur, world } from './park-admission.fixtures';
import { parkExhibitRiskPoints } from './park-admission.logic';
import { ParkOperationsService } from './park-operations.service';
import { ParkSafariService } from './park-safari.service';

const bounds = { width: 20, height: 20 };

function rectangle(x: number, y: number, width: number, height: number): SafariTile[] {
  return Array.from({ length: width * height }, (_, i) => ({
    x: x + (i % width),
    y: y + Math.floor(i / width),
  }));
}

function twoEnclosures(): SafariLayout {
  const layout = emptySafariLayout();
  layout.zones.herbivore.tiles = rectangle(2, 2, 3, 3);
  layout.zones.herbivore.dinosaurIds = ['stego'];
  layout.zones.carnivore.tiles = rectangle(11, 2, 8, 6);
  layout.zones.carnivore.dinosaurIds = ['trex'];
  layout.zones.carnivore.water = [{ x: 14, y: 2 }];
  layout.zones.carnivore.brush = [{ x: 12, y: 2 }];
  layout.stops = [
    { x: 5, y: 3 },
    { x: 11, y: 2 },
  ];
  return layout;
}

function legacyEnclosures(): SafariLayout {
  const layout = twoEnclosures();
  layout.zones.carnivore.tiles = rectangle(11, 2, 4, 3);
  return layout;
}

function setup() {
  const park = {
    ...world(),
    id: 'park',
    level: 10,
    technologyResearch: [],
    safariLayout: null as Prisma.JsonValue,
  };
  park.buildings.push(building('security', SECURITY_CENTER_TYPE_ID, 6, 12));
  park.dinosaurs.push(
    { ...dinosaur('stego', 'stegosaurus'), positionX: 8, positionY: 8 },
    { ...dinosaur('trex', 'tyrannosaurus-rex'), isInPark: false },
    { ...dinosaur('other-trex', 'tyrannosaurus-rex'), isInPark: false },
  );
  const currency = { gold: 10000 };
  const tx = {
    park: {
      findUniqueOrThrow: jest.fn(async () => park),
      update: jest.fn(async ({ data }: { data: { safariLayout: Prisma.JsonValue } }) => {
        park.safariLayout = data.safariLayout;
      }),
    },
    currency: { findUniqueOrThrow: jest.fn(async () => currency) },
    dinosaur: {
      updateMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        for (const item of park.dinosaurs) {
          if (where.id.in.includes(item.id)) item.isInPark = false;
        }
      }),
    },
  };
  const prisma = {
    $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
  const operations = {
    settleInTransaction: jest.fn(async () => ({ settledAt: new Date(AT) })),
  } as unknown as ParkOperationsService;
  const spendGold = jest.fn(async (_tx: typeof tx, _userId: string, amount: number) => {
    currency.gold -= amount;
  });
  const service = new ParkSafariService(prisma, operations, {
    spendGold,
  } as unknown as ResourcesService);
  return { service, park, tx, spendGold };
}

describe('safari layout and sightseeing', () => {
  it('keeps the same jeep route while a moved watering spot makes the animal visible', () => {
    const layout = twoEnclosures();
    const { path, issue } = inspectSafariLayout(layout, bounds, []);
    expect(issue).toBeNull();
    const gate = { outside: { x: 10, y: 5 }, inside: { x: 11, y: 5 } };
    expect(getSafariGate(layout, path)).toEqual(gate);
    const interior = [
      { x: 11, y: 5 },
      { x: 11, y: 4 },
      { x: 11, y: 3 },
      { x: 11, y: 2 },
    ];
    expect(path.slice(-4)).toEqual(interior);
    const tour = getSafariTour(layout, path);
    expect(tour?.gate).toEqual(gate);
    expect(tour?.views[1]).toMatchObject({
      sightings: [],
      hiddenCount: 1,
    });

    const nearWater = { x: 12, y: 3 };
    layout.zones.carnivore.water = [nearWater];
    expect(isSafariRouteUsable(layout, bounds, [], path)).toBe(true);
    expect(getSafariTour(layout, path)?.views[1]).toMatchObject({
      sightings: [{ dinosaurId: 'trex', tile: nearWater, behavior: 'drinking' }],
      hiddenCount: 0,
    });
  });

  it('routes around props inside the fence and keeps the dinosaur out of jeep lanes', () => {
    const layout = twoEnclosures();
    const original = inspectSafariLayout(layout, bounds, []).path;
    layout.zones.carnivore.brush.push({ x: 11, y: 5 });
    expect(isSafariRouteUsable(layout, bounds, [], original)).toBe(false);
    const { path, issue } = inspectSafariLayout(layout, bounds, []);
    expect(issue).toBeNull();
    expect(path).not.toContainEqual({ x: 11, y: 5 });
    expect(path).not.toContainEqual({ x: 14, y: 2 });
    expect(getSafariGate(layout, path)).not.toBeNull();
    const [dinosaur] = getSafariDinosaurPositions(layout.zones.carnivore, path);
    expect(dinosaur.dinosaurId).toBe('trex');
    expect(path).not.toContainEqual(dinosaur.tile);

    layout.zones.carnivore.brush.push({ x: 11, y: 3 });
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('출입문');
  });

  it('rejects disconnected cells, enclosed gaps, existing facilities and blocked lanes', () => {
    const layout = twoEnclosures();
    layout.zones.herbivore.tiles.push({ x: 1, y: 1 });
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('변이');
    layout.zones.herbivore.tiles = rectangle(1, 1, 4, 4).filter(({ x, y }) => x !== 2 || y !== 2);
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('빈 칸');
    layout.zones.herbivore.tiles = rectangle(2, 2, 3, 3);
    expect(inspectSafariLayout(layout, bounds, [{ x: 2, y: 2 }]).issue).toContain('겹치지');
    expect(inspectSafariLayout(layout, bounds, rectangle(7, 0, 1, 20)).issue).toContain('빈 통로');
    layout.stops[1] = { x: 10, y: 3 };
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('육식 우리 안');
    layout.stops[1] = { x: 14, y: 2 };
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('물가와 수풀');
  });

  it('requires 48 paid cells and a span of six along both axes for a new carnivore pen', () => {
    const layout = twoEnclosures();
    layout.zones.carnivore.tiles = rectangle(10, 2, 6, 6);
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('최소 48칸');
    layout.zones.carnivore.tiles = rectangle(8, 2, 12, 4);
    expect(inspectSafariLayout(layout, bounds, []).issue).toContain('각각 6칸');
    layout.zones.carnivore.tiles = rectangle(11, 2, 8, 6);
    expect(inspectSafariLayout(layout, bounds, []).issue).toBeNull();
  });
});

describe('saved park safari', () => {
  it('charges once, transfers animals, protects the cells and retains purchased area', async () => {
    const { service, park, spendGold } = setup();
    const layout = twoEnclosures();
    layout.zones.herbivore.tiles.push({ x: 1, y: 2 });
    const original = await service.save('user', 0, layout);
    expect(original.revision).toBe(1);
    expect(original.gold).toBe(3040);
    expect(original.purchasedTiles).toEqual({ herbivore: 10, carnivore: 48 });
    expect(park.dinosaurs.find(({ id }) => id === 'stego')?.isInPark).toBe(false);
    expect(parkExhibitRiskPoints(park, AT)).toBe(1);

    const operations = new ParkOperationsService({} as PrismaService);
    expect(operations.positionFree(park, null, 2, 2)).toBe(false);
    expect(operations.positionFree(park, null, 8, 3)).toBe(false);
    expect(operations.positionFree(park, null, 1, 0)).toBe(true);

    expect(await service.save('user', 0, layout)).toEqual(original);
    const shrink = twoEnclosures();
    expect(getSafariExpansionGold(shrink, original.purchasedTiles)).toBe(0);
    const shrunk = await service.save('user', 1, shrink);
    expect(shrunk.purchasedTiles.herbivore).toBe(10);
    expect(shrunk.gold).toBe(original.gold);
    expect(spendGold).toHaveBeenCalledTimes(1);
  });

  it('rejects a stale edit before spending or replacing the layout', async () => {
    const { service, tx, spendGold } = setup();
    await service.save('user', 0, twoEnclosures());
    const edited = twoEnclosures();
    edited.zones.carnivore.water = [];
    await expect(service.save('user', 0, edited)).rejects.toMatchObject({ status: 409 });
    expect(tx.park.update).toHaveBeenCalledTimes(1);
    expect(spendGold).toHaveBeenCalledTimes(1);
  });

  it('moves a legacy outdoor stop into the existing paid enclosure without charging again', async () => {
    const { service, park, tx, spendGold } = setup();
    const legacy = legacyEnclosures();
    legacy.stops[1] = { x: 10, y: 3 };
    park.safariLayout = {
      revision: 5,
      layout: legacy,
      path: rectangle(5, 3, 6, 1),
      purchasedTiles: { herbivore: 11, carnivore: 16 },
    } as unknown as Prisma.JsonValue;
    park.dinosaurs.forEach((occupant) => {
      occupant.isInPark = false;
    });

    const migrated = await service.get('user');
    expect(migrated.layout.zones).toEqual(legacy.zones);
    expect(migrated.layout.stops[0]).toEqual(legacy.stops[0]);
    expect(legacy.zones.carnivore.tiles).toContainEqual(migrated.layout.stops[1]);
    expect(migrated.tour?.gate).not.toBeNull();
    expect(migrated.gold).toBe(10000);
    expect(migrated.purchasedTiles).toEqual({ herbivore: 11, carnivore: 16 });
    expect(migrated.revision).toBe(6);
    expect(await service.get('user')).toEqual(migrated);
    expect(tx.park.update).toHaveBeenCalledTimes(1);
    await expect(service.save('user', 6, legacy)).rejects.toThrow('육식 우리 안');
    expect(spendGold).not.toHaveBeenCalled();
  });

  it('keeps paid land and props when an old tour cannot find any safe entry', async () => {
    const { service, park, spendGold } = setup();
    const legacy = legacyEnclosures();
    legacy.stops[1] = { x: 10, y: 3 };
    legacy.zones.carnivore.water = [];
    legacy.zones.carnivore.brush = [...legacy.zones.carnivore.tiles];
    park.safariLayout = {
      revision: 5,
      layout: legacy,
      path: rectangle(5, 3, 6, 1),
      purchasedTiles: { herbivore: 11, carnivore: 16 },
    } as unknown as Prisma.JsonValue;
    park.dinosaurs.forEach((occupant) => {
      occupant.isInPark = false;
    });

    const migrated = await service.get('user');
    expect(migrated.layout.zones).toEqual(legacy.zones);
    expect(migrated.layout.stops).toEqual([]);
    expect(migrated.tour).toBeNull();
    expect(migrated.purchasedTiles).toEqual({ herbivore: 11, carnivore: 16 });
    expect(spendGold).not.toHaveBeenCalled();
  });

  it('keeps paid small enclosures expandable until they are upgraded or removed', async () => {
    const { service, park, spendGold } = setup();
    const legacy = legacyEnclosures();
    const legacySize = { existingCarnivoreTiles: legacy.zones.carnivore.tiles };
    const path = inspectSafariLayout(legacy, bounds, [], legacySize).path;
    const gate = getSafariGate(legacy, path);
    expect(path.slice(-3)[0]).toEqual(gate?.inside);
    park.safariLayout = {
      revision: 5,
      layout: legacy,
      path,
      purchasedTiles: { herbivore: 9, carnivore: 12 },
    } as unknown as Prisma.JsonValue;
    park.dinosaurs.forEach((occupant) => {
      occupant.isInPark = false;
    });

    const edited = legacyEnclosures();
    edited.zones.carnivore.water = [{ x: 13, y: 2 }];
    expect((await service.save('user', 5, edited)).tour?.path).toEqual(path);
    expect(spendGold).not.toHaveBeenCalled();

    const moved = legacyEnclosures();
    moved.zones.carnivore.tiles = rectangle(11, 3, 4, 3);
    await expect(service.save('user', 6, moved)).rejects.toThrow('최소 48칸');
    edited.zones.carnivore.tiles.push({ x: 15, y: 3 });
    const widened = await service.save('user', 6, edited);
    expect(widened.gold).toBe(9880);
    expect(widened.purchasedTiles.carnivore).toBe(13);

    const cleared = await service.save('user', 7, emptySafariLayout());
    expect(cleared.purchasedTiles.carnivore).toBe(13);
    await expect(service.save('user', 8, legacy)).rejects.toThrow('최소 48칸');
    expect(spendGold).toHaveBeenCalledTimes(1);
  });

  it('extends an old two-move route in a big pen at no cost and keeps the existing stop', async () => {
    const { service, park, spendGold } = setup();
    const layout = twoEnclosures();
    const shortPath = [
      ...rectangle(5, 3, 6, 1),
      { x: 10, y: 4 },
      { x: 11, y: 4 },
      { x: 11, y: 3 },
      { x: 11, y: 2 },
    ];
    park.safariLayout = {
      revision: 5,
      layout,
      path: shortPath,
      purchasedTiles: { herbivore: 9, carnivore: 48 },
    } as unknown as Prisma.JsonValue;
    park.dinosaurs.forEach((occupant) => {
      occupant.isInPark = false;
    });

    const upgraded = await service.get('user');
    expect(upgraded.layout.stops).toEqual(layout.stops);
    expect(upgraded.tour?.path.slice(-4)[0]).toEqual(upgraded.tour?.gate.inside);
    expect(upgraded.tour?.path).not.toEqual(shortPath);
    expect(spendGold).not.toHaveBeenCalled();
  });

  it('requires ownership, correct diet and secure solo housing for the carnivore', async () => {
    const { service, park, spendGold } = setup();
    const assigned = twoEnclosures();
    assigned.zones.herbivore.dinosaurIds = ['not-owned'];
    await expect(service.save('user', 0, assigned)).rejects.toThrow('보유 공룡');
    assigned.zones.herbivore.dinosaurIds = ['trex'];
    await expect(service.save('user', 0, assigned)).rejects.toThrow('보유 공룡');
    assigned.zones.herbivore.dinosaurIds = ['stego'];
    assigned.zones.carnivore.dinosaurIds.push('other-trex');
    await expect(service.save('user', 0, assigned)).rejects.toThrow('한 마리');
    assigned.zones.carnivore.dinosaurIds = ['trex'];
    park.buildings = park.buildings.filter(({ id }) => id !== 'security');
    await expect(service.save('user', 0, assigned)).rejects.toThrow('보안센터');
    expect(spendGold).not.toHaveBeenCalled();
  });
});
