import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Exploration, ExplorationStatus } from '@prisma/client';
import { ENERGY_PER_EXPLORATION, RARITY_DROP_RATES } from '@dino-park/shared';

// 탐험 지역 정보 (나중에 game-data로 이동)
const EXPLORATION_REGIONS = {
  grassland: {
    id: 'grassland',
    name: '초원 지대',
    duration: 5 * 60, // 5분 (초)
    unlockLevel: 1,
    possibleRewards: ['gold', 'egg_common', 'dna'],
  },
  forest: {
    id: 'forest',
    name: '숲 지대',
    duration: 15 * 60, // 15분
    unlockLevel: 5,
    possibleRewards: ['gold', 'egg_common', 'egg_uncommon', 'dna'],
  },
  mountain: {
    id: 'mountain',
    name: '산악 지대',
    duration: 30 * 60, // 30분
    unlockLevel: 10,
    possibleRewards: ['gold', 'egg_uncommon', 'egg_rare', 'dna'],
  },
  desert: {
    id: 'desert',
    name: '사막 지대',
    duration: 60 * 60, // 1시간
    unlockLevel: 15,
    possibleRewards: ['gold', 'egg_rare', 'egg_epic', 'dna'],
  },
  volcano: {
    id: 'volcano',
    name: '화산 지대',
    duration: 120 * 60, // 2시간
    unlockLevel: 20,
    possibleRewards: ['gold', 'egg_epic', 'egg_legendary', 'dna'],
  },
};

