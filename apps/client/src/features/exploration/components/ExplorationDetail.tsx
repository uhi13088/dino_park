import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type ExplorationRegion,
  type Exploration,
  DIFFICULTY_CONFIG,
  REWARD_TYPE_CONFIG,
  REGION_EMOJI,
  useExplorationStore,
} from '../stores/useExplorationStore';

interface ExplorationDetailProps {
  region: ExplorationRegion;
  currentExploration?: Exploration | null;
  onClose: () => void;
  onStartExploration: () => void;
}

export default function ExplorationDetail({
  region,
  currentExploration,
  onClose,
  onStartExploration,
}: ExplorationDetailProps) {
  const { energy, canStartExploration, cancelExploration, isLoading } = useExplorationStore();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const difficultyConfig = DIFFICULTY_CONFIG[region.difficulty];
  const isExploringThisRegion =
    currentExploration?.regionId === region.id && currentExploration.status !== 'claimed';
  const canStart = canStartExploration(region);

  // 진행률 계산
  const progress = isExploringThisRegion
    ? Math.round(
        ((region.duration * 60 - (currentExploration?.remainingSeconds || 0)) /
          (region.duration * 60)) *
          100,
      )
    : 0;

  // 남은 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const handleCancel = async () => {
    if (currentExploration) {
      await cancelExploration(currentExploration.id);
      setShowCancelConfirm(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-gray-900"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* 헤더 이미지 */}
        <div className="relative h-48 bg-gradient-to-br from-blue-900 to-purple-900">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/30 p-2 text-white transition-all hover:bg-black/50"
          >
            ✕
          </button>

          {/* 지역 아이콘 */}
          <div className="flex h-full items-center justify-center">
            <motion.span
              className="text-8xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {REGION_EMOJI[region.id] || '🗺️'}
            </motion.span>
          </div>

          {/* 진행 중 오버레이 */}
          {isExploringThisRegion && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <motion.div
                className="text-4xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                🦕
              </motion.div>
              <span className="mt-2 font-semibold text-white">탐험 진행 중...</span>
              <span className="text-sm text-gray-300">{progress}% 완료</span>
            </div>
          )}

          {/* 잠금 오버레이 */}
          {!region.isUnlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <span className="text-5xl">🔒</span>
              <span className="mt-2 text-lg font-semibold text-white">
                Lv.{region.unlockLevel} 필요
              </span>
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 지역 정보 */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{region.nameKo}</h2>
              <span
                className={`rounded px-2 py-0.5 text-xs ${difficultyConfig.bgColor} ${difficultyConfig.color}`}
              >
                {difficultyConfig.icon} {difficultyConfig.label}
              </span>
            </div>
            <p className="mt-2 text-gray-400">{region.description}</p>
          </div>

          {/* 진행 중인 탐험 정보 */}
          {isExploringThisRegion && currentExploration && (
            <div className="mb-4 rounded-xl bg-blue-900/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">탐험 진행률</span>
                <span className="font-semibold text-white">{progress}%</span>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-gray-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">남은 시간</span>
                <span className="text-white">
                  {currentExploration.status === 'completed'
                    ? '완료!'
                    : formatTime(currentExploration.remainingSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* 탐험 정보 */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-800 p-3">
              <div className="text-sm text-gray-400">소모 에너지</div>
              <div className="mt-1 flex items-center gap-1 text-xl font-bold text-yellow-400">
                <span>⚡</span>
                <span>{region.energyCost}</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-800 p-3">
              <div className="text-sm text-gray-400">소요 시간</div>
              <div className="mt-1 text-xl font-bold text-white">{region.duration}분</div>
            </div>
          </div>

          {/* 획득 가능 보상 */}
          <div className="mb-4">
            <h4 className="mb-3 font-semibold text-white">🎁 획득 가능 보상</h4>
            <div className="space-y-2">
              {region.possibleRewards.map((reward, idx) => {
                const config = REWARD_TYPE_CONFIG[reward.type];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <span className="text-white">{reward.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reward.minAmount && reward.maxAmount && (
                        <span className={`text-sm ${config.color}`}>
                          {reward.minAmount.toLocaleString()} ~ {reward.maxAmount.toLocaleString()}
                        </span>
                      )}
                      <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                        {reward.chance}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 보너스 조건 */}
          {region.bonusConditions && region.bonusConditions.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-3 font-semibold text-white">✨ 보너스 조건</h4>
              <div className="space-y-2">
                {region.bonusConditions.map((bonus, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-purple-900/30 p-3"
                  >
                    <span className="text-sm text-gray-300">{bonus.description}</span>
                    <span className="font-semibold text-purple-400">+{bonus.bonusPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="border-t border-gray-800 p-4">
          {isExploringThisRegion ? (
            <div className="flex gap-2">
              {currentExploration?.status === 'completed' ? (
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold transition-all hover:from-green-500 hover:to-emerald-500"
                >
                  🎁 보상 수령하기
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="rounded-xl bg-gray-700 px-6 py-3 font-semibold transition-all hover:bg-red-900 hover:text-red-400"
                  >
                    취소
                  </button>
                  <button
                    disabled
                    className="flex-1 cursor-not-allowed rounded-xl bg-gray-700 py-3 font-semibold text-gray-500"
                  >
                    탐험 진행 중...
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onStartExploration}
                disabled={!canStart || isLoading}
                className={`
                  w-full rounded-xl py-3 font-semibold transition-all
                  ${
                    canStart && !isLoading
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                      : 'cursor-not-allowed bg-gray-700 text-gray-500'
                  }
                `}
              >
                {!region.isUnlocked
                  ? `🔒 Lv.${region.unlockLevel} 필요`
                  : energy < region.energyCost
                    ? `⚡ 에너지 부족 (${energy}/${region.energyCost})`
                    : currentExploration
                      ? '다른 탐험 진행 중'
                      : isLoading
                        ? '시작 중...'
                        : `⚡ ${region.energyCost} 에너지로 탐험 시작`}
              </button>
              <p className="text-center text-xs text-gray-500">현재 에너지: ⚡ {energy} / 30</p>
            </div>
          )}
        </div>

        {/* 취소 확인 모달 */}
        <AnimatePresence>
          {showCancelConfirm && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/80 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm rounded-xl bg-gray-800 p-6"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <h4 className="mb-4 text-lg font-semibold text-white">탐험을 취소하시겠습니까?</h4>
                <p className="mb-4 text-sm text-gray-400">
                  취소 시 소모한 에너지의 50%만 환불됩니다.
                  <br />
                  (환불: ⚡ {Math.floor(region.energyCost * 0.5)})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 rounded-lg bg-gray-700 py-2 font-medium transition-all hover:bg-gray-600"
                  >
                    계속 진행
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-red-600 py-2 font-medium transition-all hover:bg-red-500"
                  >
                    {isLoading ? '취소 중...' : '탐험 취소'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
