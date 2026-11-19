import { randomInt } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DriveRunStatus, type DriveRun, type Prisma } from '@prisma/client';
import {
  DRIVE_MAX_DAMAGE,
  DRIVE_SECTOR_COUNT,
  DRIVE_SECTOR_MS,
  EARLY_SYNTHESIS_SAFETY_FLAG,
  MaterialQuality,
  ResearchMaterial,
  replayDriveSector,
  type DriveCheckpointRequest,
  type DriveExpeditionMission,
  type DriveExpeditionRun,
  type DriveExpeditionState,
  type DriveMissionId,
  type DriveMissionReward,
} from '@dino-park/shared';
import {
  EARLY_DRIVE_MISSIONS,
  EARLY_PARENT_HATCH_XP,
  EARLY_PARENT_REACQUIRE_GOLD,
  FIRST_EXPEDITION,
  getDinosaurById,
  PARK_LEVEL_SIX_CATALYST_MISSION,
} from '@dino-park/game-data';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';
import { currentDinosaurState } from '../park/park-admission.logic';
import {
  getExpeditionEnergy,
  getHatchingEggState,
  getHatchingSlots,
  grantHatchingExperience,
  IGUANODON_CARE_RECEIPT,
  parentCareReceipt,
} from './expedition-state';

type Tx = Prisma.TransactionClient;
const MATERIALS = [ResearchMaterial.DNA, ResearchMaterial.CULTURE, ResearchMaterial.CATALYST];
const PARENT_SPECIES = EARLY_DRIVE_MISSIONS.flatMap(({ reward }) =>
  reward.type === 'egg' ? [reward.speciesId] : [],
);
const PROGRESSION_FLAGS = [
  EARLY_SYNTHESIS_SAFETY_FLAG,
  IGUANODON_CARE_RECEIPT,
  ...PARENT_SPECIES.map(parentCareReceipt),
];

