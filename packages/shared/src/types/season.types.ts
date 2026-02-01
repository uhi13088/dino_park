/**
 * 시즌 관련 타입 정의
 */

import { BaseEntity } from './common.types';

export interface Season {
  id: string;
  name: string;
  nameKo: string;
  startDate: Date;
  endDate: Date;
  theme: string;
  maxLevel: number;
  dinosaurs: string[];
  greatFigures: string[];
}

export interface SeasonPass extends BaseEntity {
  userId: string;
  seasonId: string;
  level: number;
  exp: number;
  isPremium: boolean;
  claimedRewards: string[];
}

export interface SeasonReward {
  level: number;
  freeReward: {
    type: string;
    id: string;
    quantity: number;
  };
  premiumReward: {
    type: string;
    id: string;
    quantity: number;
  };
}
