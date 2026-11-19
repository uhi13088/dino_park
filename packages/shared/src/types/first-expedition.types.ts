import type { DinosaurResponse } from './api.types';

export type FirstExpeditionStage =
  | 'locked'
  | 'available'
  | 'exploring'
  | 'reward'
  | 'egg'
  | 'hatching'
  | 'hatch_ready'
  | 'placement'
  | 'complete';

export interface FirstExpeditionClue {
  id: string;
  title: string;
  hint: string;
  options: Array<{ id: string; label: string; description: string; kind: string }>;
}

export interface FirstExpeditionStateResponse {
  stage: FirstExpeditionStage;
  tutorialStep: number;
  unlocked: boolean;
  requirements: string[];
  gold: number;
  energy: number;
  mission: {
    id: string;
    regionId: string;
    status: string;
    step: number;
    totalSteps: number;
    clue: FirstExpeditionClue | null;
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
  hatchingSlots: { used: number; total: number };
  reusedExisting: boolean;
  feedback?: { correct: boolean; message: string };
}
