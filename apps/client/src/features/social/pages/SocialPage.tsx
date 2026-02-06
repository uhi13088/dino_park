import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore, type Friend } from '../stores/useSocialStore';
import FriendList from '../components/FriendList';
import FriendParkVisit from '../components/FriendParkVisit';
import AddFriendModal from '../components/AddFriendModal';
import {
  useFriends,
  useFriendRequests,
  useGifts,
  useGuestbook,
  useSendGift,
  useClaimGift,
  useClaimAllGifts,
} from '../../../api/queries';

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
    leaveGuestbook,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<'friends' | 'gifts' | 'guestbook'>('friends');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // API 쿼리
  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const { data: requestsData, isLoading: requestsLoading } = useFriendRequests();
  const { data: giftsData, isLoading: giftsLoading } = useGifts();
  const { data: guestbookData, isLoading: guestbookLoading } = useGuestbook();

  // API 뮤테이션
  const sendGiftMutation = useSendGift();
  const claimGiftMutation = useClaimGift();
  const claimAllGiftsMutation = useClaimAllGifts();

  const isLoading = friendsLoading || requestsLoading || giftsLoading || guestbookLoading;

  // API 데이터를 스토어에 동기화
  useEffect(() => {
    if (friendsData?.friends) {
      const mappedFriends: Friend[] = (
        friendsData.friends as Array<{
          id: string;
          nickname: string;
          level: number;
          profileImage?: string;
          status?: 'online' | 'offline' | 'playing';
          lastOnline?: string;
          parkName?: string;
          intimacy?: number;
          canSendGift?: boolean;
        }>
      ).map((f) => ({
        id: f.id,
        nickname: f.nickname,
        level: f.level,
        profileImage: f.profileImage,
        status: f.status || 'offline',
        lastOnline: f.lastOnline ? new Date(f.lastOnline) : new Date(),
        parkName: f.parkName || '이름 없는 파크',
        intimacy: f.intimacy || 0,
        canSendGift: f.canSendGift ?? true,
      }));
      setFriends(mappedFriends);
    }
  }, [friendsData, setFriends]);

  useEffect(() => {
    if (requestsData?.received) {
      const mappedRequests = (
        requestsData.received as Array<{
          id: string;
          fromUserId: string;
          fromNickname: string;
          fromLevel: number;
          createdAt: string;
          profileImage?: string;
        }>
      ).map((r) => ({
        id: r.id,
        fromUserId: r.fromUserId,
        fromNickname: r.fromNickname,
        fromLevel: r.fromLevel,
        createdAt: new Date(r.createdAt),
        profileImage: r.profileImage,
      }));
      setFriendRequests(mappedRequests);
    }
  }, [requestsData, setFriendRequests]);

  useEffect(() => {
    if (giftsData?.gifts) {
      const mappedGifts = (
        giftsData.gifts as Array<{
          id: string;
          senderId: string;
          senderNickname: string;
          giftType: string;
          giftItemId: string;
          status: string;
          createdAt: string;
        }>
      ).map((g) => ({
        id: g.id,
        fromUserId: g.senderId,
        fromNickname: g.senderNickname,
        type: g.giftType,
        quantity: 1,
        receivedAt: new Date(g.createdAt),
        isClaimed: g.status === 'CLAIMED',
      }));
      setGifts(mappedGifts);
    }
  }, [giftsData, setGifts]);

  useEffect(() => {
    if (guestbookData?.entries) {
      const mappedGuestbooks = (
        guestbookData.entries as Array<{
          id: string;
          visitorId: string;
          visitorNickname: string;
          visitorLevel?: number;
          message: string;
          createdAt: string;
          profileImage?: string;
        }>
      ).map((e) => ({
        id: e.id,
        visitorId: e.visitorId,
        visitorNickname: e.visitorNickname,
        visitorLevel: e.visitorLevel || 1,
        message: e.message,
        createdAt: new Date(e.createdAt),
        profileImage: e.profileImage,
      }));
      setGuestbooks(mappedGuestbooks);
    }
  }, [guestbookData, setGuestbooks]);

  const handleVisitPark = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
    }
  };

  const handleSendGift = async (friendId: string) => {
    try {
      await sendGiftMutation.mutateAsync({ friendId, giftType: 'daily_gold' });
    } catch (error) {
      console.error('Failed to send gift:', error);
    }
  };

  const handleClaimGift = async (giftId: string) => {
    try {
      await claimGiftMutation.mutateAsync(giftId);
    } catch (error) {
      console.error('Failed to claim gift:', error);
    }
  };

  const handleClaimAllGifts = async () => {
    try {
      await claimAllGiftsMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to claim all gifts:', error);
    }
  };

  const handleLeaveGuestbook = async (message: string) => {
    if (selectedFriend) {
      await leaveGuestbook(selectedFriend.id, message);
    }
  };

  const unclaimedGiftCount = gifts.filter((g) => !g.isClaimed).length;
  const pendingRequestCount = friendRequests.length;

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
                <button
                  onClick={handleClaimAllGifts}
                  disabled={claimAllGiftsMutation.isPending}
                  className="w-full rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 py-3 font-medium transition-all hover:from-pink-500 hover:to-purple-500 disabled:opacity-50"
                >
                  {claimAllGiftsMutation.isPending
                    ? '수령 중...'
                    : `🎁 ${unclaimedGiftCount}개 선물 일괄 수령`}
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
                          <button
                            onClick={() => handleClaimGift(gift.id)}
                            disabled={claimGiftMutation.isPending}
                            className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium transition-all hover:bg-pink-500 disabled:opacity-50"
                          >
                            {claimGiftMutation.isPending ? '...' : '수령'}
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
