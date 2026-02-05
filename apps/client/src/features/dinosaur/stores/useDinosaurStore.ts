import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DinosaurCategory, Rarity } from '@dino-park/shared';

// Re-export for backward compatibility
export { DinosaurCategory };

// ========================================
// Types
// ========================================

// Backward-compatible alias
export type DinosaurRarity = `${Rarity}`;

export interface DinosaurSpecies {
  id: string;
  name: string;
  nameKo: string;
  category: DinosaurCategory;
  rarity: DinosaurRarity;
  baseRevenue: number;
  popularity: number;
  maintenanceCost: number;
  space: number;
  unlockLevel: number;
  passive?: {
    type: string;
    value: number;
    description: string;
  };
}

export interface Dinosaur {
  id: string;
  speciesId: string;
  species: DinosaurSpecies;
  nickname: string | null;
  level: number;
  exp: number;
  maxExp: number;
  happiness: number;
  hunger: number;
  intimacy: number;
  positionX: number;
  positionY: number;
  isInPark: boolean;
  lastFedAt: Date;
  createdAt: Date;
}

export interface HatchingEgg {
  id: string;
  eggType: string;
  speciesId: string | null;
  startedAt: Date;
  completesAt: Date;
  progress: number; // 0-100
}

// ========================================
// Constants
// ========================================

export const CATEGORY_CONFIG: Record<
  DinosaurCategory,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  herbivore: {
    icon: '🌿',
    label: '초식 공룡',
    color: 'text-green-400',
    bgColor: 'bg-green-900/50',
  },
  carnivore: { icon: '🥩', label: '육식 공룡', color: 'text-red-400', bgColor: 'bg-red-900/50' },
  pterosaur: { icon: '🦅', label: '익룡', color: 'text-purple-400', bgColor: 'bg-purple-900/50' },
  marine: { icon: '🌊', label: '해양 파충류', color: 'text-blue-400', bgColor: 'bg-blue-900/50' },
  hybrid: { icon: '🧬', label: '하이브리드', color: 'text-pink-400', bgColor: 'bg-pink-900/50' },
};

export const RARITY_CONFIG: Record<
  DinosaurRarity,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  common: { icon: '⚪', label: '커먼', color: 'text-gray-400', bgColor: 'bg-gray-700' },
  uncommon: { icon: '🟢', label: '언커먼', color: 'text-green-400', bgColor: 'bg-green-900/50' },
  rare: { icon: '🔵', label: '레어', color: 'text-blue-400', bgColor: 'bg-blue-900/50' },
  epic: { icon: '🟣', label: '에픽', color: 'text-purple-400', bgColor: 'bg-purple-900/50' },
  legendary: {
    icon: '🟡',
    label: '레전더리',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/50',
  },
};

// 먹이 종류
export const FOOD_TYPES = {
  basic: { icon: '🥬', name: '기본 먹이', happinessGain: 10, hungerReduce: 30, cost: 100 },
  premium: { icon: '🥩', name: '고급 먹이', happinessGain: 25, hungerReduce: 60, cost: 300 },
  special: { icon: '🍖', name: '특별 먹이', happinessGain: 50, hungerReduce: 100, cost: 800 },
};

// ========================================
// Store
// ========================================

interface DinosaurState {
  // State
  dinosaurs: Dinosaur[];
  hatchingEggs: HatchingEgg[];
  selectedDinosaur: Dinosaur | null;
  codexUnlocked: Set<string>;

  // Filters
  categoryFilter: DinosaurCategory | 'all';
  rarityFilter: DinosaurRarity | 'all';
  sortBy: 'level' | 'happiness' | 'revenue' | 'recent';

  // Loading
  isLoading: boolean;

  // Actions
  setDinosaurs: (dinosaurs: Dinosaur[]) => void;
  setHatchingEggs: (eggs: HatchingEgg[]) => void;
  setSelectedDinosaur: (dinosaur: Dinosaur | null) => void;
  setCodexUnlocked: (speciesIds: string[]) => void;
  setCategoryFilter: (category: DinosaurCategory | 'all') => void;
  setRarityFilter: (rarity: DinosaurRarity | 'all') => void;
  setSortBy: (sortBy: 'level' | 'happiness' | 'revenue' | 'recent') => void;

  // Dinosaur Actions
  feedDinosaur: (dinosaurId: string, foodType: keyof typeof FOOD_TYPES) => Promise<void>;
  renameDinosaur: (dinosaurId: string, nickname: string) => void;
  addExp: (dinosaurId: string, exp: number) => void;
  updateHappiness: (dinosaurId: string, delta: number) => void;
  updateHunger: (dinosaurId: string, delta: number) => void;

  // Hatching
  startHatching: (eggType: string) => Promise<void>;
  claimHatchedDinosaur: (eggId: string) => Promise<Dinosaur | null>;

  // Computed
  getFilteredDinosaurs: () => Dinosaur[];
  getDinosaursByCategory: (category: DinosaurCategory) => Dinosaur[];
  getTotalRevenue: () => number;
  getAverageHappiness: () => number;
}

