import React from 'react';
import { motion } from 'framer-motion';
import { type SeasonEvent, REWARD_CONFIG } from '../stores/useSeasonStore';

interface SeasonEventCardProps {
  event: SeasonEvent;
  onParticipate?: () => void;
}

export default function SeasonEventCard({ event, onParticipate }: SeasonEventCardProps) {
  // 이벤트 타입별 설정
  const eventTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
    collection: { icon: '📦', color: 'text-purple-400', bgColor: 'from-purple-900/50' },
    challenge: { icon: '⚔️', color: 'text-red-400', bgColor: 'from-red-900/50' },
    raid: { icon: '👥', color: 'text-blue-400', bgColor: 'from-blue-900/50' },
    competition: { icon: '🏆', color: 'text-yellow-400', bgColor: 'from-yellow-900/50' },
  };

  const config = eventTypeConfig[event.type] || {
    icon: '🎉',
    color: 'text-green-400',
    bgColor: 'from-green-900/50',
  };

  const isUrgent = event.daysRemaining <= 3;

  return (
    <motion.div
      className={`
        overflow-hidden rounded-xl bg-gradient-to-r ${config.bgColor} border
        to-gray-900 ${isUrgent ? 'border-red-500/50' : 'border-gray-700'}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="p-4">
        {/* 헤더 */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
              flex h-10 w-10 items-center justify-center rounded-lg
              bg-gray-800/80 text-xl
            `}
            >
              {config.icon}
            </div>
            <div>
              <h4 className="font-semibold text-white">{event.nameKo}</h4>
              <span className={`text-xs ${config.color}`}>{event.type.toUpperCase()}</span>
            </div>
          </div>

          {/* 남은 시간 */}
          <div
            className={`
            flex items-center gap-1 rounded-full px-2 py-1 text-xs
            ${isUrgent ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}
          `}
          >
            <span>⏳</span>
            <span>
              {isUrgent ? '마감 임박! ' : ''}
              {event.daysRemaining}일
            </span>
          </div>
        </div>

        {/* 설명 */}
        <p className="mb-3 text-sm text-gray-400">{event.description}</p>

        {/* 보상 */}
        <div className="mb-3">
          <div className="mb-1 text-xs text-gray-500">보상</div>
          <div className="flex flex-wrap gap-2">
            {event.rewards.map((reward, idx) => {
              const rewardConfig = REWARD_CONFIG[reward.type] || {
                icon: '🎁',
                color: 'text-gray-500',
              };
              return (
                <span
                  key={idx}
                  className={`flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1 text-sm ${rewardConfig.color}`}
                >
                  <span>{rewardConfig.icon}</span>
                  <span>{reward.quantity.toLocaleString()}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* 참여 버튼 */}
        {onParticipate && (
          <button
            onClick={onParticipate}
            className={`
              w-full rounded-lg py-2 font-medium transition-all
              ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
              }
            `}
          >
            {isUrgent ? '지금 참여하기!' : '참여하기'}
          </button>
        )}
      </div>

      {/* 긴급 표시 애니메이션 */}
      {isUrgent && (
        <motion.div
          className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ backgroundSize: '200% 200%' }}
        />
      )}
    </motion.div>
  );
}

// 이벤트 목록 컴포넌트
interface SeasonEventsListProps {
  events: SeasonEvent[];
  onParticipate?: (eventId: string) => void;
}

export function SeasonEventsList({ events, onParticipate }: SeasonEventsListProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-gray-800 text-gray-500">
        <span className="mb-2 text-4xl">🎪</span>
        <span>진행 중인 이벤트가 없습니다</span>
        <span className="text-sm">곧 새로운 이벤트가 시작됩니다!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white">시즌 이벤트</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <SeasonEventCard
            key={event.id}
            event={event}
            onParticipate={onParticipate ? () => onParticipate(event.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
