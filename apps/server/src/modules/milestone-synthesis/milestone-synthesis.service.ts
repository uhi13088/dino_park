import { BadRequestException, Injectable } from '@nestjs/common';
import type { Building, FirstSynthesisJob, Prisma } from '@prisma/client';
import { getBuildingById, getDinosaurById, getSynthesisRecipe } from '@dino-park/game-data';
import {
  EARLY_SYNTHESIS_SAFETY_FLAG,
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_SPECIES_ID,
  MAX_PARK_LEVEL,
  ResearchMaterial,
  getParkLevelExperience,
  type FirstSynthesisParent,
  type FirstSynthesisState,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  activeAt,
  admissionSnapshot,
  careResearch,
  contains,
  currentDinosaurState,
  type AdmissionWorld,
} from '../park/park-admission.logic';
import { ParkOperationsService } from '../park/park-operations.service';

const SAFETY_XP = 2300;
const FINAL_SCENE = 'ch3-scene-6';
const CHAPTER_TWO = 'chapter-2';
const CHAPTER_THREE = 'chapter-3';
const PREPARATION_FLAG = 'milestone-synthesis-briefing-v1';
const EARLY_PARENT_HAPPINESS = 30;
const EARLY_PARENT_MAX_HUNGER = 80;

type Tx = Prisma.TransactionClient;

const recipe = getSynthesisRecipe(FIRST_HYBRID_SPECIES_ID);
if (
  !recipe ||
  recipe.goldCost === null ||
  recipe.durationMs === null ||
  recipe.firstSynthesisRule?.successRate !== 1
) {
  throw new Error('첫 스테고케라톱스 레시피에 연구비·시간·첫 성공 보장이 필요합니다.');
}
export const firstRecipe = {
  ...recipe,
  goldCost: recipe.goldCost,
  durationMs: recipe.durationMs,
};

const ingredientNames: Record<ResearchMaterial, string> = {
  [ResearchMaterial.DNA]: 'DNA',
  [ResearchMaterial.CATALYST]: '촉매',
  [ResearchMaterial.CULTURE]: '배양액',
  [ResearchMaterial.STABILIZER]: '안정제',
  [ResearchMaterial.MUTATION_CELL]: '변이세포',
};

function healthy(parent: FirstSynthesisParent) {
  return parent.happiness >= EARLY_PARENT_HAPPINESS && parent.hunger <= EARLY_PARENT_MAX_HUNGER;
}

export function hasHealthyParents(parents: FirstSynthesisParent[]) {
  return firstRecipe.parentSpeciesIds.every((speciesId) =>
    parents.some((parent) => parent.speciesId === speciesId && healthy(parent)),
  );
}

function activeBuilding(buildings: Building[], typeId: string, now: number) {
  return buildings.find((building) => building.typeId === typeId && activeAt(building, now));
}

function safetyRequirements(
  park: AdmissionWorld & { level: number },
  parents: FirstSynthesisParent[],
  now: number,
) {
  const missing: string[] = [];
  if (!hasHealthyParents(parents))
    missing.push('두 원종을 부화시키고 행복도 30 이상·허기 80 이하로 돌봐주세요.');
  if (park.level < 4) missing.push('파크 Lv.4에서 안전 시설을 준비할 수 있어요.');
  const security = activeBuilding(park.buildings, 'operation-security-center', now);
  if (!security) missing.push('보안센터를 완공해주세요.');
  const habitats = park.buildings.filter(
    (building) => building.typeId === 'habitat-carnivore' && activeAt(building, now),
  );
  if (!habitats.length) {
    missing.push('육식 서식지를 완공해주세요.');
  } else {
    const capacity = getBuildingById('habitat-carnivore')?.baseStats.capacity ?? 0;
    const snapshot = admissionSnapshot(park, now);
    const hasRoute = (habitat: Building) =>
      snapshot.connectedPlatformIds.length && snapshot.connectedHabitatIds.includes(habitat.id);
    const reachable = habitats.filter(hasRoute);
    if (!reachable.length) {
      missing.push('입구에서 관람대와 육식 서식지까지 이어지는 길이 필요해요.');
    } else if (
      !reachable.some((habitat) => {
        const occupied = park.dinosaurs.filter(
          (dinosaur) =>
            dinosaur.isInPark &&
            contains(habitat, {
              x: dinosaur.positionX,
              y: dinosaur.positionY,
            }),
        );
        return (
          occupied.length < capacity &&
          occupied.every((dinosaur) =>
            getDinosaurById(dinosaur.speciesId)?.habitat.some(
              (tag) => tag === 'carnivore-zone' || tag === 'carnivore',
            ),
          )
        );
      })
    ) {
      missing.push('육식 구역을 분리하고 인계에 쓸 빈자리를 확보해주세요.');
    }
  }
  return missing;
}

