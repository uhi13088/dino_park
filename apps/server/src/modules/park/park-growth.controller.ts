import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParkGrowthService } from './park-growth.service';

@ApiTags('parks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parks/me/growth')
export class ParkGrowthController {
  constructor(private readonly growth: ParkGrowthService) {}

  @Get()
  getState(@CurrentUser('id') userId: string) {
    return this.growth.getState(userId);
  }

  @Post('goals/:id/claim')
  claim(@CurrentUser('id') userId: string, @Param('id') goalId: string) {
    return this.growth.claim(userId, goalId);
  }

  @Post('research/start')
  startResearch(@CurrentUser('id') userId: string) {
    return this.growth.startResearch(userId);
  }
}
