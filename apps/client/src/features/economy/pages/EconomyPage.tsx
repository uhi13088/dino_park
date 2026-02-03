import { useState } from 'react';
import { useEconomyStore } from '../stores/useEconomyStore';
import CurrencyPanel from '../components/CurrencyPanel';
import TransactionHistory from '../components/TransactionHistory';

// 탭 타입
type TabType = 'overview' | 'history';

/**
 * 경제 페이지 - 재화 관리 및 거래 내역
 */
export default function EconomyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { offlineReward, claimOfflineReward } = useEconomyStore();

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 오프라인 수익 배너 */}
      {offlineReward && offlineReward.gold > 0 && (
        <OfflineRewardBanner reward={offlineReward} onClaim={claimOfflineReward} />
      )}

      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            💰 재화 현황
          </TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            📜 거래 내역
          </TabButton>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' ? <OverviewTab /> : <TransactionHistory />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-center font-medium transition-colors ${
        active
          ? 'border-primary-600 text-primary-600 border-b-2'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// 오프라인 수익 배너
function OfflineRewardBanner({
  reward,
  onClaim,
}: {
  reward: { gold: number; duration: number; maxDuration: number; revenuePerHour: number };
  onClaim: () => void;
}) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const maxReached = reward.duration >= reward.maxDuration;

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 text-white">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="font-bold">오프라인 수익</h3>
          <p className="text-sm opacity-90">
            {formatDuration(reward.duration)} 동안 쌓인 수익
            {maxReached && <span className="ml-1">(최대)</span>}
          </p>
        </div>
        <button
          onClick={onClaim}
          className="rounded-lg bg-white px-4 py-2 font-bold text-orange-600 shadow-md transition-transform active:scale-95"
        >
          🪙 {reward.gold.toLocaleString()} 받기
        </button>
      </div>

      {/* 진행 바 */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full bg-white transition-all"
          style={{ width: `${(reward.duration / reward.maxDuration) * 100}%` }}
        />
      </div>
    </div>
  );
}

// 개요 탭
function OverviewTab() {
  const { hourlyRevenue } = useEconomyStore();

  return (
    <div className="overflow-auto p-4">
      {/* 재화 패널 */}
      <CurrencyPanel />

      {/* 수익 정보 */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-gray-800">수익 정보</h3>

        <div className="space-y-3">
          <RevenueItem label="시간당 수익" value={hourlyRevenue} icon="🪙" suffix="/h" />
          <RevenueItem label="일일 예상 수익" value={hourlyRevenue * 24} icon="🪙" suffix="/일" />
          <RevenueItem
            label="오프라인 최대 (8시간)"
            value={hourlyRevenue * 8 * 0.5}
            icon="🪙"
            description="오프라인 수익은 50%"
          />
        </div>
      </div>

      {/* 재화 획득 팁 */}
      <div className="mt-4 rounded-xl bg-blue-50 p-4">
        <h3 className="mb-2 font-bold text-blue-800">재화 획득 팁</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <span>💡</span>
            <span>공룡의 행복도를 높이면 수익이 증가합니다</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💡</span>
            <span>위인을 건물에 배정하면 효율이 올라갑니다</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💡</span>
            <span>일일 퀘스트를 완료하면 다이아를 받을 수 있습니다</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💡</span>
            <span>탐험을 통해 DNA와 희귀 아이템을 획득하세요</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// 수익 항목
function RevenueItem({
  label,
  value,
  icon,
  suffix,
  description,
}: {
  label: string;
  value: number;
  icon: string;
  suffix?: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <div className="flex items-center gap-1 font-bold text-yellow-600">
        <span>{icon}</span>
        <span>
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
    </div>
  );
}
