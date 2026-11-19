import { NotFoundException } from '@nestjs/common';
import { DinosaurOrigin, MaterialQuality, Rarity, ResearchMaterial } from '@dino-park/shared';
import { DINOSAUR_DATA, SYNTHESIS_RECIPES, getDinosaurById } from '@dino-park/game-data';
import { PrismaService } from '../../prisma/prisma.service';
import { DinosaurCodexService } from './dinosaur-codex.service';

function setup() {
  const firstDate = new Date('2026-01-01T00:00:00Z');
  const laterDate = new Date('2026-02-01T00:00:00Z');
  const registered = new Map([['iguanodon', firstDate]]);
  const tx = {
    park: { findUnique: jest.fn().mockResolvedValue({ id: 'park-1' }) },
    dinosaur: {
      findMany: jest.fn().mockResolvedValue([
        { speciesId: 'parasaurolophus', createdAt: firstDate },
        { speciesId: 'parasaurolophus', createdAt: laterDate },
        { speciesId: 'unknown-old-species', createdAt: laterDate },
      ]),
    },
    dinosaurCollection: {
      createMany: jest.fn().mockImplementation(({ data }) => {
        for (const item of data as { speciesId: string; firstCollectedAt: Date }[]) {
          if (!registered.has(item.speciesId))
            registered.set(item.speciesId, item.firstCollectedAt);
        }
        return { count: data.length };
      }),
      findMany: jest
        .fn()
        .mockImplementation(() =>
          [...registered].map(([speciesId, firstCollectedAt]) => ({ speciesId, firstCollectedAt })),
        ),
    },
  };
  const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
  return {
    service: new DinosaurCodexService(prisma as unknown as PrismaService),
    tx,
    registered,
    firstDate,
  };
}

describe('dinosaur codex', () => {
  it('counts unique collected species independently of current owned dinosaurs', async () => {
    const { service, tx, firstDate } = setup();
    const result = await service.getByUserId('user-1');
    expect(result.summary).toEqual({
      totalSpecies: 81,
      collectedSpecies: 2,
      ownedSpecies: 1,
      ownedDinosaurs: 2,
      unlistedOwnedCount: 1,
    });
    expect(
      result.entries.find((entry) => entry.speciesId === 'parasaurolophus')?.collection,
    ).toEqual({ collected: true, ownedCount: 2, firstCollectedAt: firstDate.toISOString() });
    expect(result.entries.find((entry) => entry.speciesId === 'iguanodon')?.collection).toEqual({
      collected: true,
      ownedCount: 0,
      firstCollectedAt: firstDate.toISOString(),
    });
    expect(tx.park.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true },
    });
    expect(tx.dinosaur.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parkId: 'park-1' } }),
    );
    expect(tx.dinosaurCollection.findMany).toHaveBeenCalledWith({ where: { parkId: 'park-1' } });
  });

  it('backfills existing ownership once and preserves the first date on repeat reads', async () => {
    const { service, tx, registered, firstDate } = setup();
    await service.getByUserId('user-1');
    const size = registered.size;
    await service.getByUserId('user-1');
    expect(registered.size).toBe(size);
    expect(registered.get('parasaurolophus')).toEqual(firstDate);
    expect(tx.dinosaurCollection.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          { parkId: 'park-1', speciesId: 'parasaurolophus', firstCollectedAt: firstDate },
        ]),
      }),
    );
  });

  it('does not query another park or silently show a fabricated empty collection', async () => {
    const { service, tx } = setup();
    tx.park.findUnique.mockResolvedValue(null);
    await expect(service.getByUserId('missing')).rejects.toThrow(NotFoundException);
    expect(tx.dinosaur.findMany).not.toHaveBeenCalled();
  });

  it('limits variants and hybrids to epic or legendary and guarantees the first designated synthesis', async () => {
    const { service } = setup();
    const { entries } = await service.getByUserId('user-1');
    const synthetic = entries.filter((entry) => entry.origin !== DinosaurOrigin.NATURAL);
    expect(synthetic.length).toBeGreaterThan(0);
    for (const entry of synthetic) {
      expect([Rarity.EPIC, Rarity.LEGENDARY]).toContain(entry.rarity);
    }
    for (const speciesId of ['ankylodocus', 'stegoceratops', 'carnoraptor']) {
      expect(entries.find((entry) => entry.speciesId === speciesId)).toMatchObject({
        rarity: Rarity.EPIC,
        origin: DinosaurOrigin.HYBRID,
      });
    }
    expect(entries.find((entry) => entry.speciesId === 'stegoceratops')?.recipe).toMatchObject({
      successRate: 0.5,
      guaranteedAttempt: 5,
      firstSynthesisRule: { successRate: 1, guaranteedAttempt: 1 },
      goldCost: 4000,
      durationMs: 30 * 60 * 1000,
    });
    expect(
      entries.filter((entry) => entry.recipe?.firstSynthesisRule).map((entry) => entry.speciesId),
    ).toEqual(['stegoceratops']);
    expect(entries.find((entry) => entry.speciesId === 'parasaurolophus')).toMatchObject({
      rarity: Rarity.COMMON,
      origin: DinosaurOrigin.NATURAL,
    });
  });

  it('exposes Lux as a variant and the latest legendary recipe with real catalog parents', async () => {
    const { service } = setup();
    const result = await service.getByUserId('user-1');
    const lux = result.entries.find((entry) => entry.speciesId === 'parasaurolophus-lux');
    expect(lux).toMatchObject({
      rarity: Rarity.EPIC,
      origin: DinosaurOrigin.VARIANT,
      recipe: { successRate: 0.5, parentSpeciesIds: ['parasaurolophus'] },
      collection: { collected: false, ownedCount: 0 },
    });
    expect(
      lux?.recipe?.ingredients.find((item) => item.material === ResearchMaterial.MUTATION_CELL),
    ).toMatchObject({ quality: MaterialQuality.MIDDLE, amount: 2 });
    const indominus = result.entries.find((entry) => entry.speciesId === 'indominus-rex');
    expect(indominus).toMatchObject({
      rarity: Rarity.LEGENDARY,
      origin: DinosaurOrigin.HYBRID,
      recipe: { successRate: 0.3, goldCost: null, durationMs: null, status: 'draft' },
    });
    expect(
      indominus?.recipe?.ingredients.every((item) => item.quality === MaterialQuality.HIGH),
    ).toBe(true);
    expect(new Set(DINOSAUR_DATA.map((species) => species.id)).size).toBe(DINOSAUR_DATA.length);
    for (const recipe of SYNTHESIS_RECIPES) {
      expect(getDinosaurById(recipe.resultSpeciesId)).toBeDefined();
      recipe.parentSpeciesIds.forEach((id) => expect(getDinosaurById(id)).toBeDefined());
      expect(recipe.ingredients.every((item) => [1, 2, 3].includes(item.quality))).toBe(true);
    }
  });
});
