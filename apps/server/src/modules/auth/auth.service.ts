import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TossLoginDto } from './dto/toss-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 토스 로그인/회원가입
   */
  async tossLogin(dto: TossLoginDto) {
    // 기존 유저 찾기 또는 새로 생성
    let user = await this.prisma.user.findUnique({
      where: { tossId: dto.tossId },
    });

    if (!user) {
      // 신규 유저 생성
      user = await this.prisma.user.create({
        data: {
          tossId: dto.tossId,
          nickname: dto.nickname || '신입 사육사',
          // Currency와 Park도 함께 생성
          currency: {
            create: {},
          },
          park: {
            create: {},
          },
        },
      });
    } else {
      // 마지막 로그인 시간 업데이트
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // JWT 토큰 생성
    const payload = { sub: user.id, tossId: user.tossId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        level: user.level,
      },
    };
  }

  /**
   * JWT 검증
   */
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
