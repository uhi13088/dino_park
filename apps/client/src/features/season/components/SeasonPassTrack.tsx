import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SeasonReward from './SeasonReward';
import { useSeasonStore, type PassReward } from '../stores/useSeasonStore';

interface SeasonPassTrackProps {
  onClaimFree: (level: number) => void;
  onClaimPremium: (level: number) => void;
  onUpgradePremium: () => void;
}

export default function SeasonPassTrack({
  onClaimFree,
  onClaimPremium,
  onUpgradePremium,
}: SeasonPassTrackProps) {
  const { seasonPass } = useSeasonStore();
  const trackRef = useRef<HTMLDivElement>(null);

  // 현재 레벨로 스크롤
  useEffect(() => {
    if (trackRef.current && seasonPass) {
      const currentLevelElement = trackRef.current.querySelector(
        `[data-level="${seasonPass.level}"]`,
      );
      if (currentLevelElement) {
        currentLevelElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }
    }
  }, [seasonPass?.level]);

  if (!seasonPass) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        시즌 패스 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 현재 진행 상황 */}
      <div className="rounded-xl bg-gray-800 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold">
              {seasonPass.level}
            </div>
            <div>
              <div className="font-semibold text-white">{seasonPass.seasonName}</div>
              <div className="text-sm text-gray-400">
                Lv.{seasonPass.level} / {seasonPass.maxLevel}
              </div>
            </div>
          </div>

          {/* 프리미엄 상태 */}
          {seasonPass.isPremium ? (
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 px-3 py-1">
              <span>👑</span>
              <span className="text-sm font-medium">PREMIUM</span>
            </div>
          ) : (
            <button
              onClick={onUpgradePremium}
              className="rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 px-4 py-2 text-sm font-medium transition-all hover:from-yellow-500 hover:to-amber-500"
            >
              프리미엄 구매
            </button>
          )}
        </div>

        {/* 경험치 바 */}
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>
              EXP: {seasonPass.exp.toLocaleString()} / {seasonPass.nextLevelExp.toLocaleString()}
            </span>
            <span>{Math.round(seasonPass.expProgress * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${seasonPass.expProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* 남은 기간 */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
          <span>⏳</span>
          <span>시즌 종료까지 {seasonPass.daysRemaining}일</span>
        </div>
      </div>

      {/* 보상 트랙 */}
      <div className="rounded-xl bg-gray-800 p-4">
        <h3 className="mb-3 font-semibold text-white">시즌 패스 보상</h3>

        {/* 수평 스크롤 트랙 */}
        <div ref={trackRef} className="scrollbar-hide overflow-x-auto pb-4">
          <div className="flex gap-2">
            {seasonPass.rewards.map((reward) => (
              <RewardColumn
                key={reward.level}
                reward={reward}
                currentLevel={seasonPass.level}
                isPremium={seasonPass.isPremium}
                onClaimFree={() => onClaimFree(reward.level)}
                onClaimPremium={() => onClaimPremium(reward.level)}
              />
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-600" />
            <span>무료 보상</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-yellow-600" />
            <span>프리미엄 보상</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-gray-600" />
            <span>미해금</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-gray-700 opacity-50" />
            <span>수령 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 개별 레벨 보상 컬럼
interface RewardColumnProps {
  reward: PassReward;
  currentLevel: number;
  isPremium: boolean;
  onClaimFree: () => void;
  onClaimPremium: () => void;
}

function RewardColumn({
  reward,
  currentLevel,
  isPremium,
  onClaimFree,
  onClaimPremium,
}: RewardColumnProps) {
  const isCurrentLevel = reward.level === currentLevel;
  const isUnlocked = reward.level <= currentLevel;

  return (
    <div
      data-level={reward.level}
      className={`
        flex min-w-[72px] flex-col items-center gap-2 rounded-lg p-2
        ${isCurrentLevel ? 'bg-blue-900/30 ring-2 ring-blue-500' : ''}
        ${!isUnlocked ? 'opacity-60' : ''}
      `}
    >
      {/* 레벨 번호 */}
      <div
        className={`
        flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
        ${
          isCurrentLevel
            ? 'bg-blue-500 text-white'
            : isUnlocked
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-500'
        }
      `}
      >
        {reward.level}
      </div>

      {/* 무료 보상 */}
      <SeasonReward
        reward={reward.freeReward}
        isClaimed={reward.isFreeClaimed}
        canClaim={reward.canClaimFree}
        isPremium={false}
        onClaim={onClaimFree}
        size="sm"
      />

      {/* 구분선 */}
      <div className="h-px w-full bg-gray-700" />

      {/* 프리미엄 보상 */}
      <div className={!isPremium ? 'opacity-50' : ''}>
        <SeasonReward
          reward={reward.premiumReward}
          isClaimed={reward.isPremiumClaimed}
          canClaim={reward.canClaimPremium}
          isPremium={true}
          onClaim={onClaimPremium}
          size="sm"
        />
      </div>

      {/* 프리미엄 잠금 표시 */}
      {!isPremium && !reward.isPremiumClaimed && <div className="text-xs text-yellow-500">🔒</div>}
    </div>
  );
}
