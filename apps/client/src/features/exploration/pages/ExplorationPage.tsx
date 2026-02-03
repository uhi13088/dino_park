import { useState } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import {
  useExplorationRegions,
  useExplorationInProgress,
  useStartExploration,
  useClaimExploration,
} from '@/api/queries';
import type {
  ExplorationRegionResponse,
  ExplorationResponse,
  ClaimExplorationResponse,
} from '@dino-park/shared';
import { Modal, Button, ProgressBar } from '@/components/ui';

/**
 * 탐험 페이지 - 탐험 시스템
 */
export default function ExplorationPage() {
  const { explorationEnergy } = useGameStore();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<ClaimExplorationResponse['rewards'] | null>(
    null,
  );

  // API 연동
  const { data: regionsData, isLoading: regionsLoading } = useExplorationRegions();
  const { data: inProgressData } = useExplorationInProgress();

  const startExploration = useStartExploration();
  const claimExploration = useClaimExploration();

  const regions = regionsData?.regions ?? [];
  const currentExploration = inProgressData ?? null;

  const handleStartExploration = async (regionId: string) => {
    try {
      await startExploration.mutateAsync(regionId);
    } catch (error) {
      console.error('탐험 시작 실패:', error);
    }
  };

  const handleClaimRewards = async (explorationId: string) => {
    try {
      const result = await claimExploration.mutateAsync(explorationId);
      setClaimedRewards(result.rewards);
      setShowRewardModal(true);
    } catch (error) {
      console.error('보상 수령 실패:', error);
    }
  };

  if (regionsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 에너지 표시 */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm text-gray-500">탐험 에너지</p>
              <p className="text-lg font-bold">{explorationEnergy} / 30</p>
            </div>
          </div>
          <button className="bg-secondary-500 rounded-lg px-4 py-2 text-sm font-medium text-white">
            + 충전
          </button>
        </div>

        {/* 에너지 바 */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
            style={{ width: `${(explorationEnergy / 30) * 100}%` }}
          />
        </div>
      </div>

      {/* 진행 중인 탐험 */}
      {currentExploration && currentExploration.status !== 'claimed' && (
        <div className="bg-primary-50 border-primary-200 border-b p-4">
          <InProgressCard
            exploration={currentExploration}
            onClaim={handleClaimRewards}
            isClaiming={claimExploration.isPending}
          />
        </div>
      )}

      {/* 지역 목록 */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {regions.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            currentEnergy={explorationEnergy}
            isExploring={!!currentExploration && currentExploration.status === 'in_progress'}
            onStartExploration={handleStartExploration}
            isStarting={startExploration.isPending}
          />
        ))}
      </div>

      {/* 보상 모달 */}
      <Modal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} title="탐험 완료!">
        <RewardDisplay rewards={claimedRewards} />
        <div className="mt-4">
          <Button variant="primary" className="w-full" onClick={() => setShowRewardModal(false)}>
            확인
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * 진행 중인 탐험 카드
 */
function InProgressCard({
  exploration,
  onClaim,
  isClaiming,
}: {
  exploration: ExplorationResponse;
  onClaim: (id: string) => void;
  isClaiming: boolean;
}) {
  const isCompleted = exploration.status === 'completed';
  const remainingSeconds = exploration.remainingSeconds ?? 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 flex h-12 w-12 items-center justify-center rounded-full">
            <span className="text-2xl">🦕</span>
          </div>
          <div>
            <p className="font-bold text-gray-800">탐험 진행 중</p>
            <p className="text-sm text-gray-500">
              {isCompleted ? '탐험 완료!' : `남은 시간: ${formatTime(remainingSeconds)}`}
            </p>
          </div>
        </div>

        {isCompleted ? (
          <Button variant="primary" onClick={() => onClaim(exploration.id)} disabled={isClaiming}>
            {isClaiming ? '수령 중...' : '보상 수령'}
          </Button>
        ) : (
          <div className="text-right">
            <p className="text-xs text-gray-500">진행률</p>
            <p className="text-primary-600 font-bold">
              {remainingSeconds > 0
                ? `${Math.round((1 - remainingSeconds / 3600) * 100)}%`
                : '100%'}
            </p>
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="mt-3">
          <ProgressBar
            value={remainingSeconds > 0 ? (1 - remainingSeconds / 3600) * 100 : 100}
            max={100}
            variant="primary"
          />
        </div>
      )}
    </div>
  );
}

