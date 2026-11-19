import { ParkService } from './park.service';
import { ParkOperationsService } from './park-operations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { STARTER_PARK, getDinosaurById, getBuildingById } from '@dino-park/game-data';
import { PARK_ADMISSION } from '@dino-park/shared';
import {
  admissionSnapshot,
  entranceExit,
  onBoundary,
  type AdmissionWorld,
} from './park-admission.logic';
import { AT, building, world } from './park-admission.fixtures';

function setup(
  contents: AdmissionWorld = { ...world(), dinosaurs: [], buildings: [] },
  receiptCount = 1,
) {
  const park = { ...contents, id: 'park-1' };
  const transaction = {
    $queryRaw: jest.fn(),
    park: { findUnique: jest.fn().mockResolvedValue(park) },
    storyFlag: { createMany: jest.fn().mockResolvedValue({ count: receiptCount }) },
    dinosaur: {
      create: jest.fn().mockResolvedValue({
        ...STARTER_PARK.dinosaur,
        createdAt: new Date('2026-11-15T00:00:00Z'),
      }),
    },
    dinosaurCollection: { upsert: jest.fn() },
    building: {
      createMany: jest.fn(),
      create: jest.fn(
        ({ data }: { data: { typeId: string; positionX: number; positionY: number } }) =>
          park.buildings.push(building('recovered', data.typeId, data.positionX, data.positionY)),
      ),
    },
  };
  const prisma = {
    $transaction: jest.fn((callback) => callback(transaction)),
  } as unknown as PrismaService;
  const service = new ParkService(prisma, new ParkOperationsService(prisma));
  return { service, transaction, park };
}

describe('starter park grant', () => {
  it('grants the catalog starter and both facilities together to an empty park', async () => {
    const { service, transaction } = setup();
    expect(getDinosaurById(STARTER_PARK.dinosaur.speciesId)).toBeDefined();
    STARTER_PARK.buildings.forEach(({ typeId }) => expect(getBuildingById(typeId)).toBeDefined());
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: true });
    expect(transaction.dinosaur.create).toHaveBeenCalledWith({
      data: { parkId: 'park-1', ...STARTER_PARK.dinosaur },
    });
    expect(transaction.building.createMany).toHaveBeenCalledWith({
      data: STARTER_PARK.buildings.map((item) => ({ parkId: 'park-1', ...item })),
    });
    expect(transaction.dinosaurCollection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          parkId: 'park-1',
          speciesId: STARTER_PARK.dinosaur.speciesId,
          firstCollectedAt: new Date('2026-11-15T00:00:00Z'),
        },
      }),
    );
    expect(transaction.storyFlag.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });
  it('does not replenish a previously granted starter', async () => {
    const { service, transaction } = setup(undefined, 0);
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: false });
    expect(transaction.dinosaur.create).not.toHaveBeenCalled();
    expect(transaction.building.createMany).not.toHaveBeenCalled();
  });
  it('preserves an existing entrance in its current position', async () => {
    const { service, transaction, park } = setup(world());
    const original = structuredClone(park);
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: false });
    expect(transaction.dinosaur.create).not.toHaveBeenCalled();
    expect(transaction.building.create).not.toHaveBeenCalled();
    expect(park).toEqual(original);
  });
  it('restores one connected free entrance without moving legacy contents', async () => {
    const saved = world();
    saved.buildings = [saved.buildings[0], building('old-center', 'visitor-center', 0, 16)];
    const original = structuredClone(saved);
    const { service, transaction, park } = setup(saved, 0);
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: false });
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: false });
    expect(transaction.$queryRaw).toHaveBeenCalledTimes(2);
    expect(transaction.dinosaur.create).not.toHaveBeenCalled();
    expect(transaction.building.createMany).not.toHaveBeenCalled();
    expect(transaction.building.create).toHaveBeenCalledTimes(1);
    expect(park.dinosaurs).toEqual(original.dinosaurs);
    expect(park.buildings.slice(0, -1)).toEqual(original.buildings);
    const added = park.buildings.at(-1)!;
    expect(added.typeId).toBe(PARK_ADMISSION.entranceTypeId);
    expect(onBoundary(added, park)).toBe(true);
    const exit = entranceExit(added, park);
    expect(admissionSnapshot(park, AT).pathTiles).toContainEqual(exit);
  });
  it('leaves the layout intact when no boundary footprint is clear', async () => {
    const saved: AdmissionWorld = { ...world(), buildings: [] };
    for (let x = 0; x < saved.gridSizeX; x++) {
      for (let y = 0; y < saved.gridSizeY; y++) {
        if (x === 0 || y === 0 || x === saved.gridSizeX - 1 || y === saved.gridSizeY - 1)
          saved.buildings.push(building(`existing-${x}-${y}`, 'old-decoration', x, y));
      }
    }
    const { service, transaction, park } = setup(saved);
    const original = structuredClone(park);
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: false });
    expect(transaction.building.create).not.toHaveBeenCalled();
    expect(transaction.dinosaur.create).not.toHaveBeenCalled();
    expect(park).toEqual(original);
  });
  it('fails instead of claiming a receipt for a missing park', async () => {
    const { service, transaction } = setup();
    transaction.park.findUnique.mockResolvedValue(null);
    await expect(service.claimStarter('user-1')).rejects.toThrow('파크를 찾을 수 없습니다.');
    expect(transaction.storyFlag.createMany).not.toHaveBeenCalled();
  });
});
