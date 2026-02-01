/**
 * 위인 관련 타입 정의
 * 참조: docs/dino_park_great_figures.md
 */

import { Rarity, BaseEntity } from './common.types';

// 위인 직업
export enum GreatFigureJob {
  SCIENTIST = 'scientist',     // 과학자
  ARCHITECT = 'architect',     // 건축가
  MANAGER = 'manager',         // 경영인
  EXPLORER = 'explorer',       // 탐험가
  TRAINER = 'trainer',         // 조련사
  VET = 'vet',                 // 수의사
  SECURITY = 'security',       // 보안
  SPECIAL = 'special',         // 특수
}

// 위인 능력
export interface GreatFigureAbility {
  level: number;
  passive: string;
  bonus: string;
}

// 시너지 효과
export interface Synergy {
  partnerId: string;
  name: string;
  effect: string;
  bonus: Record<string, number>;
}

// 위인 타입 (정적 데이터)
export interface GreatFigureType {
  id: string;
  name: string;
  nameKo: string;
  job: GreatFigureJob;
  rarity: Rarity;
  abilities: GreatFigureAbility[];
  synergies: Synergy[];
  unlockCondition: {
    type: 'story' | 'season' | 'shop' | 'event';
    value: string;
  };
  recruitCost: number;        // 위인 포인트
  description: string;
  quote: string;
}

// 위인 인스턴스 (DB 저장)
export interface UserGreatFigure extends BaseEntity {
  userId: string;
  figureId: string;
  level: number;
  exp: number;
  assignedBuildingId: string | null;
}
