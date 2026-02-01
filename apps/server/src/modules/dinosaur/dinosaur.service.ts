import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FEEDING_HAPPINESS_GAIN,
  FEEDING_HUNGER_REDUCE,
} from '@dino-park/shared';

@Injectable()
export class DinosaurService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저 ID로 공룡 목록 조회
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    return this.prisma.dinosaur.findMany({
      where: { parkId: park.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ID로 공룡 조회
   */
  async getById(id: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    return dinosaur;
  }

  /**
   * 공룡에게 먹이주기
   */
  async feed(dinosaurId: string, userId: string) {
    const dinosaur = await this.getById(dinosaurId);

    // TODO: 골드 차감 확인 (Phase 2)

    const newHappiness = Math.min(100, dinosaur.happiness + FEEDING_HAPPINESS_GAIN);
    const newHunger = Math.max(0, dinosaur.hunger - FEEDING_HUNGER_REDUCE);

    return this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: {
        happiness: newHappiness,
        hunger: newHunger,
        lastFedAt: new Date(),
      },
    });
  }
}
