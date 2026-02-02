/**
 * 스토리 관련 타입 정의
 */

import { BaseEntity } from './common.types';

export type StoryUnlockType = 'none' | 'chapter' | 'parkLevel' | 'building' | 'dinosaur';

export interface StoryChapter {
  id: string;
  title: string;
  titleKo: string;
  order: number;
  scenes: StoryScene[];
  unlockCondition: {
    type: StoryUnlockType;
    value?: string | number;
  };
  rewards: StoryReward[];
}

export interface StoryScene {
  id: string;
  title?: string;
  dialogues: StoryDialogue[];
  choices?: StoryChoice[];
}

export interface StoryDialogue {
  speaker: string;
  text: string;
  emotion?: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  effect: Record<string, number | string | boolean>;
  nextSceneId: string | null;
}

export type StoryRewardType =
  | 'dinosaur'
  | 'gold'
  | 'diamond'
  | 'greatFigure'
  | 'item'
  | 'character'
  | 'building'
  | 'title';

export interface StoryReward {
  type: StoryRewardType;
  id?: string;
  amount?: number;
}

export interface StoryProgress extends BaseEntity {
  userId: string;
  chapterId: string;
  sceneId: string | null;
  completed: boolean;
  choices: string[];
}
