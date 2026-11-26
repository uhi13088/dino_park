import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { EARLY_RESOURCES } from '@dino-park/game-data';
import {
  MaterialQuality,
  ResearchMaterial,
  type PurchaseResourceRequest,
  type UpgradeResearchMaterialRequest,
} from '@dino-park/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MAX_MATERIAL_STORAGE } from '../economy/park-storage-limits';
import { ResourcesService } from './resources.service';

class PurchaseResourceDto implements PurchaseResourceRequest {
  @IsIn([...EARLY_RESOURCES.map(({ id }) => id), 'fuel'])
  material!: PurchaseResourceRequest['material'];

  @IsInt()
  @Min(1)
  @Max(MAX_MATERIAL_STORAGE)
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

class UpgradeResearchMaterialDto implements UpgradeResearchMaterialRequest {
  @IsIn(Object.values(ResearchMaterial))
  material!: ResearchMaterial;

  @IsIn([MaterialQuality.LOW, MaterialQuality.MIDDLE])
  fromQuality!: UpgradeResearchMaterialRequest['fromQuality'];

  @IsInt()
  @Min(1)
  @Max(MAX_MATERIAL_STORAGE)
  quantity!: number;

  @IsUUID('4')
  requestId!: string;
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

  @Post('upgrade-quality')
  upgradeQuality(@CurrentUser('id') userId: string, @Body() dto: UpgradeResearchMaterialDto) {
    return this.resources.upgradeQuality(userId, dto);
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
