import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SOCIAL_CONSTANTS,
  INTIMACY_REWARDS,
  VISIT_REWARDS,
  getGiftItemById,
} from '@dino-park/game-data';

/**
 * 친밀도 레벨업에 필요한 경험치
 * 레벨 * 100
 */
function getIntimacyExpForLevel(level: number): number {
  return level * 100;
}

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // 친구 시스템
  // ============================================================

  /**
   * 친구 목록 조회
   */
  async getFriends(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: {
        userId,
        status: 'ACCEPTED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // 친구 유저 정보 조회
    const friendIds = friends.map((f) => f.friendId);
    const friendUsers = await this.prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: {
        id: true,
        nickname: true,
        level: true,
        lastLoginAt: true,
        park: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    // 친밀도 정보 조회
    const intimacies = await this.prisma.friendIntimacy.findMany({
      where: {
        userId,
        friendId: { in: friendIds },
      },
    });

    const intimacyMap = new Map(intimacies.map((i) => [i.friendId, i]));
    const userMap = new Map(friendUsers.map((u) => [u.id, u]));

    return friends.map((friend) => {
      const user = userMap.get(friend.friendId);
      const intimacy = intimacyMap.get(friend.friendId);

      return {
        ...friend,
        friendProfile: user
          ? {
              userId: user.id,
              nickname: user.nickname,
              level: user.level,
              parkName: user.park?.name || 'My Dino Park',
              parkLevel: user.park?.level || 1,
              lastOnlineAt: user.lastLoginAt,
            }
          : null,
        intimacy: intimacy
          ? {
              level: intimacy.intimacyLevel,
              exp: intimacy.intimacyExp,
              expForNextLevel: getIntimacyExpForLevel(intimacy.intimacyLevel),
            }
          : null,
      };
    });
  }

  /**
   * 친구 요청 보내기
   */
  async sendFriendRequest(userId: string, targetUserId: string, message?: string) {
    // 자기 자신에게 요청 불가
    if (userId === targetUserId) {
      throw new BadRequestException('자신에게 친구 요청을 보낼 수 없습니다.');
    }

    // 대상 유저 존재 확인
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    // 이미 친구인지 확인
    const existingFriend = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: { userId, friendId: targetUserId },
      },
    });

    if (existingFriend) {
      if (existingFriend.status === 'ACCEPTED') {
        throw new ConflictException('이미 친구입니다.');
      }
      if (existingFriend.status === 'BLOCKED') {
        throw new ForbiddenException('차단된 유저입니다.');
      }
    }

    // 기존 요청 확인
    const existingRequest = await this.prisma.friendRequest.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
      },
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      throw new ConflictException('이미 친구 요청을 보냈습니다.');
    }

    // 상대방이 나에게 이미 요청을 보냈는지 확인
    const reverseRequest = await this.prisma.friendRequest.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: targetUserId, toUserId: userId },
      },
    });

    if (reverseRequest && reverseRequest.status === 'PENDING') {
      // 자동으로 친구 수락
      return this.acceptFriendRequest(userId, reverseRequest.id);
    }

    // 친구 요청 생성
    const request = await this.prisma.friendRequest.upsert({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
      },
      update: {
        status: 'PENDING',
        message,
        updatedAt: new Date(),
      },
      create: {
        fromUserId: userId,
        toUserId: targetUserId,
        message,
      },
    });

    // 알림 생성
    const fromUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    await this.createNotification(targetUserId, 'friendRequest', userId, fromUser?.nickname, {
      requestId: request.id,
    });

    return request;
  }

  /**
   * 친구 요청 수락
   */
  async acceptFriendRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException('이 요청을 수락할 권한이 없습니다.');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    // 트랜잭션으로 요청 상태 변경 + 양방향 친구 관계 생성
    const [, friend1] = await this.prisma.$transaction([
      // 요청 상태 변경
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      // 친구 관계 생성 (양방향)
      this.prisma.friend.upsert({
        where: {
          userId_friendId: { userId: request.toUserId, friendId: request.fromUserId },
        },
        update: { status: 'ACCEPTED' },
        create: {
          userId: request.toUserId,
          friendId: request.fromUserId,
          status: 'ACCEPTED',
        },
      }),
      this.prisma.friend.upsert({
        where: {
          userId_friendId: { userId: request.fromUserId, friendId: request.toUserId },
        },
        update: { status: 'ACCEPTED' },
        create: {
          userId: request.fromUserId,
          friendId: request.toUserId,
          status: 'ACCEPTED',
        },
      }),
      // 친밀도 초기화 (양방향)
      this.prisma.friendIntimacy.upsert({
        where: {
          userId_friendId: { userId: request.toUserId, friendId: request.fromUserId },
        },
        update: {},
        create: {
          userId: request.toUserId,
          friendId: request.fromUserId,
        },
      }),
      this.prisma.friendIntimacy.upsert({
        where: {
          userId_friendId: { userId: request.fromUserId, friendId: request.toUserId },
        },
        update: {},
        create: {
          userId: request.fromUserId,
          friendId: request.toUserId,
        },
      }),
    ]);

    // 알림 생성
    const toUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    await this.createNotification(
      request.fromUserId,
      'friendAccepted',
      userId,
      toUser?.nickname,
    );

    return { accepted: true, friend: friend1 };
  }

  /**
   * 친구 요청 거절
   */
  async rejectFriendRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException('이 요청을 거절할 권한이 없습니다.');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { rejected: true };
  }

  /**
   * 받은 친구 요청 목록
   */
  async getReceivedFriendRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        toUserId: userId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    const fromUserIds = requests.map((r) => r.fromUserId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: fromUserIds } },
      select: {
        id: true,
        nickname: true,
        level: true,
        park: { select: { name: true, level: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return requests.map((request) => ({
      ...request,
      fromUser: userMap.get(request.fromUserId),
    }));
  }

  /**
   * 친구 삭제
   */
  async removeFriend(userId: string, friendId: string) {
    // 양방향 친구 관계 삭제
    await this.prisma.$transaction([
      this.prisma.friend.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      }),
    ]);

    return { removed: true };
  }

  /**
   * 유저 차단
   */
  async blockUser(userId: string, targetUserId: string) {
    // 기존 친구 관계 삭제
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    // 차단 관계 생성
    await this.prisma.friend.create({
      data: {
        userId,
        friendId: targetUserId,
        status: 'BLOCKED',
      },
    });

    return { blocked: true };
  }

  // ============================================================
  // 파크 방문 시스템
  // ============================================================

  /**
   * 친구 파크 방문
   */
  async visitFriendPark(visitorId: string, hostId: string) {
    // 자기 파크 방문 불가
    if (visitorId === hostId) {
      throw new BadRequestException('자신의 파크는 방문할 수 없습니다.');
    }

    // 친구 관계 확인
    const friendship = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: { userId: visitorId, friendId: hostId },
      },
    });

    if (!friendship || friendship.status !== 'ACCEPTED') {
      throw new ForbiddenException('친구만 파크를 방문할 수 있습니다.');
    }

    // 호스트 파크 정보 조회
    const hostPark = await this.prisma.park.findUnique({
      where: { userId: hostId },
      include: {
        user: { select: { nickname: true, level: true } },
        dinosaurs: { where: { isInPark: true } },
        buildings: true,
      },
    });

    if (!hostPark) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    // 방문 기록 생성
    const visit = await this.prisma.parkVisit.create({
      data: {
        visitorId,
        hostId,
        visitType: 'friend',
      },
    });

    // 친구 관계 업데이트 (마지막 방문 시간)
    await this.prisma.friend.update({
      where: {
        userId_friendId: { userId: visitorId, friendId: hostId },
      },
      data: { lastVisitedAt: new Date() },
    });

    // 호스트에게 알림
    const visitor = await this.prisma.user.findUnique({
      where: { id: visitorId },
      select: { nickname: true },
    });

    await this.createNotification(hostId, 'parkVisited', visitorId, visitor?.nickname);

    return {
      visit,
      park: hostPark,
      host: {
        nickname: hostPark.user.nickname,
        level: hostPark.user.level,
      },
    };
  }

  /**
   * 파크 방문 종료 및 보상 지급
   */
  async endParkVisit(userId: string, visitId: string, leftLike: boolean, comment?: string) {
    const visit = await this.prisma.parkVisit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('방문 기록을 찾을 수 없습니다.');
    }

    if (visit.visitorId !== userId) {
      throw new ForbiddenException('이 방문을 종료할 권한이 없습니다.');
    }

    const duration = Math.floor((Date.now() - visit.createdAt.getTime()) / 1000);

    // 방문 기록 업데이트
    const updatedVisit = await this.prisma.parkVisit.update({
      where: { id: visitId },
      data: {
        duration,
        leftLike,
        leftComment: comment,
      },
    });

    // 방명록 작성
    if (comment) {
      const visitor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });

      await this.prisma.guestBook.create({
        data: {
          parkOwnerId: visit.hostId,
          visitorId: userId,
          visitorNickname: visitor?.nickname || 'Unknown',
          message: comment,
        },
      });

      await this.createNotification(
        visit.hostId,
        'guestbookComment',
        userId,
        visitor?.nickname,
        { comment },
      );
    }

    // 보상 계산 및 지급
    const rewards = this.calculateVisitRewards('visitor', duration, leftLike);

    // 친밀도 증가
    await this.addIntimacyExp(userId, visit.hostId, SOCIAL_CONSTANTS.intimacyExpPerVisit);

    // 방문자 보상 지급
    if (rewards.length > 0) {
      await this.grantRewards(userId, rewards);
    }

    // 호스트 보상 지급
    const hostRewards = this.calculateVisitRewards('host', duration, leftLike);
    if (hostRewards.length > 0) {
      await this.grantRewards(visit.hostId, hostRewards);
    }

    return {
      visit: updatedVisit,
      rewards,
      intimacyExpGained: SOCIAL_CONSTANTS.intimacyExpPerVisit,
    };
  }

  /**
   * 방명록 조회
   */
  async getGuestBook(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.guestBook.findMany({
        where: { parkOwnerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.guestBook.count({ where: { parkOwnerId: userId } }),
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // 선물 시스템
  // ============================================================

  /**
   * 선물 보내기
   */
  async sendGift(senderId: string, receiverId: string, giftItemId: string, message?: string) {
    // 자기 자신에게 선물 불가
    if (senderId === receiverId) {
      throw new BadRequestException('자신에게 선물을 보낼 수 없습니다.');
    }

    // 친구 관계 확인
    const friendship = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: { userId: senderId, friendId: receiverId },
      },
    });

    if (!friendship || friendship.status !== 'ACCEPTED') {
      throw new ForbiddenException('친구에게만 선물을 보낼 수 있습니다.');
    }

    // 선물 아이템 확인
    const giftItem = getGiftItemById(giftItemId);
    if (!giftItem || !giftItem.isActive) {
      throw new BadRequestException('유효하지 않은 선물입니다.');
    }

    // 친밀도 요구 확인
    if (giftItem.requiredFriendLevel) {
      const intimacy = await this.prisma.friendIntimacy.findUnique({
        where: {
          userId_friendId: { userId: senderId, friendId: receiverId },
        },
      });

      if (!intimacy || intimacy.intimacyLevel < giftItem.requiredFriendLevel) {
        throw new BadRequestException(
          `친밀도 ${giftItem.requiredFriendLevel} 이상이 필요합니다.`,
        );
      }
    }

    // 일일 선물 제한 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayGiftCount = await this.prisma.gift.count({
      where: {
        senderId,
        giftItemId,
        createdAt: { gte: today },
      },
    });

    if (todayGiftCount >= giftItem.maxDailyGifts) {
      throw new BadRequestException('오늘의 선물 발송 횟수를 초과했습니다.');
    }

    // 쿨다운 확인
    if (giftItem.cooldownHours > 0) {
      const cooldownTime = new Date(Date.now() - giftItem.cooldownHours * 60 * 60 * 1000);
      const recentGift = await this.prisma.gift.findFirst({
        where: {
          senderId,
          receiverId,
          giftItemId,
          createdAt: { gte: cooldownTime },
        },
      });

      if (recentGift) {
        throw new BadRequestException(
          `이 선물은 ${giftItem.cooldownHours}시간 후에 다시 보낼 수 있습니다.`,
        );
      }
    }

    // 선물 생성
    const expiresAt = new Date(Date.now() + SOCIAL_CONSTANTS.giftExpirationDays * 24 * 60 * 60 * 1000);

    const gift = await this.prisma.gift.create({
      data: {
        senderId,
        receiverId,
        giftType: giftItem.type,
        giftItemId,
        expiresAt,
        message,
      },
    });

    // 친구 관계 업데이트 (선물 발송 시간)
    await this.prisma.friend.update({
      where: {
        userId_friendId: { userId: senderId, friendId: receiverId },
      },
      data: { giftSentAt: new Date() },
    });

    // 친밀도 증가
    await this.addIntimacyExp(senderId, receiverId, SOCIAL_CONSTANTS.intimacyExpPerGiftSent);

    // 알림 생성
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { nickname: true },
    });

    await this.createNotification(receiverId, 'giftReceived', senderId, sender?.nickname, {
      giftId: gift.id,
      giftItemId,
    });

    return gift;
  }

  /**
   * 받은 선물 목록
   */
  async getReceivedGifts(userId: string) {
    const gifts = await this.prisma.gift.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    const senderIds = gifts.map((g) => g.senderId);
    const senders = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, nickname: true },
    });

    const senderMap = new Map(senders.map((s) => [s.id, s]));

    return gifts.map((gift) => ({
      ...gift,
      sender: senderMap.get(gift.senderId),
      giftItem: getGiftItemById(gift.giftItemId),
    }));
  }

  /**
   * 선물 수령
   */
  async claimGift(userId: string, giftId: string) {
    const gift = await this.prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      throw new NotFoundException('선물을 찾을 수 없습니다.');
    }

    if (gift.receiverId !== userId) {
      throw new ForbiddenException('이 선물을 수령할 권한이 없습니다.');
    }

    if (gift.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 선물입니다.');
    }

    if (gift.expiresAt < new Date()) {
      await this.prisma.gift.update({
        where: { id: giftId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('만료된 선물입니다.');
    }

    const giftItem = getGiftItemById(gift.giftItemId);
    if (!giftItem) {
      throw new BadRequestException('선물 정보를 찾을 수 없습니다.');
    }

    // 선물 상태 업데이트
    await this.prisma.gift.update({
      where: { id: giftId },
      data: { status: 'CLAIMED' },
    });

    // 친구 관계 업데이트 (선물 수령 시간)
    await this.prisma.friend.update({
      where: {
        userId_friendId: { userId, friendId: gift.senderId },
      },
      data: { giftReceivedAt: new Date() },
    });

    // 친밀도 증가
    await this.addIntimacyExp(userId, gift.senderId, SOCIAL_CONSTANTS.intimacyExpPerGiftReceived);

    // 보상 지급
    await this.grantRewards(userId, giftItem.rewards);

    // 친밀도 통계 업데이트
    await this.prisma.$transaction([
      this.prisma.friendIntimacy.update({
        where: {
          userId_friendId: { userId, friendId: gift.senderId },
        },
        data: { totalGiftsReceived: { increment: 1 } },
      }),
      this.prisma.friendIntimacy.update({
        where: {
          userId_friendId: { userId: gift.senderId, friendId: userId },
        },
        data: { totalGiftsSent: { increment: 1 } },
      }),
    ]);

    return {
      claimed: true,
      rewards: giftItem.rewards,
      intimacyExpGained: SOCIAL_CONSTANTS.intimacyExpPerGiftReceived,
    };
  }

  /**
   * 모든 선물 일괄 수령
   */
  async claimAllGifts(userId: string) {
    const gifts = await this.prisma.gift.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (gifts.length === 0) {
      return { claimed: 0, rewards: [] };
    }

    const allRewards: Array<{ type: string; quantity: number }> = [];
    let totalIntimacyExp = 0;

    for (const gift of gifts) {
      const giftItem = getGiftItemById(gift.giftItemId);
      if (giftItem) {
        allRewards.push(...giftItem.rewards);
        totalIntimacyExp += SOCIAL_CONSTANTS.intimacyExpPerGiftReceived;

        // 친밀도 증가
        await this.addIntimacyExp(userId, gift.senderId, SOCIAL_CONSTANTS.intimacyExpPerGiftReceived);
      }
    }

    // 선물 상태 일괄 업데이트
    await this.prisma.gift.updateMany({
      where: {
        id: { in: gifts.map((g) => g.id) },
      },
      data: { status: 'CLAIMED' },
    });

    // 보상 합산 및 지급
    const mergedRewards = this.mergeRewards(allRewards);
    await this.grantRewards(userId, mergedRewards);

    return {
      claimed: gifts.length,
      rewards: mergedRewards,
      totalIntimacyExpGained: totalIntimacyExp,
    };
  }

  // ============================================================
  // 알림 시스템
  // ============================================================

  /**
   * 알림 목록 조회
   */
  async getNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.socialNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 알림 읽음 처리
   */
  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.socialNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('이 알림에 접근할 권한이 없습니다.');
    }

    await this.prisma.socialNotification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllNotificationsAsRead(userId: string) {
    await this.prisma.socialNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  // ============================================================
  // 헬퍼 메서드
  // ============================================================

  /**
   * 알림 생성
   */
  private async createNotification(
    userId: string,
    type: string,
    fromUserId?: string,
    fromNickname?: string,
    data?: Record<string, any>,
  ) {
    const messages: Record<string, string> = {
      friendRequest: `${fromNickname || '누군가'}님이 친구 요청을 보냈습니다.`,
      friendAccepted: `${fromNickname || '누군가'}님이 친구 요청을 수락했습니다.`,
      giftReceived: `${fromNickname || '누군가'}님이 선물을 보냈습니다.`,
      parkVisited: `${fromNickname || '누군가'}님이 파크를 방문했습니다.`,
      guestbookComment: `${fromNickname || '누군가'}님이 방명록에 글을 남겼습니다.`,
      rankingChange: '랭킹이 변동되었습니다.',
    };

    await this.prisma.socialNotification.create({
      data: {
        userId,
        type,
        fromUserId,
        fromNickname,
        message: messages[type] || '새로운 알림이 있습니다.',
        data,
      },
    });
  }

  /**
   * 친밀도 경험치 추가
   */
  private async addIntimacyExp(userId: string, friendId: string, exp: number) {
    const intimacy = await this.prisma.friendIntimacy.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });

    if (!intimacy) return;

    let newExp = intimacy.intimacyExp + exp;
    let newLevel = intimacy.intimacyLevel;

    // 레벨업 체크
    while (newLevel < SOCIAL_CONSTANTS.maxIntimacyLevel) {
      const expNeeded = getIntimacyExpForLevel(newLevel);
      if (newExp >= expNeeded) {
        newExp -= expNeeded;
        newLevel++;

        // 레벨업 보상 지급
        const levelReward = INTIMACY_REWARDS.find((r: { level: number }) => r.level === newLevel);
        if (levelReward) {
          await this.grantRewards(userId, levelReward.rewards);
        }
      } else {
        break;
      }
    }

    await this.prisma.friendIntimacy.update({
      where: {
        userId_friendId: { userId, friendId },
      },
      data: {
        intimacyLevel: newLevel,
        intimacyExp: newExp,
      },
    });

    // 양방향 업데이트
    await this.prisma.friendIntimacy.update({
      where: {
        userId_friendId: { userId: friendId, friendId: userId },
      },
      data: {
        intimacyLevel: newLevel,
        intimacyExp: newExp,
      },
    });
  }

  /**
   * 방문 보상 계산
   */
  private calculateVisitRewards(
    type: 'visitor' | 'host',
    _duration: number,
    leftLike: boolean,
  ): Array<{ type: string; quantity: number }> {
    const baseReward = VISIT_REWARDS.find((r: { type: string }) => r.type === type);
    if (!baseReward) return [];

    const rewards = [...baseReward.rewards];

    // 좋아요 보너스
    if (leftLike && type === 'host') {
      rewards.push({ type: 'friendPoint', quantity: 5 });
    }

    return rewards;
  }

  /**
   * 보상 지급
   */
  private async grantRewards(userId: string, rewards: Array<{ type: string; quantity: number; id?: string }>) {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'gold':
          await this.prisma.currency.update({
            where: { userId },
            data: { gold: { increment: reward.quantity } },
          });
          break;
        case 'diamond':
          await this.prisma.currency.update({
            where: { userId },
            data: { diamond: { increment: reward.quantity } },
          });
          break;
        case 'dna':
          await this.prisma.currency.update({
            where: { userId },
            data: { dna: { increment: reward.quantity } },
          });
          break;
        // friendPoint는 별도 테이블이 필요할 수 있음 - 현재는 생략
      }
    }
  }

  /**
   * 보상 합산
   */
  private mergeRewards(rewards: Array<{ type: string; quantity: number }>): Array<{ type: string; quantity: number }> {
    const merged = new Map<string, number>();

    for (const reward of rewards) {
      const current = merged.get(reward.type) || 0;
      merged.set(reward.type, current + reward.quantity);
    }

    return Array.from(merged.entries()).map(([type, quantity]) => ({ type, quantity }));
  }
}
