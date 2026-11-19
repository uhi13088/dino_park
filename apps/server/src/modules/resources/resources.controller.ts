import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { EARLY_RESOURCES, EARLY_RESOURCE_CAPACITY } from '@dino-park/game-data';
import type { PurchaseResourceRequest } from '@dino-park/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResourcesService } from './resources.service';

class PurchaseResourceDto implements PurchaseResourceRequest {
  @IsIn(EARLY_RESOURCES.map(({ id }) => id))
  material!: PurchaseResourceRequest['material'];

  @IsInt()
  @Min(1)
  @Max(EARLY_RESOURCE_CAPACITY)
  quantity!: number;

  @IsOptional()
  @IsUUID('4')
  requestId?: string;
}

class StartProductionDto {
  @IsString()
  buildingId!: string;

  @IsInt()
  @Min(1)
  @Max(3)
  lots!: number;
}

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.resources.getResources(userId);
  }

  @Post('purchase')
  purchase(@CurrentUser('id') userId: string, @Body() dto: PurchaseResourceDto) {
    return this.resources.purchase(userId, dto.material, dto.quantity, dto.requestId);
  }

  @Post('production')
  start(@CurrentUser('id') userId: string, @Body() dto: StartProductionDto) {
    return this.resources.startProduction(userId, dto.buildingId, dto.lots);
  }

  @Post('production/:id/claim')
  claim(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resources.claimProduction(userId, id);
  }
}
