import { Module } from '@nestjs/common';
import { ResourcesModule } from '../resources/resources.module';
import { ParkOperationsModule } from '../park/park-operations.module';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';

@Module({
  imports: [ParkOperationsModule, ResourcesModule],
  controllers: [BuildingController],
  providers: [BuildingService],
  exports: [BuildingService],
})
export class BuildingModule {}
