import {
  DinosaurCategory,
  DinosaurOrigin,
  DinosaurSize,
  MaterialQuality,
  Rarity,
  ResearchMaterial,
  type DinosaurCompetitiveStats,
  type DinosaurSpecies,
  type ExperimentalHybridIdentity,
  type ExperimentalHybridTier,
  type RepeatSynthesisFocus,
  type RepeatSynthesisFocusOption,
  type SynthesisRecipe,
} from '@dino-park/shared';
import { getDinosaurById } from './dinosaurs';

const rarityPoints = {
  [Rarity.COMMON]: 0,
  [Rarity.UNCOMMON]: 0,
  [Rarity.RARE]: 10,
  [Rarity.EPIC]: 20,
  [Rarity.LEGENDARY]: 30,
};
const sizeOrder = [DinosaurSize.SMALL, DinosaurSize.MEDIUM, DinosaurSize.LARGE, DinosaurSize.GIANT];
const focusNames = { audience: '전시형', sprint: '질주형', balanced: '균형형' };

export const EXPERIMENTAL_HYBRID_ACCESS = {
  parkLevel: 15,
  basic: { labLevel: 5, geneAnalysis: 2 },
  legendary: { labLevel: 10, geneAnalysis: 3 },
  archiveMission: 'mission.abandoned-lab.repeat-wall-store-survey.v1',
} as const;

export type ExperimentalHybridDesign = {
  parentSpeciesIds: string[];
  focus: RepeatSynthesisFocus;
  tier: ExperimentalHybridTier;
  species: DinosaurSpecies;
  artworkWidth: number;
  cost: {
    ingredients: SynthesisRecipe['ingredients'];
    gold: number;
    durationSeconds: number;
  };
  reasons: string[];
};

export function canUseExperimentalHybridParent(species: DinosaurSpecies): boolean {
  return (
    (species.origin ?? DinosaurOrigin.NATURAL) === DinosaurOrigin.NATURAL &&
    (species.category === DinosaurCategory.HERBIVORE ||
      species.category === DinosaurCategory.CARNIVORE)
  );
}

export function getExperimentalHybridDesign(
  speciesA: DinosaurSpecies,
  speciesB: DinosaurSpecies,
  focus: RepeatSynthesisFocus,
  tier: ExperimentalHybridTier,
  registered: boolean,
): ExperimentalHybridDesign | null {
  if (
    speciesA.id === speciesB.id ||
    !canUseExperimentalHybridParent(speciesA) ||
    !canUseExperimentalHybridParent(speciesB)
  )
    return null;
  const parents = [speciesA, speciesB].sort((a, b) => a.id.localeCompare(b.id));
  const legendary = tier === Rarity.LEGENDARY;
  if (
    legendary &&
    (!parents.every((parent) => rarityPoints[parent.rarity] >= 10) ||
      !parents.some((parent) => rarityPoints[parent.rarity] >= 20))
  )
    return null;

  const sizes = parents.map(({ size }) => sizeOrder.indexOf(size));
  const largest = Math.max(...sizes);
  const size = sizeOrder[largest];
  const predator = parents.some((parent) => parent.category === DinosaurCategory.CARNIVORE);
  const sizeGap = Math.max(...sizes) - Math.min(...sizes) >= 2;
  const rarityCost = parents.reduce((sum, { rarity }) => sum + rarityPoints[rarity], 0);
  const quality = legendary ? MaterialQuality.HIGH : MaterialQuality.MIDDLE;
  const reasons = [
    rarityCost ? `부모 희귀도 · DNA 샘플 +${rarityCost}` : '일반·고급 원종 · 기본 DNA 수량',
    predator ? '육식 계통 · 합성 촉매 +1' : '초식 계통 · 기본 촉매 수량',
  ];
  if (sizeGap) reasons.push('부모 체형 차이 · 합성 촉매 +1');
  if (size === DinosaurSize.GIANT) reasons.push('거대 체형 · 배양액 +1');
  if (size === DinosaurSize.SMALL) reasons.push('소형 체형 · 배양액 1개 감소');

  const nameKo = `${parents.map((parent) => parent.nameKo).join(' × ')} ${focusNames[focus]}`;
  const popularity = Math.round(
    Math.min(
      72,
      18 + (parents[0].stats.popularity + parents[1].stats.popularity) / 3 + (legendary ? 8 : 0),
    ),
  );
  const maintenanceCost = Math.round(
    Math.max(24, (parents[0].stats.maintenanceCost + parents[1].stats.maintenanceCost) / 2 + 14),
  );
  const artworkWidth = [70, 80, 86, 98][largest];
  return {
    parentSpeciesIds: parents.map((parent) => parent.id),
    focus,
    tier,
    species: {
      id: '',
      name: parents.map((parent) => parent.name).join(' × '),
      nameKo,
      rarity: tier,
      category: DinosaurCategory.HYBRID,
      origin: DinosaurOrigin.HYBRID,
      size,
      stats: {
        baseRevenue: 0,
        popularity,
        maintenanceCost,
        space: Math.max(...parents.map((parent) => parent.stats.space)),
      },
      habitat: predator ? ['carnivore'] : ['hybrid-zone'],
      hatchTime: 0,
      unlockCondition: {
        type: 'dna',
        value: 'experimental-hybrid',
        description: '실험 합성 연구자료',
      },
      description: `${parents.map((parent) => parent.nameKo).join('와 ')}의 특징이 드러나는 ${focusNames[focus]} 하이브리드.`,
    },
    artworkWidth,
    cost: {
      ingredients: [
        { material: ResearchMaterial.DNA, quality, amount: (legendary ? 80 : 20) + rarityCost },
        {
          material: ResearchMaterial.CATALYST,
          quality,
          amount: (legendary ? 3 : 1) + Number(predator) + Number(sizeGap),
        },
        {
          material: ResearchMaterial.CULTURE,
          quality,
          amount:
            (legendary ? 5 : 2) +
            Number(size === DinosaurSize.GIANT) -
            Number(size === DinosaurSize.SMALL),
        },
      ],
      gold:
        (legendary ? (registered ? 100_000 : 120_000) : registered ? 4_000 : 6_000) +
        rarityCost * (legendary ? 350 : 150),
      durationSeconds: 60 * 60 * (legendary ? (registered ? 12 : 16) : registered ? 1 : 2),
    },
    reasons,
  };
}