/**
 * 지역 카드
 */
function RegionCard({
  region,
  currentEnergy,
  isExploring,
  onStartExploration,
  isStarting,
}: {
  region: ExplorationRegionResponse;
  currentEnergy: number;
  isExploring: boolean;
  onStartExploration: (regionId: string) => void;
  isStarting: boolean;
}) {
  const canExplore = region.isUnlocked && currentEnergy >= region.energyCost && !isExploring;

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-sm ${
        !region.isUnlocked ? 'opacity-60' : ''
      }`}
    >
      {/* 지역 이미지 Placeholder */}
      <div className="from-primary-400 to-primary-600 relative flex h-32 items-center justify-center bg-gradient-to-r">
        <span className="text-5xl">{getRegionEmoji(region.id)}</span>
        {!region.isUnlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <span className="text-3xl">🔒</span>
            <span className="mt-1 text-sm text-white">Lv.{region.unlockLevel} 필요</span>
          </div>
        )}
      </div>

      {/* 지역 정보 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-800">{region.name}</h3>
            <p className="text-sm text-gray-500">{region.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-600">
              <span>⚡</span>
              <span className="font-bold">{region.energyCost}</span>
            </div>
            <p className="text-xs text-gray-400">{region.duration}분</p>
          </div>
        </div>

        {/* 보상 미리보기 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {region.possibleRewards.map((reward, idx) => (
            <span key={idx} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {reward}
            </span>
          ))}
        </div>

        {/* 탐험 버튼 */}
        <button
          disabled={!canExplore || isStarting}
          onClick={() => canExplore && onStartExploration(region.id)}
          className={`mt-4 w-full rounded-lg py-3 font-bold transition-colors ${
            canExplore
              ? 'bg-primary-500 hover:bg-primary-600 text-white'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
        >
          {!region.isUnlocked
            ? '잠김'
            : isExploring
              ? '탐험 진행 중'
              : currentEnergy < region.energyCost
                ? '에너지 부족'
                : isStarting
                  ? '시작 중...'
                  : '탐험 시작'}
        </button>
      </div>
    </div>
  );
}

/**
 * 보상 표시
 */
function RewardDisplay({ rewards }: { rewards: ClaimExplorationResponse['rewards'] | null }) {
  if (!rewards) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <span className="text-6xl">🎉</span>
      </div>

      <div className="space-y-2">
        {rewards.gold && rewards.gold > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
            <span className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <span>골드</span>
            </span>
            <span className="font-bold text-yellow-600">+{rewards.gold.toLocaleString()}</span>
          </div>
        )}

        {rewards.dna && rewards.dna > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
            <span className="flex items-center gap-2">
              <span className="text-xl">🧬</span>
              <span>DNA</span>
            </span>
            <span className="font-bold text-purple-600">+{rewards.dna}</span>
          </div>
        )}

        {rewards.egg && (
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
            <span className="flex items-center gap-2">
              <span className="text-xl">🥚</span>
              <span>{rewards.egg.type} 알</span>
            </span>
            <span className="font-bold text-green-600">획득!</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getRegionEmoji(regionId: string): string {
  const emojis: Record<string, string> = {
    'emerald-island': '🏝️',
    'white-rock': '🏜️',
    'sunset-coast': '🌅',
    'deep-blue': '🌊',
    'storm-island': '⛈️',
    fossil_plains: '🏜️',
    volcanic_valley: '🌋',
    frozen_tundra: '🏔️',
    ancient_ruins: '🏛️',
  };
  return emojis[regionId] || '🗺️';
}
