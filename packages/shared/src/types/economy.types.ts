/**
 * 경제/재화 관련 타입 정의
 */

import { BaseEntity } from './common.types';

// 재화 종류
export enum CurrencyType {
  GOLD = 'gold',
  DIAMOND = 'diamond',
  DNA = 'dna',
  EXPLORATION_ENERGY = 'explorationEnergy',
  SEASON_POINT = 'seasonPoint',
  GREAT_FIGURE_POINT = 'greatFigurePoint',
}

// 거래 유형
export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
  PURCHASE = 'purchase',
  REWARD = 'reward',
}

// 유저 재화
export interface Currency extends BaseEntity {
  userId: string;
  gold: number;
  diamond: number;
  dna: number;
  explorationEnergy: number;
  energyLastRechargedAt: Date;
}

// 거래 기록
export interface Transaction extends BaseEntity {
  userId: string;
  type: TransactionType;
  currencyType: CurrencyType;
  amount: number;
  reason: string;
  balanceAfter: number;
}
