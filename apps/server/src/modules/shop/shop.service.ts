import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ALL_IAP_PRODUCTS,
  DIAMOND_PACKS,
  SUBSCRIPTIONS,
  STARTER_PACKS,
  PREMIUM_CONTENT,
  SPECIAL_PACKAGES,
  GOLD_SHOP_ITEMS,
  AD_REWARD_CONFIGS,
  getIAPProductById,
  getGoldShopItemById,
  getAdRewardConfig,
  getSpecialPackageByTrigger,
} from '@dino-park/game-data';
import type { IAPProduct, IAPReward, GoldShopItem, SpecialPackage } from '@dino-park/shared';

// 일일 상점 설정
const DAILY_SHOP_ITEM_COUNT = 6;
const DAILY_SHOP_REFRESH_HOUR = 4; // 오전 4시 리셋

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // IAP 상품 조회
  // ================================================================

  /**
   * 모든 IAP 상품 조회
   */
  async getAllIAPProducts() {
    return ALL_IAP_PRODUCTS.filter((p) => p.isActive);
  }

  /**
   * 다이아 팩 목록 조회
   */
  async getDiamondPacks() {
    return DIAMOND_PACKS.filter((p) => p.isActive);
  }

  /**
   * 구독 상품 목록 조회
   */
  async getSubscriptions() {
    return SUBSCRIPTIONS.filter((p) => p.isActive);
  }

  /**
   * 스타터/확장팩 목록 조회
   */
  async getStarterPacks(userId: string) {
    const purchased = await this.getUserPurchasedProductIds(userId);
    return STARTER_PACKS.filter((p) => p.isActive).map((pack) => ({
      ...pack,
      isPurchased: purchased.has(pack.id),
      canPurchase: !purchased.has(pack.id),
    }));
  }

  /**
   * 프리미엄 콘텐츠 목록 조회
   */
  async getPremiumContent(userId: string) {
    const purchased = await this.getUserPurchasedProductIds(userId);
    return PREMIUM_CONTENT.filter((p) => p.isActive).map((item) => ({
      ...item,
      isPurchased: purchased.has(item.id),
      canPurchase: !item.isLimited || !purchased.has(item.id),
    }));
  }

  /**
   * 특정 IAP 상품 조회
   */
  async getIAPProduct(productId: string) {
    const product = getIAPProductById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return product;
  }

  // ================================================================
  // 골드샵 (인게임 재화 상점)
  // ================================================================

  /**
   * 골드샵 전체 아이템 조회
   */
  async getGoldShopItems(userId: string) {
    const dailyPurchases = await this.getUserDailyPurchases(userId, 'goldShop');

    return GOLD_SHOP_ITEMS.filter((item) => item.isActive).map((item) => {
      const todayCount = dailyPurchases.get(item.id) || 0;
      const remainingLimit = item.dailyLimit ? item.dailyLimit - todayCount : undefined;

      return {
        ...item,
        purchasedToday: todayCount,
        remainingLimit,
        canPurchase: remainingLimit === undefined || remainingLimit > 0,
      };
    });
  }

  /**
   * 골드샵 아이템 구매
   */
  async purchaseGoldShopItem(userId: string, itemId: string) {
    const item = getGoldShopItemById(itemId);
    if (!item || !item.isActive) {
      throw new BadRequestException('아이템을 찾을 수 없습니다.');
    }

    // 일일 구매 제한 확인
    if (item.dailyLimit) {
      const todayCount = await this.countTodayPurchases(userId, itemId, 'goldShop');
      if (todayCount >= item.dailyLimit) {
        throw new BadRequestException('오늘의 구매 한도를 초과했습니다.');
      }
    }

    // 재화 확인 및 차감
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency) {
      throw new BadRequestException('유저 재화 정보를 찾을 수 없습니다.');
    }

    const currencyField = item.priceType === 'gold' ? 'gold' : 'diamond';
    const currentAmount = currency[currencyField];

    if (currentAmount < item.price) {
      throw new BadRequestException(
        `${item.priceType === 'gold' ? '골드' : '다이아'}가 부족합니다.`,
      );
    }

    // 트랜잭션으로 처리
    const result = await this.prisma.$transaction(async (tx) => {
      // 재화 차감
      const updatedCurrency = await tx.currency.update({
        where: { userId },
        data: { [currencyField]: { decrement: item.price } },
      });

      // 구매 기록
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: item.priceType,
          amount: -item.price,
          reason: `골드샵 구매: ${item.nameKo}`,
          balanceAfter: updatedCurrency[currencyField],
        },
      });

      // 보상 지급
      const grantedRewards = await this.grantRewards(tx, userId, item.rewards);

      return { grantedRewards, currency: updatedCurrency };
    });

    return {
      success: true,
      itemId,
      itemName: item.nameKo,
      spent: { type: item.priceType, amount: item.price },
      rewards: result.grantedRewards,
    };
  }

  // ================================================================
  // 일일 상점
  // ================================================================

  /**
   * 일일 상점 아이템 조회
   */
  async getDailyShop(userId: string) {
    const today = this.getDailyShopDate();
    const seed = this.getDailyShopSeed(userId, today);

    // 시드 기반 랜덤 선택
    const selectedItems = this.selectDailyShopItems(seed);
    const dailyPurchases = await this.getUserDailyPurchases(userId, 'dailyShop');

    return {
      date: today,
      refreshAt: this.getNextRefreshTime(),
      items: selectedItems.map((item, index) => {
        const isPurchased = dailyPurchases.has(`daily-${index}-${item.id}`);
        return {
          slotIndex: index,
          item,
          discountPercent: this.getDailyDiscount(seed, index),
          isPurchased,
          canPurchase: !isPurchased,
        };
      }),
    };
  }

  /**
   * 일일 상점 아이템 구매
   */
  async purchaseDailyShopItem(userId: string, slotIndex: number) {
    const today = this.getDailyShopDate();
    const seed = this.getDailyShopSeed(userId, today);
    const selectedItems = this.selectDailyShopItems(seed);

    if (slotIndex < 0 || slotIndex >= selectedItems.length) {
      throw new BadRequestException('잘못된 슬롯 인덱스입니다.');
    }

    const item = selectedItems[slotIndex];
    const purchaseKey = `daily-${slotIndex}-${item.id}`;
    const discount = this.getDailyDiscount(seed, slotIndex);

    // 이미 구매했는지 확인
    const alreadyPurchased = await this.checkDailyPurchase(userId, purchaseKey);
    if (alreadyPurchased) {
      throw new BadRequestException('이미 구매한 아이템입니다.');
    }

    // 할인된 가격 계산
    const discountedPrice = Math.floor(item.price * (1 - discount / 100));

    // 재화 확인 및 차감
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency) {
      throw new BadRequestException('유저 재화 정보를 찾을 수 없습니다.');
    }

    const currencyField = item.priceType === 'gold' ? 'gold' : 'diamond';
    if (currency[currencyField] < discountedPrice) {
      throw new BadRequestException('재화가 부족합니다.');
    }

    // 트랜잭션으로 처리
    const result = await this.prisma.$transaction(async (tx) => {
      // 재화 차감
      const updatedCurrency = await tx.currency.update({
        where: { userId },
        data: { [currencyField]: { decrement: discountedPrice } },
      });

      // 구매 기록
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: item.priceType,
          amount: -discountedPrice,
          reason: `일일상점 구매: ${item.nameKo} (${discount}% 할인)`,
          balanceAfter: updatedCurrency[currencyField],
        },
      });

      // 보상 지급
      const grantedRewards = await this.grantRewards(tx, userId, item.rewards);

      return { grantedRewards, currency: updatedCurrency };
    });

    return {
      success: true,
      slotIndex,
      itemName: item.nameKo,
      originalPrice: item.price,
      discountedPrice,
      discountPercent: discount,
      rewards: result.rewards,
    };
  }

  // ================================================================
  // IAP 구매 (실제 결제)
  // ================================================================

  /**
   * IAP 상품 구매 (영수증 검증)
   */
  async purchaseIAP(
    userId: string,
    productId: string,
    receipt: { transactionId: string; platform: 'toss' | 'ios' | 'android'; payload: string },
  ) {
    const product = getIAPProductById(productId);
    if (!product || !product.isActive) {
      throw new BadRequestException('상품을 찾을 수 없습니다.');
    }

    // 한정 상품 구매 여부 확인
    if (product.isLimited && product.limitPerUser) {
      const purchaseCount = await this.countUserProductPurchases(userId, productId);
      if (purchaseCount >= product.limitPerUser) {
        throw new BadRequestException('이미 구매한 한정 상품입니다.');
      }
    }

    // 영수증 검증 (TODO: 실제 플랫폼별 영수증 검증 구현)
    const isValidReceipt = await this.validateReceipt(receipt);
    if (!isValidReceipt) {
      throw new BadRequestException('영수증 검증에 실패했습니다.');
    }

    // 중복 거래 확인
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        reason: { contains: receipt.transactionId },
      },
    });

    if (existingTransaction) {
      throw new BadRequestException('이미 처리된 거래입니다.');
    }

    // 보상 지급
    const result = await this.prisma.$transaction(async (tx) => {
      // 보상 지급
      const grantedRewards = await this.grantRewards(tx, userId, product.rewards);

      // 구매 기록
      await tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          currencyType: 'krw',
          amount: product.price,
          reason: `IAP 구매: ${product.nameKo} (${receipt.transactionId})`,
          balanceAfter: 0,
        },
      });

      return { grantedRewards };
    });

    return {
      success: true,
      productId,
      productName: product.nameKo,
      transactionId: receipt.transactionId,
      rewards: result.grantedRewards,
    };
  }

  /**
   * 영수증 검증 (스텁)
   */
  private async validateReceipt(receipt: {
    transactionId: string;
    platform: string;
    payload: string;
  }): Promise<boolean> {
    // TODO: 실제 플랫폼별 영수증 검증 구현
    // - Toss: Toss Payments API
    // - iOS: App Store Server API
    // - Android: Google Play Developer API

    // 현재는 개발용으로 항상 true 반환
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // 프로덕션에서는 실제 검증 필요
    // switch (receipt.platform) {
    //   case 'toss':
    //     return this.validateTossReceipt(receipt.payload);
    //   case 'ios':
    //     return this.validateAppStoreReceipt(receipt.payload);
    //   case 'android':
    //     return this.validatePlayStoreReceipt(receipt.payload);
    //   default:
    //     return false;
    // }

    return true;
  }

  // ================================================================
  // 광고 보상
  // ================================================================

  /**
   * 광고 보상 설정 조회
   */
  async getAdRewardConfigs(userId: string) {
    const todayAdWatches = await this.getUserDailyAdWatches(userId);

    return AD_REWARD_CONFIGS.filter((config) => config.isActive).map((config) => {
      const watchedCount = todayAdWatches.get(config.placement) || 0;
      const lastWatchedAt = todayAdWatches.get(`${config.placement}_time`) as Date | undefined;
      const cooldownEndsAt = lastWatchedAt
        ? new Date(lastWatchedAt.getTime() + config.cooldownMinutes * 60 * 1000)
        : null;
      const isOnCooldown = cooldownEndsAt ? cooldownEndsAt > new Date() : false;

      return {
        ...config,
        watchedToday: watchedCount,
        remainingWatches: config.dailyLimit - watchedCount,
        isOnCooldown,
        cooldownEndsAt,
        canWatch: watchedCount < config.dailyLimit && !isOnCooldown,
      };
    });
  }

  /**
   * 광고 시청 후 보상 수령
   */
  async claimAdReward(userId: string, placement: string) {
    const config = getAdRewardConfig(placement);
    if (!config) {
      throw new BadRequestException('광고 설정을 찾을 수 없습니다.');
    }

    // 일일 제한 확인
    const todayCount = await this.countTodayAdWatches(userId, placement);
    if (todayCount >= config.dailyLimit) {
      throw new BadRequestException('오늘의 광고 시청 한도를 초과했습니다.');
    }

    // 쿨다운 확인
    const lastWatch = await this.getLastAdWatchTime(userId, placement);
    if (lastWatch && config.cooldownMinutes > 0) {
      const cooldownEnds = new Date(lastWatch.getTime() + config.cooldownMinutes * 60 * 1000);
      if (cooldownEnds > new Date()) {
        throw new BadRequestException('쿨다운 중입니다.');
      }
    }

    // 보상 지급
    const result = await this.prisma.$transaction(async (tx) => {
      const grantedRewards = await this.grantRewards(tx, userId, config.rewards);

      // 광고 시청 기록 (Transaction 사용)
      await tx.transaction.create({
        data: {
          userId,
          type: 'REWARD',
          currencyType: 'ad',
          amount: 1,
          reason: `광고 보상: ${placement}`,
          balanceAfter: todayCount + 1,
        },
      });

      return { grantedRewards };
    });

    return {
      success: true,
      placement,
      rewards: result.grantedRewards,
      remainingWatches: config.dailyLimit - todayCount - 1,
    };
  }

  // ================================================================
  // 특별 패키지
  // ================================================================

  /**
   * 유저에게 표시할 특별 패키지 조회
   */
  async getActiveSpecialPackages(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('유저를 찾을 수 없습니다.');
    }

    const purchased = await this.getUserPurchasedProductIds(userId);
    const activePackages: (SpecialPackage & { expiresAt: Date })[] = [];

    for (const pkg of SPECIAL_PACKAGES) {
      if (!pkg.isActive || purchased.has(pkg.id)) continue;

      const triggeredAt = await this.checkPackageTrigger(userId, user, pkg);
      if (triggeredAt) {
        const expiresAt = new Date(
          triggeredAt.getTime() + pkg.displayDurationHours * 60 * 60 * 1000,
        );
        if (expiresAt > new Date()) {
          activePackages.push({ ...pkg, expiresAt });
        }
      }
    }

    return activePackages;
  }

  /**
   * 특별 패키지 트리거 확인
   */
  private async checkPackageTrigger(
    userId: string,
    user: { level: number; createdAt: Date; lastLoginAt: Date },
    pkg: SpecialPackage,
  ): Promise<Date | null> {
    const { type, value } = pkg.triggerCondition;

    switch (type) {
      case 'levelUp':
        if (user.level >= (value as number)) {
          // 레벨업 시점 추정 (실제로는 레벨업 기록 필요)
          return new Date();
        }
        break;

      case 'firstPurchase':
        const hasNoPurchases = await this.hasNoPurchases(userId);
        if (hasNoPurchases) {
          return user.createdAt;
        }
        break;

      case 'returnUser':
        const daysSinceLastLogin = Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceLastLogin >= 7) {
          return new Date();
        }
        break;
    }

    return null;
  }

  // ================================================================
  // 구매 내역
  // ================================================================

  /**
   * 유저 구매 내역 조회
   */
  async getPurchaseHistory(userId: string, limit = 50, offset = 0) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ['PURCHASE', 'SPEND'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.transaction.count({
      where: {
        userId,
        type: { in: ['PURCHASE', 'SPEND'] },
      },
    });

    return { transactions, total, limit, offset };
  }

  // ================================================================
  // 상점 통계
  // ================================================================

  /**
   * 상점 통계 조회
   */
  async getShopStats(userId: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    const totalSpent = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'PURCHASE',
      },
      _sum: { amount: true },
    });

    const purchaseCount = await this.prisma.transaction.count({
      where: {
        userId,
        type: 'PURCHASE',
      },
    });

    return {
      currency,
      totalSpent: totalSpent._sum.amount || 0,
      purchaseCount,
      availableProducts: {
        diamondPacks: DIAMOND_PACKS.filter((p) => p.isActive).length,
        subscriptions: SUBSCRIPTIONS.filter((p) => p.isActive).length,
        starterPacks: STARTER_PACKS.filter((p) => p.isActive).length,
        premiumContent: PREMIUM_CONTENT.filter((p) => p.isActive).length,
        goldShopItems: GOLD_SHOP_ITEMS.filter((p) => p.isActive).length,
      },
    };
  }

  // ================================================================
  // 헬퍼 메서드
  // ================================================================

  /**
   * 보상 지급
   */
  private async grantRewards(
    tx: any,
    userId: string,
    rewards: IAPReward[],
  ): Promise<Array<{ type: string; id?: string; quantity: number }>> {
    const granted: Array<{ type: string; id?: string; quantity: number }> = [];

    for (const reward of rewards) {
      const quantity = reward.quantity;

      switch (reward.type) {
        case 'diamond':
          await tx.currency.update({
            where: { userId },
            data: { diamond: { increment: quantity } },
          });
          granted.push({ type: 'diamond', quantity });
          break;

        case 'gold':
          await tx.currency.update({
            where: { userId },
            data: { gold: { increment: quantity } },
          });
          granted.push({ type: 'gold', quantity });
          break;

        case 'dna':
          await tx.currency.update({
            where: { userId },
            data: { dna: { increment: quantity } },
          });
          granted.push({ type: 'dna', quantity });
          break;

        case 'energy':
          await tx.currency.update({
            where: { userId },
            data: { explorationEnergy: { increment: quantity } },
          });
          granted.push({ type: 'energy', quantity });
          break;

        case 'dinosaur':
          // 공룡 지급 로직 (TODO: DinosaurService 연동)
          granted.push({ type: 'dinosaur', id: reward.id, quantity });
          break;

        case 'greatFigure':
          // 위인 지급 로직 (TODO: GreatFigureService 연동)
          granted.push({ type: 'greatFigure', id: reward.id, quantity });
          break;

        case 'item':
          // 아이템 지급 로직 (TODO: ItemService 연동)
          granted.push({ type: 'item', id: reward.id, quantity });
          break;

        case 'skin':
          // 스킨 지급 로직 (TODO: SkinService 연동)
          granted.push({ type: 'skin', id: reward.id, quantity });
          break;

        case 'seasonPoint':
          // 시즌 포인트 지급 로직 (TODO: SeasonService 연동)
          granted.push({ type: 'seasonPoint', quantity });
          break;
      }
    }

    return granted;
  }

  /**
   * 유저가 구매한 상품 ID 목록
   */
  private async getUserPurchasedProductIds(userId: string): Promise<Set<string>> {
    const purchases = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'PURCHASE',
        reason: { startsWith: 'IAP 구매:' },
      },
      select: { reason: true },
    });

    const productIds = new Set<string>();
    for (const purchase of purchases) {
      // reason 형식: "IAP 구매: 상품명 (transactionId)"
      const match = purchase.reason.match(/IAP 구매: .+ \((.+)\)/);
      if (match) {
        // 실제로는 productId를 저장하는 별도 필드 필요
        productIds.add(purchase.reason);
      }
    }

    return productIds;
  }

  /**
   * 유저의 특정 상품 구매 횟수
   */
  private async countUserProductPurchases(userId: string, productId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        userId,
        type: 'PURCHASE',
        reason: { contains: productId },
      },
    });
  }

  /**
   * 유저의 오늘 구매 내역
   */
  private async getUserDailyPurchases(
    userId: string,
    type: 'goldShop' | 'dailyShop',
  ): Promise<Map<string, number>> {
    const todayStart = this.getTodayStart();

    const purchases = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'SPEND',
        reason: { startsWith: type === 'goldShop' ? '골드샵 구매:' : '일일상점 구매:' },
        createdAt: { gte: todayStart },
      },
      select: { reason: true },
    });

    const counts = new Map<string, number>();
    for (const purchase of purchases) {
      const key = purchase.reason;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return counts;
  }

  /**
   * 오늘 특정 아이템 구매 횟수
   */
  private async countTodayPurchases(
    userId: string,
    itemId: string,
    type: 'goldShop' | 'dailyShop',
  ): Promise<number> {
    const todayStart = this.getTodayStart();

    return this.prisma.transaction.count({
      where: {
        userId,
        type: 'SPEND',
        reason: { contains: itemId },
        createdAt: { gte: todayStart },
      },
    });
  }

  /**
   * 일일 상점 구매 여부 확인
   */
  private async checkDailyPurchase(userId: string, purchaseKey: string): Promise<boolean> {
    const todayStart = this.getTodayStart();

    const count = await this.prisma.transaction.count({
      where: {
        userId,
        type: 'SPEND',
        reason: { contains: purchaseKey },
        createdAt: { gte: todayStart },
      },
    });

    return count > 0;
  }

  /**
   * 유저의 오늘 광고 시청 기록
   */
  private async getUserDailyAdWatches(userId: string): Promise<Map<string, number | Date>> {
    const todayStart = this.getTodayStart();

    const watches = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'REWARD',
        currencyType: 'ad',
        createdAt: { gte: todayStart },
      },
      select: { reason: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const result = new Map<string, number | Date>();
    for (const watch of watches) {
      const placement = watch.reason.replace('광고 보상: ', '');
      result.set(placement, ((result.get(placement) as number) || 0) + 1);
      if (!result.has(`${placement}_time`)) {
        result.set(`${placement}_time`, watch.createdAt);
      }
    }

    return result;
  }

  /**
   * 오늘 특정 광고 시청 횟수
   */
  private async countTodayAdWatches(userId: string, placement: string): Promise<number> {
    const todayStart = this.getTodayStart();

    return this.prisma.transaction.count({
      where: {
        userId,
        type: 'REWARD',
        currencyType: 'ad',
        reason: `광고 보상: ${placement}`,
        createdAt: { gte: todayStart },
      },
    });
  }

  /**
   * 마지막 광고 시청 시간
   */
  private async getLastAdWatchTime(userId: string, placement: string): Promise<Date | null> {
    const lastWatch = await this.prisma.transaction.findFirst({
      where: {
        userId,
        type: 'REWARD',
        currencyType: 'ad',
        reason: `광고 보상: ${placement}`,
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return lastWatch?.createdAt || null;
  }

  /**
   * 구매 기록 없음 확인
   */
  private async hasNoPurchases(userId: string): Promise<boolean> {
    const count = await this.prisma.transaction.count({
      where: {
        userId,
        type: 'PURCHASE',
      },
    });

    return count === 0;
  }

  /**
   * 오늘 시작 시간 (오전 4시 기준)
   */
  private getTodayStart(): Date {
    const now = new Date();
    const today = new Date(now);
    today.setHours(DAILY_SHOP_REFRESH_HOUR, 0, 0, 0);

    if (now < today) {
      today.setDate(today.getDate() - 1);
    }

    return today;
  }

  /**
   * 일일 상점 날짜 키
   */
  private getDailyShopDate(): string {
    const today = this.getTodayStart();
    return today.toISOString().split('T')[0];
  }

  /**
   * 일일 상점 시드 생성
   */
  private getDailyShopSeed(userId: string, date: string): number {
    // 유저 ID + 날짜로 시드 생성 (같은 유저는 같은 날 같은 상점)
    let hash = 0;
    const str = `${userId}-${date}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 일일 상점 아이템 선택
   */
  private selectDailyShopItems(seed: number): GoldShopItem[] {
    const availableItems = GOLD_SHOP_ITEMS.filter((item) => item.isActive);
    const selected: GoldShopItem[] = [];
    const usedIndices = new Set<number>();

    // 의사 난수 생성기
    let currentSeed = seed;
    const random = () => {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      return currentSeed / 0x7fffffff;
    };

    while (selected.length < DAILY_SHOP_ITEM_COUNT && selected.length < availableItems.length) {
      const index = Math.floor(random() * availableItems.length);
      if (!usedIndices.has(index)) {
        usedIndices.add(index);
        selected.push(availableItems[index]);
      }
    }

    return selected;
  }

  /**
   * 일일 상점 할인율
   */
  private getDailyDiscount(seed: number, slotIndex: number): number {
    // 슬롯별 할인율 (0, 10, 20, 30, 50%)
    const discounts = [0, 10, 20, 30, 50];
    const combinedSeed = seed + slotIndex * 1000;
    const discountIndex = combinedSeed % discounts.length;
    return discounts[discountIndex];
  }

  /**
   * 다음 리프레시 시간
   */
  private getNextRefreshTime(): Date {
    const now = new Date();
    const nextRefresh = new Date(now);
    nextRefresh.setHours(DAILY_SHOP_REFRESH_HOUR, 0, 0, 0);

    if (nextRefresh <= now) {
      nextRefresh.setDate(nextRefresh.getDate() + 1);
    }

    return nextRefresh;
  }
}
