/**
 * 프론트엔드 전용 타입 정의
 * 공유 타입은 @dino-park/shared에서 import
 */

// 공유 타입 re-export
export * from '@dino-park/shared';

// 프론트엔드 전용 타입들
export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  gridX: number;
  gridY: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 게임 엔진 관련 타입
export interface GameEntity {
  id: string;
  position: Position;
  gridPosition: GridPosition;
  size: { width: number; height: number };
}

// UI 상태 타입
export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: unknown;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