export function experimentalHybridStatOutcomes(
  design: Pick<ExperimentalHybridDesign, 'species' | 'focus'>,
): RepeatSynthesisFocusOption['outcomes'] {
  const { species, focus } = design;
  const predator = species.habitat.includes('carnivore');
  const giant = species.size === DinosaurSize.GIANT;
  const legendary = species.rarity === Rarity.LEGENDARY;
  const bonuses = {
    audience: { appeal: 10, speed: -4, stamina: 0, aggression: -6 },
    sprint: { appeal: -3, speed: 14, stamina: -6, aggression: 0 },
    balanced: { appeal: 2, speed: 2, stamina: 5, aggression: 2 },
  }[focus];
  function outcomes(key: keyof DinosaurCompetitiveStats, offset: number) {
    return [-5, 0, 5].map((spread, i) => ({
      value: Math.max(0, Math.min(100, offset + bonuses[key] + spread + (legendary ? 5 : 0))),
      chance: i === 1 ? 50 : 25,
    }));
  }
  return {
    appeal: outcomes('appeal', species.stats.popularity),
    speed: outcomes('speed', giant ? 51 : 61),
    stamina: outcomes('stamina', giant ? 71 : 64),
    aggression: outcomes('aggression', predator ? 57 : 41),
  };
}

export function rollExperimentalHybridStats(
  design: Pick<ExperimentalHybridDesign, 'species' | 'focus'>,
  random: () => number,
): DinosaurCompetitiveStats {
  const outcomes = experimentalHybridStatOutcomes(design);
  function roll(stat: keyof DinosaurCompetitiveStats) {
    const value = random();
    return outcomes[stat][value < 0.25 ? 0 : value < 0.75 ? 1 : 2].value;
  }
  return {
    appeal: roll('appeal'),
    speed: roll('speed'),
    stamina: roll('stamina'),
    aggression: roll('aggression'),
  };
}

export function readExperimentalHybridIdentity(record: unknown): ExperimentalHybridIdentity | null {
  if (
    !record ||
    typeof record !== 'object' ||
    !('species' in record) ||
    !record.species ||
    typeof record.species !== 'object' ||
    !('id' in record.species) ||
    typeof record.species.id !== 'string'
  )
    return null;
  return record as ExperimentalHybridIdentity;
}

export function resolveDinosaurSpecies(dinosaur: {
  speciesId: string;
  hybridSpecies?: unknown;
  hybrid?: ExperimentalHybridIdentity | null;
}): DinosaurSpecies | undefined {
  const hybrid = dinosaur.hybrid ?? readExperimentalHybridIdentity(dinosaur.hybridSpecies);
  return hybrid?.species.id === dinosaur.speciesId
    ? hybrid.species
    : getDinosaurById(dinosaur.speciesId);
}
