import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';

// tokenManager 모킹
vi.mock('@/api/client', () => ({
  tokenManager: {
    isAuthenticated: vi.fn(() => false),
    clearTokens: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  const mockUser = {
    id: 'user-1',
    nickname: 'TestUser',
    level: 5,
    exp: 1000,
  };

  const mockCurrency = {
    gold: 50000,
    diamond: 500,
    dna: 100,
    explorationEnergy: 25,
  };

  const mockPark = {
    id: 'park-1',
    name: 'Test Park',
    level: 3,
  };

  beforeEach(() => {
    // 각 테스트 전에 로그아웃으로 초기화
    useAuthStore.getState().logout();
  });

  describe('initial state', () => {
    it('should start with unauthenticated state', () => {
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.currency).toBeNull();
      expect(state.park).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should set authenticated state with user data', () => {
      useAuthStore.getState().setAuth(mockUser, mockCurrency, mockPark);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.currency).toEqual(mockCurrency);
      expect(state.park).toEqual(mockPark);
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      useAuthStore.getState().setAuth(mockUser, mockCurrency, mockPark);
      useAuthStore.getState().updateUser({ level: 6, exp: 1500 });

      const state = useAuthStore.getState();
      expect(state.user?.level).toBe(6);
      expect(state.user?.exp).toBe(1500);
      expect(state.user?.nickname).toBe('TestUser'); // 기존 값 유지
    });

    it('should not update if user is null', () => {
      useAuthStore.getState().updateUser({ level: 10 });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('updateCurrency', () => {
    it('should update currency data', () => {
      useAuthStore.getState().setAuth(mockUser, mockCurrency, mockPark);
      useAuthStore.getState().updateCurrency({ gold: 60000, diamond: 600 });

      const state = useAuthStore.getState();
      expect(state.currency?.gold).toBe(60000);
      expect(state.currency?.diamond).toBe(600);
      expect(state.currency?.dna).toBe(100); // 기존 값 유지
    });

    it('should not update if currency is null', () => {
      useAuthStore.getState().updateCurrency({ gold: 100000 });

      expect(useAuthStore.getState().currency).toBeNull();
    });
  });

  describe('updatePark', () => {
    it('should update park data', () => {
      useAuthStore.getState().setAuth(mockUser, mockCurrency, mockPark);
      useAuthStore.getState().updatePark({ level: 5, name: 'New Park Name' });

      const state = useAuthStore.getState();
      expect(state.park?.level).toBe(5);
      expect(state.park?.name).toBe('New Park Name');
      expect(state.park?.id).toBe('park-1'); // 기존 값 유지
    });

    it('should not update if park is null', () => {
      useAuthStore.getState().updatePark({ level: 10 });

      expect(useAuthStore.getState().park).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all auth data', () => {
      useAuthStore.getState().setAuth(mockUser, mockCurrency, mockPark);
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.currency).toBeNull();
      expect(state.park).toBeNull();
    });
  });
});
