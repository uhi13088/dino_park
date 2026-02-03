import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ========================================
// Types
// ========================================

export type GreatFigureJob =
  | 'scientist'
  | 'architect'
  | 'manager'
  | 'explorer'
  | 'trainer'
  | 'vet'
  | 'security'
  | 'special';

export type GreatFigureRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GreatFigureType {
  id: string;
  name: string;
  nameKo: string;
  job: GreatFigureJob;
  rarity: GreatFigureRarity;
  description: string;
  quote: string;
  recruitCost: number;
  abilities: GreatFigureAbility[];
  synergies: SynergyInfo[];
  isOwned: boolean;
  unlockCondition?: {
    type: 'level' | 'story' | 'achievement';
    value: string | number;
  };
}

export interface GreatFigure {
  id: string;
  figureId: string;
  type: GreatFigureType;
  level: number;
  exp: number;
  maxExp: number;
  assignedBuildingId: string | null;
  assignedBuildingName: string | null;
  createdAt: Date;
}

export interface GreatFigureAbility {
  type: 'revenue_boost' | 'cost_reduce' | 'happiness_boost' | 'exp_boost' | 'special';
  value: number;
  description: string;
  targetBuilding?: string;
}

export interface SynergyInfo {
  partnerId: string;
  partnerName: string;
  effect: string;
  bonusPercentage: number;
}

export interface Building {
  id: string;
  name: string;
  type: string;
  level: number;
  assignedFigureId?: string;
}

// ========================================
// Constants
// ========================================

export const JOB_CONFIG: Record<
  GreatFigureJob,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  scientist: { icon: '🔬', label: '과학자', color: 'text-blue-400', bgColor: 'bg-blue-900/50' },
  architect: { icon: '🏗️', label: '건축가', color: 'text-amber-400', bgColor: 'bg-amber-900/50' },
  manager: { icon: '📊', label: '매니저', color: 'text-green-400', bgColor: 'bg-green-900/50' },
  explorer: { icon: '🧭', label: '탐험가', color: 'text-orange-400', bgColor: 'bg-orange-900/50' },
  trainer: { icon: '🦖', label: '조련사', color: 'text-red-400', bgColor: 'bg-red-900/50' },
  vet: { icon: '💉', label: '수의사', color: 'text-pink-400', bgColor: 'bg-pink-900/50' },
  security: { icon: '🛡️', label: '보안관', color: 'text-slate-400', bgColor: 'bg-slate-900/50' },
  special: { icon: '⭐', label: '특별', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50' },
};

export const RARITY_CONFIG: Record<
  GreatFigureRarity,
  { icon: string; label: string; color: string; bgColor: string; borderColor: string }
> = {
  common: {
    icon: '⚪',
    label: '커먼',
    color: 'text-gray-400',
    bgColor: 'bg-gray-800',
    borderColor: 'border-gray-500',
  },
  uncommon: {
    icon: '🟢',
    label: '언커먼',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500',
  },
  rare: {
    icon: '🔵',
    label: '레어',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
  },
  epic: {
    icon: '🟣',
    label: '에픽',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500',
  },
  legendary: {
    icon: '🟡',
    label: '레전더리',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500',
  },
};

// ========================================
// Store
// ========================================

interface GreatFigureState {
  // State
  ownedFigures: GreatFigure[];
  availableFigures: GreatFigureType[];
  figurePoints: number;
  selectedFigure: GreatFigure | GreatFigureType | null;
  buildings: Building[];

  // UI State
  activeTab: 'owned' | 'recruit';
  showDetailModal: boolean;
  showAssignModal: boolean;
  isLoading: boolean;

  // Filters
  jobFilter: GreatFigureJob | 'all';
  rarityFilter: GreatFigureRarity | 'all';

  // Actions
  setOwnedFigures: (figures: GreatFigure[]) => void;
  setAvailableFigures: (figures: GreatFigureType[]) => void;
  setFigurePoints: (points: number) => void;
  setSelectedFigure: (figure: GreatFigure | GreatFigureType | null) => void;
  setBuildings: (buildings: Building[]) => void;
  setActiveTab: (tab: 'owned' | 'recruit') => void;
  setShowDetailModal: (show: boolean) => void;
  setShowAssignModal: (show: boolean) => void;
  setJobFilter: (job: GreatFigureJob | 'all') => void;
  setRarityFilter: (rarity: GreatFigureRarity | 'all') => void;

