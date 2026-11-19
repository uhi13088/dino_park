import { Module } from '@nestjs/common';
import { ParkOperationsModule } from '../park/park-operations.module';
import { DinosaurController } from './dinosaur.controller';
import { DinosaurService } from './dinosaur.service';
import { DinosaurCodexService } from './dinosaur-codex.service';

@Module({
  imports: [ParkOperationsModule],
  controllers: [DinosaurController],
  providers: [DinosaurService, DinosaurCodexService],
  exports: [DinosaurService],
})
export class DinosaurModule {}
