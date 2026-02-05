import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserGreatFigure } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GREAT_FIGURE_DATA,
  getGreatFigureById,
} from '@dino-park/game-data';
import type { GreatFigureType } from '@dino-park/shared';

// 레벨업 경험치 테이블
const LEVEL_EXP_TABLE = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const MAX_LEVEL = 10;

@Injectable()
export class GreatFigureService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // 조회
  // ================================================================

  /**
   * 유저의 모든 위인 조회
   */
  async getByUserId(userId: string) {
    const userFigures = await this.prisma.userGreatFigure.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return userFigures.map((uf: UserGreatFigure) => {
      const figureData = getGreatFigureById(uf.figureId);
      return {
        ...uf,
        figureData,
        nextLevelExp: this.getExpForLevel(uf.level + 1),
        currentLevelExp: this.getExpForLevel(uf.level),
      };
    });
  }

  /**
   * 특정 위인 상세 조회
   */
  async getById(userId: string, figureId: string) {
    const userFigure = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (!userFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    const figureData = getGreatFigureById(figureId);

    // 현재 적용 중인 시너지 계산
    const activeSynergies = await this.calculateActiveSynergies(userId, figureId);

    return {
      ...userFigure,
      figureData,
      activeSynergies,
      nextLevelExp: this.getExpForLevel(userFigure.level + 1),
      currentLevelExp: this.getExpForLevel(userFigure.level),
    };
  }

  /**
   * 영입 가능한 위인 목록 조회
   */
  async getAvailableFigures(userId: string) {
    const ownedFigures = await this.prisma.userGreatFigure.findMany({
      where: { userId },
      select: { figureId: true },
    });

    const ownedIds = new Set(ownedFigures.map((f: { figureId: string }) => f.figureId));

    const availableFigures: Array<{
      figure: GreatFigureType;
      isOwned: boolean;
      canRecruit: boolean;
      recruitConditionMet: boolean;
    }> = [];

    for (const figure of GREAT_FIGURE_DATA) {
      const isOwned = ownedIds.has(figure.id);
      const conditionMet = await this.checkUnlockCondition(userId, figure);

      availableFigures.push({
        figure,
        isOwned,
        canRecruit: !isOwned && conditionMet,
        recruitConditionMet: conditionMet,
      });
    }

    return availableFigures;
  }

  // ================================================================
  // 영입
  // ================================================================

  /**
   * 위인 영입
   */
  async recruit(userId: string, figureId: string) {
    const figureData = getGreatFigureById(figureId);
    if (!figureData) {
      throw new NotFoundException('존재하지 않는 위인입니다.');
    }

    // 이미 보유한 위인인지 확인
    const existing = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (existing) {
      throw new ConflictException('이미 영입한 위인입니다.');
    }

    // 영입 조건 확인
    const conditionMet = await this.checkUnlockCondition(userId, figureData);
    if (!conditionMet) {
      throw new BadRequestException(
        `영입 조건을 충족하지 않았습니다: ${figureData.unlockCondition.description}`,
      );
    }

    // 영입 비용 확인 및 차감
    if (figureData.recruitCost > 0) {
      const currency = await this.prisma.currency.findUnique({
        where: { userId },
      });

      if (!currency || currency.diamond < figureData.recruitCost) {
        throw new BadRequestException('다이아가 부족합니다.');
      }

      await this.prisma.currency.update({
        where: { userId },
        data: { diamond: { decrement: figureData.recruitCost } },
      });
    }

    // 위인 생성
    const userFigure = await this.prisma.userGreatFigure.create({
      data: {
        userId,
        figureId,
        level: 1,
        exp: 0,
      },
    });

    return {
      userFigure,
      figureData,
      message: `${figureData.nameKo}을(를) 영입했습니다!`,
    };
  }

  // ================================================================
  // 건물 배정
  // ================================================================

  /**
   * 위인을 건물에 배정
   */
  async assignToBuilding(userId: string, figureId: string, buildingId: string) {
    // 위인 확인
    const userFigure = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (!userFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    // 이미 다른 건물에 배정되어 있는지 확인
    if (userFigure.assignedBuildingId) {
      throw new BadRequestException('이미 다른 건물에 배정되어 있습니다. 먼저 배정 해제하세요.');
    }

    // 건물 확인
    const building = await this.prisma.building.findFirst({
      where: {
        id: buildingId,
        park: { userId },
      },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    // 건물에 이미 다른 위인이 배정되어 있는지 확인
    if (building.assignedGreatFigureId) {
      throw new BadRequestException('이 건물에는 이미 다른 위인이 배정되어 있습니다.');
    }

    // 배정 실행 (트랜잭션)
    const [updatedFigure, updatedBuilding] = await this.prisma.$transaction([
      this.prisma.userGreatFigure.update({
        where: { userId_figureId: { userId, figureId } },
        data: { assignedBuildingId: buildingId },
      }),
      this.prisma.building.update({
        where: { id: buildingId },
        data: { assignedGreatFigureId: figureId },
      }),
    ]);

    const figureData = getGreatFigureById(figureId);

    return {
      figure: updatedFigure,
      building: updatedBuilding,
      message: `${figureData?.nameKo}을(를) 건물에 배정했습니다.`,
    };
  }

  /**
   * 위인 배정 해제
   */
  async unassignFromBuilding(userId: string, figureId: string) {
    const userFigure = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (!userFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    if (!userFigure.assignedBuildingId) {
      throw new BadRequestException('건물에 배정되어 있지 않습니다.');
    }

    const buildingId = userFigure.assignedBuildingId;

    // 배정 해제 (트랜잭션)
    const [updatedFigure, _] = await this.prisma.$transaction([
      this.prisma.userGreatFigure.update({
        where: { userId_figureId: { userId, figureId } },
        data: { assignedBuildingId: null },
      }),
      this.prisma.building.update({
        where: { id: buildingId },
        data: { assignedGreatFigureId: null },
      }),
    ]);

    const figureData = getGreatFigureById(figureId);

    return {
      figure: updatedFigure,
      message: `${figureData?.nameKo}의 배정을 해제했습니다.`,
    };
  }

  /**
   * 건물에 배정된 위인 조회
   */
  async getAssignedFigures(userId: string) {
    const assignedFigures = await this.prisma.userGreatFigure.findMany({
      where: {
        userId,
        assignedBuildingId: { not: null },
      },
    });

    return Promise.all(
      assignedFigures.map(async (uf: UserGreatFigure) => {
        const building = await this.prisma.building.findUnique({
          where: { id: uf.assignedBuildingId! },
        });
        return {
          figure: uf,
          figureData: getGreatFigureById(uf.figureId),
          building,
        };
      }),
    );
  }

  // ================================================================
  // 레벨업
  // ================================================================

  /**
   * 경험치 추가
   */
  async addExp(userId: string, figureId: string, amount: number) {
    const userFigure = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (!userFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    if (userFigure.level >= MAX_LEVEL) {
      return {
        figure: userFigure,
        leveledUp: false,
        message: '이미 최대 레벨입니다.',
      };
    }

    let newExp = userFigure.exp + amount;
    let newLevel = userFigure.level;
    let leveledUp = false;

    // 레벨업 체크
    while (newLevel < MAX_LEVEL && newExp >= this.getExpForLevel(newLevel + 1)) {
      newLevel++;
      leveledUp = true;
    }

    // 최대 레벨이면 경험치 cap
    if (newLevel >= MAX_LEVEL) {
      newExp = this.getExpForLevel(MAX_LEVEL);
    }

    const updatedFigure = await this.prisma.userGreatFigure.update({
      where: { userId_figureId: { userId, figureId } },
      data: { exp: newExp, level: newLevel },
    });

    const figureData = getGreatFigureById(figureId);

    return {
      figure: updatedFigure,
      figureData,
      leveledUp,
      newLevel,
      message: leveledUp
        ? `${figureData?.nameKo}이(가) 레벨 ${newLevel}로 성장했습니다!`
        : `경험치 +${amount}`,
    };
  }

  /**
   * 골드로 레벨업 (즉시)
   */
  async levelUpWithGold(userId: string, figureId: string) {
    const userFigure = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (!userFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    if (userFigure.level >= MAX_LEVEL) {
      throw new BadRequestException('이미 최대 레벨입니다.');
    }

    const nextLevelExp = this.getExpForLevel(userFigure.level + 1);
    const expNeeded = nextLevelExp - userFigure.exp;
    const goldCost = expNeeded * 10; // 경험치 1당 골드 10

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.gold < goldCost) {
      throw new BadRequestException(`골드가 부족합니다. (필요: ${goldCost})`);
    }

    // 골드 차감 및 레벨업
    await this.prisma.currency.update({
      where: { userId },
      data: { gold: { decrement: goldCost } },
    });

    const updatedFigure = await this.prisma.userGreatFigure.update({
      where: { userId_figureId: { userId, figureId } },
      data: {
        level: userFigure.level + 1,
        exp: nextLevelExp,
      },
    });

    const figureData = getGreatFigureById(figureId);

    return {
      figure: updatedFigure,
      figureData,
      goldSpent: goldCost,
      message: `${figureData?.nameKo}이(가) 레벨 ${updatedFigure.level}로 성장했습니다!`,
    };
  }

  // ================================================================
  // 시너지 계산
  // ================================================================

  /**
   * 특정 위인의 활성화된 시너지 계산
   */
  async calculateActiveSynergies(userId: string, figureId: string) {
    const figureData = getGreatFigureById(figureId);
    if (!figureData) return [];

    const userFigure = await this.prisma.userGreatFigure.findUnique({
      where: { userId_figureId: { userId, figureId } },
    });

    if (!userFigure?.assignedBuildingId) return [];

    // 같은 건물에 배정된 다른 위인들 찾기
    const sameBuildingFigures = await this.prisma.userGreatFigure.findMany({
      where: {
        userId,
        assignedBuildingId: userFigure.assignedBuildingId,
        figureId: { not: figureId },
      },
    });

    const sameBuildingIds = new Set(sameBuildingFigures.map((f: UserGreatFigure) => f.figureId));

    // 활성화된 시너지
    const activeSynergies = figureData.synergies.filter((s) => sameBuildingIds.has(s.partnerId));

    return activeSynergies.map((s) => ({
      ...s,
      partnerData: getGreatFigureById(s.partnerId),
    }));
  }

  /**
   * 건물의 총 시너지 보너스 계산
   */
  async calculateBuildingBonuses(userId: string, buildingId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building?.assignedGreatFigureId) {
      return { bonuses: {}, figureAbilities: [] };
    }

    const assignedFigure = await this.prisma.userGreatFigure.findFirst({
      where: { userId, assignedBuildingId: buildingId },
    });

    if (!assignedFigure) {
      return { bonuses: {}, figureAbilities: [] };
    }

    const figureData = getGreatFigureById(assignedFigure.figureId);
    if (!figureData) {
      return { bonuses: {}, figureAbilities: [] };
    }

    // 레벨에 맞는 능력
    const abilities = figureData.abilities.filter((a) => a.level <= assignedFigure.level);

    // 활성화된 시너지
    const activeSynergies = await this.calculateActiveSynergies(userId, assignedFigure.figureId);

    // 보너스 합산
    const bonuses: Record<string, number> = {};
    for (const synergy of activeSynergies) {
      for (const [key, value] of Object.entries(synergy.bonus)) {
        bonuses[key] = (bonuses[key] || 0) + (value as number);
      }
    }

    return {
      figureData,
      figureLevel: assignedFigure.level,
      abilities,
      activeSynergies,
      bonuses,
    };
  }

  // ================================================================
  // 헬퍼 메서드
  // ================================================================

  /**
   * 영입 조건 확인
   */
  private async checkUnlockCondition(userId: string, figure: GreatFigureType): Promise<boolean> {
    const { type, value } = figure.unlockCondition;

    switch (type) {
      case 'tutorial':
        // 튜토리얼 완료 (항상 true로 처리 - 튜토리얼 완료 후 접근 가능)
        return true;

      case 'story': {
        const progress = await this.prisma.storyProgress.findFirst({
          where: {
            userId,
            chapterId: value as string,
            completed: true,
          },
        });
        return !!progress;
      }

      case 'level': {
        // 파크 레벨 또는 건물 레벨
        const levelStr = value as string;
        if (levelStr.startsWith('park-')) {
          const requiredLevel = parseInt(levelStr.replace('park-', ''));
          const park = await this.prisma.park.findUnique({ where: { userId } });
          return (park?.level ?? 0) >= requiredLevel;
        }
        // 건물 레벨 (예: dna-lab-15)
        const parts = levelStr.split('-');
        const levelNum = parseInt(parts.pop() || '0');
        const buildingType = parts.join('-');
        const building = await this.prisma.building.findFirst({
          where: {
            park: { userId },
            typeId: { contains: buildingType },
            level: { gte: levelNum },
          },
        });
        return !!building;
      }

      case 'building': {
        const building = await this.prisma.building.findFirst({
          where: {
            park: { userId },
            typeId: value as string,
          },
        });
        return !!building;
      }

      case 'collection': {
        const collectionStr = value as string;
        if (collectionStr.startsWith('dinosaur-')) {
          const count = parseInt(collectionStr.replace('dinosaur-', ''));
          const dinosaurCount = await this.prisma.dinosaur.count({
            where: { park: { userId } },
          });
          return dinosaurCount >= count;
        }
        if (collectionStr.startsWith('carnivore-')) {
          const count = parseInt(collectionStr.replace('carnivore-', ''));
          const dinosaurs = await this.prisma.dinosaur.findMany({
            where: { park: { userId } },
          });
          // 실제로는 speciesId로 육식공룡 판별 필요
          return dinosaurs.length >= count;
        }
        return false;
      }

      case 'achievement': {
        // 업적 플래그 확인
        const flag = await this.prisma.storyFlag.findFirst({
          where: {
            userId,
            flagId: `achievement_${value}`,
          },
        });
        return !!flag;
      }

      case 'revenue': {
        // 수익 조건 (간소화)
        return true;
      }

      case 'season': {
        // 시즌 보상 확인
        const seasonId = (value as string).replace('-final', '');
        const seasonPass = await this.prisma.seasonPass.findFirst({
          where: {
            userId,
            seasonId,
            level: { gte: 50 }, // 시즌 패스 최대 레벨
          },
        });
        return !!seasonPass;
      }

      case 'event': {
        // 이벤트 참여 여부 (스토리 플래그로 체크)
        const eventFlag = await this.prisma.storyFlag.findFirst({
          where: {
            userId,
            flagId: `event_${value}`,
          },
        });
        return !!eventFlag;
      }

      default:
        return false;
    }
  }

  /**
   * 레벨에 필요한 경험치
   */
  private getExpForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > MAX_LEVEL) return Infinity;
    return LEVEL_EXP_TABLE[level - 1] || Infinity;
  }

  // ================================================================
  // 통계
  // ================================================================

  /**
   * 위인 통계
   */
  async getStats(userId: string) {
    const figures = await this.prisma.userGreatFigure.findMany({
      where: { userId },
    });

    const totalFigures = GREAT_FIGURE_DATA.length;
    const ownedCount = figures.length;
    const assignedCount = figures.filter((f: UserGreatFigure) => f.assignedBuildingId).length;
    const totalLevel = figures.reduce((sum: number, f: UserGreatFigure) => sum + f.level, 0);
    const maxLevelCount = figures.filter((f: UserGreatFigure) => f.level >= MAX_LEVEL).length;

    return {
      totalAvailable: totalFigures,
      owned: ownedCount,
      assigned: assignedCount,
      unassigned: ownedCount - assignedCount,
      collectionRate: Math.round((ownedCount / totalFigures) * 100),
      averageLevel: ownedCount > 0 ? Math.round((totalLevel / ownedCount) * 10) / 10 : 0,
      maxLevelFigures: maxLevelCount,
    };
  }
}
