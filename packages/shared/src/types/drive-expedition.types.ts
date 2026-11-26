import type { MaterialQuality, ResearchMaterial } from './codex.types';

export const PARK_LEVEL_SIX_CATALYST_MISSION_ID = 'basic-catalyst';
export const PARK_LEVEL_SEVEN_DNA_MISSION_ID = 'basic-dna';
export const PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID = 'repeat-rim-survey';

export type DriveMissionId =
  | 'trike'
  | 'stego'
  | 'dna1'
  | 'dna2'
  | 'culture'
  | 'catalyst'
  | typeof PARK_LEVEL_SIX_CATALYST_MISSION_ID
  | typeof PARK_LEVEL_SEVEN_DNA_MISSION_ID
  | typeof PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID;

export type DriveExpeditionMaterial = {
  material: ResearchMaterial;
  quality: MaterialQuality;
  amount: number;
};

export type DriveMissionReward =
  | { type: 'egg'; speciesId: string; hatchSeconds: number }
  | ({ type: 'material' } & DriveExpeditionMaterial);
