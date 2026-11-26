import { ValidationPipe } from '@nestjs/common';
import { BuildingStatus, type Building, type Dinosaur } from '@prisma/client';
import {
  PARK_LEVEL_EIGHT_GROWTH,
  SECURITY_CENTER_TYPE_ID,
  getDinosaurById,
  getExperimentalHybridDesign,
} from '@dino-park/game-data';
import { Rarity } from '@dino-park/shared';
import type { PrismaService } from '../../prisma/prisma.service';
import { AT, building, dinosaur, world } from '../park/park-admission.fixtures';
import { ParkOperationsService } from '../park/park-operations.service';
import type { ResourcesService } from '../resources/resources.service';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';

function setup() {
  const center = {
    ...building('center', SECURITY_CENTER_TYPE_ID, 15, 9),
    park: { id: 'park', userId: 'owner', level: 7, buildings: [] },
  };
  const exhibitWorld: { buildings: Building[]; dinosaurs: Dinosaur[] } = {
    buildings: [center],
    dinosaurs: [],
  };
  const tx = {
    park: { findUniqueOrThrow: jest.fn(async () => exhibitWorld) },
    building: {
      findUnique: jest.fn(async () => center),
      update: jest.fn(async ({ data }) => {
        center.level += data.level.increment;
        center.status = data.status;
        center.completesAt = data.completesAt;
        return center;
      }),
      delete: jest.fn(),
    },
    firstSynthesisJob: { findFirst: jest.fn(async () => null) },
    currency: {
      updateMany: jest.fn(async () => ({ count: 1 })),
      findUniqueOrThrow: jest.fn(async () => ({ gold: 4000 })),
      update: jest.fn(),
    },
    storyFlag: { createMany: jest.fn() },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(async () => null as { amount: number } | null),
    },
  };
  const prisma = { ...tx, $transaction: jest.fn(async (run) => run(tx)) };
  const operations = { settleInTransaction: jest.fn(async () => ({ settledAt: new Date(AT) })) };
  const resources = { consumeMaterials: jest.fn() };
  const service = new BuildingService(
    prisma as unknown as PrismaService,
    operations as unknown as ParkOperationsService,
    resources as unknown as ResourcesService,
  );
  return { service, center, tx, resources, exhibitWorld };
}

describe('security center expansion', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(AT));
  afterEach(() => jest.useRealTimers());

  it('quotes and debits the canonical expansion cost once and runs for 150 seconds', async () => {
    const { service, tx, resources } = setup();
    expect(await service.getById('center', 'owner')).toMatchObject({ nextLevelCost: 6000 });
    expect(await service.upgrade('center', 'owner', 2)).toMatchObject({
      level: 2,
      status: BuildingStatus.UPGRADING,
      completesAt: new Date(AT + 150_000),
      goldSpent: 6000,
      upgradeTime: 150,
    });
    expect(await service.upgrade('center', 'owner', 2)).toMatchObject({ level: 2, goldSpent: 0 });
    expect(tx.currency.updateMany).toHaveBeenCalledTimes(1);
    expect(resources.consumeMaterials).toHaveBeenCalledTimes(1);
    expect(resources.consumeMaterials).toHaveBeenCalledWith(tx, 'park', { wood: 20, stone: 40 });
  });

  it('preserves a completed center as goal evidence and refunds the actual expansion price', async () => {
    const { service, center, tx } = setup();
    center.level = 2;
    tx.transaction.findUnique.mockResolvedValue({ amount: -6000 });
    expect(await service.demolish('center', 'owner')).toEqual({
      demolished: true,
      goldRefund: 13000,
    });
    expect(tx.storyFlag.createMany).toHaveBeenCalledWith({
      data: {
        userId: 'owner',
        flagId: PARK_LEVEL_EIGHT_GROWTH.completedSecurityCenterFlagId,
        value: true,
      },
      skipDuplicates: true,
    });
  });

  it('uses the legacy investment if the newer expansion receipt is missing', async () => {
    const { service, center } = setup();
    center.level = 2;
    expect(await service.demolish('center', 'owner')).toMatchObject({ goldRefund: 25000 });
  });

  it('preserves the last completed center while a risk species occupies a habitat without a visitor route', async () => {
    const { service, tx, exhibitWorld } = setup();
    exhibitWorld.buildings.push(building('desert', 'habitat-desert', 3, 3));
    exhibitWorld.dinosaurs.push({
      ...dinosaur('occupant', 'coelophysis'),
      positionX: 3,
      positionY: 3,
    });
    const replacement: Building = {
      ...building('replacement', SECURITY_CENTER_TYPE_ID, 6, 8),
      status: BuildingStatus.CONSTRUCTING,
      completesAt: new Date(AT + 180_000),
    };
    exhibitWorld.buildings.push(replacement);
    await expect(service.demolish('center', 'owner')).rejects.toThrow('위험 공룡을 먼저');
    expect(tx.building.delete).not.toHaveBeenCalled();
    expect(tx.currency.update).not.toHaveBeenCalled();

    replacement.status = BuildingStatus.ACTIVE;
    await expect(service.demolish('center', 'owner')).resolves.toMatchObject({ demolished: true });
    expect(tx.building.delete).toHaveBeenCalledWith({ where: { id: 'center' } });
  });
});

