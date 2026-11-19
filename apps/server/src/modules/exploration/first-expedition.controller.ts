import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsString, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirstExpeditionService } from './first-expedition.service';

class StartFirstExpeditionDto {
  @IsString() regionId!: string;
}
class FirstExpeditionChoiceDto {
  @IsInt() @Min(0) step!: number;
  @IsString() choiceId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('explorations')
export class FirstExpeditionController {
  constructor(private readonly first: FirstExpeditionService) {}
  @Get('first') getState(@CurrentUser('id') userId: string) {
    return this.first.getState(userId);
  }
  @Post('first/start') start(
    @CurrentUser('id') userId: string,
    @Body() dto: StartFirstExpeditionDto,
  ) {
    return this.first.start(userId, dto.regionId);
  }
  @Post('first/:id/choice') choose(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: FirstExpeditionChoiceDto,
  ) {
    return this.first.choose(userId, id, dto.step, dto.choiceId);
  }
  @Post('first/:id/claim') claim(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.first.claim(userId, id);
  }
  @Post('hatching/:id/start') startHatching(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.first.startHatching(userId, id);
  }
  @Post('hatching/:id/claim') claimHatching(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.first.claimHatching(userId, id);
  }
}
