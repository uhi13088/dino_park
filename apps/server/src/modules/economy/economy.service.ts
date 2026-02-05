import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, Prisma } from '@prisma/client';
import {
  MAX_EXPLORATION_ENERGY,
  ENERGY_RECHARGE_MINUTES,
  MAX_OFFLINE_HOURS,
  OFFLINE_REVENUE_RATE,
} from '@dino-park/shared';
import { RARITY_BASE_STATS } from '@dino-park/game-data';

@Injectable()
export class EconomyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 재화 현황 조회
   */
  async getCurrency(userId: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency) {
      throw new NotFoundException('재화 정보를 찾을 수 없습니다.');
    }

    // 에너지 회복 계산
    const now = new Date();
    const lastRecharge = currency.energyLastRechargedAt;
    const minutesPassed = Math.floor((now.getTime() - lastRecharge.getTime()) / (1000 * 60));
    const energyToAdd = Math.floor(minutesPassed / ENERGY_RECHARGE_MINUTES);
    const currentEnergy = Math.min(
      MAX_EXPLORATION_ENERGY,
      currency.explorationEnergy + energyToAdd,
    );

    // 다음 에너지 회복까지 남은 시간
    const minutesUntilNextEnergy =
      currentEnergy >= MAX_EXPLORATION_ENERGY
        ? 0
        : ENERGY_RECHARGE_MINUTES - (minutesPassed % ENERGY_RECHARGE_MINUTES);

    return {
      gold: currency.gold,
      diamond: currency.diamond,
      dna: currency.dna,
      explorationEnergy: currentEnergy,
      maxExplorationEnergy: MAX_EXPLORATION_ENERGY,
      minutesUntilNextEnergy,
      lastUpdated: currency.updatedAt,
    };
  }

  /**
   * 오프라인 수익 계산 및 수령
   */
  async collectOfflineRevenue(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        park: {
          include: {
            dinosaurs: {
              where: { isInPark: true },
            },
            buildings: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!user || !user.park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    const now = new Date();
    const lastLogin = user.lastLoginAt;
    const hoursPassed = Math.min(
      MAX_OFFLINE_HOURS,
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60),
    );

    // 최소 1분 이상 지나야 수익 발생
    if (hoursPassed < 1 / 60) {
      return {
        offlineHours: 0,
        baseRevenue: 0,
        offlineRate: OFFLINE_REVENUE_RATE,
        totalRevenue: 0,
        collected: false,
        message: '오프라인 수익이 아직 쌓이지 않았습니다.',
      };
    }

    // 시간당 수익 계산
    let hourlyRevenue = 0;
    let totalMaintenanceCost = 0;

    for (const dino of user.park.dinosaurs) {
      // game-data에서 희귀도별 baseRevenue 참조 (speciesId에서 rarity 추정, 기본 common)
      const rarityKey = 'common' as keyof typeof RARITY_BASE_STATS;
      const baseRevenue = RARITY_BASE_STATS[rarityKey].baseRevenue;
      const maintenanceCost = RARITY_BASE_STATS[rarityKey].maintenanceCost;
      const levelMultiplier = 1 + (dino.level - 1) * 0.1;
      const happinessMultiplier = 0.5 + (dino.happiness / 100) * 0.5;

      hourlyRevenue += Math.floor(baseRevenue * levelMultiplier * happinessMultiplier);
      totalMaintenanceCost += maintenanceCost;
    }

    // 건물 보너스 (최대 50% 캡)
    const buildingBonusRate = Math.min(0.5, user.park.buildings.length * 0.05);
    hourlyRevenue = Math.floor(hourlyRevenue * (1 + buildingBonusRate));

    // 순수익
    const netHourlyRevenue = hourlyRevenue - totalMaintenanceCost;

    // 오프라인 수익 (50% 적용)
    const offlineRevenue = Math.floor(netHourlyRevenue * hoursPassed * OFFLINE_REVENUE_RATE);

    if (offlineRevenue <= 0) {
      return {
        offlineHours: Math.floor(hoursPassed * 10) / 10,
        baseRevenue: netHourlyRevenue,
        offlineRate: OFFLINE_REVENUE_RATE,
        totalRevenue: 0,
        collected: false,
        message: '수령할 수익이 없습니다.',
      };
    }

    // 골드 지급
    await this.addGold(userId, offlineRevenue, `오프라인 수익 (${Math.floor(hoursPassed)}시간)`);

    // 마지막 로그인 시간 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: now },
    });

    return {
      offlineHours: Math.floor(hoursPassed * 10) / 10,
      baseRevenue: netHourlyRevenue,
      offlineRate: OFFLINE_REVENUE_RATE,
      totalRevenue: offlineRevenue,
      collected: true,
      dinosaurCount: user.park.dinosaurs.length,
      buildingBonus: Math.floor(buildingBonusRate * 100),
    };
  }

  /**
   * 골드 추가
   */
  async addGold(userId: string, amount: number, reason: string) {
    const currency = await this.prisma.currency.update({
      where: { userId },
      data: { gold: { increment: amount } },
    });

    await this.recordTransaction(
      userId,
      TransactionType.EARN,
      'gold',
      amount,
      reason,
      currency.gold,
    );

    return currency;
  }

  /**
   * 골드 차감 (atomic operation으로 race condition 방지)
   */
  async spendGold(userId: string, amount: number, reason: string) {
    return this.spendCurrency(userId, 'gold', amount, reason);
  }

  /**
   * 다이아 추가
   */
  async addDiamond(userId: string, amount: number, reason: string) {
    const currency = await this.prisma.currency.update({
      where: { userId },
      data: { diamond: { increment: amount } },
    });

    await this.recordTransaction(
      userId,
      TransactionType.EARN,
      'diamond',
      amount,
      reason,
      currency.diamond,
    );

    return currency;
  }

  /**
   * 다이아 차감 (atomic operation으로 race condition 방지)
   */
  async spendDiamond(userId: string, amount: number, reason: string) {
    return this.spendCurrency(userId, 'diamond', amount, reason);
  }

  /**
   * DNA 추가
   */
  async addDna(userId: string, amount: number, reason: string) {
    const currency = await this.prisma.currency.update({
      where: { userId },
      data: { dna: { increment: amount } },
    });

    await this.recordTransaction(userId, TransactionType.EARN, 'dna', amount, reason, currency.dna);

    return currency;
  }

  /**
   * DNA 차감 (atomic operation으로 race condition 방지)
   */
  async spendDna(userId: string, amount: number, reason: string) {
    return this.spendCurrency(userId, 'dna', amount, reason);
  }

  /**
   * 통합 재화 차감 (atomic transaction으로 race condition 방지)
   */
  private async spendCurrency(
    userId: string,
    currencyType: 'gold' | 'diamond' | 'dna',
    amount: number,
    reason: string,
  ) {
    const currencyLabels = { gold: '골드', diamond: '다이아', dna: 'DNA' } as const;

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const currency = await tx.currency.findUnique({
        where: { userId },
      });

      if (!currency || currency[currencyType] < amount) {
        throw new BadRequestException(`${currencyLabels[currencyType]}가 부족합니다.`);
      }

      const updated = await tx.currency.update({
        where: { userId },
        data: { [currencyType]: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.SPEND,
          currencyType,
          amount: -amount,
          reason,
          balanceAfter: updated[currencyType],
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * 에너지 사용
   */
  async useEnergy(userId: string, amount: number) {
    // 먼저 에너지 회복 처리
    await this.rechargeEnergy(userId);

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.explorationEnergy < amount) {
      throw new BadRequestException('에너지가 부족합니다.');
    }

    return this.prisma.currency.update({
      where: { userId },
      data: { explorationEnergy: { decrement: amount } },
    });
  }

  /**
   * 에너지 회복 체크 및 처리
   */
  async rechargeEnergy(userId: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency) return null;

    const now = new Date();
    const lastRecharge = currency.energyLastRechargedAt;
    const minutesPassed = Math.floor((now.getTime() - lastRecharge.getTime()) / (1000 * 60));

    const energyToAdd = Math.floor(minutesPassed / ENERGY_RECHARGE_MINUTES);

    if (energyToAdd > 0 && currency.explorationEnergy < MAX_EXPLORATION_ENERGY) {
      const newEnergy = Math.min(MAX_EXPLORATION_ENERGY, currency.explorationEnergy + energyToAdd);

      return this.prisma.currency.update({
        where: { userId },
        data: {
          explorationEnergy: newEnergy,
          energyLastRechargedAt: now,
        },
      });
    }

    return currency;
  }

  /**
   * 에너지 즉시 충전 (다이아 사용)
   */
  async refillEnergy(userId: string) {
    const ENERGY_REFILL_DIAMOND_COST = 30;

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.diamond < ENERGY_REFILL_DIAMOND_COST) {
      throw new BadRequestException('다이아가 부족합니다.');
    }

    const updated = await this.prisma.currency.update({
      where: { userId },
      data: {
        diamond: { decrement: ENERGY_REFILL_DIAMOND_COST },
        explorationEnergy: MAX_EXPLORATION_ENERGY,
        energyLastRechargedAt: new Date(),
      },
    });

    await this.recordTransaction(
      userId,
      TransactionType.SPEND,
      'diamond',
      -ENERGY_REFILL_DIAMOND_COST,
      '에너지 충전',
      updated.diamond,
    );

    return {
      ...updated,
      diamondSpent: ENERGY_REFILL_DIAMOND_COST,
      energyRefilled: MAX_EXPLORATION_ENERGY,
    };
  }

  /**
   * 거래 내역 조회
   */
  async getTransactionHistory(
    userId: string,
    options: {
      currencyType?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { currencyType, limit = 20, offset = 0 } = options;

    const where: { userId: string; currencyType?: string } = { userId };
    if (currencyType) {
      where.currencyType = currencyType;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
    };
  }

  /**
   * 거래 기록
   */
  private async recordTransaction(
    userId: string,
    type: TransactionType,
    currencyType: string,
    amount: number,
    reason: string,
    balanceAfter: number,
  ) {
    return this.prisma.transaction.create({
      data: {
        userId,
        type,
        currencyType,
        amount,
        reason,
        balanceAfter,
      },
    });
  }
}
