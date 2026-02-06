import { motion, AnimatePresence } from 'framer-motion';
import {
  type DiamondProduct,
  type PackageProduct,
  type DailyShopItem,
  type GoldShopItem,
  type PurchaseResult,
  CURRENCY_CONFIG,
  useShopStore,
} from '../stores/useShopStore';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: DiamondProduct | PackageProduct | DailyShopItem | GoldShopItem | null;
  productType: 'diamond' | 'package' | 'daily' | 'gold';
  onConfirm: () => void;
}

function isDiamondProduct(product: unknown): product is DiamondProduct {
  return product !== null && typeof product === 'object' && 'diamonds' in (product as object);
}

function isPackageProduct(product: unknown): product is PackageProduct {
  return product !== null && typeof product === 'object' && 'contents' in (product as object);
}

function isDailyShopItem(product: unknown): product is DailyShopItem {
  return product !== null && typeof product === 'object' && 'slot' in (product as object);
}

function isGoldShopItem(product: unknown): product is GoldShopItem {
  return product !== null && typeof product === 'object' && 'dailyLimit' in (product as object);
}

export default function PurchaseModal({
  isOpen,
  onClose,
  product,
  productType: _productType,
  onConfirm,
}: PurchaseModalProps) {
  const { gold, diamond, isLoading, canAfford } = useShopStore();

  if (!product) return null;

  // 가격 및 재화 정보 추출
  const getPriceInfo = () => {
    if (isDiamondProduct(product)) {
      return { price: product.price, currency: 'krw' as const };
    }
    if (isPackageProduct(product)) {
      return { price: product.salePrice, currency: 'krw' as const };
    }
    if (isDailyShopItem(product)) {
      return { price: product.price, currency: product.currency };
    }
    if (isGoldShopItem(product)) {
      return { price: product.price, currency: 'diamond' as const };
    }
    return { price: 0, currency: 'krw' as const };
  };

  const priceInfo = getPriceInfo();
  const currencyConfig = CURRENCY_CONFIG[priceInfo.currency];
  const affordable = canAfford(priceInfo.price, priceInfo.currency);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-gray-900"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* 헤더 */}
            <div className="border-b border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">구매 확인</h3>
                <button
                  onClick={onClose}
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="p-4">
              {/* 다이아 상품 */}
              {isDiamondProduct(product) && (
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-4xl">
                    💎
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {product.diamonds.toLocaleString()}
                    {product.bonusDiamonds > 0 && (
                      <span className="ml-2 text-lg text-green-400">
                        +{product.bonusDiamonds.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-gray-400">다이아</div>
                  {product.isFirstPurchaseBonus && (
                    <div className="mt-2 inline-block rounded-full bg-yellow-600 px-3 py-1 text-xs font-medium">
                      🎁 첫 구매 {product.firstPurchaseMultiplier}배 보너스!
                    </div>
                  )}
                </div>
              )}

              {/* 패키지 상품 */}
              {isPackageProduct(product) && (
                <div className="mb-4">
                  <div className="mb-4 rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 text-center">
                    <span className="text-4xl">🎁</span>
                    <h4 className="mt-2 text-xl font-bold text-white">{product.nameKo}</h4>
                    <p className="mt-1 text-sm text-gray-400">{product.description}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">패키지 내용물</p>
                    {product.contents.map((content, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{content.icon}</span>
                          <span className="text-white">{content.name}</span>
                        </div>
                        <span className="text-gray-400">x{content.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {product.discountPercent > 0 && (
                    <div className="mt-4 text-center">
                      <span className="text-sm text-gray-500 line-through">
                        ₩{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs font-medium">
                        {product.discountPercent}% OFF
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 일일 상점 아이템 */}
              {isDailyShopItem(product) && (
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-800 text-3xl">
                    {product.icon}
                  </div>
                  <div className="text-xl font-bold text-white">{product.name}</div>
                  <div className="mt-1 text-gray-400">x{product.amount.toLocaleString()}</div>
                </div>
              )}

              {/* 골드 상점 아이템 */}
              {isGoldShopItem(product) && (
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 text-3xl">
                    🪙
                  </div>
                  <div className="text-xl font-bold text-white">{product.name}</div>
                  <div className="mt-1 text-gray-400">
                    오늘 구매: {product.purchasedToday}/{product.dailyLimit}
                  </div>
                </div>
              )}

              {/* 가격 */}
              <div className="rounded-xl bg-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">결제 금액</span>
                  <span className={`text-xl font-bold ${currencyConfig.color}`}>
                    {currencyConfig.icon}
                    {priceInfo.price.toLocaleString()}
                  </span>
                </div>
                {priceInfo.currency !== 'krw' && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">보유 재화</span>
                    <span className={affordable ? 'text-green-400' : 'text-red-400'}>
                      {currencyConfig.icon}
                      {priceInfo.currency === 'gold'
                        ? gold.toLocaleString()
                        : diamond.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* 구매 불가 경고 */}
              {!affordable && priceInfo.currency !== 'krw' && (
                <div className="mt-3 rounded-lg bg-red-900/30 p-3 text-center text-sm text-red-400">
                  ⚠️ 재화가 부족합니다
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 border-t border-gray-800 p-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-gray-700 py-3 font-semibold transition-all hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading || (!affordable && priceInfo.currency !== 'krw')}
                className={`
                  flex-1 rounded-xl py-3 font-semibold transition-all
                  ${
                    isLoading || (!affordable && priceInfo.currency !== 'krw')
                      ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                  }
                `}
              >
                {isLoading ? '처리 중...' : '구매하기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 구매 결과 모달
interface PurchaseResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PurchaseResult | null;
}

export function PurchaseResultModal({ isOpen, onClose, result }: PurchaseResultModalProps) {
  if (!result) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-gray-900"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* 헤더 */}
            <div
              className={`p-6 text-center ${result.success ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-pink-600'}`}
            >
              <motion.span
                className="text-5xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {result.success ? '🎉' : '😢'}
              </motion.span>
              <h3 className="mt-3 text-xl font-bold text-white">
                {result.success ? '구매 완료!' : '구매 실패'}
              </h3>
            </div>

            {/* 내용 */}
            <div className="p-4">
              <p className="mb-4 text-center text-gray-300">{result.message}</p>

              {/* 획득 보상 */}
              {result.success && result.rewards && result.rewards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">획득 보상</p>
                  {result.rewards.map((reward, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{reward.icon}</span>
                        <span className="text-white">{reward.name}</span>
                      </div>
                      <span className="font-bold text-green-400">
                        +{reward.amount.toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="p-4 pt-0">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold transition-all hover:from-blue-500 hover:to-purple-500"
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
