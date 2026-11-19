/** 도감 표시와 실제 첫 지정 합성이 함께 사용하는 레시피. */
import type { SynthesisRecipe, SynthesisRule } from '@dino-park/shared';
import { HOUR, MINUTE, MaterialQuality, Rarity, ResearchMaterial } from '@dino-park/shared';

export * from './park-growth';

export const SYNTHESIS_RULES: Record<Rarity, SynthesisRule> = {
  [Rarity.COMMON]: { successRate: 0.95, guaranteedAttempt: 2 },
  [Rarity.UNCOMMON]: { successRate: 0.85, guaranteedAttempt: 3 },
  [Rarity.RARE]: { successRate: 0.7, guaranteedAttempt: 3 },
  [Rarity.EPIC]: { successRate: 0.5, guaranteedAttempt: 5 },
  [Rarity.LEGENDARY]: { successRate: 0.3, guaranteedAttempt: 8 },
};

export const SYNTHESIS_RECIPES: SynthesisRecipe[] = [
  {
    id: 'stegoceratops',
    resultSpeciesId: 'stegoceratops',
    parentSpeciesIds: ['stegosaurus', 'triceratops'],
    ingredients: [
      { material: ResearchMaterial.DNA, quality: MaterialQuality.MIDDLE, amount: 20 },
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.MIDDLE, amount: 1 },
      { material: ResearchMaterial.CULTURE, quality: MaterialQuality.MIDDLE, amount: 2 },
    ],
    goldCost: 4000,
    durationMs: 30 * MINUTE,
    unlockDescription: '챕터 3-6 연구 해금 · DNA 연구소',
    status: 'first_available',
    firstSynthesisRule: { successRate: 1, guaranteedAttempt: 1 },
  },
  {
    id: 'parasaurolophus-lux',
    resultSpeciesId: 'parasaurolophus-lux',
    parentSpeciesIds: ['parasaurolophus'],
    ingredients: [
      { material: ResearchMaterial.DNA, quality: MaterialQuality.MIDDLE, amount: 40 },
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.MIDDLE, amount: 2 },
      { material: ResearchMaterial.CULTURE, quality: MaterialQuality.MIDDLE, amount: 3 },
      { material: ResearchMaterial.MUTATION_CELL, quality: MaterialQuality.MIDDLE, amount: 2 },
    ],
    goldCost: 10000,
    durationMs: 4 * HOUR,
    unlockDescription: '파크 Lv.15 · 유전자 센터 · 발광 특성 연구',
    status: 'planned',
  },
  {
    id: 'spinoraptor',
    resultSpeciesId: 'spinoraptor',
    parentSpeciesIds: ['spinosaurus', 'utahraptor'],
    ingredients: [
      { material: ResearchMaterial.DNA, quality: MaterialQuality.MIDDLE, amount: 45 },
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.MIDDLE, amount: 3 },
      { material: ResearchMaterial.CULTURE, quality: MaterialQuality.MIDDLE, amount: 3 },
    ],
    goldCost: 15000,
    durationMs: 4 * HOUR,
    unlockDescription: '원종 보유 · 격리 연구',
    status: 'planned',
  },
  {
    id: 'indominus-rex',
    resultSpeciesId: 'indominus-rex',
    parentSpeciesIds: ['tyrannosaurus-rex', 'velociraptor'],
    ingredients: [
      { material: ResearchMaterial.DNA, quality: MaterialQuality.HIGH, amount: 80 },
      { material: ResearchMaterial.CATALYST, quality: MaterialQuality.HIGH, amount: 3 },
      { material: ResearchMaterial.CULTURE, quality: MaterialQuality.HIGH, amount: 5 },
    ],
    goldCost: null,
    durationMs: null,
    unlockDescription: '챕터 6 이후 연구 · 연구비와 시간 검토 중',
    status: 'draft',
  },
];

export function getSynthesisRecipe(speciesId: string): SynthesisRecipe | undefined {
  return SYNTHESIS_RECIPES.find((recipe) => recipe.resultSpeciesId === speciesId);
}
