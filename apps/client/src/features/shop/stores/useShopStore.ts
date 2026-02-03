import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ========================================
// Types
// ========================================

export type ProductCategory = 'diamond' | 'package' | 'daily' | 'gold' | 'subscription';
export type CurrencyType = 'krw' | 'gold' | 'diamond';

export interface DiamondProduct {
  id: string;
  diamonds: number;
  bonusDiamonds: number;
  price: number;
  isPopular: boolean;
  isFirstPurchaseBonus: boolean;
  firstPurchaseMultiplier: number;
}

export interface PackageProduct {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  contents: PackageContent[];
  imageUrl?: string;
  expiresAt?: Date;
  purchaseLimit?: number;
  purchasedCount: number;
}

export interface PackageContent {
  type: 'diamond' | 'gold' | 'energy' | 'egg' | 'item' | 'dinosaur' | 'booster';
  amount: number;
  name: string;
  icon: string;
  rarity?: string;
}

export interface DailyShopItem {
  id: string;
  name: string;
  icon: string;
  type: 'gold' | 'diamond' | 'energy' | 'egg' | 'item';
  amount: number;
  price: number;
  currency: CurrencyType;
  originalPrice?: number;
  isPurchased: boolean;
  slot: number;
}

export interface GoldShopItem {
  id: string;
  name: string;
  icon: string;
  amount: number;
  price: number;
  dailyLimit: number;
  purchasedToday: number;
}

export interface SubscriptionProduct {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  benefits: string[];
  isActive: boolean;
  expiresAt?: Date;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  rewards?: PackageContent[];
}

// ========================================
// Constants
// ========================================

export const CURRENCY_CONFIG = {
  krw: { icon: '₩', label: '원', color: 'text-gray-600' },
  gold: { icon: '🪙', label: '골드', color: 'text-yellow-400' },
  diamond: { icon: '💎', label: '다이아', color: 'text-blue-400' },
};

export const PRODUCT_TYPE_ICONS = {
  diamond: '💎',
  gold: '🪙',
  energy: '⚡',
  egg: '🥚',
  item: '📦',
  dinosaur: '🦕',
  booster: '📜',
};

// ========================================
// Store
// ========================================

interface ShopState {
  // State
  diamondProducts: DiamondProduct[];
  packageProducts: PackageProduct[];
  dailyShopItems: DailyShopItem[];
  goldShopItems: GoldShopItem[];
  subscriptions: SubscriptionProduct[];

  // User Currency (from game state)
  gold: number;
  diamond: number;

  // Daily Shop
  dailyShopRefreshTime: Date | null;
  dailyShopSeed: string;

  // UI State
  selectedProduct: DiamondProduct | PackageProduct | DailyShopItem | GoldShopItem | null;
  showPurchaseModal: boolean;
  showResultModal: boolean;
  lastPurchaseResult: PurchaseResult | null;
  isLoading: boolean;
  activeTab: ProductCategory;

  // Actions
  setDiamondProducts: (products: DiamondProduct[]) => void;
  setPackageProducts: (products: PackageProduct[]) => void;
  setDailyShopItems: (items: DailyShopItem[]) => void;
  setGoldShopItems: (items: GoldShopItem[]) => void;
  setSubscriptions: (subscriptions: SubscriptionProduct[]) => void;
  setCurrency: (gold: number, diamond: number) => void;
  setActiveTab: (tab: ProductCategory) => void;
  setSelectedProduct: (
    product: DiamondProduct | PackageProduct | DailyShopItem | GoldShopItem | null,
  ) => void;
  setShowPurchaseModal: (show: boolean) => void;
  setShowResultModal: (show: boolean) => void;

  // Purchase Actions
  purchaseDiamond: (productId: string) => Promise<PurchaseResult>;
  purchasePackage: (productId: string) => Promise<PurchaseResult>;
  purchaseDailyItem: (itemId: string) => Promise<PurchaseResult>;
  purchaseGoldItem: (itemId: string) => Promise<PurchaseResult>;
  subscribeProduct: (productId: string) => Promise<PurchaseResult>;

