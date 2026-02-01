import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { INITIAL_GOLD, INITIAL_DIAMOND } from '@dino-park/shared';

interface GameState {
  // 유저 정보
  userId: string | null;
  nickname: string;
  parkLevel: number;
  parkExp: number;

  // 재화
  gold: number;
  diamond: number;
  dna: number;
  explorationEnergy: number;

  // 액션
  setUser: (userId: string, nickname: string) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  addDiamond: (amount: number) => void;
  spendDiamond: (amount: number) => boolean;
  addExp: (amount: number) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  nickname: '신입 사육사',
  parkLevel: 1,
  parkExp: 0,
  gold: INITIAL_GOLD,
  diamond: INITIAL_DIAMOND,
  dna: 0,
  explorationEnergy: 30,
};

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (userId, nickname) => set({ userId, nickname }),

        addGold: (amount) => set((state) => ({ gold: state.gold + amount })),

        spendGold: (amount) => {
          const { gold } = get();
          if (gold < amount) return false;
          set({ gold: gold - amount });
          return true;
        },

        addDiamond: (amount) => set((state) => ({ diamond: state.diamond + amount })),

        spendDiamond: (amount) => {
          const { diamond } = get();
          if (diamond < amount) return false;
          set({ diamond: diamond - amount });
          return true;
        },

        addExp: (amount) => {
          const { parkExp, parkLevel } = get();
          const newExp = parkExp + amount;
          // TODO: 레벨업 로직 (exp 테이블 참조)
          set({ parkExp: newExp });
        },

        reset: () => set(initialState),
      }),
      {
        name: 'dino-park-game',
        partialize: (state) => ({
          userId: state.userId,
          nickname: state.nickname,
          parkLevel: state.parkLevel,
          parkExp: state.parkExp,
          gold: state.gold,
          diamond: state.diamond,
          dna: state.dna,
        }),
      },
    ),
    { name: 'GameStore' },
  ),
);
