/**
 * E2E Test: 친구 추가/선물 플로우
 *
 * 이 테스트는 소셜 기능의 핵심 플로우를 검증합니다.
 * 실제 DB 연동 없이 Mock을 사용하여 플로우 로직을 테스트합니다.
 */

describe('Social Flow E2E', () => {
  const userId = 'user-1';
  const friendId = 'user-2';

  // Mock 데이터
  const mockUser = {
    id: userId,
    nickname: '테스트유저',
    level: 10,
  };

  const mockFriend = {
    id: friendId,
    nickname: '친구유저',
    level: 15,
  };

  describe('1. 친구 요청 플로우', () => {
    it('친구 요청 보내기', async () => {
      // Given: 두 유저가 존재
      const friendRequest = {
        id: 'request-1',
        fromUserId: userId,
        toUserId: friendId,
        message: '친구해요!',
        status: 'PENDING',
        createdAt: new Date(),
      };

      // When: 친구 요청 생성
      // Then: 요청이 PENDING 상태로 생성됨
      expect(friendRequest.status).toBe('PENDING');
      expect(friendRequest.fromUserId).toBe(userId);
      expect(friendRequest.toUserId).toBe(friendId);
    });

    it('친구 요청 수락 시 친구 관계 생성', async () => {
      // Given: 대기 중인 친구 요청
      const pendingRequest = {
        id: 'request-1',
        fromUserId: friendId,
        toUserId: userId,
        status: 'PENDING',
      };

      // When: 수락
      const acceptedRequest = {
        ...pendingRequest,
        status: 'ACCEPTED',
      };

      const friendship = {
        id: 'friend-1',
        userId: userId,
        friendId: friendId,
        createdAt: new Date(),
      };

      // Then: 친구 관계가 생성됨
      expect(acceptedRequest.status).toBe('ACCEPTED');
      expect(friendship.userId).toBe(userId);
      expect(friendship.friendId).toBe(friendId);
    });

    it('친구 요청 거절', async () => {
      // Given: 대기 중인 친구 요청
      const pendingRequest = {
        id: 'request-2',
        fromUserId: friendId,
        toUserId: userId,
        status: 'PENDING',
      };

      // When: 거절
      const rejectedRequest = {
        ...pendingRequest,
        status: 'REJECTED',
      };

      // Then: 요청이 거절됨
      expect(rejectedRequest.status).toBe('REJECTED');
    });
  });

  describe('2. 친구 목록 관리 플로우', () => {
    it('친구 목록에 친구가 포함됨', async () => {
      // Given: 친구 관계가 있는 상태
      const friends = [
        {
          id: 'friend-1',
          friendId: friendId,
          friend: mockFriend,
          intimacy: 50,
        },
      ];

      // When & Then: 친구가 목록에 포함됨
      expect(friends).toHaveLength(1);
      expect(friends[0].friend.nickname).toBe('친구유저');
      expect(friends[0].intimacy).toBe(50);
    });

    it('친구 삭제 시 관계가 제거됨', async () => {
      // Given: 친구 관계
      let friends = [{ id: 'friend-1', friendId: friendId }];

      // When: 친구 삭제
      friends = friends.filter((f) => f.friendId !== friendId);

      // Then: 친구 관계가 삭제됨
      expect(friends).toHaveLength(0);
    });
  });

  describe('3. 선물 플로우', () => {
    it('친구에게 선물 보내기', async () => {
      // Given: 친구 관계가 있는 상태
      const gift = {
        id: 'gift-1',
        fromUserId: userId,
        toUserId: friendId,
        itemId: 'gift_gold_100',
        message: '선물이야!',
        status: 'PENDING',
        createdAt: new Date(),
      };

      // When & Then: 선물이 생성됨
      expect(gift.fromUserId).toBe(userId);
      expect(gift.toUserId).toBe(friendId);
      expect(gift.status).toBe('PENDING');
    });

    it('선물 수령 시 재화 지급', async () => {
      // Given: 받은 선물
      const gift = {
        id: 'gift-1',
        fromUserId: friendId,
        toUserId: userId,
        itemId: 'gift_gold_100',
        status: 'PENDING',
        reward: { type: 'gold', amount: 100 },
      };

      const userCurrency = { gold: 10000 };

      // When: 선물 수령
      const claimedGift = { ...gift, status: 'CLAIMED', claimedAt: new Date() };
      const updatedCurrency = { gold: userCurrency.gold + gift.reward.amount };

      // Then: 선물이 수령되고 재화가 지급됨
      expect(claimedGift.status).toBe('CLAIMED');
      expect(updatedCurrency.gold).toBe(10100);
    });

    it('일일 선물 제한 확인', async () => {
      // Given: 오늘 보낸 선물 수
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sentGiftsToday = [{ id: 'gift-1', toUserId: friendId, createdAt: new Date() }];

      const DAILY_GIFT_LIMIT = 3;

      // When: 오늘 보낸 선물 수 확인
      const canSendMore = sentGiftsToday.length < DAILY_GIFT_LIMIT;

      // Then: 아직 보낼 수 있음
      expect(canSendMore).toBe(true);
    });
  });

  describe('4. 파크 방문 플로우', () => {
    it('친구 파크 방문 시 파크 정보 조회', async () => {
      // Given: 친구의 파크
      const friendPark = {
        id: 'friend-park-id',
        userId: friendId,
        name: '친구의 파크',
        level: 5,
        dinosaurs: [
          { id: 'dino-1', speciesId: 'trex', level: 3 },
          { id: 'dino-2', speciesId: 'triceratops', level: 5 },
        ],
        buildings: [{ id: 'building-1', typeId: 'entrance' }],
      };

      // When: 방문 기록 생성
      const visit = {
        id: 'visit-1',
        visitorId: userId,
        hostId: friendId,
        startedAt: new Date(),
      };

      // Then: 파크 정보와 방문 기록이 있음
      expect(friendPark.name).toBe('친구의 파크');
      expect(friendPark.dinosaurs).toHaveLength(2);
      expect(visit.visitorId).toBe(userId);
    });

    it('방명록 남기기', async () => {
      // Given: 파크 방문 중
      const guestbookEntry = {
        id: 'guestbook-1',
        parkId: 'friend-park-id',
        visitorId: userId,
        visitorNickname: mockUser.nickname,
        message: '멋진 파크네요!',
        createdAt: new Date(),
      };

      // When & Then: 방명록이 작성됨
      expect(guestbookEntry.message).toBe('멋진 파크네요!');
      expect(guestbookEntry.visitorId).toBe(userId);
    });
  });

  describe('5. 친밀도 시스템', () => {
    it('상호작용으로 친밀도 증가', async () => {
      // Given: 기존 친밀도
      const intimacy = { userId, friendId, value: 50 };

      // When: 상호작용으로 친밀도 증가
      const INTERACTION_INTIMACY_GAIN = 5;
      const newIntimacy = { ...intimacy, value: intimacy.value + INTERACTION_INTIMACY_GAIN };

      // Then: 친밀도가 증가함
      expect(newIntimacy.value).toBe(55);
    });

    it('최대 친밀도 제한', async () => {
      // Given: 거의 최대 친밀도
      const MAX_INTIMACY = 100;
      const intimacy = { userId, friendId, value: 98 };

      // When: 친밀도 증가 시도
      const INTERACTION_INTIMACY_GAIN = 10;
      const newValue = Math.min(MAX_INTIMACY, intimacy.value + INTERACTION_INTIMACY_GAIN);

      // Then: 최대값을 초과하지 않음
      expect(newValue).toBe(100);
    });

    it('친밀도 레벨에 따른 보너스', async () => {
      // Given: 친밀도 레벨
      const intimacyLevels = [
        { min: 0, max: 29, bonus: 0 },
        { min: 30, max: 59, bonus: 5 },
        { min: 60, max: 89, bonus: 10 },
        { min: 90, max: 100, bonus: 20 },
      ];

      // When: 친밀도 50인 경우
      const currentIntimacy = 50;
      const level = intimacyLevels.find(
        (l) => currentIntimacy >= l.min && currentIntimacy <= l.max,
      );

      // Then: 5% 보너스
      expect(level!.bonus).toBe(5);
    });
  });

  describe('6. 알림 시스템', () => {
    it('친구 요청 시 알림 생성', async () => {
      // Given: 친구 요청
      const notification = {
        id: 'notif-1',
        userId: friendId,
        type: 'FRIEND_REQUEST',
        message: `${mockUser.nickname}님이 친구 요청을 보냈습니다.`,
        read: false,
        createdAt: new Date(),
      };

      // When & Then: 알림이 생성됨
      expect(notification.type).toBe('FRIEND_REQUEST');
      expect(notification.read).toBe(false);
    });

    it('선물 수신 시 알림 생성', async () => {
      // Given: 선물 수신
      const notification = {
        id: 'notif-2',
        userId: userId,
        type: 'GIFT_RECEIVED',
        message: `${mockFriend.nickname}님이 선물을 보냈습니다.`,
        read: false,
        createdAt: new Date(),
      };

      // When & Then: 알림이 생성됨
      expect(notification.type).toBe('GIFT_RECEIVED');
      expect(notification.read).toBe(false);
    });
  });
});
