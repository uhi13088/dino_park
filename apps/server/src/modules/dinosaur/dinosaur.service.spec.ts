import { Test, TestingModule } from '@nestjs/testing';
import { DinosaurService } from './dinosaur.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('DinosaurService', () => {
  let service: DinosaurService;

  const mockPrismaService = {
    park: {
      findUnique: jest.fn(),
    },
    dinosaur: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    currency: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPark = {
    id: 'park-1',
    userId: 'user-1',
    name: 'Test Park',
    level: 5,
    gridSizeX: 30,
    gridSizeY: 30,
  };

  const mockDinosaur = {
    id: 'dino-1',
    parkId: 'park-1',
    speciesId: 'trex',
    nickname: 'Rex',
    level: 3,
    exp: 100,
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

  const mockCurrency = {
    id: 'currency-1',
    userId: 'user-1',
    gold: 10000,
    diamond: 100,
    dna: 50,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DinosaurService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DinosaurService>(DinosaurService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('should return dinosaurs for a valid user', async () => {
      mockPrismaService.park.findUnique.mockResolvedValue(mockPark);
      mockPrismaService.dinosaur.findMany.mockResolvedValue([mockDinosaur]);

      const result = await service.getByUserId('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dino-1');
      expect(mockPrismaService.park.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should throw NotFoundException when park not found', async () => {
      mockPrismaService.park.findUnique.mockResolvedValue(null);

      await expect(service.getByUserId('invalid-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('should return dinosaur by id', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: { userId: 'user-1' },
      });

      const result = await service.getById('dino-1');

      expect(result.id).toBe('dino-1');
      expect(result.speciesId).toBe('trex');
    });

    it('should throw NotFoundException when dinosaur not found', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue(null);

      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own dinosaur', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: { userId: 'other-user' },
      });

      await expect(service.getById('dino-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create a new dinosaur', async () => {
      mockPrismaService.park.findUnique.mockResolvedValue(mockPark);
      mockPrismaService.dinosaur.create.mockResolvedValue({
        ...mockDinosaur,
        id: 'new-dino',
      });

      const result = await service.create('user-1', 'trex', 5, 5, 'Baby Rex');

      expect(result.id).toBe('new-dino');
      expect(mockPrismaService.dinosaur.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parkId: 'park-1',
          speciesId: 'trex',
          nickname: 'Baby Rex',
          positionX: 5,
          positionY: 5,
        }),
      });
    });

    it('should throw NotFoundException when park not found', async () => {
      mockPrismaService.park.findUnique.mockResolvedValue(null);

      await expect(service.create('invalid-user', 'trex', 5, 5)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid position', async () => {
      mockPrismaService.park.findUnique.mockResolvedValue(mockPark);

      await expect(service.create('user-1', 'trex', -1, 5)).rejects.toThrow(BadRequestException);
      await expect(service.create('user-1', 'trex', 100, 5)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateNickname', () => {
    it('should update dinosaur nickname', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: { userId: 'user-1' },
      });
      mockPrismaService.dinosaur.update.mockResolvedValue({
        ...mockDinosaur,
        nickname: 'New Name',
      });

      const result = await service.updateNickname('dino-1', 'user-1', 'New Name');

      expect(result.nickname).toBe('New Name');
    });

    it('should throw BadRequestException for invalid nickname length', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: { userId: 'user-1' },
      });

      await expect(
        service.updateNickname('dino-1', 'user-1', 'This is a very long nickname'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('move', () => {
    it('should move dinosaur to new position', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: mockPark,
      });
      mockPrismaService.dinosaur.update.mockResolvedValue({
        ...mockDinosaur,
        positionX: 15,
        positionY: 15,
      });

      const result = await service.move('dino-1', 'user-1', 15, 15);

      expect(result.positionX).toBe(15);
      expect(result.positionY).toBe(15);
    });

    it('should throw BadRequestException for out of bounds position', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: mockPark,
      });

      await expect(service.move('dino-1', 'user-1', 50, 50)).rejects.toThrow(BadRequestException);
    });
  });

  describe('feed', () => {
    it('should feed dinosaur and update stats', async () => {
      const hungryDinosaur = {
        ...mockDinosaur,
        happiness: 60,
        hunger: 50,
        park: { userId: 'user-1' },
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(hungryDinosaur);
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);
      mockPrismaService.$transaction.mockResolvedValue([
        { ...mockCurrency, gold: mockCurrency.gold - 100 },
        { ...hungryDinosaur, happiness: 80, hunger: 0 },
      ]);

      const result = await service.feed('dino-1', 'user-1');

      expect(result.goldSpent).toBe(100);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when not enough gold', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        hunger: 50,
        park: { userId: 'user-1' },
      });
      mockPrismaService.currency.findUnique.mockResolvedValue({
        ...mockCurrency,
        gold: 50,
      });

      await expect(service.feed('dino-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when dinosaur is not hungry', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        hunger: 0,
        park: { userId: 'user-1' },
      });
      mockPrismaService.currency.findUnique.mockResolvedValue(mockCurrency);

      await expect(service.feed('dino-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFromPark', () => {
    it('should remove dinosaur from park', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: { userId: 'user-1' },
      });
      mockPrismaService.dinosaur.update.mockResolvedValue({
        ...mockDinosaur,
        isInPark: false,
      });

      const result = await service.removeFromPark('dino-1', 'user-1');

      expect(result.isInPark).toBe(false);
    });
  });

  describe('placeInPark', () => {
    it('should place dinosaur in park', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        isInPark: false,
        park: mockPark,
      });
      mockPrismaService.dinosaur.update.mockResolvedValue({
        ...mockDinosaur,
        isInPark: true,
        positionX: 20,
        positionY: 20,
      });

      const result = await service.placeInPark('dino-1', 'user-1', 20, 20);

      expect(result.isInPark).toBe(true);
      expect(result.positionX).toBe(20);
      expect(result.positionY).toBe(20);
    });
  });

  describe('release', () => {
    it('should release dinosaur and reward DNA', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue({
        ...mockDinosaur,
        park: { userId: 'user-1' },
      });
      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.release('dino-1', 'user-1');

      expect(result.released).toBe(true);
      expect(result.dnaReward).toBeGreaterThan(0);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('calculateRevenue', () => {
    it('should calculate hourly revenue', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue(mockDinosaur);

      const result = await service.calculateRevenue('dino-1');

      expect(result.hourlyRevenue).toBeGreaterThan(0);
      expect(result.minuteRevenue).toBeDefined();
      expect(result.level).toBe(3);
    });

    it('should throw NotFoundException when dinosaur not found', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue(null);

      await expect(service.calculateRevenue('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('interact', () => {
    it('should interact with dinosaur and gain happiness/intimacy', async () => {
      const readyForInteraction = {
        ...mockDinosaur,
        lastFedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        park: { userId: 'user-1' },
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(readyForInteraction);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          dinosaur: {
            update: jest.fn().mockResolvedValue({
              ...readyForInteraction,
              happiness: 85,
              intimacy: 60,
              exp: 110,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.interact('dino-1', 'user-1');

      expect(result.happinessGain).toBeGreaterThan(0);
      expect(result.intimacyGain).toBeGreaterThan(0);
      expect(result.expGain).toBeGreaterThan(0);
    });

    it('should throw BadRequestException when on cooldown', async () => {
      const recentlyInteracted = {
        ...mockDinosaur,
        lastFedAt: new Date(), // Just now
        park: { userId: 'user-1' },
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(recentlyInteracted);

      await expect(service.interact('dino-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should level up dinosaur when enough exp gained', async () => {
      const highExpDinosaur = {
        ...mockDinosaur,
        exp: 990, // Close to level up
        level: 1,
        lastFedAt: new Date(Date.now() - 10 * 60 * 1000),
        park: { userId: 'user-1' },
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(highExpDinosaur);

      let updateCallCount = 0;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          dinosaur: {
            update: jest.fn().mockImplementation(() => {
              updateCallCount++;
              if (updateCallCount === 1) {
                return Promise.resolve({
                  ...highExpDinosaur,
                  exp: 1000, // After adding expGain
                  happiness: 85,
                  intimacy: 60,
                });
              }
              // Second call is for level up
              return Promise.resolve({
                ...highExpDinosaur,
                level: 2,
                exp: 0,
              });
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.interact('dino-1', 'user-1');

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBeGreaterThan(1);
    });
  });

  describe('checkLevelUp', () => {
    it('should level up dinosaur when enough exp', async () => {
      const highExpDinosaur = {
        ...mockDinosaur,
        exp: 2000, // High exp for level 3
        level: 3,
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(highExpDinosaur);
      mockPrismaService.dinosaur.update.mockResolvedValue({
        ...highExpDinosaur,
        level: 5,
        exp: 0,
      });

      const result = await service.checkLevelUp('dino-1');

      expect(result!.leveledUp).toBe(true);
      expect(result!.newLevel).toBeGreaterThan(3);
    });

    it('should not level up when insufficient exp', async () => {
      const lowExpDinosaur = {
        ...mockDinosaur,
        exp: 30, // Level 1 needs 50 exp (50 * 1^1.5 = 50)
        level: 1,
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(lowExpDinosaur);

      const result = await service.checkLevelUp('dino-1');

      expect(result!.leveledUp).toBe(false);
      expect(mockPrismaService.dinosaur.update).not.toHaveBeenCalled();
    });

    it('should return null when dinosaur not found', async () => {
      mockPrismaService.dinosaur.findUnique.mockResolvedValue(null);

      const result = await service.checkLevelUp('invalid-id');

      expect(result).toBeNull();
    });

    it('should handle multiple level ups', async () => {
      const veryHighExpDinosaur = {
        ...mockDinosaur,
        exp: 10000, // Enough for multiple levels
        level: 1,
      };

      mockPrismaService.dinosaur.findUnique.mockResolvedValue(veryHighExpDinosaur);
      mockPrismaService.dinosaur.update.mockResolvedValue({
        ...veryHighExpDinosaur,
        level: 5,
        exp: 500,
      });

      const result = await service.checkLevelUp('dino-1');

      expect(result!.leveledUp).toBe(true);
      expect(result!.newLevel).toBeGreaterThan(1);
    });
  });
});
