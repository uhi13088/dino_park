import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EconomyService } from './economy.service';

@ApiTags('economy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('economy')
export class EconomyController {
  constructor(private readonly economyService: EconomyService) {}

  /**
   * 재화 현황 조회
   */
  @Get('currency')
  @ApiOperation({ summary: '내 재화 현황 조회' })
  @ApiResponse({
    status: 200,
    description: '재화 현황',
    schema: {
      example: {
        gold: 50000,
        diamond: 120,
        dna: 25,
        explorationEnergy: 28,
        maxExplorationEnergy: 30,
        minutesUntilNextEnergy: 7,
        lastUpdated: '2024-01-15T10:30:00Z',
      },
    },
  })
  async getCurrency(@CurrentUser('id') userId: string) {
    return this.economyService.getCurrency(userId);
  }

  /**
   * 오프라인 수익 수령
   */
  @Post('offline-revenue')
  @ApiOperation({ summary: '오프라인 수익 수령' })
  @ApiResponse({
    status: 200,
    description: '수익 수령 결과',
    schema: {
      example: {
        offlineHours: 4.5,
        baseRevenue: 1500,
        offlineRate: 0.5,
        totalRevenue: 3375,
        collected: true,
        dinosaurCount: 8,
        buildingBonus: 20,
      },
    },
  })
  async collectOfflineRevenue(@CurrentUser('id') userId: string) {
    return this.economyService.collectOfflineRevenue(userId);
  }

  /**
   * 에너지 즉시 충전
   */
  @Post('energy/refill')
  @ApiOperation({ summary: '에너지 즉시 충전 (다이아 30 소모)' })
  @ApiResponse({
    status: 200,
    description: '에너지 충전 결과',
    schema: {
      example: {
        explorationEnergy: 30,
        diamondSpent: 30,
        energyRefilled: 30,
      },
    },
  })
  async refillEnergy(@CurrentUser('id') userId: string) {
    return this.economyService.refillEnergy(userId);
  }

  /**
   * 거래 내역 조회
   */
  @Get('transactions')
  @ApiOperation({ summary: '거래 내역 조회' })
  @ApiQuery({ name: 'currencyType', required: false, enum: ['gold', 'diamond', 'dna'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: '거래 내역',
    schema: {
      example: {
        transactions: [
          {
            id: 'clx1234...',
            type: 'EARN',
            currencyType: 'gold',
            amount: 3375,
            reason: '오프라인 수익 (4시간)',
            balanceAfter: 53375,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        pagination: {
          total: 45,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      },
    },
  })
  async getTransactionHistory(
    @CurrentUser('id') userId: string,
    @Query('currencyType') currencyType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.economyService.getTransactionHistory(userId, {
      currencyType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
