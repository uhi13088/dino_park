/**
 * 파크 관련 타입 정의
 */

import { BaseEntity } from './common.types';
import type { DriveMissionId } from './drive-expedition.types';

export interface Park extends BaseEntity {
  userId: string;
  name: string;
  level: number;
  exp: number;
  gridSizeX: number;
  gridSizeY: number;
  totalRevenue: number;
  totalVisitors: number;
}

export interface ParkStats {
  dinosaurCount: number;
  buildingCount: number;
  greatFigureCount: number;
  hourlyRevenue: number;
  hourlyMaintenance: number;
  netRevenue: number;
  popularity: number;
  satisfaction: number;
}

export type ParkGrowthGoalId = 'facility' | 'research' | 'field' | 'operation';
export type ParkRouteGrowthStage = 6 | 7;
export type ParkEarlyGrowthStage = 5 | ParkRouteGrowthStage;
export type ParkMidgameGrowthStage = 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type ParkGrowthStage = ParkEarlyGrowthStage | ParkMidgameGrowthStage;
export type ParkGrowthRouteId = 'operations' | 'exploration';

export type ParkGrowthCondition =
  | { kind: 'building'; typeId: string; level: number; name: string }
  | { kind: 'research'; technologyId: string; level: number }
  | { kind: 'dispatch'; missionId: string; reward: 'egg' | 'material' }
  | { kind: 'owned'; speciesId: string }
  | { kind: 'paid'; amount: number };

export interface ParkMidgameGrowthDefinition {
  stage: ParkMidgameGrowthStage;
  targetLevel: number;
  labPreparation: number;
  goals: readonly {
    id: ParkGrowthGoalId;
    rewardXp: number;
    alternatives: readonly ParkGrowthCondition[];
  }[];
}

export type ParkGrowthAlternativeView = ParkGrowthCondition & {
  label: string;
  status: 'complete' | 'incomplete' | 'unavailable';
};

export interface ParkGrowthGoal {
  id: ParkGrowthGoalId;
  status: 'locked' | 'incomplete' | 'claimable' | 'claimed';
  xp: number;
  progress: number;
  target: number;
}

export interface ParkGrowthRoutes {
  rewardXp: number;
  claimedRoute: ParkGrowthRouteId | null;
  operations: {
    status: ParkGrowthGoal['status'];
    exhibits: number;
    targetExhibits: number;
    visitors: number;
    targetVisitors: number;
    achieved: boolean;
  };
  exploration: {
    status: ParkGrowthGoal['status'];
    completedMissions: DriveMissionId[];
    researchCompleted: boolean;
  };
}

export interface ParkEarlyGrowthResponse {
  stage?: ParkEarlyGrowthStage;
  unlocked: boolean;
  level: number;
  exp: number;
  expForNextLevel: number;
  targetLevel: 6 | 7 | 8;
  goals: ParkGrowthGoal[];
  routes?: ParkGrowthRoutes;
  research: {
    status: 'locked' | 'available' | 'running' | 'completed';
    completesAt: string | null;
    costs: { gold: number; wood: number; stone: number };
    durationSeconds: number;
    entranceBonusPercent: number;
    careDecayReductionPercent?: number;
    blockedByResearch?: boolean;
    unavailableReason: string | null;
  };
}

export interface ParkMidgameGrowthResponse {
  stage: ParkMidgameGrowthStage;
  unlocked: boolean;
  level: number;
  exp: number;
  expForNextLevel: number;
  targetLevel: number;
  goals: Array<ParkGrowthGoal & { alternatives: ParkGrowthAlternativeView[] }>;
}

export type ParkGrowthResponse = ParkEarlyGrowthResponse | ParkMidgameGrowthResponse;
