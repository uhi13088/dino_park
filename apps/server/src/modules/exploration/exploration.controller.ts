import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExplorationService } from './exploration.service';

@ApiTags('explorations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('explorations')
export class ExplorationController {
  constructor(private readonly explorationService: ExplorationService) {}

  @Get()
  @ApiOperation({ summary: '탐험 기록 조회' })
  async getMyExplorations(@CurrentUser('id') userId: string) {
    return this.explorationService.getByUserId(userId);
  }

  @Post()
  @ApiOperation({ summary: '탐험 시작' })
  async startExploration(
    @CurrentUser('id') userId: string,
    @Body('regionId') regionId: string,
  ) {
    return this.explorationService.start(userId, regionId);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: '탐험 보상 수령' })
  async claimRewards(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.explorationService.claim(id, userId);
  }
}
