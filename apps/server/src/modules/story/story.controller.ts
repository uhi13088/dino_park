import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StoryService } from './story.service';

// DTO 정의
class MakeChoiceDto {
  choiceId!: string;
}

class AdvanceSceneDto {
  nextSceneId?: string;
}

@ApiTags('stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  // ================================================================
  // 스토리 진행 조회
  // ================================================================

  @Get('progress')
  @ApiOperation({ summary: '스토리 진행 상황 조회' })
  async getProgress(@CurrentUser('id') userId: string) {
    return this.storyService.getProgress(userId);
  }

  @Get('chapters')
  @ApiOperation({ summary: '모든 챕터 목록 조회 (해금 여부 포함)' })
  async getAvailableChapters(@CurrentUser('id') userId: string) {
    return this.storyService.getAvailableChapters(userId);
  }

  @Get('chapters/:chapterId')
  @ApiOperation({ summary: '특정 챕터 진행 상황 조회' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  async getChapterProgress(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.getChapterProgress(userId, chapterId);
  }

  @Get('stats')
  @ApiOperation({ summary: '스토리 통계 조회' })
  async getStoryStats(@CurrentUser('id') userId: string) {
    return this.storyService.getStoryStats(userId);
  }

  // ================================================================
  // 챕터 진행
  // ================================================================

  @Post('chapters/:chapterId/start')
  @ApiOperation({ summary: '챕터 시작' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  async startChapter(@Param('chapterId') chapterId: string, @CurrentUser('id') userId: string) {
    return this.storyService.startChapter(userId, chapterId);
  }

  @Post('chapters/:chapterId/advance')
  @ApiOperation({ summary: '다음 씬으로 진행' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  @ApiBody({ type: AdvanceSceneDto, required: false })
  async advanceScene(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @Body() body?: AdvanceSceneDto,
  ) {
    return this.storyService.advanceScene(userId, chapterId, body?.nextSceneId);
  }

  @Post(':chapterId/choice')
  @ApiOperation({ summary: '스토리 선택지 선택' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  @ApiBody({ type: MakeChoiceDto })
  async makeChoice(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @Body() body: MakeChoiceDto,
  ) {
    return this.storyService.makeChoice(userId, chapterId, body.choiceId);
  }

  @Post('chapters/:chapterId/complete')
  @ApiOperation({ summary: '챕터 완료 처리 (레거시)' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  async completeChapter(@Param('chapterId') chapterId: string, @CurrentUser('id') userId: string) {
    return this.storyService.completeChapter(userId, chapterId);
  }

  // ================================================================
  // 보상
  // ================================================================

  @Post('chapters/:chapterId/rewards')
  @ApiOperation({ summary: '챕터 보상 수령' })
  @ApiParam({ name: 'chapterId', description: '챕터 ID' })
  async claimChapterRewards(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.claimChapterRewards(userId, chapterId);
  }

  // ================================================================
  // 캐릭터 호감도
  // ================================================================

  @Get('characters')
  @ApiOperation({ summary: '모든 캐릭터 호감도 조회' })
  async getAllCharacterAffinities(@CurrentUser('id') userId: string) {
    return this.storyService.getAllCharacterAffinities(userId);
  }

  @Get('characters/:characterId')
  @ApiOperation({ summary: '특정 캐릭터 호감도 조회' })
  @ApiParam({ name: 'characterId', description: '캐릭터 ID (jin, olivia, marco 등)' })
  async getCharacterAffinity(
    @Param('characterId') characterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.getCharacterAffinity(userId, characterId);
  }

  // ================================================================
  // 스토리 플래그
  // ================================================================

  @Get('flags')
  @ApiOperation({ summary: '모든 스토리 플래그 조회' })
  async getAllStoryFlags(@CurrentUser('id') userId: string) {
    return this.storyService.getAllStoryFlags(userId);
  }

  @Get('flags/:flagId')
  @ApiOperation({ summary: '특정 스토리 플래그 조회' })
  @ApiParam({ name: 'flagId', description: '플래그 ID' })
  async getStoryFlag(@Param('flagId') flagId: string, @CurrentUser('id') userId: string) {
    const value = await this.storyService.getStoryFlag(userId, flagId);
    return { flagId, value };
  }
}
