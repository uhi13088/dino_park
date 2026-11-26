import type { DinosaurResponse } from './api.types';

export type FirstExpeditionStage =
  | 'locked'
  | 'available'
  | 'reward'
  | 'egg'
  | 'hatching'
  | 'hatch_ready'
  | 'placement'
  | 'complete';

export interface FirstExpeditionStateResponse {
  stage: FirstExpeditionStage;
  tutorialStep: number;
  unlocked: boolean;
  requirements: string[];
  gold: number;
  mission: {
    id: string;
    regionId: string;
    status: string;
    step: number;
    totalSteps: number;
    clue: null;
  } | null;
  egg: {
    id: string;
    speciesId: string;
    status: 'stored' | 'hatching' | 'ready' | 'claimed';
    completesAt: string | null;
    remainingSeconds: number;
    dinosaurId: string | null;
  } | null;
  dinosaur: DinosaurResponse | null;
  hatchedDinosaur?: { id: string; speciesId: string };
  hatchingSlots: { used: number; total: number };
  reusedExisting: boolean;
}
