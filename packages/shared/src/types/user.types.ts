/**
 * 유저 관련 타입 정의
 */

import { BaseEntity } from './common.types';

export interface User extends BaseEntity {
  tossId: string;
  nickname: string;
  level: number;
  exp: number;
  tutorialStep: number;
  lastLoginAt: Date;
}

export interface UserSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
