/**
 * 게임 상수
 */

// API 엔드포인트
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// 시간 상수 (밀리초)
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// 시즌 상수
export const SEASON_DURATION_DAYS = 90;
export const SEASON_PASS_MAX_LEVEL = 50;

// UI 상수
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const BASE_RESOLUTION_WIDTH = 1080;
export const BASE_RESOLUTION_HEIGHT = 1920;

// 탐험 지역
export const EXPLORATION_REGIONS = [
  'emerald-island',
  'white-rock',
  'sunset-coast',
  'deep-blue',
  'storm-island',
] as const;

// 도메인 용어 (영문 키)
export const DOMAIN_TERMS = {
  dinosaur: '공룡',
  building: '건물',
  greatFigure: '위인',
  park: '파크',
  exploration: '탐험',
  story: '스토리',
  chapter: '챕터',
  season: '시즌',
  currency: '재화',
  gold: '골드',
  diamond: '다이아',
  dna: 'DNA',
  hatching: '부화',
  rarity: '등급',
  level: '레벨',
  exp: '경험치',
  happiness: '행복도',
  hunger: '배고픔',
  intimacy: '친밀도',
  popularity: '인기도',
  revenue: '수익',
  maintenanceCost: '유지비',
  seasonPoint: '시즌 포인트',
} as const;
