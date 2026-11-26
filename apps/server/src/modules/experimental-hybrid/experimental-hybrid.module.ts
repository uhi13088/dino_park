import { Module } from '@nestjs/common';
import { ParkOperationsModule } from '../park/park-operations.module';
import { ExperimentalHybridArtService } from './experimental-hybrid-art.service';
import { ExperimentalHybridArtWorker } from './experimental-hybrid-art-worker';
import {
  ExperimentalHybridArtworkController,
  ExperimentalHybridController,
} from './experimental-hybrid.controller';
import { ExperimentalHybridMarketService } from './experimental-hybrid-market.service';
import { ExperimentalHybridService } from './experimental-hybrid.service';

@Module({
  imports: [ParkOperationsModule],
  providers: [
    ExperimentalHybridArtService,
    ExperimentalHybridArtWorker,
    ExperimentalHybridMarketService,
    ExperimentalHybridService,
  ],
  controllers: [ExperimentalHybridController, ExperimentalHybridArtworkController],
})
export class ExperimentalHybridModule {}