  // Daily Shop
  refreshDailyShop: () => void;
  getTimeUntilRefresh: () => number;

  // Computed
  canAfford: (price: number, currency: CurrencyType) => boolean;
  getDailyPurchaseCount: (itemId: string) => number;
}

export const useShopStore = create<ShopState>()(
  devtools(
    (set, get) => ({
      // Initial State
      diamondProducts: [],
      packageProducts: [],
      dailyShopItems: [],
      goldShopItems: [],
      subscriptions: [],
      gold: 0,
      diamond: 0,
      dailyShopRefreshTime: null,
      dailyShopSeed: '',
      selectedProduct: null,
      showPurchaseModal: false,
      showResultModal: false,
      lastPurchaseResult: null,
      isLoading: false,
      activeTab: 'diamond',

      // Setters
      setDiamondProducts: (diamondProducts) => set({ diamondProducts }),
      setPackageProducts: (packageProducts) => set({ packageProducts }),
      setDailyShopItems: (dailyShopItems) => set({ dailyShopItems }),
      setGoldShopItems: (goldShopItems) => set({ goldShopItems }),
      setSubscriptions: (subscriptions) => set({ subscriptions }),
      setCurrency: (gold, diamond) => set({ gold, diamond }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
      setShowPurchaseModal: (showPurchaseModal) => set({ showPurchaseModal }),
      setShowResultModal: (showResultModal) => set({ showResultModal }),

      // Purchase Actions
      purchaseDiamond: async (productId) => {
        const { diamondProducts } = get();
        const product = diamondProducts.find((p) => p.id === productId);

        if (!product) {
          return { success: false, message: '상품을 찾을 수 없습니다' };
        }

        set({ isLoading: true });

        // 실제로는 IAP 결제 및 서버 검증
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const totalDiamonds = product.diamonds + product.bonusDiamonds;

        set((state) => ({
          diamond: state.diamond + totalDiamonds,
          isLoading: false,
          lastPurchaseResult: {
            success: true,
            message: `💎 ${totalDiamonds.toLocaleString()} 다이아를 획득했습니다!`,
            rewards: [{ type: 'diamond', amount: totalDiamonds, name: '다이아', icon: '💎' }],
          },
          showPurchaseModal: false,
          showResultModal: true,
        }));

        return get().lastPurchaseResult!;
      },

      purchasePackage: async (productId) => {
        const { packageProducts } = get();
        const product = packageProducts.find((p) => p.id === productId);

        if (!product) {
          return { success: false, message: '상품을 찾을 수 없습니다' };
        }

        if (product.purchaseLimit && product.purchasedCount >= product.purchaseLimit) {
          return { success: false, message: '구매 한도에 도달했습니다' };
        }

        set({ isLoading: true });

        // 실제로는 IAP 결제 및 서버 검증
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 보상 적용
        let goldReward = 0;
        let diamondReward = 0;

        product.contents.forEach((content) => {
          if (content.type === 'gold') goldReward += content.amount;
          if (content.type === 'diamond') diamondReward += content.amount;
        });

        set((state) => ({
          gold: state.gold + goldReward,
          diamond: state.diamond + diamondReward,
          packageProducts: state.packageProducts.map((p) =>
            p.id === productId ? { ...p, purchasedCount: p.purchasedCount + 1 } : p,
          ),
          isLoading: false,
          lastPurchaseResult: {
            success: true,
            message: `${product.nameKo}을(를) 구매했습니다!`,
            rewards: product.contents,
          },
          showPurchaseModal: false,
          showResultModal: true,
        }));

        return get().lastPurchaseResult!;
      },

      purchaseDailyItem: async (itemId) => {
        const { dailyShopItems, gold, diamond } = get();
        const item = dailyShopItems.find((i) => i.id === itemId);

        if (!item) {
          return { success: false, message: '상품을 찾을 수 없습니다' };
        }

        if (item.isPurchased) {
          return { success: false, message: '이미 구매한 상품입니다' };
        }

        const canAfford = item.currency === 'gold' ? gold >= item.price : diamond >= item.price;

        if (!canAfford) {
          return { success: false, message: '재화가 부족합니다' };
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));

        set((state) => ({
          gold: item.currency === 'gold' ? state.gold - item.price : state.gold,
          diamond: item.currency === 'diamond' ? state.diamond - item.price : state.diamond,
          dailyShopItems: state.dailyShopItems.map((i) =>
            i.id === itemId ? { ...i, isPurchased: true } : i,
          ),
          isLoading: false,
          lastPurchaseResult: {
            success: true,
            message: `${item.name}을(를) 구매했습니다!`,
            rewards: [{ type: item.type, amount: item.amount, name: item.name, icon: item.icon }],
          },
          showPurchaseModal: false,
          showResultModal: true,
        }));

        return get().lastPurchaseResult!;
      },

      purchaseGoldItem: async (itemId) => {
        const { goldShopItems, diamond } = get();
        const item = goldShopItems.find((i) => i.id === itemId);

        if (!item) {
          return { success: false, message: '상품을 찾을 수 없습니다' };
        }

        if (item.purchasedToday >= item.dailyLimit) {
          return { success: false, message: '일일 구매 한도에 도달했습니다' };
        }

        if (diamond < item.price) {
          return { success: false, message: '다이아가 부족합니다' };
        }

        set({ isLoading: true });

        // 실제로는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));

        set((state) => ({
          gold: state.gold + item.amount,
          diamond: state.diamond - item.price,
          goldShopItems: state.goldShopItems.map((i) =>
            i.id === itemId ? { ...i, purchasedToday: i.purchasedToday + 1 } : i,
          ),
          isLoading: false,
          lastPurchaseResult: {
            success: true,
            message: `🪙 ${item.amount.toLocaleString()} 골드를 획득했습니다!`,
            rewards: [{ type: 'gold', amount: item.amount, name: '골드', icon: '🪙' }],
          },
          showPurchaseModal: false,
          showResultModal: true,
        }));

        return get().lastPurchaseResult!;
      },

      subscribeProduct: async (productId) => {
        set({ isLoading: true });

        // 실제로는 구독 결제 처리
        await new Promise((resolve) => setTimeout(resolve, 1000));

        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === productId
              ? { ...s, isActive: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
              : s,
          ),
          isLoading: false,
          lastPurchaseResult: {
            success: true,
            message: '구독이 시작되었습니다!',
          },
          showPurchaseModal: false,
          showResultModal: true,
        }));

        return get().lastPurchaseResult!;
      },

      // Daily Shop
      refreshDailyShop: () => {
        // 다음 자정까지의 시간 계산
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        set({
          dailyShopRefreshTime: tomorrow,
          dailyShopSeed: `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`,
        });
      },

      getTimeUntilRefresh: () => {
        const { dailyShopRefreshTime } = get();
        if (!dailyShopRefreshTime) return 0;
        return Math.max(0, dailyShopRefreshTime.getTime() - Date.now());
      },

      // Computed
      canAfford: (price, currency) => {
        const { gold, diamond } = get();
        if (currency === 'gold') return gold >= price;
        if (currency === 'diamond') return diamond >= price;
        return true; // KRW는 항상 true (실제 결제는 별도)
      },

      getDailyPurchaseCount: (itemId) => {
        const item = get().goldShopItems.find((i) => i.id === itemId);
        return item?.purchasedToday || 0;
      },
    }),
    { name: 'ShopStore' },
  ),
);

// Selectors
export const useActiveSubscription = () =>
  useShopStore((state) => state.subscriptions.find((s) => s.isActive));

export const useDailyShopRefreshTime = () => useShopStore((state) => state.getTimeUntilRefresh());

export const useCanAffordDiamond = (productId: string) =>
  useShopStore((state) => {
    const product = state.diamondProducts.find((p) => p.id === productId);
    return product ? true : false; // IAP는 항상 구매 가능 (결제 플로우에서 처리)
  });
