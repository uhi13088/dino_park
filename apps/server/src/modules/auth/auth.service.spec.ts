import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('7d'),
  };

  const mockUser = {
    id: 'user-1',
    tossId: 'toss-123456',
    nickname: 'TestUser',
    level: 1,
    exp: 0,
    tutorialStep: 0,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    currency: {
      id: 'currency-1',
      gold: 10000,
      diamond: 100,
      dna: 0,
      explorationEnergy: 30,
    },
    park: {
      id: 'park-1',
      name: 'TestUser의 파크',
      level: 1,
      exp: 0,
      gridSizeX: 20,
      gridSizeY: 20,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('tossLogin', () => {
    it('should create new user for first time login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.tossLogin({
        tossId: 'toss-new-user',
        nickname: 'NewUser',
      });

      expect(result.isNewUser).toBe(true);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.nickname).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should return existing user for returning login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        lastLoginAt: new Date(),
      });

      const result = await service.tossLogin({
        tossId: 'toss-123456',
      });

      expect(result.isNewUser).toBe(false);
      expect(result.user.id).toBe('user-1');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should use default nickname when not provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        nickname: '신입 사육사',
      });

      const result = await service.tossLogin({
        tossId: 'toss-new-user',
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nickname: '신입 사육사',
          }),
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens for valid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshToken('user-1');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for invalid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-user')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user with currency and park', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { currency: true, park: true },
      });
    });

    it('should return null for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('invalid-user');

      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return complete user profile', async () => {
      const userWithCounts = {
        ...mockUser,
        park: {
          ...mockUser.park,
          _count: { dinosaurs: 5, buildings: 3 },
        },
        _count: { greatFigures: 2 },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithCounts);

      const result = await service.getProfile('user-1');

      expect(result.user.id).toBe('user-1');
      expect(result.user.nickname).toBe('TestUser');
      expect(result.currency).toBeDefined();
      expect(result.park.dinosaurCount).toBe(5);
      expect(result.park.buildingCount).toBe(3);
      expect(result.stats.greatFigureCount).toBe(2);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('invalid-user')).rejects.toThrow(UnauthorizedException);
    });
  });
});
