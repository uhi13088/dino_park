import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// TODO: Phase 6에서 상품 데이터를 game-data 패키지로 이동
const SHOP_PRODUCTS = [
  {
    id: 'diamond_60',
    type: 'diamond',
    diamonds: 60,
    bonus: 0,
    price: 1100,
  },
  {
    id: 'diamond_330',
    type: 'diamond',
    diamonds: 330,
    bonus: 30,
    price: 5500,
  },
  // ... 추가 상품
];

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts() {
    return SHOP_PRODUCTS;
  }

  async purchase(userId: string, productId: string) {
    const product = SHOP_PRODUCTS.find((p) => p.id === productId);

    if (!product) {
      throw new BadRequestException('상품을 찾을 수 없습니다.');
    }

    // TODO: Phase 6에서 실제 결제 연동

    // 다이아 지급
    if (product.type === 'diamond') {
      const totalDiamonds = product.diamonds + product.bonus;

      await this.prisma.currency.update({
        where: { userId },
        data: { diamond: { increment: totalDiamonds } },
      });

      // 거래 기록
      await this.prisma.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          currencyType: 'diamond',
          amount: totalDiamonds,
          reason: `상품 구매: ${productId}`,
          balanceAfter: 0, // TODO: 실제 잔액으로 업데이트
        },
      });
    }

    return { success: true, productId };
  }
}
