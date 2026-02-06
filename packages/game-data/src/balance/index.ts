/**
 * 밸런스 데이터
 * 참조: docs/dino_park_balance_simulation.md
 */

// ========================================
// 레벨 시스템
// ========================================

// 파크 레벨업 필요 경험치 테이블 (Lv.1~50)
export const PARK_LEVEL_EXP_TABLE: number[] = [
  0, // Lv.1 (시작)
  100,
  250,
  500,
  1000,
  2000, // Lv.2~6
  3500,
  5500,
  8000,
  11000,
  15000, // Lv.7~11
  20000,
  26000,
  33000,
  41000,
  50000, // Lv.12~16
  60000,
  72000,
  85000,
  100000,
  120000, // Lv.17~21
  145000,
  175000,
  210000,
  250000,
  300000, // Lv.22~26
  360000,
  430000,
  510000,
  600000,
  700000, // Lv.27~31
  820000,
  960000,
  1120000,
  1300000,
  1500000, // Lv.32~36
  1750000,
  2050000,
  2400000,
  2800000,
  3250000, // Lv.37~41
  3750000,
  4300000,
  4900000,
  5550000,
  6250000, // Lv.42~46
  7000000,
  7800000,
  8650000,
  9550000, // Lv.47~50
];

// 공룡 레벨업 필요 경험치 테이블 (Lv.1~25)
export const DINOSAUR_LEVEL_EXP_TABLE: number[] = [
  0, // Lv.1
  50,
  120,
  220,
  350,
  520, // Lv.2~6
  730,
  990,
  1300,
  1670,
  2100, // Lv.7~11
  2600,
  3180,
  3850,
  4620,
  5500, // Lv.12~16
  6500,
  7640,
  8930,
  10400,
  12060, // Lv.17~21
  13940,
  16080,
  18500,
  21240, // Lv.22~25
];

// 위인 레벨업 필요 경험치 테이블 (Lv.1~10)
export const GREAT_FIGURE_LEVEL_EXP_TABLE: number[] = [
  0, // Lv.1
  100,
  300,
  600,
  1000, // Lv.2~5
  1600,
  2400,
  3500,
  5000,
  7000, // Lv.6~10
];

export const MAX_PARK_LEVEL = 50;
export const MAX_DINOSAUR_LEVEL = 25;
export const MAX_GREAT_FIGURE_LEVEL = 10;

// ========================================
// 초기 재화
// ========================================

export const INITIAL_CURRENCY = {
  gold: 10000,
  diamond: 100,
  dna: 0,
} as const;

// ========================================
// 에너지 시스템
// ========================================

export const ENERGY = {
  maxExplorationEnergy: 30,
  rechargeMinutes: 10, // 10분당 1 에너지
  perExploration: 5, // 탐험 1회당 소모량
  dailyAdRechargeLimit: 5, // 일일 광고 충전 횟수
  adRechargeAmount: 5, // 광고 시청 시 충전량
} as const;

// ========================================
// 공룡 상태
// ========================================

export const DINOSAUR_STATUS = {
  maxHappiness: 100,
  maxHunger: 100,
  maxIntimacy: 100,
  happinessDecayPerHour: 2, // 시간당 행복도 감소
  hungerIncreasePerHour: 5, // 시간당 배고픔 증가
  feedingHappinessGain: 20, // 먹이 시 행복도 증가
  feedingHungerReduce: 100, // 먹이 시 배고픔 감소
  intimacyPerFeed: 5, // 먹이당 친밀도 증가
  intimacyPerInteraction: 2, // 상호작용당 친밀도 증가
} as const;

// ========================================
// 희귀도별 기본 스탯
// ========================================

export const RARITY_BASE_STATS = {
  common: {
    baseRevenue: 10,
    popularity: 5,
    maintenanceCost: 5,
    hatchTimeMinutes: 30,
    dnaRequired: 0,
  },
  uncommon: {
    baseRevenue: 25,
    popularity: 15,
    maintenanceCost: 12,
    hatchTimeMinutes: 60,
    dnaRequired: 10,
  },
  rare: {
    baseRevenue: 60,
    popularity: 35,
    maintenanceCost: 30,
    hatchTimeMinutes: 180,
    dnaRequired: 30,
  },
  epic: {
    baseRevenue: 150,
    popularity: 80,
    maintenanceCost: 70,
    hatchTimeMinutes: 480,
    dnaRequired: 80,
  },
  legendary: {
    baseRevenue: 400,
    popularity: 200,
    maintenanceCost: 180,
    hatchTimeMinutes: 1440,
    dnaRequired: 200,
  },
} as const;

