import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BuildingService } from './building.service';
import { IsString, IsNumber, Min } from 'class-validator';

class ConstructBuildingDto {
  @IsString()
  typeId: string;

  @IsNumber()
  @Min(0)
  positionX: number;

  @IsNumber()
  @Min(0)
  positionY: number;
}

class MovePositionDto {
  @IsNumber()
  @Min(0)
  positionX: number;

  @IsNumber()
  @Min(0)
  positionY: number;
}

class AssignGreatFigureDto {
  @IsString()
  greatFigureId: string;
}

@ApiTags('buildings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  /**
   * 내 건물 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '내 건물 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '건물 목록',
    schema: {
      example: [
        {
          id: 'clx1234...',
          typeId: 'visitor_center',
          level: 3,
          status: 'ACTIVE',
          positionX: 5,
          positionY: 10,
          currentBonus: 7,
          nextLevelCost: 3375,
          isMaxLevel: false,
        },
      ],
    },
  })
  async getMyBuildings(@CurrentUser('id') userId: string) {
    return this.buildingService.getByUserId(userId);
  }

  /**
   * 건물 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '건물 상세 조회' })
  async getBuilding(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingService.getById(id, userId);
  }

  /**
   * 건물 보너스 정보 조회
   */
  @Get(':id/bonus')
  @ApiOperation({ summary: '건물 보너스 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '건물 보너스 정보',
    schema: {
      example: {
        buildingId: 'clx1234...',
        typeId: 'visitor_center',
        level: 3,
        baseBonus: 5,
        totalBonus: 11,
        hasGreatFigure: true,
      },
    },
  })
  async getBuildingBonus(@Param('id') id: string) {
    return this.buildingService.calculateBonus(id);
  }

  /**
   * 건물 건설
   */
  @Post()
  @ApiOperation({ summary: '건물 건설' })
  @ApiResponse({
    status: 201,
    description: '건설 시작',
    schema: {
      example: {
        id: 'clx1234...',
        typeId: 'visitor_center',
        status: 'CONSTRUCTING',
        goldSpent: 1000,
        constructionTime: 60,
        completesAt: '2024-01-15T10:01:00Z',
      },
    },
  })
  async constructBuilding(@CurrentUser('id') userId: string, @Body() dto: ConstructBuildingDto) {
    return this.buildingService.construct(userId, dto.typeId, dto.positionX, dto.positionY);
  }

  /**
   * 건설/업그레이드 완료 확인
   */
  @Post(':id/complete')
  @ApiOperation({ summary: '건설/업그레이드 완료 확인' })
  async checkCompletion(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingService.checkCompletion(id, userId);
  }

  /**
   * 건설/업그레이드 즉시 완료 (다이아 사용)
   */
  @Post(':id/instant-complete')
  @ApiOperation({ summary: '즉시 완료 (다이아 10 소모)' })
  @ApiResponse({
    status: 200,
    description: '즉시 완료',
    schema: {
      example: {
        id: 'clx1234...',
        status: 'ACTIVE',
        diamondSpent: 10,
      },
    },
  })
  async instantComplete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingService.instantComplete(id, userId);
  }

  /**
   * 건물 업그레이드
   */
  @Post(':id/upgrade')
  @ApiOperation({ summary: '건물 업그레이드' })
  @ApiResponse({
    status: 200,
    description: '업그레이드 시작',
    schema: {
      example: {
        id: 'clx1234...',
        level: 4,
        status: 'UPGRADING',
        goldSpent: 5062,
        upgradeTime: 240,
        completesAt: '2024-01-15T10:04:00Z',
      },
    },
  })
  async upgradeBuilding(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingService.upgrade(id, userId);
  }

  /**
   * 위인 배치
   */
  @Post(':id/assign-figure')
  @ApiOperation({ summary: '건물에 위인 배치' })
  async assignGreatFigure(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AssignGreatFigureDto,
  ) {
    return this.buildingService.assignGreatFigure(id, userId, dto.greatFigureId);
  }

  /**
   * 위인 해제
   */
  @Post(':id/unassign-figure')
  @ApiOperation({ summary: '건물에서 위인 해제' })
  async unassignGreatFigure(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingService.unassignGreatFigure(id, userId);
  }

  /**
   * 건물 이동
   */
  @Patch(':id/position')
  @ApiOperation({ summary: '건물 위치 이동' })
  async moveBuilding(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MovePositionDto,
  ) {
    return this.buildingService.move(id, userId, dto.positionX, dto.positionY);
  }

  /**
   * 건물 철거
   */
  @Delete(':id')
  @ApiOperation({ summary: '건물 철거 (투자금 50% 환불)' })
  @ApiResponse({
    status: 200,
    description: '철거 완료',
    schema: {
      example: {
        demolished: true,
        goldRefund: 2500,
      },
    },
  })
  async demolishBuilding(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingService.demolish(id, userId);
  }
}
