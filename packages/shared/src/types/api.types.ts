/**
 * API 요청/응답 타입 정의
 */

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

// API 에러 응답
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: number;
}

// 인증 관련
export interface LoginRequest {
  tossToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    nickname: string;
    level: number;
  };
}

// 공통 요청 타입
export interface IdParam {
  id: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
