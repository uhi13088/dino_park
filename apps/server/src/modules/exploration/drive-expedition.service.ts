import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getDinosaurById, getScoutMission } from '@dino-park/game-data';
import type { DriveMissionReward } from '@dino-park/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';

@Injectable()
export class DriveExpeditionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  private async pending(tx: Prisma.TransactionClient, userId: string) {
    const pending = await tx.driveRun.findFirst({
      where: { park: { userId }, status: 'REWARD' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, missionId: true, reward: true },
    });
    if (!pending) return { run: null };
    return {
      run: {
        id: pending.id,
        title: getScoutMission(pending.missionId)?.title ?? '기존 탐험 보상',
        reward: pending.reward as DriveMissionReward,
      },
    };
  }

  getState(userId: string) {
    return this.pending(this.prisma, userId);
  }

  claim(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const run = await tx.driveRun.findFirst({ where: { id, park: { userId } } });
      if (!run) throw new NotFoundException('탐험 기록을 찾을 수 없어요.');
      if (run.status === 'CLAIMED') return this.pending(tx, userId);
      if (run.status !== 'REWARD')
        throw new BadRequestException('완료 기록이 있는 기존 탐험만 보상을 수령할 수 있어요.');
      const reward = run.reward as DriveMissionReward;
      const now = new Date();
      if (reward.type === 'egg') {
        const species = getDinosaurById(reward.speciesId);
        if (!species) throw new BadRequestException('이 알의 종 정보를 확인하지 못했어요.');
        await tx.hatchingQueue.create({
          data: {
            userId,
            eggType: species.rarity,
            speciesId: species.id,
            sourceDriveId: run.id,
            readyToStart: true,
            completesAt: now,
          },
        });
      } else {
        const { parkId } = run;
        const { material, quality, amount } = reward;
        await tx.resourceInventory.upsert({
          where: { parkId_material_quality: { parkId, material, quality } },
          create: { parkId, material, quality, amount },
          update: { amount: { increment: amount } },
        });
      }
      await tx.driveRun.update({
        where: { id },
        data: { activeSlot: null, status: 'CLAIMED', claimedAt: now },
      });
      return this.pending(tx, userId);
    });
  }
}
