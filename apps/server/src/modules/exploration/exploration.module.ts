import { Module } from '@nestjs/common';
import { ExplorationController } from './exploration.controller';
import { ExplorationService } from './exploration.service';
import { FirstExpeditionService } from './first-expedition.service';
import { FirstExpeditionController } from './first-expedition.controller';
import { ParkOperationsModule } from '../park/park-operations.module';
import { DriveExpeditionController } from './drive-expedition.controller';
import { DriveExpeditionService } from './drive-expedition.service';
import { ScoutExpeditionController } from './scout-expedition.controller';
import { ScoutExpeditionService } from './scout-expedition.service';

@Module({
  imports: [ParkOperationsModule],
  controllers: [
    FirstExpeditionController,
    DriveExpeditionController,
    ScoutExpeditionController,
    ExplorationController,
  ],
  providers: [
    FirstExpeditionService,
    DriveExpeditionService,
    ScoutExpeditionService,
    ExplorationService,
  ],
  exports: [FirstExpeditionService, ExplorationService],
})
export class ExplorationModule {}
