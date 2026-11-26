import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TossLoginDto } from './dto/toss-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 토스 로그인
   * - 신규 유저: 자동 가입 + 로그인
   * - 기존 유저: 로그인
   */
  @Post('toss/login')
  @ApiOperation({ summary: '토스 로그인/회원가입' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        isNewUser: true,
        user: {
          id: 'clx1234...',
          nickname: '신입 사육사',
          level: 1,
          exp: 0,
          tutorialStep: 0,
        },
        currency: {
          gold: 10000,
          diamond: 100,
          dna: 0,
        },
        park: {
          id: 'clx5678...',
          name: '신입 사육사의 파크',
          level: 1,
        },
      },
    },
  })
  async tossLogin(@Body() dto: TossLoginDto) {
    return this.authService.tossLogin(dto);
  }

  /**
   * 토큰 갱신
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  async refreshToken(@CurrentUser() user: User) {
    return this.authService.refreshToken(user.id);
  }

  /**
   * 현재 유저 프로필 조회
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    schema: {
      example: {
        user: {
          id: 'clx1234...',
          nickname: '신입 사육사',
          level: 5,
          exp: 1250,
          tutorialStep: 10,
          lastLoginAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
        currency: {
          gold: 50000,
          diamond: 150,
          dna: 25,
        },
        park: {
          id: 'clx5678...',
          name: '멋진 공룡 파크',
          level: 3,
          exp: 500,
          gridSizeX: 24,
          gridSizeY: 24,
          dinosaurCount: 12,
          buildingCount: 8,
        },
        stats: {
          greatFigureCount: 3,
        },
      },
    },
  })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }
}
