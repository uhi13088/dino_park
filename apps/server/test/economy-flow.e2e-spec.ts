/**
 * E2E Test: 재화 획득/소비 플로우
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { EconomyService } from '../src/modules/economy/economy.service';
import { ParkOperationsService } from '../src/modules/park/park-operations.service';

describe('Economy Flow E2E', () => {
  let economyService: EconomyService;

  const userId = 'test-user-id';
  const mockOperations = { settleInTransaction: jest.fn() };

  const mockPrismaService = {
    currency: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        EconomyService,
        { provide: ParkOperationsService, useValue: mockOperations },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    economyService = moduleFixture.get<EconomyService>(EconomyService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations.settleInTransaction.mockResolvedValue({
      elapsedHours: 0,
      gross: 0,
      maintenance: 0,
    });
  });

  describe('1. 입장료 정산 연결', () => {
    it('방문객 입장료의 공통 정산 결과만 반환한다', async () => {
      mockOperations.settleInTransaction.mockResolvedValue({
        elapsedHours: 4,
        gross: 12000,
        maintenance: 400,
      });
      const result = await economyService.collectOfflineRevenue(userId);
      expect(result.totalRevenue).toBe(11600);
      expect(result.collected).toBe(true);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });
    it('이미 정산한 입장료를 다시 지급하지 않는다', async () => {
      const result = await economyService.collectOfflineRevenue(userId);
      expect(result.collected).toBe(false);
      expect(mockPrismaService.currency.update).not.toHaveBeenCalled();
    });
  });

  describe('2. 재화 소비 플로우', () => {
    it('골드로 공룡 먹이주기', async () => {
      // Given: 충분한 골드가 있는 상태
      const initialGold = 50000;
      const feedCost = 100;

      mockPrismaService.currency.findUnique.mockResolvedValue({
        userId,
        gold: initialGold,
      });

      mockPrismaService.currency.update.mockResolvedValue({
        userId,
        gold: initialGold - feedCost,
      });

      mockPrismaService.transaction.create.mockResolvedValue({});

      // When: 골드 소비
      const result = await economyService.spendGold(userId, feedCost, '공룡 먹이주기');

      // Then: 골드가 차감됨
      expect(result.gold).toBe(initialGold - feedCost);
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });

    it('다이아로 에너지 충전', async () => {
      // Given: 충분한 다이아가 있는 상태
      const initialDiamond = 500;
      const refillCost = 30;

      mockPrismaService.currency.findUnique.mockResolvedValue({
        userId,
        diamond: initialDiamond,
        explorationEnergy: 5,
      });

      mockPrismaService.currency.update.mockResolvedValue({
        userId,
        diamond: initialDiamond - refillCost,
        explorationEnergy: 30,
      });

      mockPrismaService.transaction.create.mockResolvedValue({});

      // When: 에너지 충전
      const result = await economyService.refillEnergy(userId);

      // Then: 다이아가 차감되고 에너지가 최대로 충전됨
      expect(result.diamondSpent).toBe(refillCost);
      expect(result.energyRefilled).toBe(30);
    });

    it('잔액 부족 시 에러', async () => {
      // Given: 골드가 부족한 상태
      mockPrismaService.currency.findUnique.mockResolvedValue({
        userId,
        gold: 50,
      });

      // When & Then: 에러 발생
      await expect(economyService.spendGold(userId, 1000, '비싼 구매')).rejects.toThrow(
        '골드가 부족합니다',
      );
    });
  });

  describe('3. 재화 획득 플로우', () => {
    it('탐험 보상으로 DNA 획득', async () => {
      // Given: 현재 DNA
      const initialDna = 50;
      const rewardDna = 25;

      mockPrismaService.currency.update.mockResolvedValue({
        userId,
        dna: initialDna + rewardDna,
      });

      mockPrismaService.transaction.create.mockResolvedValue({});

      // When: DNA 획득
      const result = await economyService.addDna(userId, rewardDna, '탐험 보상');

      // Then: DNA가 증가함
      expect(result.dna).toBe(initialDna + rewardDna);
    });

    it('거래 내역 기록', async () => {
      // Given: 거래 후
      mockPrismaService.currency.update.mockResolvedValue({
        userId,
        gold: 51000,
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        userId,
        type: 'EARN',
        currencyType: 'gold',
        amount: 1000,
        reason: '퀘스트 보상',
        balanceAfter: 51000,
        createdAt: new Date(),
      });

      // When: 골드 획득
      await economyService.addGold(userId, 1000, '퀘스트 보상');

      // Then: 거래 내역이 기록됨
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'EARN',
          currencyType: 'gold',
          amount: 1000,
        }),
      });
    });
  });

  describe('4. 에너지 관리 플로우', () => {
    it('시간 경과에 따른 자동 에너지 회복', async () => {
      // Given: 30분 전에 마지막 회복
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      mockPrismaService.currency.findUnique.mockResolvedValue({
        userId,
        explorationEnergy: 10,
        energyLastRechargedAt: thirtyMinutesAgo,
      });

      mockPrismaService.currency.update.mockResolvedValue({
        userId,
        explorationEnergy: 13, // 10 + 3 (30분 / 10분 = 3)
        energyLastRechargedAt: new Date(),
      });

      // When: 에너지 회복
      const result = await economyService.rechargeEnergy(userId);

      // Then: 에너지가 회복됨
      expect(result!.explorationEnergy).toBe(13);
    });

    it('최대 에너지 초과 방지', async () => {
      // Given: 거의 풀 에너지 상태
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      mockPrismaService.currency.findUnique.mockResolvedValue({
        userId,
        explorationEnergy: 28,
        energyLastRechargedAt: oneHourAgo,
      });

      mockPrismaService.currency.update.mockResolvedValue({
        userId,
        explorationEnergy: 30, // 최대
        energyLastRechargedAt: new Date(),
      });

      // When: 에너지 회복
      const result = await economyService.rechargeEnergy(userId);

      // Then: 최대값을 초과하지 않음
      expect(result!.explorationEnergy).toBe(30);
    });
  });
});