export const useDinosaurStore = create<DinosaurState>()(
  devtools(
    (set, get) => ({
      // Initial State
      dinosaurs: [],
      hatchingEggs: [],
      selectedDinosaur: null,
      codexUnlocked: new Set(),
      categoryFilter: 'all',
      rarityFilter: 'all',
      sortBy: 'recent',
      isLoading: false,

      // Setters
      setDinosaurs: (dinosaurs) => set({ dinosaurs }),
      setHatchingEggs: (hatchingEggs) => set({ hatchingEggs }),
      setSelectedDinosaur: (selectedDinosaur) => set({ selectedDinosaur }),
      setCodexUnlocked: (speciesIds) => set({ codexUnlocked: new Set(speciesIds) }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setRarityFilter: (rarityFilter) => set({ rarityFilter }),
      setSortBy: (sortBy) => set({ sortBy }),

      // Dinosaur Actions
      feedDinosaur: async (dinosaurId, foodType) => {
        const food = FOOD_TYPES[foodType];

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 300));

        set((state) => ({
          dinosaurs: state.dinosaurs.map((dino) =>
            dino.id === dinosaurId
              ? {
                  ...dino,
                  happiness: Math.min(100, dino.happiness + food.happinessGain),
                  hunger: Math.max(0, dino.hunger - food.hungerReduce),
                  lastFedAt: new Date(),
                }
              : dino,
          ),
        }));

        // 선택된 공룡 업데이트
        const { selectedDinosaur, dinosaurs } = get();
        if (selectedDinosaur?.id === dinosaurId) {
          const updated = dinosaurs.find((d) => d.id === dinosaurId);
          if (updated) {
            set({ selectedDinosaur: updated });
          }
        }
      },

      renameDinosaur: (dinosaurId, nickname) => {
        set((state) => ({
          dinosaurs: state.dinosaurs.map((dino) =>
            dino.id === dinosaurId ? { ...dino, nickname } : dino,
          ),
        }));
      },

      addExp: (dinosaurId, exp) => {
        set((state) => {
          const dinosaurs = state.dinosaurs.map((dino) => {
            if (dino.id !== dinosaurId) return dino;

            let newExp = dino.exp + exp;
            let newLevel = dino.level;
            let newMaxExp = dino.maxExp;

            // 레벨업 처리
            while (newExp >= newMaxExp && newLevel < 25) {
              newExp -= newMaxExp;
              newLevel++;
              newMaxExp = Math.floor(newMaxExp * 1.2);
            }

            return {
              ...dino,
              level: newLevel,
              exp: newExp,
              maxExp: newMaxExp,
            };
          });

          return { dinosaurs };
        });
      },

      updateHappiness: (dinosaurId, delta) => {
        set((state) => ({
          dinosaurs: state.dinosaurs.map((dino) =>
            dino.id === dinosaurId
              ? { ...dino, happiness: Math.max(0, Math.min(100, dino.happiness + delta)) }
              : dino,
          ),
        }));
      },

      updateHunger: (dinosaurId, delta) => {
        set((state) => ({
          dinosaurs: state.dinosaurs.map((dino) =>
            dino.id === dinosaurId
              ? { ...dino, hunger: Math.max(0, Math.min(100, dino.hunger + delta)) }
              : dino,
          ),
        }));
      },

      // Hatching
      startHatching: async (eggType) => {
        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newEgg: HatchingEgg = {
          id: `egg_${Date.now()}`,
          eggType,
          speciesId: null,
          startedAt: new Date(),
          completesAt: new Date(Date.now() + 3600000), // 1시간 후
          progress: 0,
        };

        set((state) => ({
          hatchingEggs: [...state.hatchingEggs, newEgg],
        }));
      },

      claimHatchedDinosaur: async (eggId) => {
        const { hatchingEggs } = get();
        const egg = hatchingEggs.find((e) => e.id === eggId);

        if (!egg || new Date() < egg.completesAt) {
          return null;
        }

        // 실제로는 API 호출해서 부화된 공룡 받기
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 알 제거
        set((state) => ({
          hatchingEggs: state.hatchingEggs.filter((e) => e.id !== eggId),
        }));

        // 여기서 반환된 공룡은 상위 컴포넌트에서 dinosaurs 배열에 추가
        return null; // 실제로는 API 응답의 공룡 데이터
      },

      // Computed
      getFilteredDinosaurs: () => {
        const { dinosaurs, categoryFilter, rarityFilter, sortBy } = get();

        let filtered = [...dinosaurs];

        // 카테고리 필터
        if (categoryFilter !== 'all') {
          filtered = filtered.filter((d) => d.species.category === categoryFilter);
        }

        // 희귀도 필터
        if (rarityFilter !== 'all') {
          filtered = filtered.filter((d) => d.species.rarity === rarityFilter);
        }

        // 정렬
        switch (sortBy) {
          case 'level':
            filtered.sort((a, b) => b.level - a.level);
            break;
          case 'happiness':
            filtered.sort((a, b) => b.happiness - a.happiness);
            break;
          case 'revenue':
            filtered.sort(
              (a, b) => b.species.baseRevenue * b.level - a.species.baseRevenue * a.level,
            );
            break;
          case 'recent':
          default:
            filtered.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            break;
        }

        return filtered;
      },

      getDinosaursByCategory: (category) => {
        return get().dinosaurs.filter((d) => d.species.category === category);
      },

      getTotalRevenue: () => {
        return get().dinosaurs.reduce((sum, dino) => {
          const happinessMultiplier = dino.happiness / 100;
          return sum + dino.species.baseRevenue * dino.level * happinessMultiplier;
        }, 0);
      },

      getAverageHappiness: () => {
        const { dinosaurs } = get();
        if (dinosaurs.length === 0) return 0;
        return dinosaurs.reduce((sum, d) => sum + d.happiness, 0) / dinosaurs.length;
      },
    }),
    { name: 'DinosaurStore' },
  ),
);

// Selectors
export const useDinosaurCount = () => useDinosaurStore((state) => state.dinosaurs.length);

export const useHungryDinosaurs = () =>
  useDinosaurStore((state) => state.dinosaurs.filter((d) => d.hunger >= 70));

export const useLowHappinessDinosaurs = () =>
  useDinosaurStore((state) => state.dinosaurs.filter((d) => d.happiness <= 30));
