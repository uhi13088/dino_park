import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScoutExpeditionService } from './scout-expedition.service';

class DispatchScoutDto {
  @IsString() @IsNotEmpty() @MaxLength(96) scoutId!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) spotId!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) missionId!: string;
}

class HireScoutDto {
  @IsInt() @Min(1) @Max(4) slot!: number;
}

@UseGuards(JwtAuthGuard)
@Controller('explorations/scouts')
export class ScoutExpeditionController {
  constructor(private readonly service: ScoutExpeditionService) {}

  @Get() getState(@CurrentUser('id') userId: string) {
    return this.service.getState(userId);
  }

  @Post('hire') hire(@CurrentUser('id') userId: string, @Body() dto: HireScoutDto) {
    return this.service.hire(userId, dto.slot);
  }

  @Post('dispatch') dispatch(@CurrentUser('id') userId: string, @Body() dto: DispatchScoutDto) {
    return this.service.dispatch(userId, dto);
  }

  @Post('reports/:id/claim') claim(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.claim(userId, id);
  }
}
