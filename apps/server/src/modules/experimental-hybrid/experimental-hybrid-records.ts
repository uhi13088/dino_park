import {
  MaterialQuality,
  ResearchMaterial,
  type DinosaurSpecies,
  type ExperimentalHybridIdentity,
  type RepeatSynthesisFocus,
  type SynthesisRecipe,
} from '@dino-park/shared';
import { Prisma } from '@prisma/client';

export type Ingredient = SynthesisRecipe['ingredients'][number];
export type StockItem = { material: string; quality: number; amount: number };

export const HYBRID_LINEAGE_SELECT = Prisma.validator<Prisma.ExperimentalHybridLineageSelect>()({
  id: true,
  key: true,
  parentSpeciesIds: true,
  focus: true,
  tier: true,
  species: true,
  artworkWidth: true,
  artworkState: true,
  discoveredBy: true,
});

export type HybridLineage = Prisma.ExperimentalHybridLineageGetPayload<{
  select: typeof HYBRID_LINEAGE_SELECT;
}>;

export function lineageKey(parentSpeciesIds: string[], focus: string, tier: string) {
  return JSON.stringify([[...parentSpeciesIds].sort(), focus, tier]);
}

export function spendIngredients(requirements: Ingredient[], stock: readonly StockItem[]) {
  const debits: Ingredient[] = [];
  const shortages: Ingredient[] = [];
  for (const requirement of requirements) {
    let remaining = requirement.amount;
    for (let quality = requirement.quality; quality <= MaterialQuality.HIGH; quality++) {
      const available =
        stock.find((item) => item.material === requirement.material && item.quality === quality)
          ?.amount ?? 0;
      const amount = Math.min(available, remaining);
      if (amount > 0) debits.push({ material: requirement.material, quality, amount });
      remaining -= amount;
      if (!remaining) break;
    }
    if (remaining > 0) shortages.push({ ...requirement, amount: remaining });
  }
  return { debits, shortages };
}

export function failureRefunds(debits: Ingredient[], stabilized: boolean) {
  return debits.flatMap((item) => {
    if (item.material === ResearchMaterial.STABILIZER) return [];
    const amount = stabilized ? item.amount : Math.floor((item.amount * 80) / 100);
    return amount > 0 ? [{ ...item, amount }] : [];
  });
}

export function artworkUrl(id: string) {
  return '/api/experimental-hybrids/art/' + encodeURIComponent(id);
}

export function lineageIdentity(
  lineage: HybridLineage,
  showArtwork = true,
): ExperimentalHybridIdentity {
  return {
    species: lineage.species as unknown as DinosaurSpecies,
    artwork:
      showArtwork && lineage.artworkState === 'ready'
        ? { idleUrl: artworkUrl(lineage.id), width: lineage.artworkWidth }
        : null,
    parentSpeciesIds: lineage.parentSpeciesIds,
    focus: lineage.focus as RepeatSynthesisFocus,
  };
}
