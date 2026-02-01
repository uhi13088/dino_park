import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class EconomyService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.recordTransaction(
      userId,
      TransactionType.EARN,
      'dna',
      amount,
      reason,
      currency.dna,
    );

    return currency;
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
    const minutesPassed = Math.floor(
      (now.getTime() - lastRecharge.getTime()) / (1000 * 60),
    );

    // 10분마다 1 에너지 회복
    const energyToAdd = Math.floor(minutesPassed / 10);
    const maxEnergy = 30;

    if (energyToAdd > 0 && currency.explorationEnergy < maxEnergy) {
      const newEnergy = Math.min(
        maxEnergy,
        currency.explorationEnergy + energyToAdd,
      );

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
}
