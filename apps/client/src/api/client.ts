/**
 * API 클라이언트 설정
 * TanStack Query와 함께 사용
 */
import type { ApiResponse, RefreshTokenResponse } from '@dino-park/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 토큰 저장소
let accessToken: string | null = null;
let refreshToken: string | null = null;

/**
 * 토큰 관리 함수
 */
export const tokenManager = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,

  setTokens: (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  },

  loadTokens: () => {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  },

  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isAuthenticated: () => !!accessToken,
};

// 앱 시작 시 토큰 로드
tokenManager.loadTokens();

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 토큰 리프레시 함수
 */
async function refreshAccessToken(): Promise<boolean> {
  const currentRefreshToken = tokenManager.getRefreshToken();
  if (!currentRefreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return false;
    }

    const { data } = (await response.json()) as ApiResponse<RefreshTokenResponse>;
    tokenManager.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    tokenManager.clearTokens();
    return false;
  }
}

/**
 * API 요청 함수
 */
async function request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 토큰이 있으면 Authorization 헤더 추가
  const token = tokenManager.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 401 에러 시 토큰 리프레시 시도
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(endpoint, options, false);
    }
    // 리프레시 실패 시 로그아웃 이벤트 발생
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new ApiError(401, 'UNAUTHORIZED', '인증이 만료되었습니다.');
  }

  // 에러 응답 처리
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.code || 'UNKNOWN_ERROR',
      errorBody.message || 'An error occurred',
      errorBody.details,
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
}

/**
 * HTTP 메서드별 함수
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
