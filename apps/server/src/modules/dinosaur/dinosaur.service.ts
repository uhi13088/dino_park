import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_DINOSAUR_LEVEL,
  MAX_HAPPINESS,
  MAX_HUNGER,
  MAX_INTIMACY,
  HAPPINESS_DECAY_PER_HOUR,
  HUNGER_INCREASE_PER_HOUR,
  FEEDING_HAPPINESS_GAIN,
  FEEDING_HUNGER_REDUCE,
  RARITY_REVENUE_MULTIPLIER,
} from '@dino-park/shared';
import { getDinosaurById } from '@dino-park/game-data';

/**
 * 공룡 레벨별 필요 경험치
 * 공식: 50 * level^1.5
 */
function getExpForDinoLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

/**
 * 공룡 수익 계산
 * 공식: baseRevenue * levelMultiplier * happinessMultiplier * rarityMultiplier
 */
function calculateDinosaurRevenue(
  baseRevenue: number,
  level: number,
  happiness: number,
  rarity: string,
): number {
  const levelMultiplier = 1 + (level - 1) * 0.1; // 레벨당 10% 증가
  const happinessMultiplier = 0.5 + (happiness / MAX_HAPPINESS) * 0.5; // 50%~100%
  const rarityMultiplier =
    RARITY_REVENUE_MULTIPLIER[rarity as keyof typeof RARITY_REVENUE_MULTIPLIER] || 1;

  return Math.floor(baseRevenue * levelMultiplier * happinessMultiplier * rarityMultiplier);
}

