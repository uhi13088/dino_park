/**
 * 소셜 시스템 데이터 - 다이노 파크 타이쿤
 * Phase 6: 친구, 방문, 선물 시스템
 */

import type {
  GiftItem,
  IntimacyReward,
  FriendPointShopItem,
  ParkVisitReward,
  RankingReward,
} from '@dino-park/shared';

// ============================================================
// 선물 아이템 (Gift Items)
// ============================================================

export const GIFT_ITEMS: GiftItem[] = [
  // 일일 선물
  {
    id: 'gift-daily-basic',
    name: 'Daily Gift',
    nameKo: '일일 선물',
    type: 'daily',
    rewards: [
      { type: 'gold', quantity: 1000 },
      { type: 'friendPoint', quantity: 5 },
    ],
    cooldownHours: 24,
    maxDailyGifts: 20,
    isActive: true,
  },
  {
    id: 'gift-daily-energy',
    name: 'Energy Gift',
    nameKo: '에너지 선물',
    type: 'daily',
    rewards: [
      { type: 'energy', quantity: 3 },
      { type: 'friendPoint', quantity: 5 },
    ],
    cooldownHours: 24,
    maxDailyGifts: 10,
    requiredFriendLevel: 2,
    isActive: true,
  },
  {
    id: 'gift-daily-diamond',
    name: 'Diamond Gift',
    nameKo: '다이아 선물',
    type: 'daily',
    rewards: [
      { type: 'diamond', quantity: 5 },
      { type: 'friendPoint', quantity: 10 },
    ],
    cooldownHours: 24,
    maxDailyGifts: 5,
    requiredFriendLevel: 5,
    isActive: true,
  },

  // 특별 선물 (친밀도 높은 친구)
  {
    id: 'gift-special-dna',
    name: 'DNA Gift Box',
    nameKo: 'DNA 선물 상자',
    type: 'special',
    rewards: [
      { type: 'dna', quantity: 50 },
      { type: 'friendPoint', quantity: 20 },
    ],
    cooldownHours: 72,
    maxDailyGifts: 3,
    requiredFriendLevel: 7,
    isActive: true,
  },
  {
    id: 'gift-special-treasure',
    name: 'Treasure Box',
    nameKo: '보물 상자',
    type: 'special',
    rewards: [
      { type: 'gold', quantity: 10000 },
      { type: 'diamond', quantity: 20 },
      { type: 'dna', quantity: 30 },
      { type: 'friendPoint', quantity: 30 },
    ],
    cooldownHours: 168, // 7일
    maxDailyGifts: 1,
    requiredFriendLevel: 10,
    isActive: true,
  },

  // 이벤트 선물
  {
    id: 'gift-event-newyear',
    name: 'New Year Gift',
    nameKo: '새해 선물',
    type: 'event',
    rewards: [
      { type: 'diamond', quantity: 30 },
      { type: 'gold', quantity: 5000 },
      { type: 'item', id: 'newyear-decoration', quantity: 1 },
      { type: 'friendPoint', quantity: 50 },
    ],
    cooldownHours: 0,
    maxDailyGifts: 50,
    isActive: false, // 이벤트 시에만 활성화
  },
  {
    id: 'gift-event-anniversary',
    name: 'Anniversary Gift',
    nameKo: '기념일 선물',
    type: 'event',
    rewards: [
      { type: 'diamond', quantity: 50 },
      { type: 'dna', quantity: 100 },
      { type: 'friendPoint', quantity: 100 },
    ],
    cooldownHours: 0,
    maxDailyGifts: 30,
    isActive: false,
  },
];

// ============================================================
// 친밀도 보상 (Intimacy Rewards)
// ============================================================

