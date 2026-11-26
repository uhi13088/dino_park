import type { MaterialQuality, ResearchMaterial } from './codex.types';
import type { DriveMissionId } from './drive-expedition.types';

export type ScoutReward =
  | { type: 'egg'; speciesId: string; hatchSeconds: number }
  | {
      type: 'materials';
      items: { material: ResearchMaterial; quality: MaterialQuality; amount: number }[];
    };

export interface ScoutMission {
  id: string;
  title: string;
  reward: ScoutReward;
  seconds: number;
  gold: number;
  legacyMissionId?: DriveMissionId | 'first-iguanodon-v1';
  gate?: {
    platform?: boolean;
    iguanodon?: boolean;
    safety?: boolean;
    firstHero?: boolean;
    parkLevel?: number;
    labLevel?: number;
    research?: { id: string; name: string; level: number };
    claimed?: string[];
    registered?: string;
    responseLevel?: number;
    once?: boolean;
    noDuplicateEgg?: boolean;
    afterExhibitionToRepeat?: boolean;
  };
}

export interface ScoutSpot {
  id: string;
  name: string;
  stars: 1 | 2 | 3 | 4 | 5;
  missionIds: readonly string[];
}

export interface ScoutRegion {
  id: string;
  name: string;
  type: 'discovery' | 'material';
  spots: readonly ScoutSpot[];
}

export interface ScoutReport {
  id: string;
  spotId: string;
  missionId: string;
  readyAt: string;
  reward: ScoutReward;
}

export interface ParkScout {
  id: string;
  name: string;
  experience: number;
  searchLevel: number;
  mobilityLevel: number;
  responseLevel: number;
  assignment: ScoutReport | null;
}

export type ScoutMissionBlocker =
  | { kind: 'research'; technologyId: string; level: number }
  | { kind: 'lab' | 'park'; level: number };

export interface ScoutExpeditionState {
  serverNow: string;
  gold: number;
  fuel: number;
  fuelMax: number;
  diamond: number;
  scouts: ParkScout[];
  hireDiamondCost: number | null;
  hireBlockedReason?: string;
  missions: Record<string, { blockedReason?: string; blocker?: ScoutMissionBlocker }>;
  lastReport?: ScoutReport;
}

export interface DispatchScoutRequest {
  scoutId: string;
  spotId: string;
  missionId: string;
}

export interface HireScoutRequest {
  slot: number;
}

export function scoutTravelSeconds(seconds: number, mobilityLevel: number): number {
  return Math.max(30, Math.ceil((seconds * (11 - mobilityLevel)) / 10));
}
