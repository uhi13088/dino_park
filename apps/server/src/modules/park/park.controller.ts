import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParkService } from './park.service';

@ApiTags('parks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parks')
export class ParkController {
  constructor(private readonly parkService: ParkService) {}

  @Get('me')
  @ApiOperation({ summary: '내 파크 조회' })
  async getMyPark(@CurrentUser('id') userId: string) {
    return this.parkService.getByUserId(userId);
  }
}
