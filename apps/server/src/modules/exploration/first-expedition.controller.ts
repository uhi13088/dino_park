import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirstExpeditionService } from './first-expedition.service';

@UseGuards(JwtAuthGuard)
@Controller('explorations')
export class FirstExpeditionController {
  constructor(private readonly first: FirstExpeditionService) {}
  @Get('first') getState(@CurrentUser('id') userId: string) {
    return this.first.getState(userId);
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
