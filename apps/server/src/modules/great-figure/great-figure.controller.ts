import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GreatFigureService } from './great-figure.service';

@ApiTags('great-figures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('great-figures')
export class GreatFigureController {
  constructor(private readonly greatFigureService: GreatFigureService) {}

  @Get()
  @ApiOperation({ summary: '내 위인 목록 조회' })
  async getMyGreatFigures(@CurrentUser('id') userId: string) {
    return this.greatFigureService.getByUserId(userId);
  }

  @Post(':figureId/recruit')
  @ApiOperation({ summary: '위인 영입' })
  async recruitGreatFigure(
    @Param('figureId') figureId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.greatFigureService.recruit(userId, figureId);
  }
}