describe('building orientation', () => {
  function placementSetup() {
    const park = { ...world(), id: 'park', level: 6, userId: 'owner' };
    const bed = building('bed', 'decoration-flower-bed', 6, 6);
    const hybrid = building('hybrid', 'habitat-hybrid-zone', 13, 5);
    park.buildings.push(bed, hybrid);
    park.dinosaurs.push({
      ...dinosaur('hero', 'stegoceratops'),
      positionX: hybrid.positionX,
      positionY: hybrid.positionY,
    });

    const tx = {
      park: { findUnique: jest.fn(async () => park) },
      building: {
        findUnique: jest.fn(async ({ where: { id } }) => ({
          ...park.buildings.find((entry) => entry.id === id)!,
          park: { userId: park.userId },
        })),
        create: jest.fn(async ({ data }) => {
          const placed = {
            ...building('new-bed', data.typeId, data.positionX, data.positionY),
            ...data,
          };
          park.buildings.push(placed);
          return placed;
        }),
        update: jest.fn(
          async ({ where: { id }, data }: { where: { id: string }; data: Partial<Building> }) =>
            Object.assign(park.buildings.find((entry) => entry.id === id)!, data),
        ),
      },
      currency: {
        updateMany: jest.fn(async () => ({ count: 1 })),
        findUniqueOrThrow: jest.fn(async () => ({ gold: 4000 })),
      },
      transaction: { create: jest.fn() },
    };
    const prisma = {
      ...tx,
      $transaction: jest.fn(async (run) => run(tx)),
    } as unknown as PrismaService;
    const operations = new ParkOperationsService(prisma);
    jest.spyOn(operations, 'settleInTransaction').mockResolvedValue({
      visitors: 0,
      gross: 0,
      maintenance: 0,
      elapsedHours: 0,
      settledAt: new Date(AT),
    });
    const service = new BuildingService(prisma, operations, {} as ResourcesService);
    return { service, bed, tx, operations };
  }

  it('saves the chosen orientation on construction and returns it on later reads', async () => {
    const { service } = placementSetup();
    await expect(
      service.construct('owner', 'decoration-flower-bed', 5, 6, true),
    ).resolves.toMatchObject({
      id: 'new-bed',
      positionX: 5,
      positionY: 6,
      isMirrored: true,
    });
    await expect(service.getById('new-bed', 'owner')).resolves.toMatchObject({ isMirrored: true });
  });

  it('preserves orientation for old move requests and honors both explicit values', async () => {
    const { service, bed, tx } = placementSetup();
    await expect(service.move(bed.id, 'owner', 7, 6, true)).resolves.toMatchObject({
      positionX: 7,
      positionY: 6,
      isMirrored: true,
    });
    await expect(service.move(bed.id, 'owner', 5, 6)).resolves.toMatchObject({
      positionX: 5,
      positionY: 6,
      isMirrored: true,
    });
    expect(tx.building.update).toHaveBeenLastCalledWith({
      where: { id: bed.id },
      data: { positionX: 5, positionY: 6 },
    });
    await expect(service.move(bed.id, 'owner', 5, 6, false)).resolves.toMatchObject({
      positionX: 5,
      positionY: 6,
      isMirrored: false,
    });
    await expect(service.move(bed.id, 'owner', 8, 8, true)).rejects.toThrow('겹치지 않는');
    await expect(service.move(bed.id, 'owner', 20, 0, true)).rejects.toThrow('겹치지 않는');
    expect(bed).toMatchObject({ positionX: 5, positionY: 6, isMirrored: false });
  });

  it('allows flipping an occupied habitat while protecting it from relocation', async () => {
    const { service } = placementSetup();
    await expect(service.move('hybrid', 'owner', 13, 5, true)).resolves.toMatchObject({
      positionX: 13,
      positionY: 5,
      isMirrored: true,
    });
    await expect(service.move('hybrid', 'owner', 14, 5, false)).rejects.toThrow('배치 대기');
  });

  it('keeps entrance orientation on the park entrance endpoint and delegates legacy moves', async () => {
    const { service, operations } = placementSetup();
    const moveEntrance = jest.spyOn(operations, 'moveEntrance').mockImplementation();
    await expect(service.move('gate', 'owner', 11, 16, true)).rejects.toThrow('입구 방향');
    await expect(service.construct('owner', 'operation-entrance-gate', 5, 6, true)).rejects.toThrow(
      '입구 방향',
    );
    expect(moveEntrance).not.toHaveBeenCalled();
    await expect(service.move('gate', 'owner', 11, 16)).resolves.toMatchObject({ id: 'gate' });
    expect(moveEntrance).toHaveBeenCalledWith('owner', 11, 16);
  });

  it('validates optional JSON booleans without coercing strings to true', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const [, , metatype] = Reflect.getMetadata(
      'design:paramtypes',
      BuildingController.prototype,
      'moveBuilding',
    );
    const positions = { positionX: 6, positionY: 6 };
    const dto = { type: 'body' as const, metatype };
    await expect(pipe.transform(positions, dto)).resolves.toMatchObject(positions);
    await expect(pipe.transform({ ...positions, isMirrored: true }, dto)).resolves.toMatchObject({
      isMirrored: true,
    });
    await expect(pipe.transform({ ...positions, isMirrored: false }, dto)).resolves.toMatchObject({
      isMirrored: false,
    });
    await expect(pipe.transform({ ...positions, isMirrored: 'false' }, dto)).rejects.toThrow(
      'Bad Request',
    );
    await expect(pipe.transform({ ...positions, isMirrored: null }, dto)).rejects.toThrow(
      'Bad Request',
    );
  });
});

