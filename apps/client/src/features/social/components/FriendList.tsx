import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore, type FriendStatus } from '../stores/useSocialStore';
import FriendCard from './FriendCard';

interface FriendListProps {
  onVisitPark: (friendId: string) => void;
  onSendGift: (friendId: string) => void;
}

export default function FriendList({ onVisitPark, onSendGift }: FriendListProps) {
  const { friends, friendRequests, acceptRequest, rejectRequest } =
    useSocialStore();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [statusFilter, setStatusFilter] = useState<FriendStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 친구 필터링
  const filteredFriends = friends.filter((friend) => {
    const matchesStatus = statusFilter === 'all' || friend.status === statusFilter;
    const matchesSearch =
      friend.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.parkName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 온라인 친구 수
  const onlineCount = friends.filter((f) => f.status === 'online').length;

  // 대기 중인 요청 수
  const pendingCount = friendRequests.length;

  const tabs = [
    { id: 'friends' as const, label: '친구 목록', count: friends.length },
    { id: 'requests' as const, label: '친구 요청', count: pendingCount },
  ];

  const statusFilters = [
    { id: 'all' as const, label: '전체', icon: '👥' },
    { id: 'online' as const, label: '온라인', icon: '🟢' },
    { id: 'playing' as const, label: '플레이 중', icon: '🎮' },
    { id: 'offline' as const, label: '오프라인', icon: '⚫' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 rounded-lg bg-gray-800 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`
                ml-2 rounded-full px-2 py-0.5 text-xs
                ${activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-700'}
              `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'friends' && (
        <>
          {/* 검색 및 필터 */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* 검색창 */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="친구 검색..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            </div>

            {/* 상태 필터 */}
            <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`
                    rounded px-3 py-1 text-xs transition-all
                    ${statusFilter === filter.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}
                  `}
                >
                  {filter.icon} {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 온라인 상태 요약 */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>
              {onlineCount}명 온라인 / 총 {friends.length}명
            </span>
          </div>

          {/* 친구 목록 */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredFriends.map((friend) => (
                <motion.div
                  key={friend.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <FriendCard
                    friend={friend}
                    onVisitPark={() => onVisitPark(friend.id)}
                    onSendGift={() => onSendGift(friend.id)}
                    onRemove={() => { /* TODO: implement removeFriend */ }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 빈 상태 */}
          {filteredFriends.length === 0 && (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-gray-800 text-gray-500">
              {searchQuery || statusFilter !== 'all' ? (
                <>
                  <span className="mb-2 text-4xl">🔍</span>
                  <span>검색 결과가 없습니다</span>
                </>
              ) : (
                <>
                  <span className="mb-2 text-4xl">👥</span>
                  <span>아직 친구가 없습니다</span>
                  <span className="text-sm">새로운 친구를 추가해보세요!</span>
                </>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {/* 받은 요청 */}
          <h4 className="font-medium text-white">받은 요청</h4>
          {friendRequests.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-gray-800 text-gray-500">
              <span className="mb-2 text-3xl">📬</span>
              <span>대기 중인 친구 요청이 없습니다</span>
            </div>
          ) : (
            <div className="space-y-2">
              {friendRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800 p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold">
                        {request.fromNickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{request.fromNickname}</div>
                        <div className="text-xs text-gray-500">Lv.{request.fromLevel}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium transition-all hover:bg-green-500"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium transition-all hover:bg-red-900 hover:text-red-400"
                      >
                        거절
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
