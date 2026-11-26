import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 게임 모드
export type GameMode =
  | 'normal'
  | 'view'
  | 'build'
  | 'place_dinosaur'
  | 'place_building'
  | 'place_entrance';

// 선택된 엔티티 타입
interface SelectedEntity {
  type: 'dinosaur' | 'building';
  id: string;
}

// 배치 모드 데이터
interface PlacementData {
  type: 'dinosaur' | 'building' | 'entrance';
  id?: string; // 보유한 엔티티 ID
  speciesId?: string; // 공룡 배치 시
  typeId?: string; // 건물 배치 시
}

interface GameState {
  // 게임 모드
  mode: GameMode;
  setMode: (mode: GameMode) => void;

  // 선택된 엔티티
  selectedEntity: SelectedEntity | null;
  selectEntity: (entity: SelectedEntity | null) => void;

  // 배치 모드
  placementData: PlacementData | null;
  startPlacement: (data: PlacementData) => void;
  cancelPlacement: () => void;

  // 카메라/뷰포트
  cameraPosition: { x: number; y: number };
  cameraZoom: number;
  setCameraPosition: (x: number, y: number) => void;
  setCameraZoom: (zoom: number) => void;

  // 그리드 상태
  showGrid: boolean;
  toggleGrid: () => void;

  // 게임 시간 (방치형 수익 계산용)
  lastActiveTime: number;
  updateLastActiveTime: () => void;

  // 재화 (로컬 캐시)
  gold: number;
  diamond: number;
  setGold: (gold: number) => void;
  setDiamond: (diamond: number) => void;

  // 리셋
  reset: () => void;
}

const initialState = {
  mode: 'view' as GameMode,
  selectedEntity: null,
  placementData: null,
  cameraPosition: { x: 0, y: 0 },
  cameraZoom: 1,
  showGrid: false,
  lastActiveTime: Date.now(),
  gold: 10000,
  diamond: 100,
};

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      ...initialState,

      // 게임 모드 변경
      setMode: (mode) =>
        set({
          mode,
          // 모드 변경 시 선택 초기화
          selectedEntity: mode === 'view' ? null : undefined,
        }),

      // 엔티티 선택
      selectEntity: (entity) =>
        set({
          selectedEntity: entity,
          mode: entity ? 'view' : 'normal',
        }),

      // 배치 시작
      startPlacement: (data) =>
        set({
          mode:
            data.type === 'dinosaur'
              ? 'place_dinosaur'
              : data.type === 'entrance'
                ? 'place_entrance'
                : 'place_building',
          placementData: data,
          selectedEntity: null,
        }),

      // 배치 취소
      cancelPlacement: () =>
        set({
          mode: 'view',
          placementData: null,
        }),

      // 카메라 위치
      setCameraPosition: (x, y) =>
        set({
          cameraPosition: { x, y },
        }),

      // 카메라 줌
      setCameraZoom: (zoom) =>
        set({
          cameraZoom: Math.max(0.5, Math.min(2, zoom)),
        }),

      // 그리드 토글
      toggleGrid: () =>
        set((state) => ({
          showGrid: !state.showGrid,
        })),

      // 마지막 활성 시간 업데이트
      updateLastActiveTime: () =>
        set({
          lastActiveTime: Date.now(),
        }),

      // 재화 설정
      setGold: (gold) => set({ gold }),
      setDiamond: (diamond) => set({ diamond }),

      // 리셋
      reset: () => set(initialState),
    }),
    { name: 'GameStore' },
  ),
);
