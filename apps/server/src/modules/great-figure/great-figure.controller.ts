import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GreatFigureService } from './great-figure.service';

// DTO 정의
class AddExpDto {
  @ApiProperty({ description: '추가할 경험치', example: 100 })
  amount!: number;
}

@ApiTags('great-figures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('great-figures')
export class GreatFigureController {
  constructor(private readonly greatFigureService: GreatFigureService) {}

  // ================================================================
  // 조회 API
  // ================================================================

  @Get()
  @ApiOperation({ summary: '내 위인 목록 조회' })
  async getMyGreatFigures(@CurrentUser('id') userId: string) {
    return this.greatFigureService.getByUserId(userId);
  }

  @Get('available')
  @ApiOperation({ summary: '영입 가능한 위인 목록 조회' })
  async getAvailableFigures(@CurrentUser('id') userId: string) {
    return this.greatFigureService.getAvailableFigures(userId);
  }

  @Get('assigned')
  @ApiOperation({ summary: '건물에 배정된 위인 목록 조회' })
  async getAssignedFigures(@CurrentUser('id') userId: string) {
    return this.greatFigureService.getAssignedFigures(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: '위인 통계 조회' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.greatFigureService.getStats(userId);
  }

  @Get('points')
  @ApiOperation({ summary: '위인 포인트 조회 (영입 재화)' })
  async getPoints(@CurrentUser('id') userId: string) {
    // 위인 영입에 사용되는 포인트/재화 정보
    const stats = await this.greatFigureService.getStats(userId);
    return {
      totalFigures: stats.owned,
      totalAvailable: stats.totalAvailable,
      availablePoints: 0,
      pointsToNextRecruitment: 100,
    };
  }

  @Get(':figureId')
  @ApiOperation({ summary: '특정 위인 상세 조회' })
  @ApiParam({ name: 'figureId', description: '위인 ID (darwin, einstein 등)' })
  async getGreatFigure(@Param('figureId') figureId: string, @CurrentUser('id') userId: string) {
    return this.greatFigureService.getById(userId, figureId);
  }

  @Get(':figureId/synergies')
  @ApiOperation({ summary: '위인의 활성화된 시너지 조회' })
  @ApiParam({ name: 'figureId', description: '위인 ID' })
  async getSynergies(@Param('figureId') figureId: string, @CurrentUser('id') userId: string) {
    return this.greatFigureService.calculateActiveSynergies(userId, figureId);
  }

  // ================================================================
  // 영입 API
  // ================================================================

  @Post(':figureId/recruit')
  @ApiOperation({ summary: '위인 영입' })
  @ApiParam({ name: 'figureId', description: '영입할 위인 ID' })
  async recruitGreatFigure(@Param('figureId') figureId: string, @CurrentUser('id') userId: string) {
    return this.greatFigureService.recruit(userId, figureId);
  }

  // ================================================================
  // 배정 API
  // ================================================================

  @Post(':figureId/assign/:buildingId')
  @ApiOperation({ summary: '위인을 건물에 배정' })
  @ApiParam({ name: 'figureId', description: '배정할 위인 ID' })
  @ApiParam({ name: 'buildingId', description: '배정 대상 건물 ID' })
  async assignToBuilding(
    @Param('figureId') figureId: string,
    @Param('buildingId') buildingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.greatFigureService.assignToBuilding(userId, figureId, buildingId);
  }

  @Post(':figureId/unassign')
  @ApiOperation({ summary: '위인 배정 해제' })
  @ApiParam({ name: 'figureId', description: '배정 해제할 위인 ID' })
  async unassignFromBuilding(
    @Param('figureId') figureId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.greatFigureService.unassignFromBuilding(userId, figureId);
  }

  // ================================================================
  // 성장 API
  // ================================================================

  @Post(':figureId/exp')
  @ApiOperation({ summary: '위인 경험치 추가' })
  @ApiParam({ name: 'figureId', description: '위인 ID' })
  @ApiBody({ type: AddExpDto })
  async addExp(
    @Param('figureId') figureId: string,
    @CurrentUser('id') userId: string,
    @Body() body: AddExpDto,
  ) {
    return this.greatFigureService.addExp(userId, figureId, body.amount);
  }

  @Post(':figureId/levelup')
  @ApiOperation({ summary: '골드로 위인 레벨업' })
  @ApiParam({ name: 'figureId', description: '위인 ID' })
  async levelUpWithGold(@Param('figureId') figureId: string, @CurrentUser('id') userId: string) {
    return this.greatFigureService.levelUpWithGold(userId, figureId);
  }

  // ================================================================
  // 건물 보너스 API
  // ================================================================

  @Get('buildings/:buildingId/bonuses')
  @ApiOperation({ summary: '건물에 적용되는 위인 보너스 계산' })
  @ApiParam({ name: 'buildingId', description: '건물 ID' })
  async getBuildingBonuses(
    @Param('buildingId') buildingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.greatFigureService.calculateBuildingBonuses(userId, buildingId);
  }
}
