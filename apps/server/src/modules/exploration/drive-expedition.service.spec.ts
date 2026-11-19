import {
  EARLY_SYNTHESIS_SAFETY_FLAG,
  MaterialQuality,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  ResearchMaterial,
} from '@dino-park/shared';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ParkOperationsService } from '../park/park-operations.service';
import { DriveExpeditionService } from './drive-expedition.service';
import { IGUANODON_CARE_RECEIPT } from './expedition-state';

function fixture() {
  const park = {
    id: 'park',
    level: 5,
    exp: 0,
    buildings: [],
    dinosaurs: [],
    dinosaurCollections: [{ speciesId: 'iguanodon' }],
    firstSynthesis: { claimedAt: null as Date | null, exhibitedAt: null as Date | null },
  };
  const tx = {
    park: { findUnique: jest.fn(async () => park) },
    currency: {
      findUniqueOrThrow: jest.fn(async () => ({
        gold: 10000,
        explorationEnergy: 30,
        energyLastRechargedAt: new Date(),
      })),
      update: jest.fn(),
    },
    driveRun: {
      findUnique: jest.fn(async () => null),
      groupBy: jest.fn(async () =>
        ['dna1', 'dna2', 'culture', 'catalyst'].map((missionId) => ({ missionId })),
      ),
    },
    hatchingQueue: { findMany: jest.fn(async () => []) },
    storyFlag: {
      findMany: jest.fn(async () =>
        [IGUANODON_CARE_RECEIPT, EARLY_SYNTHESIS_SAFETY_FLAG].map((flagId) => ({
          flagId,
          value: true,
        })),
      ),
    },
    exploration: { findFirst: jest.fn() },
    resourceInventory: { findMany: jest.fn(async () => []) },
  };
  const service = new DriveExpeditionService(
    {
      $transaction: (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    } as unknown as PrismaService,
    { settleInTransaction: jest.fn() } as unknown as ParkOperationsService,
  );
  return { park, tx, service };
}

describe('post-exhibit material driving', () => {
  it('reopens previously claimed material targets when the first hybrid is exhibited', async () => {
    const { park, tx, service } = fixture();
    const before = await service.getState('owner');
    expect(before.missions.filter(({ reward }) => reward.type === 'material')).toEqual(
      expect.arrayContaining(
        ['dna1', 'dna2', 'culture', 'catalyst'].map((id) =>
          expect.objectContaining({ id, status: 'claimed', repeatable: false }),
        ),
      ),
    );
    await expect(service.start('owner', 'dna1')).rejects.toThrow('이미 수령');
    expect(tx.currency.update).not.toHaveBeenCalled();

    park.firstSynthesis.exhibitedAt = new Date();
    const after = await service.getState('owner');
    expect(after.missions.filter(({ repeatable }) => repeatable)).toEqual(
      expect.arrayContaining(
        ['dna1', 'dna2', 'culture', 'catalyst'].map((id) =>
          expect.objectContaining({ id, status: 'available' }),
        ),
      ),
    );
    expect(after.missions.filter(({ reward }) => reward.type === 'egg')).toEqual(
      before.missions.filter(({ reward }) => reward.type === 'egg'),
    );
  });

  it('preserves the existing mission prerequisites when a material target is repeatable', async () => {
    const { park, tx, service } = fixture();
    park.firstSynthesis.exhibitedAt = new Date();
    tx.driveRun.groupBy.mockResolvedValueOnce([{ missionId: 'dna1' }]);
    const { missions } = await service.getState('owner');
    expect(missions.find(({ id }) => id === 'dna2')).toMatchObject({ status: 'available' });
    expect(missions.find(({ id }) => id === 'catalyst')).toMatchObject({
      status: 'locked',
      repeatable: true,
    });
  });

  it('offers the repeatable growth route after the hero claim, with separate quality stock', async () => {
    const { park, service } = fixture();
    const missionId = PARK_LEVEL_SIX_CATALYST_MISSION_ID;
    await expect(service.start('owner', missionId)).rejects.toThrow(
      '주행 목표를 찾을 수 없습니다.',
    );
    park.firstSynthesis.claimedAt = new Date();
    const { missions, stock } = await service.getState('owner');
    expect(missions.find(({ id }) => id === missionId)).toMatchObject({
      goldCost: 350,
      energyCost: 5,
      status: 'available',
      repeatable: true,
      reward: { material: ResearchMaterial.CATALYST, quality: MaterialQuality.LOW, amount: 1 },
    });
    expect(missions.find(({ id }) => id === 'catalyst')).toMatchObject({
      status: 'claimed',
      repeatable: false,
    });
    expect(stock.filter(({ material }) => material === ResearchMaterial.CATALYST)).toEqual([
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.MIDDLE, amount: 0 },
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.LOW, amount: 0 },
    ]);
  });
});
