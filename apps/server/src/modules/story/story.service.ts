import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { STORY_CHAPTERS, getChapterById, getSceneById } from '@dino-park/game-data';
import type { StoryChapter, StoryChoice, StoryReward } from '@dino-park/shared';

// 호감도 레벨별 필요 경험치
const AFFINITY_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250];
const MAX_AFFINITY_LEVEL = 10;

// 캐릭터 정보
const CHARACTERS = [
  'jin',
  'marco',
  'olivia',
  'robert',
  'thomas',
  'natalie',
  'daniel',
  'victor',
  'naomi',
];

@Injectable()
export class StoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // 스토리 진행 조회
  // ================================================================

  /**
   * 유저의 모든 스토리 진행 상황 조회
   */
  async getProgress(userId: string) {
    const progress = await this.prisma.storyProgress.findMany({
      where: { userId },
      orderBy: { chapterId: 'asc' },
    });

    // 챕터별 상세 정보 추가
    return progress.map((p) => {
      const chapter = getChapterById(p.chapterId);
      return {
        ...p,
        chapter: chapter
          ? {
              id: chapter.id,
              title: chapter.title,
              titleKo: chapter.titleKo,
              order: chapter.order,
              totalScenes: chapter.scenes.length,
            }
          : null,
      };
    });
  }

  /**
   * 특정 챕터 진행 상황 조회
   */
  async getChapterProgress(userId: string, chapterId: string) {
    const chapter = getChapterById(chapterId);
    if (!chapter) {
      throw new NotFoundException(`챕터를 찾을 수 없습니다: ${chapterId}`);
    }

    const progress = await this.prisma.storyProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    return {
      chapter: {
        id: chapter.id,
        title: chapter.title,
        titleKo: chapter.titleKo,
        order: chapter.order,
        scenes: chapter.scenes,
        rewards: chapter.rewards,
        unlockCondition: chapter.unlockCondition,
      },
      progress: progress || null,
      isUnlocked: await this.isChapterUnlocked(userId, chapter),
    };
  }

  /**
   * 해금 가능한 챕터 목록 조회
   */
  async getAvailableChapters(userId: string) {
    const chapters: Array<{
      chapter: Partial<StoryChapter>;
      isUnlocked: boolean;
      isStarted: boolean;
      isCompleted: boolean;
    }> = [];

    for (const chapter of STORY_CHAPTERS) {
      const progress = await this.prisma.storyProgress.findUnique({
        where: { userId_chapterId: { userId, chapterId: chapter.id } },
      });

      chapters.push({
        chapter: {
          id: chapter.id,
          title: chapter.title,
          titleKo: chapter.titleKo,
          order: chapter.order,
          unlockCondition: chapter.unlockCondition,
        },
        isUnlocked: await this.isChapterUnlocked(userId, chapter),
        isStarted: !!progress,
        isCompleted: progress?.completed ?? false,
      });
    }

    return chapters;
  }

  // ================================================================
  // 챕터 시작/진행
  // ================================================================

  /**
   * 챕터 시작
   */
  async startChapter(userId: string, chapterId: string) {
    const chapter = getChapterById(chapterId);
    if (!chapter) {
      throw new NotFoundException(`챕터를 찾을 수 없습니다: ${chapterId}`);
    }

    // 해금 조건 확인
    const isUnlocked = await this.isChapterUnlocked(userId, chapter);
    if (!isUnlocked) {
      throw new BadRequestException('이 챕터는 아직 해금되지 않았습니다.');
    }

    // 이미 시작한 경우 기존 진행 반환
    const existing = await this.prisma.storyProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    if (existing) {
      return {
        progress: existing,
        currentScene: getSceneById(chapterId, existing.sceneId || chapter.scenes[0].id),
      };
    }

    // 새 진행 생성
    const firstScene = chapter.scenes[0];
    const progress = await this.prisma.storyProgress.create({
      data: {
        userId,
        chapterId,
        sceneId: firstScene.id,
        choices: [],
        effects: {},
      },
    });

    return {
      progress,
      currentScene: firstScene,
    };
  }

  /**
   * 다음 씬으로 진행
   */
  async advanceScene(userId: string, chapterId: string, nextSceneId?: string) {
    const chapter = getChapterById(chapterId);
    if (!chapter) {
      throw new NotFoundException(`챕터를 찾을 수 없습니다: ${chapterId}`);
    }

    const progress = await this.prisma.storyProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    if (!progress) {
      throw new BadRequestException('챕터를 먼저 시작해야 합니다.');
    }

    if (progress.completed) {
      throw new BadRequestException('이미 완료된 챕터입니다.');
    }

    // 현재 씬 인덱스 찾기
    const currentSceneIndex = chapter.scenes.findIndex((s) => s.id === progress.sceneId);

    // 다음 씬 결정
    let nextScene;
    if (nextSceneId) {
      nextScene = chapter.scenes.find((s) => s.id === nextSceneId);
    } else {
      nextScene = chapter.scenes[currentSceneIndex + 1];
    }

    // 다음 씬이 없으면 챕터 완료
    if (!nextScene) {
      const updatedProgress = await this.prisma.storyProgress.update({
        where: { userId_chapterId: { userId, chapterId } },
        data: {
          sceneId: null,
          completed: true,
        },
      });

      return {
        progress: updatedProgress,
        currentScene: null,
        isChapterComplete: true,
        rewards: chapter.rewards,
      };
    }

    // 진행 업데이트
    const updatedProgress = await this.prisma.storyProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { sceneId: nextScene.id },
    });

    return {
      progress: updatedProgress,
      currentScene: nextScene,
      isChapterComplete: false,
    };
  }

  // ================================================================
  // 선택지 처리
  // ================================================================

  /**
   * 스토리 선택지 선택
   */
  async makeChoice(userId: string, chapterId: string, choiceId: string) {
    const chapter = getChapterById(chapterId);
    if (!chapter) {
      throw new NotFoundException(`챕터를 찾을 수 없습니다: ${chapterId}`);
    }

    const progress = await this.prisma.storyProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    if (!progress) {
      throw new BadRequestException('챕터를 먼저 시작해야 합니다.');
    }

    if (progress.completed) {
      throw new BadRequestException('이미 완료된 챕터입니다.');
    }

    // 현재 씬에서 선택지 찾기
    const currentScene = chapter.scenes.find((s) => s.id === progress.sceneId);
    if (!currentScene) {
      throw new BadRequestException('현재 씬을 찾을 수 없습니다.');
    }

    const choice = currentScene.choices?.find((c) => c.id === choiceId);
    if (!choice) {
      throw new BadRequestException('유효하지 않은 선택지입니다.');
    }

    // 선택지 효과 처리
    await this.processChoiceEffects(userId, choice);

    // 선택 기록 및 효과 저장
    const existingChoices = (progress.choices as string[]) || [];
    const existingEffects = (progress.effects as Record<string, number | string | boolean>) || {};

    const mergedEffects = { ...existingEffects, ...choice.effect };

    await this.prisma.storyProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: {
        choices: [...existingChoices, choiceId],
        effects: mergedEffects,
      },
    });

    // 다음 씬으로 자동 진행
    if (choice.nextSceneId) {
      return this.advanceScene(userId, chapterId, choice.nextSceneId);
    }

    // nextSceneId가 null이면 자동으로 다음 씬으로
    return this.advanceScene(userId, chapterId);
  }

  /**
   * 선택지 효과 처리
   */
  private async processChoiceEffects(userId: string, choice: StoryChoice) {
    const effect = choice.effect;

    for (const [key, value] of Object.entries(effect)) {
      // 호감도 처리 (예: jinAffinity, oliviaAffinity)
      if (key.endsWith('Affinity')) {
        const characterId = key.replace('Affinity', '').toLowerCase();
        if (CHARACTERS.includes(characterId) && typeof value === 'number') {
          await this.updateCharacterAffinity(userId, characterId, value);
        }
      }

      // 스토리 플래그 처리
      if (key === 'storyFlag' && typeof value === 'string') {
        await this.setStoryFlag(userId, value, true);
      }

      // 엔딩 플래그
      if (key === 'ending' && typeof value === 'string') {
        await this.setStoryFlag(userId, `ending_${value}`, true);
      }
    }
  }

  // ================================================================
  // 보상 처리
  // ================================================================

  /**
   * 챕터 보상 수령
   */
  async claimChapterRewards(userId: string, chapterId: string) {
    const chapter = getChapterById(chapterId);
    if (!chapter) {
      throw new NotFoundException(`챕터를 찾을 수 없습니다: ${chapterId}`);
    }

    const progress = await this.prisma.storyProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    if (!progress || !progress.completed) {
      throw new BadRequestException('챕터를 완료해야 보상을 받을 수 있습니다.');
    }

    // 이미 보상을 받았는지 확인
    const rewardFlag = `reward_claimed_${chapterId}`;
    const alreadyClaimed = await this.hasStoryFlag(userId, rewardFlag);
    if (alreadyClaimed) {
      throw new ConflictException('이미 보상을 수령했습니다.');
    }

    // 보상 지급
    const grantedRewards = await this.grantRewards(userId, chapter.rewards);

    // 보상 수령 플래그 설정
    await this.setStoryFlag(userId, rewardFlag, true);

    return {
      rewards: grantedRewards,
      message: `${chapter.titleKo} 챕터 보상을 수령했습니다!`,
    };
  }

  /**
   * 보상 지급 처리
   */
  private async grantRewards(userId: string, rewards: StoryReward[]) {
    const grantedRewards: Array<{ type: string; id?: string; amount?: number }> = [];

    for (const reward of rewards) {
      switch (reward.type) {
        case 'gold':
          if (reward.amount) {
            await this.prisma.currency.update({
              where: { userId },
              data: { gold: { increment: reward.amount } },
            });
            grantedRewards.push({ type: 'gold', amount: reward.amount });
          }
          break;

        case 'diamond':
          if (reward.amount) {
            await this.prisma.currency.update({
              where: { userId },
              data: { diamond: { increment: reward.amount } },
            });
            grantedRewards.push({ type: 'diamond', amount: reward.amount });
          }
          break;

        case 'character':
          if (reward.id) {
            // 캐릭터 해금 = 호감도 시스템에 추가
            await this.unlockCharacter(userId, reward.id);
            grantedRewards.push({ type: 'character', id: reward.id });
          }
          break;

        case 'dinosaur':
          if (reward.id) {
            // 공룡 해금 플래그 설정 (실제 공룡 생성은 별도 처리)
            await this.setStoryFlag(userId, `dinosaur_unlocked_${reward.id}`, true);
            grantedRewards.push({ type: 'dinosaur', id: reward.id });
          }
          break;

        case 'building':
          if (reward.id) {
            await this.setStoryFlag(userId, `building_unlocked_${reward.id}`, true);
            grantedRewards.push({ type: 'building', id: reward.id });
          }
          break;

        case 'title':
          if (reward.id) {
            await this.setStoryFlag(userId, `title_unlocked_${reward.id}`, true);
            grantedRewards.push({ type: 'title', id: reward.id });
          }
          break;
      }
    }

    return grantedRewards;
  }

  // ================================================================
  // 호감도 시스템
  // ================================================================

  /**
   * 모든 캐릭터 호감도 조회
   */
  async getAllCharacterAffinities(userId: string) {
    const affinities = await this.prisma.characterAffinity.findMany({
      where: { userId },
      orderBy: { affinity: 'desc' },
    });

    return affinities.map((a) => ({
      ...a,
      nextLevelExp: this.getAffinityExpForLevel(a.level + 1),
      currentLevelExp: this.getAffinityExpForLevel(a.level),
    }));
  }

  /**
   * 특정 캐릭터 호감도 조회
   */
  async getCharacterAffinity(userId: string, characterId: string) {
    const affinity = await this.prisma.characterAffinity.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    if (!affinity) {
      return null;
    }

    return {
      ...affinity,
      nextLevelExp: this.getAffinityExpForLevel(affinity.level + 1),
      currentLevelExp: this.getAffinityExpForLevel(affinity.level),
    };
  }

  /**
   * 캐릭터 호감도 업데이트
   */
  async updateCharacterAffinity(userId: string, characterId: string, amount: number) {
    // 캐릭터가 해금되어 있는지 확인
    let affinity = await this.prisma.characterAffinity.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    if (!affinity) {
      // 처음 만나는 캐릭터인 경우 자동 해금
      affinity = await this.prisma.characterAffinity.create({
        data: {
          userId,
          characterId,
          affinity: Math.max(0, amount),
          level: 1,
        },
      });
    } else {
      // 호감도 업데이트
      let newAffinity = affinity.affinity + amount;
      newAffinity = Math.max(0, newAffinity); // 음수 방지

      // 레벨 계산
      let newLevel = affinity.level;
      while (
        newLevel < MAX_AFFINITY_LEVEL &&
        newAffinity >= this.getAffinityExpForLevel(newLevel + 1)
      ) {
        newLevel++;
      }

      affinity = await this.prisma.characterAffinity.update({
        where: { userId_characterId: { userId, characterId } },
        data: {
          affinity: newAffinity,
          level: newLevel,
        },
      });
    }

    return affinity;
  }

  /**
   * 캐릭터 해금
   */
  async unlockCharacter(userId: string, characterId: string) {
    const existing = await this.prisma.characterAffinity.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.characterAffinity.create({
      data: {
        userId,
        characterId,
        affinity: 0,
        level: 1,
      },
    });
  }

  /**
   * 호감도 레벨에 필요한 경험치
   */
  private getAffinityExpForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > MAX_AFFINITY_LEVEL) return Infinity;
    return AFFINITY_THRESHOLDS[level - 1] || Infinity;
  }

  // ================================================================
  // 스토리 플래그
  // ================================================================

  /**
   * 스토리 플래그 설정
   */
  async setStoryFlag(userId: string, flagId: string, value: unknown = true) {
    await this.prisma.storyFlag.upsert({
      where: { userId_flagId: { userId, flagId } },
      create: { userId, flagId, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) },
    });
  }

  /**
   * 스토리 플래그 확인
   */
  async hasStoryFlag(userId: string, flagId: string): Promise<boolean> {
    const flag = await this.prisma.storyFlag.findUnique({
      where: { userId_flagId: { userId, flagId } },
    });
    return !!flag;
  }

  /**
   * 스토리 플래그 값 조회
   */
  async getStoryFlag(userId: string, flagId: string): Promise<unknown> {
    const flag = await this.prisma.storyFlag.findUnique({
      where: { userId_flagId: { userId, flagId } },
    });
    return flag ? JSON.parse(flag.value as string) : null;
  }

  /**
   * 모든 스토리 플래그 조회
   */
  async getAllStoryFlags(userId: string) {
    const flags = await this.prisma.storyFlag.findMany({
      where: { userId },
    });
    return flags.reduce(
      (acc, flag) => {
        acc[flag.flagId] = JSON.parse(flag.value as string);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  // ================================================================
  // 챕터 해금 조건
  // ================================================================

  /**
   * 챕터 해금 여부 확인
   */
  private async isChapterUnlocked(userId: string, chapter: StoryChapter): Promise<boolean> {
    const { type, value } = chapter.unlockCondition;

    switch (type) {
      case 'none':
        return true;

      case 'chapter':
        if (typeof value === 'string') {
          const prevProgress = await this.prisma.storyProgress.findUnique({
            where: { userId_chapterId: { userId, chapterId: value } },
          });
          return prevProgress?.completed ?? false;
        }
        return false;

      case 'parkLevel':
        if (typeof value === 'number') {
          const park = await this.prisma.park.findUnique({
            where: { userId },
          });
          return (park?.level ?? 0) >= value;
        }
        return false;

      case 'building':
        if (typeof value === 'string') {
          const building = await this.prisma.building.findFirst({
            where: {
              park: { userId },
              typeId: value,
            },
          });
          return !!building;
        }
        return false;

      case 'dinosaur':
        if (typeof value === 'string') {
          const dinosaur = await this.prisma.dinosaur.findFirst({
            where: {
              park: { userId },
              speciesId: value,
            },
          });
          return !!dinosaur;
        }
        return false;

      default:
        return false;
    }
  }

  // ================================================================
  // 챕터 완료 처리 (레거시 호환)
  // ================================================================

  /**
   * 챕터 완료 처리 (레거시)
   */
  async completeChapter(userId: string, chapterId: string) {
    return this.prisma.storyProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { completed: true },
    });
  }

  // ================================================================
  // 통계
  // ================================================================

  /**
   * 스토리 진행 통계
   */
  async getStoryStats(userId: string) {
    const progress = await this.prisma.storyProgress.findMany({
      where: { userId },
    });

    const completedChapters = progress.filter((p) => p.completed).length;
    const totalChoices = progress.reduce(
      (sum, p) => sum + ((p.choices as string[])?.length || 0),
      0,
    );

    const affinities = await this.prisma.characterAffinity.findMany({
      where: { userId },
    });

    const flags = await this.prisma.storyFlag.count({
      where: { userId },
    });

    return {
      totalChapters: STORY_CHAPTERS.length,
      completedChapters,
      progressPercentage: Math.round((completedChapters / STORY_CHAPTERS.length) * 100),
      totalChoicesMade: totalChoices,
      unlockedCharacters: affinities.length,
      totalFlags: flags,
    };
  }
}
