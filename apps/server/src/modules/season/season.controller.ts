import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SeasonService } from './season.service';

@ApiTags('seasons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get('current')
  @ApiOperation({ summary: '현재 시즌 정보 조회' })
  async getCurrentSeason() {
    return this.seasonService.getCurrentSeason();
  }

  @Get('pass')
  @ApiOperation({ summary: '내 시즌 패스 정보 조회' })
  async getMySeasonPass(@CurrentUser('id') userId: string) {
    return this.seasonService.getSeasonPass(userId);
  }

  @Post('pass/claim/:level')
  @ApiOperation({ summary: '시즌 패스 보상 수령' })
  async claimReward(@CurrentUser('id') userId: string, @Param('level') level: number) {
    return this.seasonService.claimReward(userId, level);
  }
}
