import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BuildingService } from './building.service';

@ApiTags('buildings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get()
  @ApiOperation({ summary: '내 건물 목록 조회' })
  async getMyBuildings(@CurrentUser('id') userId: string) {
    return this.buildingService.getByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '건물 상세 조회' })
  async getBuilding(@Param('id') id: string) {
    return this.buildingService.getById(id);
  }

  // TODO: Phase 2에서 건물 배치, 업그레이드 등 구현
}
