import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MAX_PARK_LEVEL } from '@dino-park/shared';

/**
 * 유저 레벨별 필요 경험치 계산
 * 공식: 100 * level^1.5 (문서 기준)
 */
function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저 프로필 조회
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
            _count: { select: { dinosaurs: true, buildings: true } },
          },
        },
        _count: { select: { greatFigures: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      level: user.level,
      exp: user.exp,
      expForNextLevel: getExpForLevel(user.level),
      tutorialStep: user.tutorialStep,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      currency: user.currency,
      park: user.park
        ? {
            id: user.park.id,
            name: user.park.name,
            level: user.park.level,
            dinosaurCount: user.park._count.dinosaurs,
            buildingCount: user.park._count.buildings,
          }
        : null,
      greatFigureCount: user._count.greatFigures,
    };
  }

  /**
   * 닉네임 변경
   */
  async updateNickname(userId: string, nickname: string) {
    if (!nickname || nickname.length < 2 || nickname.length > 12) {
      throw new BadRequestException('닉네임은 2~12자여야 합니다.');
    }

    // 금지어 체크 (간단한 예시)
    const banned = ['admin', 'gm', '운영자', '관리자'];
    if (banned.some((word) => nickname.toLowerCase().includes(word))) {
      throw new BadRequestException('사용할 수 없는 닉네임입니다.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
      select: { id: true, nickname: true },
    });
  }

  /**
   * 튜토리얼 진행 업데이트
   */
  async updateTutorialStep(userId: string, step: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tutorialStep: true },
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    // 튜토리얼은 앞으로만 진행 가능
    if (step <= user.tutorialStep) {
      return { tutorialStep: user.tutorialStep };
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { tutorialStep: step },
      select: { id: true, tutorialStep: true },
    });
  }

  /**
   * 경험치 추가 및 레벨업 처리
   */
  async addExp(
    userId: string,
    expAmount: number,
  ): Promise<{
    exp: number;
    level: number;
    leveledUp: boolean;
    newLevel?: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, exp: true },
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    let currentExp = user.exp + expAmount;
    let currentLevel = user.level;
    let leveledUp = false;

    // 레벨업 체크 (최대 레벨까지)
    while (currentLevel < MAX_PARK_LEVEL) {
      const expNeeded = getExpForLevel(currentLevel);
      if (currentExp >= expNeeded) {
        currentExp -= expNeeded;
        currentLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    // 최대 레벨 도달 시 경험치 초과분 제거
    if (currentLevel >= MAX_PARK_LEVEL) {
      currentExp = 0;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        exp: currentExp,
        level: currentLevel,
      },
      select: { id: true, level: true, exp: true },
    });

    return {
      exp: updated.exp,
      level: updated.level,
      leveledUp,
      newLevel: leveledUp ? currentLevel : undefined,
    };
  }

  /**
   * 유저 통계 조회
   */
  async getStats(userId: string) {
    const [dinosaurCount, buildingCount, greatFigureCount, explorationCount, completedChapters] =
      await Promise.all([
        this.prisma.dinosaur.count({
          where: { park: { userId } },
        }),
        this.prisma.building.count({
          where: { park: { userId } },
        }),
        this.prisma.userGreatFigure.count({
          where: { userId },
        }),
        this.prisma.exploration.count({
          where: { userId, status: 'CLAIMED' },
        }),
        this.prisma.storyProgress.count({
          where: { userId, completed: true },
        }),
      ]);

    return {
      dinosaurCount,
      buildingCount,
      greatFigureCount,
      explorationCount,
      completedChapters,
    };
  }
}
