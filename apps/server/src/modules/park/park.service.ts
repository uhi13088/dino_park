import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Building } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { STARTER_PARK } from '@dino-park/game-data';
import { ParkOperationsService } from './park-operations.service';
import {
  admissionSnapshot,
  buildingSize,
  entranceExit,
  type AdmissionWorld,
  type Tile,
} from './park-admission.logic';
import type { StarterParkResponse } from '@dino-park/shared';
import { safariReservedTiles } from './park-safari-state';
import {
  MAX_PARK_LEVEL,
  getParkLevelExperience,
  INITIAL_GRID_SIZE,
  GRID_SIZE_PER_LEVEL,
  MAX_GRID_SIZE,
  PARK_ADMISSION,
} from '@dino-park/shared';

/**
 * 파크 레벨에 따른 그리드 크기 계산
 */
function getGridSizeForLevel(level: number): number {
  const size = INITIAL_GRID_SIZE + (level - 1) * GRID_SIZE_PER_LEVEL;
  return Math.min(size, MAX_GRID_SIZE);
}

@Injectable()
export class ParkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  async claimStarter(userId: string): Promise<StarterParkResponse> {
    return this.prisma.$transaction(async (tx) => {
      // Use the same park lock as construction so two loads cannot restore two gates.
      await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${userId} FOR UPDATE`;
      const park = await tx.park.findUnique({
        where: { userId },
        include: { dinosaurs: true, buildings: true },
      });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');

      // Unique receipt serializes concurrent claims; a failed grant rolls it back too.
      const receipt = await tx.storyFlag.createMany({
        data: { userId, flagId: STARTER_PARK.receiptFlag, value: true },
        skipDuplicates: true,
      });
      if (park.dinosaurs.length || park.buildings.length) {
        const entrance = this.legacyEntrance(park);
        if (entrance) {
          await tx.building.create({
            data: {
              parkId: park.id,
              typeId: entrance.typeId,
              positionX: entrance.positionX,
              positionY: entrance.positionY,
            },
          });
        }
        return { granted: false };
      }
      if (!receipt.count) return { granted: false };

      const dinosaur = await tx.dinosaur.create({
        data: { parkId: park.id, ...STARTER_PARK.dinosaur },
      });
      await tx.dinosaurCollection.upsert({
        where: { parkId_speciesId: { parkId: park.id, speciesId: dinosaur.speciesId } },
        create: {
          parkId: park.id,
          speciesId: dinosaur.speciesId,
          firstCollectedAt: dinosaur.createdAt,
        },
        update: {},
      });
      await tx.building.createMany({
        data: STARTER_PARK.buildings.map((building) => ({ parkId: park.id, ...building })),
      });
      return { granted: true };
    });
  }

  private legacyEntrance(park: AdmissionWorld & { id: string }): Building | undefined {
    const entranceType = PARK_ADMISSION.entranceTypeId;
    if (park.buildings.some(({ typeId }) => typeId === entranceType)) return;
    const { width, height } = buildingSize({ typeId: entranceType });
    const right = park.gridSizeX - width;
    const bottom = park.gridSizeY - height;
    if (right < 0 || bottom < 0) return;

    const candidates: Tile[] = [];
    for (let x = 0; x <= right; x++) candidates.push({ x, y: bottom }, { x, y: 0 });
    for (let y = 1; y < bottom; y++) candidates.push({ x: right, y }, { x: 0, y });
    const now = new Date();
    const hasExhibit = park.dinosaurs.some(({ isInPark }) => isInPark);
    let fallback: Building | undefined;
    for (const { x, y } of candidates) {
      if (!this.operations.positionFree(park, null, x, y, entranceType)) continue;
      const entrance: Building = {
        id: 'legacy-entrance-preview',
        parkId: park.id,
        typeId: entranceType,
        level: 1,
        positionX: x,
        positionY: y,
        entranceSide: null,
        isMirrored: false,
        status: 'ACTIVE',
        assignedGreatFigureId: null,
        completesAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const exit = entranceExit(entrance, park);
      if (!exit || !this.operations.positionFree(park, null, exit.x, exit.y)) continue;
      if (
        !hasExhibit ||
        admissionSnapshot({ ...park, buildings: [...park.buildings, entrance] }, now.getTime())
          .demand > 0
      )
        return entrance;
      fallback ??= entrance;
    }
    return fallback;
  }

  /**
   * 유저 ID로 파크 조회
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: {
        dinosaurs: {
          orderBy: { createdAt: 'desc' },
        },
        buildings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    return {
      ...park,
      expForNextLevel: getParkLevelExperience(park.level),
      maxGridSize: getGridSizeForLevel(park.level),
    };
  }

  /**
   * 파크 요약 정보 (메인 화면용)
   */
  async getSummary(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { dinosaurs: true, buildings: true },
        },
      },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    return {
      id: park.id,
      name: park.name,
      level: park.level,
      exp: park.exp,
      expForNextLevel: getParkLevelExperience(park.level),
      gridSizeX: park.gridSizeX,
      gridSizeY: park.gridSizeY,
      dinosaurCount: park._count.dinosaurs,
      buildingCount: park._count.buildings,
    };
  }

  /**
   * 파크 이름 변경
   */
  async rename(userId: string, name: string) {
    if (!name || name.length < 2 || name.length > 20) {
      throw new BadRequestException('파크 이름은 2~20자여야 합니다.');
    }

    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    return this.prisma.park.update({
      where: { id: park.id },
      data: { name },
      select: { id: true, name: true },
    });
  }

  /**
   * 파크 경험치 추가 및 레벨업 처리
   */
  async addExp(
    parkId: string,
    expAmount: number,
  ): Promise<{
    exp: number;
    level: number;
    leveledUp: boolean;
    newLevel?: number;
    gridExpanded?: boolean;
    newGridSize?: { x: number; y: number };
  }> {
    const park = await this.prisma.park.findUnique({
      where: { id: parkId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    let currentExp = park.exp + expAmount;
    let currentLevel = park.level;
    let leveledUp = false;
    let gridExpanded = false;
    let newGridSize: { x: number; y: number } | undefined;

    // 레벨업 체크
    while (currentLevel < MAX_PARK_LEVEL) {
      const expNeeded = getParkLevelExperience(currentLevel);
      if (currentExp >= expNeeded) {
        currentExp -= expNeeded;
        currentLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    // 최대 레벨 도달 시
    if (currentLevel >= MAX_PARK_LEVEL) {
      currentExp = 0;
    }

    // 레벨업 시 그리드 확장
    let gridSizeX = park.gridSizeX;
    let gridSizeY = park.gridSizeY;

    if (leveledUp) {
      const newSize = getGridSizeForLevel(currentLevel);
      if (newSize > gridSizeX) {
        gridSizeX = newSize;
        gridSizeY = newSize;
        gridExpanded = true;
        newGridSize = { x: gridSizeX, y: gridSizeY };
      }
    }

    const updated = await this.prisma.park.update({
      where: { id: parkId },
      data: {
        exp: currentExp,
        level: currentLevel,
        gridSizeX,
        gridSizeY,
      },
    });

    return {
      exp: updated.exp,
      level: updated.level,
      leveledUp,
      newLevel: leveledUp ? currentLevel : undefined,
      gridExpanded,
      newGridSize,
    };
  }

  /**
   * 파크 수익 계산 (현재 배치된 공룡 + 건물 기준)
   */
  async calculateRevenue(userId: string) {
    const state = await this.operations.getOperations(userId, false);
    const grossRevenue = state.visitorsPerMinute * 60 * state.ticketPrice;
    return {
      grossRevenue,
      maintenanceCost: state.hourlyMaintenance,
      netRevenue: grossRevenue - state.hourlyMaintenance,
      revenuePerMinute: (grossRevenue - state.hourlyMaintenance) / 60,
      buildingBonus: 0,
      ticketPrice: state.ticketPrice,
      totalVisitors: state.totalVisitors,
      totalAdmissionGold: state.totalAdmissionGold,
    };
  }

  /**
   * 그리드 위치 유효성 검사
   */
  async isValidPosition(
    userId: string,
    positionX: number,
    positionY: number,
    width: number = 1,
    height: number = 1,
  ): Promise<boolean> {
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: {
        dinosaurs: {
          where: { isInPark: true },
          select: { positionX: true, positionY: true },
        },
        buildings: {
          select: { positionX: true, positionY: true },
        },
      },
    });

    if (!park) {
      return false;
    }

    // 그리드 범위 체크
    if (
      positionX < 0 ||
      positionY < 0 ||
      positionX + width > park.gridSizeX ||
      positionY + height > park.gridSizeY
    ) {
      return false;
    }

    // 다른 오브젝트와 겹치는지 체크 (단순화된 버전)
    // TODO: 오브젝트 크기를 고려한 충돌 체크 구현
    const occupiedPositions = new Set<string>();
    safariReservedTiles(park.safariLayout).forEach(({ x, y }) =>
      occupiedPositions.add(`${x},${y}`),
    );

    for (const dino of park.dinosaurs) {
      occupiedPositions.add(`${dino.positionX},${dino.positionY}`);
    }

    for (const building of park.buildings) {
      occupiedPositions.add(`${building.positionX},${building.positionY}`);
    }

    // 배치하려는 영역 체크
    for (let x = positionX; x < positionX + width; x++) {
      for (let y = positionY; y < positionY + height; y++) {
        if (occupiedPositions.has(`${x},${y}`)) {
          return false;
        }
      }
    }

    return true;
  }
}
