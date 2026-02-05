import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ALL_SEASONS,
  getCurrentSeason as getGameDataCurrentSeason,
  getSeasonById,
  getSeasonPassReward,
  getSeasonChapter,
} from '@dino-park/game-data';
import type { Season, SeasonPassReward, SeasonChapter } from '@dino-park/shared';

// 시즌 패스 레벨업 경험치 테이블
const LEVEL_EXP_TABLE: number[] = [];
for (let i = 0; i <= 50; i++) {
  // 레벨 1: 100, 레벨 2: 200, ..., 레벨 50: 5000
  LEVEL_EXP_TABLE[i] = i * 100;
}

@Injectable()
export class SeasonService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // 시즌 정보 조회
  // ================================================================

  /**
   * 현재 시즌 정보 조회
   */
  async getCurrentSeason(): Promise<Season | null> {
    const season = getGameDataCurrentSeason();
    return season || null;
  }

  /**
   * 모든 시즌 목록 조회
   */
  async getAllSeasons() {
    return ALL_SEASONS.map((season) => ({
      id: season.id,
      name: season.name,
      nameKo: season.nameKo,
      theme: season.theme,
      startDate: season.startDate,
      endDate: season.endDate,
      maxLevel: season.maxLevel,
      isActive: this.isSeasonActive(season),
    }));
  }

  /**
   * 특정 시즌 상세 정보 조회
   */
  async getSeasonDetails(seasonId: string) {
    const season = getSeasonById(seasonId);
    if (!season) {
      throw new NotFoundException('시즌을 찾을 수 없습니다.');
    }

    return {
      ...season,
      isActive: this.isSeasonActive(season),
      daysRemaining: this.getDaysRemaining(season),
    };
  }

  // ================================================================
  // 시즌 패스
  // ================================================================

  /**
   * 유저의 시즌 패스 조회
   */
  async getSeasonPass(userId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    let seasonPass = await this.prisma.seasonPass.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId: season.id,
        },
      },
    });

    // 시즌 패스가 없으면 생성
    if (!seasonPass) {
      seasonPass = await this.prisma.seasonPass.create({
        data: {
          userId,
          seasonId: season.id,
        },
      });
    }

    // 보상 목록과 함께 반환
    const rewards = season.passRewards.map((reward) => {
      const claimedRewards = (seasonPass!.claimedRewards as string[]) || [];
      return {
        level: reward.level,
        freeReward: reward.freeReward,
        premiumReward: reward.premiumReward,
        canClaimFree:
          seasonPass!.level >= reward.level && !claimedRewards.includes(`free-${reward.level}`),
        canClaimPremium:
          seasonPass!.isPremium &&
          seasonPass!.level >= reward.level &&
          !claimedRewards.includes(`premium-${reward.level}`),
        isFreeClaimed: claimedRewards.includes(`free-${reward.level}`),
        isPremiumClaimed: claimedRewards.includes(`premium-${reward.level}`),
      };
    });

    const nextLevelExp = this.getExpForNextLevel(seasonPass.level);

    return {
      ...seasonPass,
      seasonName: season.nameKo,
      maxLevel: season.maxLevel,
      nextLevelExp,
      expProgress: seasonPass.exp / nextLevelExp,
      rewards,
      daysRemaining: this.getDaysRemaining(season),
    };
  }

  /**
   * 시즌 경험치 추가
   */
  async addSeasonExp(userId: string, exp: number, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);
    let currentExp = seasonPass.exp + exp;
    let currentLevel = seasonPass.level;
    const levelUps: number[] = [];

    // 레벨업 처리
    while (currentLevel < season.maxLevel) {
      const expNeeded = this.getExpForNextLevel(currentLevel);
      if (currentExp >= expNeeded) {
        currentExp -= expNeeded;
        currentLevel++;
        levelUps.push(currentLevel);
      } else {
        break;
      }
    }

    // 최대 레벨 도달 시 초과 경험치 0으로
    if (currentLevel >= season.maxLevel) {
      currentExp = 0;
    }

    // 업데이트
    const updatedPass = await this.prisma.seasonPass.update({
      where: { id: seasonPass.id },
      data: {
        exp: currentExp,
        level: currentLevel,
      },
    });

    return {
      ...updatedPass,
      levelUps,
      expGained: exp,
      newUnlockedRewards: levelUps.length > 0 ? levelUps : null,
    };
  }

  /**
   * 무료 보상 수령
   */
  async claimFreeReward(userId: string, level: number, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);

    if (seasonPass.level < level) {
      throw new BadRequestException('해당 레벨에 도달하지 못했습니다.');
    }

    const rewardKey = `free-${level}`;
    const claimedRewards = (seasonPass.claimedRewards as string[]) || [];

    if (claimedRewards.includes(rewardKey)) {
      throw new BadRequestException('이미 수령한 보상입니다.');
    }

    const passReward = getSeasonPassReward(season.id, level);
    if (!passReward) {
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }

    // 보상 지급
    const grantedReward = await this.grantReward(userId, passReward.freeReward);

    // 수령 기록
    await this.prisma.seasonPass.update({
      where: { id: seasonPass.id },
      data: {
        claimedRewards: [...claimedRewards, rewardKey],
      },
    });

    return {
      success: true,
      level,
      rewardType: 'free',
      reward: grantedReward,
    };
  }

  /**
   * 프리미엄 보상 수령
   */
  async claimPremiumReward(userId: string, level: number, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);

    if (!seasonPass.isPremium) {
      throw new BadRequestException('프리미엄 패스가 필요합니다.');
    }

    if (seasonPass.level < level) {
      throw new BadRequestException('해당 레벨에 도달하지 못했습니다.');
    }

    const rewardKey = `premium-${level}`;
    const claimedRewards = (seasonPass.claimedRewards as string[]) || [];

    if (claimedRewards.includes(rewardKey)) {
      throw new BadRequestException('이미 수령한 보상입니다.');
    }

    const passReward = getSeasonPassReward(season.id, level);
    if (!passReward) {
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }

    // 보상 지급
    const grantedReward = await this.grantReward(userId, passReward.premiumReward);

    // 수령 기록
    await this.prisma.seasonPass.update({
      where: { id: seasonPass.id },
      data: {
        claimedRewards: [...claimedRewards, rewardKey],
      },
    });

    return {
      success: true,
      level,
      rewardType: 'premium',
      reward: grantedReward,
    };
  }

  /**
   * 모든 수령 가능한 보상 일괄 수령
   */
  async claimAllRewards(userId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);
    const claimedRewards = (seasonPass.claimedRewards as string[]) || [];
    const newClaims: string[] = [];
    const grantedRewards: Array<{ level: number; type: string; reward: any }> = [];

    for (let level = 1; level <= seasonPass.level; level++) {
      const passReward = getSeasonPassReward(season.id, level);
      if (!passReward) continue;

      // 무료 보상
      const freeKey = `free-${level}`;
      if (!claimedRewards.includes(freeKey)) {
        const reward = await this.grantReward(userId, passReward.freeReward);
        newClaims.push(freeKey);
        grantedRewards.push({ level, type: 'free', reward });
      }

      // 프리미엄 보상
      if (seasonPass.isPremium) {
        const premiumKey = `premium-${level}`;
        if (!claimedRewards.includes(premiumKey)) {
          const reward = await this.grantReward(userId, passReward.premiumReward);
          newClaims.push(premiumKey);
          grantedRewards.push({ level, type: 'premium', reward });
        }
      }
    }

    if (newClaims.length > 0) {
      await this.prisma.seasonPass.update({
        where: { id: seasonPass.id },
        data: {
          claimedRewards: [...claimedRewards, ...newClaims],
        },
      });
    }

    return {
      success: true,
      claimedCount: newClaims.length,
      rewards: grantedRewards,
    };
  }

  /**
   * 프리미엄 패스 구매
   */
  async upgradeToPremium(userId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);

    if (seasonPass.isPremium) {
      throw new BadRequestException('이미 프리미엄 패스를 보유하고 있습니다.');
    }

    // 프리미엄 구매 처리 (실제로는 ShopService와 연동)
    const updatedPass = await this.prisma.seasonPass.update({
      where: { id: seasonPass.id },
      data: { isPremium: true },
    });

    return {
      success: true,
      message: '프리미엄 패스가 활성화되었습니다.',
      seasonPass: updatedPass,
    };
  }

  // ================================================================
  // 시즌 챕터
  // ================================================================

  /**
   * 시즌 챕터 목록 조회
   */
  async getSeasonChapters(userId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);
    const completedChapters = await this.getCompletedSeasonChapters(userId, season.id);

    return season.chapters.map((chapter, _index) => {
      const isUnlocked = this.isChapterUnlocked(chapter, seasonPass.level, completedChapters);
      const isCompleted = completedChapters.includes(chapter.id);

      return {
        id: chapter.id,
        order: chapter.order,
        title: chapter.title,
        titleKo: chapter.titleKo,
        isUnlocked,
        isCompleted,
        unlockCondition: chapter.unlockCondition,
        rewards: chapter.rewards,
        sceneCount: chapter.scenes.length,
      };
    });
  }

  /**
   * 시즌 챕터 상세 조회
   */
  async getSeasonChapterDetail(userId: string, chapterId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const chapter = getSeasonChapter(season.id, chapterId);
    if (!chapter) {
      throw new NotFoundException('챕터를 찾을 수 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);
    const completedChapters = await this.getCompletedSeasonChapters(userId, season.id);

    const isUnlocked = this.isChapterUnlocked(chapter, seasonPass.level, completedChapters);
    if (!isUnlocked) {
      throw new BadRequestException('챕터가 잠겨있습니다.');
    }

    return {
      ...chapter,
      isCompleted: completedChapters.includes(chapter.id),
    };
  }

  /**
   * 시즌 챕터 완료
   */
  async completeSeasonChapter(userId: string, chapterId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const chapter = getSeasonChapter(season.id, chapterId);
    if (!chapter) {
      throw new NotFoundException('챕터를 찾을 수 없습니다.');
    }

    // 스토리 플래그로 완료 기록
    const flagId = `season-chapter-${season.id}-${chapterId}`;
    const existingFlag = await this.prisma.storyFlag.findUnique({
      where: { userId_flagId: { userId, flagId } },
    });

    if (existingFlag) {
      throw new BadRequestException('이미 완료한 챕터입니다.');
    }

    // 보상 지급
    const grantedRewards: any[] = [];
    for (const reward of chapter.rewards) {
      const granted = await this.grantChapterReward(userId, reward);
      grantedRewards.push(granted);
    }

    // 완료 기록
    await this.prisma.storyFlag.create({
      data: {
        userId,
        flagId,
        value: JSON.stringify({ completedAt: new Date() }),
      },
    });

    return {
      success: true,
      chapterId,
      chapterTitle: chapter.titleKo,
      rewards: grantedRewards,
    };
  }

  // ================================================================
  // 시즌 이벤트
  // ================================================================

  /**
   * 현재 활성화된 시즌 이벤트 조회
   */
  async getActiveEvents(seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      return [];
    }

    const now = new Date();
    const seasonStart = new Date(season.startDate);
    const daysSinceStart = Math.floor(
      (now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    return season.specialEvents
      .filter((event) => {
        const eventEnd = event.startDay + event.durationDays;
        return daysSinceStart >= event.startDay && daysSinceStart < eventEnd;
      })
      .map((event) => ({
        ...event,
        daysRemaining: event.startDay + event.durationDays - daysSinceStart,
      }));
  }

  // ================================================================
  // 시즌 통계
  // ================================================================

  /**
   * 유저의 시즌 통계 조회
   */
  async getSeasonStats(userId: string, seasonId?: string) {
    const season = seasonId ? getSeasonById(seasonId) : getGameDataCurrentSeason();
    if (!season) {
      throw new NotFoundException('활성화된 시즌이 없습니다.');
    }

    const seasonPass = await this.getOrCreateSeasonPass(userId, season.id);
    const completedChapters = await this.getCompletedSeasonChapters(userId, season.id);
    const claimedRewards = (seasonPass.claimedRewards as string[]) || [];

    const freeRewardsClaimed = claimedRewards.filter((r) => r.startsWith('free-')).length;
    const premiumRewardsClaimed = claimedRewards.filter((r) => r.startsWith('premium-')).length;

    return {
      seasonId: season.id,
      seasonName: season.nameKo,
      level: seasonPass.level,
      maxLevel: season.maxLevel,
      exp: seasonPass.exp,
      nextLevelExp: this.getExpForNextLevel(seasonPass.level),
      isPremium: seasonPass.isPremium,
      chaptersCompleted: completedChapters.length,
      totalChapters: season.chapters.length,
      freeRewardsClaimed,
      premiumRewardsClaimed,
      totalFreeRewards: season.passRewards.length,
      totalPremiumRewards: season.passRewards.length,
      daysRemaining: this.getDaysRemaining(season),
    };
  }

  // ================================================================
  // 레거시 API (하위 호환)
  // ================================================================

  /**
   * 보상 수령 (레거시)
   */
  async claimReward(userId: string, level: number) {
    return this.claimFreeReward(userId, level);
  }

  // ================================================================
  // 헬퍼 메서드
  // ================================================================

  /**
   * 시즌 패스 조회 또는 생성
   */
  private async getOrCreateSeasonPass(userId: string, seasonId: string) {
    let seasonPass = await this.prisma.seasonPass.findUnique({
      where: { userId_seasonId: { userId, seasonId } },
    });

    if (!seasonPass) {
      seasonPass = await this.prisma.seasonPass.create({
        data: { userId, seasonId },
      });
    }

    return seasonPass;
  }

  /**
   * 시즌 활성화 여부
   */
  private isSeasonActive(season: Season): boolean {
    const now = new Date();
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return now >= start && now <= end;
  }

  /**
   * 시즌 남은 일수
   */
  private getDaysRemaining(season: Season): number {
    const now = new Date();
    const end = new Date(season.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * 다음 레벨 필요 경험치
   */
  private getExpForNextLevel(currentLevel: number): number {
    if (currentLevel >= 50) return 0;
    return LEVEL_EXP_TABLE[currentLevel + 1] || (currentLevel + 1) * 100;
  }

  /**
   * 보상 지급
   */
  private async grantReward(userId: string, reward: SeasonPassReward['freeReward']) {
    const { type, quantity, id } = reward as { type: string; quantity: number; id?: string };

    switch (type) {
      case 'gold':
        await this.prisma.currency.update({
          where: { userId },
          data: { gold: { increment: quantity } },
        });
        break;

      case 'diamond':
        await this.prisma.currency.update({
          where: { userId },
          data: { diamond: { increment: quantity } },
        });
        break;

      case 'dna':
        await this.prisma.currency.update({
          where: { userId },
          data: { dna: { increment: quantity } },
        });
        break;

      case 'dinosaur':
      case 'greatFigure':
      case 'skin':
      case 'building':
      case 'item':
      case 'title':
        // TODO: 각 서비스 연동
        break;
    }

    return { type, quantity, id };
  }

  /**
   * 챕터 보상 지급
   */
  private async grantChapterReward(
    userId: string,
    reward: { type: string; amount?: number; id?: string },
  ) {
    const { type, amount = 0, id } = reward;

    switch (type) {
      case 'seasonPoint':
        await this.addSeasonExp(userId, amount);
        break;

      case 'gold':
        await this.prisma.currency.update({
          where: { userId },
          data: { gold: { increment: amount } },
        });
        break;

      case 'diamond':
        await this.prisma.currency.update({
          where: { userId },
          data: { diamond: { increment: amount } },
        });
        break;

      case 'dna':
        await this.prisma.currency.update({
          where: { userId },
          data: { dna: { increment: amount } },
        });
        break;

      case 'dinosaur':
      case 'greatFigure':
      case 'item':
        // TODO: 각 서비스 연동
        break;
    }

    return { type, amount, id };
  }

  /**
   * 완료된 시즌 챕터 목록
   */
  private async getCompletedSeasonChapters(userId: string, seasonId: string): Promise<string[]> {
    const flags = await this.prisma.storyFlag.findMany({
      where: {
        userId,
        flagId: { startsWith: `season-chapter-${seasonId}-` },
      },
      select: { flagId: true },
    });

    return flags.map((f: { flagId: string }) =>
      f.flagId.replace(`season-chapter-${seasonId}-`, ''),
    );
  }

  /**
   * 챕터 해금 여부 확인
   */
  private isChapterUnlocked(
    chapter: SeasonChapter,
    passLevel: number,
    completedChapters: string[],
  ): boolean {
    const { type, value } = chapter.unlockCondition;

    switch (type) {
      case 'seasonStart':
        return true;

      case 'previousChapter':
        return completedChapters.includes(value as string);

      case 'passLevel':
        return passLevel >= (value as number);

      default:
        return false;
    }
  }
}
