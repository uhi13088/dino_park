/**
 * 건물 관련 타입 정의
 * 참조: docs/dino_park_tycoon_gdd.md
 */

import { BaseEntity } from './common.types';

// 건물 카테고리
export enum BuildingCategory {
  DINOSAUR = 'dinosaur', // 공룡 시설
  VISITOR = 'visitor', // 관람 시설
  AMENITY = 'amenity', // 편의 시설
  PRODUCTION = 'production', // 생산 시설
  RESEARCH = 'research', // 연구 시설
  OPERATION = 'operation', // 운영 시설
  DECORATION = 'decoration', // 장식물
}

// 건물 상태
export enum BuildingStatus {
  CONSTRUCTING = 'constructing',
  ACTIVE = 'active',
  UPGRADING = 'upgrading',
  INACTIVE = 'inactive',
}

// 건물 스탯
export interface BuildingStats {
  capacity: number; // 수용량
  revenue: number; // 수익 (있는 경우)
  maintenanceCost: number; // 유지비
  space: number; // 필요 공간
}

// 건물 타입 (정적 데이터)
export interface BuildingType {
  id: string;
  name: string;
  nameKo: string;
  category: BuildingCategory;
  maxLevel: number;
  baseStats: BuildingStats;
  baseCost?: number; // 기본 건설 비용 (골드) - 없으면 unlockCondition.cost.gold 사용
  baseBonus?: number; // 기본 보너스 (%)
  constructionTime?: number; // 건설 시간 (초)
  size: { width: number; height: number };
  unlockCondition: {
    parkLevel: number;
    cost: { gold: number; materials?: Record<string, number> };
  };
  description: string;
}

// 건물 인스턴스 (DB 저장)
export interface Building extends BaseEntity {
  parkId: string;
  typeId: string;
  level: number;
  positionX: number;
  positionY: number;
  status: BuildingStatus;
  assignedGreatFigureId: string | null;
  constructionEndsAt: Date | null;
  upgradeEndsAt: Date | null;
}
