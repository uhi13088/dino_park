import type { MaterialQuality, ResearchMaterial } from './codex.types';
import type { FirstExpeditionStateResponse } from './first-expedition.types';

export const PARK_LEVEL_SIX_CATALYST_MISSION_ID = 'basic-catalyst';

export type DriveMissionId =
  | 'trike'
  | 'stego'
  | 'dna1'
  | 'dna2'
  | 'culture'
  | 'catalyst'
  | typeof PARK_LEVEL_SIX_CATALYST_MISSION_ID;

export type DriveExpeditionMaterial = {
  material: ResearchMaterial;
  quality: MaterialQuality;
  amount: number;
};

export type DriveMissionReward =
  | { type: 'egg'; speciesId: string; hatchSeconds: number }
  | ({ type: 'material' } & DriveExpeditionMaterial);

export interface DriveExpeditionMission {
  id: DriveMissionId;
  title: string;
  regionId: string;
  regionName: string;
  goldCost: number;
  energyCost: number;
  target: number;
  status: 'locked' | 'available' | 'active' | 'claimed';
  repeatable: boolean;
  requirement?: string;
  reward: DriveMissionReward;
  egg: FirstExpeditionStateResponse['egg'];
}

export interface DriveExpeditionRun {
  id: string;
  missionId: DriveMissionId;
  seed: number;
  sector: number;
  x: number;
  collected: number;
  damage: number;
  required: number;
  status: 'running' | 'reward' | 'failed';
  sectorStartedAt: string;
}

export interface DriveExpeditionState {
  unlocked: boolean;
  gold: number;
  energy: number;
  missions: DriveExpeditionMission[];
  stock: DriveExpeditionMaterial[];
  run: DriveExpeditionRun | null;
  hatchingSlots: { used: number; total: number };
}

export interface DriveCheckpointRequest {
  sector: number;
  positions: number[];
}
