import { randomInt } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type RepeatSynthesisJob } from '@prisma/client';
import { SYNTHESIS_RULES } from '@dino-park/game-data';
import {
  Rarity,
  RESEARCH_MATERIAL_LABELS,
  type DinosaurCompetitiveStats,
  type RepeatSynthesisFocus,
  type RepeatSynthesisIngredient,
  type RepeatSynthesisStart,
  type RepeatSynthesisState,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ParkOperationsService } from '../park/park-operations.service';
import {
  firstRecipe,
  hasHealthyParents,
  MilestoneSynthesisService,
} from './milestone-synthesis.service';
import { repeatSynthesisFocusOptions, rollCompetitiveStats } from './repeat-synthesis.rules';

const rule = SYNTHESIS_RULES[Rarity.EPIC];
const refundAmount = (amount: number) => Math.floor((amount * 80) / 100);
const successChance = (attempt: number) =>
  attempt >= rule.guaranteedAttempt ? 1 : rule.successRate;

function refundedMaterials(job: RepeatSynthesisJob) {
  return job.refunds as unknown as RepeatSynthesisIngredient[];
}

function jobState(
  job: RepeatSynthesisJob,
  now: number,
  owned: boolean,
): RepeatSynthesisState['job'] {
  const result =
    job.claimedAt && job.resultDinosaurId && job.traits
      ? {
          dinosaurId: job.resultDinosaurId,
          stats: job.traits as unknown as DinosaurCompetitiveStats,
          owned,
        }
      : null;
  let status: NonNullable<RepeatSynthesisState['job']>['status'] = 'incubating';
  if (job.claimedAt) status = job.success ? 'succeeded' : 'failed';
  else if (job.readyAt.getTime() <= now) status = 'ready';
  return {
    id: job.id,
    focus: job.focus as RepeatSynthesisFocus,
    status,
    readyAt: job.readyAt.toISOString(),
    result,
    refunded: status === 'failed' ? refundedMaterials(job) : [],
  };
}

