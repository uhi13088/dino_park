import { Module } from '@nestjs/common';
import { ParkController } from './park.controller';
import { ParkService } from './park.service';
import { ParkOperationsModule } from './park-operations.module';
import { ParkGrowthController } from './park-growth.controller';
import { ParkGrowthService } from './park-growth.service';
import { ResourcesModule } from '../resources/resources.module';
import { ParkShuttleService } from './park-shuttle.service';
import { ParkSafariService } from './park-safari.service';

@Module({
  imports: [ParkOperationsModule, ResourcesModule],
  controllers: [ParkController, ParkGrowthController],
  providers: [ParkService, ParkGrowthService, ParkShuttleService, ParkSafariService],
  exports: [ParkService],
})
export class ParkModule {}
