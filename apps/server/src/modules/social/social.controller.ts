import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SocialService } from './social.service';
import { IsString, IsOptional, IsBoolean, MaxLength, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// DTOs
// ============================================================

class SendFriendRequestDto {
  @IsString()
  targetUserId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  message?: string;
}

class SendGiftDto {
  @IsString()
  receiverId!: string;

  @IsString()
  giftItemId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  message?: string;
}

class EndParkVisitDto {
  @IsBoolean()
  leftLike!: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  comment?: string;
}

class PaginationQuery {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

// ============================================================
// Controller
// ============================================================

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ========================================
  // 친구 시스템
  // ========================================

  /**
   * 친구 목록 조회
   */
  @Get('friends')
  @ApiOperation({ summary: '친구 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '친구 목록 (프로필 + 친밀도 정보 포함)',
    schema: {
      example: [
        {
          id: 'clx1234...',
          friendId: 'clx5678...',
          nickname: '베스트프렌드',
          status: 'ACCEPTED',
          lastVisitedAt: '2026-02-01T10:00:00Z',
          friendProfile: {
            userId: 'clx5678...',
            nickname: '다이노마스터',
            level: 25,
            parkName: '공룡천국',
            parkLevel: 15,
            lastOnlineAt: '2026-02-03T12:00:00Z',
          },
          intimacy: {
            level: 5,
            exp: 120,
            expForNextLevel: 500,
          },
        },
      ],
    },
  })
  async getFriends(@CurrentUser('id') userId: string) {
    return this.socialService.getFriends(userId);
  }

  /**
   * 친구 요청 보내기
   */
  @Post('friends/request')
  @ApiOperation({ summary: '친구 요청 보내기' })
  @ApiResponse({ status: 201, description: '친구 요청 성공' })
  @ApiResponse({ status: 409, description: '이미 친구이거나 요청을 보낸 상태' })
  async sendFriendRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.socialService.sendFriendRequest(userId, dto.targetUserId, dto.message);
  }

  /**
   * 받은 친구 요청 목록
   */
  @Get('friends/requests')
  @ApiOperation({ summary: '받은 친구 요청 목록' })
  @ApiResponse({
    status: 200,
    description: '대기 중인 친구 요청 목록',
  })
  async getReceivedFriendRequests(@CurrentUser('id') userId: string) {
    return this.socialService.getReceivedFriendRequests(userId);
  }

  /**
   * 친구 요청 수락
   */
  @Post('friends/requests/:requestId/accept')
  @ApiOperation({ summary: '친구 요청 수락' })
  @ApiParam({ name: 'requestId', description: '친구 요청 ID' })
  @ApiResponse({ status: 200, description: '친구 요청 수락 완료' })
  async acceptFriendRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.acceptFriendRequest(userId, requestId);
  }

  /**
   * 친구 요청 거절
   */
  @Post('friends/requests/:requestId/reject')
  @ApiOperation({ summary: '친구 요청 거절' })
  @ApiParam({ name: 'requestId', description: '친구 요청 ID' })
  @ApiResponse({ status: 200, description: '친구 요청 거절 완료' })
  async rejectFriendRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.rejectFriendRequest(userId, requestId);
  }

  /**
   * 친구 삭제
   */
  @Delete('friends/:friendId')
  @ApiOperation({ summary: '친구 삭제' })
  @ApiParam({ name: 'friendId', description: '삭제할 친구의 유저 ID' })
  @ApiResponse({ status: 200, description: '친구 삭제 완료' })
  async removeFriend(
    @CurrentUser('id') userId: string,
    @Param('friendId') friendId: string,
  ) {
    return this.socialService.removeFriend(userId, friendId);
  }

  /**
   * 유저 차단
   */
  @Post('friends/:userId/block')
  @ApiOperation({ summary: '유저 차단' })
  @ApiParam({ name: 'userId', description: '차단할 유저 ID' })
  @ApiResponse({ status: 200, description: '차단 완료' })
  async blockUser(
    @CurrentUser('id') userId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.socialService.blockUser(userId, targetUserId);
  }

  // ========================================
  // 파크 방문 시스템
  // ========================================

  /**
   * 친구 파크 방문
   */
  @Post('visit/:hostId')
  @ApiOperation({ summary: '친구 파크 방문' })
  @ApiParam({ name: 'hostId', description: '방문할 파크 주인 ID' })
  @ApiResponse({
    status: 200,
    description: '파크 정보 및 방문 기록',
    schema: {
      example: {
        visit: { id: 'clx1234...', visitorId: '...', hostId: '...' },
        park: { name: '공룡천국', level: 15, dinosaurs: [], buildings: [] },
        host: { nickname: '다이노마스터', level: 25 },
      },
    },
  })
  async visitFriendPark(
    @CurrentUser('id') userId: string,
    @Param('hostId') hostId: string,
  ) {
    return this.socialService.visitFriendPark(userId, hostId);
  }

  /**
   * 파크 방문 종료
   */
  @Post('visit/:visitId/end')
  @ApiOperation({ summary: '파크 방문 종료 및 보상 수령' })
  @ApiParam({ name: 'visitId', description: '방문 기록 ID' })
  @ApiResponse({
    status: 200,
    description: '방문 종료 및 보상 정보',
    schema: {
      example: {
        visit: { id: '...', duration: 300, leftLike: true },
        rewards: [{ type: 'gold', quantity: 100 }],
        intimacyExpGained: 20,
      },
    },
  })
  async endParkVisit(
    @CurrentUser('id') userId: string,
    @Param('visitId') visitId: string,
    @Body() dto: EndParkVisitDto,
  ) {
    return this.socialService.endParkVisit(userId, visitId, dto.leftLike, dto.comment);
  }

  /**
   * 방명록 조회
   */
  @Get('guestbook')
  @ApiOperation({ summary: '내 파크 방명록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: '방명록 목록 (페이지네이션)',
  })
  async getGuestBook(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQuery,
  ) {
    return this.socialService.getGuestBook(userId, query.page, query.limit);
  }

  // ========================================
  // 선물 시스템
  // ========================================

  /**
   * 선물 보내기
   */
  @Post('gifts')
  @ApiOperation({ summary: '친구에게 선물 보내기' })
  @ApiResponse({ status: 201, description: '선물 발송 성공' })
  @ApiResponse({ status: 400, description: '일일 제한 초과 또는 쿨다운' })
  async sendGift(
    @CurrentUser('id') userId: string,
    @Body() dto: SendGiftDto,
  ) {
    return this.socialService.sendGift(userId, dto.receiverId, dto.giftItemId, dto.message);
  }

  /**
   * 받은 선물 목록
   */
  @Get('gifts')
  @ApiOperation({ summary: '받은 선물 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '수령 대기 중인 선물 목록',
    schema: {
      example: [
        {
          id: 'clx1234...',
          giftItemId: 'daily_gift_box',
          sender: { id: '...', nickname: '다이노마스터' },
          giftItem: { name: '일일 선물 상자', rewards: [] },
          expiresAt: '2026-02-10T00:00:00Z',
        },
      ],
    },
  })
  async getReceivedGifts(@CurrentUser('id') userId: string) {
    return this.socialService.getReceivedGifts(userId);
  }

  /**
   * 선물 수령
   */
  @Post('gifts/:giftId/claim')
  @ApiOperation({ summary: '선물 수령' })
  @ApiParam({ name: 'giftId', description: '선물 ID' })
  @ApiResponse({
    status: 200,
    description: '선물 수령 완료',
    schema: {
      example: {
        claimed: true,
        rewards: [{ type: 'gold', quantity: 500 }],
        intimacyExpGained: 10,
      },
    },
  })
  async claimGift(
    @CurrentUser('id') userId: string,
    @Param('giftId') giftId: string,
  ) {
    return this.socialService.claimGift(userId, giftId);
  }

  /**
   * 모든 선물 일괄 수령
   */
  @Post('gifts/claim-all')
  @ApiOperation({ summary: '모든 선물 일괄 수령' })
  @ApiResponse({
    status: 200,
    description: '일괄 수령 완료',
    schema: {
      example: {
        claimed: 5,
        rewards: [
          { type: 'gold', quantity: 2500 },
          { type: 'diamond', quantity: 10 },
        ],
        totalIntimacyExpGained: 50,
      },
    },
  })
  async claimAllGifts(@CurrentUser('id') userId: string) {
    return this.socialService.claimAllGifts(userId);
  }

  // ========================================
  // 알림 시스템
  // ========================================

  /**
   * 알림 목록 조회
   */
  @Get('notifications')
  @ApiOperation({ summary: '소셜 알림 목록 조회' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: '알림 목록 (최신 50개)',
  })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.socialService.getNotifications(userId, unreadOnly === 'true');
  }

  /**
   * 알림 읽음 처리
   */
  @Post('notifications/:notificationId/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiParam({ name: 'notificationId', description: '알림 ID' })
  async markNotificationAsRead(
    @CurrentUser('id') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.socialService.markNotificationAsRead(userId, notificationId);
  }

  /**
   * 모든 알림 읽음 처리
   */
  @Post('notifications/read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  async markAllNotificationsAsRead(@CurrentUser('id') userId: string) {
    return this.socialService.markAllNotificationsAsRead(userId);
  }
}
