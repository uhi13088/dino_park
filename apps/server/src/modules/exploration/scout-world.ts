import { NotFoundException } from '@nestjs/common';
import {
  EARLY_DRIVE_MISSIONS,
  EARLY_PARENT_HATCH_XP,
  FIRST_EXPEDITION,
  growthFacilityHasCompletedLevel,
  RESEARCH_LAB_ID,
} from '@dino-park/game-data';
import { PARK_ADMISSION } from '@dino-park/shared';
import type { Prisma } from '@prisma/client';
import { careResearch, currentDinosaurState } from '../park/park-admission.logic';
import { highestCompletedFacilityLevel } from '../research/research-facilities';
import { completedTechnologyLevels } from '../research/technology-progress';
import {
  grantHatchingExperience,
  IGUANODON_CARE_RECEIPT,
  parentCareReceipt,
} from './expedition-state';

type Tx = Prisma.TransactionClient;

export async function scoutClock(tx: Tx) {
  const [{ now }] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
  return now;
}

export async function loadScoutWorld(tx: Tx, userId: string, now: Date) {
  const park = await tx.park.findUnique({
    where: { userId },
    include: {
      buildings: { select: { typeId: true, level: true, status: true } },
      dinosaurCollections: { select: { speciesId: true } },
      dinosaurs: { select: { speciesId: true } },
      firstSynthesis: { select: { claimedAt: true, exhibitedAt: true } },
      technologyResearch: {
        where: { completesAt: { lte: now } },
        select: { technologyId: true, level: true, completesAt: true },
      },
      scouts: { orderBy: { slot: 'asc' } },
    },
  });
  if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
  const [
    currency,
    eggs,
    assignments,
    claimedAssignments,
    claimedDrives,
    historicalFirst,
    pendingDriveReward,
    flags,
    lastReport,
  ] = await Promise.all([
    tx.currency.findUniqueOrThrow({ where: { userId } }),
    tx.hatchingQueue.findMany({ where: { userId, completed: false } }),
    tx.scoutAssignment.findMany({
      where: { scout: { parkId: park.id }, claimedAt: null },
      orderBy: { startedAt: 'asc' },
    }),
    tx.scoutAssignment.groupBy({
      by: ['missionId'],
      where: { scout: { parkId: park.id }, claimedAt: { not: null } },
    }),
    tx.driveRun.groupBy({
      by: ['missionId'],
      where: { parkId: park.id, status: 'CLAIMED' },
    }),
    tx.exploration.findFirst({
      where: {
        userId,
        missionId: FIRST_EXPEDITION.id,
        status: { in: ['COMPLETED', 'CLAIMED'] },
      },
      select: { status: true },
    }),
    tx.driveRun.findFirst({ where: { parkId: park.id, status: 'REWARD' }, select: { id: true } }),
    tx.storyFlag.findMany({ where: { userId, value: { equals: true } }, select: { flagId: true } }),
    tx.scoutAssignment.findFirst({
      where: { scout: { parkId: park.id }, claimedAt: { not: null } },
      orderBy: [{ claimedAt: 'desc' }, { id: 'desc' }],
    }),
  ]);
  const research = completedTechnologyLevels(park.technologyResearch, now);
  return {
    park,
    currency,
    assignments,
    lastReport,
    eggs,
    research,
    platformReady: park.buildings.some(
      (building) =>
        building.typeId === PARK_ADMISSION.platformTypeId &&
        growthFacilityHasCompletedLevel(building, 1),
    ),
    labLevel: highestCompletedFacilityLevel(park.buildings, RESEARCH_LAB_ID),
    legacyBlocked: !!pendingDriveReward || historicalFirst?.status === 'COMPLETED',
    firstIguanodonRecorded: historicalFirst !== null,
    claimed: new Set(claimedAssignments.map(({ missionId }) => missionId)),
    claimedDrives: new Set(claimedDrives.map(({ missionId }) => missionId)),
    owned: new Set(park.dinosaurs.map(({ speciesId }) => speciesId)),
    registered: new Set(park.dinosaurCollections.map(({ speciesId }) => speciesId)),
    flags: new Set(flags.map(({ flagId }) => flagId)),
  };
}

export type ScoutWorld = Awaited<ReturnType<typeof loadScoutWorld>>;

export async function restoreLegacyHatchingExperience(
  tx: Tx,
  userId: string,
  world: ScoutWorld,
  now: Date,
) {
  const iguanodon = FIRST_EXPEDITION.speciesId;
  if (!world.owned.has(iguanodon) && !world.registered.has(iguanodon)) return;

  let progress: { id: string; level: number; exp: number } = world.park;
  if (!world.flags.has(IGUANODON_CARE_RECEIPT))
    progress = await grantHatchingExperience(
      tx,
      userId,
      progress,
      IGUANODON_CARE_RECEIPT,
      FIRST_EXPEDITION.careXp,
    );

  const missing = EARLY_DRIVE_MISSIONS.flatMap(({ reward }) =>
    reward.type === 'egg' &&
    world.owned.has(reward.speciesId) &&
    !world.flags.has(parentCareReceipt(reward.speciesId))
      ? [reward.speciesId]
      : [],
  );
  if (missing.length > 0) {
    const park = await tx.park.findUniqueOrThrow({
      where: { id: world.park.id },
      select: {
        buildings: true,
        technologyResearch: careResearch,
        dinosaurs: { where: { speciesId: { in: missing } } },
      },
    });
    const healthy = new Set(
      park.dinosaurs
        .filter((dinosaur) => {
          const state = currentDinosaurState(dinosaur, now.getTime(), park);
          return state.happiness >= 30 && state.hunger <= 80;
        })
        .map(({ speciesId }) => speciesId),
    );
    for (const speciesId of healthy)
      progress = await grantHatchingExperience(
        tx,
        userId,
        progress,
        parentCareReceipt(speciesId),
        EARLY_PARENT_HATCH_XP,
      );
  }
  world.park.level = progress.level;
  world.park.exp = progress.exp;
}
