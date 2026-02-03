import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import {
  MAX_EXPLORATION_ENERGY,
  ENERGY_RECHARGE_MINUTES,
  MAX_OFFLINE_HOURS,
  OFFLINE_REVENUE_RATE,
  RARITY_REVENUE_MULTIPLIER,
} from '@dino-park/shared';

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
      // TODO: game-data에서 baseRevenue 가져오기
      const baseRevenue = 100;
      const levelMultiplier = 1 + (dino.level - 1) * 0.1;
      const happinessMultiplier = 0.5 + (dino.happiness / 100) * 0.5;

      hourlyRevenue += Math.floor(baseRevenue * levelMultiplier * happinessMultiplier);
      totalMaintenanceCost += Math.floor(baseRevenue * 0.1);
    }

    // 건물 보너스
    const buildingBonus = user.park.buildings.length * 0.05;
    hourlyRevenue = Math.floor(hourlyRevenue * (1 + buildingBonus));

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
      buildingBonus: Math.floor(buildingBonus * 100),
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
   * 골드 차감
   */
  async spendGold(userId: string, amount: number, reason: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.gold < amount) {
      throw new BadRequestException('골드가 부족합니다.');
    }

    const updated = await this.prisma.currency.update({
      where: { userId },
      data: { gold: { decrement: amount } },
    });

    await this.recordTransaction(
      userId,
      TransactionType.SPEND,
      'gold',
      -amount,
      reason,
      updated.gold,
    );

    return updated;
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
   * 다이아 차감
   */
  async spendDiamond(userId: string, amount: number, reason: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.diamond < amount) {
      throw new BadRequestException('다이아가 부족합니다.');
    }

    const updated = await this.prisma.currency.update({
      where: { userId },
      data: { diamond: { decrement: amount } },
    });

    await this.recordTransaction(
      userId,
      TransactionType.SPEND,
      'diamond',
      -amount,
      reason,
      updated.diamond,
    );

    return updated;
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
   * DNA 차감
   */
  async spendDna(userId: string, amount: number, reason: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.dna < amount) {
      throw new BadRequestException('DNA가 부족합니다.');
    }

    const updated = await this.prisma.currency.update({
      where: { userId },
      data: { dna: { decrement: amount } },
    });

    await this.recordTransaction(
      userId,
      TransactionType.SPEND,
      'dna',
      -amount,
      reason,
      updated.dna,
    );

    return updated;
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
    const diamondCost = 30;

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.diamond < diamondCost) {
      throw new BadRequestException('다이아가 부족합니다.');
    }

    const updated = await this.prisma.currency.update({
      where: { userId },
      data: {
        diamond: { decrement: diamondCost },
        explorationEnergy: MAX_EXPLORATION_ENERGY,
        energyLastRechargedAt: new Date(),
      },
    });

    await this.recordTransaction(
      userId,
      TransactionType.SPEND,
      'diamond',
      -diamondCost,
      '에너지 충전',
      updated.diamond,
    );

    return {
      ...updated,
      diamondSpent: diamondCost,
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

    const where: any = { userId };
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