// ========================================
// 건물 타입별 스탯
// ========================================

export const BUILDING_TYPE_STATS = {
  attraction: {
    revenueMultiplier: 1.0,
    visitorCapacity: 50,
    buildCostGold: 5000,
  },
  shop: {
    revenueMultiplier: 1.5,
    visitorCapacity: 30,
    buildCostGold: 8000,
  },
  facility: {
    revenueMultiplier: 0.5,
    visitorCapacity: 20,
    buildCostGold: 10000,
  },
  decoration: {
    revenueMultiplier: 0.2,
    visitorCapacity: 0,
    buildCostGold: 2000,
  },
  research: {
    revenueMultiplier: 0,
    visitorCapacity: 0,
    buildCostGold: 20000,
  },
} as const;

// ========================================
// 탐험 시스템
// ========================================

export const EXPLORATION = {
  regions: {
    asia: { unlockLevel: 1, energyCost: 5, baseRewardGold: 500 },
    europe: { unlockLevel: 5, energyCost: 6, baseRewardGold: 800 },
    americas: { unlockLevel: 10, energyCost: 7, baseRewardGold: 1200 },
    africa: { unlockLevel: 15, energyCost: 8, baseRewardGold: 1800 },
    oceania: { unlockLevel: 20, energyCost: 9, baseRewardGold: 2500 },
    antarctica: { unlockLevel: 30, energyCost: 10, baseRewardGold: 4000 },
  },
  eggDropRates: {
    common: 0.5, // 50%
    uncommon: 0.3, // 30%
    rare: 0.15, // 15%
    epic: 0.04, // 4%
    legendary: 0.01, // 1%
  },
  durationMinutes: {
    quick: 30,
    normal: 120,
    long: 480,
  },
} as const;

// ========================================
// 오프라인 수익
// ========================================

export const OFFLINE = {
  maxHours: 8,
  revenueRate: 0.5, // 온라인 대비 50%
  premiumRevenueRate: 0.8, // 프리미엄 구독 시 80%
} as const;

// ========================================
// 상점 - 다이아 패키지 가격표 (계산용)
// ========================================

export const DIAMOND_PACK_PRICES = [
  { id: 'diamond_60', diamonds: 60, bonusDiamonds: 0, priceKRW: 1100 },
  { id: 'diamond_330', diamonds: 330, bonusDiamonds: 30, priceKRW: 5500, isPopular: true },
  { id: 'diamond_700', diamonds: 700, bonusDiamonds: 80, priceKRW: 11000 },
  { id: 'diamond_1500', diamonds: 1500, bonusDiamonds: 200, priceKRW: 22000 },
  { id: 'diamond_3500', diamonds: 3500, bonusDiamonds: 600, priceKRW: 55000 },
  { id: 'diamond_7500', diamonds: 7500, bonusDiamonds: 1500, priceKRW: 110000 },
] as const;

// ========================================
// 상점 - 골드 상점 (다이아 → 골드)
// ========================================

export const GOLD_SHOP = [
  { id: 'gold_10000', goldAmount: 10000, diamondCost: 50, dailyLimit: 5 },
  { id: 'gold_50000', goldAmount: 50000, diamondCost: 200, dailyLimit: 3 },
  { id: 'gold_200000', goldAmount: 200000, diamondCost: 700, dailyLimit: 1 },
] as const;

// ========================================
// 구독 상품 설정 (계산용)
// ========================================

export const SUBSCRIPTION_CONFIG = {
  dinoPass: {
    id: 'dino_pass',
    monthlyPriceKRW: 9900,
    benefits: {
      dailyDiamond: 30,
      offlineRevenueBonus: 0.3, // +30%
      explorationEnergyBonus: 10, // +10 최대 에너지
      adSkip: true,
    },
  },
  premiumPass: {
    id: 'premium_pass',
    monthlyPriceKRW: 22000,
    benefits: {
      dailyDiamond: 100,
      offlineRevenueBonus: 0.5, // +50%
      explorationEnergyBonus: 20, // +20 최대 에너지
      adSkip: true,
      exclusiveDinosaurs: true,
      doubleSeasonExp: true,
    },
  },
} as const;

// ========================================
// 시즌 패스
// ========================================

