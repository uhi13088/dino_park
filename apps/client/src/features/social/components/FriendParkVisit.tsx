import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Friend, type GuestbookEntry, useSocialStore } from '../stores/useSocialStore';

interface FriendParkVisitProps {
  friend: Friend;
  onClose: () => void;
  onLeaveGuestbook: (message: string) => void;
  onSendGift: () => void;
}

// 친구 파크의 공룡 데이터 (임시)
interface FriendDinosaur {
  id: string;
  name: string;
  species: string;
  level: number;
  rarity: string;
}

// 친구 파크의 건물 데이터 (임시)
interface FriendBuilding {
  id: string;
  name: string;
  level: number;
  type: string;
}

export default function FriendParkVisit({
  friend,
  onClose,
  onLeaveGuestbook,
  onSendGift,
}: FriendParkVisitProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dinosaurs' | 'buildings' | 'guestbook'>(
    'overview',
  );
  const [guestbookMessage, setGuestbookMessage] = useState('');
  const [parkData, setParkData] = useState<{
    dinosaurs: FriendDinosaur[];
    buildings: FriendBuilding[];
    stats: {
      totalRevenue: number;
      popularity: number;
      dinosaurCount: number;
      buildingCount: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { guestbook } = useSocialStore();
  const friendGuestbooks = guestbook.filter((g: GuestbookEntry) => g.visitorId === friend.id);

  // 파크 데이터 로드 (임시 데이터)
  useEffect(() => {
    const loadParkData = async () => {
      setIsLoading(true);
      // 실제로는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 800));

      setParkData({
        dinosaurs: [
          { id: '1', name: '티라노', species: '티라노사우루스', level: 15, rarity: 'legendary' },
          { id: '2', name: '트리', species: '트리케라톱스', level: 10, rarity: 'epic' },
          { id: '3', name: '벨로', species: '벨로시랩터', level: 8, rarity: 'rare' },
          { id: '4', name: '브라키', species: '브라키오사우루스', level: 12, rarity: 'epic' },
        ],
        buildings: [
          { id: '1', name: 'DNA 연구소', level: 5, type: 'production' },
          { id: '2', name: '방문자 센터', level: 3, type: 'service' },
          { id: '3', name: '레스토랑', level: 4, type: 'commercial' },
        ],
        stats: {
          totalRevenue: 125000,
          popularity: 4500,
          dinosaurCount: 15,
          buildingCount: 8,
        },
      });
      setIsLoading(false);
    };

    loadParkData();
  }, [friend.id]);

  const handleSubmitGuestbook = () => {
    if (guestbookMessage.trim()) {
      onLeaveGuestbook(guestbookMessage);
      setGuestbookMessage('');
    }
  };

  const rarityColors: Record<string, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  };

  const tabs = [
    { id: 'overview' as const, label: '개요', icon: '🏠' },
    { id: 'dinosaurs' as const, label: '공룡', icon: '🦕' },
    { id: 'buildings' as const, label: '건물', icon: '🏗️' },
    { id: 'guestbook' as const, label: '방명록', icon: '📝' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-gray-900"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* 헤더 */}
        <div className="relative bg-gradient-to-r from-blue-900 to-purple-900 p-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-black/30 p-2 text-white transition-all hover:bg-black/50"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold">
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
            <div>
              <h2 className="text-xl font-bold text-white">{friend.parkName}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>{friend.nickname}</span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs">Lv.{friend.level}</span>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="mt-4 flex gap-2">
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
              🎁 선물 보내기
            </button>
            <button
              onClick={() => setActiveTab('guestbook')}
              className="flex-1 rounded-lg bg-white/20 py-2 text-sm font-medium transition-all hover:bg-white/30"
            >
              📝 방명록 남기기
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-all
                ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <motion.div
                className="text-4xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                🦕
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && parkData && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-800 p-4">
                      <div className="text-2xl">🦕</div>
                      <div className="mt-1 text-2xl font-bold text-white">
                        {parkData.stats.dinosaurCount}
                      </div>
                      <div className="text-xs text-gray-500">보유 공룡</div>
                    </div>
                    <div className="rounded-xl bg-gray-800 p-4">
                      <div className="text-2xl">🏗️</div>
                      <div className="mt-1 text-2xl font-bold text-white">
                        {parkData.stats.buildingCount}
                      </div>
                      <div className="text-xs text-gray-500">건물 수</div>
                    </div>
                    <div className="rounded-xl bg-gray-800 p-4">
                      <div className="text-2xl">💰</div>
                      <div className="mt-1 text-2xl font-bold text-yellow-400">
                        {parkData.stats.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">시간당 수익</div>
                    </div>
                    <div className="rounded-xl bg-gray-800 p-4">
                      <div className="text-2xl">⭐</div>
                      <div className="mt-1 text-2xl font-bold text-blue-400">
                        {parkData.stats.popularity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">인기도</div>
                    </div>
                  </div>

                  {/* 하이라이트 공룡 */}
                  <div className="rounded-xl bg-gray-800 p-4">
                    <h4 className="mb-3 font-medium text-white">🌟 자랑 공룡</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-900/50 to-orange-900/50 text-3xl">
                        🦖
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {parkData.dinosaurs[0]?.name || '없음'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {parkData.dinosaurs[0]?.species || ''}
                        </div>
                        <div
                          className={`text-xs ${rarityColors[parkData.dinosaurs[0]?.rarity || 'common']}`}
                        >
                          Lv.{parkData.dinosaurs[0]?.level || 0} •{' '}
                          {parkData.dinosaurs[0]?.rarity?.toUpperCase() || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'dinosaurs' && parkData && (
                <motion.div
                  key="dinosaurs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {parkData.dinosaurs.map((dino) => (
                    <div
                      key={dino.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-800 p-3"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 text-2xl">
                        🦕
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{dino.name}</div>
                        <div className="text-sm text-gray-400">{dino.species}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white">Lv.{dino.level}</div>
                        <div className={`text-xs ${rarityColors[dino.rarity]}`}>
                          {dino.rarity.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'buildings' && parkData && (
                <motion.div
                  key="buildings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {parkData.buildings.map((building) => (
                    <div
                      key={building.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-800 p-3"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 text-2xl">
                        🏢
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{building.name}</div>
                        <div className="text-sm text-gray-400">{building.type}</div>
                      </div>
                      <div className="rounded bg-blue-900/50 px-2 py-1 text-sm text-blue-400">
                        Lv.{building.level}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'guestbook' && (
                <motion.div
                  key="guestbook"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* 방명록 작성 */}
                  <div className="rounded-xl bg-gray-800 p-4">
                    <textarea
                      value={guestbookMessage}
                      onChange={(e) => setGuestbookMessage(e.target.value)}
                      placeholder="방명록에 남길 메시지를 입력하세요..."
                      className="min-h-[80px] w-full resize-none rounded-lg bg-gray-700 p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={200}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{guestbookMessage.length}/200</span>
                      <button
                        onClick={handleSubmitGuestbook}
                        disabled={!guestbookMessage.trim()}
                        className={`
                          rounded-lg px-4 py-2 text-sm font-medium transition-all
                          ${
                            guestbookMessage.trim()
                              ? 'bg-blue-600 hover:bg-blue-500'
                              : 'cursor-not-allowed bg-gray-700 text-gray-500'
                          }
                        `}
                      >
                        남기기
                      </button>
                    </div>
                  </div>

                  {/* 방명록 목록 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">최근 방명록</h4>
                    {friendGuestbooks.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-xl bg-gray-800 text-gray-500">
                        <span>아직 방명록이 없습니다</span>
                      </div>
                    ) : (
                      friendGuestbooks.map((entry: GuestbookEntry) => (
                        <div key={entry.id} className="rounded-lg bg-gray-800 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">
                              {entry.visitorNickname}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-400">{entry.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
