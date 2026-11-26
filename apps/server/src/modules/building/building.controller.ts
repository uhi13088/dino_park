import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BuildingService } from './building.service';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

class MovePositionDto {
  @ApiProperty({ description: 'X 좌표', example: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  positionX!: number;

  @ApiProperty({ description: 'Y 좌표', example: 15, minimum: 0 })
  @IsInt()
  @Min(0)
  positionY!: number;

  @ApiProperty({ description: '건물 외형 좌우 반전', type: Boolean, required: false })
  // Let validation see the original JSON value instead of coercing strings to true.
  @Type(() => Object)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsBoolean()
  isMirrored?: boolean;
}

class ConstructBuildingDto extends MovePositionDto {
  @ApiProperty({ description: '건물 타입 ID', example: 'food_stand_1' })
  @IsString()
  typeId!: string;
}

class ExhibitPlacementPreviewDto extends ConstructBuildingDto {
  @IsOptional()
  @IsString()
  dinosaurId?: string;
}

class AssignGreatFigureDto {
  @ApiProperty({ description: '위인 ID', example: 'great-figure-id-123' })
  @IsString()
  greatFigureId!: string;
}

class UpgradeBuildingDto {
  @IsOptional()
  @IsInt()
  @Min(2)
  targetLevel?: number;
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
          isMirrored: false,
          currentBonus: 7,
          nextLevelCost: 3375,
          isMaxLevel: false,
        },
      ],
    },
  })
  async getMyBuildings(@CurrentUser('id') userId: string) {
    const buildings = await this.buildingService.getByUserId(userId);
    return { buildings, total: buildings.length };
  }

  @Get('exhibit-placement-preview')
  async getExhibitPlacementPreview(
    @CurrentUser('id') userId: string,
    @Query() { typeId, positionX, positionY, dinosaurId }: ExhibitPlacementPreviewDto,
  ) {
    return this.buildingService.getExhibitPlacementPreview(
      userId,
      typeId,
      { x: positionX, y: positionY },
      dinosaurId,
    );
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
    return this.buildingService.construct(
      userId,
      dto.typeId,
      dto.positionX,
      dto.positionY,
      dto.isMirrored,
    );
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
  async upgradeBuilding(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto?: UpgradeBuildingDto,
  ) {
    return this.buildingService.upgrade(id, userId, dto?.targetLevel ?? undefined);
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
  @ApiOperation({ summary: '건물 위치 또는 외형 방향 변경' })
  async moveBuilding(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MovePositionDto,
  ) {
    return this.buildingService.move(id, userId, dto.positionX, dto.positionY, dto.isMirrored);
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
