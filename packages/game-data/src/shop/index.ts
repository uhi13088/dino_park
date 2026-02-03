/**
 * 상점/IAP 데이터 - 다이노 파크 타이쿤
 * Phase 6: 수익화 시스템
 */

import type {
  IAPProduct,
  SubscriptionProduct,
  GoldShopItem,
  AdRewardConfig,
  SpecialPackage,
} from '@dino-park/shared';

// ============================================================
// 다이아 팩 (Diamond Packs)
// ============================================================

export const DIAMOND_PACKS: IAPProduct[] = [
  {
    id: 'diamond-pack-xs',
    name: 'Diamond Pack XS',
    nameKo: '다이아 팩 XS',
    category: 'diamond',
    description: 'A small pack of diamonds',
    descriptionKo: '소량의 다이아',
    price: 1100,
    rewards: [{ type: 'diamond', quantity: 60 }],
    isLimited: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'diamond-pack-s',
    name: 'Diamond Pack S',
    nameKo: '다이아 팩 S',
    category: 'diamond',
    description: 'A pack of diamonds',
    descriptionKo: '다이아 팩',
    price: 3300,
    rewards: [
      { type: 'diamond', quantity: 200 },
      { type: 'diamond', quantity: 20, isBonus: true },
    ],
    isLimited: false,
    isActive: true,
    sortOrder: 2,
    tags: ['popular'],
  },
  {
    id: 'diamond-pack-m',
    name: 'Diamond Pack M',
    nameKo: '다이아 팩 M',
    category: 'diamond',
    description: 'A medium pack of diamonds',
    descriptionKo: '중간 다이아 팩',
    price: 5500,
    rewards: [
      { type: 'diamond', quantity: 350 },
      { type: 'diamond', quantity: 50, isBonus: true },
    ],
    isLimited: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'diamond-pack-l',
    name: 'Diamond Pack L',
    nameKo: '다이아 팩 L',
    category: 'diamond',
    description: 'A large pack of diamonds',
    descriptionKo: '대형 다이아 팩',
    price: 11000,
    rewards: [
      { type: 'diamond', quantity: 750 },
      { type: 'diamond', quantity: 150, isBonus: true },
    ],
    isLimited: false,
    isActive: true,
    sortOrder: 4,
    tags: ['best-value'],
  },
  {
    id: 'diamond-pack-xl',
    name: 'Diamond Pack XL',
    nameKo: '다이아 팩 XL',
    category: 'diamond',
    description: 'An extra large pack of diamonds',
    descriptionKo: '특대형 다이아 팩',
    price: 55000,
    rewards: [
      { type: 'diamond', quantity: 4000 },
      { type: 'diamond', quantity: 1000, isBonus: true },
    ],
    isLimited: false,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'diamond-pack-xxl',
    name: 'Diamond Pack XXL',
    nameKo: '다이아 팩 XXL',
    category: 'diamond',
    description: 'The ultimate diamond pack',
    descriptionKo: '최고급 다이아 팩',
    price: 109000,
    rewards: [
      { type: 'diamond', quantity: 8500 },
      { type: 'diamond', quantity: 2500, isBonus: true },
    ],
    isLimited: false,
    isActive: true,
    sortOrder: 6,
    tags: ['whale'],
  },
];

// ============================================================
// 구독 상품 (Subscriptions)
// ============================================================

