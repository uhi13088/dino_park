import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
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
import { SeasonService } from './season.service';

// DTO 정의
class AddExpDto {
  @ApiProperty({ description: '추가할 시즌 경험치', example: 50 })
  exp!: number;
}

@ApiTags('seasons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  // ================================================================
  // 시즌 정보 조회
  // ================================================================

  @Get('current')
  @ApiOperation({ summary: '현재 시즌 정보 조회' })
  async getCurrentSeason() {
    return this.seasonService.getCurrentSeason();
  }

  @Get('all')
  @ApiOperation({ summary: '모든 시즌 목록 조회' })
  async getAllSeasons() {
    return this.seasonService.getAllSeasons();
  }

  @Get(':seasonId/details')
  @ApiOperation({ summary: '특정 시즌 상세 정보 조회' })
  @ApiParam({ name: 'seasonId', description: '시즌 ID' })
  async getSeasonDetails(@Param('seasonId') seasonId: string) {
    return this.seasonService.getSeasonDetails(seasonId);
  }

  // ================================================================
  // 시즌 패스
  // ================================================================

  @Get('pass')
  @ApiOperation({ summary: '내 시즌 패스 정보 조회 (현재 시즌)' })
  async getMySeasonPass(@CurrentUser('id') userId: string) {
    return this.seasonService.getSeasonPass(userId);
  }

  @Get(':seasonId/pass')
  @ApiOperation({ summary: '특정 시즌의 시즌 패스 조회' })
  @ApiParam({ name: 'seasonId', description: '시즌 ID' })
  async getSeasonPassById(@Param('seasonId') seasonId: string, @CurrentUser('id') userId: string) {
    return this.seasonService.getSeasonPass(userId, seasonId);
  }

  @Post('pass/exp')
  @ApiOperation({ summary: '시즌 경험치 추가' })
  @ApiBody({ type: AddExpDto })
  async addSeasonExp(@CurrentUser('id') userId: string, @Body() body: AddExpDto) {
    return this.seasonService.addSeasonExp(userId, body.exp);
  }

  @Post('pass/claim/free/:level')
  @ApiOperation({ summary: '무료 보상 수령' })
  @ApiParam({ name: 'level', description: '보상 레벨' })
  async claimFreeReward(
    @CurrentUser('id') userId: string,
    @Param('level', ParseIntPipe) level: number,
  ) {
    return this.seasonService.claimFreeReward(userId, level);
  }

  @Post('pass/claim/premium/:level')
  @ApiOperation({ summary: '프리미엄 보상 수령' })
  @ApiParam({ name: 'level', description: '보상 레벨' })
  async claimPremiumReward(
    @CurrentUser('id') userId: string,
    @Param('level', ParseIntPipe) level: number,
  ) {
    return this.seasonService.claimPremiumReward(userId, level);
  }

  @Post('pass/claim/all')
  @ApiOperation({ summary: '모든 수령 가능한 보상 일괄 수령' })
  async claimAllRewards(@CurrentUser('id') userId: string) {
    return this.seasonService.claimAllRewards(userId);
  }

  @Post('pass/upgrade')
  @ApiOperation({ summary: '프리미엄 패스 업그레이드' })
  async upgradeToPremium(@CurrentUser('id') userId: string) {
    return this.seasonService.upgradeToPremium(userId);
  }

  // 레거시 API (하위 호환)
  @Post('pass/claim/:level')
  @ApiOperation({ summary: '시즌 패스 보상 수령 (레거시)' })
  @ApiParam({ name: 'level', description: '보상 레벨' })
  async claimReward(
    @CurrentUser('id') userId: string,
    @Param('level', ParseIntPipe) level: number,
  ) {
    return this.seasonService.claimReward(userId, level);
  }

  // ================================================================
  // 시즌 챕터
  // ================================================================

  @Get('chapters')
  @ApiOperation({ summary: '현재 시즌 챕터 목록 조회' })
  async getSeasonChapters(@CurrentUser('id') userId: string) {
    return this.seasonService.getSeasonChapters(userId);
  }

  @Get(':seasonId/chapters')
  @ApiOperation({ summary: '특정 시즌 챕터 목록 조회' })
  @ApiParam({ name: 'seasonId', description: '시즌 ID' })
  async getSeasonChaptersById(
    @Param('seasonId') seasonId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.seasonService.getSeasonChapters(userId, seasonId);
  }

  @Get('chapters/:chapterId')
  @ApiOperation({ summary: '시즌 챕터 상세 조회' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  async getSeasonChapterDetail(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.seasonService.getSeasonChapterDetail(userId, chapterId);
  }

  @Post('chapters/:chapterId/complete')
  @ApiOperation({ summary: '시즌 챕터 완료' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  async completeSeasonChapter(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.seasonService.completeSeasonChapter(userId, chapterId);
  }

  // ================================================================
  // 시즌 이벤트
  // ================================================================

  @Get('events')
  @ApiOperation({ summary: '현재 활성화된 시즌 이벤트 조회' })
  async getActiveEvents() {
    return this.seasonService.getActiveEvents();
  }

  @Get(':seasonId/events')
  @ApiOperation({ summary: '특정 시즌의 이벤트 조회' })
  @ApiParam({ name: 'seasonId', description: '시즌 ID' })
  async getSeasonEvents(@Param('seasonId') seasonId: string) {
    return this.seasonService.getActiveEvents(seasonId);
  }

  // ================================================================
  // 통계
  // ================================================================

  @Get('stats')
  @ApiOperation({ summary: '내 시즌 통계 조회' })
  async getSeasonStats(@CurrentUser('id') userId: string) {
    return this.seasonService.getSeasonStats(userId);
  }

  @Get(':seasonId/stats')
  @ApiOperation({ summary: '특정 시즌의 통계 조회' })
  @ApiParam({ name: 'seasonId', description: '시즌 ID' })
  async getSeasonStatsById(@Param('seasonId') seasonId: string, @CurrentUser('id') userId: string) {
    return this.seasonService.getSeasonStats(userId, seasonId);
  }
}
