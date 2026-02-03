import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Transaction, CurrencyType, TransactionType } from '@dino-park/shared';

// 거래 내역 필터 타입
export type TransactionFilter = 'all' | 'earn' | 'spend' | 'purchase' | 'reward';

// 오프라인 수익 데이터
export interface OfflineReward {
  gold: number;
  duration: number; // 초
  maxDuration: number;
  revenuePerHour: number;
}

interface EconomyState {
  // 재화 (실시간 동기화)
  gold: number;
  diamond: number;
  dna: number;
  explorationEnergy: number;
  maxExplorationEnergy: number;
  energyRechargeTime: Date | null;

  // 재화 업데이트
  setCurrency: (
    currency: Partial<Pick<EconomyState, 'gold' | 'diamond' | 'dna' | 'explorationEnergy'>>,
  ) => void;
  addGold: (amount: number) => void;
  addDiamond: (amount: number) => void;
  addDna: (amount: number) => void;
  useEnergy: (amount: number) => boolean;

  // 거래 내역
  transactions: Transaction[];
  transactionFilter: TransactionFilter;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setTransactionFilter: (filter: TransactionFilter) => void;

  // 오프라인 수익
  offlineReward: OfflineReward | null;
  setOfflineReward: (reward: OfflineReward | null) => void;
  claimOfflineReward: () => void;

  // 수익 통계
  hourlyRevenue: number;
  setHourlyRevenue: (revenue: number) => void;

  // 로딩 상태
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // 리셋
  reset: () => void;
}

const initialState = {
  gold: 10000,
  diamond: 100,
  dna: 0,
  explorationEnergy: 30,
  maxExplorationEnergy: 30,
  energyRechargeTime: null,
  transactions: [],
  transactionFilter: 'all' as TransactionFilter,
  offlineReward: null,
  hourlyRevenue: 0,
  isLoading: false,
};

export const useEconomyStore = create<EconomyState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 재화 설정
      setCurrency: (currency) => set(currency),

      addGold: (amount) =>
        set((state) => ({
          gold: Math.max(0, state.gold + amount),
        })),

      addDiamond: (amount) =>
        set((state) => ({
          diamond: Math.max(0, state.diamond + amount),
        })),

      addDna: (amount) =>
        set((state) => ({
          dna: Math.max(0, state.dna + amount),
        })),

      useEnergy: (amount) => {
        const state = get();
        if (state.explorationEnergy >= amount) {
          set({ explorationEnergy: state.explorationEnergy - amount });
          return true;
        }
        return false;
      },

      // 거래 내역
      setTransactions: (transactions) => set({ transactions }),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions].slice(0, 100), // 최근 100개만 유지
        })),

      setTransactionFilter: (transactionFilter) => set({ transactionFilter }),

      // 오프라인 수익
      setOfflineReward: (offlineReward) => set({ offlineReward }),

      claimOfflineReward: () => {
        const { offlineReward, gold } = get();
        if (offlineReward) {
          set({
            gold: gold + offlineReward.gold,
            offlineReward: null,
          });
        }
      },

      // 시간당 수익
      setHourlyRevenue: (hourlyRevenue) => set({ hourlyRevenue }),

      // 로딩
      setLoading: (isLoading) => set({ isLoading }),

      // 리셋
      reset: () => set(initialState),
    }),
    { name: 'EconomyStore' },
  ),
);

// 셀렉터: 필터링된 거래 내역
export const useFilteredTransactions = () => {
  const { transactions, transactionFilter } = useEconomyStore();

  if (transactionFilter === 'all') {
    return transactions;
  }

  return transactions.filter((t) => t.type === transactionFilter);
};

// 셀렉터: 재화 타입별 아이콘/색상
export const CURRENCY_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  gold: { icon: '🪙', color: 'text-yellow-500', name: '골드' },
  diamond: { icon: '💎', color: 'text-blue-500', name: '다이아' },
  dna: { icon: '🧬', color: 'text-purple-500', name: 'DNA' },
  explorationEnergy: { icon: '⚡', color: 'text-orange-500', name: '에너지' },
  seasonPoint: { icon: '🏆', color: 'text-amber-500', name: '시즌 포인트' },
  greatFigurePoint: { icon: '⭐', color: 'text-indigo-500', name: '위인 포인트' },
};
