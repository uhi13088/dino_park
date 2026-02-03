/**
 * 공통 타입 정의
 */

// 등급/희귀도
export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

// 상태
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

// 위치
export interface Position {
  x: number;
  y: number;
}

// 크기
export interface Size {
  width: number;
  height: number;
}

// 기본 엔티티
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 페이지네이션
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 시간 관련
export type Timestamp = number; // Unix timestamp in milliseconds
export type Duration = number; // Duration in milliseconds