@Injectable()
export class ExplorationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 탐험 지역 목록 조회
   */
  async getRegions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    return Object.values(EXPLORATION_REGIONS).map((region) => ({
      ...region,
      isUnlocked: user.level >= region.unlockLevel,
      durationMinutes: Math.floor(region.duration / 60),
    }));
  }

  /**
   * 탐험 목록 조회
   */
  async getByUserId(userId: string) {
    const explorations = await this.prisma.exploration.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return explorations.map((exp: Exploration) => this.enrichExplorationData(exp));
  }

  /**
   * 진행 중인 탐험 조회
   */
  async getInProgress(userId: string) {
    const explorations = await this.prisma.exploration.findMany({
      where: {
        userId,
        status: ExplorationStatus.IN_PROGRESS,
      },
      orderBy: { startedAt: 'desc' },
    });

    return explorations.map((exp: Exploration) => this.enrichExplorationData(exp));
  }

  /**
   * 탐험 시작
   */
  async start(userId: string, regionId: string) {
    const region = EXPLORATION_REGIONS[regionId as keyof typeof EXPLORATION_REGIONS];

    if (!region) {
      throw new BadRequestException('존재하지 않는 탐험 지역입니다.');
    }

    // 유저 레벨 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    });

    if (!user || user.level < region.unlockLevel) {
      throw new BadRequestException(`이 지역은 레벨 ${region.unlockLevel} 이상에서 해금됩니다.`);
    }

    // 에너지 확인
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.explorationEnergy < ENERGY_PER_EXPLORATION) {
      throw new BadRequestException('탐험 에너지가 부족합니다.');
    }

    // 에너지 차감 및 탐험 생성
    const [, exploration] = await this.prisma.$transaction([
      this.prisma.currency.update({
        where: { userId },
        data: { explorationEnergy: { decrement: ENERGY_PER_EXPLORATION } },
      }),
      this.prisma.exploration.create({
        data: {
          userId,
          regionId,
          status: ExplorationStatus.IN_PROGRESS,
        },
      }),
    ]);

    const completesAt = new Date(Date.now() + region.duration * 1000);

    return {
      ...exploration,
      regionName: region.name,
      duration: region.duration,
      completesAt,
      energyUsed: ENERGY_PER_EXPLORATION,
    };
  }

  /**
   * 탐험 완료 확인 및 보상 생성
   */
  async checkCompletion(explorationId: string, userId: string) {
    const exploration = await this.prisma.exploration.findUnique({
      where: { id: explorationId },
    });

    if (!exploration || exploration.userId !== userId) {
      throw new NotFoundException('탐험을 찾을 수 없습니다.');
    }

    if (exploration.status === ExplorationStatus.CLAIMED) {
      throw new BadRequestException('이미 보상을 수령했습니다.');
    }

    if (exploration.status === ExplorationStatus.COMPLETED) {
      return this.enrichExplorationData(exploration);
    }

    const region = EXPLORATION_REGIONS[exploration.regionId as keyof typeof EXPLORATION_REGIONS];
    if (!region) {
      throw new BadRequestException('탐험 지역 정보를 찾을 수 없습니다.');
    }

    const now = new Date();
    const startedAt = new Date(exploration.startedAt);
    const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000;

    if (elapsedSeconds < region.duration) {
      const remainingSeconds = Math.ceil(region.duration - elapsedSeconds);
      return {
        ...this.enrichExplorationData(exploration),
        completed: false,
        remainingSeconds,
      };
    }

    // 탐험 완료 - 보상 생성
    const rewards = this.generateRewards(region);

    const updated = await this.prisma.exploration.update({
      where: { id: explorationId },
      data: {
        status: ExplorationStatus.COMPLETED,
        completedAt: now,
        rewards,
      },
    });

    return {
      ...this.enrichExplorationData(updated),
      completed: true,
      rewards,
    };
  }

  /**
   * 탐험 즉시 완료 (다이아 사용)
   */
  async instantComplete(explorationId: string, userId: string) {
    const exploration = await this.prisma.exploration.findUnique({
      where: { id: explorationId },
    });

    if (!exploration || exploration.userId !== userId) {
      throw new NotFoundException('탐험을 찾을 수 없습니다.');
    }

    if (exploration.status !== ExplorationStatus.IN_PROGRESS) {
      throw new BadRequestException('진행 중인 탐험이 아닙니다.');
    }

    // 다이아 비용 계산 (남은 시간에 비례)
    const region = EXPLORATION_REGIONS[exploration.regionId as keyof typeof EXPLORATION_REGIONS];
    const startedAt = new Date(exploration.startedAt);
    const elapsedSeconds = (Date.now() - startedAt.getTime()) / 1000;
    const remainingSeconds = Math.max(0, region.duration - elapsedSeconds);
    const diamondCost = Math.max(1, Math.ceil(remainingSeconds / 60)); // 분당 1다이아

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.diamond < diamondCost) {
      throw new BadRequestException('다이아가 부족합니다.');
    }

    const rewards = this.generateRewards(region);

    const [, updated] = await this.prisma.$transaction([
      this.prisma.currency.update({
        where: { userId },
        data: { diamond: { decrement: diamondCost } },
      }),
      this.prisma.exploration.update({
        where: { id: explorationId },
        data: {
          status: ExplorationStatus.COMPLETED,
          completedAt: new Date(),
          rewards,
        },
      }),
    ]);

    return {
      ...this.enrichExplorationData(updated),
      diamondSpent: diamondCost,
      rewards,
    };
  }

  /**
   * 보상 수령
   */
  async claim(explorationId: string, userId: string) {
    const exploration = await this.prisma.exploration.findUnique({
      where: { id: explorationId },
    });

    if (!exploration || exploration.userId !== userId) {
      throw new NotFoundException('탐험을 찾을 수 없습니다.');
    }

    if (exploration.status !== ExplorationStatus.COMPLETED) {
      throw new BadRequestException('아직 탐험이 완료되지 않았습니다.');
    }

    const rewards = exploration.rewards as any;

    // 보상 지급
    const updates: any[] = [];

    if (rewards.gold) {
      updates.push(
        this.prisma.currency.update({
          where: { userId },
          data: { gold: { increment: rewards.gold } },
        }),
      );
    }

    if (rewards.dna) {
      updates.push(
        this.prisma.currency.update({
          where: { userId },
          data: { dna: { increment: rewards.dna } },
        }),
      );
    }

    // 알 보상은 부화 큐에 추가
    if (rewards.egg) {
      updates.push(
        this.prisma.hatchingQueue.create({
          data: {
            userId,
            eggType: rewards.egg.type,
            completesAt: new Date(Date.now() + rewards.egg.hatchTime * 1000),
          },
        }),
      );
    }

    // 탐험 상태 업데이트
    updates.push(
      this.prisma.exploration.update({
        where: { id: explorationId },
        data: { status: ExplorationStatus.CLAIMED },
      }),
    );

    await this.prisma.$transaction(updates);

    return {
      claimed: true,
      rewards,
    };
  }

  /**
   * 부화 대기열 조회
   */
  async getHatchingQueue(userId: string) {
    const hatchingQueue = await this.prisma.hatchingQueue.findMany({
      where: {
        userId,
        completed: false,
      },
      orderBy: { startedAt: 'asc' },
    });

    return hatchingQueue.map((item) => {
      const startedAt = new Date(item.startedAt);
      const completesAt = new Date(item.completesAt);
      const now = new Date();
      const remainingSeconds = Math.max(
        0,
        Math.ceil((completesAt.getTime() - now.getTime()) / 1000),
      );

      return {
        ...item,
        remainingSeconds,
        isComplete: remainingSeconds === 0,
      };
    });
  }

  /**
   * 보상 생성
   */
  private generateRewards(region: typeof EXPLORATION_REGIONS.grassland) {
    const rewards: any = {};

    // 골드 보상 (항상)
    const baseGold = 100 * (Object.keys(EXPLORATION_REGIONS).indexOf(region.id) + 1);
    rewards.gold = Math.floor(baseGold * (0.8 + Math.random() * 0.4));

    // DNA 보상 (50% 확률)
    if (Math.random() < 0.5) {
      rewards.dna = Math.floor(5 * (Object.keys(EXPLORATION_REGIONS).indexOf(region.id) + 1));
    }

    // 알 보상 (등급별 확률)
    const eggRoll = Math.random();
    let eggType: string | null = null;
    let hatchTime = 60; // 기본 1분

    if (region.possibleRewards.includes('egg_legendary') && eggRoll < RARITY_DROP_RATES.legendary) {
      eggType = 'legendary';
      hatchTime = 7200; // 2시간
    } else if (region.possibleRewards.includes('egg_epic') && eggRoll < RARITY_DROP_RATES.epic) {
      eggType = 'epic';
      hatchTime = 3600; // 1시간
    } else if (region.possibleRewards.includes('egg_rare') && eggRoll < RARITY_DROP_RATES.rare) {
      eggType = 'rare';
      hatchTime = 1800; // 30분
    } else if (
      region.possibleRewards.includes('egg_uncommon') &&
      eggRoll < RARITY_DROP_RATES.uncommon
    ) {
      eggType = 'uncommon';
      hatchTime = 600; // 10분
    } else if (
      region.possibleRewards.includes('egg_common') &&
      eggRoll < RARITY_DROP_RATES.common
    ) {
      eggType = 'common';
      hatchTime = 300; // 5분
    }

    if (eggType) {
      rewards.egg = { type: eggType, hatchTime };
    }

    return rewards;
  }

  /**
   * 탐험 데이터 보강
   */
  private enrichExplorationData(exploration: any) {
    const region = EXPLORATION_REGIONS[exploration.regionId as keyof typeof EXPLORATION_REGIONS];

    if (!region) {
      return exploration;
    }

    const startedAt = new Date(exploration.startedAt);
    const completesAt = new Date(startedAt.getTime() + region.duration * 1000);
    const now = new Date();
    const remainingSeconds = Math.max(0, Math.ceil((completesAt.getTime() - now.getTime()) / 1000));

    return {
      ...exploration,
      regionName: region.name,
      duration: region.duration,
      completesAt,
      remainingSeconds,
      isComplete: exploration.status !== ExplorationStatus.IN_PROGRESS || remainingSeconds === 0,
    };
  }
}
