import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_DINOSAUR_LEVEL,
  MAX_HAPPINESS,
  MAX_INTIMACY,
  FEEDING_HAPPINESS_GAIN,
  FEEDING_HUNGER_REDUCE,
  FEEDING_GOLD_COST,
  FEEDING_INTIMACY_GAIN,
  BuildingCategory,
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_SPECIES_ID,
  RARITY_REVENUE_MULTIPLIER,
  type HybridExhibitSelection,
} from '@dino-park/shared';
import {
  getBuildingById,
  getSynthesisRecipe,
  readExperimentalHybridIdentity,
  resolveDinosaurSpecies,
} from '@dino-park/game-data';
import { Prisma, type Dinosaur as PersistedDinosaur, type Building } from '@prisma/client';
import { ParkOperationsService } from '../park/park-operations.service';
import {
  activeAt,
  admissionResearch,
  admissionSnapshot,
  careResearch,
  contains,
  currentDinosaurState,
  exhibitSafetyIssue,
  type AdmissionWorld,
  type DinosaurCareWorld,
  type Tile,
} from '../park/park-admission.logic';
import { dinosaurCompetitiveStats } from './dinosaur-competitive-stats';
import {
  experimentalPlacementIssue,
  hybridPlacementIssue,
  previewHybridExhibit,
} from './hybrid-exhibit.logic';
import {
  describeExhibitPlacement,
  projectExhibitCrowd,
  projectedExhibitDinosaur,
} from '../park/exhibit-placement.logic';
import { safariContainsDinosaur, safariReservedTiles } from '../park/park-safari-state';

const careContext = { buildings: true, technologyResearch: careResearch } as const;

function isParkTile(tile: Tile, park: { gridSizeX: number; gridSizeY: number }) {
  return (
    Number.isInteger(tile.x) &&
    Number.isInteger(tile.y) &&
    tile.x >= 0 &&
    tile.y >= 0 &&
    tile.x < park.gridSizeX &&
    tile.y < park.gridSizeY
  );
}

function buildingPlacementObstacle(
  buildings: Building[],
  tile: Tile,
  allowsHybridHabitat: boolean,
) {
  if (
    buildings.some(
      (building) =>
        getBuildingById(building.typeId)?.category !== BuildingCategory.DINOSAUR &&
        contains(building, tile),
    )
  )
    return '건물이 있는 칸에는 배치할 수 없습니다.';
  if (
    !allowsHybridHabitat &&
    buildings.some(
      (building) => building.typeId === FIRST_HYBRID_HABITAT_ID && contains(building, tile),
    )
  )
    return '이 서식지는 초식 하이브리드를 위한 공간이에요.';
  return null;
}

function dinosaurPlacementIssue(
  world: AdmissionWorld,
  dinosaur: PersistedDinosaur,
  tile: Tile,
  at: number,
) {
  if (safariContainsDinosaur(world.safariLayout, dinosaur.id))
    return '사파리에서 이 공룡을 대기로 옮긴 뒤 배치해주세요.';
  if (safariReservedTiles(world.safariLayout).some(({ x, y }) => x === tile.x && y === tile.y))
    return '사파리 울타리와 지프길 바깥에 배치해주세요.';
  if (
    world.dinosaurs.some(
      (other) =>
        other.id !== dinosaur.id &&
        other.isInPark &&
        other.positionX === tile.x &&
        other.positionY === tile.y,
    )
  )
    return '다른 공룡이 있는 칸입니다.';
  const firstHybrid = dinosaur.speciesId === FIRST_HYBRID_SPECIES_ID;
  const hybrid = readExperimentalHybridIdentity(dinosaur.hybridSpecies);
  return (
    buildingPlacementObstacle(world.buildings, tile, firstHybrid || !!hybrid) ??
    (firstHybrid
      ? hybridPlacementIssue(world, dinosaur.id, tile, at)
      : hybrid && experimentalPlacementIssue(world, dinosaur.id, hybrid, tile, at)) ??
    exhibitSafetyIssue(world, dinosaur, tile, at)
  );
}

/**
 * 공룡 레벨별 필요 경험치
 * 공식: 50 * level^1.5
 */
function getExpForDinoLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

