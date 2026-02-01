import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { tokenManager } from '@/api/client';

interface User {
  id: string;
  nickname: string;
  level: number;
  exp: number;
}

interface Currency {
  gold: number;
  diamond: number;
  dna: number;
  explorationEnergy: number;
}

interface Park {
  id: string;
  name: string;
  level: number;
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  currency: Currency | null;
  park: Park | null;

  // 액션
  setAuth: (user: User, currency: Currency, park: Park) => void;
  updateUser: (user: Partial<User>) => void;
  updateCurrency: (currency: Partial<Currency>) => void;
  updatePark: (park: Partial<Park>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // 초기 상태
        isAuthenticated: tokenManager.isAuthenticated(),
        isLoading: false,
        user: null,
        currency: null,
        park: null,

        // 로그인 성공 시 호출
        setAuth: (user, currency, park) =>
          set({
            isAuthenticated: true,
            user,
            currency,
            park,
          }),

        // 유저 정보 업데이트
        updateUser: (userData) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          })),

        // 재화 업데이트
        updateCurrency: (currencyData) =>
          set((state) => ({
            currency: state.currency ? { ...state.currency, ...currencyData } : null,
          })),

        // 파크 업데이트
        updatePark: (parkData) =>
          set((state) => ({
            park: state.park ? { ...state.park, ...parkData } : null,
          })),

        // 로딩 상태
        setLoading: (loading) => set({ isLoading: loading }),

        // 로그아웃
        logout: () => {
          tokenManager.clearTokens();
          set({
            isAuthenticated: false,
            user: null,
            currency: null,
            park: null,
          });
        },
      }),
      {
        name: 'dino-park-auth',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          currency: state.currency,
          park: state.park,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
