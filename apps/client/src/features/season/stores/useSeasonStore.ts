import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 보상 타입
export interface SeasonRewardItem {
  type: string;
  quantity: number;
  id?: string;
}

// 시즌 패스 보상
export interface PassReward {
  level: number;
  freeReward: SeasonRewardItem;
  premiumReward: SeasonRewardItem;
  canClaimFree: boolean;
  canClaimPremium: boolean;
  isFreeClaimed: boolean;
  isPremiumClaimed: boolean;
}

// 시즌 챕터
export interface SeasonChapter {
  id: string;
  order: number;
  title: string;
  titleKo: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  sceneCount: number;
  rewards: Array<{ type: string; amount: number; id?: string }>;
}

// 시즌 이벤트
export interface SeasonEvent {
  id: string;
  name: string;
  nameKo: string;
  type: string;
  daysRemaining: number;
  description: string;
  rewards: SeasonRewardItem[];
}

// 시즌 패스 정보
export interface SeasonPass {
  id: string;
  level: number;
  exp: number;
  isPremium: boolean;
  seasonName: string;
  maxLevel: number;
  nextLevelExp: number;
  expProgress: number;
  daysRemaining: number;
  rewards: PassReward[];
}

// 시즌 정보
export interface Season {
  id: string;
  name: string;
  nameKo: string;
  theme: string;
  startDate: string;
  endDate: string;
  maxLevel: number;
  isActive: boolean;
}

interface SeasonState {
  // 현재 시즌 정보
  currentSeason: Season | null;
  setCurrentSeason: (season: Season | null) => void;

  // 시즌 패스
  seasonPass: SeasonPass | null;
  setSeasonPass: (pass: SeasonPass | null) => void;

  // 시즌 챕터
  chapters: SeasonChapter[];
  setChapters: (chapters: SeasonChapter[]) => void;

  // 시즌 이벤트
  events: SeasonEvent[];
  setEvents: (events: SeasonEvent[]) => void;

  // 선택된 탭
  activeTab: 'pass' | 'story' | 'events';
  setActiveTab: (tab: 'pass' | 'story' | 'events') => void;

  // 보상 수령 처리
  claimFreeReward: (level: number) => void;
  claimPremiumReward: (level: number) => void;

  // 경험치 추가
  addExp: (amount: number) => void;

  // 프리미엄 업그레이드
  upgradeToPremium: () => void;

  // 로딩 상태
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // 리셋
  reset: () => void;
}

const initialState = {
  currentSeason: null,
  seasonPass: null,
  chapters: [],
  events: [],
  activeTab: 'pass' as const,
  isLoading: false,
};

export const useSeasonStore = create<SeasonState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentSeason: (currentSeason) => set({ currentSeason }),

      setSeasonPass: (seasonPass) => set({ seasonPass }),

      setChapters: (chapters) => set({ chapters }),

      setEvents: (events) => set({ events }),

      setActiveTab: (activeTab) => set({ activeTab }),

      claimFreeReward: (level) => {
        const { seasonPass } = get();
        if (!seasonPass) return;

        const updatedRewards = seasonPass.rewards.map((reward) =>
          reward.level === level ? { ...reward, isFreeClaimed: true, canClaimFree: false } : reward,
        );

        set({
          seasonPass: {
            ...seasonPass,
            rewards: updatedRewards,
          },
        });
      },

      claimPremiumReward: (level) => {
        const { seasonPass } = get();
        if (!seasonPass) return;

        const updatedRewards = seasonPass.rewards.map((reward) =>
          reward.level === level
            ? { ...reward, isPremiumClaimed: true, canClaimPremium: false }
            : reward,
        );

        set({
          seasonPass: {
            ...seasonPass,
            rewards: updatedRewards,
          },
        });
      },

      addExp: (amount) => {
        const { seasonPass } = get();
        if (!seasonPass) return;

        let newExp = seasonPass.exp + amount;
        let newLevel = seasonPass.level;

        // 레벨업 계산
        while (newLevel < seasonPass.maxLevel && newExp >= seasonPass.nextLevelExp) {
          newExp -= seasonPass.nextLevelExp;
          newLevel++;
        }

        // 보상 상태 업데이트
        const updatedRewards = seasonPass.rewards.map((reward) => ({
          ...reward,
          canClaimFree: newLevel >= reward.level && !reward.isFreeClaimed,
          canClaimPremium:
            seasonPass.isPremium && newLevel >= reward.level && !reward.isPremiumClaimed,
        }));

        set({
          seasonPass: {
            ...seasonPass,
            level: newLevel,
            exp: newExp,
            expProgress: newExp / seasonPass.nextLevelExp,
            rewards: updatedRewards,
          },
        });
      },

      upgradeToPremium: () => {
        const { seasonPass } = get();
        if (!seasonPass) return;

        // 프리미엄 보상 수령 가능하도록 업데이트
        const updatedRewards = seasonPass.rewards.map((reward) => ({
          ...reward,
          canClaimPremium: seasonPass.level >= reward.level && !reward.isPremiumClaimed,
        }));

        set({
          seasonPass: {
            ...seasonPass,
            isPremium: true,
            rewards: updatedRewards,
          },
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set(initialState),
    }),
    { name: 'SeasonStore' },
  ),
);

// 셀렉터: 수령 가능한 보상 개수
export const useClaimableRewardsCount = () => {
  const { seasonPass } = useSeasonStore();
  if (!seasonPass) return { free: 0, premium: 0 };

  const freeCount = seasonPass.rewards.filter((r) => r.canClaimFree).length;
  const premiumCount = seasonPass.rewards.filter((r) => r.canClaimPremium).length;

  return { free: freeCount, premium: premiumCount };
};

// 셀렉터: 현재 레벨 근처 보상 (스크롤 위치 계산용)
export const useCurrentLevelRewards = () => {
  const { seasonPass } = useSeasonStore();
  if (!seasonPass) return [];

  const currentLevel = seasonPass.level;
  return seasonPass.rewards.filter(
    (r) => r.level >= currentLevel - 2 && r.level <= currentLevel + 5,
  );
};

// 보상 타입별 아이콘/색상
export const REWARD_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  gold: { icon: '🪙', color: 'text-yellow-500', name: '골드' },
  diamond: { icon: '💎', color: 'text-blue-500', name: '다이아' },
  dna: { icon: '🧬', color: 'text-purple-500', name: 'DNA' },
  dinosaur: { icon: '🦕', color: 'text-green-500', name: '공룡' },
  greatFigure: { icon: '👤', color: 'text-indigo-500', name: '위인' },
  skin: { icon: '🎨', color: 'text-pink-500', name: '스킨' },
  building: { icon: '🏠', color: 'text-orange-500', name: '건물' },
  item: { icon: '📦', color: 'text-gray-500', name: '아이템' },
  title: { icon: '🏅', color: 'text-amber-500', name: '칭호' },
};