export const SUBSCRIPTIONS: SubscriptionProduct[] = [
  {
    id: 'monthly-pass',
    name: 'Monthly Pass',
    nameKo: '월정액 패스',
    category: 'subscription',
    description: 'Daily rewards for 30 days + instant bonus',
    descriptionKo: '30일간 매일 보상 + 즉시 보너스',
    price: 9900,
    rewards: [],
    dailyRewards: [
      { type: 'diamond', quantity: 30 },
      { type: 'gold', quantity: 5000 },
      { type: 'energy', quantity: 10 },
    ],
    immediateRewards: [
      { type: 'diamond', quantity: 300 },
      { type: 'gold', quantity: 50000 },
    ],
    duration: 'monthly',
    autoRenew: true,
    isLimited: false,
    isActive: true,
    sortOrder: 1,
    tags: ['best-value', 'recommended'],
  },
  {
    id: 'growth-pass',
    name: 'Growth Pass',
    nameKo: '성장 패스',
    category: 'subscription',
    description: 'Boost your park growth for 30 days',
    descriptionKo: '30일간 파크 성장 부스트',
    price: 4900,
    rewards: [],
    dailyRewards: [
      { type: 'dna', quantity: 50 },
      { type: 'gold', quantity: 3000 },
    ],
    immediateRewards: [
      { type: 'dna', quantity: 500 },
      { type: 'item', id: 'exp-boost-7d', quantity: 1 },
    ],
    duration: 'monthly',
    autoRenew: true,
    isLimited: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'season-pass-premium',
    name: 'Premium Season Pass',
    nameKo: '프리미엄 시즌 패스',
    category: 'seasonPass',
    description: 'Unlock premium rewards track for the season',
    descriptionKo: '시즌 프리미엄 보상 트랙 해금',
    price: 9900,
    rewards: [{ type: 'seasonPoint', quantity: 500 }],
    dailyRewards: [],
    immediateRewards: [
      { type: 'seasonPoint', quantity: 500 },
      { type: 'diamond', quantity: 100 },
    ],
    duration: 'seasonal',
    autoRenew: false,
    isLimited: false,
    isActive: true,
    sortOrder: 1,
    tags: ['season'],
  },
];

// ============================================================
// 스타터/확장 팩 (Starter & Expansion Packs)
// ============================================================