export const SEASON_PASS = {
  maxLevel: 50,
  expPerLevel: 1000,
  premiumPriceKRW: 11000,
  durationDays: 90,
} as const;

// ========================================
// 광고 보상
// ========================================

export const AD_REWARDS = {
  doubleOfflineRevenue: { cooldownMinutes: 60 },
  freeEnergy: { amount: 5, dailyLimit: 5 },
  bonusExplorationReward: { multiplier: 2, dailyLimit: 3 },
  freeHatch: { reduceMinutes: 30, dailyLimit: 3 },
} as const;

// ========================================
// 그리드 시스템
// ========================================

export const GRID = {
  initialSize: 20,
  sizePerLevel: 2,
  maxSize: 100,
} as const;

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 레벨별 스탯 배율 계산
 * @param level 현재 레벨
 * @returns 배율 (레벨당 10% 증가)
 */
export function getLevelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.1;
}

/**
 * 공룡 수익 계산
 * @param baseRevenue 기본 수익
 * @param level 공룡 레벨
 * @param happiness 행복도 (0-100)
 * @param buffs 버프 배율 (0.1 = 10%)
 * @returns 최종 수익
 */
export function calculateRevenue(
  baseRevenue: number,
  level: number,
  happiness: number,
  buffs: number = 0,
): number {
  const levelMultiplier = getLevelMultiplier(level);
  const happinessMultiplier = Math.max(0.5, happiness / 100); // 최소 50%
  const buffMultiplier = 1 + buffs;
  return Math.floor(baseRevenue * levelMultiplier * happinessMultiplier * buffMultiplier);
}

/**
 * 레벨업에 필요한 경험치 반환
 * @param table 경험치 테이블
 * @param currentLevel 현재 레벨
 * @returns 다음 레벨까지 필요한 총 경험치
 */
export function getRequiredExp(table: number[], currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  if (nextLevel >= table.length) return Infinity;
  return table[nextLevel] - table[currentLevel];
}

/**
 * 오프라인 수익 계산
 * @param revenuePerMinute 분당 수익
 * @param offlineMinutes 오프라인 시간 (분)
 * @param isPremium 프리미엄 구독 여부
 * @returns 총 오프라인 수익
 */
export function calculateOfflineRevenue(
  revenuePerMinute: number,
  offlineMinutes: number,
  isPremium: boolean = false,
): number {
  const maxMinutes = OFFLINE.maxHours * 60;
  const clampedMinutes = Math.min(offlineMinutes, maxMinutes);
  const rate = isPremium ? OFFLINE.premiumRevenueRate : OFFLINE.revenueRate;
  return Math.floor(revenuePerMinute * clampedMinutes * rate);
}

/**
 * 에너지 회복량 계산
 * @param lastRechargeTime 마지막 충전 시간
 * @param currentEnergy 현재 에너지
 * @returns 회복된 에너지량
 */
export function calculateEnergyRecharge(lastRechargeTime: Date, currentEnergy: number): number {
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - lastRechargeTime.getTime()) / (1000 * 60));
  const rechargedEnergy = Math.floor(elapsedMinutes / ENERGY.rechargeMinutes);
  const maxRecharge = ENERGY.maxExplorationEnergy - currentEnergy;
  return Math.min(rechargedEnergy, maxRecharge);
}

/**
 * 부화 시간 계산 (분)
 * @param rarity 공룡 희귀도
 * @param reductionPercent 시간 감소율 (0-1)
 * @returns 부화 시간 (분)
 */
export function calculateHatchTime(
  rarity: keyof typeof RARITY_BASE_STATS,
  reductionPercent: number = 0,
): number {
  const baseTime = RARITY_BASE_STATS[rarity].hatchTimeMinutes;
  return Math.floor(baseTime * (1 - reductionPercent));
}

/**
 * 시즌 패스 레벨 계산
 * @param totalExp 총 획득 경험치
 * @returns 현재 레벨과 다음 레벨까지 진행률
 */
export function calculateSeasonPassLevel(totalExp: number): {
  level: number;
  progress: number;
} {
  const level = Math.min(Math.floor(totalExp / SEASON_PASS.expPerLevel) + 1, SEASON_PASS.maxLevel);
  const expInLevel = totalExp % SEASON_PASS.expPerLevel;
  const progress = expInLevel / SEASON_PASS.expPerLevel;
  return { level, progress };
}