export const INTIMACY_REWARDS: IntimacyReward[] = [
  {
    level: 1,
    rewards: [{ type: 'gold', quantity: 1000 }],
    unlocks: ['daily-gift'],
  },
  {
    level: 2,
    rewards: [
      { type: 'gold', quantity: 3000 },
      { type: 'friendPoint', quantity: 20 },
    ],
    unlocks: ['energy-gift'],
  },
  {
    level: 3,
    rewards: [
      { type: 'diamond', quantity: 20 },
      { type: 'gold', quantity: 5000 },
    ],
    unlocks: ['friend-nickname'],
  },
  {
    level: 4,
    rewards: [
      { type: 'dna', quantity: 50 },
      { type: 'friendPoint', quantity: 50 },
    ],
    unlocks: ['visit-bonus-10%'],
  },
  {
    level: 5,
    rewards: [
      { type: 'diamond', quantity: 50 },
      { type: 'gold', quantity: 10000 },
    ],
    unlocks: ['diamond-gift'],
  },
  {
    level: 6,
    rewards: [
      { type: 'dna', quantity: 100 },
      { type: 'friendPoint', quantity: 100 },
    ],
    unlocks: ['visit-bonus-20%'],
  },
  {
    level: 7,
    rewards: [
      { type: 'diamond', quantity: 100 },
      { type: 'item', id: 'friend-frame-bronze', quantity: 1 },
    ],
    unlocks: ['dna-gift', 'friend-frame-bronze'],
  },
  {
    level: 8,
    rewards: [
      { type: 'diamond', quantity: 150 },
      { type: 'gold', quantity: 30000 },
    ],
    unlocks: ['visit-bonus-30%'],
  },
  {
    level: 9,
    rewards: [
      { type: 'diamond', quantity: 200 },
      { type: 'item', id: 'friend-frame-silver', quantity: 1 },
    ],
    unlocks: ['friend-frame-silver'],
  },
  {
    level: 10,
    rewards: [
      { type: 'diamond', quantity: 300 },
      { type: 'dna', quantity: 300 },
      { type: 'item', id: 'friend-frame-gold', quantity: 1 },
    ],
    unlocks: ['treasure-gift', 'friend-frame-gold', 'best-friend-title'],
  },
];

// ============================================================
// 파크 방문 보상 (Visit Rewards)
// ============================================================

export const VISIT_REWARDS: ParkVisitReward[] = [
  // 방문자 보상
  {
    type: 'visitor',
    rewards: [
      { type: 'gold', quantity: 500 },
      { type: 'friendPoint', quantity: 3 },
    ],
    bonusCondition: undefined,
  },
  {
    type: 'visitor',
    rewards: [
      { type: 'gold', quantity: 1000 },
      { type: 'friendPoint', quantity: 5 },
      { type: 'energy', quantity: 1 },
    ],
    bonusCondition: 'first-visit-of-day',
  },
  {
    type: 'visitor',
    rewards: [
      { type: 'gold', quantity: 1500 },
      { type: 'friendPoint', quantity: 10 },
    ],
    bonusCondition: 'interact-with-5-dinosaurs',
  },

  // 호스트 보상
  {
    type: 'host',
    rewards: [
      { type: 'gold', quantity: 300 },
      { type: 'friendPoint', quantity: 2 },
    ],
    bonusCondition: undefined,
  },
  {
    type: 'host',
    rewards: [
      { type: 'gold', quantity: 500 },
      { type: 'friendPoint', quantity: 5 },
    ],
    bonusCondition: 'visitor-left-like',
  },
  {
    type: 'host',
    rewards: [
      { type: 'gold', quantity: 1000 },
      { type: 'friendPoint', quantity: 10 },
      { type: 'diamond', quantity: 3 },
    ],
    bonusCondition: 'visitor-left-comment',
  },
];

// ============================================================
// 친구 포인트 상점 (Friend Point Shop)
// ============================================================