@Injectable()
export class RepeatSynthesisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly milestone: MilestoneSynthesisService,
  ) {}

  private async read(tx: Prisma.TransactionClient, userId: string, clock: Date) {
    const { park, state, lab } = await this.milestone.readStateInTransaction(tx, userId, clock);
    const unlocked = Boolean(park.firstSynthesis?.exhibitedAt);
    const latest = unlocked
      ? await tx.repeatSynthesisJob.findFirst({
          where: { parkId: park.id },
          orderBy: { sequence: 'desc' },
        })
      : null;
    const ingredients = state.ingredients.map((ingredient) => ({
      ...ingredient,
      failureRefund: refundAmount(ingredient.amount),
    }));
    const missing: string[] = [];
    if (!unlocked) missing.push('스테고케라톱스의 첫 전시를 마쳐주세요.');
    if (!lab) missing.push('DNA 연구소를 완공해주세요.');
    if (!hasHealthyParents(state.parents))
      missing.push('행복도 30 이상·허기 80 이하의 스테고사우루스와 트리케라톱스가 필요해요.');
    if (state.gold < firstRecipe.goldCost)
      missing.push(`합성에 쓸 ${firstRecipe.goldCost.toLocaleString('ko-KR')}골드가 필요해요.`);
    for (const ingredient of ingredients) {
      if (ingredient.available < ingredient.amount)
        missing.push(
          `중급 ${RESEARCH_MATERIAL_LABELS[ingredient.material]} ${ingredient.amount}개가 필요해요.`,
        );
    }
    let attempt = 1;
    if (latest && !latest.claimedAt) attempt = latest.attempt;
    else if (latest && !latest.success) attempt = latest.attempt + 1;
    const response: RepeatSynthesisState = {
      unlocked,
      serverTime: clock.toISOString(),
      gold: state.gold,
      recipe: firstRecipe,
      ingredients,
      parents: state.parents,
      missing,
      focuses: repeatSynthesisFocusOptions,
      attempt,
      successChance: latest && !latest.claimedAt ? latest.successChance : successChance(attempt),
      guaranteedAttempt: rule.guaranteedAttempt,
      job: latest
        ? jobState(
            latest,
            clock.getTime(),
            park.dinosaurs.some((dinosaur) => dinosaur.id === latest.resultDinosaurId),
          )
        : null,
    };
    return { park, latest, response };
  }

  async status(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      return (await this.read(tx, userId, new Date())).response;
    });
  }

  async start(userId: string, { parentIds, focus, requestId }: RepeatSynthesisStart) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const clock = new Date();
      const { park, latest, response } = await this.read(tx, userId, clock);
      const prior = await tx.repeatSynthesisJob.findUnique({
        where: { parkId_requestId: { parkId: park.id, requestId } },
        select: { id: true },
      });
      if (prior) return response;
      if (latest && !latest.claimedAt)
        throw new BadRequestException('진행 중인 합성 결과를 먼저 수령해주세요.');
      if (response.missing.length) throw new BadRequestException(response.missing[0]);
      const parents = response.parents.filter((parent) => parentIds.includes(parent.id));
      if (
        parentIds.length !== firstRecipe.parentSpeciesIds.length ||
        parents.length !== parentIds.length ||
        !hasHealthyParents(parents)
      )
        throw new BadRequestException('보유 중인 건강한 두 원종을 한 마리씩 골라주세요.');

      for (const ingredient of firstRecipe.ingredients) {
        const debit = await tx.resourceInventory.updateMany({
          where: {
            parkId: park.id,
            material: ingredient.material,
            quality: ingredient.quality,
            amount: { gte: ingredient.amount },
          },
          data: { amount: { decrement: ingredient.amount } },
        });
        if (!debit.count)
          throw new BadRequestException(
            `중급 ${RESEARCH_MATERIAL_LABELS[ingredient.material]}가 부족해요.`,
          );
      }
      const debit = await tx.currency.updateMany({
        where: { userId, gold: { gte: firstRecipe.goldCost } },
        data: { gold: { decrement: firstRecipe.goldCost } },
      });
      if (!debit.count) throw new BadRequestException('골드가 부족해요.');
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          currencyType: 'gold',
          amount: -firstRecipe.goldCost,
          balanceAfter: response.gold - firstRecipe.goldCost,
          reason: '스테고케라톱스 반복 합성',
        },
      });
      const chance = response.successChance;
      const succeeded = chance === 1 || randomInt(100) < chance * 100;
      await tx.repeatSynthesisJob.create({
        data: {
          parkId: park.id,
          requestId,
          activeSlot: park.id,
          focus,
          parentIds,
          sequence: (latest?.sequence ?? 0) + 1,
          attempt: response.attempt,
          successChance: chance,
          success: succeeded,
          traits: succeeded ? { ...rollCompetitiveStats(focus) } : Prisma.DbNull,
          refunds: succeeded
            ? []
            : firstRecipe.ingredients.map((ingredient) => ({
                ...ingredient,
                amount: refundAmount(ingredient.amount),
              })),
          startedAt: clock,
          readyAt: new Date(clock.getTime() + firstRecipe.durationMs),
        },
      });
      return (await this.read(tx, userId, clock)).response;
    });
  }

  async claim(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.operations.settleInTransaction(tx, userId, true);
      const clock = new Date();
      const { park, response } = await this.read(tx, userId, clock);
      const job = await tx.repeatSynthesisJob.findFirst({ where: { id, parkId: park.id } });
      if (!job) throw new NotFoundException('내 반복 합성 작업을 찾을 수 없어요.');
      if (job.claimedAt) return response;
      if (job.readyAt.getTime() > clock.getTime())
        throw new BadRequestException('아직 배양 중이에요.');

      let resultDinosaurId: string | null = null;
      if (job.success) {
        const dinosaur = await tx.dinosaur.create({
          data: {
            parkId: park.id,
            speciesId: firstRecipe.resultSpeciesId,
            isInPark: false,
            positionX: 0,
            positionY: 0,
            lastFedAt: clock,
            competitiveStats: job.traits as Prisma.InputJsonValue,
          },
        });
        resultDinosaurId = dinosaur.id;
        await tx.dinosaurCollection.upsert({
          where: { parkId_speciesId: { parkId: park.id, speciesId: dinosaur.speciesId } },
          create: {
            parkId: park.id,
            speciesId: dinosaur.speciesId,
            firstCollectedAt: dinosaur.createdAt,
          },
          update: {},
        });
      } else {
        for (const { material, quality, amount } of refundedMaterials(job)) {
          if (!amount) continue;
          const key = { parkId: park.id, material, quality };
          await tx.resourceInventory.upsert({
            where: { parkId_material_quality: key },
            create: { ...key, amount },
            update: { amount: { increment: amount } },
          });
        }
      }
      await tx.repeatSynthesisJob.update({
        where: { id: job.id },
        data: { activeSlot: null, claimedAt: clock, resultDinosaurId },
      });
      return (await this.read(tx, userId, clock)).response;
    });
  }
}
