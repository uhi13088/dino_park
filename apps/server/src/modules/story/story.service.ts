import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { Prisma, StoryProgress } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { STORY_CHAPTERS, getChapterById, getSceneById } from '@dino-park/game-data';
import { EARLY_SYNTHESIS_SAFETY_FLAG } from '@dino-park/shared';
import type { StoryChapter, StoryChoice, StoryReward } from '@dino-park/shared';
import { storySceneRequirement } from './story-scene-gates';

type StoryDatabase = Prisma.TransactionClient;
type SceneAction = { sceneId?: string; nextSceneId?: string; choiceId?: string };

const isFollowup = (chapter: StoryChapter) => chapter.order >= 4;

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
        rewards: isFollowup(chapter) ? [] : chapter.rewards,
        unlockCondition: chapter.unlockCondition,
      },
      progress: progress || null,
      isUnlocked: await this.isChapterUnlocked(userId, chapter),
      requirement: progress?.sceneId
        ? await storySceneRequirement(this.prisma, userId, progress.sceneId)
        : undefined,
    };
  }

  /**
   * 해금 가능한 챕터 목록 조회
   */
  async getAvailableChapters(userId: string) {
    return Promise.all(
      STORY_CHAPTERS.map(async (chapter) => {
        const progress = await this.prisma.storyProgress.findUnique({
          where: { userId_chapterId: { userId, chapterId: chapter.id } },
        });
        const unlocked = !!progress || (await this.isChapterUnlocked(userId, chapter));
        const totalScenes =
          chapter.id === 'chapter-6' ? 3 : chapter.id === 'epilogue' ? 1 : chapter.scenes.length;
        const resumedAt = chapter.scenes.findIndex(({ id }) => id === progress?.sceneId);
        const prior =
          chapter.unlockCondition.type === 'chapter' &&
          typeof chapter.unlockCondition.value === 'string'
            ? getChapterById(chapter.unlockCondition.value)
            : undefined;
        return {
          chapter: {
            id: chapter.id,
            title: chapter.title,
            titleKo: chapter.titleKo,
            order: chapter.order,
            totalScenes,
            unlockCondition: chapter.unlockCondition,
          },
          isUnlocked: unlocked,
          isStarted: !!progress,
          isCompleted: progress?.completed ?? false,
          currentSceneId: progress?.sceneId ?? null,
          completedScenes: progress?.completed
            ? totalScenes
            : Math.max(0, Math.min(totalScenes - 1, resumedAt)),
          unlockRequirement: !unlocked && prior ? `${prior.titleKo}을 먼저 마쳐주세요.` : undefined,
        };
      }),
    );
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

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${userId} FOR UPDATE`;
      const key = { userId_chapterId: { userId, chapterId } };
      const existing = await tx.storyProgress.findUnique({ where: key });
      if (existing) return this.sceneState(tx, userId, chapter, existing);
      if (!(await this.isChapterUnlocked(userId, chapter, tx)))
        throw new BadRequestException('이 챕터는 아직 해금되지 않았습니다.');

      const firstScene = await this.openingScene(tx, userId, chapter);
      const progress = await tx.storyProgress.upsert({
        where: key,
        create: { userId, chapterId, sceneId: firstScene.id, choices: [], effects: {} },
        update: {},
      });
      return this.sceneState(tx, userId, chapter, progress);
    });
  }

  private async openingScene(tx: StoryDatabase, userId: string, chapter: StoryChapter) {
    if (chapter.id === 'epilogue') {
      const finale = await tx.storyProgress.findUnique({
        where: { userId_chapterId: { userId, chapterId: 'chapter-6' } },
        select: { choices: true },
      });
      const selected = getSceneById('chapter-6', 'ch6-scene-2')?.choices?.find(
        ({ id }) => Array.isArray(finale?.choices) && finale.choices.includes(id),
      );
      const endingScene = selected?.nextSceneId?.replace('ch6-scene-3-', 'epilogue-scene-');
      if (endingScene) {
        const scene = getSceneById(chapter.id, endingScene);
        if (scene) return scene;
      }
      // Accounts that completed the older finale without a choice keep their opening.
    }
    return chapter.scenes[0];
  }

  private async sceneState(
    tx: StoryDatabase,
    userId: string,
    chapter: StoryChapter,
    progress: StoryProgress,
  ) {
    const currentScene =
      !progress.completed && progress.sceneId
        ? (getSceneById(chapter.id, progress.sceneId) ?? null)
        : null;
    return {
      progress,
      currentScene,
      isChapterComplete: progress.completed,
      requirement: currentScene
        ? await storySceneRequirement(tx, userId, currentScene.id)
        : undefined,
      rewards: progress.completed ? (isFollowup(chapter) ? [] : chapter.rewards) : undefined,
    };
  }

  /** Advance the open scene and persist any choice with its effects in the same transaction. */
  async advanceScene(userId: string, chapterId: string, action: SceneAction = {}) {
    const chapter = getChapterById(chapterId);
    if (!chapter) throw new NotFoundException(`챕터를 찾을 수 없습니다: ${chapterId}`);

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${userId} FOR UPDATE`;
      const key = { userId_chapterId: { userId, chapterId } };
      const progress = await tx.storyProgress.findUnique({ where: key });
      if (!progress) throw new BadRequestException('챕터를 먼저 시작해야 합니다.');
      const choices = Array.isArray(progress.choices) ? progress.choices : [];
      if (
        progress.completed ||
        (action.sceneId && action.sceneId !== progress.sceneId) ||
        (action.choiceId && choices.includes(action.choiceId))
      )
        return this.sceneState(tx, userId, chapter, progress);

      const index = chapter.scenes.findIndex((scene) => scene.id === progress.sceneId);
      const current = chapter.scenes[index];
      if (!current) throw new BadRequestException('현재 장면을 찾을 수 없습니다.');
      const requirement = await storySceneRequirement(tx, userId, current.id);
      if (requirement) throw new BadRequestException(requirement.message);

      const choice = current.choices?.find(({ id }) => id === action.choiceId);
      if (action.choiceId && !choice)
        throw new BadRequestException('현재 장면의 선택지를 골라주세요.');
      if (isFollowup(chapter) && !choice && current.choices?.length)
        throw new BadRequestException('현재 장면의 선택지를 골라주세요.');

      const terminal = chapter.id === 'epilogue' || current.id.startsWith('ch6-scene-3-');
      const canonical = terminal
        ? undefined
        : choice?.nextSceneId
          ? getSceneById(chapterId, choice.nextSceneId)
          : chapter.scenes[index + 1];
      if (isFollowup(chapter) && action.nextSceneId && action.nextSceneId !== canonical?.id)
        throw new BadRequestException('현재 장면에서 이어지는 이야기로 진행해주세요.');
      const next =
        !isFollowup(chapter) && !choice && action.nextSceneId
          ? getSceneById(chapterId, action.nextSceneId)
          : canonical;
      if (!next) await this.assertMilestoneComplete(userId, chapterId, tx);
      if (choice) await this.processChoiceEffects(userId, choice, tx);

      const previousEffects =
        progress.effects && typeof progress.effects === 'object' && !Array.isArray(progress.effects)
          ? progress.effects
          : {};
      const updated = await tx.storyProgress.update({
        where: key,
        data: {
          sceneId: next?.id ?? null,
          completed: !next,
          ...(choice
            ? {
                choices: [...choices, choice.id],
                effects: { ...previousEffects, ...choice.effect },
              }
            : {}),
        },
      });
      return this.sceneState(tx, userId, chapter, updated);
    });
  }

  async makeChoice(userId: string, chapterId: string, choiceId: string) {
    return this.advanceScene(userId, chapterId, { choiceId });
  }

  /**
   * 선택지 효과 처리
   */
  private async processChoiceEffects(userId: string, choice: StoryChoice, tx: StoryDatabase) {
    const effect = choice.effect;

    for (const [key, value] of Object.entries(effect)) {
      // 호감도 처리 (예: jinAffinity, oliviaAffinity)
      if (key.endsWith('Affinity')) {
        const characterId = key.replace('Affinity', '').toLowerCase();
        if (CHARACTERS.includes(characterId) && typeof value === 'number') {
          await this.updateCharacterAffinity(userId, characterId, value, tx);
        }
      }

      // 스토리 플래그 처리
      if (key === 'storyFlag' && typeof value === 'string') {
        await this.setStoryFlag(userId, value, true, tx);
      }

      // 엔딩 플래그
      if (key === 'ending' && typeof value === 'string') {
        await this.setStoryFlag(userId, `ending_${value}`, true, tx);
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

    if (isFollowup(chapter)) return { rewards: [], message: '이야기 완료 기록을 확인했어요.' };

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
  async updateCharacterAffinity(
    userId: string,
    characterId: string,
    amount: number,
    tx: StoryDatabase = this.prisma,
  ) {
    // 캐릭터가 해금되어 있는지 확인
    let affinity = await tx.characterAffinity.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    if (!affinity) {
      // 처음 만나는 캐릭터인 경우 자동 해금
      affinity = await tx.characterAffinity.create({
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

      affinity = await tx.characterAffinity.update({
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
  async setStoryFlag(
    userId: string,
    flagId: string,
    value: unknown = true,
    tx: StoryDatabase = this.prisma,
  ) {
    await tx.storyFlag.upsert({
      where: { userId_flagId: { userId, flagId } },
      create: { userId, flagId, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) },
    });
  }

  /**
   * 스토리 플래그 확인
   */
  async hasStoryFlag(
    userId: string,
    flagId: string,
    tx: StoryDatabase = this.prisma,
  ): Promise<boolean> {
    const flag = await tx.storyFlag.findUnique({
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
  private async isChapterUnlocked(
    userId: string,
    chapter: StoryChapter,
    tx: StoryDatabase = this.prisma,
  ): Promise<boolean> {
    const { type, value } = chapter.unlockCondition;

    switch (type) {
      case 'none':
        return true;

      case 'chapter':
        if (typeof value === 'string') {
          const prevProgress = await tx.storyProgress.findUnique({
            where: { userId_chapterId: { userId, chapterId: value } },
          });
          return prevProgress?.completed ?? false;
        }
        return false;

      case 'parkLevel':
        if (typeof value === 'number') {
          const park = await tx.park.findUnique({
            where: { userId },
          });
          return (park?.level ?? 0) >= value;
        }
        return false;

      case 'building':
        if (typeof value === 'string') {
          const building = await tx.building.findFirst({
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
          const dinosaur = await tx.dinosaur.findFirst({
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
    const progress = await this.prisma.storyProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });
    const chapter = getChapterById(chapterId);
    if (!progress || !chapter) throw new NotFoundException('진행 중인 챕터를 찾을 수 없습니다.');
    if (progress.completed) return progress;
    if (isFollowup(chapter)) throw new BadRequestException('마지막 장면까지 진행해주세요.');
    await this.assertMilestoneComplete(userId, chapterId);
    return this.prisma.storyProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { completed: true },
    });
  }

  private async assertMilestoneComplete(
    userId: string,
    chapterId: string,
    tx: StoryDatabase = this.prisma,
  ) {
    if (
      chapterId === 'chapter-2' &&
      !(await this.hasStoryFlag(userId, EARLY_SYNTHESIS_SAFETY_FLAG, tx))
    )
      throw new BadRequestException('원종 돌봄과 2장 안전 점검을 마쳐주세요.');
    if (chapterId !== 'chapter-3') return;
    const milestone = await tx.firstSynthesisJob.findFirst({
      where: { park: { userId }, exhibitedAt: { not: null } },
      select: { parkId: true },
    });
    if (!milestone)
      throw new BadRequestException('첫 스테고케라톱스 전시를 마치면 3장이 완료돼요.');
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
