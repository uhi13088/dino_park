import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// TODO: Phase 5에서 시즌 데이터를 game-data 패키지로 이동
const CURRENT_SEASON = {
  id: 'season1',
  name: '쥬라기의 부활',
  startDate: '2026-03-01',
  endDate: '2026-05-31',
  maxLevel: 50,
};

@Injectable()
export class SeasonService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentSeason() {
    return CURRENT_SEASON;
  }

  async getSeasonPass(userId: string) {
    let seasonPass = await this.prisma.seasonPass.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId: CURRENT_SEASON.id,
        },
      },
    });

    // 시즌 패스가 없으면 생성
    if (!seasonPass) {
      seasonPass = await this.prisma.seasonPass.create({
        data: {
          userId,
          seasonId: CURRENT_SEASON.id,
        },
      });
    }

    return seasonPass;
  }

  async addSeasonExp(userId: string, exp: number) {
    const seasonPass = await this.getSeasonPass(userId);

    // TODO: 레벨업 로직 구현

    return this.prisma.seasonPass.update({
      where: { id: seasonPass.id },
      data: { exp: { increment: exp } },
    });
  }

  async claimReward(userId: string, level: number) {
    const seasonPass = await this.getSeasonPass(userId);

    if (seasonPass.level < level) {
      throw new BadRequestException('해당 레벨에 도달하지 못했습니다.');
    }

    const claimedRewards = seasonPass.claimedRewards as number[];
    if (claimedRewards.includes(level)) {
      throw new BadRequestException('이미 수령한 보상입니다.');
    }

    // TODO: Phase 5에서 보상 지급 로직 구현

    return this.prisma.seasonPass.update({
      where: { id: seasonPass.id },
      data: {
        claimedRewards: [...claimedRewards, level],
      },
    });
  }
}
