import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BuildingService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    return this.prisma.building.findMany({
      where: { parkId: park.id },
    });
  }

  async getById(id: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
    });

    if (!building) {
      throw new NotFoundException('건물을 찾을 수 없습니다.');
    }

    return building;
  }

  // TODO: Phase 2에서 건설, 업그레이드, 수익 수집 등 구현
}
