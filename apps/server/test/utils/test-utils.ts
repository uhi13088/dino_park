/**
 * 테스트 유틸리티 함수들
 */
import type { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Mock PrismaService
 */
export const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  park: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  currency: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  dinosaur: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  building: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  userGreatFigure: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  storyProgress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  exploration: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  hatchingQueue: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  seasonPass: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

/**
 * 테스트 모듈 생성 헬퍼
 */
export async function createTestingModule(
  providers: NonNullable<ModuleMetadata['providers']>,
  imports: NonNullable<ModuleMetadata['imports']> = [],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports,
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
  }).compile();
}

/**
 * Mock 초기화
 */
export function resetAllMocks() {
  jest.clearAllMocks();
}

/**
 * 테스트 유저 데이터
 */
export const mockUser = {
  id: 'test-user-id',
  tossId: 'toss-123456',
  nickname: '테스트유저',
  level: 10,
  exp: 5000,
  tutorialStep: 100,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 테스트 파크 데이터
 */
export const mockPark = {
  id: 'test-park-id',
  userId: 'test-user-id',
  name: '테스트 파크',
  level: 5,
  exp: 2500,
  gridSizeX: 30,
  gridSizeY: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 테스트 재화 데이터
 */
export const mockCurrency = {
  id: 'test-currency-id',
  userId: 'test-user-id',
  gold: 50000,
  diamond: 500,
  dna: 100,
  explorationEnergy: 25,
  energyLastRechargedAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 테스트 공룡 데이터
 */
export const mockDinosaur = {
  id: 'test-dino-id',
  parkId: 'test-park-id',
  speciesId: 'trex',
  nickname: '렉시',
  level: 5,
  exp: 1000,
  happiness: 80,
  hunger: 20,
  intimacy: 50,
  positionX: 10,
  positionY: 10,
  isInPark: true,
  lastFedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 테스트 건물 데이터
 */
export const mockBuilding = {
  id: 'test-building-id',
  parkId: 'test-park-id',
  typeId: 'entrance',
  level: 2,
  positionX: 0,
  positionY: 0,
  status: 'ACTIVE',
  assignedGreatFigureId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 테스트 위인 데이터
 */
export const mockGreatFigure = {
  id: 'test-gf-id',
  userId: 'test-user-id',
  figureId: 'darwin',
  level: 3,
  exp: 500,
  assignedBuildingId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