@Injectable()
export class DinosaurService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 유저 ID로 공룡 목록 조회 (상태 업데이트 포함)
   */
  async getByUserId(userId: string) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    const dinosaurs = await this.prisma.dinosaur.findMany({
      where: { parkId: park.id },
      orderBy: { createdAt: 'desc' },
    });

    // 상태 계산 후 반환 (실제 DB 업데이트는 하지 않음 - 조회 성능)
    return dinosaurs.map((dino) => this.calculateCurrentState(dino));
  }

  /**
   * ID로 공룡 상세 조회
   */
  async getById(id: string, userId?: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id },
      include: {
        park: {
          select: { userId: true },
        },
      },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    // 소유권 확인 (userId가 제공된 경우)
    if (userId && dinosaur.park.userId !== userId) {
      throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
    }

    return this.calculateCurrentState(dinosaur);
  }

  /**
   * 공룡 생성 (부화 완료 시 호출)
   */
  async create(
    userId: string,
    speciesId: string,
    positionX: number,
    positionY: number,
    nickname?: string,
  ) {
    const park = await this.prisma.park.findUnique({
      where: { userId },
    });

    if (!park) {
      throw new NotFoundException('파크를 찾을 수 없습니다.');
    }

    // 위치 유효성 검사
    if (
      positionX < 0 ||
      positionY < 0 ||
      positionX >= park.gridSizeX ||
      positionY >= park.gridSizeY
    ) {
      throw new BadRequestException('유효하지 않은 위치입니다.');
    }

    return this.prisma.dinosaur.create({
      data: {
        parkId: park.id,
        speciesId,
        nickname,
        positionX,
        positionY,
        happiness: MAX_HAPPINESS,
        hunger: 0,
        intimacy: 0,
      },
    });
  }

  /**
   * 공룡 닉네임 변경
   */
  async updateNickname(dinosaurId: string, userId: string, nickname: string) {
    const dinosaur = await this.getById(dinosaurId, userId);

    if (nickname && (nickname.length < 1 || nickname.length > 12)) {
      throw new BadRequestException('닉네임은 1~12자여야 합니다.');
    }

    return this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: { nickname: nickname || null },
    });
  }

  /**
   * 공룡 위치 이동
   */
  async move(dinosaurId: string, userId: string, positionX: number, positionY: number) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
      include: { park: true },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    if (dinosaur.park.userId !== userId) {
      throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
    }

    // 위치 유효성 검사
    if (
      positionX < 0 ||
      positionY < 0 ||
      positionX >= dinosaur.park.gridSizeX ||
      positionY >= dinosaur.park.gridSizeY
    ) {
      throw new BadRequestException('유효하지 않은 위치입니다.');
    }

    return this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: { positionX, positionY },
    });
  }

  /**
   * 공룡에게 먹이주기
   * - 골드 차감
   * - 행복도 증가, 배고픔 감소
   * - 친밀도 소량 증가
   */
  async feed(dinosaurId: string, userId: string) {
    const dinosaur = await this.getById(dinosaurId, userId);

    // 먹이 비용 (기본 100골드)
    const feedCost = 100;

    // 골드 차감
    const currency = await this.prisma.currency.findUnique({
      where: { userId },
    });

    if (!currency || currency.gold < feedCost) {
      throw new BadRequestException('골드가 부족합니다.');
    }

    // 현재 상태 계산
    const currentState = this.calculateCurrentState(dinosaur);

    // 이미 포만 상태면 효과 없음
    if (currentState.hunger === 0) {
      throw new BadRequestException('이미 배부른 상태입니다.');
    }

    const newHappiness = Math.min(MAX_HAPPINESS, currentState.happiness + FEEDING_HAPPINESS_GAIN);
    const newHunger = Math.max(0, currentState.hunger - FEEDING_HUNGER_REDUCE);
    const newIntimacy = Math.min(MAX_INTIMACY, currentState.intimacy + 5); // 먹이 시 친밀도 +5

    // 트랜잭션으로 골드 차감 + 공룡 상태 업데이트
    const [, updated] = await this.prisma.$transaction([
      this.prisma.currency.update({
        where: { userId },
        data: { gold: { decrement: feedCost } },
      }),
      this.prisma.dinosaur.update({
        where: { id: dinosaurId },
        data: {
          happiness: newHappiness,
          hunger: newHunger,
          intimacy: newIntimacy,
          lastFedAt: new Date(),
        },
      }),
    ]);

    return {
      ...updated,
      goldSpent: feedCost,
      happinessGain: newHappiness - currentState.happiness,
      hungerReduce: currentState.hunger - newHunger,
      intimacyGain: newIntimacy - currentState.intimacy,
    };
  }

  /**
   * 공룡 쓰다듬기/놀아주기
   * - 친밀도 증가
   * - 행복도 소량 증가
   * - 쿨타임 있음 (5분)
   */
  async interact(dinosaurId: string, userId: string) {
    const dinosaur = await this.getById(dinosaurId, userId);

    // 쿨타임 체크 (마지막 상호작용으로부터 5분)
    const cooldownMinutes = 5;
    const lastInteraction = dinosaur.lastFedAt; // 임시로 lastFedAt 사용
    const now = new Date();
    const minutesSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60);

    if (minutesSinceLastInteraction < cooldownMinutes) {
      const remainingSeconds = Math.ceil((cooldownMinutes - minutesSinceLastInteraction) * 60);
      throw new BadRequestException(
        `아직 쿨타임 중입니다. ${remainingSeconds}초 후에 다시 시도해주세요.`,
      );
    }

    const currentState = this.calculateCurrentState(dinosaur);
    const newHappiness = Math.min(MAX_HAPPINESS, currentState.happiness + 5);
    const newIntimacy = Math.min(MAX_INTIMACY, currentState.intimacy + 10);

    // 경험치 획득 (친밀도에 비례)
    const expGain = Math.floor(10 + currentState.intimacy / 100);

    const updated = await this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: {
        happiness: newHappiness,
        intimacy: newIntimacy,
        exp: { increment: expGain },
      },
    });

    // 레벨업 체크
    const levelUpResult = await this.checkLevelUp(dinosaurId);

    return {
      ...this.calculateCurrentState(updated),
      expGain,
      happinessGain: newHappiness - currentState.happiness,
      intimacyGain: newIntimacy - currentState.intimacy,
      leveledUp: levelUpResult?.leveledUp || false,
      newLevel: levelUpResult?.newLevel,
    };
  }

  /**
   * 레벨업 체크 및 처리
   */
  async checkLevelUp(dinosaurId: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
    });

    if (!dinosaur) return null;

    let currentExp = dinosaur.exp;
    let currentLevel = dinosaur.level;
    let leveledUp = false;

    while (currentLevel < MAX_DINOSAUR_LEVEL) {
      const expNeeded = getExpForDinoLevel(currentLevel);
      if (currentExp >= expNeeded) {
        currentExp -= expNeeded;
        currentLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    if (leveledUp) {
      await this.prisma.dinosaur.update({
        where: { id: dinosaurId },
        data: {
          level: currentLevel,
          exp: currentExp,
        },
      });

      return { leveledUp: true, newLevel: currentLevel };
    }

    return { leveledUp: false };
  }

  /**
   * 공룡 파크에서 제거 (창고로)
   */
  async removeFromPark(dinosaurId: string, userId: string) {
    await this.getById(dinosaurId, userId);

    return this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: { isInPark: false },
    });
  }

  /**
   * 공룡 파크에 배치
   */
  async placeInPark(dinosaurId: string, userId: string, positionX: number, positionY: number) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
      include: { park: true },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    if (dinosaur.park.userId !== userId) {
      throw new ForbiddenException('이 공룡에 접근할 권한이 없습니다.');
    }

    // 위치 유효성 검사
    if (
      positionX < 0 ||
      positionY < 0 ||
      positionX >= dinosaur.park.gridSizeX ||
      positionY >= dinosaur.park.gridSizeY
    ) {
      throw new BadRequestException('유효하지 않은 위치입니다.');
    }

    return this.prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: {
        isInPark: true,
        positionX,
        positionY,
      },
    });
  }

  /**
   * 공룡 삭제 (방생)
   * - DNA 획득
   */
  async release(dinosaurId: string, userId: string) {
    const dinosaur = await this.getById(dinosaurId, userId);

    // 방생 시 DNA 획득 (레벨과 희귀도에 따라)
    const speciesData = getDinosaurById(dinosaur.speciesId);
    const rarityMultiplier = RARITY_REVENUE_MULTIPLIER[speciesData?.stats.rarity || 'common'] || 1;
    const dnaReward = Math.floor(dinosaur.level * 5 * rarityMultiplier);

    await this.prisma.$transaction([
      this.prisma.dinosaur.delete({
        where: { id: dinosaurId },
      }),
      this.prisma.currency.update({
        where: { userId },
        data: { dna: { increment: dnaReward } },
      }),
    ]);

    return { released: true, dnaReward };
  }

  /**
   * 공룡 수익 계산
   */
  async calculateRevenue(dinosaurId: string) {
    const dinosaur = await this.prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
    });

    if (!dinosaur) {
      throw new NotFoundException('공룡을 찾을 수 없습니다.');
    }

    const currentState = this.calculateCurrentState(dinosaur);

    // game-data에서 baseRevenue와 rarity 가져오기
    const speciesData = getDinosaurById(dinosaur.speciesId);
    const baseRevenue = speciesData?.stats.baseRevenue || 100;
    const rarity = speciesData?.stats.rarity || 'common';

    const hourlyRevenue = calculateDinosaurRevenue(
      baseRevenue,
      currentState.level,
      currentState.happiness,
      rarity,
    );

    return {
      hourlyRevenue,
      minuteRevenue: Math.floor(hourlyRevenue / 60),
      level: currentState.level,
      happiness: currentState.happiness,
      happinessMultiplier: Math.floor((0.5 + (currentState.happiness / MAX_HAPPINESS) * 0.5) * 100),
    };
  }

  /**
   * 시간에 따른 상태 변화 계산 (실제 DB 업데이트 X)
   */
  private calculateCurrentState(dinosaur: any) {
    const now = new Date();
    const lastFed = new Date(dinosaur.lastFedAt);
    const hoursPassed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);

    // 행복도 감소
    const happinessDecay = Math.floor(hoursPassed * HAPPINESS_DECAY_PER_HOUR);
    const currentHappiness = Math.max(0, dinosaur.happiness - happinessDecay);

    // 배고픔 증가
    const hungerIncrease = Math.floor(hoursPassed * HUNGER_INCREASE_PER_HOUR);
    const currentHunger = Math.min(MAX_HUNGER, dinosaur.hunger + hungerIncrease);

    // 경험치 필요량
    const expForNextLevel = getExpForDinoLevel(dinosaur.level);

    return {
      ...dinosaur,
      happiness: currentHappiness,
      hunger: currentHunger,
      expForNextLevel,
      // 상태 표시용
      happinessStatus:
        currentHappiness >= 80
          ? 'happy'
          : currentHappiness >= 50
            ? 'normal'
            : currentHappiness >= 20
              ? 'sad'
              : 'depressed',
      hungerStatus:
        currentHunger <= 20
          ? 'full'
          : currentHunger <= 50
            ? 'normal'
            : currentHunger <= 80
              ? 'hungry'
              : 'starving',
    };
  }
}
