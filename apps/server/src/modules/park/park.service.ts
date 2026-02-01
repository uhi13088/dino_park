import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저 ID로 파크 조회
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
      include: {
        dinosaurs: true,
        buildings: true,
      },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    return park;
  }

  /**
   * 파크 레벨업 (Phase 2에서 상세 구현)
   */
  async addExp(parkId: string, exp: number) {
    // TODO: 레벨업 로직, 그리드 확장 구현
    return this.prisma.park.update({
      where: { id: parkId },
      data: { exp: { increment: exp } },
    });
  }
}