export const STARTER_PACKS: IAPProduct[] = [
  {
    id: 'starter-pack-beginner',
    name: 'Beginner Starter Pack',
    nameKo: '초보자 스타터 팩',
    category: 'starterPack',
    description: 'Perfect start for new park managers',
    descriptionKo: '새로운 파크 매니저를 위한 완벽한 시작',
    price: 3900,
    originalPrice: 9900,
    discount: 60,
    rewards: [
      { type: 'diamond', quantity: 500 },
      { type: 'gold', quantity: 100000 },
      { type: 'dna', quantity: 300 },
      { type: 'dinosaur', id: 'triceratops', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 1,
    tags: ['new-user', 'best-value'],
  },
  {
    id: 'starter-pack-growth',
    name: 'Growth Starter Pack',
    nameKo: '성장 스타터 팩',
    category: 'starterPack',
    description: 'Accelerate your park growth',
    descriptionKo: '파크 성장 가속화',
    price: 6900,
    originalPrice: 15000,
    discount: 54,
    rewards: [
      { type: 'diamond', quantity: 1000 },
      { type: 'gold', quantity: 200000 },
      { type: 'dna', quantity: 500 },
      { type: 'dinosaur', id: 'stegosaurus', quantity: 1 },
      { type: 'greatFigure', id: 'charles-darwin', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 2,
    tags: ['best-value'],
  },
  {
    id: 'expansion-pack-carnivore',
    name: 'Carnivore Expansion',
    nameKo: '육식공룡 확장팩',
    category: 'starterPack',
    description: 'Unlock powerful carnivores',
    descriptionKo: '강력한 육식공룡 해금',
    price: 11000,
    rewards: [
      { type: 'diamond', quantity: 500 },
      { type: 'dna', quantity: 1000 },
      { type: 'dinosaur', id: 'velociraptor', quantity: 1 },
      { type: 'dinosaur', id: 'allosaurus', quantity: 1 },
      { type: 'dinosaur', id: 'carnotaurus', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'expansion-pack-marine',
    name: 'Marine Expansion',
    nameKo: '해양 확장팩',
    category: 'starterPack',
    description: 'Dive into the ocean world',
    descriptionKo: '해양 세계로 뛰어들기',
    price: 15000,
    rewards: [
      { type: 'diamond', quantity: 800 },
      { type: 'dna', quantity: 1500 },
      { type: 'dinosaur', id: 'mosasaurus', quantity: 1 },
      { type: 'dinosaur', id: 'plesiosaurus', quantity: 1 },
      { type: 'dinosaur', id: 'ichthyosaurus', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 4,
  },
];

// ============================================================
// 프리미엄 콘텐츠 (Premium Content)
// ============================================================

export const PREMIUM_CONTENT: IAPProduct[] = [
  {
    id: 'premium-dino-trex-gold',
    name: 'Golden T-Rex',
    nameKo: '황금 티라노사우루스',
    category: 'premium',
    description: 'A majestic golden T-Rex with bonus stats',
    descriptionKo: '웅장한 황금 티렉스, 보너스 스탯 포함',
    price: 6900,
    rewards: [
      { type: 'dinosaur', id: 'tyrannosaurus-gold', quantity: 1 },
      { type: 'skin', id: 'trex-gold-skin', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 1,
    tags: ['limited', 'legendary'],
  },
  {
    id: 'premium-dino-indominus',
    name: 'Indominus Rex Pack',
    nameKo: '인도미누스 렉스 팩',
    category: 'premium',
    description: 'The ultimate hybrid predator',
    descriptionKo: '궁극의 하이브리드 포식자',
    price: 19900,
    rewards: [
      { type: 'dinosaur', id: 'indominus-rex', quantity: 1 },
      { type: 'dna', quantity: 2000 },
      { type: 'diamond', quantity: 500 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 2,
    tags: ['limited', 'legendary'],
  },
  {
    id: 'premium-figure-hammond',
    name: 'Arthur Hammond Pack',
    nameKo: '아서 해먼드 팩',
    category: 'premium',
    description: 'The legendary founder himself',
    descriptionKo: '전설적인 창립자',
    price: 9900,
    rewards: [
      { type: 'greatFigure', id: 'arthur-hammond', quantity: 1 },
      { type: 'diamond', quantity: 300 },
      { type: 'item', id: 'founder-decoration', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 3,
    tags: ['legendary'],
  },
  {
    id: 'premium-skin-pack-neon',
    name: 'Neon Skin Pack',
    nameKo: '네온 스킨 팩',
    category: 'premium',
    description: '5 exclusive neon dinosaur skins',
    descriptionKo: '5종 한정 네온 공룡 스킨',
    price: 4900,
    rewards: [
      { type: 'skin', id: 'trex-neon', quantity: 1 },
      { type: 'skin', id: 'velociraptor-neon', quantity: 1 },
      { type: 'skin', id: 'brachio-neon', quantity: 1 },
      { type: 'skin', id: 'stego-neon', quantity: 1 },
      { type: 'skin', id: 'tricera-neon', quantity: 1 },
    ],
    isLimited: false,
    isActive: true,
    sortOrder: 4,
  },
];

// ============================================================
// 특별 패키지 (Special Packages - Triggered)
// ============================================================

export const SPECIAL_PACKAGES: SpecialPackage[] = [
  {
    id: 'special-levelup-10',
    name: 'Level 10 Celebration Pack',
    nameKo: '레벨 10 축하 팩',
    category: 'special',
    description: 'Celebrate reaching level 10!',
    descriptionKo: '레벨 10 달성을 축하합니다!',
    price: 3900,
    originalPrice: 9900,
    discount: 60,
    rewards: [
      { type: 'diamond', quantity: 500 },
      { type: 'gold', quantity: 100000 },
      { type: 'dinosaur', id: 'parasaurolophus', quantity: 1 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 1,
    triggerCondition: { type: 'levelUp', value: 10 },
    displayDurationHours: 24,
  },
  {
    id: 'special-levelup-25',
    name: 'Level 25 Celebration Pack',
    nameKo: '레벨 25 축하 팩',
    category: 'special',
    description: 'Celebrate reaching level 25!',
    descriptionKo: '레벨 25 달성을 축하합니다!',
    price: 6900,
    originalPrice: 15000,
    discount: 54,
    rewards: [
      { type: 'diamond', quantity: 1000 },
      { type: 'gold', quantity: 250000 },
      { type: 'dinosaur', id: 'spinosaurus', quantity: 1 },
      { type: 'dna', quantity: 500 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 2,
    triggerCondition: { type: 'levelUp', value: 25 },
    displayDurationHours: 48,
  },
  {
    id: 'special-first-purchase',
    name: 'First Purchase Bonus',
    nameKo: '첫 구매 보너스',
    category: 'special',
    description: 'Double rewards on your first purchase!',
    descriptionKo: '첫 구매 시 보상 2배!',
    price: 1100,
    rewards: [
      { type: 'diamond', quantity: 120 },
      { type: 'gold', quantity: 20000 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 3,
    triggerCondition: { type: 'firstPurchase' },
    displayDurationHours: 72,
    tags: ['first-purchase'],
  },
  {
    id: 'special-return-user',
    name: 'Welcome Back Pack',
    nameKo: '돌아온 파크장 팩',
    category: 'special',
    description: 'Welcome back to your park!',
    descriptionKo: '파크로 돌아온 것을 환영합니다!',
    price: 4900,
    originalPrice: 11000,
    discount: 55,
    rewards: [
      { type: 'diamond', quantity: 700 },
      { type: 'gold', quantity: 150000 },
      { type: 'energy', quantity: 50 },
      { type: 'dna', quantity: 300 },
    ],
    isLimited: true,
    limitPerUser: 1,
    isActive: true,
    sortOrder: 4,
    triggerCondition: { type: 'returnUser' },
    displayDurationHours: 48,
    tags: ['return-user'],
  },
];

// ============================================================
// 골드샵 (In-game Currency Shop)
// ============================================================

export const GOLD_SHOP_ITEMS: GoldShopItem[] = [
  // Energy
  {
    id: 'goldshop-energy-small',
    name: 'Energy Refill',
    nameKo: '에너지 충전',
    category: 'energy',
    description: 'Restore 10 exploration energy',
    priceType: 'diamond',
    price: 30,
    rewards: [{ type: 'energy', quantity: 10 }],
    dailyLimit: 5,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'goldshop-energy-full',
    name: 'Full Energy Refill',
    nameKo: '에너지 완전 충전',
    category: 'energy',
    description: 'Fully restore exploration energy',
    priceType: 'diamond',
    price: 50,
    rewards: [{ type: 'energy', quantity: 30 }],
    dailyLimit: 3,
    isActive: true,
    sortOrder: 2,
  },
  // Speedups
  {
    id: 'goldshop-speedup-1h',
    name: '1 Hour Speedup',
    nameKo: '1시간 가속',
    category: 'speedup',
    description: 'Speed up any process by 1 hour',
    priceType: 'diamond',
    price: 20,
    rewards: [{ type: 'item', id: 'speedup-1h', quantity: 1 }],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'goldshop-speedup-8h',
    name: '8 Hour Speedup',
    nameKo: '8시간 가속',
    category: 'speedup',
    description: 'Speed up any process by 8 hours',
    priceType: 'diamond',
    price: 100,
    rewards: [{ type: 'item', id: 'speedup-8h', quantity: 1 }],
    isActive: true,
    sortOrder: 2,
  },
  // Chests
  {
    id: 'goldshop-chest-bronze',
    name: 'Bronze Chest',
    nameKo: '청동 상자',
    category: 'chest',
    description: 'Contains random rewards',
    priceType: 'gold',
    price: 10000,
    rewards: [{ type: 'item', id: 'chest-bronze', quantity: 1 }],
    dailyLimit: 3,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'goldshop-chest-silver',
    name: 'Silver Chest',
    nameKo: '은 상자',
    category: 'chest',
    description: 'Contains better rewards',
    priceType: 'gold',
    price: 50000,
    rewards: [{ type: 'item', id: 'chest-silver', quantity: 1 }],
    dailyLimit: 2,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'goldshop-chest-gold',
    name: 'Gold Chest',
    nameKo: '금 상자',
    category: 'chest',
    description: 'Contains premium rewards',
    priceType: 'diamond',
    price: 150,
    rewards: [{ type: 'item', id: 'chest-gold', quantity: 1 }],
    dailyLimit: 1,
    isActive: true,
    sortOrder: 3,
  },
  // Resources
  {
    id: 'goldshop-gold-small',
    name: 'Gold Bundle',
    nameKo: '골드 번들',
    category: 'resource',
    description: '50,000 Gold',
    priceType: 'diamond',
    price: 50,
    rewards: [{ type: 'gold', quantity: 50000 }],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'goldshop-dna-small',
    name: 'DNA Bundle',
    nameKo: 'DNA 번들',
    category: 'resource',
    description: '100 DNA',
    priceType: 'diamond',
    price: 80,
    rewards: [{ type: 'dna', quantity: 100 }],
    isActive: true,
    sortOrder: 2,
  },
];

// ============================================================
// 광고 보상 설정 (Ad Rewards)
// ============================================================

export const AD_REWARD_CONFIGS: AdRewardConfig[] = [
  {
    id: 'ad-daily-bonus',
    type: 'rewarded',
    placement: 'daily_bonus',
    rewards: [
      { type: 'diamond', quantity: 10 },
      { type: 'gold', quantity: 2000 },
    ],
    cooldownMinutes: 0,
    dailyLimit: 3,
    isActive: true,
  },
  {
    id: 'ad-hatchery-speedup',
    type: 'rewarded',
    placement: 'hatchery_speedup',
    rewards: [{ type: 'item', id: 'speedup-30m', quantity: 1 }],
    cooldownMinutes: 30,
    dailyLimit: 5,
    isActive: true,
  },
  {
    id: 'ad-exploration-energy',
    type: 'rewarded',
    placement: 'exploration_energy',
    rewards: [{ type: 'energy', quantity: 5 }],
    cooldownMinutes: 60,
    dailyLimit: 5,
    isActive: true,
  },
  {
    id: 'ad-double-revenue',
    type: 'rewarded',
    placement: 'double_revenue',
    rewards: [{ type: 'item', id: 'revenue-boost-30m', quantity: 1 }],
    cooldownMinutes: 120,
    dailyLimit: 3,
    isActive: true,
  },
  {
    id: 'ad-free-chest',
    type: 'rewarded',
    placement: 'free_chest',
    rewards: [{ type: 'item', id: 'chest-bronze', quantity: 1 }],
    cooldownMinutes: 240,
    dailyLimit: 2,
    isActive: true,
  },
  {
    id: 'ad-expedition-boost',
    type: 'rewarded',
    placement: 'expedition_boost',
    rewards: [{ type: 'item', id: 'expedition-boost', quantity: 1 }],
    cooldownMinutes: 180,
    dailyLimit: 3,
    isActive: true,
  },
];

// ============================================================
// 전체 상품 목록 (Export)
// ============================================================

export const ALL_IAP_PRODUCTS: IAPProduct[] = [
  ...DIAMOND_PACKS,
  ...SUBSCRIPTIONS,
  ...STARTER_PACKS,
  ...PREMIUM_CONTENT,
  ...SPECIAL_PACKAGES,
];

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * ID로 IAP 상품 조회
 */
export function getIAPProductById(id: string): IAPProduct | undefined {
  return ALL_IAP_PRODUCTS.find((p) => p.id === id);
}

/**
 * 카테고리별 IAP 상품 조회
 */
export function getIAPProductsByCategory(category: string): IAPProduct[] {
  return ALL_IAP_PRODUCTS.filter((p) => p.category === category && p.isActive);
}

/**
 * 골드샵 아이템 조회
 */
export function getGoldShopItemById(id: string): GoldShopItem | undefined {
  return GOLD_SHOP_ITEMS.find((item) => item.id === id);
}

/**
 * 광고 보상 설정 조회
 */
export function getAdRewardConfig(placement: string): AdRewardConfig | undefined {
  return AD_REWARD_CONFIGS.find((config) => config.placement === placement && config.isActive);
}

/**
 * 특별 패키지 트리거 조회
 */
export function getSpecialPackageByTrigger(
  triggerType: string,
  value?: string | number,
): SpecialPackage | undefined {
  return SPECIAL_PACKAGES.find(
    (pkg) =>
      pkg.triggerCondition.type === triggerType &&
      (value === undefined || pkg.triggerCondition.value === value) &&
      pkg.isActive,
  );
}

// ============================================================
// 통계
// ============================================================

export const SHOP_STATS = {
  totalIAPProducts: ALL_IAP_PRODUCTS.length,
  diamondPacks: DIAMOND_PACKS.length,
  subscriptions: SUBSCRIPTIONS.length,
  starterPacks: STARTER_PACKS.length,
  premiumContent: PREMIUM_CONTENT.length,
  specialPackages: SPECIAL_PACKAGES.length,
  goldShopItems: GOLD_SHOP_ITEMS.length,
  adRewardPlacements: AD_REWARD_CONFIGS.length,
};
