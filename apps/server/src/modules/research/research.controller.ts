import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResearchService } from './research.service';

class StartResearchDto {
  @IsInt() @Min(1) @Max(5) level!: number;
}

@UseGuards(JwtAuthGuard)
@Controller('research')
export class ResearchController {
  constructor(private readonly research: ResearchService) {}

  @Get() getState(@CurrentUser('id') userId: string) {
    return this.research.getState(userId);
  }

  @Post(':technologyId/start') start(
    @CurrentUser('id') userId: string,
    @Param('technologyId') technologyId: string,
    @Body() request: StartResearchDto,
  ) {
    return this.research.start(userId, technologyId, request.level);
  }
}
