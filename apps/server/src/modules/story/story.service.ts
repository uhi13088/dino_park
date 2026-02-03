import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string) {
    return this.prisma.storyProgress.findMany({
      where: { userId },
      orderBy: { chapterId: 'asc' },
    });
  }

  async makeChoice(userId: string, chapterId: string, choiceId: string) {
    const progress = await this.prisma.storyProgress.upsert({
      where: {
        userId_chapterId: { userId, chapterId },
      },
      create: {
        userId,
        chapterId,
        choices: [choiceId],
      },
      update: {
        choices: {
          push: choiceId,
        },
      },
    });

    // TODO: Phase 2에서 선택지에 따른 보상/결과 처리

    return progress;
  }

  async completeChapter(userId: string, chapterId: string) {
    return this.prisma.storyProgress.update({
      where: {
        userId_chapterId: { userId, chapterId },
      },
      data: { completed: true },
    });
  }
}