@Injectable()
export class DriveExpeditionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  private async load(tx: Tx, userId: string) {
    const park = await tx.park.findUnique({
      where: { userId },
      include: {
        buildings: { select: { typeId: true, status: true } },
        dinosaurs: {
          select: { speciesId: true, lastFedAt: true, happiness: true, hunger: true },
        },
        dinosaurCollections: { select: { speciesId: true } },
        firstSynthesis: { select: { claimedAt: true, exhibitedAt: true } },
      },
    });
    if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
    const growthDriveUnlocked = park.level >= 5 && park.firstSynthesis?.claimedAt != null;
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const active = await tx.driveRun.findUnique({ where: { activeSlot: park.id } });
    const claimedRows = await tx.driveRun.groupBy({
      by: ['missionId'],
      where: { parkId: park.id, status: DriveRunStatus.CLAIMED },
    });
    const eggs = await tx.hatchingQueue.findMany({
      where: { userId, OR: [{ completed: false }, { speciesId: { in: PARENT_SPECIES } }] },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    const progression = await tx.storyFlag.findMany({
      where: { userId, flagId: { in: PROGRESSION_FLAGS } },
      select: { flagId: true, value: true },
    });
    const legacy = await tx.exploration.findFirst({
      where: { userId, missionId: null, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
      select: { id: true },
    });
    const stock = await tx.resourceInventory.findMany({
      where: {
        parkId: park.id,
        OR: [
          { material: { in: MATERIALS }, quality: MaterialQuality.MIDDLE },
          ...(growthDriveUnlocked
            ? [{ material: ResearchMaterial.CATALYST, quality: MaterialQuality.LOW }]
            : []),
        ],
      },
    });
    const owned = new Set(park.dinosaurs.map(({ speciesId }) => speciesId));
    const registered = new Set(park.dinosaurCollections.map(({ speciesId }) => speciesId));
    const claimed = new Set(claimedRows.map(({ missionId }) => missionId));
    const unlocked =
      owned.has(FIRST_EXPEDITION.speciesId) || registered.has(FIRST_EXPEDITION.speciesId);
    const safety = progression.some(
      ({ flagId, value }) => flagId === EARLY_SYNTHESIS_SAFETY_FLAG && value === true,
    );
    return {
      park,
      active,
      currency,
      eggs,
      safety,
      legacy,
      stock,
      owned,
      registered,
      claimed,
      unlocked,
      growthDriveUnlocked,
      flags: new Set(progression.map(({ flagId }) => flagId)),
    };
  }

  private runResponse(run: DriveRun): DriveExpeditionRun {
    let status: DriveExpeditionRun['status'] = 'failed';
    if (run.status === DriveRunStatus.RUNNING) status = 'running';
    else if (run.status === DriveRunStatus.REWARD) status = 'reward';
    const { id, seed, sector, x, collected, damage, required } = run;
    return {
      id,
      seed,
      sector,
      x,
      collected,
      damage,
      required,
      status,
      missionId: run.missionId as DriveMissionId,
      sectorStartedAt: run.sectorStartedAt.toISOString(),
    };
  }

  private state(
    world: Awaited<ReturnType<DriveExpeditionService['load']>>,
    now = new Date(),
  ): DriveExpeditionState {
    const {
      park,
      active,
      currency,
      eggs,
      safety,
      legacy,
      stock,
      owned,
      registered,
      claimed,
      unlocked,
      growthDriveUnlocked,
    } = world;
    const missionData = growthDriveUnlocked
      ? [...EARLY_DRIVE_MISSIONS, PARK_LEVEL_SIX_CATALYST_MISSION]
      : EARLY_DRIVE_MISSIONS;
    const missions = missionData.map((mission): DriveExpeditionMission => {
      const { id, reward } = mission;
      const isGrowthDrive = id === PARK_LEVEL_SIX_CATALYST_MISSION.id;
      const eggReward = reward.type === 'egg' ? reward : null;
      const speciesId = eggReward?.speciesId;
      const queued = speciesId
        ? eggs.find((egg) => egg.speciesId === speciesId && !egg.completed)
        : null;
      const hasSpecies = !!speciesId && owned.has(speciesId);
      const egg = queued ?? (hasSpecies ? eggs.find((item) => item.speciesId === speciesId) : null);
      const repeatable =
        isGrowthDrive || (reward.type === 'material' && park.firstSynthesis?.exhibitedAt != null);
      const done = eggReward ? hasSpecies || !!queued : !repeatable && claimed.has(id);
      const canReacquire = !!speciesId && (registered.has(speciesId) || claimed.has(id));
      let requirement: string | undefined;
      if (!unlocked) requirement = '이구아노돈을 먼저 부화하고 수령하세요.';
      else if (legacy) requirement = '이전 탐험을 완료하고 보상을 수령하세요.';
      else if (!eggReward && !isGrowthDrive && !safety)
        requirement = '2장 안전 목표를 먼저 완료하세요.';
      else if (id === 'dna2' && !claimed.has('dna1'))
        requirement = 'DNA 조사 1의 시료를 수령하세요.';
      else if (id === 'catalyst' && (!claimed.has('dna2') || !claimed.has('culture')))
        requirement = 'DNA 조사 2와 원시 습지 시료를 먼저 수령하세요.';
      let status: DriveExpeditionMission['status'] = 'available';
      if (active?.missionId === id) status = 'active';
      else if (done) status = 'claimed';
      else if (requirement) status = 'locked';
      const goldCost = canReacquire && !done ? EARLY_PARENT_REACQUIRE_GOLD : mission.goldCost;
      return {
        ...mission,
        goldCost,
        status,
        repeatable,
        ...(status === 'locked' && requirement ? { requirement } : {}),
        egg:
          egg && eggReward
            ? getHatchingEggState(egg, eggReward.speciesId, eggReward.hatchSeconds, now.getTime())
            : null,
      };
    });
    return {
      unlocked,
      gold: currency.gold,
      energy: getExpeditionEnergy(currency, now).value,
      missions,
      stock: [
        ...MATERIALS.map((material) => ({ material, quality: MaterialQuality.MIDDLE })),
        ...(growthDriveUnlocked
          ? [{ material: ResearchMaterial.CATALYST, quality: MaterialQuality.LOW }]
          : []),
      ].map(({ material, quality }) => ({
        material,
        quality,
        amount:
          stock.find((slot) => slot.material === material && slot.quality === quality)?.amount ?? 0,
      })),
      run: active ? this.runResponse(active) : null,
      hatchingSlots: getHatchingSlots(world.park.buildings, eggs),
    };
  }

  getState(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const world = await this.load(tx, userId);
      if (world.unlocked) await this.backfillHatchingGoals(tx, userId, world);
      return this.state(world);
    });
  }

  private async backfillHatchingGoals(
    tx: Tx,
    userId: string,
    world: Awaited<ReturnType<DriveExpeditionService['load']>>,
  ) {
    // Existing valid hatches and known parents also qualify for the one-time growth goals.
    let progress: { id: string; level: number; exp: number } = world.park;
    if (!world.flags.has(IGUANODON_CARE_RECEIPT)) {
      progress = await grantHatchingExperience(
        tx,
        userId,
        progress,
        IGUANODON_CARE_RECEIPT,
        FIRST_EXPEDITION.careXp,
      );
    }
    const now = Date.now();
    const healthyParents = new Set(
      world.park.dinosaurs
        .filter((dinosaur) => {
          if (!PARENT_SPECIES.includes(dinosaur.speciesId)) return false;
          const state = currentDinosaurState(dinosaur, now);
          return state.happiness >= 30 && state.hunger <= 80;
        })
        .map(({ speciesId }) => speciesId),
    );
    for (const parent of healthyParents) {
      const flagId = parentCareReceipt(parent);
      if (world.flags.has(flagId)) continue;
      progress = await grantHatchingExperience(tx, userId, progress, flagId, EARLY_PARENT_HATCH_XP);
    }
  }

