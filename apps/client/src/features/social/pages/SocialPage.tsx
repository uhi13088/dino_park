import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore, type Friend } from '../stores/useSocialStore';
import FriendList from '../components/FriendList';
import FriendParkVisit from '../components/FriendParkVisit';
import AddFriendModal from '../components/AddFriendModal';

export default function SocialPage() {
  const {
    friends,
    friendRequests,
    guestbooks,
    gifts,
    setFriends,
    setFriendRequests,
    setGuestbooks,
    setGifts,
    sendGift,
    leaveGuestbook,
  } = useSocialStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'gifts' | 'guestbook'>('friends');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const loadSocialData = async () => {
      setIsLoading(true);

      // 실제로는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 임시 데이터
      const mockFriends: Friend[] = [
        {
          id: 'friend1',
          nickname: 'DinoMaster',
          level: 25,
          profileImage: undefined,
          status: 'online',
          lastOnline: new Date(),
          parkName: '다이노 마스터 파크',
          intimacy: 85,
          canSendGift: true,
        },
        {
          id: 'friend2',
          nickname: 'JurassicFan',
          level: 18,
          profileImage: undefined,
          status: 'playing',
          lastOnline: new Date(),
          parkName: '쥬라기 왕국',
          intimacy: 60,
          canSendGift: true,
        },
        {
          id: 'friend3',
          nickname: 'ParkBuilder',
          level: 32,
          profileImage: undefined,
          status: 'offline',
          lastOnline: new Date(Date.now() - 3600000 * 5),
          parkName: '빌더의 낙원',
          intimacy: 45,
          canSendGift: false,
        },
        {
          id: 'friend4',
          nickname: 'DinoLover',
          level: 15,
          profileImage: undefined,
          status: 'offline',
          lastOnline: new Date(Date.now() - 3600000 * 24),
          parkName: '공룡 사랑 파크',
          intimacy: 30,
          canSendGift: true,
        },
      ];

      const mockRequests = [
        {
          id: 'req1',
          fromUserId: 'user1',
          fromNickname: 'NewDinoFan',
          fromLevel: 5,
          createdAt: new Date(),
          profileImage: undefined,
        },
        {
          id: 'req2',
          fromUserId: 'user2',
          fromNickname: 'RexHunter',
          fromLevel: 12,
          createdAt: new Date(Date.now() - 3600000),
          profileImage: undefined,
        },
      ];

      const mockGifts = [
        {
          id: 'gift1',
          fromUserId: 'friend1',
          fromNickname: 'DinoMaster',
          type: 'gold',
          quantity: 1000,
          receivedAt: new Date(),
          isClaimed: false,
        },
        {
          id: 'gift2',
          fromUserId: 'friend2',
          fromNickname: 'JurassicFan',
          type: 'energy',
          quantity: 5,
          receivedAt: new Date(Date.now() - 3600000),
          isClaimed: false,
        },
      ];

      const mockGuestbooks = [
        {
          id: 'gb1',
          visitorId: 'friend1',
          visitorNickname: 'DinoMaster',
          visitorLevel: 25,
          message: '멋진 파크네요! 다음에 또 올게요 🦕',
          createdAt: new Date(),
          profileImage: undefined,
        },
      ];

      setFriends(mockFriends);
      setFriendRequests(mockRequests);
      setGifts(mockGifts);
      setGuestbooks(mockGuestbooks);
      setIsLoading(false);
    };

    loadSocialData();
  }, [setFriends, setFriendRequests, setGifts, setGuestbooks]);

  const handleVisitPark = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
    }
  };

  const handleSendGift = async (friendId: string) => {
    await sendGift(friendId, 'gold', 500);
    // TODO: 성공 토스트 표시
  };

  const handleLeaveGuestbook = async (message: string) => {
    if (selectedFriend) {
      await leaveGuestbook(selectedFriend.id, message);
    }
  };

  const unclaimedGiftCount = gifts.filter((g) => !g.isClaimed).length;
  const pendingRequestCount = friendRequests.length; // All requests in store are pending

  const tabs = [
    { id: 'friends' as const, label: '친구', icon: '👥', count: friends.length },
    { id: 'gifts' as const, label: '선물함', icon: '🎁', count: unclaimedGiftCount },
    { id: 'guestbook' as const, label: '방명록', icon: '📝', count: guestbooks.length },
  ];

  const giftTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
    gold: { icon: '🪙', label: '골드', color: 'text-yellow-400' },
    diamond: { icon: '💎', label: '다이아', color: 'text-blue-400' },
    energy: { icon: '⚡', label: '에너지', color: 'text-green-400' },
    dna: { icon: '🧬', label: 'DNA', color: 'text-purple-400' },
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          className="text-6xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          👥
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">소셜</h1>
            <p className="text-sm text-gray-500">친구들과 함께하는 다이노 파크</p>
          </div>
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium transition-all hover:bg-blue-500"
          >
            <span>➕</span>
            <span>친구 추가</span>
          </button>
        </div>

        {/* 요청 알림 */}
        {pendingRequestCount > 0 && (
          <motion.div
            className="mt-3 flex items-center justify-between rounded-lg bg-blue-900/30 p-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📬</span>
              <span className="text-sm">
                <span className="font-semibold text-blue-400">{pendingRequestCount}</span>개의 친구
                요청이 있습니다
              </span>
            </div>
            <button
              onClick={() => setActiveTab('friends')}
              className="text-sm text-blue-400 hover:underline"
            >
              확인하기
            </button>
          </motion.div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex-1 px-4 py-3 text-sm font-medium transition-all
              ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`
                ml-2 rounded-full px-2 py-0.5 text-xs
                ${activeTab === tab.id ? 'bg-blue-900' : 'bg-gray-800'}
              `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FriendList onVisitPark={handleVisitPark} onSendGift={handleSendGift} />
            </motion.div>
          )}

          {activeTab === 'gifts' && (
            <motion.div
              key="gifts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 일괄 수령 버튼 */}
              {unclaimedGiftCount > 0 && (
                <button className="w-full rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 py-3 font-medium transition-all hover:from-pink-500 hover:to-purple-500">
                  🎁 {unclaimedGiftCount}개 선물 일괄 수령
                </button>
              )}

              {/* 선물 목록 */}
              {gifts.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-gray-800 text-gray-500">
                  <span className="mb-2 text-4xl">🎁</span>
                  <span>받은 선물이 없습니다</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {gifts.map((gift) => {
                    const config = giftTypeConfig[gift.type] || giftTypeConfig.gold;
                    return (
                      <motion.div
                        key={gift.id}
                        className={`
                          flex items-center justify-between rounded-lg p-4
                          ${gift.isClaimed ? 'bg-gray-800/50' : 'bg-gray-800'}
                        `}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 text-2xl">
                            {config.icon}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {gift.fromNickname}님의 선물
                            </div>
                            <div className={`text-sm ${config.color}`}>
                              {config.label} {gift.quantity.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {!gift.isClaimed && (
                          <button className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium transition-all hover:bg-pink-500">
                            수령
                          </button>
                        )}
                        {gift.isClaimed && <span className="text-sm text-gray-500">수령 완료</span>}
                      </motion.div>
                    );
                  })}
                </div>
              )}
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
              <h3 className="font-semibold text-white">내 파크 방명록</h3>

              {guestbooks.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-gray-800 text-gray-500">
                  <span className="mb-2 text-4xl">📝</span>
                  <span>아직 방명록이 없습니다</span>
                  <span className="text-sm">친구들이 파크를 방문하면 방명록이 남겨집니다</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {guestbooks.map((entry) => (
                    <motion.div
                      key={entry.id}
                      className="rounded-lg bg-gray-800 p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold">
                            {entry.visitorNickname.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{entry.visitorNickname}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-300">{entry.message}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 친구 파크 방문 모달 */}
      <AnimatePresence>
        {selectedFriend && (
          <FriendParkVisit
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
            onLeaveGuestbook={handleLeaveGuestbook}
            onSendGift={() => handleSendGift(selectedFriend.id)}
          />
        )}
      </AnimatePresence>

      {/* 친구 추가 모달 */}
      <AddFriendModal isOpen={showAddFriendModal} onClose={() => setShowAddFriendModal(false)} />
    </div>
  );
}
