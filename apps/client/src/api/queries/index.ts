/**
 * TanStack Query 쿼리/뮤테이션 정의
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, tokenManager } from '../client';

// ========================================
// Query Keys
// ========================================
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  authProfile: () => [...queryKeys.auth, 'profile'] as const,

  // User
  user: ['user'] as const,
  userMe: () => [...queryKeys.user, 'me'] as const,
  userStats: () => [...queryKeys.user, 'stats'] as const,

  // Park
  park: ['park'] as const,
  parkMe: () => [...queryKeys.park, 'me'] as const,
  parkSummary: () => [...queryKeys.park, 'summary'] as const,
  parkRevenue: () => [...queryKeys.park, 'revenue'] as const,

  // Dinosaurs
  dinosaurs: ['dinosaurs'] as const,
  dinosaurList: () => [...queryKeys.dinosaurs, 'list'] as const,
  dinosaurDetail: (id: string) => [...queryKeys.dinosaurs, id] as const,

  // Buildings
  buildings: ['buildings'] as const,
  buildingList: () => [...queryKeys.buildings, 'list'] as const,
  buildingDetail: (id: string) => [...queryKeys.buildings, id] as const,

  // Great Figures
  greatFigures: ['greatFigures'] as const,
  greatFigureList: () => [...queryKeys.greatFigures, 'list'] as const,

  // Economy
  economy: ['economy'] as const,
  currency: () => [...queryKeys.economy, 'currency'] as const,
  transactions: (page?: number) => [...queryKeys.economy, 'transactions', page] as const,

  // Exploration
  explorations: ['explorations'] as const,
  explorationRegions: () => [...queryKeys.explorations, 'regions'] as const,
  explorationList: () => [...queryKeys.explorations, 'list'] as const,
  explorationInProgress: () => [...queryKeys.explorations, 'in-progress'] as const,

  // Hatching
  hatching: ['hatching'] as const,
  hatchingQueue: () => [...queryKeys.hatching, 'queue'] as const,

  // Story
  stories: ['stories'] as const,
  storyProgress: () => [...queryKeys.stories, 'progress'] as const,

  // Shop
  shop: ['shop'] as const,
  shopProducts: () => [...queryKeys.shop, 'products'] as const,

  // Season
  season: ['season'] as const,
  seasonCurrent: () => [...queryKeys.season, 'current'] as const,
};

// ========================================
// Auth Queries & Mutations
// ========================================
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: { id: string; nickname: string; level: number };
  currency: { gold: number; diamond: number; dna: number; explorationEnergy: number };
  park: { id: string; name: string; level: number };
}

interface ProfileResponse {
  user: { id: string; nickname: string; level: number; exp: number };
  currency: { gold: number; diamond: number; dna: number; explorationEnergy: number };
  park: { id: string; name: string; level: number };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tossId: string; nickname?: string }) => {
      const response = await api.post<LoginResponse>('/auth/toss/login', data);
      tokenManager.setTokens(response.accessToken, response.refreshToken);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth });
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
      queryClient.invalidateQueries({ queryKey: queryKeys.park });
      queryClient.invalidateQueries({ queryKey: queryKeys.economy });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.authProfile(),
    queryFn: () => api.get<ProfileResponse>('/auth/profile'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      tokenManager.clearTokens();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ========================================
// User Queries & Mutations
// ========================================
interface UserResponse {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  tutorialStep: number;
  lastLoginAt: string;
}

interface UserStatsResponse {
  totalDinosaurs: number;
  totalBuildings: number;
  totalGreatFigures: number;
  hourlyRevenue: number;
}

export function useUserMe() {
  return useQuery({
    queryKey: queryKeys.userMe(),
    queryFn: () => api.get<UserResponse>('/users/me'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: () => api.get<UserStatsResponse>('/users/me/stats'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useUpdateNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nickname: string) =>
      api.patch<UserResponse>('/users/me/nickname', { nickname }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useUpdateTutorial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (step: number) =>
      api.patch<UserResponse>('/users/me/tutorial', { tutorialStep: step }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userMe() });
    },
  });
}

// ========================================
// Park Queries & Mutations
// ========================================
interface ParkResponse {
  id: string;
  name: string;
  level: number;
  exp: number;
  gridSizeX: number;
  gridSizeY: number;
}

interface ParkSummaryResponse extends ParkResponse {
  dinosaurCount: number;
  buildingCount: number;
}

interface ParkRevenueResponse {
  hourlyRevenue: number;
  maintenanceCost: number;
  netRevenue: number;
  offlineRevenue?: number;
}

export function useParkMe() {
  return useQuery({
    queryKey: queryKeys.parkMe(),
    queryFn: () => api.get<ParkResponse>('/parks/me'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useParkSummary() {
  return useQuery({
    queryKey: queryKeys.parkSummary(),
    queryFn: () => api.get<ParkSummaryResponse>('/parks/me/summary'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useParkRevenue() {
  return useQuery({
    queryKey: queryKeys.parkRevenue(),
    queryFn: () => api.get<ParkRevenueResponse>('/parks/me/revenue'),
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: 60000, // 1분마다 갱신
  });
}

export function useUpdateParkName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      api.patch<ParkResponse>('/parks/me/name', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.park });
    },
  });
}

// ========================================
// Dinosaur Queries & Mutations
// ========================================
interface DinosaurResponse {
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

interface DinosaurListResponse {
  dinosaurs: DinosaurResponse[];
  total: number;
}

export function useDinosaurs() {
  return useQuery({
    queryKey: queryKeys.dinosaurList(),
    queryFn: () => api.get<DinosaurListResponse>('/dinosaurs'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useDinosaur(id: string) {
  return useQuery({
    queryKey: queryKeys.dinosaurDetail(id),
    queryFn: () => api.get<DinosaurResponse>(`/dinosaurs/${id}`),
    enabled: tokenManager.isAuthenticated() && !!id,
  });
}

export function useCreateDinosaur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { speciesId: string; positionX: number; positionY: number; nickname?: string }) =>
      api.post<DinosaurResponse>('/dinosaurs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurs });
      queryClient.invalidateQueries({ queryKey: queryKeys.parkSummary() });
    },
  });
}

export function useUpdateDinosaur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nickname?: string; positionX?: number; positionY?: number }) =>
      api.patch<DinosaurResponse>(`/dinosaurs/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurList() });
    },
  });
}

export function useFeedDinosaur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<DinosaurResponse>(`/dinosaurs/${id}/feed`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurDetail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

export function useInteractDinosaur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ dinosaur: DinosaurResponse; intimacyGain: number; expGain: number }>(`/dinosaurs/${id}/interact`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurDetail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurList() });
    },
  });
}

export function useDeleteDinosaur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/dinosaurs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurs });
      queryClient.invalidateQueries({ queryKey: queryKeys.parkSummary() });
    },
  });
}

// ========================================
// Building Queries & Mutations
// ========================================
interface BuildingResponse {
  id: string;
  typeId: string;
  level: number;
  positionX: number;
  positionY: number;
  status: 'CONSTRUCTING' | 'ACTIVE' | 'UPGRADING';
  assignedGreatFigureId: string | null;
}

interface BuildingListResponse {
  buildings: BuildingResponse[];
  total: number;
}

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildingList(),
    queryFn: () => api.get<BuildingListResponse>('/buildings'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: queryKeys.buildingDetail(id),
    queryFn: () => api.get<BuildingResponse>(`/buildings/${id}`),
    enabled: tokenManager.isAuthenticated() && !!id,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { typeId: string; positionX: number; positionY: number }) =>
      api.post<BuildingResponse>('/buildings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings });
      queryClient.invalidateQueries({ queryKey: queryKeys.parkSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

export function useUpgradeBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<BuildingResponse>(`/buildings/${id}/upgrade`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildingDetail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.buildingList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

export function useAssignGreatFigure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ buildingId, greatFigureId }: { buildingId: string; greatFigureId: string }) =>
      api.post<BuildingResponse>(`/buildings/${buildingId}/assign-great-figure`, { greatFigureId }),
    onSuccess: (_, { buildingId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildingDetail(buildingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.greatFigures });
    },
  });
}

export function useUnassignGreatFigure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (buildingId: string) =>
      api.delete(`/buildings/${buildingId}/great-figure`),
    onSuccess: (_, buildingId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildingDetail(buildingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.greatFigures });
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/buildings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings });
      queryClient.invalidateQueries({ queryKey: queryKeys.parkSummary() });
    },
  });
}

// ========================================
// Economy Queries & Mutations
// ========================================
interface CurrencyResponse {
  gold: number;
  diamond: number;
  dna: number;
  explorationEnergy: number;
  maxEnergy: number;
  energyRechargeAt: string | null;
}

interface TransactionResponse {
  id: string;
  type: 'EARN' | 'SPEND' | 'PURCHASE' | 'REWARD';
  currencyType: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

interface TransactionListResponse {
  transactions: TransactionResponse[];
  total: number;
  page: number;
  limit: number;
}

export function useCurrency() {
  return useQuery({
    queryKey: queryKeys.currency(),
    queryFn: () => api.get<CurrencyResponse>('/economy/currency'),
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: 60000, // 1분마다 갱신 (에너지 회복 체크)
  });
}

export function useTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.transactions(page),
    queryFn: () => api.get<TransactionListResponse>(`/economy/transactions?page=${page}&limit=${limit}`),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useCollectOfflineRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<{ collected: number; hours: number }>('/economy/offline-revenue'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
    },
  });
}

export function useRefillEnergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<CurrencyResponse>('/economy/energy/refill'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

// ========================================
// Exploration Queries & Mutations
// ========================================
interface ExplorationRegion {
  id: string;
  name: string;
  description: string;
  duration: number;
  unlockLevel: number;
  isUnlocked: boolean;
  energyCost: number;
  possibleRewards: string[];
}

interface ExplorationResponse {
  id: string;
  regionId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
  startedAt: string;
  completedAt: string | null;
  rewards: {
    gold?: number;
    dna?: number;
    egg?: { type: string; hatchTime: number };
  } | null;
  remainingSeconds?: number;
}

export function useExplorationRegions() {
  return useQuery({
    queryKey: queryKeys.explorationRegions(),
    queryFn: () => api.get<{ regions: ExplorationRegion[] }>('/explorations/regions'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useExplorations() {
  return useQuery({
    queryKey: queryKeys.explorationList(),
    queryFn: () => api.get<{ explorations: ExplorationResponse[] }>('/explorations'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useExplorationInProgress() {
  return useQuery({
    queryKey: queryKeys.explorationInProgress(),
    queryFn: () => api.get<ExplorationResponse | null>('/explorations/in-progress'),
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: 10000, // 10초마다 갱신
  });
}

export function useStartExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (regionId: string) =>
      api.post<ExplorationResponse>('/explorations', { regionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.explorations });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

export function useCheckExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<ExplorationResponse>(`/explorations/${id}/check`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.explorations });
    },
  });
}

export function useInstantCompleteExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<ExplorationResponse>(`/explorations/${id}/instant-complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.explorations });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

export function useClaimExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ exploration: ExplorationResponse; rewards: ExplorationResponse['rewards'] }>(`/explorations/${id}/claim`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.explorations });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hatching });
    },
  });
}

// ========================================
// Hatching Queries
// ========================================
interface HatchingItem {
  id: string;
  eggType: string;
  speciesId: string | null;
  startedAt: string;
  completesAt: string;
  completed: boolean;
  remainingSeconds?: number;
}

export function useHatchingQueue() {
  return useQuery({
    queryKey: queryKeys.hatchingQueue(),
    queryFn: () => api.get<{ queue: HatchingItem[] }>('/explorations/hatching'),
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: 10000, // 10초마다 갱신
  });
}
