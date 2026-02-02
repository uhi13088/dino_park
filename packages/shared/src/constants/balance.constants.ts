/**
 * 밸런스 상수
 * 참조: docs/dino_park_balance_simulation.md
 */

// === 레벨 시스템 ===
export const MAX_PARK_LEVEL = 50;
export const MAX_DINOSAUR_LEVEL = 25;
export const MAX_GREAT_FIGURE_LEVEL = 10;
export const MAX_BUILDING_LEVEL = 25;

// === 초기 재화 ===
export const INITIAL_GOLD = 10000;
export const INITIAL_DIAMOND = 100;
export const INITIAL_DNA = 0;

// === 에너지 ===
export const MAX_EXPLORATION_ENERGY = 30;
export const ENERGY_RECHARGE_MINUTES = 10;
export const ENERGY_PER_EXPLORATION = 5;

// === 공룡 상태 ===
export const MAX_HAPPINESS = 100;
export const MAX_HUNGER = 100;
export const MAX_INTIMACY = 1000;
export const HAPPINESS_DECAY_PER_HOUR = 2;
export const HUNGER_INCREASE_PER_HOUR = 5;
export const FEEDING_HAPPINESS_GAIN = 20;
export const FEEDING_HUNGER_REDUCE = 100;

// === 오프라인 수익 ===
export const MAX_OFFLINE_HOURS = 8;
export const OFFLINE_REVENUE_RATE = 0.5;

// === 그리드 ===
export const INITIAL_GRID_SIZE = 20;
export const GRID_SIZE_PER_LEVEL = 2;
export const MAX_GRID_SIZE = 100;

// === 등급별 드롭률 ===
export const RARITY_DROP_RATES = {
  common: 0.40,
  uncommon: 0.30,
  rare: 0.20,
  epic: 0.08,
  legendary: 0.02,
} as const;

// === 등급별 수익 배율 ===
export const RARITY_REVENUE_MULTIPLIER = {
  common: 1.0,
  uncommon: 1.5,
  rare: 2.5,
  epic: 4.0,
  legendary: 7.0,
} as const;

// === 공룡 상태 위험 기준 ===
export const DANGER_HAPPINESS_THRESHOLD = 30;
export const DANGER_HUNGER_THRESHOLD = 80;
export const DANGER_STATE_REVENUE_PENALTY = 0.5;

// === 수익 계산 ===
export const REVENUE_LEVEL_MULTIPLIER = 0.1; // 레벨당 10% 증가
export const GAME_TICK_INTERVAL = 1000; // 1초

// === 친밀도 ===
export const INTERACTION_INTIMACY_GAIN = 5;
export const INTERACTION_EXP_GAIN = 10;
export const INTERACTION_COOLDOWN_MINUTES = 30;

// === 광고 시간 단축 (레벨별) ===
export const AD_TIME_REDUCTION_HOURS = {
  tier1: 1, // Lv.1~10
  tier2: 2, // Lv.11~15
  tier3: 3, // Lv.16~20
  tier4: 4, // Lv.21~25
} as const;

// === 건설 슬롯 ===
export const INITIAL_BUILD_SLOTS = 1;
export const MAX_BUILD_SLOTS = 5;
export const BUILD_SLOT_DIAMOND_COST = 500;
