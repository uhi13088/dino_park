import { motion, AnimatePresence } from 'framer-motion';
import { type ExplorationReward as ExplorationRewardType } from '../stores/useExplorationStore';

interface ExplorationRewardProps {
  isOpen: boolean;
  onClose: () => void;
  reward: ExplorationRewardType | null;
}

export default function ExplorationReward({ isOpen, onClose, reward }: ExplorationRewardProps) {
  if (!reward) return null;

  const rewardItems = [
    reward.gold && {
      icon: '🪙',
      label: '골드',
      value: `+${reward.gold.toLocaleString()}`,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/30',
    },
    reward.dna && {
      icon: '🧬',
      label: 'DNA',
      value: `+${reward.dna}`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/30',
    },
    reward.exp && {
      icon: '⭐',
      label: '경험치',
      value: `+${reward.exp}`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
    },
    reward.egg && {
      icon: '🥚',
      label: `${reward.egg.type} 알`,
      value: '획득!',
      color: 'text-green-400',
      bgColor: 'bg-green-900/30',
      isRare: true,
    },
    reward.dinosaur && {
      icon: '🦕',
      label: reward.dinosaur.name,
      value: reward.dinosaur.rarity.toUpperCase(),
      color: 'text-pink-400',
      bgColor: 'bg-pink-900/30',
      isRare: true,
    },
    ...(reward.items || []).map((item) => ({
      icon: '📦',
      label: item.name,
      value: `x${item.quantity}`,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900/30',
    })),
  ].filter(Boolean);

  const hasRareReward = rewardItems.some((item) => item && 'isRare' in item && item.isRare);

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
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* 헤더 */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
              {/* 배경 파티클 */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-white/20"
                    initial={{
                      x: Math.random() * 400 - 200,
                      y: 100,
                      opacity: 0,
                    }}
                    animate={{
                      y: -100,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative"
              >
                <motion.span
                  className="text-6xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  🎉
                </motion.span>
              </motion.div>

              <motion.h2
                className="relative mt-2 text-2xl font-bold text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                탐험 완료!
              </motion.h2>

              {hasRareReward && (
                <motion.div
                  className="mt-2 inline-block rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  ✨ 희귀 보상 획득!
                </motion.div>
              )}
            </div>

            {/* 보상 목록 */}
            <div className="space-y-2 p-4">
              {rewardItems.map((item, idx) => {
                if (!item) return null;
                return (
                  <motion.div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl p-4 ${item.bgColor}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="text-3xl"
                        animate={
                          'isRare' in item && item.isRare
                            ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                            : {}
                        }
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                      >
                        {item.icon}
                      </motion.span>
                      <span className="font-medium text-white">{item.label}</span>
                    </div>
                    <motion.span
                      className={`text-lg font-bold ${item.color}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + idx * 0.1, type: 'spring' }}
                    >
                      {item.value}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>

            {/* 버튼 */}
            <div className="p-4 pt-0">
              <motion.button
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 font-semibold text-white transition-all hover:from-green-500 hover:to-emerald-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                확인
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 간단한 보상 카드 컴포넌트 (인라인 사용)
export function RewardCard({
  icon,
  label,
  value,
  color = 'text-white',
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-gray-300">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>
        {typeof value === 'number' ? `+${value.toLocaleString()}` : value}
      </span>
    </div>
  );
}
