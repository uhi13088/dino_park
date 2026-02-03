import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_PARK_LEVEL,
  INITIAL_GRID_SIZE,
  GRID_SIZE_PER_LEVEL,
  MAX_GRID_SIZE,
} from '@dino-park/shared';

/**
 * 파크 레벨별 필요 경험치 계산
 * 공식: 200 * level^1.8 (문서 기준)
 */
function getExpForParkLevel(level: number): number {
  return Math.floor(200 * Math.pow(level, 1.8));
}

/**
 * 파크 레벨에 따른 그리드 크기 계산
 */
function getGridSizeForLevel(level: number): number {
  const size = INITIAL_GRID_SIZE + (level - 1) * GRID_SIZE_PER_LEVEL;
  return Math.min(size, MAX_GRID_SIZE);
}

@Injectable()
export class ParkService {
  constructor(private readonly prisma: PrismaService) {}

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
      expForNextLevel: getExpForParkLevel(park.level),
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
      expForNextLevel: getExpForParkLevel(park.level),
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
  async addExp(parkId: string, expAmount: number): Promise<{
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
      const expNeeded = getExpForParkLevel(currentLevel);
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
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: {
        dinosaurs: {
          where: { isInPark: true },
          select: {
            id: true,
            speciesId: true,
            level: true,
            happiness: true,
          },
        },
        buildings: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            typeId: true,
            level: true,
          },
        },
      },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    // TODO: Phase 2.3에서 공룡별 수익 계산 연동
    // TODO: Phase 2.4에서 건물별 보너스 계산 연동
    // 현재는 기본 공식만 적용

    let totalRevenue = 0;
    let totalMaintenanceCost = 0;

    // 공룡 수익 (간단 계산 - 나중에 game-data 연동)
    for (const dino of park.dinosaurs) {
      const baseRevenue = 100; // 기본값, game-data에서 가져와야 함
      const happinessMultiplier = dino.happiness / 100;
      const levelMultiplier = 1 + (dino.level - 1) * 0.1;

      totalRevenue += Math.floor(baseRevenue * happinessMultiplier * levelMultiplier);
      totalMaintenanceCost += Math.floor(baseRevenue * 0.1); // 유지비 10%
    }

    // 건물 보너스 (간단 계산)
    const buildingBonus = park.buildings.length * 0.05; // 건물당 5% 보너스

    totalRevenue = Math.floor(totalRevenue * (1 + buildingBonus));

    return {
      grossRevenue: totalRevenue,
      maintenanceCost: totalMaintenanceCost,
      netRevenue: totalRevenue - totalMaintenanceCost,
      revenuePerMinute: Math.floor((totalRevenue - totalMaintenanceCost) / 60),
      dinosaurCount: park.dinosaurs.length,
      buildingCount: park.buildings.length,
      buildingBonus: Math.floor(buildingBonus * 100),
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
