import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ========================================
// Types
// ========================================

export type ExplorationStatus = 'idle' | 'in_progress' | 'completed' | 'claimed';

export interface ExplorationRegion {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  unlockLevel: number;
  isUnlocked: boolean;
  energyCost: number;
  duration: number; // minutes
  possibleRewards: RewardPreview[];
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  recommendedDinosaurs: string[];
  bonusConditions?: BonusCondition[];
}

export interface RewardPreview {
  type: 'gold' | 'dna' | 'egg' | 'item' | 'dinosaur';
  name: string;
  chance: number; // 0-100%
  minAmount?: number;
  maxAmount?: number;
}

export interface BonusCondition {
  type: 'dinosaur_category' | 'dinosaur_rarity' | 'great_figure';
  value: string;
  bonusPercentage: number;
  description: string;
}

export interface Exploration {
  id: string;
  regionId: string;
  region: ExplorationRegion;
  status: ExplorationStatus;
  startedAt: Date;
  completesAt: Date;
  remainingSeconds: number;
  assignedDinosaurs: string[];
  bonusMultiplier: number;
}

export interface ExplorationReward {
  gold?: number;
  dna?: number;
  egg?: {
    type: string;
    rarity: string;
  };
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  dinosaur?: {
    speciesId: string;
    name: string;
    rarity: string;
  };
  exp?: number;
}

// ========================================
// Constants
// ========================================