describe('exhibit placement preview', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(AT));
  afterEach(() => jest.useRealTimers());

  it('compares the same new habitat and dinosaur at two locations without applying either', async () => {
    const park = {
      ...world(),
      id: 'park',
      level: 6,
    };
    park.buildings.push(building('hybrid', 'habitat-hybrid-zone', 13, 5));
    park.dinosaurs.push(
      { ...dinosaur('hero', 'stegoceratops'), positionX: 13, positionY: 5 },
      { ...dinosaur('trike', 'triceratops'), isInPark: false },
    );
    const prisma = {
      park: { findUniqueOrThrow: jest.fn(async () => park) },
    } as unknown as PrismaService;
    const service = new BuildingService(
      prisma,
      new ParkOperationsService(prisma),
      {} as ResourcesService,
    );
    const connected = await service.getExhibitPlacementPreview(
      'owner',
      'habitat-grassland',
      { x: 5, y: 4 },
      'trike',
    );
    expect(connected.current).toMatchObject({
      exhibitCount: 2,
      occupancyCapacity: 44,
      visitorsPerMinute: 22,
    });
    expect(connected.proposed).toMatchObject({
      exhibitCount: 3,
      occupancyCapacity: 64,
      visitorsPerMinute: 32,
    });
    const blocked = await service.getExhibitPlacementPreview(
      'owner',
      'habitat-grassland',
      { x: 11, y: 13 },
      'trike',
    );
    expect(blocked.current).toEqual(connected.current);
    expect(blocked.proposed).toMatchObject({
      exhibitCount: 0,
      occupancyCapacity: 0,
      visitorsPerMinute: 0,
    });
    expect(blocked.explanation).toContain('관람길이 닿지 않아요');

    const empty = await service.getExhibitPlacementPreview('owner', 'habitat-grassland', {
      x: 5,
      y: 4,
    });
    expect(empty.proposed).toEqual(connected.current);
    expect(park.buildings).toHaveLength(3);
    expect(park.dinosaurs.find(({ id }) => id === 'trike')?.isInPark).toBe(false);
  });

  it('forecasts a compatible experimental carnivore in a planned exhibit and checks its safety', async () => {
    const park = { ...world(), id: 'park', level: 15 };
    park.buildings.push(building('platform', 'visitor-viewing-platform', 12, 10));
    const design = getExperimentalHybridDesign(
      getDinosaurById('argentinosaurus')!,
      getDinosaurById('tyrannosaurus-rex')!,
      'balanced',
      Rarity.LEGENDARY,
      false,
    )!;
    const species = { ...design.species, id: 'experimental-carnivore' };
    park.dinosaurs.push({
      ...dinosaur('candidate', species.id),
      hybridSpecies: {
        species,
        parentSpeciesIds: design.parentSpeciesIds,
        focus: design.focus,
        artwork: null,
      } as unknown as Dinosaur['hybridSpecies'],
      isInPark: false,
    });
    const prisma = {
      park: { findUniqueOrThrow: jest.fn(async () => park) },
    } as unknown as PrismaService;
    const service = new BuildingService(
      prisma,
      new ParkOperationsService(prisma),
      {} as ResourcesService,
    );
    const tile = { x: 14, y: 9 };
    await expect(
      service.getExhibitPlacementPreview('owner', 'habitat-carnivore', tile, 'candidate'),
    ).resolves.toMatchObject({ proposed: null, explanation: expect.stringContaining('보안센터') });

    park.buildings.push(building('center', SECURITY_CENTER_TYPE_ID, 14, 13));
    await expect(
      service.getExhibitPlacementPreview('owner', 'habitat-carnivore', tile, 'candidate'),
    ).resolves.toMatchObject({
      current: { exhibitCount: 1, occupancyCapacity: 24 },
      proposed: { exhibitCount: 2, occupancyCapacity: 44 },
    });
  });
});
