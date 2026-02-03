/**
 * 상점/IAP 관련 타입 정의
 */

import { BaseEntity } from './common.types';

// ============================================================
// 상품 카테고리
// ============================================================

export type ShopCategory =
  | 'diamond'        // 다이아 팩
  | 'subscription'   // 월정액/구독
  | 'seasonPass'     // 시즌 패스
  | 'starterPack'    // 스타터/확장팩
  | 'premium'        // 프리미엄 콘텐츠
  | 'special'        // 특별 한정
  | 'goldShop';      // 골드샵 (인게임 재화로 구매)

// ============================================================
// IAP 상품 (실제 결제)
// ============================================================

export interface IAPProduct {
  id: string;
  name: string;
  nameKo: string;
  category: ShopCategory;
  description: string;
  descriptionKo: string;
  price: number;              // 원화 가격 (KRW)
  originalPrice?: number;     // 할인 전 가격
  discount?: number;          // 할인율 (%)
  rewards: IAPReward[];
  isLimited: boolean;         // 한정 판매 여부
  limitPerUser?: number;      // 유저당 구매 제한
  availableFrom?: string;     // 판매 시작일
  availableUntil?: string;    // 판매 종료일
  isActive: boolean;
  sortOrder: number;
  tags?: string[];
}

export interface IAPReward {
  type: 'diamond' | 'gold' | 'dna' | 'dinosaur' | 'greatFigure' | 'skin' | 'item' | 'energy' | 'seasonPoint';
  id?: string;
  quantity: number;
  isBonus?: boolean;          // 보너스 아이템 여부
}

// ============================================================
// 구독 상품
// ============================================================

export interface SubscriptionProduct extends IAPProduct {
  duration: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'yearly';
  dailyRewards: IAPReward[];  // 매일 지급되는 보상
  immediateRewards: IAPReward[]; // 구매 즉시 지급
  autoRenew: boolean;
}

// ============================================================
// 골드샵 (인게임 재화로 구매)
// ============================================================

export interface GoldShopItem {
  id: string;
  name: string;
  nameKo: string;
  category: 'energy' | 'speedup' | 'chest' | 'resource' | 'special';
  description: string;
  priceType: 'gold' | 'diamond';
  price: number;
  rewards: IAPReward[];
  dailyLimit?: number;
  weeklyLimit?: number;
  refreshTime?: string;       // 리셋 시간 (daily/weekly)
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// 광고 보상
// ============================================================

export type AdType = 'rewarded' | 'interstitial' | 'banner';

export interface AdRewardConfig {
  id: string;
  type: AdType;
  placement: string;          // 광고 위치 (예: 'hatchery_speedup', 'daily_bonus')
  rewards: IAPReward[];
  cooldownMinutes: number;    // 재시청 쿨다운 (분)
  dailyLimit: number;         // 일일 시청 제한
  isActive: boolean;
}

// ============================================================
// 구매 기록
// ============================================================

export interface PurchaseRecord extends BaseEntity {
  userId: string;
  productId: string;
  productType: 'iap' | 'goldShop' | 'adReward';
  price: number;
  priceType: 'krw' | 'gold' | 'diamond' | 'free';
  rewards: IAPReward[];
  transactionId?: string;     // 결제 트랜잭션 ID
  platform?: 'toss' | 'ios' | 'android';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
}

// ============================================================
// 유저 구독 상태
// ============================================================

export interface UserSubscription extends BaseEntity {
  userId: string;
  productId: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
  lastRewardClaimedAt?: Date;
}

// ============================================================
// 특별 패키지 (시간 제한)
// ============================================================

export interface SpecialPackage extends IAPProduct {
  triggerCondition: SpecialPackageTrigger;
  displayDurationHours: number;  // 표시 시간 제한
}

export interface SpecialPackageTrigger {
  type: 'levelUp' | 'firstPurchase' | 'returnUser' | 'event' | 'achievement';
  value?: string | number;
}
