import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../stores/useSocialStore';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  nickname: string;
  level: number;
  parkName: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
}

export default function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { friends, sendFriendRequest } = useSocialStore();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 임시 검색 결과
    const mockResults: SearchResult[] = [
      {
        id: 'search1',
        nickname: searchQuery + '님의파크',
        level: Math.floor(Math.random() * 30) + 1,
        parkName: `${searchQuery}의 공룡 왕국`,
        isAlreadyFriend: false,
        hasPendingRequest: false,
      },
      {
        id: 'search2',
        nickname: `Dino${searchQuery}`,
        level: Math.floor(Math.random() * 30) + 1,
        parkName: '쥬라기 파크',
        isAlreadyFriend: friends.some((f) => f.nickname === `Dino${searchQuery}`),
        hasPendingRequest: false,
      },
    ];

    setSearchResults(mockResults);
    setIsSearching(false);
  };

  const handleSendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
    setSentRequests(new Set([...sentRequests, userId]));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
            className="w-full max-w-md overflow-hidden rounded-2xl bg-gray-900"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h3 className="text-lg font-semibold text-white">👥 친구 추가</h3>
              <button
                onClick={onClose}
                className="text-gray-500 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 검색 영역 */}
            <div className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="닉네임으로 검색..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className={`
                    rounded-lg px-4 py-2 font-medium transition-all
                    ${
                      searchQuery.trim() && !isSearching
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : 'cursor-not-allowed bg-gray-700 text-gray-500'
                    }
                  `}
                >
                  {isSearching ? '...' : '검색'}
                </button>
              </div>

              {/* 검색 팁 */}
              <p className="mt-2 text-xs text-gray-500">
                친구의 닉네임을 입력하여 검색하세요. 친구 코드로도 추가할 수 있습니다.
              </p>
            </div>

            {/* 검색 결과 */}
            <div className="max-h-64 overflow-y-auto border-t border-gray-800 p-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    className="text-3xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    🔍
                  </motion.div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <span className="mb-2 text-4xl">🦕</span>
                  <span>검색어를 입력하고 검색 버튼을 눌러주세요</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <motion.div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold">
                          {user.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{user.nickname}</span>
                            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
                              Lv.{user.level}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">🏞️ {user.parkName}</div>
                        </div>
                      </div>

                      {user.isAlreadyFriend ? (
                        <span className="rounded bg-green-900/50 px-3 py-1.5 text-sm text-green-400">
                          이미 친구
                        </span>
                      ) : sentRequests.has(user.id) || user.hasPendingRequest ? (
                        <span className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-400">
                          요청됨
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium transition-all hover:bg-blue-500"
                        >
                          요청
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 친구 코드 영역 */}
            <div className="border-t border-gray-800 p-4">
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-2 text-xs text-gray-500">내 친구 코드</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-white">DINO-ABCD-1234</span>
                  <button
                    onClick={() => navigator.clipboard.writeText('DINO-ABCD-1234')}
                    className="rounded bg-gray-700 px-3 py-1 text-sm transition-all hover:bg-gray-600"
                  >
                    복사
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
