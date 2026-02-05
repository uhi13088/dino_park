import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExplorationService } from './exploration.service';
import { IsString } from 'class-validator';

class StartExplorationDto {
  @IsString()
  regionId!: string;
}

@ApiTags('explorations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('explorations')
export class ExplorationController {
  constructor(private readonly explorationService: ExplorationService) {}

  /**
   * 탐험 지역 목록 조회
   */
  @Get('regions')
  @ApiOperation({ summary: '탐험 지역 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '탐험 지역 목록',
    schema: {
      example: [
        {
          id: 'grassland',
          name: '초원 지대',
          duration: 300,
          durationMinutes: 5,
          unlockLevel: 1,
          isUnlocked: true,
          possibleRewards: ['gold', 'egg_common', 'dna'],
        },
      ],
    },
  })
  async getRegions(@CurrentUser('id') userId: string) {
    return this.explorationService.getRegions(userId);
  }

  /**
   * 탐험 기록 조회
   */
  @Get()
  @ApiOperation({ summary: '탐험 기록 조회' })
  @ApiResponse({
    status: 200,
    description: '탐험 기록 목록',
  })
  async getMyExplorations(@CurrentUser('id') userId: string) {
    return this.explorationService.getByUserId(userId);
  }

  /**
   * 진행 중인 탐험 조회
   */
  @Get('in-progress')
  @ApiOperation({ summary: '진행 중인 탐험 조회' })
  @ApiResponse({
    status: 200,
    description: '진행 중인 탐험 목록',
    schema: {
      example: [
        {
          id: 'clx1234...',
          regionId: 'grassland',
          regionName: '초원 지대',
          status: 'IN_PROGRESS',
          startedAt: '2024-01-15T10:00:00Z',
          completesAt: '2024-01-15T10:05:00Z',
          remainingSeconds: 180,
          isComplete: false,
        },
      ],
    },
  })
  async getInProgressExplorations(@CurrentUser('id') userId: string) {
    return this.explorationService.getInProgress(userId);
  }

  /**
   * 탐험 시작
   */
  @Post()
  @ApiOperation({ summary: '탐험 시작 (에너지 5 소모)' })
  @ApiResponse({
    status: 201,
    description: '탐험 시작됨',
    schema: {
      example: {
        id: 'clx1234...',
        regionId: 'grassland',
        regionName: '초원 지대',
        status: 'IN_PROGRESS',
        duration: 300,
        completesAt: '2024-01-15T10:05:00Z',
        energyUsed: 5,
      },
    },
  })
  async startExploration(@CurrentUser('id') userId: string, @Body() dto: StartExplorationDto) {
    return this.explorationService.start(userId, dto.regionId);
  }

  /**
   * 탐험 완료 확인
   */
  @Post(':id/check')
  @ApiOperation({ summary: '탐험 완료 확인' })
  @ApiResponse({
    status: 200,
    description: '탐험 상태',
    schema: {
      example: {
        id: 'clx1234...',
        status: 'COMPLETED',
        completed: true,
        rewards: {
          gold: 120,
          dna: 5,
          egg: { type: 'common', hatchTime: 300 },
        },
      },
    },
  })
  async checkCompletion(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.explorationService.checkCompletion(id, userId);
  }

  /**
   * 탐험 즉시 완료 (다이아 사용)
   */
  @Post(':id/instant-complete')
  @ApiOperation({ summary: '탐험 즉시 완료 (남은 분당 1 다이아)' })
  @ApiResponse({
    status: 200,
    description: '즉시 완료됨',
    schema: {
      example: {
        id: 'clx1234...',
        status: 'COMPLETED',
        diamondSpent: 3,
        rewards: {
          gold: 120,
          dna: 5,
        },
      },
    },
  })
  async instantComplete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.explorationService.instantComplete(id, userId);
  }

  /**
   * 탐험 보상 수령
   */
  @Post(':id/claim')
  @ApiOperation({ summary: '탐험 보상 수령' })
  @ApiResponse({
    status: 200,
    description: '보상 수령 완료',
    schema: {
      example: {
        claimed: true,
        rewards: {
          gold: 120,
          dna: 5,
          egg: { type: 'common', hatchTime: 300 },
        },
      },
    },
  })
  async claimRewards(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.explorationService.claim(id, userId);
  }
}
