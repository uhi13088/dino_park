import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TransactionType } from '@prisma/client';
import {
  MAX_EXPLORATION_ENERGY,
  ENERGY_RECHARGE_MINUTES,
  MAX_OFFLINE_HOURS,
  OFFLINE_REVENUE_RATE,
} from '@dino-park/shared';
import { ParkOperationsService } from '../park/park-operations.service';

@Injectable()
export class EconomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

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
    return this.prisma.$transaction(async (tx) => {
      const settled = await this.operations.settleInTransaction(tx, userId);
      return {
        offlineHours: Math.min(MAX_OFFLINE_HOURS, Math.max(0, settled.elapsedHours)),
        baseRevenue: 0,
        offlineRate: OFFLINE_REVENUE_RATE,
        totalRevenue: Math.max(0, settled.gross - settled.maintenance),
        collected: settled.gross > 0,
        grossAdmissionGold: settled.gross,
        maintenanceGold: settled.maintenance,
      };
    });
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

    const where: Prisma.TransactionWhereInput = { userId };
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
