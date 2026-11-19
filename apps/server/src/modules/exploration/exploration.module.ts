import { Module } from '@nestjs/common';
import { ExplorationController } from './exploration.controller';
import { ExplorationService } from './exploration.service';
import { FirstExpeditionService } from './first-expedition.service';
import { FirstExpeditionController } from './first-expedition.controller';
import { ParkOperationsModule } from '../park/park-operations.module';
import { DriveExpeditionController } from './drive-expedition.controller';
import { DriveExpeditionService } from './drive-expedition.service';

@Module({
  imports: [ParkOperationsModule],
  controllers: [FirstExpeditionController, DriveExpeditionController, ExplorationController],
  providers: [FirstExpeditionService, DriveExpeditionService, ExplorationService],
  exports: [FirstExpeditionService, ExplorationService],
})
export class ExplorationModule {}
