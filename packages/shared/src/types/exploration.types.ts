/**
 * 탐험 관련 타입 정의
 */

import { BaseEntity } from './common.types';

export enum ExplorationStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLAIMED = 'claimed',
}

export interface ExplorationRegion {
  id: string;
  name: string;
  nameKo: string;
  unlockLevel: number;
  duration: number;
  rewards: ExplorationReward[];
}

export interface ExplorationReward {
  type: 'dinosaur' | 'dna' | 'gold' | 'item';
  id: string;
  probability: number;
  quantity: number;
}

export interface Exploration extends BaseEntity {
  userId: string;
  regionId: string;
  status: ExplorationStatus;
  startedAt: Date;
  completedAt: Date | null;
  rewards: ExplorationReward[] | null;
}
