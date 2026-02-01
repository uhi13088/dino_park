import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShopService } from './shop.service';

@ApiTags('shop')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  @ApiOperation({ summary: '상점 상품 목록 조회' })
  async getProducts() {
    return this.shopService.getProducts();
  }

  @Post('purchase')
  @ApiOperation({ summary: '상품 구매' })
  async purchase(
    @CurrentUser('id') userId: string,
    @Body('productId') productId: string,
  ) {
    return this.shopService.purchase(userId, productId);
  }
}
