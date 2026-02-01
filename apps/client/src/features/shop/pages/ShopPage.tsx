import { useState } from 'react';
import { useGameStore } from '@/stores/useGameStore';

/**
 * 상점 페이지 - IAP 및 게임 내 상점
 */
export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<'diamond' | 'package' | 'daily'>('diamond');
  const { gold, diamond } = useGameStore();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 보유 재화 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-center gap-8">
          <CurrencyDisplay icon="🪙" amount={gold} label="골드" />
          <CurrencyDisplay icon="💎" amount={diamond} label="다이아" />
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200 flex">
        <ShopTab
          active={activeTab === 'diamond'}
          onClick={() => setActiveTab('diamond')}
        >
          💎 다이아 충전
        </ShopTab>
        <ShopTab
          active={activeTab === 'package'}
          onClick={() => setActiveTab('package')}
        >
          📦 패키지
        </ShopTab>
        <ShopTab
          active={activeTab === 'daily'}
          onClick={() => setActiveTab('daily')}
        >
          🏷️ 일일 상점
        </ShopTab>
      </div>

      {/* 상품 목록 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'diamond' && <DiamondShop />}
        {activeTab === 'package' && <PackageShop />}
        {activeTab === 'daily' && <DailyShop />}
      </div>
    </div>
  );
}

function CurrencyDisplay({ icon, amount, label }: { icon: string; amount: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-bold">{amount.toLocaleString()}</p>
      </div>
    </div>
  );
}

function ShopTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-500'
      }`}
    >
      {children}
    </button>
  );
}

function DiamondShop() {
  const products = [
    { id: 1, diamonds: 60, bonus: 0, price: 1100, popular: false },
    { id: 2, diamonds: 330, bonus: 30, price: 5500, popular: true },
    { id: 3, diamonds: 700, bonus: 80, price: 11000, popular: false },
    { id: 4, diamonds: 1500, bonus: 200, price: 22000, popular: false },
    { id: 5, diamonds: 3500, bonus: 600, price: 55000, popular: false },
    { id: 6, diamonds: 7500, bonus: 1500, price: 110000, popular: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => (
        <div
          key={product.id}
          className={`bg-white rounded-xl p-4 text-center relative ${
            product.popular ? 'ring-2 ring-secondary-500' : ''
          }`}
        >
          {product.popular && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-secondary-500 text-white text-xs px-2 py-0.5 rounded-full">
              인기
            </div>
          )}
          <div className="text-3xl mb-2">💎</div>
          <div className="font-bold text-lg">{product.diamonds.toLocaleString()}</div>
          {product.bonus > 0 && (
            <div className="text-secondary-500 text-sm">+{product.bonus} 보너스</div>
          )}
          <button className="w-full mt-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">
            ₩{product.price.toLocaleString()}
          </button>
        </div>
      ))}
    </div>
  );
}

function PackageShop() {
  const packages = [
    {
      id: 'starter',
      name: '스타터 팩',
      description: '초보자를 위한 필수 패키지',
      originalPrice: 15000,
      price: 5500,
      contents: ['💎 다이아 x500', '🦕 레어 공룡 알 x1', '🪙 골드 x50,000'],
    },
    {
      id: 'growth',
      name: '성장 패키지',
      description: '빠른 성장을 위한 패키지',
      originalPrice: 35000,
      price: 11000,
      contents: ['💎 다이아 x1,200', '⚡ 에너지 x100', '📜 경험치 부스터 x3'],
    },
  ];

  return (
    <div className="space-y-4">
      {packages.map((pkg) => (
        <div key={pkg.id} className="bg-white rounded-xl overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-4xl">🎁</span>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg">{pkg.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>
            <div className="space-y-1 mb-4">
              {pkg.contents.map((content, idx) => (
                <div key={idx} className="text-sm text-gray-700">• {content}</div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 line-through text-sm">
                  ₩{pkg.originalPrice.toLocaleString()}
                </span>
                <span className="text-red-500 font-bold ml-2">
                  ₩{pkg.price.toLocaleString()}
                </span>
              </div>
              <button className="px-6 py-2 bg-secondary-500 text-white rounded-lg font-medium">
                구매
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyShop() {
  const dailyItems = [
    { id: 1, name: '골드 x10,000', icon: '🪙', price: 50, currency: 'diamond' },
    { id: 2, name: '에너지 x10', icon: '⚡', price: 30, currency: 'diamond' },
    { id: 3, name: '경험치 부스터', icon: '📜', price: 100, currency: 'diamond' },
    { id: 4, name: '커먼 공룡 알', icon: '🥚', price: 5000, currency: 'gold' },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-500 text-center mb-4">
        ⏰ 갱신까지 12:34:56
      </div>
      {dailyItems.map((item) => (
        <div key={item.id} className="bg-white rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {item.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{item.name}</h3>
          </div>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium flex items-center gap-1">
            <span>{item.currency === 'diamond' ? '💎' : '🪙'}</span>
            <span>{item.price}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
