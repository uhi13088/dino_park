import React from 'react';
import { motion } from 'framer-motion';
import { REWARD_CONFIG, type SeasonRewardItem } from '../stores/useSeasonStore';

interface SeasonRewardProps {
  reward: SeasonRewardItem;
  isClaimed: boolean;
  canClaim: boolean;
  isPremium?: boolean;
  onClaim?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function SeasonReward({
  reward,
  isClaimed,
  canClaim,
  isPremium = false,
  onClaim,
  size = 'md',
}: SeasonRewardProps) {
  const config = REWARD_CONFIG[reward.type] || {
    icon: '🎁',
    color: 'text-gray-500',
    name: reward.type,
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  const quantityClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <motion.div
      className={`relative flex flex-col items-center ${isPremium ? 'bg-gradient-to-b from-yellow-900/20 to-amber-900/20' : ''}`}
      whileHover={canClaim ? { scale: 1.05 } : {}}
      whileTap={canClaim ? { scale: 0.95 } : {}}
    >
      {/* 보상 아이콘 */}
      <button
        onClick={canClaim ? onClaim : undefined}
        disabled={!canClaim}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center rounded-lg
          transition-all duration-200
          ${
            isClaimed
              ? 'bg-gray-700 opacity-50'
              : canClaim
                ? isPremium
                  ? 'bg-gradient-to-br from-yellow-600 to-amber-700 shadow-lg shadow-yellow-500/20 hover:from-yellow-500 hover:to-amber-600'
                  : 'bg-gradient-to-br from-green-600 to-emerald-700 shadow-lg shadow-green-500/20 hover:from-green-500 hover:to-emerald-600'
                : 'border border-gray-700 bg-gray-800'
          }
        `}
      >
        <span className={isClaimed ? 'grayscale' : ''}>{config.icon}</span>
      </button>

      {/* 수량 */}
      <span
        className={`
        ${quantityClasses[size]}
        mt-1 font-medium
        ${isClaimed ? 'text-gray-500' : config.color}
      `}
      >
        {reward.quantity.toLocaleString()}
      </span>

      {/* 수령 완료 표시 */}
      {isClaimed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-gray-900/80 p-1">
            <span className="text-lg text-green-400">✓</span>
          </div>
        </div>
      )}

      {/* 프리미엄 표시 */}
      {isPremium && !isClaimed && (
        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500">
          <span className="text-xs">👑</span>
        </div>
      )}

      {/* 수령 가능 애니메이션 */}
      {canClaim && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-lg border-2 border-yellow-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
