/**
 * 공룡 관련 타입 정의
 * 참조: docs/dino_park_dinosaur_codex.md
 */

import { Rarity, BaseEntity } from './common.types';

// 공룡 카테고리
export enum DinosaurCategory {
  HERBIVORE = 'herbivore', // 초식
  CARNIVORE = 'carnivore', // 육식
  PTEROSAUR = 'pterosaur', // 익룡
  MARINE = 'marine', // 해양
  HYBRID = 'hybrid', // 하이브리드
}

// 공룡 크기
export enum DinosaurSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  GIANT = 'giant',
}

// 공룡 스탯
export interface DinosaurStats {
  baseRevenue: number; // 기본 수익 (골드/시간)
  popularity: number; // 인기도 (%)
  maintenanceCost: number; // 유지비 (골드/시간)
  space: number; // 필요 공간 (칸)
}

// 해금 조건
export interface UnlockCondition {
  type: 'level' | 'story' | 'exploration' | 'dna' | 'season' | 'event';
  value: string | number;
  description: string;
}

// 패시브 능력
export interface PassiveAbility {
  id: string;
  name: string;
  description: string;
  effect: Record<string, number | string>; // number: 수치 효과, string: 시너지 대상 등
}

// 공룡 종 (정적 데이터)
export interface DinosaurSpecies {
  id: string; // 예: 'tyrannosaurus-rex'
  name: string; // 영문명
  nameKo: string; // 한글명
  category: DinosaurCategory;
  rarity: Rarity;
  size: DinosaurSize;
  stats: DinosaurStats;
  habitat: string[]; // 서식 가능 구역
  hatchTime: number; // 부화 시간 (밀리초)
  unlockCondition: UnlockCondition;
  passive?: PassiveAbility;
  description: string;
}

// 공룡 인스턴스 (DB 저장)
export interface Dinosaur extends BaseEntity {
  parkId: string;
  speciesId: string;
  nickname: string | null;
  level: number;
  exp: number;
  happiness: number; // 0-100
  hunger: number; // 0-100
  intimacy: number; // 0-1000
  positionX: number;
  positionY: number;
  isInPark: boolean;
  lastFedAt: Date;
}

// 공룡 상태 (실시간 계산)
export interface DinosaurState {
  currentRevenue: number; // 현재 수익 (버프 적용)
  currentMaintenance: number; // 현재 유지비
  netRevenue: number; // 순이익
  happinessDecay: number; // 행복도 감소율
  hungerRate: number; // 배고픔 증가율
  isHungry: boolean;
  isUnhappy: boolean;
}
