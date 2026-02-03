import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BuildingStatus } from '@prisma/client';
import { MAX_BUILDING_LEVEL } from '@dino-park/shared';

/**
 * 건물 레벨별 업그레이드 비용
 * 공식: baseCost * (1.5 ^ (level - 1))
 */
function getUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.5, level - 1));
}

/**
 * 건물 레벨별 업그레이드 시간 (초)
 * 공식: baseTime * level
 */
function getUpgradeTime(baseTime: number, level: number): number {
  return baseTime * level;
}

/**
 * 건물 보너스 계산
 * 레벨에 따라 보너스 증가
 */
function calculateBuildingBonus(baseBonus: number, level: number): number {
  return baseBonus * (1 + (level - 1) * 0.2); // 레벨당 20% 증가
}

@Injectable()
export class BuildingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저의 건물 목록 조회
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    const buildings = await this.prisma.building.findMany({
      where: { parkId: park.id },
      orderBy: { createdAt: 'desc' },
    });

    return buildings.map((building) => this.enrichBuildingData(building));
  }

  /**
   * 건물 상세 조회
   */
  async getById(id: string, userId?: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        park: {
          select: { userId: true },
        },
      },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    if (userId && building.park.userId !== userId) {
      throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
    }

    return this.enrichBuildingData(building);
  }

  /**
   * 건물 건설
   */
  async construct(userId: string, typeId: string, positionX: number, positionY: number) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    // 위치 유효성 검사
    if (
      positionX < 0 ||
      positionY < 0 ||
      positionX >= park.gridSizeX ||
      positionY >= park.gridSizeY
    ) {
      throw new BadRequestException('유효하지 않은 위치입니다.');
    }

    // 중복 위치 검사
    const existingBuilding = await this.prisma.building.findFirst({
      where: {
        parkId: park.id,
        positionX,
        positionY,
      },
    });

    if (existingBuilding) {
      throw new BadRequestException('이미 건물이 있는 위치입니다.');
    }

    // TODO: game-data에서 건물 정보 가져오기
    const buildCost = 1000; // 기본 건설 비용
    const buildTimeSeconds = 60; // 기본 건설 시간 (1분)

    // 골드 차감
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.gold < buildCost) {
      throw new BadRequestException('골드가 부족합니다.');
    }

    // 트랜잭션으로 골드 차감 + 건물 생성
    const [, building] = await this.prisma.$transaction([
      this.prisma.currency.update({
        where: { userId },
        data: { gold: { decrement: buildCost } },
      }),
      this.prisma.building.create({
        data: {
          parkId: park.id,
          typeId,
          positionX,
          positionY,
          status: BuildingStatus.CONSTRUCTING,
        },
      }),
    ]);

    // 건설 완료 시간 계산
    const completesAt = new Date(Date.now() + buildTimeSeconds * 1000);

    return {
      ...building,
      goldSpent: buildCost,
      constructionTime: buildTimeSeconds,
      completesAt,
    };
  }

  /**
   * 건설/업그레이드 완료 체크
   */
  async checkCompletion(buildingId: string, userId: string) {
    const building = await this.getById(buildingId, userId);

    if (building.status === BuildingStatus.ACTIVE) {
      return { completed: true, building };
    }

    // TODO: 실제 타이머 구현 시 completesAt 필드 추가 필요
    // 현재는 즉시 완료 처리
    const updated = await this.prisma.building.update({
      where: { id: buildingId },
      data: { status: BuildingStatus.ACTIVE },
    });

    return {
      completed: true,
      building: this.enrichBuildingData(updated),
    };
  }

  /**
   * 건물 즉시 완료 (다이아 사용)
   */
  async instantComplete(buildingId: string, userId: string) {
    const building = await this.getById(buildingId, userId);

    if (building.status === BuildingStatus.ACTIVE) {
      throw new BadRequestException('이미 완료된 건물입니다.');
    }

    // 즉시 완료 비용 (다이아)
    const diamondCost = 10;

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.diamond < diamondCost) {
      throw new BadRequestException('다이아가 부족합니다.');
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.currency.update({
        where: { userId },
        data: { diamond: { decrement: diamondCost } },
      }),
      this.prisma.building.update({
        where: { id: buildingId },
        data: { status: BuildingStatus.ACTIVE },
      }),
    ]);

    return {
      ...this.enrichBuildingData(updated),
      diamondSpent: diamondCost,
    };
  }

  /**
   * 건물 업그레이드
   */
  async upgrade(buildingId: string, userId: string) {
    const building = await this.getById(buildingId, userId);

    if (building.status !== BuildingStatus.ACTIVE) {
      throw new BadRequestException('건설/업그레이드 중인 건물입니다.');
    }

    if (building.level >= MAX_BUILDING_LEVEL) {
      throw new BadRequestException('최대 레벨입니다.');
    }

    // TODO: game-data에서 건물 정보 가져오기
    const baseCost = 1000;
    const baseTime = 60;

    const upgradeCost = getUpgradeCost(baseCost, building.level + 1);
    const upgradeTime = getUpgradeTime(baseTime, building.level + 1);

    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.gold < upgradeCost) {
      throw new BadRequestException('골드가 부족합니다.');
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.currency.update({
        where: { userId },
        data: { gold: { decrement: upgradeCost } },
      }),
      this.prisma.building.update({
        where: { id: buildingId },
        data: {
          status: BuildingStatus.UPGRADING,
          level: { increment: 1 },
        },
      }),
    ]);

    const completesAt = new Date(Date.now() + upgradeTime * 1000);

    return {
      ...this.enrichBuildingData(updated),
      goldSpent: upgradeCost,
      upgradeTime,
      completesAt,
    };
  }

  /**
   * 위인 배치
   */
  async assignGreatFigure(buildingId: string, userId: string, greatFigureId: string) {
    const building = await this.getById(buildingId, userId);

    if (building.status !== BuildingStatus.ACTIVE) {
      throw new BadRequestException('건설/업그레이드 중인 건물입니다.');
    }

    // 위인 소유 확인
    const userGreatFigure = await this.prisma.userGreatFigure.findFirst({
      where: {
        id: greatFigureId,
        userId,
      },
    });

    if (!userGreatFigure) {
      throw new NotFoundException('보유하지 않은 위인입니다.');
    }

    // 이미 다른 건물에 배치되어 있는지 확인
    if (userGreatFigure.assignedBuildingId && userGreatFigure.assignedBuildingId !== buildingId) {
      throw new BadRequestException('이미 다른 건물에 배치된 위인입니다.');
    }

    // 기존 배치된 위인 해제 + 새 위인 배치
    await this.prisma.$transaction([
      // 기존 위인 해제
      this.prisma.userGreatFigure.updateMany({
        where: { assignedBuildingId: buildingId },
        data: { assignedBuildingId: null },
      }),
      // 새 위인 배치
      this.prisma.userGreatFigure.update({
        where: { id: greatFigureId },
        data: { assignedBuildingId: buildingId },
      }),
      // 건물에 위인 ID 저장
      this.prisma.building.update({
        where: { id: buildingId },
        data: { assignedGreatFigureId: greatFigureId },
      }),
    ]);

    return this.getById(buildingId, userId);
  }

  /**
   * 위인 해제
   */
  async unassignGreatFigure(buildingId: string, userId: string) {
    const building = await this.getById(buildingId, userId);

    if (!building.assignedGreatFigureId) {
      throw new BadRequestException('배치된 위인이 없습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.userGreatFigure.updateMany({
        where: { assignedBuildingId: buildingId },
        data: { assignedBuildingId: null },
      }),
      this.prisma.building.update({
        where: { id: buildingId },
        data: { assignedGreatFigureId: null },
      }),
    ]);

    return this.getById(buildingId, userId);
  }

  /**
   * 건물 이동
   */
  async move(buildingId: string, userId: string, positionX: number, positionY: number) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      include: { park: true },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    if (building.park.userId !== userId) {
      throw new ForbiddenException('이 건물에 접근할 권한이 없습니다.');
    }

    // 위치 유효성 검사
    if (
      positionX < 0 ||
      positionY < 0 ||
      positionX >= building.park.gridSizeX ||
      positionY >= building.park.gridSizeY
    ) {
      throw new BadRequestException('유효하지 않은 위치입니다.');
    }

    // 중복 위치 검사 (자기 자신 제외)
    const existingBuilding = await this.prisma.building.findFirst({
      where: {
        parkId: building.parkId,
        positionX,
        positionY,
        NOT: { id: buildingId },
      },
    });

    if (existingBuilding) {
      throw new BadRequestException('이미 건물이 있는 위치입니다.');
    }

    const updated = await this.prisma.building.update({
      where: { id: buildingId },
      data: { positionX, positionY },
    });

    return this.enrichBuildingData(updated);
  }

  /**
   * 건물 철거
   */
  async demolish(buildingId: string, userId: string) {
    const building = await this.getById(buildingId, userId);

    // 배치된 위인 해제
    if (building.assignedGreatFigureId) {
      await this.prisma.userGreatFigure.updateMany({
        where: { assignedBuildingId: buildingId },
        data: { assignedBuildingId: null },
      });
    }

    // 철거 시 골드 일부 환불 (50%)
    // TODO: game-data에서 건물 비용 가져오기
    const baseCost = 1000;
    let totalInvested = 0;
    for (let i = 1; i <= building.level; i++) {
      totalInvested += getUpgradeCost(baseCost, i);
    }
    const refund = Math.floor(totalInvested * 0.5);

    await this.prisma.$transaction([
      this.prisma.building.delete({
        where: { id: buildingId },
      }),
      this.prisma.currency.update({
        where: { userId },
        data: { gold: { increment: refund } },
      }),
    ]);

    return {
      demolished: true,
      goldRefund: refund,
    };
  }

  /**
   * 건물 보너스 계산
   */
  async calculateBonus(buildingId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    // TODO: game-data에서 건물 보너스 정보 가져오기
    const baseBonus = 5; // 기본 5% 보너스

    let bonus = calculateBuildingBonus(baseBonus, building.level);

    // 위인 배치 시 추가 보너스
    if (building.assignedGreatFigureId) {
      const greatFigure = await this.prisma.userGreatFigure.findUnique({
        where: { id: building.assignedGreatFigureId },
      });

      if (greatFigure) {
        // 위인 레벨에 따른 추가 보너스
        bonus += greatFigure.level * 2; // 위인 레벨당 2%
      }
    }

    return {
      buildingId,
      typeId: building.typeId,
      level: building.level,
      baseBonus,
      totalBonus: Math.floor(bonus),
      hasGreatFigure: !!building.assignedGreatFigureId,
    };
  }

  /**
   * 건물 데이터 보강 (추가 정보 계산)
   */
  private enrichBuildingData(building: any) {
    // TODO: game-data에서 건물 정보 가져오기
    const baseCost = 1000;
    const baseBonus = 5;

    const nextLevelCost =
      building.level < MAX_BUILDING_LEVEL ? getUpgradeCost(baseCost, building.level + 1) : null;

    const currentBonus = calculateBuildingBonus(baseBonus, building.level);

    return {
      ...building,
      currentBonus: Math.floor(currentBonus),
      nextLevelCost,
      maxLevel: MAX_BUILDING_LEVEL,
      isMaxLevel: building.level >= MAX_BUILDING_LEVEL,
    };
  }
}