  start(userId: string, missionId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const world = await this.load(tx, userId);
      const now = new Date();
      const state = this.state(world, now);
      if (state.run?.missionId === missionId) return state;
      if (state.run) throw new BadRequestException('진행 중인 주행을 먼저 마무리하세요.');
      const mission = state.missions.find((item) => item.id === missionId);
      if (!mission) throw new NotFoundException('주행 목표를 찾을 수 없습니다.');
      if (mission.status !== 'available')
        throw new BadRequestException(mission.requirement ?? '이미 수령한 목표예요.');
      if (state.gold < mission.goldCost) throw new BadRequestException('탐험 준비비가 부족해요.');
      const fuel = getExpeditionEnergy(world.currency, now);
      if (fuel.value < mission.energyCost) throw new BadRequestException('탐험 연료가 부족해요.');
      const updated = await tx.currency.update({
        where: { userId },
        data: {
          gold: { decrement: mission.goldCost },
          explorationEnergy: fuel.value - mission.energyCost,
          energyLastRechargedAt: fuel.last,
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: -mission.goldCost,
          reason: mission.title + ' 준비',
          balanceAfter: updated.gold,
        },
      });
      await tx.driveRun.create({
        data: {
          parkId: world.park.id,
          activeSlot: world.park.id,
          missionId,
          seed: randomInt(1, 2 ** 31),
          required: mission.target,
          reward: mission.reward,
          sectorStartedAt: now,
        },
      });
      return this.state(await this.load(tx, userId));
    });
  }

  private async ownedRun(tx: Tx, userId: string, id: string) {
    const run = await tx.driveRun.findFirst({ where: { id, park: { userId } } });
    if (!run) throw new NotFoundException('주행 기록을 찾을 수 없습니다.');
    return run;
  }

  checkpoint(userId: string, id: string, { sector, positions }: DriveCheckpointRequest) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const run = await this.ownedRun(tx, userId, id);
      if (sector < run.sector || run.status !== DriveRunStatus.RUNNING)
        return this.state(await this.load(tx, userId));
      if (sector !== run.sector) throw new BadRequestException('현재 주행 구간을 먼저 완료하세요.');
      const now = new Date();
      if (now.getTime() < run.sectorStartedAt.getTime() + DRIVE_SECTOR_MS)
        throw new BadRequestException('아직 이 구간의 주행이 끝나지 않았어요.');
      const outcome = replayDriveSector(run.seed, sector, run, positions);
      if (!outcome)
        throw new BadRequestException('주행 기록을 확인하지 못했어요. 이 구간을 다시 달려주세요.');
      const nextSector = sector + 1;
      let status: DriveRunStatus = DriveRunStatus.RUNNING;
      if (outcome.damage >= DRIVE_MAX_DAMAGE) status = DriveRunStatus.FAILED;
      else if (nextSector === DRIVE_SECTOR_COUNT)
        status = outcome.collected >= run.required ? DriveRunStatus.REWARD : DriveRunStatus.FAILED;
      await tx.driveRun.update({
        where: { id },
        data: {
          x: outcome.x,
          collected: outcome.collected,
          damage: outcome.damage,
          sector: nextSector,
          sectorStartedAt: now,
          status,
        },
      });
      return this.state(await this.load(tx, userId));
    });
  }

  claim(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const run = await this.ownedRun(tx, userId, id);
      if (run.status === DriveRunStatus.CLAIMED) return this.state(await this.load(tx, userId));
      if (run.status !== DriveRunStatus.REWARD)
        throw new BadRequestException('목표를 달성하고 귀환하면 보상을 수령할 수 있어요.');
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
            sourceDriveId: id,
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
        data: { activeSlot: null, status: DriveRunStatus.CLAIMED, claimedAt: now },
      });
      return this.state(await this.load(tx, userId));
    });
  }

  abandon(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const run = await this.ownedRun(tx, userId, id);
      if (run.status === DriveRunStatus.REWARD)
        throw new BadRequestException('귀환 보상부터 수령하세요.');
      if (run.status === DriveRunStatus.RUNNING || run.status === DriveRunStatus.FAILED)
        await tx.driveRun.update({
          where: { id },
          data: { activeSlot: null, status: DriveRunStatus.ABANDONED },
        });
      return this.state(await this.load(tx, userId));
    });
  }
}
