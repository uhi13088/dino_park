import { Module } from '@nestjs/common';
import { GreatFigureController } from './great-figure.controller';
import { GreatFigureService } from './great-figure.service';

@Module({
  controllers: [GreatFigureController],
  providers: [GreatFigureService],
  exports: [GreatFigureService],
})
export class GreatFigureModule {}
