import { ParkService } from './park.service';
import { ParkOperationsService } from './park-operations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { STARTER_PARK, getDinosaurById, getBuildingById } from '@dino-park/game-data';

function setup(counts = { dinosaurs: 0, buildings: 0 }, receiptCount = 1) {
  const transaction = {
    park: { findUnique: jest.fn().mockResolvedValue({ id: 'park-1', _count: counts }) },
    storyFlag: { createMany: jest.fn().mockResolvedValue({ count: receiptCount }) },
    dinosaur: {
      create: jest.fn().mockResolvedValue({
        ...STARTER_PARK.dinosaur,
        createdAt: new Date('2026-11-15T00:00:00Z'),
      }),
    },
    dinosaurCollection: { upsert: jest.fn() },
    building: { createMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };
  const service = new ParkService(prisma as unknown as PrismaService, {} as ParkOperationsService);
  return { service, transaction };
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
  it.each([
    { dinosaurs: 1, buildings: 0 },
    { dinosaurs: 0, buildings: 1 },
  ])('preserves an existing park %p', async (counts) => {
    const { service, transaction } = setup(counts);
    await expect(service.claimStarter('user-1')).resolves.toEqual({ granted: false });
    expect(transaction.dinosaur.create).not.toHaveBeenCalled();
  });
  it('fails instead of claiming a receipt for a missing park', async () => {
    const { service, transaction } = setup();
    transaction.park.findUnique.mockResolvedValue(null);
    await expect(service.claimStarter('user-1')).rejects.toThrow('파크를 찾을 수 없습니다.');
    expect(transaction.storyFlag.createMany).not.toHaveBeenCalled();
  });
});
