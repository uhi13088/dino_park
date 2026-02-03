/**
 * 밸런스 데이터
 * 참조: docs/dino_park_balance_simulation.md
 */

// 레벨업 필요 경험치 테이블
export const PARK_LEVEL_EXP_TABLE: number[] = [
  0, // Lv.1 (시작)
  100, // Lv.2
  250, // Lv.3
  500, // Lv.4
  1000, // Lv.5
  // ... Phase 4에서 전체 테이블 구현
];

export const DINOSAUR_LEVEL_EXP_TABLE: number[] = [
  0, // Lv.1
  50, // Lv.2
  120, // Lv.3
  220, // Lv.4
  350, // Lv.5
  // ... Phase 4에서 전체 테이블 구현
];

// 레벨별 스탯 배율
export function getLevelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.1; // 레벨당 10% 증가
}

// 수익 계산
export function calculateRevenue(
  baseRevenue: number,
  level: number,
  happiness: number,
  buffs: number = 0,
): number {
  const levelMultiplier = getLevelMultiplier(level);
  const happinessMultiplier = happiness / 100;
  const buffMultiplier = 1 + buffs;
  return Math.floor(baseRevenue * levelMultiplier * happinessMultiplier * buffMultiplier);
}
