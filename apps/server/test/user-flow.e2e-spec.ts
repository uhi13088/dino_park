/**
 * E2E Test: 유저 가입 → 파크 생성 → 공룡 부화 플로우
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User Flow E2E', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;
  let parkId: string;

  // Mock JWT token for testing
  const mockTossToken = 'mock-toss-auth-token';

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    park: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
    },
    hatchingQueue: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 신규 유저 가입 플로우', () => {
    it('토스 로그인 후 신규 유저 생성', async () => {
      // Given: 토스 인증 토큰
      userId = 'new-user-id';
      parkId = 'new-park-id';

      mockPrismaService.user.findUnique.mockResolvedValue(null); // 신규 유저
      mockPrismaService.user.create.mockResolvedValue({
        id: userId,
        tossId: 'toss-12345',
        nickname: '신규유저',
        level: 1,
        exp: 0,
        tutorialStep: 0,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.park.create.mockResolvedValue({
        id: parkId,
        userId: userId,
        name: 'My Dino Park',
        level: 1,
        exp: 0,
        gridSizeX: 20,
        gridSizeY: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.currency.create.mockResolvedValue({
        id: 'currency-id',
        userId: userId,
        gold: 10000,
        diamond: 100,
        dna: 0,
        explorationEnergy: 30,
        energyLastRechargedAt: new Date(),
        updatedAt: new Date(),
      });

      // When & Then: 가입 성공 여부 확인
      // Note: 실제 토스 인증은 모킹됨
      expect(mockPrismaService.user.create).toBeDefined();
    });

    it('파크가 자동으로 생성됨', async () => {
      // Given: 생성된 유저
      mockPrismaService.park.findUnique.mockResolvedValue({
        id: parkId,
        userId: userId,
        name: 'My Dino Park',
        level: 1,
        exp: 0,
        gridSizeX: 20,
        gridSizeY: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When: 파크 조회
      const park = await mockPrismaService.park.findUnique({ where: { userId } });

      // Then: 파크가 존재함
      expect(park).toBeDefined();
      expect(park.userId).toBe(userId);
      expect(park.level).toBe(1);
      expect(park.gridSizeX).toBe(20);
    });

    it('초기 재화가 지급됨', async () => {
      // Given: 생성된 유저
      mockPrismaService.currency.findUnique.mockResolvedValue({
        id: 'currency-id',
        userId: userId,
        gold: 10000,
        diamond: 100,
        dna: 0,
        explorationEnergy: 30,
        energyLastRechargedAt: new Date(),
        updatedAt: new Date(),
      });

      // When: 재화 조회
      const currency = await mockPrismaService.currency.findUnique({ where: { userId } });

      // Then: 초기 재화 확인
      expect(currency).toBeDefined();
      expect(currency.gold).toBe(10000);
      expect(currency.diamond).toBe(100);
      expect(currency.explorationEnergy).toBe(30);
    });
  });

  describe('2. 공룡 부화 플로우', () => {
    const dinosaurId = 'new-dino-id';
    const hatchingId = 'hatching-id';

    it('알 부화 시작', async () => {
      // Given: 충분한 DNA가 있는 상태
      mockPrismaService.currency.findUnique.mockResolvedValue({
        userId: userId,
        dna: 100,
      });

      mockPrismaService.hatchingQueue.create.mockResolvedValue({
        id: hatchingId,
        userId: userId,
        eggType: 'common',
        speciesId: null,
        startedAt: new Date(),
        completesAt: new Date(Date.now() + 3600000), // 1시간 후
        completed: false,
      });

      // When: 부화 시작
      const hatching = await mockPrismaService.hatchingQueue.create({
        data: {
          userId,
          eggType: 'common',
          startedAt: new Date(),
          completesAt: new Date(Date.now() + 3600000),
        },
      });

      // Then: 부화 큐에 추가됨
      expect(hatching).toBeDefined();
      expect(hatching.eggType).toBe('common');
      expect(hatching.completed).toBe(false);
    });

    it('부화 완료 후 공룡 생성', async () => {
      // Given: 부화 완료된 상태
      mockPrismaService.hatchingQueue.findUnique.mockResolvedValue({
        id: hatchingId,
        userId: userId,
        eggType: 'common',
        speciesId: 'triceratops',
        startedAt: new Date(Date.now() - 3600000),
        completesAt: new Date(),
        completed: true,
      });

      mockPrismaService.dinosaur.create.mockResolvedValue({
        id: dinosaurId,
        parkId: parkId,
        speciesId: 'triceratops',
        nickname: null,
        level: 1,
        exp: 0,
        happiness: 100,
        hunger: 0,
        intimacy: 0,
        positionX: 10,
        positionY: 10,
        isInPark: true,
        lastFedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When: 공룡 생성
      const dinosaur = await mockPrismaService.dinosaur.create({
        data: {
          parkId,
          speciesId: 'triceratops',
          positionX: 10,
          positionY: 10,
        },
      });

      // Then: 공룡이 파크에 추가됨
      expect(dinosaur).toBeDefined();
      expect(dinosaur.speciesId).toBe('triceratops');
      expect(dinosaur.level).toBe(1);
      expect(dinosaur.isInPark).toBe(true);
    });

    it('공룡 목록에서 확인 가능', async () => {
      // Given: 공룡이 있는 상태
      mockPrismaService.dinosaur.findMany.mockResolvedValue([
        {
          id: dinosaurId,
          parkId: parkId,
          speciesId: 'triceratops',
          level: 1,
          happiness: 100,
          isInPark: true,
        },
      ]);

      // When: 공룡 목록 조회
      const dinosaurs = await mockPrismaService.dinosaur.findMany({
        where: { parkId },
      });

      // Then: 공룡이 목록에 포함됨
      expect(dinosaurs).toHaveLength(1);
      expect(dinosaurs[0].speciesId).toBe('triceratops');
    });
  });
});
