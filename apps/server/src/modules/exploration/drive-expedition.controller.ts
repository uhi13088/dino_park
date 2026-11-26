import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriveExpeditionService } from './drive-expedition.service';

@UseGuards(JwtAuthGuard)
@Controller('explorations/drive')
export class DriveExpeditionController {
  constructor(private readonly drive: DriveExpeditionService) {}

  @Get() getState(@CurrentUser('id') userId: string) {
    return this.drive.getState(userId);
  }

  @Post(':id/claim') claim(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.drive.claim(userId, id);
  }
}
