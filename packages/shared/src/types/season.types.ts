/**
 * 시즌 관련 타입 정의
 */

import { BaseEntity } from './common.types';
import { StoryScene } from './story.types';

export interface Season {
  id: string;
  name: string;
  nameKo: string;
  theme: string;
  description: string;
  startDate: string;
  endDate: string;
  maxLevel: number;
  unlockCondition: SeasonUnlockCondition;
  dinosaurs: string[];
  greatFigures: string[];
  chapters: SeasonChapter[];
  passRewards: SeasonPassReward[];
  specialEvents: SeasonEvent[];
}

export interface SeasonUnlockCondition {
  type: 'chapter' | 'season' | 'parkLevel';
  value: string | number;
}

export interface SeasonChapter {
  id: string;
  order: number;
  title: string;
  titleKo: string;
  unlockCondition: {
    type: 'seasonStart' | 'previousChapter' | 'passLevel' | 'parkLevel';
    value?: string | number;
  };
  scenes: StoryScene[];
  rewards: SeasonChapterReward[];
}

export interface SeasonChapterReward {
  type: 'seasonPoint' | 'gold' | 'diamond' | 'dinosaur' | 'greatFigure' | 'item' | 'title';
  id?: string;
  amount?: number;
}

export interface SeasonPassReward {
  level: number;
  freeReward: SeasonRewardItem | null;
  premiumReward: SeasonRewardItem | null;
}

export interface SeasonRewardItem {
  type: 'gold' | 'diamond' | 'dna' | 'dinosaur' | 'greatFigure' | 'skin' | 'title' | 'building' | 'item';
  id?: string;
  quantity: number;
}

export interface SeasonEvent {
  id: string;
  name: string;
  nameKo: string;
  type: 'collection' | 'challenge' | 'raid' | 'competition';
  startDay: number;
  durationDays: number;
  description: string;
  rewards: SeasonRewardItem[];
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