function jobState(job: FirstSynthesisJob, now: number): FirstSynthesisState['job'] {
  return {
    status: job.claimedAt ? 'claimed' : job.readyAt.getTime() <= now ? 'ready' : 'incubating',
    startedAt: job.startedAt.toISOString(),
    readyAt: job.readyAt.toISOString(),
    claimedAt: job.claimedAt?.toISOString() ?? null,
    resultDinosaurId: job.resultDinosaurId,
    exhibitedAt: job.exhibitedAt?.toISOString() ?? null,
    parentIds: job.parentIds,
  };
}

@Injectable()
export class MilestoneSynthesisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  async readStateInTransaction(tx: Tx, userId: string, clock: Date) {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: {
        buildings: true,
        dinosaurs: true,
        technologyResearch: careResearch,
        firstSynthesis: true,
        dinosaurCollections: {
          where: { speciesId: 'iguanodon' },
          select: { speciesId: true },
        },
      },
    });
    const { gold } = await tx.currency.findUniqueOrThrow({
      where: { userId },
      select: { gold: true },
    });
    const flags = await tx.storyFlag.findMany({
      where: { userId, flagId: { in: [EARLY_SYNTHESIS_SAFETY_FLAG, PREPARATION_FLAG] } },
      select: { flagId: true },
    });
    const stocks = await tx.resourceInventory.findMany({
      where: {
        parkId: park.id,
        OR: firstRecipe.ingredients.map(({ material, quality }) => ({ material, quality })),
      },
    });
    const now = clock.getTime();
    const ingredients = firstRecipe.ingredients.map((ingredient) => ({
      ...ingredient,
      available:
        stocks.find(
          ({ material, quality }) =>
            material === ingredient.material && quality === ingredient.quality,
        )?.amount ?? 0,
    }));
    const parents = park.dinosaurs
      .filter((dinosaur) => firstRecipe.parentSpeciesIds.includes(dinosaur.speciesId))
      .map((dinosaur) => ({
        id: dinosaur.id,
        speciesId: dinosaur.speciesId,
        nickname: dinosaur.nickname,
        ...currentDinosaurState(dinosaur, now, park),
      }));
    const available =
      park.dinosaurCollections.length > 0 ||
      park.dinosaurs.some((dinosaur) => dinosaur.speciesId === 'iguanodon') ||
      !!park.firstSynthesis;
    const safetyComplete = flags.some(({ flagId }) => flagId === EARLY_SYNTHESIS_SAFETY_FLAG);
    const prepared = flags.some(({ flagId }) => flagId === PREPARATION_FLAG);
    const lab = activeBuilding(park.buildings, FIRST_HYBRID_LAB_ID, now);
    const readiness: string[] = [];
    if (!available) readiness.push('첫 이구아노돈 부화와 수령을 마쳐주세요.');
    if (!safetyComplete) readiness.push('2장 안전 점검을 마쳐주세요.');
    if (!lab) readiness.push('DNA 연구소를 완공해주세요.');
    if (!hasHealthyParents(parents))
      readiness.push('행복도 30 이상·허기 80 이하의 스테고사우루스와 트리케라톱스가 필요해요.');
    if (gold < firstRecipe.goldCost)
      readiness.push(`합성에 쓸 ${firstRecipe.goldCost.toLocaleString('ko-KR')}골드가 필요해요.`);
    for (const ingredient of ingredients) {
      if (ingredient.available < ingredient.amount)
        readiness.push(
          `중급 ${ingredientNames[ingredient.material]} ${ingredient.amount}개가 필요해요.`,
        );
    }
    const state: FirstSynthesisState = {
      available,
      safetyComplete,
      safetyRequirements: safetyComplete ? [] : safetyRequirements(park, parents, now),
      prepared,
      labReady: !!lab,
      parents,
      ingredients,
      gold,
      recipe: firstRecipe,
      missing: park.firstSynthesis
        ? []
        : [...readiness, ...(!prepared ? ['닥터 진의 첫 합성 안내를 확인해주세요.'] : [])],
      builderSlots: park.firstSynthesis?.claimedAt ? 2 : 1,
      serverTime: clock.toISOString(),
      job: park.firstSynthesis ? jobState(park.firstSynthesis, now) : null,
    };
    return { park, state, lab };
  }

  async getState(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      return (await this.readStateInTransaction(tx, userId, new Date())).state;
    });
  }

  async completeSafety(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const clock = new Date();
      const { park, state } = await this.readStateInTransaction(tx, userId, clock);
      if (state.safetyComplete) return state;
      if (!state.available) throw new BadRequestException('첫 이구아노돈을 부화하고 수령해주세요.');
      if (state.safetyRequirements.length)
        throw new BadRequestException(state.safetyRequirements[0]);

      await tx.storyFlag.create({
        data: { userId, flagId: EARLY_SYNTHESIS_SAFETY_FLAG, value: true },
      });
      await tx.storyProgress.upsert({
        where: { userId_chapterId: { userId, chapterId: CHAPTER_TWO } },
        create: { userId, chapterId: CHAPTER_TWO, completed: true },
        update: { completed: true, sceneId: null },
      });
      let level = park.level;
      let exp = park.exp + SAFETY_XP;
      while (level < MAX_PARK_LEVEL && exp >= getParkLevelExperience(level)) {
        exp -= getParkLevelExperience(level);
        level++;
      }
      await tx.park.update({
        where: { id: park.id },
        data: { level, exp: level === MAX_PARK_LEVEL ? 0 : exp },
      });
      return (await this.readStateInTransaction(tx, userId, clock)).state;
    });
  }

  async prepare(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const clock = new Date();
      const { state } = await this.readStateInTransaction(tx, userId, clock);
      if (state.prepared || state.job) return state;
      if (!state.available || !state.safetyComplete)
        throw new BadRequestException('2장 안전 점검을 먼저 완료해주세요.');
      if (state.ingredients.some((ingredient) => ingredient.available < ingredient.amount))
        throw new BadRequestException('탐험가를 파견해 합성 재료를 먼저 모아주세요.');

      await tx.storyFlag.create({ data: { userId, flagId: PREPARATION_FLAG, value: true } });
      const where = { userId_chapterId: { userId, chapterId: CHAPTER_THREE } };
      const existing = await tx.storyProgress.findUnique({ where });
      if (!existing?.completed)
        await tx.storyProgress.upsert({
          where,
          create: { userId, chapterId: CHAPTER_THREE, sceneId: FINAL_SCENE },
          update: { sceneId: FINAL_SCENE },
        });
      return (await this.readStateInTransaction(tx, userId, clock)).state;
    });
  }

  async start(userId: string, parentIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const clock = new Date();
      const { park, state, lab } = await this.readStateInTransaction(tx, userId, clock);
      if (state.job) return state;
      if (!lab || state.missing.length)
        throw new BadRequestException(state.missing[0] ?? 'DNA 연구소를 준비해주세요.');
      const parents = state.parents.filter((parent) => parentIds.includes(parent.id));
      if (
        parentIds.length !== firstRecipe.parentSpeciesIds.length ||
        parents.length !== parentIds.length ||
        !hasHealthyParents(parents)
      )
        throw new BadRequestException('보유 중인 건강한 두 원종을 한 마리씩 골라주세요.');

      for (const ingredient of firstRecipe.ingredients) {
        const debit = await tx.resourceInventory.updateMany({
          where: {
            parkId: park.id,
            material: ingredient.material,
            quality: ingredient.quality,
            amount: { gte: ingredient.amount },
          },
          data: { amount: { decrement: ingredient.amount } },
        });
        if (!debit.count)
          throw new BadRequestException(`중급 ${ingredientNames[ingredient.material]}가 부족해요.`);
      }
      const debit = await tx.currency.updateMany({
        where: { userId, gold: { gte: firstRecipe.goldCost } },
        data: { gold: { decrement: firstRecipe.goldCost } },
      });
      if (!debit.count) throw new BadRequestException('골드가 부족해요.');
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: -firstRecipe.goldCost,
          balanceAfter: state.gold - firstRecipe.goldCost,
          reason: '첫 스테고케라톱스 합성',
        },
      });
      await tx.firstSynthesisJob.create({
        data: {
          parkId: park.id,
          parentIds: parents.map((parent) => parent.id),
          labId: lab.id,
          startedAt: clock,
          readyAt: new Date(clock.getTime() + firstRecipe.durationMs),
        },
      });
      return (await this.readStateInTransaction(tx, userId, clock)).state;
    });
  }

  async claim(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const clock = new Date();
      const { park, state } = await this.readStateInTransaction(tx, userId, clock);
      const job = park.firstSynthesis;
      if (!job) throw new BadRequestException('첫 합성을 먼저 시작해주세요.');
      if (job.claimedAt) return state;
      if (job.readyAt.getTime() > clock.getTime())
        throw new BadRequestException('아직 배양 중이에요.');
      const result = await tx.dinosaur.create({
        data: {
          parkId: park.id,
          speciesId: firstRecipe.resultSpeciesId,
          isInPark: false,
          positionX: 0,
          positionY: 0,
          lastFedAt: clock,
        },
      });
      await tx.dinosaurCollection.upsert({
        where: { parkId_speciesId: { parkId: park.id, speciesId: result.speciesId } },
        create: {
          parkId: park.id,
          speciesId: result.speciesId,
          firstCollectedAt: result.createdAt,
        },
        update: {},
      });
      await tx.firstSynthesisJob.update({
        where: { parkId: park.id },
        data: { claimedAt: clock, resultDinosaurId: result.id },
      });
      return (await this.readStateInTransaction(tx, userId, clock)).state;
    });
  }
}
