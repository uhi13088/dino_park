import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { IsString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

class UpdateNicknameDto {
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  nickname: string;
}

class UpdateTutorialDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  step: number;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 내 프로필 조회
   */
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '유저 정보',
    schema: {
      example: {
        id: 'clx1234...',
        nickname: '공룡 마스터',
        level: 5,
        exp: 350,
        expForNextLevel: 559,
        tutorialStep: 10,
        lastLoginAt: '2024-01-15T10:00:00Z',
        currency: { gold: 50000, diamond: 120, dna: 15, explorationEnergy: 25 },
        park: { id: 'clx5678...', name: '멋진 파크', level: 3, dinosaurCount: 8, buildingCount: 5 },
        greatFigureCount: 2,
      },
    },
  })
  async getMe(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  /**
   * 닉네임 변경
   */
  @Patch('me/nickname')
  @ApiOperation({ summary: '닉네임 변경' })
  @ApiResponse({ status: 200, description: '변경 완료' })
  async updateNickname(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNicknameDto,
  ) {
    return this.userService.updateNickname(userId, dto.nickname);
  }

  /**
   * 튜토리얼 진행 상태 업데이트
   */
  @Patch('me/tutorial')
  @ApiOperation({ summary: '튜토리얼 단계 업데이트' })
  @ApiResponse({ status: 200, description: '업데이트 완료' })
  async updateTutorial(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTutorialDto,
  ) {
    return this.userService.updateTutorialStep(userId, dto.step);
  }

  /**
   * 유저 통계 조회
   */
  @Get('me/stats')
  @ApiOperation({ summary: '내 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '유저 통계',
    schema: {
      example: {
        dinosaurCount: 12,
        buildingCount: 8,
        greatFigureCount: 3,
        explorationCount: 45,
        completedChapters: 2,
      },
    },
  })
  async getStats(@CurrentUser('id') userId: string) {
    return this.userService.getStats(userId);
  }
}