export const DIFFICULTY_CONFIG = {
  easy: { icon: '🟢', label: '쉬움', color: 'text-green-400', bgColor: 'bg-green-900/50' },
  normal: { icon: '🟡', label: '보통', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50' },
  hard: { icon: '🟠', label: '어려움', color: 'text-orange-400', bgColor: 'bg-orange-900/50' },
  expert: { icon: '🔴', label: '매우 어려움', color: 'text-red-400', bgColor: 'bg-red-900/50' },
};

export const REWARD_TYPE_CONFIG = {
  gold: { icon: '🪙', label: '골드', color: 'text-yellow-400' },
  dna: { icon: '🧬', label: 'DNA', color: 'text-purple-400' },
  egg: { icon: '🥚', label: '알', color: 'text-green-400' },
  item: { icon: '📦', label: '아이템', color: 'text-blue-400' },
  dinosaur: { icon: '🦕', label: '공룡', color: 'text-pink-400' },
};

export const REGION_EMOJI: Record<string, string> = {
  'emerald-island': '🏝️',
  'white-rock': '🏜️',
  'sunset-coast': '🌅',
  'deep-blue': '🌊',
  'storm-island': '⛈️',
  fossil_plains: '🏜️',
  volcanic_valley: '🌋',
  frozen_tundra: '🏔️',
  ancient_ruins: '🏛️',
  mystic_forest: '🌲',
  crystal_cave: '💎',
};

// ========================================
// Store
// ========================================

interface ExplorationState {
  // State
  regions: ExplorationRegion[];
  currentExploration: Exploration | null;
  explorationHistory: Exploration[];
  selectedRegion: ExplorationRegion | null;

  // Energy
  energy: number;
  maxEnergy: number;
  energyRechargeTime: Date | null;

  // UI State
  showRewardModal: boolean;
  lastReward: ExplorationReward | null;
  isLoading: boolean;

  // Actions
  setRegions: (regions: ExplorationRegion[]) => void;
  setCurrentExploration: (exploration: Exploration | null) => void;
  setSelectedRegion: (region: ExplorationRegion | null) => void;
  setEnergy: (energy: number) => void;
  setShowRewardModal: (show: boolean) => void;
  setLastReward: (reward: ExplorationReward | null) => void;

  // Exploration Actions
  startExploration: (regionId: string, dinosaurIds?: string[]) => Promise<void>;
  claimReward: (explorationId: string) => Promise<ExplorationReward | null>;
  cancelExploration: (explorationId: string) => Promise<void>;

  // Timer
  updateRemainingTime: () => void;

  // Computed
  canStartExploration: (region: ExplorationRegion) => boolean;
  getRegionById: (regionId: string) => ExplorationRegion | undefined;
  getUnlockedRegions: () => ExplorationRegion[];
}

export const useExplorationStore = create<ExplorationState>()(
  devtools(
    (set, get) => ({
      // Initial State
      regions: [],
      currentExploration: null,
      explorationHistory: [],
      selectedRegion: null,
      energy: 30,
      maxEnergy: 30,
      energyRechargeTime: null,
      showRewardModal: false,
      lastReward: null,
      isLoading: false,

      // Setters
      setRegions: (regions) => set({ regions }),
      setCurrentExploration: (currentExploration) => set({ currentExploration }),
      setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
      setEnergy: (energy) => set({ energy }),
      setShowRewardModal: (showRewardModal) => set({ showRewardModal }),
      setLastReward: (lastReward) => set({ lastReward }),

      // Exploration Actions
      startExploration: async (regionId, dinosaurIds = []) => {
        const { regions, energy } = get();
        const region = regions.find((r) => r.id === regionId);

        if (!region || !region.isUnlocked || energy < region.energyCost) {
          throw new Error('탐험을 시작할 수 없습니다');
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));

        const now = new Date();
        const completesAt = new Date(now.getTime() + region.duration * 60 * 1000);

        const exploration: Exploration = {
          id: `exp_${Date.now()}`,
          regionId,
          region,
          status: 'in_progress',
          startedAt: now,
          completesAt,
          remainingSeconds: region.duration * 60,
          assignedDinosaurs: dinosaurIds,
          bonusMultiplier: 1.0,
        };

        set({
          currentExploration: exploration,
          energy: energy - region.energyCost,
          isLoading: false,
        });
      },

      claimReward: async (explorationId) => {
        const { currentExploration } = get();

        if (!currentExploration || currentExploration.id !== explorationId) {
          return null;
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 랜덤 보상 생성 (실제로는 서버에서 계산)
        const reward: ExplorationReward = {
          gold: Math.floor(Math.random() * 5000) + 1000,
          dna: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined,
          exp: Math.floor(Math.random() * 100) + 50,
        };

        // 10% 확률로 알 획득
        if (Math.random() < 0.1) {
          reward.egg = {
            type: ['일반', '희귀', '전설'][Math.floor(Math.random() * 3)],
            rarity: ['common', 'rare', 'legendary'][Math.floor(Math.random() * 3)],
          };
        }

        set((state) => ({
          currentExploration: null,
          explorationHistory: [
            { ...currentExploration, status: 'claimed' as const },
            ...state.explorationHistory,
          ],
          lastReward: reward,
          showRewardModal: true,
          isLoading: false,
        }));

        return reward;
      },

      cancelExploration: async (explorationId) => {
        const { currentExploration, energy, maxEnergy } = get();

        if (!currentExploration || currentExploration.id !== explorationId) {
          return;
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 에너지 일부 환불 (50%)
        const refund = Math.floor(currentExploration.region.energyCost * 0.5);

        set({
          currentExploration: null,
          energy: Math.min(energy + refund, maxEnergy),
          isLoading: false,
        });
      },

      // Timer
      updateRemainingTime: () => {
        const { currentExploration } = get();

        if (!currentExploration || currentExploration.status !== 'in_progress') {
          return;
        }

        const now = Date.now();
        const completesAt = new Date(currentExploration.completesAt).getTime();
        const remaining = Math.max(0, Math.floor((completesAt - now) / 1000));

        if (remaining === 0 && currentExploration.status === 'in_progress') {
          set({
            currentExploration: {
              ...currentExploration,
              status: 'completed',
              remainingSeconds: 0,
            },
          });
        } else {
          set({
            currentExploration: {
              ...currentExploration,
              remainingSeconds: remaining,
            },
          });
        }
      },

      // Computed
      canStartExploration: (region) => {
        const { currentExploration, energy } = get();
        return !currentExploration && region.isUnlocked && energy >= region.energyCost;
      },

      getRegionById: (regionId) => {
        return get().regions.find((r) => r.id === regionId);
      },

      getUnlockedRegions: () => {
        return get().regions.filter((r) => r.isUnlocked);
      },
    }),
    { name: 'ExplorationStore' },
  ),
);

// Selectors
export const useIsExploring = () => useExplorationStore((state) => !!state.currentExploration);

export const useExplorationProgress = () =>
  useExplorationStore((state) => {
    if (!state.currentExploration) return 0;
    const totalSeconds = state.currentExploration.region.duration * 60;
    const elapsed = totalSeconds - state.currentExploration.remainingSeconds;
    return Math.round((elapsed / totalSeconds) * 100);
  });

export const useEnergyPercentage = () =>
  useExplorationStore((state) => (state.energy / state.maxEnergy) * 100);