  // Figure Actions
  recruitFigure: (figureId: string) => Promise<void>;
  levelUpFigure: (figureId: string) => Promise<void>;
  assignFigure: (figureId: string, buildingId: string) => Promise<void>;
  unassignFigure: (figureId: string) => Promise<void>;
  addExp: (figureId: string, exp: number) => void;

  // Computed
  getFilteredOwnedFigures: () => GreatFigure[];
  getFilteredAvailableFigures: () => GreatFigureType[];
  getAssignableFigures: () => GreatFigure[];
  getAvailableBuildings: () => Building[];
  getFigureSynergies: (figureId: string) => SynergyInfo[];
  getTotalBonuses: () => { revenue: number; cost: number; happiness: number };
}

export const useGreatFigureStore = create<GreatFigureState>()(
  devtools(
    (set, get) => ({
      // Initial State
      ownedFigures: [],
      availableFigures: [],
      figurePoints: 0,
      selectedFigure: null,
      buildings: [],
      activeTab: 'owned',
      showDetailModal: false,
      showAssignModal: false,
      isLoading: false,
      jobFilter: 'all',
      rarityFilter: 'all',

      // Setters
      setOwnedFigures: (ownedFigures) => set({ ownedFigures }),
      setAvailableFigures: (availableFigures) => set({ availableFigures }),
      setFigurePoints: (figurePoints) => set({ figurePoints }),
      setSelectedFigure: (selectedFigure) => set({ selectedFigure }),
      setBuildings: (buildings) => set({ buildings }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setShowDetailModal: (showDetailModal) => set({ showDetailModal }),
      setShowAssignModal: (showAssignModal) => set({ showAssignModal }),
      setJobFilter: (jobFilter) => set({ jobFilter }),
      setRarityFilter: (rarityFilter) => set({ rarityFilter }),

      // Figure Actions
      recruitFigure: async (figureId) => {
        const { availableFigures, figurePoints, ownedFigures } = get();
        const figureType = availableFigures.find((f) => f.id === figureId);

        if (!figureType || figurePoints < figureType.recruitCost) {
          throw new Error('영입할 수 없습니다');
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newFigure: GreatFigure = {
          id: `gf_${Date.now()}`,
          figureId,
          type: figureType,
          level: 1,
          exp: 0,
          maxExp: 100,
          assignedBuildingId: null,
          assignedBuildingName: null,
          createdAt: new Date(),
        };

        set({
          ownedFigures: [...ownedFigures, newFigure],
          figurePoints: figurePoints - figureType.recruitCost,
          availableFigures: availableFigures.map((f) =>
            f.id === figureId ? { ...f, isOwned: true } : f,
          ),
          isLoading: false,
          showDetailModal: false,
        });
      },

      levelUpFigure: async (figureId) => {
        const { ownedFigures, figurePoints } = get();
        const figure = ownedFigures.find((f) => f.id === figureId);

        if (!figure || figure.level >= 10) {
          throw new Error('레벨업할 수 없습니다');
        }

        const levelUpCost = figure.level * 100;
        if (figurePoints < levelUpCost) {
          throw new Error('포인트가 부족합니다');
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 300));

        set({
          ownedFigures: ownedFigures.map((f) =>
            f.id === figureId
              ? {
                  ...f,
                  level: f.level + 1,
                  exp: 0,
                  maxExp: Math.floor(f.maxExp * 1.2),
                }
              : f,
          ),
          figurePoints: figurePoints - levelUpCost,
          isLoading: false,
        });
      },

      assignFigure: async (figureId, buildingId) => {
        const { ownedFigures, buildings } = get();
        const figure = ownedFigures.find((f) => f.id === figureId);
        const building = buildings.find((b) => b.id === buildingId);

        if (!figure || !building) {
          throw new Error('배정할 수 없습니다');
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 300));

        set({
          ownedFigures: ownedFigures.map((f) =>
            f.id === figureId
              ? { ...f, assignedBuildingId: buildingId, assignedBuildingName: building.name }
              : f,
          ),
          buildings: buildings.map((b) =>
            b.id === buildingId ? { ...b, assignedFigureId: figureId } : b,
          ),
          isLoading: false,
          showAssignModal: false,
        });
      },

      unassignFigure: async (figureId) => {
        const { ownedFigures, buildings } = get();
        const figure = ownedFigures.find((f) => f.id === figureId);

        if (!figure || !figure.assignedBuildingId) {
          return;
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 300));

        set({
          ownedFigures: ownedFigures.map((f) =>
            f.id === figureId ? { ...f, assignedBuildingId: null, assignedBuildingName: null } : f,
          ),
          buildings: buildings.map((b) =>
            b.assignedFigureId === figureId ? { ...b, assignedFigureId: undefined } : b,
          ),
          isLoading: false,
        });
      },

      addExp: (figureId, exp) => {
        set((state) => {
          const figures = state.ownedFigures.map((f) => {
            if (f.id !== figureId) return f;

            let newExp = f.exp + exp;
            let newLevel = f.level;
            let newMaxExp = f.maxExp;

            // 레벨업 처리 (최대 10레벨)
            while (newExp >= newMaxExp && newLevel < 10) {
              newExp -= newMaxExp;
              newLevel++;
              newMaxExp = Math.floor(newMaxExp * 1.2);
            }

            return {
              ...f,
              level: newLevel,
              exp: Math.min(newExp, newMaxExp),
              maxExp: newMaxExp,
            };
          });

          return { ownedFigures: figures };
        });
      },

      // Computed
      getFilteredOwnedFigures: () => {
        const { ownedFigures, jobFilter, rarityFilter } = get();

        return ownedFigures.filter((f) => {
          const matchesJob = jobFilter === 'all' || f.type.job === jobFilter;
          const matchesRarity = rarityFilter === 'all' || f.type.rarity === rarityFilter;
          return matchesJob && matchesRarity;
        });
      },

      getFilteredAvailableFigures: () => {
        const { availableFigures, jobFilter, rarityFilter } = get();

        return availableFigures.filter((f) => {
          if (f.isOwned) return false;
          const matchesJob = jobFilter === 'all' || f.job === jobFilter;
          const matchesRarity = rarityFilter === 'all' || f.rarity === rarityFilter;
          return matchesJob && matchesRarity;
        });
      },

      getAssignableFigures: () => {
        return get().ownedFigures.filter((f) => !f.assignedBuildingId);
      },

      getAvailableBuildings: () => {
        return get().buildings.filter((b) => !b.assignedFigureId);
      },

      getFigureSynergies: (figureId) => {
        const { ownedFigures } = get();
        const figure = ownedFigures.find((f) => f.id === figureId);

        if (!figure) return [];

        // 시너지 체크: 다른 보유 위인 중 시너지 파트너가 있는지
        return figure.type.synergies.filter((synergy) =>
          ownedFigures.some((f) => f.figureId === synergy.partnerId),
        );
      },

      getTotalBonuses: () => {
        const { ownedFigures } = get();

        const bonuses = { revenue: 0, cost: 0, happiness: 0 };

        ownedFigures.forEach((figure) => {
          if (figure.assignedBuildingId) {
            figure.type.abilities.forEach((ability) => {
              const multiplier = 1 + (figure.level - 1) * 0.1; // 레벨당 10% 보너스
              switch (ability.type) {
                case 'revenue_boost':
                  bonuses.revenue += ability.value * multiplier;
                  break;
                case 'cost_reduce':
                  bonuses.cost += ability.value * multiplier;
                  break;
                case 'happiness_boost':
                  bonuses.happiness += ability.value * multiplier;
                  break;
              }
            });
          }
        });

        return bonuses;
      },
    }),
    { name: 'GreatFigureStore' },
  ),
);

// Selectors
export const useOwnedFiguresCount = () => useGreatFigureStore((state) => state.ownedFigures.length);

export const useAssignedFiguresCount = () =>
  useGreatFigureStore((state) => state.ownedFigures.filter((f) => f.assignedBuildingId).length);

export const useCanAffordRecruit = (cost: number) =>
  useGreatFigureStore((state) => state.figurePoints >= cost);
