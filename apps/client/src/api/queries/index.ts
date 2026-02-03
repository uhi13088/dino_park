/**
 * TanStack Query 쿼리/뮤테이션 정의
 * 타입은 @dino-park/shared에서 import
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, tokenManager } from '../client';

// ========================================
// Shared Types Import
// ========================================
import type {
  // Auth
  LoginResponse,
  ProfileResponse,
  TossLoginRequest,
  // User
  UserResponse,
  UserStatsResponse,
  // Park
  ParkResponse,
  ParkSummaryResponse,
  ParkRevenueResponse,
  // Dinosaur
  DinosaurResponse,
  DinosaurListResponse,
  CreateDinosaurRequest,
  UpdateDinosaurRequest,
  InteractDinosaurResponse,
  // Building
  BuildingResponse,
  BuildingListResponse,
  CreateBuildingRequest,
  AssignGreatFigureRequest,
  // Economy
  CurrencyResponse,
  TransactionListResponse,
  OfflineRevenueResponse,
  // Exploration
  ExplorationRegionsResponse,
  ExplorationResponse,
  ExplorationListResponse,
  ClaimExplorationResponse,
  // Hatching
  HatchingQueueResponse,
  // Great Figures
  GreatFigureResponse,
  GreatFigureListResponse,
  AvailableGreatFiguresResponse,
  RecruitGreatFigureRequest,
  RecruitGreatFigureResponse,
  GreatFigurePointsResponse,
  // Story
  StoryChapterListResponse,
  StartChapterResponse,
  AdvanceSceneResponse,
} from '@dino-park/shared';

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

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TossLoginRequest) => {
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
    mutationFn: (nickname: string) => api.patch<UserResponse>('/users/me/nickname', { nickname }),
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
    mutationFn: (name: string) => api.patch<ParkResponse>('/parks/me/name', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.park });
    },
  });
}

// ========================================
// Dinosaur Queries & Mutations
// ========================================

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
    mutationFn: (data: CreateDinosaurRequest) => api.post<DinosaurResponse>('/dinosaurs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dinosaurs });
      queryClient.invalidateQueries({ queryKey: queryKeys.parkSummary() });
    },
  });
}

export function useUpdateDinosaur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateDinosaurRequest) =>
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
    mutationFn: (id: string) => api.post<DinosaurResponse>(`/dinosaurs/${id}/feed`),
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
    mutationFn: (id: string) => api.post<InteractDinosaurResponse>(`/dinosaurs/${id}/interact`),
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
    mutationFn: (data: CreateBuildingRequest) => api.post<BuildingResponse>('/buildings', data),
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
    mutationFn: (id: string) => api.post<BuildingResponse>(`/buildings/${id}/upgrade`),
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
    mutationFn: ({
      buildingId,
      greatFigureId,
    }: { buildingId: string } & AssignGreatFigureRequest) =>
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
    mutationFn: (buildingId: string) => api.delete(`/buildings/${buildingId}/great-figure`),
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
    queryFn: () =>
      api.get<TransactionListResponse>(`/economy/transactions?page=${page}&limit=${limit}`),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useCollectOfflineRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<OfflineRevenueResponse>('/economy/offline-revenue'),
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

export function useExplorationRegions() {
  return useQuery({
    queryKey: queryKeys.explorationRegions(),
    queryFn: () => api.get<ExplorationRegionsResponse>('/explorations/regions'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useExplorations() {
  return useQuery({
    queryKey: queryKeys.explorationList(),
    queryFn: () => api.get<ExplorationListResponse>('/explorations'),
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
    mutationFn: (regionId: string) => api.post<ExplorationResponse>('/explorations', { regionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.explorations });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
    },
  });
}

export function useCheckExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<ExplorationResponse>(`/explorations/${id}/check`),
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
    mutationFn: (id: string) => api.post<ClaimExplorationResponse>(`/explorations/${id}/claim`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.explorations });
      queryClient.invalidateQueries({ queryKey: queryKeys.currency() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hatching });
    },
  });
}

// ========================================
// Great Figure Queries & Mutations
// ========================================

export function useGreatFigures() {
  return useQuery({
    queryKey: queryKeys.greatFigureList(),
    queryFn: () => api.get<GreatFigureListResponse>('/great-figures'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useAvailableGreatFigures() {
  return useQuery({
    queryKey: ['greatFigures', 'available'],
    queryFn: () => api.get<AvailableGreatFiguresResponse>('/great-figures/available'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useGreatFigurePoints() {
  return useQuery({
    queryKey: ['greatFigures', 'points'],
    queryFn: () => api.get<GreatFigurePointsResponse>('/great-figures/points'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useRecruitGreatFigure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecruitGreatFigureRequest) =>
      api.post<RecruitGreatFigureResponse>('/great-figures/recruit', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.greatFigures });
      queryClient.invalidateQueries({ queryKey: ['greatFigures', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['greatFigures', 'points'] });
    },
  });
}

export function useLevelUpGreatFigure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (figureId: string) =>
      api.post<GreatFigureResponse>(`/great-figures/${figureId}/level-up`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.greatFigures });
    },
  });
}

// ========================================
// Hatching Queries
// ========================================

export function useHatchingQueue() {
  return useQuery({
    queryKey: queryKeys.hatchingQueue(),
    queryFn: () => api.get<HatchingQueueResponse>('/explorations/hatching'),
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: 10000, // 10초마다 갱신
  });
}

// ========================================
// Story Queries & Mutations
// ========================================

export function useStoryChapters() {
  return useQuery({
    queryKey: queryKeys.stories,
    queryFn: () => api.get<StoryChapterListResponse>('/stories/chapters'),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useStoryProgress() {
  return useQuery({
    queryKey: queryKeys.storyProgress(),
    queryFn: () =>
      api.get<{ progress: Record<string, { completedScenes: number; isCompleted: boolean }> }>(
        '/stories/progress',
      ),
    enabled: tokenManager.isAuthenticated(),
  });
}

export function useStartChapter() {
  return useMutation({
    mutationFn: (chapterId: string) =>
      api.post<StartChapterResponse>(`/stories/${chapterId}/start`),
  });
}

export function useAdvanceScene() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      sceneId,
      choiceId,
    }: {
      chapterId: string;
      sceneId: string;
      choiceId?: string;
    }) =>
      api.post<AdvanceSceneResponse>(`/stories/${chapterId}/scenes/${sceneId}/advance`, {
        choiceId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storyProgress() });
    },
  });
}
