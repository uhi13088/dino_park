import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StoryService } from './story.service';

@ApiTags('stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get('progress')
  @ApiOperation({ summary: '스토리 진행 상황 조회' })
  async getProgress(@CurrentUser('id') userId: string) {
    return this.storyService.getProgress(userId);
  }

  @Post(':chapterId/choice')
  @ApiOperation({ summary: '스토리 선택지 선택' })
  async makeChoice(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @Body('choiceId') choiceId: string,
  ) {
    return this.storyService.makeChoice(userId, chapterId, choiceId);
  }
}