export const FRIEND_POINT_SHOP: FriendPointShopItem[] = [
  // 기본 아이템
  {
    id: 'fp-gold-small',
    name: 'Gold Pouch',
    nameKo: '골드 주머니',
    description: '5,000 Gold',
    price: 50,
    rewards: [{ type: 'gold', quantity: 5000 }],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'fp-gold-large',
    name: 'Gold Bag',
    nameKo: '골드 자루',
    description: '25,000 Gold',
    price: 200,
    rewards: [{ type: 'gold', quantity: 25000 }],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'fp-diamond-small',
    name: 'Diamond Shard',
    nameKo: '다이아 조각',
    description: '10 Diamonds',
    price: 100,
    rewards: [{ type: 'diamond', quantity: 10 }],
    weeklyLimit: 5,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'fp-diamond-large',
    name: 'Diamond Crystal',
    nameKo: '다이아 결정',
    description: '50 Diamonds',
    price: 400,
    rewards: [{ type: 'diamond', quantity: 50 }],
    weeklyLimit: 2,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'fp-energy',
    name: 'Energy Pack',
    nameKo: '에너지 팩',
    description: '10 Exploration Energy',
    price: 80,
    rewards: [{ type: 'energy', quantity: 10 }],
    weeklyLimit: 10,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'fp-dna-small',
    name: 'DNA Sample',
    nameKo: 'DNA 샘플',
    description: '30 DNA',
    price: 150,
    rewards: [{ type: 'dna', quantity: 30 }],
    weeklyLimit: 5,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'fp-dna-large',
    name: 'DNA Vial',
    nameKo: 'DNA 바이알',
    description: '100 DNA',
    price: 400,
    rewards: [{ type: 'dna', quantity: 100 }],
    weeklyLimit: 2,
    isActive: true,
    sortOrder: 7,
  },

  // 특별 아이템
  {
    id: 'fp-chest-friendship',
    name: 'Friendship Chest',
    nameKo: '우정의 상자',
    description: 'Contains random rewards',
    price: 300,
    rewards: [{ type: 'item', id: 'chest-friendship', quantity: 1 }],
    weeklyLimit: 3,
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'fp-speedup-pack',
    name: 'Speedup Pack',
    nameKo: '가속 팩',
    description: '3x 1-hour speedups',
    price: 200,
    rewards: [{ type: 'item', id: 'speedup-1h', quantity: 3 }],
    weeklyLimit: 5,
    isActive: true,
    sortOrder: 11,
  },

  // 장식/스킨
  {
    id: 'fp-decoration-friendship-tree',
    name: 'Friendship Tree',
    nameKo: '우정의 나무',
    description: 'A beautiful decoration',
    price: 1000,
    rewards: [{ type: 'item', id: 'decoration-friendship-tree', quantity: 1 }],
    weeklyLimit: 1,
    isActive: true,
    sortOrder: 20,
  },
  {
    id: 'fp-frame-social',
    name: 'Social Butterfly Frame',
    nameKo: '소셜 나비 프레임',
    description: 'Exclusive profile frame',
    price: 2000,
    rewards: [{ type: 'item', id: 'frame-social-butterfly', quantity: 1 }],
    weeklyLimit: 1,
    isActive: true,
    sortOrder: 21,
  },
];

// ============================================================
// 랭킹 보상 (Ranking Rewards)
// ============================================================

export const RANKING_REWARDS: Record<string, RankingReward[]> = {
  parkLevel: [
    {
      rankMin: 1,
      rankMax: 1,
      rewards: [
        { type: 'diamond', quantity: 500 },
        { type: 'item', id: 'title-rank-1', quantity: 1 },
      ],
    },
    { rankMin: 2, rankMax: 3, rewards: [{ type: 'diamond', quantity: 300 }] },
    { rankMin: 4, rankMax: 10, rewards: [{ type: 'diamond', quantity: 150 }] },
    { rankMin: 11, rankMax: 50, rewards: [{ type: 'diamond', quantity: 80 }] },
    { rankMin: 51, rankMax: 100, rewards: [{ type: 'diamond', quantity: 50 }] },
  ],
  dinosaurCount: [
    {
      rankMin: 1,
      rankMax: 1,
      rewards: [
        { type: 'diamond', quantity: 400 },
        { type: 'dna', quantity: 500 },
      ],
    },
    {
      rankMin: 2,
      rankMax: 3,
      rewards: [
        { type: 'diamond', quantity: 250 },
        { type: 'dna', quantity: 300 },
      ],
    },
    {
      rankMin: 4,
      rankMax: 10,
      rewards: [
        { type: 'diamond', quantity: 120 },
        { type: 'dna', quantity: 150 },
      ],
    },
    {
      rankMin: 11,
      rankMax: 50,
      rewards: [
        { type: 'diamond', quantity: 60 },
        { type: 'dna', quantity: 80 },
      ],
    },
    {
      rankMin: 51,
      rankMax: 100,
      rewards: [
        { type: 'diamond', quantity: 30 },
        { type: 'dna', quantity: 50 },
      ],
    },
  ],
  revenue: [
    {
      rankMin: 1,
      rankMax: 1,
      rewards: [
        { type: 'diamond', quantity: 600 },
        { type: 'gold', quantity: 500000 },
      ],
    },
    {
      rankMin: 2,
      rankMax: 3,
      rewards: [
        { type: 'diamond', quantity: 350 },
        { type: 'gold', quantity: 300000 },
      ],
    },
    {
      rankMin: 4,
      rankMax: 10,
      rewards: [
        { type: 'diamond', quantity: 180 },
        { type: 'gold', quantity: 150000 },
      ],
    },
    {
      rankMin: 11,
      rankMax: 50,
      rewards: [
        { type: 'diamond', quantity: 90 },
        { type: 'gold', quantity: 80000 },
      ],
    },
    {
      rankMin: 51,
      rankMax: 100,
      rewards: [
        { type: 'diamond', quantity: 50 },
        { type: 'gold', quantity: 50000 },
      ],
    },
  ],
  seasonPoint: [
    {
      rankMin: 1,
      rankMax: 1,
      rewards: [
        { type: 'diamond', quantity: 1000 },
        { type: 'item', id: 'title-season-champion', quantity: 1 },
      ],
    },
    { rankMin: 2, rankMax: 3, rewards: [{ type: 'diamond', quantity: 500 }] },
    { rankMin: 4, rankMax: 10, rewards: [{ type: 'diamond', quantity: 250 }] },
    { rankMin: 11, rankMax: 50, rewards: [{ type: 'diamond', quantity: 120 }] },
    { rankMin: 51, rankMax: 100, rewards: [{ type: 'diamond', quantity: 60 }] },
  ],
};

