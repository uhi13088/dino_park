/**
 * 소셜 시스템 타입 정의
 * 친구, 파크 방문, 선물
 */

import { BaseEntity } from './common.types';

// ============================================================
// 친구 시스템
// ============================================================

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface Friend extends BaseEntity {
  userId: string;
  friendId: string;
  status: FriendStatus;
  nickname?: string;          // 친구에게 붙인 별명
  lastVisitedAt?: Date;       // 마지막 방문 시간
  giftSentAt?: Date;          // 마지막 선물 발송 시간
  giftReceivedAt?: Date;      // 마지막 선물 수령 시간
}

export interface FriendRequest extends BaseEntity {
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
}

export interface FriendProfile {
  userId: string;
  nickname: string;
  level: number;
  parkName: string;
  parkLevel: number;
  dinosaurCount: number;
  lastOnlineAt: Date;
  avatarId?: string;
  titleId?: string;
}

// ============================================================
// 파크 방문 시스템
// ============================================================

export interface ParkVisit extends BaseEntity {
  visitorId: string;          // 방문자 ID
  hostId: string;             // 파크 주인 ID
  visitType: 'friend' | 'random' | 'featured';
  duration: number;           // 방문 시간 (초)
  interactionsCount: number;  // 인터랙션 횟수
  leftLike: boolean;          // 좋아요 남겼는지
  leftComment?: string;       // 방명록 코멘트
}

export interface ParkVisitReward {
  type: 'visitor' | 'host';
  rewards: VisitRewardItem[];
  bonusCondition?: string;
}

export interface VisitRewardItem {
  type: 'gold' | 'diamond' | 'energy' | 'friendPoint';
  quantity: number;
}

export interface GuestBook extends BaseEntity {
  parkOwnerId: string;
  visitorId: string;
  visitorNickname: string;
  message: string;
  likeCount: number;
}

// ============================================================
// 선물 시스템
// ============================================================

export type GiftType = 'daily' | 'special' | 'event' | 'achievement';

export interface Gift extends BaseEntity {
  senderId: string;
  receiverId: string;
  giftType: GiftType;
  giftItemId: string;
  status: 'pending' | 'claimed' | 'expired';
  expiresAt: Date;
  message?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  nameKo: string;
  type: GiftType;
  rewards: GiftReward[];
  cooldownHours: number;      // 동일 선물 발송 쿨다운
  maxDailyGifts: number;      // 일일 최대 발송 수
  requiredFriendLevel?: number; // 친밀도 요구 조건
  isActive: boolean;
}

export interface GiftReward {
  type: 'gold' | 'diamond' | 'dna' | 'energy' | 'item' | 'friendPoint';
  id?: string;
  quantity: number;
}

// ============================================================
// 친밀도 시스템
// ============================================================

export interface FriendIntimacy extends BaseEntity {
  userId: string;
  friendId: string;
  intimacyLevel: number;      // 1-10
  intimacyExp: number;
  totalGiftsSent: number;
  totalGiftsReceived: number;
  totalVisits: number;
  consecutiveInteractionDays: number;
}

export interface IntimacyReward {
  level: number;
  rewards: GiftReward[];
  unlocks: string[];          // 해금되는 기능/아이템
}

// ============================================================
// 친구 포인트
// ============================================================

export interface FriendPointShopItem {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  price: number;              // 친구 포인트 가격
  rewards: GiftReward[];
  weeklyLimit?: number;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// 랭킹 시스템
// ============================================================

export type RankingType =
  | 'parkLevel'
  | 'dinosaurCount'
  | 'revenue'
  | 'visitorCount'
  | 'seasonPoint';

export interface RankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  score: number;
  parkName?: string;
  avatarId?: string;
}

export interface RankingReward {
  rankMin: number;
  rankMax: number;
  rewards: GiftReward[];
}

// ============================================================
// 알림 시스템
// ============================================================

export type SocialNotificationType =
  | 'friendRequest'
  | 'friendAccepted'
  | 'giftReceived'
  | 'parkVisited'
  | 'guestbookComment'
  | 'rankingChange';

export interface SocialNotification extends BaseEntity {
  userId: string;
  type: SocialNotificationType;
  fromUserId?: string;
  fromNickname?: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
}
