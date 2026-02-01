/**
 * 스토리 관련 타입 정의
 */

import { BaseEntity } from './common.types';

export interface StoryChapter {
  id: string;
  title: string;
  titleKo: string;
  order: number;
  scenes: StoryScene[];
  unlockCondition: {
    parkLevel?: number;
    previousChapter?: string;
  };
  rewards: StoryReward[];
}

export interface StoryScene {
  id: string;
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
  effect: Record<string, number>;
  nextSceneId: string;
}

export interface StoryReward {
  type: 'dinosaur' | 'gold' | 'diamond' | 'greatFigure' | 'item';
  id: string;
  quantity: number;
}

export interface StoryProgress extends BaseEntity {
  userId: string;
  chapterId: string;
  sceneId: string | null;
  completed: boolean;
  choices: string[];
}