// ============================================================
// 소셜 상수 (Social Constants)
// ============================================================

export const SOCIAL_CONSTANTS = {
  // 친구
  maxFriends: 100,
  maxPendingRequests: 50,
  friendSearchCooldownSeconds: 10,

  // 방문
  dailyVisitLimit: 20,
  visitDurationMinSeconds: 30,
  visitInteractionRewardCooldownSeconds: 60,

  // 선물
  dailyGiftSendLimit: 20,
  dailyGiftReceiveLimit: 50,
  giftExpirationDays: 7,

  // 친밀도
  maxIntimacyLevel: 10,
  intimacyExpPerGiftSent: 10,
  intimacyExpPerGiftReceived: 5,
  intimacyExpPerVisit: 3,
  intimacyExpForConsecutiveDay: 20,

  // 친구 포인트
  maxFriendPoints: 99999,
  friendPointsPerGiftSent: 5,
  friendPointsPerGiftReceived: 3,
  friendPointsPerVisit: 5,

  // 랭킹
  rankingUpdateIntervalMinutes: 60,
  rankingRewardDistributionDay: 'monday',
};

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * ID로 선물 아이템 조회
 */
export function getGiftItemById(id: string): GiftItem | undefined {
  return GIFT_ITEMS.find((item) => item.id === id);
}

/**
 * 타입별 활성화된 선물 아이템 조회
 */
export function getActiveGiftItemsByType(type: string): GiftItem[] {
  return GIFT_ITEMS.filter((item) => item.type === type && item.isActive);
}

/**
 * 친밀도 레벨 보상 조회
 */
export function getIntimacyRewardByLevel(level: number): IntimacyReward | undefined {
  return INTIMACY_REWARDS.find((reward) => reward.level === level);
}

/**
 * 친구 포인트 상점 아이템 조회
 */
export function getFriendPointShopItem(id: string): FriendPointShopItem | undefined {
  return FRIEND_POINT_SHOP.find((item) => item.id === id);
}

/**
 * 랭킹 보상 조회
 */
export function getRankingReward(rankingType: string, rank: number): RankingReward | undefined {
  const rewards = RANKING_REWARDS[rankingType];
  if (!rewards) return undefined;
  return rewards.find((r) => rank >= r.rankMin && rank <= r.rankMax);
}

// ============================================================
// 통계
// ============================================================

export const SOCIAL_STATS = {
  totalGiftItems: GIFT_ITEMS.length,
  activeGiftItems: GIFT_ITEMS.filter((g) => g.isActive).length,
  intimacyLevels: INTIMACY_REWARDS.length,
  friendPointShopItems: FRIEND_POINT_SHOP.length,
  rankingTypes: Object.keys(RANKING_REWARDS).length,
};
