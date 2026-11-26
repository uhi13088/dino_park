import type { Rarity } from './common.types';
import type { DinosaurCategory, DinosaurOrigin, DinosaurSize } from './dinosaur.types';

export enum ResearchMaterial {
  DNA = 'dna',
  CATALYST = 'catalyst',
  CULTURE = 'culture',
  STABILIZER = 'stabilizer',
  MUTATION_CELL = 'mutation_cell',
}

export enum MaterialQuality {
  LOW = 1,
  MIDDLE = 2,
  HIGH = 3,
}

export interface SynthesisRule {
  successRate: number;
  guaranteedAttempt: number;
}

export interface SynthesisRecipe {
  id: string;
  resultSpeciesId: string;
  parentSpeciesIds: string[];
  ingredients: { material: ResearchMaterial; quality: MaterialQuality; amount: number }[];
  goldCost: number | null;
  durationMs: number | null;
  unlockDescription: string;
  status: 'first_available' | 'planned' | 'draft';
  /** 파크당 첫 지정 합성에만 적용하는 규칙. 반복 연구는 결과 등급의 기본 규칙을 사용한다. */
  firstSynthesisRule?: SynthesisRule;
}

export interface DinosaurCodexEntry {
  experimental?: boolean;
  speciesId: string;
  name: string;
  nameKo: string;
  rarity: Rarity;
  category: DinosaurCategory;
  origin: DinosaurOrigin;
  size: DinosaurSize;
  description: string;
  habitatNames: string[];
  popularity: number;
  maintenanceCost: number;
  hatchTimeMs: number;
  imageUrl: string | null;
  acquisition: { title: string; description: string };
  recipe: (SynthesisRecipe & SynthesisRule) | null;
  collection: { collected: boolean; ownedCount: number; firstCollectedAt: string | null };
}

export interface DinosaurCodexResponse {
  entries: DinosaurCodexEntry[];
  summary: {
    totalSpecies: number;
    collectedSpecies: number;
    ownedSpecies: number;
    ownedDinosaurs: number;
    unlistedOwnedCount: number;
  };
}
