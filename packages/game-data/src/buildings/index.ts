/**
 * 건물 데이터
 * 참조: docs/dino_park_tycoon_gdd.md
 */

import type { BuildingType } from '@dino-park/shared';

// 건물 데이터는 Phase 4에서 상세 구현
export const BUILDING_DATA: BuildingType[] = [];

export function getBuildingById(id: string): BuildingType | undefined {
  return BUILDING_DATA.find((b) => b.id === id);
}

export function getBuildingsByCategory(category: string): BuildingType[] {
  return BUILDING_DATA.filter((b) => b.category === category);
}
