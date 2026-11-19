import type { SynthesisRecipe } from './codex.types';

export const EARLY_SYNTHESIS_SAFETY_FLAG = 'milestone-synthesis-safety-v1';
export const FIRST_HYBRID_SPECIES_ID = 'stegoceratops';
export const FIRST_HYBRID_HABITAT_ID = 'habitat-hybrid-zone';
export const FIRST_HYBRID_LAB_ID = 'research-dna-lab';

export interface FirstSynthesisParent {
  id: string;
  speciesId: string;
  nickname: string | null;
  happiness: number;
  hunger: number;
}

export interface FirstSynthesisState {
  available: boolean;
  safetyComplete: boolean;
  safetyRequirements: string[];
  prepared: boolean;
  labReady: boolean;
  parents: FirstSynthesisParent[];
  ingredients: (SynthesisRecipe['ingredients'][number] & { available: number })[];
  gold: number;
  recipe: SynthesisRecipe;
  missing: string[];
  builderSlots: number;
  serverTime: string;
  job: {
    status: 'incubating' | 'ready' | 'claimed';
    startedAt: string;
    readyAt: string;
    claimedAt: string | null;
    resultDinosaurId: string | null;
    exhibitedAt: string | null;
    parentIds: string[];
  } | null;
}
