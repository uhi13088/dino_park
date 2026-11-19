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
  useParkOperations,
  useSetParkOpen,
  useMoveParkEntrance,
  useUpdateParkName,
  // Dinosaur
  useDinosaurs,
  useDinosaurCodex,
  useClaimStarterPark,
  usePlaceDinosaur,
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
  useCompleteBuilding,
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
  useFirstExpedition,
  useStartFirstExpedition,
  useChooseFirstExpedition,
  useClaimFirstExpedition,
  useStartHatchingEgg,
  useClaimHatchingEgg,
  // Hatching
  useHatchingQueue,
} from './queries';

export * from './queries/resources';
