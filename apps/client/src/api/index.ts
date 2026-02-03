/**
 * API 모듈 내보내기
 */

export { api, ApiError, tokenManager } from './client';
export {
  queryKeys,
  // Auth
  useLogin,
  useProfile,
  useLogout,
  // User
  useUserMe,
  useUserStats,
  useUpdateNickname,
  useUpdateTutorial,
  // Park
  useParkMe,
  useParkSummary,
  useParkRevenue,
  useUpdateParkName,
  // Dinosaur
  useDinosaurs,
  useDinosaur,
  useCreateDinosaur,
  useUpdateDinosaur,
  useFeedDinosaur,
  useInteractDinosaur,
  useDeleteDinosaur,
  // Building
  useBuildings,
  useBuilding,
  useCreateBuilding,
  useUpgradeBuilding,
  useAssignGreatFigure,
  useUnassignGreatFigure,
  useDeleteBuilding,
  // Economy
  useCurrency,
  useTransactions,
  useCollectOfflineRevenue,
  useRefillEnergy,
  // Exploration
  useExplorationRegions,
  useExplorations,
  useExplorationInProgress,
  useStartExploration,
  useCheckExploration,
  useInstantCompleteExploration,
  useClaimExploration,
  // Hatching
  useHatchingQueue,
} from './queries';
