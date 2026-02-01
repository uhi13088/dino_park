import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParkService } from './park.service';
import { IsString, MinLength, MaxLength } from 'class-validator';

class RenameParkDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name: string;
}

@ApiTags('parks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parks')
export class ParkController {
  constructor(private readonly parkService: ParkService) {}

  /**
   * 내 파크 전체 조회 (공룡, 건물 포함)
   */
  @Get('me')
  @ApiOperation({ summary: '내 파크 조회 (전체)' })
  @ApiResponse({
    status: 200,
    description: '파크 전체 정보 (공룡, 건물 포함)',
    schema: {
      example: {
        id: 'clx1234...',
        name: '멋진 공룡 파크',
        level: 5,
        exp: 800,
        expForNextLevel: 1520,
        gridSizeX: 28,
        gridSizeY: 28,
        maxGridSize: 28,
        dinosaurs: [{ id: '...', speciesId: 'triceratops', level: 3 }],
        buildings: [{ id: '...', typeId: 'visitor_center', level: 2 }],
      },
    },
  })
  async getMyPark(@CurrentUser('id') userId: string) {
    return this.parkService.getByUserId(userId);
  }

  /**
   * 내 파크 요약 조회 (메인 화면용)
   */
  @Get('me/summary')
  @ApiOperation({ summary: '내 파크 요약 조회' })
  @ApiResponse({
    status: 200,
    description: '파크 요약 정보',
    schema: {
      example: {
        id: 'clx1234...',
        name: '멋진 공룡 파크',
        level: 5,
        exp: 800,
        expForNextLevel: 1520,
        gridSizeX: 28,
        gridSizeY: 28,
        dinosaurCount: 12,
        buildingCount: 8,
      },
    },
  })
  async getParkSummary(@CurrentUser('id') userId: string) {
    return this.parkService.getSummary(userId);
  }

  /**
   * 파크 이름 변경
   */
  @Patch('me/name')
  @ApiOperation({ summary: '파크 이름 변경' })
  @ApiResponse({ status: 200, description: '이름 변경 완료' })
  async renamePark(
    @CurrentUser('id') userId: string,
    @Body() dto: RenameParkDto,
  ) {
    return this.parkService.rename(userId, dto.name);
  }

  /**
   * 파크 수익 정보 조회
   */
  @Get('me/revenue')
  @ApiOperation({ summary: '파크 수익 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '파크 수익 정보',
    schema: {
      example: {
        grossRevenue: 15000,
        maintenanceCost: 1500,
        netRevenue: 13500,
        revenuePerMinute: 225,
        dinosaurCount: 12,
        buildingCount: 8,
        buildingBonus: 40,
      },
    },
  })
  async getParkRevenue(@CurrentUser('id') userId: string) {
    return this.parkService.calculateRevenue(userId);
  }
}
