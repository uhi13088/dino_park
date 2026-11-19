import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Exploration, type HatchingQueue } from '@prisma/client';
import {
  DINOSAUR_DATA,
  EARLY_DRIVE_MISSIONS,
  EARLY_PARENT_HATCH_XP,
  FIRST_EXPEDITION,
  getDinosaurById,
  getDinosaurOrigin,
} from '@dino-park/game-data';
import {
  DinosaurOrigin,
  PARK_ADMISSION,
  type FirstExpeditionStateResponse,
  type FirstExpeditionStage,
  type DriveMissionReward,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';
import {
  getExpeditionEnergy,
  getHatchingEggState,
  getHatchingSlots,
  grantHatchingExperience,
  IGUANODON_CARE_RECEIPT,
  parentCareReceipt,
} from './expedition-state';

type Tx = Prisma.TransactionClient;

@Injectable()
export class FirstExpeditionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  private async load(tx: Tx, userId: string) {
    const park = await tx.park.findUnique({
      where: { userId },
      include: { buildings: true, dinosaurs: true, dinosaurCollections: true },
    });
    if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const mission = await tx.exploration.findUnique({
      where: { userId_missionId: { userId, missionId: FIRST_EXPEDITION.id } },
    });
    const egg = mission
      ? await tx.hatchingQueue.findUnique({ where: { sourceExplorationId: mission.id } })
      : null;
    const queue = await tx.hatchingQueue.findMany({ where: { userId, completed: false } });
    const legacyActive = await tx.exploration.count({
      where: { userId, status: 'IN_PROGRESS', missionId: null },
    });
    return { park, user, currency, mission, egg, queue, legacyActive };
  }

  private async response(
    tx: Tx,
    userId: string,
    feedback?: FirstExpeditionStateResponse['feedback'],
  ): Promise<FirstExpeditionStateResponse> {
    const world = await this.load(tx, userId);
    const { park, mission, egg, currency, user } = world;
    const owned =
      park.dinosaurs.find((d) => d.id === egg?.claimedDinosaurId) ??
      park.dinosaurs.find((d) => d.speciesId === FIRST_EXPEDITION.speciesId) ??
      null;
    const registered = park.dinosaurCollections.some(
      (d) => d.speciesId === FIRST_EXPEDITION.speciesId,
    );
    const reusedExisting = !mission && (!!owned || registered);
    const platformReady = park.buildings.some(
      (b) => b.typeId === PARK_ADMISSION.platformTypeId && b.status === 'ACTIVE',
    );
    const requirements: string[] = [];
    if (!mission && !reusedExisting && !platformReady)
      requirements.push('파크의 첫 관람대를 완공해주세요.');
    if (!mission && !reusedExisting && world.legacyActive)
      requirements.push('진행 중인 기존 탐험을 먼저 완료하고 보상을 받아주세요.');
    const unlocked = !!mission || reusedExisting || !requirements.length;
    let stage: FirstExpeditionStage = unlocked ? 'available' : 'locked';
    if (reusedExisting) stage = owned && !owned.isInPark ? 'placement' : 'complete';
    else if (mission?.status === 'IN_PROGRESS') stage = 'exploring';
    else if (mission?.status === 'COMPLETED') stage = 'reward';
    else if (egg?.readyToStart) stage = 'egg';
    else if (egg?.completed) stage = owned && !owned.isInPark ? 'placement' : 'complete';
    else if (egg) stage = egg.completesAt.getTime() <= Date.now() ? 'hatch_ready' : 'hatching';
    const steps: Record<FirstExpeditionStage, number> = {
      locked: 0,
      available: 5,
      exploring: 6,
      reward: 7,
      egg: 8,
      hatching: 8,
      hatch_ready: 8,
      placement: 9,
      complete: 10,
    };
    const tutorialStep = Math.max(user.tutorialStep, steps[stage]);
    if (tutorialStep > user.tutorialStep)
      await tx.user.updateMany({
        where: { id: userId, tutorialStep: { lt: tutorialStep } },
        data: { tutorialStep },
      });
    const clue =
      mission?.status === 'IN_PROGRESS' ? FIRST_EXPEDITION.clues[mission.missionStep] : null;
    return {
      stage,
      tutorialStep,
      unlocked,
      requirements,
      gold: currency.gold,
      energy: getExpeditionEnergy(currency).value,
      mission: mission
        ? {
            id: mission.id,
            regionId: mission.regionId,
            status: mission.status,
            step: mission.missionStep,
            totalSteps: FIRST_EXPEDITION.clues.length,
            clue: clue
              ? {
                  id: clue.id,
                  title: clue.title,
                  hint: clue.hint,
                  options: clue.options.map((option) => ({ ...option })),
                }
              : null,
          }
        : null,
      egg: egg
        ? getHatchingEggState(
            egg,
            egg.speciesId ?? FIRST_EXPEDITION.speciesId,
            FIRST_EXPEDITION.hatchSeconds,
          )
        : null,
      dinosaur: owned
        ? {
            id: owned.id,
            speciesId: owned.speciesId,
            nickname: owned.nickname,
            level: owned.level,
            exp: owned.exp,
            happiness: owned.happiness,
            hunger: owned.hunger,
            intimacy: owned.intimacy,
            positionX: owned.positionX,
            positionY: owned.positionY,
            isInPark: owned.isInPark,
          }
        : null,
      hatchingSlots: getHatchingSlots(park.buildings, world.queue),
      reusedExisting,
      ...(feedback ? { feedback } : {}),
    };
  }

  async getState(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      return this.response(tx, userId);
    });
  }

  async start(userId: string, regionId: string) {
    if (regionId !== FIRST_EXPEDITION.regionId)
      throw new BadRequestException('첫 탐험 장소는 초원 정찰입니다.');
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const world = await this.load(tx, userId);
      if (
        world.mission ||
        world.park.dinosaurs.some((d) => d.speciesId === FIRST_EXPEDITION.speciesId) ||
        world.park.dinosaurCollections.some((d) => d.speciesId === FIRST_EXPEDITION.speciesId)
      )
        return this.response(tx, userId);
      if (
        !world.park.buildings.some(
          (b) => b.typeId === PARK_ADMISSION.platformTypeId && b.status === 'ACTIVE',
        )
      )
        throw new BadRequestException('첫 관람대를 완공한 뒤 탐험을 시작할 수 있어요.');
      if (world.legacyActive)
        throw new BadRequestException('진행 중인 기존 탐험을 먼저 완료해주세요.');
      const energy = getExpeditionEnergy(world.currency);
      if (world.currency.gold < FIRST_EXPEDITION.goldCost)
        throw new BadRequestException('탐험 준비비가 부족합니다.');
      if (energy.value < FIRST_EXPEDITION.energyCost)
        throw new BadRequestException('탐험 에너지가 부족합니다.');
      const updated = await tx.currency.update({
        where: { userId },
        data: {
          gold: { decrement: FIRST_EXPEDITION.goldCost },
          explorationEnergy: energy.value - FIRST_EXPEDITION.energyCost,
          energyLastRechargedAt: energy.last,
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: -FIRST_EXPEDITION.goldCost,
          reason: '첫 초원 정찰 준비',
          balanceAfter: updated.gold,
        },
      });
      await tx.exploration.create({
        data: { userId, regionId, missionId: FIRST_EXPEDITION.id, missionStep: 0 },
      });
      return this.response(tx, userId);
    });
  }

  private async ownedMission(tx: Tx, userId: string, id: string): Promise<Exploration> {
    const mission = await tx.exploration.findUnique({ where: { id } });
    if (!mission || mission.userId !== userId || mission.missionId !== FIRST_EXPEDITION.id)
      throw new NotFoundException('첫 탐험을 찾을 수 없습니다.');
    return mission;
  }

  async choose(userId: string, id: string, step: number, choiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const mission = await this.ownedMission(tx, userId, id);
      const clue = FIRST_EXPEDITION.clues[step];
      if (
        !Number.isInteger(step) ||
        !clue ||
        !clue.options.some((option) => option.id === choiceId)
      )
        throw new BadRequestException('현재 단서의 선택지를 골라주세요.');
      if (step > mission.missionStep)
        throw new BadRequestException('앞의 단서를 먼저 확인해주세요.');
      const correct = choiceId === clue.correctChoiceId;
      if (step < mission.missionStep || mission.status !== 'IN_PROGRESS')
        return this.response(tx, userId, {
          correct,
          message: '이미 확인한 단서예요. 이어서 진행해주세요.',
        });
      if (!correct) return this.response(tx, userId, { correct: false, message: clue.retry });
      const next = mission.missionStep + 1;
      await tx.exploration.update({
        where: { id },
        data: {
          missionStep: next,
          ...(next === FIRST_EXPEDITION.clues.length
            ? {
                status: 'COMPLETED',
                completedAt: new Date(),
                rewards: {
                  egg: {
                    type: 'common',
                    speciesId: FIRST_EXPEDITION.speciesId,
                    hatchTime: FIRST_EXPEDITION.hatchSeconds,
                  },
                },
              }
            : {}),
        },
      });
      return this.response(tx, userId, { correct: true, message: clue.success });
    });
  }

  async claim(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const mission = await this.ownedMission(tx, userId, id);
      if (mission.status === 'IN_PROGRESS' || mission.missionStep !== FIRST_EXPEDITION.clues.length)
        throw new BadRequestException('세 단서를 모두 조사한 뒤 알을 가져갈 수 있어요.');
      if (mission.status === 'CLAIMED') return this.response(tx, userId);
      await tx.hatchingQueue.create({
        data: {
          userId,
          eggType: 'common',
          speciesId: FIRST_EXPEDITION.speciesId,
          sourceExplorationId: mission.id,
          readyToStart: true,
          completesAt: new Date(),
        },
      });
      await tx.exploration.update({ where: { id }, data: { status: 'CLAIMED' } });
      return this.response(tx, userId);
    });
  }

  private async ownedEgg(tx: Tx, userId: string, id: string): Promise<HatchingQueue> {
    const egg = await tx.hatchingQueue.findUnique({ where: { id } });
    if (!egg || egg.userId !== userId) throw new NotFoundException('보유한 알을 찾을 수 없습니다.');
    return egg;
  }

  async startHatching(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const egg = await this.ownedEgg(tx, userId, id);
      if (!egg.readyToStart || egg.completed) return this.response(tx, userId);
      const world = await this.load(tx, userId);
      const slots = getHatchingSlots(world.park.buildings, world.queue);
      if (slots.used >= slots.total)
        throw new BadRequestException('부화 슬롯이 가득 찼어요. 먼저 완료된 알을 수령해주세요.');
      let hatchSeconds: number = FIRST_EXPEDITION.hatchSeconds;
      if (egg.sourceDriveId) {
        const source = await tx.driveRun.findUnique({ where: { id: egg.sourceDriveId } });
        const reward = source?.reward as DriveMissionReward | undefined;
        if (reward?.type !== 'egg' || reward.speciesId !== egg.speciesId || !reward.hatchSeconds)
          throw new BadRequestException('이 알의 부화 정보를 확인하지 못했어요.');
        hatchSeconds = reward.hatchSeconds;
      }
      const now = new Date();
      await tx.hatchingQueue.update({
        where: { id },
        data: {
          readyToStart: false,
          startedAt: now,
          completesAt: new Date(now.getTime() + hatchSeconds * 1000),
        },
      });
      return this.response(tx, userId);
    });
  }

  private legacySpecies(egg: HatchingQueue) {
    if (egg.speciesId) return getDinosaurById(egg.speciesId);
    const rarity = egg.eggType.replace(/^egg_/, '').toLowerCase();
    const candidates = DINOSAUR_DATA.filter(
      (d) => d.rarity === rarity && getDinosaurOrigin(d) === DinosaurOrigin.NATURAL,
    );
    if (!candidates.length)
      throw new BadRequestException(
        '이 등급의 알은 현재 부화할 종이 등록되지 않았어요. 알은 보존됩니다.',
      );
    const hash = [...egg.id].reduce(
      (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
      0,
    );
    return candidates[hash % candidates.length];
  }

  async claimHatching(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const egg = await this.ownedEgg(tx, userId, id);
      if (egg.completed) return this.response(tx, userId);
      if (egg.readyToStart) throw new BadRequestException('먼저 알 부화를 시작해주세요.');
      if (egg.completesAt.getTime() > Date.now())
        throw new BadRequestException('아직 알이 부화하지 않았어요.');
      const species = this.legacySpecies(egg);
      if (!species) throw new BadRequestException('등록되지 않은 종의 알입니다. 알은 보존됩니다.');
      const park = await tx.park.findUniqueOrThrow({ where: { userId } });
      const dinosaur = await tx.dinosaur.create({
        data: {
          parkId: park.id,
          speciesId: species.id,
          positionX: 9,
          positionY: 9,
          isInPark: false,
          happiness: 100,
          hunger: 0,
          intimacy: 0,
        },
      });
      await tx.dinosaurCollection.upsert({
        where: { parkId_speciesId: { parkId: park.id, speciesId: species.id } },
        create: { parkId: park.id, speciesId: species.id, firstCollectedAt: dinosaur.createdAt },
        update: {},
      });
      await tx.hatchingQueue.update({
        where: { id },
        data: { completed: true, claimedDinosaurId: dinosaur.id },
      });
      if (egg.sourceExplorationId) {
        const source = await this.ownedMission(tx, userId, egg.sourceExplorationId);
        if (source.missionId === FIRST_EXPEDITION.id) {
          await grantHatchingExperience(
            tx,
            userId,
            park,
            IGUANODON_CARE_RECEIPT,
            FIRST_EXPEDITION.careXp,
          );
        }
      }
      if (
        EARLY_DRIVE_MISSIONS.some(
          ({ reward }) => reward.type === 'egg' && reward.speciesId === species.id,
        )
      ) {
        await grantHatchingExperience(
          tx,
          userId,
          park,
          parentCareReceipt(species.id),
          EARLY_PARENT_HATCH_XP,
        );
      }
      return this.response(tx, userId);
    });
  }
}