@Injectable()
export class DinosaurService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  /**
   * 유저 ID로 공룡 목록 조회 (상태 업데이트 포함)
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: careContext,
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    const dinosaurs = await this.prisma.dinosaur.findMany({
      where: { parkId: park.id },
      orderBy: { createdAt: 'desc' },
    });

    // 상태 계산 후 반환 (실제 DB 업데이트는 하지 않음 - 조회 성능)
    const at = Date.now();
    return dinosaurs.map((dino) => this.calculateCurrentState(dino, park, at));
  }

  /**
   * ID로 공룡 상세 조회
   */
  async getById(id: string, userId?: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id },
      include: {
        park: {
          select: { userId: true, ...careContext },
        },
      },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    // 소유권 확인 (userId가 제공된 경우)
    if (userId && dinosaur.park.userId !== userId) {
      throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
    }

    const { park, ...ownedDinosaur } = dinosaur;
    return { ...this.calculateCurrentState(ownedDinosaur, park), park: { userId: park.userId } };
  }

  /**
   * 공룡 생성 (부화 완료 시 호출)
   */
  async create(
    userId: string,
    speciesId: string,
    positionX: number,
    positionY: number,
    nickname?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const park = await tx.park.findUnique({ where: { userId } });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
      if (!isParkTile({ x: positionX, y: positionY }, park))
        throw new BadRequestException('유효하지 않은 위치입니다.');
      if (
        safariReservedTiles(park.safariLayout).some(
          ({ x, y }) => x === positionX && y === positionY,
        )
      )
        throw new BadRequestException('사파리 울타리와 지프길 바깥에 배치해주세요.');
      const dinosaur = await tx.dinosaur.create({
        data: {
          parkId: park.id,
          speciesId,
          nickname,
          positionX,
          positionY,
          happiness: MAX_HAPPINESS,
          hunger: 0,
          intimacy: 0,
        },
      });
      await tx.dinosaurCollection.upsert({
        where: { parkId_speciesId: { parkId: park.id, speciesId } },
        create: { parkId: park.id, speciesId, firstCollectedAt: dinosaur.createdAt },
        update: {},
      });
      return dinosaur;
    });
  }

  /**
   * 공룡 닉네임 변경
   */
  async updateNickname(dinosaurId: string, userId: string, nickname: string) {
    await this.getById(dinosaurId, userId);

    if (nickname && (nickname.length < 1 || nickname.length > 12)) {
      throw new BadRequestException('닉네임은 1~12자여야 합니다.');
    }

    return this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: { nickname: nickname || null },
    });
  }

  /**
   * 공룡 위치 이동
   */
  async move(dinosaurId: string, userId: string, positionX: number, positionY: number) {
    return this.updatePosition(dinosaurId, userId, positionX, positionY, false);
  }

  /**
   * 공룡에게 먹이주기
   * - 골드 차감
   * - 행복도 증가, 배고픔 감소
   * - 친밀도 소량 증가
   */
  async feed(dinosaurId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const { settledAt: now } = await this.operations.settleInTransaction(tx, userId);
      // Lock the owned dinosaur before reading hunger, so two requests cannot feed it twice.
      const locked = await tx.dinosaur.updateMany({
        where: { id: dinosaurId, park: { userId } },
        data: { updatedAt: new Date() },
      });
      if (!locked.count) {
        const existing = await tx.dinosaur.findUnique({ where: { id: dinosaurId } });
        if (!existing) throw new NotFoundException('공룡을 찾을 수 없습니다.');
        throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
      }
      const dinosaur = await tx.dinosaur.findUniqueOrThrow({
        where: { id: dinosaurId },
        include: { park: { select: careContext } },
      });
      const currentState = this.calculateCurrentState(dinosaur, dinosaur.park, now.getTime());
      if (currentState.hunger === 0) {
        throw new BadRequestException('이미 배부른 상태입니다.');
      }

      // A conditional debit also protects the balance when feeding different dinosaurs.
      const debit = await tx.currency.updateMany({
        where: { userId, gold: { gte: FEEDING_GOLD_COST } },
        data: { gold: { decrement: FEEDING_GOLD_COST } },
      });
      if (!debit.count) throw new BadRequestException('골드가 부족합니다.');

      const updated = await tx.dinosaur.update({
        where: { id: dinosaurId },
        data: {
          happiness: Math.min(MAX_HAPPINESS, currentState.happiness + FEEDING_HAPPINESS_GAIN),
          hunger: Math.max(0, currentState.hunger - FEEDING_HUNGER_REDUCE),
          intimacy: Math.min(MAX_INTIMACY, currentState.intimacy + FEEDING_INTIMACY_GAIN),
          lastFedAt: now,
          careProgress: Prisma.DbNull,
        },
      });
      const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: FEEDING_GOLD_COST,
          reason: `공룡 먹이주기: ${dinosaur.nickname || dinosaur.speciesId}`,
          balanceAfter: currency.gold,
        },
      });
      return {
        ...this.calculateCurrentState(updated, dinosaur.park, now.getTime()),
        goldSpent: FEEDING_GOLD_COST,
        happinessGain: updated.happiness - currentState.happiness,
        hungerReduce: currentState.hunger - updated.hunger,
        intimacyGain: updated.intimacy - currentState.intimacy,
      };
    });
  }

  /**
   * 공룡 쓰다듬기/놀아주기
   * - 친밀도 증가
   * - 행복도 소량 증가
   * - 쿨타임 있음 (5분)
   */
  async interact(dinosaurId: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const { settledAt: now } = await this.operations.settleInTransaction(tx, userId);
      const dinosaur = await tx.dinosaur.findUnique({
        where: { id: dinosaurId },
        include: { park: { select: { userId: true, ...careContext } } },
      });
      if (!dinosaur) throw new NotFoundException('공룡을 찾을 수 없습니다.');
      if (dinosaur.park.userId !== userId)
        throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
      const minutesSinceInteraction = (now.getTime() - dinosaur.lastFedAt.getTime()) / 60000;
      if (minutesSinceInteraction < 5)
        throw new BadRequestException(
          `아직 쿨타임 중입니다. ${Math.ceil((5 - minutesSinceInteraction) * 60)}초 후에 다시 시도해주세요.`,
        );
      const current = this.calculateCurrentState(dinosaur, dinosaur.park, now.getTime());
      const newHappiness = Math.min(MAX_HAPPINESS, current.happiness + 5);
      const newIntimacy = Math.min(MAX_INTIMACY, current.intimacy + 10);
      const expGain = Math.floor(10 + current.intimacy / 100);
      const updated = await tx.dinosaur.update({
        where: { id: dinosaurId },
        data: {
          happiness: newHappiness,
          hunger: current.hunger,
          intimacy: newIntimacy,
          exp: { increment: expGain },
          lastFedAt: now,
          careProgress: Prisma.DbNull,
        },
      });
      return {
        updated: this.calculateCurrentState(updated, dinosaur.park, now.getTime()),
        expGain,
        happinessGain: newHappiness - current.happiness,
        intimacyGain: newIntimacy - current.intimacy,
      };
    });
    const levelUp = await this.checkLevelUp(dinosaurId);
    return {
      ...result.updated,
      expGain: result.expGain,
      happinessGain: result.happinessGain,
      intimacyGain: result.intimacyGain,
      leveledUp: levelUp?.leveledUp || false,
      newLevel: levelUp?.newLevel,
    };
  }

  /**
   * 레벨업 체크 및 처리
   */
  async checkLevelUp(dinosaurId: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
    });

    if (!dinosaur) return null;

    let currentExp = dinosaur.exp;
    let currentLevel = dinosaur.level;
    let leveledUp = false;

    while (currentLevel < MAX_DINOSAUR_LEVEL) {
      const expNeeded = getExpForDinoLevel(currentLevel);
      if (currentExp >= expNeeded) {
        currentExp -= expNeeded;
        currentLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    if (leveledUp) {
      await this.prisma.dinosaur.update({
        where: { id: dinosaurId },
        data: {
          level: currentLevel,
          exp: currentExp,
        },
      });

      return { leveledUp: true, newLevel: currentLevel };
    }

    return { leveledUp: false };
  }

  /**
   * 공룡 파크에서 제거 (창고로)
   */
  async removeFromPark(dinosaurId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const { settledAt: now } = await this.operations.settleInTransaction(
        tx,
        userId,
        false,
        undefined,
        { dinosaurIds: [dinosaurId] },
      );
      const dinosaur = await tx.dinosaur.findUnique({
        where: { id: dinosaurId },
        include: { park: { select: { userId: true, safariLayout: true } } },
      });
      if (!dinosaur) throw new NotFoundException('공룡을 찾을 수 없습니다.');
      if (dinosaur.park.userId !== userId)
        throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
      if (safariContainsDinosaur(dinosaur.park.safariLayout, dinosaurId))
        throw new BadRequestException('사파리 관리에서 이 공룡을 대기로 옮겨주세요.');
      const updated = await tx.dinosaur.update({
        where: { id: dinosaurId },
        data: { isInPark: false },
      });
      return this.calculateCurrentState(updated, undefined, now.getTime());
    });
  }

  /**
   * 공룡 파크에 배치
   */
  async placeInPark(dinosaurId: string, userId: string, positionX: number, positionY: number) {
    return this.updatePosition(dinosaurId, userId, positionX, positionY, true);
  }

  async getHybridExhibitPreview(userId: string, selection: HybridExhibitSelection) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: {
        buildings: true,
        dinosaurs: true,
        technologyResearch: admissionResearch,
        firstSynthesis: { select: { exhibitedAt: true } },
      },
    });
    if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
    if (!park.firstSynthesis?.exhibitedAt)
      throw new BadRequestException('첫 스테고케라톱스 전시를 마친 뒤 비교할 수 있어요.');
    return previewHybridExhibit(park, selection, Date.now()).preview;
  }

  async getExhibitPlacementPreview(userId: string, dinosaurId: string, tile: Tile) {
    const park = await this.prisma.park.findUniqueOrThrow({
      where: { userId },
      include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
    });
    const dinosaur = park.dinosaurs.find(({ id }) => id === dinosaurId);
    if (!dinosaur) throw new NotFoundException('보유한 공룡을 찾을 수 없어요.');
    const at = Date.now();
    const before = admissionSnapshot(park, at);
    if (!isParkTile(tile, park))
      return describeExhibitPlacement(before, null, '파크 안의 잔디 칸을 선택해주세요.');
    const issue = dinosaurPlacementIssue(park, dinosaur, tile, at);
    if (issue) return describeExhibitPlacement(before, null, issue);

    const dinosaurs = park.dinosaurs.map((other) =>
      other.id === dinosaurId ? projectedExhibitDinosaur(dinosaur, park, tile, at) : other,
    );
    const after = admissionSnapshot({ ...park, dinosaurs }, at);
    const habitat = park.buildings.find(
      (building) =>
        contains(building, tile) &&
        getBuildingById(building.typeId)?.category === BuildingCategory.DINOSAUR,
    );
    let explanation: string | null = null;
    if (!after.exhibitedDinosaurIds.includes(dinosaurId)) {
      const compatible =
        habitat &&
        resolveDinosaurSpecies(dinosaur)?.habitat.some(
          (tag) => habitat.typeId === `habitat-${tag}`,
        );
      if (!habitat || !compatible)
        explanation = '이 공룡과 맞는 서식지에 배치해야 손님이 볼 수 있어요.';
      else if (!activeAt(habitat, at))
        explanation = '서식지를 완공하면 이 공룡을 전시할 수 있어요.';
      else if (!after.connectedHabitatIds.includes(habitat.id))
        explanation = '입구에서 이 서식지까지 이어지는 관람길이 필요해요.';
    }
    return {
      ...describeExhibitPlacement(before, after, explanation),
      exhibit: habitat ? projectExhibitCrowd(before, after, habitat.id, at) : undefined,
    };
  }

  async replaceHybridExhibit(userId: string, selection: HybridExhibitSelection) {
    return this.prisma.$transaction(async (tx) => {
      const { settledAt: now } = await this.operations.settleInTransaction(
        tx,
        userId,
        false,
        undefined,
        {
          dinosaurIds: [selection.currentId, selection.candidateId],
        },
      );
      const park = await tx.park.findUnique({
        where: { userId },
        include: {
          buildings: true,
          dinosaurs: true,
          technologyResearch: admissionResearch,
          firstSynthesis: { select: { exhibitedAt: true } },
        },
      });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
      if (!park.firstSynthesis?.exhibitedAt)
        throw new BadRequestException('첫 스테고케라톱스 전시를 마친 뒤 교체할 수 있어요.');
      const { preview, destination } = previewHybridExhibit(park, selection, now.getTime());
      if (!destination)
        throw new BadRequestException(preview.unavailableReason ?? '전시를 교체할 수 없어요.');
      await tx.dinosaur.update({
        where: { id: selection.currentId },
        data: { isInPark: false },
      });
      await tx.dinosaur.update({
        where: { id: selection.candidateId },
        data: { positionX: destination.x, positionY: destination.y, isInPark: true },
      });
      return preview;
    });
  }

  private async updatePosition(
    dinosaurId: string,
    userId: string,
    positionX: number,
    positionY: number,
    place: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { settledAt: now } = await this.operations.settleInTransaction(
        tx,
        userId,
        false,
        undefined,
        { dinosaurIds: [dinosaurId] },
      );
      const park = await tx.park.findUnique({
        where: { userId },
        include: { technologyResearch: careResearch },
      });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
      // Serialize placement in the same park before checking occupied cells.
      await tx.park.update({ where: { id: park.id }, data: { updatedAt: new Date() } });
      const dinosaur = await tx.dinosaur.findUnique({ where: { id: dinosaurId } });
      if (!dinosaur) throw new NotFoundException('공룡을 찾을 수 없습니다.');
      if (dinosaur.parkId !== park.id) {
        throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
      }
      const tile = { x: positionX, y: positionY };
      if (!isParkTile(tile, park))
        throw new BadRequestException('파크 안의 잔디 칸을 선택해주세요.');

      const firstHybrid = dinosaur.speciesId === FIRST_HYBRID_SPECIES_ID;
      let buildings: Building[] = [];
      if (place || dinosaur.isInPark) {
        const [parkBuildings, dinosaurs] = await Promise.all([
          tx.building.findMany({ where: { parkId: park.id } }),
          tx.dinosaur.findMany({ where: { parkId: park.id, isInPark: true } }),
        ]);
        buildings = parkBuildings;
        const issue = dinosaurPlacementIssue(
          { ...park, buildings, dinosaurs },
          dinosaur,
          tile,
          now.getTime(),
        );
        if (issue) throw new BadRequestException(issue);
      }
      const updated = await tx.dinosaur.update({
        where: { id: dinosaurId },
        data: { positionX, positionY, ...(place ? { isInPark: true } : {}) },
      });
      if (firstHybrid && updated.isInPark) {
        const exhibited = await tx.firstSynthesisJob.updateMany({
          where: { parkId: park.id, resultDinosaurId: dinosaurId, exhibitedAt: null },
          data: { exhibitedAt: new Date() },
        });
        if (exhibited.count)
          await tx.storyProgress.update({
            where: { userId_chapterId: { userId, chapterId: 'chapter-3' } },
            data: { completed: true, sceneId: null },
          });
      }
      return this.calculateCurrentState(
        updated,
        { buildings, technologyResearch: park.technologyResearch },
        now.getTime(),
      );
    });
  }

  /**
   * 공룡 삭제 (방생)
   * - DNA 획득
   */
  async release(dinosaurId: string, userId: string) {
    const dinosaur = await this.getById(dinosaurId, userId);

    // 방생 시 DNA 획득 (레벨과 희귀도에 따라)
    const speciesData = resolveDinosaurSpecies(dinosaur);
    const rarityMultiplier = RARITY_REVENUE_MULTIPLIER[speciesData?.rarity || 'common'] || 1;
    const dnaReward = Math.floor(dinosaur.level * 5 * rarityMultiplier);

    await this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId);
      const stillOwned = await tx.dinosaur.findUnique({
        where: { id: dinosaurId },
        include: { park: { select: { safariLayout: true } } },
      });
      if (!stillOwned || stillOwned.parkId !== dinosaur.parkId)
        throw new BadRequestException('이미 방생한 공룡입니다.');
      if (safariContainsDinosaur(stillOwned.park?.safariLayout, dinosaurId))
        throw new BadRequestException('사파리에서 이 공룡을 대기로 옮긴 뒤 방생해주세요.');
      if (
        getSynthesisRecipe(FIRST_HYBRID_SPECIES_ID)?.parentSpeciesIds.includes(stillOwned.speciesId)
      ) {
        const where = {
          parkId: stillOwned.parkId,
          claimedAt: null,
          parentIds: { has: dinosaurId },
        };
        const [first, repeat] = await Promise.all([
          tx.firstSynthesisJob.findFirst({ where, select: { parkId: true } }),
          tx.repeatSynthesisJob.findFirst({ where, select: { parkId: true } }),
        ]);
        if (first || repeat)
          throw new BadRequestException('합성 결과를 수령한 뒤 원종을 방생할 수 있어요.');
      }
      const experiment = await tx.experimentalHybridJob.findFirst({
        where: { parkId: stillOwned.parkId, claimedAt: null, parentIds: { has: dinosaurId } },
        select: { id: true },
      });
      if (experiment)
        throw new BadRequestException('합성 결과를 수령한 뒤 원종을 방생할 수 있어요.');
      if (stillOwned.speciesId === FIRST_HYBRID_SPECIES_ID) {
        const synthesis = await tx.firstSynthesisJob.findFirst({
          where: { parkId: stillOwned.parkId, resultDinosaurId: dinosaurId, exhibitedAt: null },
          select: { parkId: true },
        });
        if (synthesis)
          throw new BadRequestException('첫 전시를 마친 뒤 이 공룡을 방생할 수 있어요.');
      }
      await tx.dinosaurCollection.upsert({
        where: { parkId_speciesId: { parkId: dinosaur.parkId, speciesId: dinosaur.speciesId } },
        create: {
          parkId: dinosaur.parkId,
          speciesId: dinosaur.speciesId,
          firstCollectedAt: dinosaur.createdAt,
        },
        update: {},
      });
      await tx.dinosaur.delete({ where: { id: dinosaurId } });
      await tx.currency.update({ where: { userId }, data: { dna: { increment: dnaReward } } });
    });

    return { released: true, dnaReward };
  }

  /**
   * 공룡 수익 계산
   */
  async calculateRevenue(dinosaurId: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
      include: { park: { select: careContext } },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    const currentState = this.calculateCurrentState(dinosaur, dinosaur.park);

    // A dinosaur attracts paying visitors; it never mints gold by itself.
    return {
      hourlyRevenue: 0,
      minuteRevenue: 0,
      popularity: resolveDinosaurSpecies(dinosaur)?.stats.popularity ?? 0,
      level: currentState.level,
      happiness: currentState.happiness,
      happinessMultiplier: Math.floor((0.5 + currentState.happiness / 200) * 100),
    };
  }

  /**
   * 시간에 따른 상태 변화 계산 (실제 DB 업데이트 X)
   */
  private calculateCurrentState(
    dinosaur: PersistedDinosaur,
    world?: DinosaurCareWorld,
    at = Date.now(),
  ) {
    const { careProgress, hybridSpecies, ...publicState } = dinosaur;
    const hybrid = readExperimentalHybridIdentity(hybridSpecies);
    const { happiness: currentHappiness, hunger: currentHunger } = currentDinosaurState(
      { ...publicState, careProgress, hybridSpecies },
      at,
      world,
    );

    // 경험치 필요량
    const expForNextLevel = getExpForDinoLevel(dinosaur.level);

    return {
      ...publicState,
      ...(hybrid ? { hybrid } : {}),
      competitiveStats: dinosaurCompetitiveStats(dinosaur),
      happiness: currentHappiness,
      hunger: currentHunger,
      expForNextLevel,
      // 상태 표시용
      happinessStatus:
        currentHappiness >= 80
          ? 'happy'
          : currentHappiness >= 50
            ? 'normal'
            : currentHappiness >= 20
              ? 'sad'
              : 'depressed',
      hungerStatus:
        currentHunger <= 20
          ? 'full'
          : currentHunger <= 50
            ? 'normal'
            : currentHunger <= 80
              ? 'hungry'
              : 'starving',
    };
  }
}
