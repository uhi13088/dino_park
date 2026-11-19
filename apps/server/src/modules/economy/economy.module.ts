import { Module } from '@nestjs/common';
import { ParkOperationsModule } from '../park/park-operations.module';
import { EconomyController } from './economy.controller';
import { EconomyService } from './economy.service';

@Module({
  imports: [ParkOperationsModule],
  controllers: [EconomyController],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
