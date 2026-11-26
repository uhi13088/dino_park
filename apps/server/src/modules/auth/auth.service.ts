import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TossLoginDto } from './dto/toss-login.dto';
import { INITIAL_GOLD, INITIAL_DIAMOND, INITIAL_GRID_SIZE } from '@dino-park/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 토스 로그인/회원가입
   * - 신규 유저: User + Currency + Park 생성
   * - 기존 유저: 마지막 로그인 시간 업데이트
   */
  async tossLogin(dto: TossLoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { tossId: dto.tossId },
      include: { currency: true, park: true },
    });

    const isNewUser = !user;

    if (!user) {
      // 신규 유저 생성 (Currency, Park 함께 생성)
      user = await this.prisma.user.create({
        data: {
          tossId: dto.tossId,
          nickname: dto.nickname || '신입 사육사',
          currency: {
            create: {
              gold: INITIAL_GOLD,
              diamond: INITIAL_DIAMOND,
            },
          },
          park: {
            create: {
              name: `${dto.nickname || '신입 사육사'}의 파크`,
              gridSizeX: INITIAL_GRID_SIZE,
              gridSizeY: INITIAL_GRID_SIZE,
            },
          },
        },
        include: { currency: true, park: true },
      });
    } else {
      // 기존 유저: 마지막 로그인 시간 업데이트
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        include: { currency: true, park: true },
      });
    }

    // JWT 토큰 생성
    const tokens = this.generateTokens(user.id, user.tossId);

    return {
      ...tokens,
      isNewUser,
      user: {
        id: user.id,
        nickname: user.nickname,
        level: user.level,
        exp: user.exp,
        tutorialStep: user.tutorialStep,
      },
      currency: user.currency
        ? {
            gold: user.currency.gold,
            diamond: user.currency.diamond,
            dna: user.currency.dna,
          }
        : null,
      park: user.park
        ? {
            id: user.park.id,
            name: user.park.name,
            level: user.park.level,
          }
        : null,
    };
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    }

    return this.generateTokens(user.id, user.tossId);
  }

  /**
   * JWT 검증 (Strategy에서 호출)
   */
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { currency: true, park: true },
    });
  }

  /**
   * 현재 유저 프로필 조회
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        currency: {
          select: { id: true, userId: true, gold: true, diamond: true, dna: true, updatedAt: true },
        },
        park: {
          include: {
            _count: {
              select: { dinosaurs: true, buildings: true },
            },
          },
        },
        _count: {
          select: { greatFigures: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    }

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        level: user.level,
        exp: user.exp,
        tutorialStep: user.tutorialStep,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      currency: user.currency,
      park: user.park
        ? {
            id: user.park.id,
            name: user.park.name,
            level: user.park.level,
            exp: user.park.exp,
            gridSizeX: user.park.gridSizeX,
            gridSizeY: user.park.gridSizeY,
            dinosaurCount: user.park._count.dinosaurs,
            buildingCount: user.park._count.buildings,
          }
        : null,
      stats: {
        greatFigureCount: user._count.greatFigures,
      },
    };
  }

  /**
   * Access Token + Refresh Token 생성
   */
  private generateTokens(userId: string, tossId: string) {
    const payload = { sub: userId, tossId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }
}
