import { Controller, Get, Post, Body, Query, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShopService } from './shop.service';

// DTO 정의
class PurchaseGoldShopDto {
  itemId!: string;
}

class PurchaseDailyShopDto {
  slotIndex!: number;
}

class PurchaseIAPDto {
  productId!: string;
  transactionId!: string;
  platform!: 'toss' | 'ios' | 'android';
  payload!: string;
}

class ClaimAdRewardDto {
  placement!: string;
}

@ApiTags('shop')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  // ================================================================
  // IAP 상품 조회
  // ================================================================

  @Get('products')
  @ApiOperation({ summary: '모든 IAP 상품 목록 조회' })
  async getAllProducts() {
    return this.shopService.getAllIAPProducts();
  }

  @Get('products/diamonds')
  @ApiOperation({ summary: '다이아 팩 목록 조회' })
  async getDiamondPacks() {
    return this.shopService.getDiamondPacks();
  }

  @Get('products/subscriptions')
  @ApiOperation({ summary: '구독 상품 목록 조회' })
  async getSubscriptions() {
    return this.shopService.getSubscriptions();
  }

  @Get('products/starter-packs')
  @ApiOperation({ summary: '스타터/확장팩 목록 조회' })
  async getStarterPacks(@CurrentUser('id') userId: string) {
    return this.shopService.getStarterPacks(userId);
  }

  @Get('products/premium')
  @ApiOperation({ summary: '프리미엄 콘텐츠 목록 조회' })
  async getPremiumContent(@CurrentUser('id') userId: string) {
    return this.shopService.getPremiumContent(userId);
  }

  @Get('products/:productId')
  @ApiOperation({ summary: '특정 IAP 상품 상세 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID' })
  async getProduct(@Param('productId') productId: string) {
    return this.shopService.getIAPProduct(productId);
  }

  // ================================================================
  // 골드샵 (인게임 재화 상점)
  // ================================================================

  @Get('gold-shop')
  @ApiOperation({ summary: '골드샵 아이템 목록 조회' })
  async getGoldShopItems(@CurrentUser('id') userId: string) {
    return this.shopService.getGoldShopItems(userId);
  }

  @Post('gold-shop/purchase')
  @ApiOperation({ summary: '골드샵 아이템 구매' })
  @ApiBody({ type: PurchaseGoldShopDto })
  async purchaseGoldShopItem(@CurrentUser('id') userId: string, @Body() body: PurchaseGoldShopDto) {
    return this.shopService.purchaseGoldShopItem(userId, body.itemId);
  }

  // ================================================================
  // 일일 상점
  // ================================================================

  @Get('daily')
  @ApiOperation({ summary: '일일 상점 아이템 조회' })
  async getDailyShop(@CurrentUser('id') userId: string) {
    return this.shopService.getDailyShop(userId);
  }

  @Post('daily/purchase')
  @ApiOperation({ summary: '일일 상점 아이템 구매' })
  @ApiBody({ type: PurchaseDailyShopDto })
  async purchaseDailyShopItem(
    @CurrentUser('id') userId: string,
    @Body() body: PurchaseDailyShopDto,
  ) {
    return this.shopService.purchaseDailyShopItem(userId, body.slotIndex);
  }

  // ================================================================
  // IAP 구매 (실제 결제)
  // ================================================================

  @Post('purchase')
  @ApiOperation({ summary: 'IAP 상품 구매 (영수증 검증)' })
  @ApiBody({ type: PurchaseIAPDto })
  async purchaseIAP(@CurrentUser('id') userId: string, @Body() body: PurchaseIAPDto) {
    return this.shopService.purchaseIAP(userId, body.productId, {
      transactionId: body.transactionId,
      platform: body.platform,
      payload: body.payload,
    });
  }

  // ================================================================
  // 광고 보상
  // ================================================================

  @Get('ads')
  @ApiOperation({ summary: '광고 보상 설정 조회' })
  async getAdRewardConfigs(@CurrentUser('id') userId: string) {
    return this.shopService.getAdRewardConfigs(userId);
  }

  @Post('ads/claim')
  @ApiOperation({ summary: '광고 시청 후 보상 수령' })
  @ApiBody({ type: ClaimAdRewardDto })
  async claimAdReward(@CurrentUser('id') userId: string, @Body() body: ClaimAdRewardDto) {
    return this.shopService.claimAdReward(userId, body.placement);
  }

  // ================================================================
  // 특별 패키지
  // ================================================================

  @Get('special-packages')
  @ApiOperation({ summary: '활성화된 특별 패키지 조회' })
  async getSpecialPackages(@CurrentUser('id') userId: string) {
    return this.shopService.getActiveSpecialPackages(userId);
  }

  // ================================================================
  // 구매 내역
  // ================================================================

  @Get('history')
  @ApiOperation({ summary: '구매 내역 조회' })
  @ApiQuery({ name: 'limit', required: false, description: '조회 개수 (기본 50)' })
  @ApiQuery({ name: 'offset', required: false, description: '오프셋 (기본 0)' })
  async getPurchaseHistory(
    @CurrentUser('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.shopService.getPurchaseHistory(userId, limit, offset);
  }

  // ================================================================
  // 통계
  // ================================================================

  @Get('stats')
  @ApiOperation({ summary: '상점 통계 조회' })
  async getShopStats(@CurrentUser('id') userId: string) {
    return this.shopService.getShopStats(userId);
  }
}
