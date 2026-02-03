import { Test, TestingModule } from '@nestjs/testing';
import { EconomyService } from './economy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EconomyService', () => {
  let service: EconomyService;
  let prisma: PrismaService;

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
  };

  const mockCurrency = {
    id: 'currency-1',
    userId: 'user-1',
    gold: 50000,
    diamond: 500,
    dna: 100,
    explorationEnergy: 20,
    energyLastRechargedAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    tossId: 'toss-123',
    nickname: 'TestUser',
    lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    park: {
      id: 'park-1',
      dinosaurs: [
        { id: 'dino-1', level: 5, happiness: 80, isInPark: true },
        { id: 'dino-2', level: 3, happiness: 60, isInPark: true },
      ],
      buildings: [
        { id: 'building-1', status: 'ACTIVE' },
        { id: 'building-2', status: 'ACTIVE' },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getCurrency', () => {
    it('should return currency with calculated energy', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);

      const result = await service.getCurrency('user-1');

      expect(result.gold).toBe(50000);
      expect(result.diamond).toBe(500);
      expect(result.dna).toBe(100);
      expect(result.maxExplorationEnergy).toBe(30);
    });

    it('should throw NotFoundException when currency not found', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(null);

      await expect(service.getCurrency('invalid-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('collectOfflineRevenue', () => {
    it('should calculate and collect offline revenue', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        gold: mockCurrency.gold + 1000,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.collectOfflineRevenue('user-1');

      expect(result.collected).toBe(true);
      expect(result.offlineHours).toBeGreaterThan(0);
      expect(result.totalRevenue).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.collectOfflineRevenue('invalid-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return zero revenue for very short offline time', async () => {
      const recentUser = {
        ...mockUser,
        lastLoginAt: new Date(), // Just now
      };
      mockPrismaService.user.findUnique.mockResolvedValue(recentUser);

      const result = await service.collectOfflineRevenue('user-1');

      expect(result.collected).toBe(false);
      expect(result.totalRevenue).toBe(0);
    });
  });

  describe('addGold', () => {
    it('should add gold and record transaction', async () => {
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        gold: mockCurrency.gold + 1000,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.addGold('user-1', 1000, 'Test reward');

      expect(result.gold).toBe(51000);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'EARN',
          currencyType: 'gold',
          amount: 1000,
        }),
      });
    });
  });

  describe('spendGold', () => {
    it('should spend gold when sufficient balance', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        gold: mockCurrency.gold - 1000,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.spendGold('user-1', 1000, 'Purchase');

      expect(result.gold).toBe(49000);
    });

    it('should throw BadRequestException when insufficient gold', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue({
        ...mockCurrency,
        gold: 500,
      });

      await expect(service.spendGold('user-1', 1000, 'Purchase')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addDiamond', () => {
    it('should add diamond and record transaction', async () => {
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        diamond: mockCurrency.diamond + 100,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.addDiamond('user-1', 100, 'IAP purchase');

      expect(result.diamond).toBe(600);
    });
  });

  describe('spendDiamond', () => {
    it('should spend diamond when sufficient balance', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        diamond: mockCurrency.diamond - 100,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.spendDiamond('user-1', 100, 'Energy refill');

      expect(result.diamond).toBe(400);
    });

    it('should throw BadRequestException when insufficient diamond', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue({
        ...mockCurrency,
        diamond: 50,
      });

      await expect(service.spendDiamond('user-1', 100, 'Energy refill')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addDna', () => {
    it('should add DNA and record transaction', async () => {
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        dna: mockCurrency.dna + 50,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.addDna('user-1', 50, 'Exploration reward');

      expect(result.dna).toBe(150);
    });
  });

  describe('spendDna', () => {
    it('should spend DNA when sufficient balance', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        dna: mockCurrency.dna - 50,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.spendDna('user-1', 50, 'Hatching');

      expect(result.dna).toBe(50);
    });

    it('should throw BadRequestException when insufficient DNA', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue({
        ...mockCurrency,
        dna: 20,
      });

      await expect(service.spendDna('user-1', 50, 'Hatching')).rejects.toThrow(BadRequestException);
    });
  });

  describe('useEnergy', () => {
    it('should use energy when sufficient', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        explorationEnergy: mockCurrency.explorationEnergy - 5,
      });

      const result = await service.useEnergy('user-1', 5);

      expect(result.explorationEnergy).toBe(15);
    });

    it('should throw BadRequestException when insufficient energy', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue({
        ...mockCurrency,
        explorationEnergy: 3,
      });

      await expect(service.useEnergy('user-1', 5)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rechargeEnergy', () => {
    it('should recharge energy based on time passed', async () => {
      const oldEnergy = {
        ...mockCurrency,
        explorationEnergy: 10,
        energyLastRechargedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      };
      mockPrismaService.currency.findUnique.mockResolvedValue(oldEnergy);
      mockPrismaService.currency.update.mockResolvedValue({
        ...oldEnergy,
        explorationEnergy: 13, // 30 min / 10 min = 3 energy
      });

      const result = await service.rechargeEnergy('user-1');

      expect(result.explorationEnergy).toBe(13);
    });

    it('should not exceed max energy', async () => {
      const almostFullEnergy = {
        ...mockCurrency,
        explorationEnergy: 28,
        energyLastRechargedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };
      mockPrismaService.currency.findUnique.mockResolvedValue(almostFullEnergy);
      mockPrismaService.currency.update.mockResolvedValue({
        ...almostFullEnergy,
        explorationEnergy: 30, // Max
      });

      const result = await service.rechargeEnergy('user-1');

      expect(result.explorationEnergy).toBe(30);
    });
  });

  describe('refillEnergy', () => {
    it('should refill energy using diamond', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);
      mockPrismaService.currency.update.mockResolvedValue({
        ...mockCurrency,
        diamond: mockCurrency.diamond - 30,
        explorationEnergy: 30,
      });
      mockPrismaService.transaction.create.mockResolvedValue({});

      const result = await service.refillEnergy('user-1');

      expect(result.diamondSpent).toBe(30);
      expect(result.energyRefilled).toBe(30);
    });

    it('should throw BadRequestException when insufficient diamond', async () => {
      mockPrismaService.currency.findUnique.mockResolvedValue({
        ...mockCurrency,
        diamond: 20,
      });

      await expect(service.refillEnergy('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history with pagination', async () => {
      const mockTransactions = [
        { id: 'tx-1', type: 'EARN', amount: 1000 },
        { id: 'tx-2', type: 'SPEND', amount: -500 },
      ];
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(10);

      const result = await service.getTransactionHistory('user-1', {
        limit: 2,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should filter by currency type', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      await service.getTransactionHistory('user-1', {
        currencyType: 'gold',
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', currencyType: 'gold' },
        }),
      );
    });
  });
});
