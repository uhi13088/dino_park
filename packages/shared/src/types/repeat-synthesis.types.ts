import type { DinosaurCompetitiveStats } from './dinosaur.types';
import type { SynthesisRecipe } from './codex.types';
import type { FirstSynthesisParent } from './milestone-synthesis.types';

export const STEGO_BASE_COMPETITIVE_STATS: Readonly<DinosaurCompetitiveStats> = {
  appeal: 25,
  speed: 65,
  stamina: 65,
  aggression: 50,
};

export const DINOSAUR_COMPETITIVE_STAT_LABELS = {
  appeal: '매력도',
  speed: '속도',
  stamina: '체력',
  aggression: '공격성',
} satisfies Record<keyof DinosaurCompetitiveStats, string>;

export const REPEAT_SYNTHESIS_FOCI = ['audience', 'sprint', 'balanced'] as const;
export type RepeatSynthesisFocus = (typeof REPEAT_SYNTHESIS_FOCI)[number];

export interface RepeatStatOutcome {
  value: number;
  chance: number;
}

export interface RepeatSynthesisFocusOption {
  id: RepeatSynthesisFocus;
  label: string;
  outcomes: Record<keyof DinosaurCompetitiveStats, RepeatStatOutcome[]>;
}

export type RepeatSynthesisIngredient = SynthesisRecipe['ingredients'][number];

export interface RepeatSynthesisStart {
  focus: RepeatSynthesisFocus;
  parentIds: string[];
  requestId: string;
}

export interface RepeatSynthesisState {
  unlocked: boolean;
  serverTime: string;
  gold: number;
  recipe: SynthesisRecipe;
  ingredients: (RepeatSynthesisIngredient & { available: number; failureRefund: number })[];
  parents: FirstSynthesisParent[];
  missing: string[];
  focuses: RepeatSynthesisFocusOption[];
  attempt: number;
  successChance: number;
  guaranteedAttempt: number;
  job: {
    id: string;
    focus: RepeatSynthesisFocus;
    status: 'incubating' | 'ready' | 'succeeded' | 'failed';
    readyAt: string;
    result: { dinosaurId: string; stats: DinosaurCompetitiveStats; owned: boolean } | null;
    refunded: RepeatSynthesisIngredient[];
  } | null;
}
