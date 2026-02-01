import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저 프로필 조회
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        currency: true,
        park: true,
      },
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 유저 레벨업 (Phase 2에서 상세 구현)
   */
  async addExp(userId: string, exp: number) {
    // TODO: 레벨업 로직 구현
    return this.prisma.user.update({
      where: { id: userId },
      data: { exp: { increment: exp } },
    });
  }
}
