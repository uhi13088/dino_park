import { motion } from 'framer-motion';
import {
  type DiamondProduct,
  type PackageProduct,
  type DailyShopItem,
  type GoldShopItem,
  CURRENCY_CONFIG,
} from '../stores/useShopStore';

// 다이아 상품 카드
interface DiamondProductCardProps {
  product: DiamondProduct;
  onClick: () => void;
}

export function DiamondProductCard({ product, onClick }: DiamondProductCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative w-full rounded-xl bg-gray-800 p-4 text-center transition-all
        ${product.isPopular ? 'ring-2 ring-yellow-500' : ''}
      `}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* 인기 뱃지 */}
      {product.isPopular && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-black">
          인기
        </div>
      )}

      {/* 첫 구매 보너스 뱃지 */}
      {product.isFirstPurchaseBonus && (
        <div className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium">
          x{product.firstPurchaseMultiplier}
        </div>
      )}

      {/* 아이콘 */}
      <div className="mb-2 text-4xl">💎</div>

      {/* 수량 */}
      <div className="text-xl font-bold text-white">{product.diamonds.toLocaleString()}</div>

      {/* 보너스 */}
      {product.bonusDiamonds > 0 && (
        <div className="text-sm text-green-400">
          +{product.bonusDiamonds.toLocaleString()} 보너스
        </div>
      )}

      {/* 가격 */}
      <div className="mt-3 rounded-lg bg-blue-600 py-2 font-medium">
        ₩{product.price.toLocaleString()}
      </div>
    </motion.button>
  );
}

// 패키지 상품 카드
interface PackageProductCardProps {
  product: PackageProduct;
  onClick: () => void;
}

export function PackageProductCard({ product, onClick }: PackageProductCardProps) {
  const isLimited = product.purchaseLimit !== undefined;
  const isSoldOut = isLimited && product.purchasedCount >= (product.purchaseLimit || 0);

  return (
    <motion.button
      onClick={onClick}
      disabled={isSoldOut}
      className={`
        w-full overflow-hidden rounded-xl bg-gray-800 text-left transition-all
        ${isSoldOut ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: isSoldOut ? 1 : 1.02 }}
      whileTap={{ scale: isSoldOut ? 1 : 0.98 }}
    >
      {/* 이미지 영역 */}
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600">
        <span className="text-4xl">🎁</span>

        {/* 할인 뱃지 */}
        {product.discountPercent > 0 && (
          <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
            {product.discountPercent}% OFF
          </div>
        )}

        {/* 품절 오버레이 */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-lg font-bold text-white">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-4">
        <h4 className="font-semibold text-white">{product.nameKo}</h4>
        <p className="mt-1 text-sm text-gray-400">{product.description}</p>

        {/* 내용물 미리보기 */}
        <div className="mt-2 flex flex-wrap gap-1">
          {product.contents.slice(0, 3).map((content, idx) => (
            <span key={idx} className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
              {content.icon} {content.amount.toLocaleString()}
            </span>
          ))}
          {product.contents.length > 3 && (
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-500">
              +{product.contents.length - 3}
            </span>
          )}
        </div>

        {/* 가격 */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            {product.originalPrice !== product.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                ₩{product.originalPrice.toLocaleString()}
              </span>
            )}
            <span className="ml-2 font-bold text-white">₩{product.salePrice.toLocaleString()}</span>
          </div>
          {isLimited && (
            <span className="text-xs text-gray-500">
              {product.purchasedCount}/{product.purchaseLimit}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// 일일 상점 아이템 카드
interface DailyShopItemCardProps {
  item: DailyShopItem;
  onClick: () => void;
  canAfford: boolean;
}

export function DailyShopItemCard({ item, onClick, canAfford }: DailyShopItemCardProps) {
  const currencyConfig = CURRENCY_CONFIG[item.currency];

  return (
    <motion.button
      onClick={onClick}
      disabled={item.isPurchased}
      className={`
        flex w-full items-center gap-4 rounded-xl bg-gray-800 p-4 text-left transition-all
        ${item.isPurchased ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: item.isPurchased ? 1 : 1.02 }}
      whileTap={{ scale: item.isPurchased ? 1 : 0.98 }}
    >
      {/* 아이콘 */}
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-700 text-3xl">
        {item.icon}
      </div>

      {/* 정보 */}
      <div className="flex-1">
        <div className="font-medium text-white">{item.name}</div>
        <div className="text-sm text-gray-400">x{item.amount.toLocaleString()}</div>
      </div>

      {/* 가격 */}
      {item.isPurchased ? (
        <div className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-500">구매 완료</div>
      ) : (
        <div
          className={`
            flex items-center gap-1 rounded-lg px-4 py-2 font-medium
            ${canAfford ? 'bg-blue-600' : 'bg-gray-700 text-gray-500'}
          `}
        >
          <span>{currencyConfig.icon}</span>
          <span>{item.price.toLocaleString()}</span>
        </div>
      )}
    </motion.button>
  );
}

// 골드 상점 아이템 카드
interface GoldShopItemCardProps {
  item: GoldShopItem;
  onClick: () => void;
  canAfford: boolean;
}

export function GoldShopItemCard({ item, onClick, canAfford }: GoldShopItemCardProps) {
  const isLimitReached = item.purchasedToday >= item.dailyLimit;

  return (
    <motion.button
      onClick={onClick}
      disabled={isLimitReached}
      className={`
        flex w-full items-center gap-4 rounded-xl bg-gray-800 p-4 text-left transition-all
        ${isLimitReached ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: isLimitReached ? 1 : 1.02 }}
      whileTap={{ scale: isLimitReached ? 1 : 0.98 }}
    >
      {/* 아이콘 */}
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 text-3xl">
        {item.icon}
      </div>

      {/* 정보 */}
      <div className="flex-1">
        <div className="font-medium text-white">{item.name}</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-400">🪙 {item.amount.toLocaleString()}</span>
          <span className="text-gray-500">
            ({item.purchasedToday}/{item.dailyLimit} 구매)
          </span>
        </div>
      </div>

      {/* 가격 */}
      {isLimitReached ? (
        <div className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-500">한도 도달</div>
      ) : (
        <div
          className={`
            flex items-center gap-1 rounded-lg px-4 py-2 font-medium
            ${canAfford ? 'bg-blue-600' : 'bg-gray-700 text-gray-500'}
          `}
        >
          <span>💎</span>
          <span>{item.price.toLocaleString()}</span>
        </div>
      )}
    </motion.button>
  );
}
