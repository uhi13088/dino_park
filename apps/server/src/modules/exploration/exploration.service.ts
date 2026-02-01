import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ENERGY_PER_EXPLORATION } from '@dino-park/shared';

@Injectable()
export class ExplorationService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string) {
    return this.prisma.exploration.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async start(userId: string, regionId: string) {
    // 에너지 확인
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.explorationEnergy < ENERGY_PER_EXPLORATION) {
      throw new BadRequestException('탐험 에너지가 부족합니다.');
    }

    // 에너지 차감 및 탐험 생성
    await this.prisma.currency.update({
      where: { userId },
      data: { explorationEnergy: { decrement: ENERGY_PER_EXPLORATION } },
    });

    return this.prisma.exploration.create({
      data: {
        userId,
        regionId,
        status: 'IN_PROGRESS',
      },
    });
  }

  async claim(explorationId: string, userId: string) {
    const exploration = await this.prisma.exploration.findUnique({
      where: { id: explorationId },
    });

    if (!exploration || exploration.userId !== userId) {
      throw new NotFoundException('탐험을 찾을 수 없습니다.');
    }

    if (exploration.status !== 'COMPLETED') {
      throw new BadRequestException('아직 탐험이 완료되지 않았습니다.');
    }

    // TODO: Phase 2에서 보상 지급 구현

    return this.prisma.exploration.update({
      where: { id: explorationId },
      data: { status: 'CLAIMED' },
    });
  }
}
