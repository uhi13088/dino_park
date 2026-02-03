/**
 * Jest 테스트 셋업
 */

// 테스트 타임아웃 설정
jest.setTimeout(10000);

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/dino_park_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock @prisma/client enums (부분 모킹)
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    TransactionType: {
      EARN: 'EARN',
      SPEND: 'SPEND',
      PURCHASE: 'PURCHASE',
      REWARD: 'REWARD',
    },
    BuildingStatus: {
      CONSTRUCTING: 'CONSTRUCTING',
      ACTIVE: 'ACTIVE',
      UPGRADING: 'UPGRADING',
    },
    ExplorationStatus: {
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CLAIMED: 'CLAIMED',
    },
  };
});

// 콘솔 로그 억제 (선택)
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});
