/**
 * 파크 관련 타입 정의
 */

import { BaseEntity } from './common.types';

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

export interface ParkGrowthGoal {
  id: ParkGrowthGoalId;
  status: 'locked' | 'incomplete' | 'claimable' | 'claimed';
  xp: number;
  progress: number;
  target: number;
}

export interface ParkGrowthResponse {
  unlocked: boolean;
  level: number;
  exp: number;
  expForNextLevel: number;
  targetLevel: 6;
  goals: ParkGrowthGoal[];
  research: {
    status: 'locked' | 'available' | 'running' | 'completed';
    completesAt: string | null;
    costs: { gold: number; wood: number; stone: number };
    durationSeconds: number;
    entranceBonusPercent: number;
    unavailableReason: string | null;
  };
}
