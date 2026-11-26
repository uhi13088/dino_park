import type { ExperimentalHybridIdentity } from './experimental-hybrid.types';
/**
 * API 요청/응답 타입 정의
 * 참조: docs/dino_park_technical_design.md
 */

import { User } from './user.types';
import { Park } from './park.types';
import { Currency, TransactionType } from './economy.types';
import { BuildingStatus } from './building.types';
import { ExplorationStatus } from './exploration.types';
import type { DinosaurCompetitiveStats } from './dinosaur.types';
import type { ParkEntranceSide } from '../utils/park-entrance.utils';
import type { ShuttleDepartureInterval, ShuttleRouteEstimate } from '../utils/park-shuttle.utils';

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
  user: Pick<User, 'id' | 'nickname' | 'level' | 'exp'>;
  currency: Pick<Currency, 'gold' | 'diamond' | 'dna'>;
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
  currency: Pick<Currency, 'gold' | 'diamond' | 'dna'>;
  park: Pick<Park, 'id' | 'name' | 'level'>;
}

// ========================================
// 유저 API
// ========================================

export interface UserResponse extends Pick<
  User,
  'id' | 'nickname' | 'level' | 'exp' | 'tutorialStep' | 'lastLoginAt'
> {}

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

export interface ParkResponse extends Pick<
  Park,
  'id' | 'name' | 'level' | 'exp' | 'gridSizeX' | 'gridSizeY'
> {}

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

export interface StarterParkResponse {
  granted: boolean;
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
  competitiveStats?: DinosaurCompetitiveStats | null;
  hybrid?: ExperimentalHybridIdentity;
}

export interface HybridExhibitSelection {
  currentId: string;
  candidateId: string;
}

export interface HybridExhibitRate {
  demandPerMinute: number;
  visitorsPerMinute: number;
  capacityPerMinute: number;
}

export interface HybridExhibitPreview {
  current: HybridExhibitRate;
  proposed: HybridExhibitRate | null;
  unavailableReason: string | null;
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

export interface PlaceDinosaurRequest {
  positionX: number;
  positionY: number;
}

export interface FeedDinosaurResponse extends DinosaurResponse {
  goldSpent: number;
  happinessGain: number;
  hungerReduce: number;
  intimacyGain: number;
}

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
  completesAt?: string | null;
  entranceSide?: ParkEntranceSide | null;
  isMirrored?: boolean;
}

export interface MoveParkEntranceRequest {
  positionX: number;
  positionY: number;
  side?: ParkEntranceSide;
}

export interface BuildingListResponse {
  buildings: BuildingResponse[];
  total: number;
}

