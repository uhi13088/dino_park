import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParkGrowthService } from './park-growth.service';

const stages = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];

@ApiTags('parks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parks/me/growth')
export class ParkGrowthController {
  constructor(private readonly growth: ParkGrowthService) {}

  @Get()
  @ApiQuery({ name: 'stage', required: false, enum: stages })
  getState(@CurrentUser('id') userId: string, @Query('stage') stage?: string) {
    return this.growth.getState(userId, stage);
  }

  @Post('goals/:id/claim')
  @ApiQuery({ name: 'stage', required: false, enum: stages })
  claim(
    @CurrentUser('id') userId: string,
    @Param('id') goalId: string,
    @Query('stage') stage?: string,
  ) {
    return this.growth.claim(userId, goalId, stage);
  }

  @Post('routes/:id/claim')
  @ApiQuery({ name: 'stage', enum: ['6', '7'] })
  claimRoute(
    @CurrentUser('id') userId: string,
    @Param('id') routeId: string,
    @Query('stage') stage?: string,
  ) {
    return this.growth.claimRoute(userId, routeId, stage);
  }

  @Post('research/start')
  @ApiQuery({ name: 'stage', required: false, enum: ['5', '6', '7'] })
  startResearch(@CurrentUser('id') userId: string, @Query('stage') stage?: string) {
    return this.growth.startResearch(userId, stage);
  }
}
