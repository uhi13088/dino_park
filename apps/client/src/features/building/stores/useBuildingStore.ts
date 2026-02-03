import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Building, BuildingStatus } from '@dino-park/shared';

// 건물 필터 타입
export type BuildingFilter =
  | 'all'
  | 'dinosaur'
  | 'visitor'
  | 'amenity'
  | 'production'
  | 'research'
  | 'operation'
  | 'decoration';

// 건물 정렬 타입
export type BuildingSort = 'recent' | 'level' | 'revenue' | 'category';

interface BuildingState {
  // 건물 목록 (로컬 캐시)
  buildings: Building[];
  setBuildings: (buildings: Building[]) => void;
  addBuilding: (building: Building) => void;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  removeBuilding: (id: string) => void;

  // 필터 및 정렬
  filter: BuildingFilter;
  setFilter: (filter: BuildingFilter) => void;
  sort: BuildingSort;
  setSort: (sort: BuildingSort) => void;

  // 선택된 건물 (상세 보기용)
  selectedBuildingId: string | null;
  selectBuilding: (id: string | null) => void;

  // 건물 배치 모드
  isPlacementMode: boolean;
  placementTypeId: string | null;
  startPlacement: (typeId: string) => void;
  cancelPlacement: () => void;
  confirmPlacement: () => void;

  // 업그레이드 확인 모달
  upgradeModalBuildingId: string | null;
  showUpgradeModal: (buildingId: string) => void;
  hideUpgradeModal: () => void;

  // 위인 배정 모달
  assignModalBuildingId: string | null;
  showAssignModal: (buildingId: string) => void;
  hideAssignModal: () => void;

  // 로딩 상태
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // 리셋
  reset: () => void;
}

const initialState = {
  buildings: [],
  filter: 'all' as BuildingFilter,
  sort: 'recent' as BuildingSort,
  selectedBuildingId: null,
  isPlacementMode: false,
  placementTypeId: null,
  upgradeModalBuildingId: null,
  assignModalBuildingId: null,
  isLoading: false,
};

export const useBuildingStore = create<BuildingState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 건물 목록 관리
      setBuildings: (buildings) => set({ buildings }),

      addBuilding: (building) =>
        set((state) => ({
          buildings: [...state.buildings, building],
        })),

      updateBuilding: (id, updates) =>
        set((state) => ({
          buildings: state.buildings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      removeBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
          selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
        })),

      // 필터/정렬
      setFilter: (filter) => set({ filter }),
      setSort: (sort) => set({ sort }),

      // 건물 선택
      selectBuilding: (id) => set({ selectedBuildingId: id }),

      // 배치 모드
      startPlacement: (typeId) =>
        set({
          isPlacementMode: true,
          placementTypeId: typeId,
          selectedBuildingId: null,
        }),

      cancelPlacement: () =>
        set({
          isPlacementMode: false,
          placementTypeId: null,
        }),

      confirmPlacement: () =>
        set({
          isPlacementMode: false,
          placementTypeId: null,
        }),

      // 업그레이드 모달
      showUpgradeModal: (buildingId) => set({ upgradeModalBuildingId: buildingId }),
      hideUpgradeModal: () => set({ upgradeModalBuildingId: null }),

      // 위인 배정 모달
      showAssignModal: (buildingId) => set({ assignModalBuildingId: buildingId }),
      hideAssignModal: () => set({ assignModalBuildingId: null }),

      // 로딩
      setLoading: (isLoading) => set({ isLoading }),

      // 리셋
      reset: () => set(initialState),
    }),
    { name: 'BuildingStore' },
  ),
);

// 셀렉터: 필터링된 건물 목록
export const useFilteredBuildings = () => {
  const { buildings, filter, sort } = useBuildingStore();

  let filtered = [...buildings];

  // 필터 적용
  if (filter !== 'all') {
    filtered = filtered.filter((b) => {
      // typeId에서 카테고리 추출 (예: habitat-grassland -> dinosaur)
      const categoryMap: Record<string, string> = {
        habitat: 'dinosaur',
        visitor: 'visitor',
        food: 'amenity',
        souvenir: 'amenity',
        rest: 'amenity',
        dna: 'research',
        fossil: 'research',
        incubator: 'production',
        generator: 'operation',
        decoration: 'decoration',
      };
      const prefix = b.typeId.split('-')[0];
      const category = categoryMap[prefix] || 'other';
      return category === filter;
    });
  }

  // 정렬 적용
  filtered.sort((a, b) => {
    switch (sort) {
      case 'level':
        return b.level - a.level;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return filtered;
};