export interface CreateBuildingRequest {
  typeId: string;
  positionX: number;
  positionY: number;
  isMirrored?: boolean;
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
  explorationEnergy?: number;
  maxExplorationEnergy?: number;
  minutesUntilNextEnergy?: number;
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
// 위인 API
// ========================================

export interface GreatFigureResponse {
  id: string;
  figureId: string;
  name: string;
  nameKo: string;
  job: string;
  rarity: string;
  level: number;
  exp: number;
  assignedBuildingId: string | null;
  description: string;
  quote: string;
}

export interface GreatFigureListResponse {
  greatFigures: GreatFigureResponse[];
  total: number;
}

export interface GreatFigureTypeResponse {
  id: string;
  name: string;
  nameKo: string;
  job: string;
  rarity: string;
  recruitCost: number;
  description: string;
  quote: string;
  isOwned: boolean;
  canRecruit: boolean;
}

export interface AvailableGreatFiguresResponse {
  greatFigures: GreatFigureTypeResponse[];
}

export interface RecruitGreatFigureRequest {
  figureId: string;
}

export interface RecruitGreatFigureResponse {
  greatFigure: GreatFigureResponse;
}

export interface AssignGreatFigureToBuildingRequest {
  buildingId: string;
}

export interface GreatFigurePointsResponse {
  points: number;
}

// ========================================
// 부화 API
// ========================================

export interface HatchingItemResponse {
  readyToStart?: boolean;
  sourceExplorationId?: string | null;
  claimedDinosaurId?: string | null;
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

// ========================================
// 스토리 API
// ========================================

export interface StoryChapterResponse {
  id: string;
  number: number;
  title: string;
  description: string;
  totalScenes: number;
  completedScenes: number;
  isCompleted: boolean;
  isLocked: boolean;
  unlockRequirement?: string;
}

export interface StoryChapterListResponse {
  chapters: StoryChapterResponse[];
}

export interface StorySceneResponse {
  id: string;
  chapterId: string;
  dialogues: Array<{
    speaker: string;
    text: string;
    emotion?: string;
  }>;
  choices?: Array<{
    id: string;
    text: string;
  }>;
  isLastScene: boolean;
}

export interface StoryProgressResponse {
  chapterId: string;
  currentSceneId: string | null;
  completedScenes: string[];
  choices: Record<string, string>;
}

export interface StartChapterResponse {
  scene: StorySceneResponse;
}

export interface AdvanceSceneRequest {
  choiceId?: string;
}

export interface AdvanceSceneResponse {
  scene: StorySceneResponse | null;
  rewards?: Array<{
    type: string;
    id: string;
    quantity: number;
  }>;
  isChapterComplete: boolean;
}

export interface ExhibitViewingExperience {
  crowdingPercent: number;
  satisfactionPercent: number;
}

export interface BuyShuttleBusRequest {
  requestId: string;
}

export interface SetShuttleRouteRequest {
  busCount: number;
  departureIntervalSeconds: ShuttleDepartureInterval;
}

export interface ParkShuttleDestination {
  exhibitId: string;
  typeId: string | null;
  distance: number | null;
  demandPerMinute: number;
  path: Array<{ x: number; y: number }>;
  route:
    | (SetShuttleRouteRequest & {
        status: 'running' | 'closed' | 'disconnected';
        estimate: ShuttleRouteEstimate | null;
      })
    | null;
}

export interface ParkShuttleResponse {
  unlocked: boolean;
  unavailableReason: string | null;
  ownedBusCount: number;
  unassignedBusCount: number;
  destinations: ParkShuttleDestination[];
}

/** Server-owned paid admission state; visitors drawn on the map are illustrative. */
export interface ParkOperationsResponse {
  isOpen: boolean;
  canOpen: boolean;
  openingRequirements: string[];
  ticketPrice: number;
  /** Operating throughput before the vault blocks paid admission. */
  visitorsPerMinute: number;
  demandPerMinute: number;
  /** Maximum admissions per minute given the entrance and exhibit turnover. */
  capacity: number;
  occupancy?: { current: number; capacity: number; visitSeconds: number };
  /** Current admission limits and the next supported upgrade's local viewing effect. */
  admission?: {
    gatePerMinute: number;
    exhibitPerMinute: number;
    exhibitCount: number;
    bottlenecks: Array<'demand' | 'entrance' | 'exhibit'>;
    entranceResearchCompleted: boolean;
    exhibitedDinosaurIds: string[];
    exhibits: Array<
      ExhibitViewingExperience & {
        id: string;
        dinosaurIds: string[];
        /** Walkable tiles from the entrance to this exhibit's viewing perimeter. */
        visitorPath?: Array<{ x: number; y: number }>;
        /** Estimated share of the people currently inside the park. */
        visitors?: number;
        viewingCapacity?: number;
      }
    >;
    platformImpact: {
      buildingId: string;
      fromLevel: number;
      toLevel: number;
      exhibitId: string | null;
      before: ExhibitViewingExperience | null;
      after: ExhibitViewingExperience | null;
    } | null;
  };
  totalVisitors: number;
  totalAdmissionGold: number;
  hourlyMaintenance: number;
  gold: number;
  goldVault?: {
    capacity: number;
    admissionPaused: boolean;
  };
  parkLevel: number;
  firstVisitorsGoal: { current: number; target: number; rewarded: boolean };
  pathTiles: Array<{ x: number; y: number }>;
  entrance: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    onBoundary: boolean;
    side?: ParkEntranceSide | null;
  } | null;
  suggestedEntrance: { x: number; y: number } | null;
  viewingPlatform: { id: string; level: number; status: string; completesAt: string | null } | null;
  shuttle?: ParkShuttleResponse;
}
