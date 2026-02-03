import React from 'react';
import { motion } from 'framer-motion';
import { type Friend, STATUS_CONFIG } from '../stores/useSocialStore';

interface FriendCardProps {
  friend: Friend;
  onVisitPark: () => void;
  onSendGift: () => void;
  onRemove?: () => void;
}

export default function FriendCard({ friend, onVisitPark, onSendGift, onRemove }: FriendCardProps) {
  const statusConfig = STATUS_CONFIG[friend.status];

  // 마지막 접속 시간 포맷
  const formatLastOnline = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <motion.div
      className="rounded-xl border border-gray-700 bg-gray-800 p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start gap-3">
        {/* 프로필 이미지 */}
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold">
            {friend.profileImage ? (
              <img
                src={friend.profileImage}
                alt={friend.nickname}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              friend.nickname.charAt(0).toUpperCase()
            )}
          </div>
          {/* 상태 표시 */}
          <div className="absolute -bottom-1 -right-1 text-lg">{statusConfig.icon}</div>
        </div>

        {/* 친구 정보 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold text-white">{friend.nickname}</h4>
            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
              Lv.{friend.level}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
            <span className={statusConfig.color}>{statusConfig.label}</span>
            {friend.status === 'offline' && friend.lastOnline && (
              <span>• {formatLastOnline(friend.lastOnline)}</span>
            )}
          </div>

          {/* 파크 이름 */}
          <div className="mt-1 truncate text-xs text-gray-500">🏞️ {friend.parkName}</div>

          {/* 친밀도 바 */}
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-500">친밀도</span>
              <span className="text-pink-400">❤️ {friend.intimacy}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${friend.intimacy}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={onVisitPark}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium transition-all hover:bg-blue-500"
        >
          🏠 파크 방문
        </button>
        <button
          onClick={onSendGift}
          disabled={!friend.canSendGift}
          className={`
            flex-1 rounded-lg py-2 text-sm font-medium transition-all
            ${
              friend.canSendGift
                ? 'bg-pink-600 hover:bg-pink-500'
                : 'cursor-not-allowed bg-gray-700 text-gray-500'
            }
          `}
        >
          🎁 선물
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="rounded-lg bg-gray-700 px-3 py-2 text-sm text-gray-400 transition-all hover:bg-red-900 hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}
