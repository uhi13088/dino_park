import { BadRequestException } from '@nestjs/common';
import { FIRST_EXPEDITION, getDinosaurById } from '@dino-park/game-data';
import type { ScoutReward } from '@dino-park/shared';
import type { Prisma, ScoutAssignment } from '@prisma/client';
import { FIRST_EXPEDITION_RECEIPT_STEPS } from './expedition-state';

export async function grantScoutExpeditionReward(
  tx: Prisma.TransactionClient,
  userId: string,
  parkId: string,
  assignment: Pick<ScoutAssignment, 'missionId' | 'legacyMissionId' | 'startedAt' | 'completesAt'>,
  reward: ScoutReward,
  now: Date,
) {
  if (reward.type === 'egg' && assignment.legacyMissionId === FIRST_EXPEDITION.id) {
    const previous = await tx.exploration.findUnique({
      where: { userId_missionId: { userId, missionId: FIRST_EXPEDITION.id } },
      select: { id: true, status: true },
    });
    if (previous && previous.status !== 'IN_PROGRESS')
      throw new BadRequestException('첫 초원 정찰 보상은 이미 완료됐어요.');
    const receipt = {
      missionStep: FIRST_EXPEDITION_RECEIPT_STEPS,
      status: 'CLAIMED' as const,
      startedAt: assignment.startedAt,
      completedAt: assignment.completesAt,
      rewards: {
        egg: { type: 'common', speciesId: reward.speciesId, hatchTime: reward.hatchSeconds },
      },
    };
    // An unfinished manual expedition occupies the one canonical tutorial row.
    const source = previous
      ? await tx.exploration.update({ where: { id: previous.id }, data: receipt })
      : await tx.exploration.create({
          data: {
            userId,
            regionId: FIRST_EXPEDITION.regionId,
            missionId: FIRST_EXPEDITION.id,
            ...receipt,
          },
        });
    await tx.hatchingQueue.create({
      data: {
        userId,
        eggType: 'common',
        speciesId: reward.speciesId,
        sourceExplorationId: source.id,
        readyToStart: true,
        completesAt: now,
      },
    });
    await tx.user.updateMany({
      where: { id: userId, tutorialStep: { lt: 8 } },
      data: { tutorialStep: 8 },
    });
    return;
  }

  // Retain the existing hatch metadata and early park-growth receipt IDs.
  const source = await tx.driveRun.create({
    data: {
      parkId,
      missionId: assignment.legacyMissionId ?? assignment.missionId,
      seed: 0,
      required: 0,
      status: 'CLAIMED',
      reward: reward.type === 'materials' ? { type: 'material', ...reward.items[0] } : reward,
      createdAt: assignment.startedAt,
      sectorStartedAt: assignment.startedAt,
      claimedAt: now,
    },
    select: { id: true },
  });
  if (reward.type === 'egg') {
    const species = getDinosaurById(reward.speciesId);
    if (!species) throw new BadRequestException('이 알의 종 정보를 확인하지 못했어요.');
    await tx.hatchingQueue.create({
      data: {
        userId,
        eggType: species.rarity,
        speciesId: species.id,
        sourceDriveId: source.id,
        readyToStart: true,
        completesAt: now,
      },
    });
    return;
  }
  for (const { material, quality, amount } of reward.items) {
    await tx.resourceInventory.upsert({
      where: { parkId_material_quality: { parkId, material, quality } },
      create: { parkId, material, quality, amount },
      update: { amount: { increment: amount } },
    });
  }
}
