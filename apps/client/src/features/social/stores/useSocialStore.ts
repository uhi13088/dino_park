import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 친구 상태
export type FriendStatus = 'online' | 'offline' | 'playing';

// 친구 정보
export interface Friend {
  id: string;
  nickname: string;
  level: number;
  status: FriendStatus;
  lastOnline: Date | null;
  parkName: string;
  intimacy: number; // 친밀도 (0-100)
  canSendGift: boolean;
  profileImage?: string;
}

// 친구 요청
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromNickname: string;
  fromLevel: number;
  createdAt: Date;
  profileImage?: string;
}

// 방명록 엔트리
export interface GuestbookEntry {
  id: string;
  visitorId: string;
  visitorNickname: string;
  visitorLevel: number;
  message: string;
  createdAt: Date;
  profileImage?: string;
}

// 선물 정보
export interface Gift {
  id: string;
  fromUserId: string;
  fromNickname: string;
  type: string;
  quantity: number;
  receivedAt: Date;
  isClaimed: boolean;
}

// 파크 방문 정보
export interface ParkVisit {
  friendId: string;
  friendNickname: string;
  parkName: string;
  parkLevel: number;
  dinosaurCount: number;
  buildingCount: number;
  popularity: number;
}

interface SocialState {
  // 친구 목록
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;
  removeFriend: (friendId: string) => void;

  // 친구 요청
  friendRequests: FriendRequest[];
  setFriendRequests: (requests: FriendRequest[]) => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;

  // 방명록 (guestbooks로 통일 - 복수형)
  guestbooks: GuestbookEntry[];
  setGuestbooks: (entries: GuestbookEntry[]) => void;
  addGuestbookEntry: (entry: GuestbookEntry) => void;
  leaveGuestbook: (friendId: string, message: string) => Promise<void>;

  // 선물
  gifts: Gift[];
  setGifts: (gifts: Gift[]) => void;
  claimGift: (giftId: string) => void;
  sendGift: (friendId: string, giftType: string, amount: number) => Promise<void>;

  // 파크 방문
  visitingPark: ParkVisit | null;
  setVisitingPark: (park: ParkVisit | null) => void;

  // 검색
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Friend[];
  setSearchResults: (results: Friend[]) => void;

  // 선택된 탭
  activeTab: 'friends' | 'requests' | 'guestbook' | 'gifts';
  setActiveTab: (tab: 'friends' | 'requests' | 'guestbook' | 'gifts') => void;

  // 모달 상태
  isAddFriendModalOpen: boolean;
  setAddFriendModalOpen: (open: boolean) => void;
  isGiftModalOpen: boolean;
  setGiftModalOpen: (open: boolean) => void;
  selectedFriend: Friend | null;
  setSelectedFriend: (friend: Friend | null) => void;

  // 로딩 상태
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // 리셋
  reset: () => void;
}

const initialState = {
  friends: [],
  friendRequests: [],
  guestbooks: [],
  gifts: [],
  visitingPark: null,
  searchQuery: '',
  searchResults: [],
  activeTab: 'friends' as const,
  isAddFriendModalOpen: false,
  isGiftModalOpen: false,
  selectedFriend: null,
  isLoading: false,
};

export const useSocialStore = create<SocialState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setFriends: (friends) => set({ friends }),

      removeFriend: (friendId) => {
        const { friends } = get();
        set({ friends: friends.filter((f) => f.id !== friendId) });
      },

      setFriendRequests: (friendRequests) => set({ friendRequests }),

      acceptRequest: (requestId) => {
        const { friendRequests } = get();
        set({
          friendRequests: friendRequests.filter((r) => r.id !== requestId),
        });
      },

      rejectRequest: (requestId) => {
        const { friendRequests } = get();
        set({
          friendRequests: friendRequests.filter((r) => r.id !== requestId),
        });
      },

      sendFriendRequest: async (_userId: string) => {
        // TODO: API 호출
      },

      acceptFriendRequest: async (requestId: string) => {
        const { friendRequests } = get();
        set({
          friendRequests: friendRequests.filter((r) => r.id !== requestId),
        });
        // TODO: API 호출
      },

      rejectFriendRequest: async (requestId: string) => {
        const { friendRequests } = get();
        set({
          friendRequests: friendRequests.filter((r) => r.id !== requestId),
        });
        // TODO: API 호출
      },

      setGuestbooks: (guestbooks) => set({ guestbooks }),

      addGuestbookEntry: (entry) => {
        const { guestbooks } = get();
        set({ guestbooks: [entry, ...guestbooks].slice(0, 50) });
      },

      leaveGuestbook: async (_friendId: string, _message: string) => {
        // TODO: API 호출
      },

      setGifts: (gifts) => set({ gifts }),

      claimGift: (giftId) => {
        const { gifts } = get();
        set({
          gifts: gifts.map((g) => (g.id === giftId ? { ...g, isClaimed: true } : g)),
        });
      },

      sendGift: async (_friendId: string, _giftType: string, _amount: number) => {
        // TODO: API 호출
      },

      setVisitingPark: (visitingPark) => set({ visitingPark }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setSearchResults: (searchResults) => set({ searchResults }),

      setActiveTab: (activeTab) => set({ activeTab }),

      setAddFriendModalOpen: (isAddFriendModalOpen) => set({ isAddFriendModalOpen }),

      setGiftModalOpen: (isGiftModalOpen) => set({ isGiftModalOpen }),

      setSelectedFriend: (selectedFriend) => set({ selectedFriend }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set(initialState),
    }),
    { name: 'SocialStore' },
  ),
);

// 셀렉터: 온라인 친구만
export const useOnlineFriends = () => {
  const { friends } = useSocialStore();
  return friends.filter((f) => f.status !== 'offline');
};

// 셀렉터: 친밀도 순 정렬
export const useFriendsByIntimacy = () => {
  const { friends } = useSocialStore();
  return [...friends].sort((a, b) => b.intimacy - a.intimacy);
};

// 셀렉터: 수령 가능한 선물 개수
export const useUnclaimedGiftsCount = () => {
  const { gifts } = useSocialStore();
  return gifts.filter((g) => !g.isClaimed).length;
};

// 셀렉터: 친구 요청 개수
export const useFriendRequestsCount = () => {
  const { friendRequests } = useSocialStore();
  return friendRequests.length;
};

// 상태 아이콘/색상
export const STATUS_CONFIG: Record<FriendStatus, { icon: string; color: string; label: string }> = {
  online: { icon: '🟢', color: 'text-green-400', label: '온라인' },
  playing: { icon: '🎮', color: 'text-blue-400', label: '게임 중' },
  offline: { icon: '⚫', color: 'text-gray-500', label: '오프라인' },
};
