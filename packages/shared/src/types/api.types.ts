/**
 * API 요청/응답 타입 정의
 * 참조: docs/dino_park_technical_design.md
 */

import { User } from './user.types';
import { Park } from './park.types';
import { Currency, TransactionType } from './economy.types';
import { BuildingStatus } from './building.types';
import { ExplorationStatus } from './exploration.types';

// ========================================
// 공통 타입
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: number;
}

export interface IdParam {
  id: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// 인증 API
// ========================================

export interface TossLoginRequest {
  tossId: string;
  nickname?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: Pick<User, 'id' | 'nickname' | 'level'>;
  currency: Pick<Currency, 'gold' | 'diamond' | 'dna' | 'explorationEnergy'>;
  park: Pick<Park, 'id' | 'name' | 'level'>;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResponse {
  user: Pick<User, 'id' | 'nickname' | 'level' | 'exp'>;
  currency: Pick<Currency, 'gold' | 'diamond' | 'dna' | 'explorationEnergy'>;
  park: Pick<Park, 'id' | 'name' | 'level'>;
}

// ========================================
// 유저 API
// ========================================

export interface UserResponse extends Pick<User, 'id' | 'nickname' | 'level' | 'exp' | 'tutorialStep' | 'lastLoginAt'> {}

export interface UserStatsResponse {
  totalDinosaurs: number;
  totalBuildings: number;
  totalGreatFigures: number;
  hourlyRevenue: number;
}

export interface UpdateNicknameRequest {
  nickname: string;
}

export interface UpdateTutorialRequest {
  tutorialStep: number;
}

// ========================================
// 파크 API
// ========================================

export interface ParkResponse extends Pick<Park, 'id' | 'name' | 'level' | 'exp' | 'gridSizeX' | 'gridSizeY'> {}

export interface ParkSummaryResponse extends ParkResponse {
  dinosaurCount: number;
  buildingCount: number;
}

export interface ParkRevenueResponse {
  hourlyRevenue: number;
  maintenanceCost: number;
  netRevenue: number;
  offlineRevenue?: number;
}

export interface UpdateParkNameRequest {
  name: string;
}

// ========================================
// 공룡 API
// ========================================

export interface DinosaurResponse {
  id: string;
  speciesId: string;
  nickname: string | null;
  level: number;
  exp: number;
  happiness: number;
  hunger: number;
  intimacy: number;
  positionX: number;
  positionY: number;
  isInPark: boolean;
}

export interface DinosaurListResponse {
  dinosaurs: DinosaurResponse[];
  total: number;
}

export interface CreateDinosaurRequest {
  speciesId: string;
  positionX: number;
  positionY: number;
  nickname?: string;
}

export interface UpdateDinosaurRequest {
  nickname?: string;
  positionX?: number;
  positionY?: number;
}

export interface FeedDinosaurResponse extends DinosaurResponse {}

export interface InteractDinosaurResponse {
  dinosaur: DinosaurResponse;
  intimacyGain: number;
  expGain: number;
}

// ========================================
// 건물 API
// ========================================

export interface BuildingResponse {
  id: string;
  typeId: string;
  level: number;
  positionX: number;
  positionY: number;
  status: BuildingStatus;
  assignedGreatFigureId: string | null;
}

export interface BuildingListResponse {
  buildings: BuildingResponse[];
  total: number;
}

export interface CreateBuildingRequest {
  typeId: string;
  positionX: number;
  positionY: number;
}

export interface AssignGreatFigureRequest {
  greatFigureId: string;
}

// ========================================
// 경제 API
// ========================================

export interface CurrencyResponse {
  gold: number;
  diamond: number;
  dna: number;
  explorationEnergy: number;
  maxEnergy: number;
  energyRechargeAt: string | null;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  currencyType: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

export interface TransactionListResponse {
  transactions: TransactionResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface OfflineRevenueResponse {
  collected: number;
  hours: number;
}

// ========================================
// 탐험 API
// ========================================

export interface ExplorationRegionResponse {
  id: string;
  name: string;
  description: string;
  duration: number;
  unlockLevel: number;
  isUnlocked: boolean;
  energyCost: number;
  possibleRewards: string[];
}

export interface ExplorationResponse {
  id: string;
  regionId: string;
  status: ExplorationStatus;
  startedAt: string;
  completedAt: string | null;
  rewards: {
    gold?: number;
    dna?: number;
    egg?: { type: string; hatchTime: number };
  } | null;
  remainingSeconds?: number;
}

export interface ExplorationRegionsResponse {
  regions: ExplorationRegionResponse[];
}

export interface ExplorationListResponse {
  explorations: ExplorationResponse[];
}

export interface StartExplorationRequest {
  regionId: string;
}

export interface ClaimExplorationResponse {
  exploration: ExplorationResponse;
  rewards: ExplorationResponse['rewards'];
}

// ========================================
// 부화 API
// ========================================

export interface HatchingItemResponse {
  id: string;
  eggType: string;
  speciesId: string | null;
  startedAt: string;
  completesAt: string;
  completed: boolean;
  remainingSeconds?: number;
}

export interface HatchingQueueResponse {
  queue: HatchingItemResponse[];
}
