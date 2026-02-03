import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GreatFigureService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string) {
    return this.prisma.userGreatFigure.findMany({
      where: { userId },
    });
  }

  async recruit(userId: string, figureId: string) {
    // 이미 보유한 위인인지 확인
    const existing = await this.prisma.userGreatFigure.findUnique({
      where: {
        userId_figureId: { userId, figureId },
      },
    });

    if (existing) {
      throw new ConflictException('이미 영입한 위인입니다.');
    }

    // TODO: Phase 2에서 영입 조건 확인 (조각 개수 등)

    return this.prisma.userGreatFigure.create({
      data: {
        userId,
        figureId,
      },
    });
  }
}
