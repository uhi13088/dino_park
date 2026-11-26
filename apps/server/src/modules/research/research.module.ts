import { Module } from '@nestjs/common';
import { ParkOperationsModule } from '../park/park-operations.module';
import { ResourcesModule } from '../resources/resources.module';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';

@Module({
  imports: [ParkOperationsModule, ResourcesModule],
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}
