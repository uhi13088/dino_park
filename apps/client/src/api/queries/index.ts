/**
 * TanStack Query 쿼리/뮤테이션 정의
 * Phase 2 백엔드 완료 후 상세 구현
 */

// Query Keys
export const queryKeys = {
  // User
  user: ['user'] as const,
  userMe: () => [...queryKeys.user, 'me'] as const,

  // Park
  park: ['park'] as const,
  parkMe: () => [...queryKeys.park, 'me'] as const,

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

  // Exploration
  explorations: ['explorations'] as const,
  explorationList: () => [...queryKeys.explorations, 'list'] as const,

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

// 쿼리와 뮤테이션은 Phase 2 완료 후 구현
// 예시:
// export function useUserQuery() {
//   return useQuery({
//     queryKey: queryKeys.userMe(),
//     queryFn: () => api.get('/users/me'),
//   });
// }
