import { Module } from '@nestjs/common';
import { ParkOperationsModule } from '../park/park-operations.module';
import { MilestoneSynthesisController } from './milestone-synthesis.controller';
import { MilestoneSynthesisService } from './milestone-synthesis.service';
import { RepeatSynthesisService } from './repeat-synthesis.service';

@Module({
  imports: [ParkOperationsModule],
  controllers: [MilestoneSynthesisController],
  providers: [MilestoneSynthesisService, RepeatSynthesisService],
})
export class MilestoneSynthesisModule {}
