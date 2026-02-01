import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DinosaurService } from './dinosaur.service';

@ApiTags('dinosaurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dinosaurs')
export class DinosaurController {
  constructor(private readonly dinosaurService: DinosaurService) {}

  @Get()
  @ApiOperation({ summary: '내 공룡 목록 조회' })
  async getMyDinosaurs(@CurrentUser('id') userId: string) {
    return this.dinosaurService.getByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '공룡 상세 조회' })
  async getDinosaur(@Param('id') id: string) {
    return this.dinosaurService.getById(id);
  }

  @Post(':id/feed')
  @ApiOperation({ summary: '공룡에게 먹이주기' })
  async feedDinosaur(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dinosaurService.feed(id, userId);
  }
}
