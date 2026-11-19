import { Module } from '@nestjs/common';
import { ParkOperationsService } from './park-operations.service';

@Module({ providers: [ParkOperationsService], exports: [ParkOperationsService] })
export class ParkOperationsModule {}
