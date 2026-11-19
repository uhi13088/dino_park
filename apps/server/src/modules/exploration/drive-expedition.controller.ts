import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, Max, Min } from 'class-validator';
import { DRIVE_MAX_X, DRIVE_SECTOR_COUNT, DRIVE_TICKS_PER_SECTOR } from '@dino-park/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriveExpeditionService } from './drive-expedition.service';

class StartDriveDto {
  @IsString() missionId!: string;
}

class CheckpointDto {
  @IsInt() @Min(0) @Max(DRIVE_SECTOR_COUNT - 1) sector!: number;

  @IsArray()
  @ArrayMinSize(DRIVE_TICKS_PER_SECTOR)
  @ArrayMaxSize(DRIVE_TICKS_PER_SECTOR)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(DRIVE_MAX_X, { each: true })
  positions!: number[];
}

@UseGuards(JwtAuthGuard)
@Controller('explorations/drive')
export class DriveExpeditionController {
  constructor(private readonly drive: DriveExpeditionService) {}

  @Get() getState(@CurrentUser('id') userId: string) {
    return this.drive.getState(userId);
  }

  @Post('start') start(@CurrentUser('id') userId: string, @Body() dto: StartDriveDto) {
    return this.drive.start(userId, dto.missionId);
  }

  @Post(':id/checkpoint') checkpoint(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CheckpointDto,
  ) {
    return this.drive.checkpoint(userId, id, dto);
  }

  @Post(':id/claim') claim(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.drive.claim(userId, id);
  }

  @Post(':id/abandon') abandon(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.drive.abandon(userId, id);
  }
}
