import { randomInt, randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  canUseExperimentalHybridParent,
  EXPERIMENTAL_HYBRID_ACCESS,
  experimentalHybridStatOutcomes,
  getDinosaurById,
  getExperimentalHybridDesign,
  RESEARCH_LAB_ID,
  rollExperimentalHybridStats,
  SYNTHESIS_RULES,
} from '@dino-park/game-data';
import {
  MaterialQuality,
  Rarity,
  RESEARCH_MATERIAL_LABELS,
  ResearchMaterial,
  type DinosaurCompetitiveStats,
  type ExperimentalHybridDocument,
  type ExperimentalHybridIdentity,
  type ExperimentalHybridJobState,
  type ExperimentalHybridQuote,
  type ExperimentalHybridSelection,
  type ExperimentalHybridStart,
  type ExperimentalHybridState,
  type ExperimentalHybridTier,
} from '@dino-park/shared';
import { Prisma, type ExperimentalHybridJob } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { currentDinosaurState } from '../park/park-admission.logic';
import { ParkOperationsService } from '../park/park-operations.service';
import { highestCompletedFacilityLevel } from '../research/research-facilities';
import { ExperimentalHybridArtService } from './experimental-hybrid-art.service';
import { ExperimentalHybridArtWorker } from './experimental-hybrid-art-worker';
import {
  failureRefunds,
  HYBRID_LINEAGE_SELECT,
  lineageIdentity,
  lineageKey,
  spendIngredients,
  type HybridLineage,
  type Ingredient,
} from './experimental-hybrid-records';
import { ExperimentalHybridMarketService } from './experimental-hybrid-market.service';

type Tx = Prisma.TransactionClient;
type Design = NonNullable<ReturnType<typeof getExperimentalHybridDesign>>;
export const ARCHIVE_MISSION = EXPERIMENTAL_HYBRID_ACCESS.archiveMission;

function classicParent(speciesId: string) {
  const species = getDinosaurById(speciesId);
  return species && canUseExperimentalHybridParent(species) ? species : undefined;
}

function draftIdentity(design: Design): ExperimentalHybridIdentity {
  return {
    species: { ...design.species, id: 'experimental-preview' },
    artwork: null,
    parentSpeciesIds: design.parentSpeciesIds,
    focus: design.focus,
  };
}

function lockedAction(reasons: string[]) {
  if (reasons.length) throw new BadRequestException(reasons[0]);
}

function startRequirement(
  parkLevel: number,
  hasFirstExhibit: boolean,
  labLevel: number,
  analysisLevel: number,
  tier: ExperimentalHybridTier,
) {
  const { parkLevel: requiredPark, basic, legendary } = EXPERIMENTAL_HYBRID_ACCESS;
  const { labLevel: labRequired, geneAnalysis: researchRequired } =
    tier === Rarity.LEGENDARY ? legendary : basic;
  return [
    !hasFirstExhibit && '스테고케라톱스 첫 전시를 마쳐주세요.',
    parkLevel < requiredPark && `파크 Lv.${requiredPark}부터 실험 합성을 할 수 있어요.`,
    labLevel < labRequired && `DNA 연구소 Lv.${labRequired}를 완공하세요.`,
    analysisLevel < researchRequired &&
      `고급 유전자 분석 Lv.${researchRequired} 연구를 완료하세요.`,
  ].filter((reason): reason is string => typeof reason === 'string');
}

@Injectable()
export class ExperimentalHybridService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly artist: ExperimentalHybridArtService,
    private readonly worker: ExperimentalHybridArtWorker,
    private readonly market: ExperimentalHybridMarketService,
  ) {}

  private async context(tx: Tx, userId: string, time: Date) {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: {
        user: { select: { nickname: true } },
        buildings: true,
        dinosaurs: true,
        firstSynthesis: { select: { exhibitedAt: true } },
        technologyResearch: {
          where: { technologyId: 'gene-analysis', completesAt: { lte: time } },
          orderBy: { level: 'desc' },
          take: 1,
        },
        resourceInventory: {
          where: { quality: { gte: MaterialQuality.MIDDLE } },
          select: { material: true, quality: true, amount: true },
        },
        repeatSyntheses: { where: { claimedAt: null }, select: { id: true }, take: 1 },
      },
    });
    const { gold } = await tx.currency.findUniqueOrThrow({
      where: { userId },
      select: { gold: true },
    });
    const labLevel = highestCompletedFacilityLevel(park.buildings, RESEARCH_LAB_ID);
    const analysisLevel = park.technologyResearch[0]?.level ?? 0;
    const gates = (tier: ExperimentalHybridTier) =>
      startRequirement(
        park.level,
        !!park.firstSynthesis?.exhibitedAt,
        labLevel,
        analysisLevel,
        tier,
      );
    return { park, gold, gates };
  }

  private async quoteFor(
    tx: Tx,
    userId: string,
    selection: ExperimentalHybridSelection,
    time: Date,
  ) {
    const { park, gold, gates } = await this.context(tx, userId, time);
    const blockers = gates(selection.tier);
    const [left, right] = selection.parentIds.map((id) =>
      park.dinosaurs.find((row) => row.id === id),
    );
    const parents = [
      left && classicParent(left.speciesId),
      right && classicParent(right.speciesId),
    ];
    const rule = SYNTHESIS_RULES[selection.tier];
    const recipeKey =
      parents[0] && parents[1]
        ? lineageKey([parents[0].id, parents[1].id], selection.focus, selection.tier)
        : undefined;
    const lineup = recipeKey
      ? await tx.experimentalHybridLineage.findUnique({
          where: { key: recipeKey },
          select: HYBRID_LINEAGE_SELECT,
        })
      : null;
    const registration = lineup
      ? await tx.experimentalHybridRecipe.findUnique({
          where: { parkId_lineageId: { parkId: park.id, lineageId: lineup.id } },
        })
      : null;
    const registered = !!registration;
    const design =
      parents[0] && parents[1]
        ? getExperimentalHybridDesign(
            parents[0],
            parents[1],
            selection.focus,
            selection.tier,
            registered,
          )
        : null;
    const reply: ExperimentalHybridQuote = {
      selection,
      design: design
        ? registered && lineup
          ? lineageIdentity(lineup, !!lineup.discoveredBy)
          : draftIdentity(design)
        : null,
      registered,
      artReady: registered && lineup?.artworkState === 'ready',
      blockers,
      reasons: [],
      gold: design?.cost.gold ?? 0,
      durationSeconds: design?.cost.durationSeconds ?? 0,
      ingredients: [],
      attempt: 1,
      guaranteedAttempt: rule.guaranteedAttempt,
      successChance: rule.successRate,
      estimatedStats: design ? experimentalHybridStatOutcomes(design) : null,
    };
    if (!design || !left || !right) {
      blockers.push(
        left &&
          right &&
          parents[0] &&
          parents[1] &&
          parents[0].id !== parents[1].id &&
          selection.tier === Rarity.LEGENDARY
          ? '전설 합성에는 희귀 이상 원종 두 종과 그중 영웅 이상 원종 한 종이 필요해요.'
          : '보유한 서로 다른 호환 원종 두 마리를 선택하세요.',
      );
      return { park, quote: reply, lineup, design, debits: [] };
    }
    if (
      [left, right].some((parent) => {
        const care = currentDinosaurState(parent, time.getTime(), park);
        return care.happiness < 30 || care.hunger > 80;
      })
    )
      blockers.push('행복도 30 이상·허기 80 이하인 원종 두 마리를 배정하세요.');
    const [busy, prior] = await Promise.all([
      tx.experimentalHybridJob.findUnique({ where: { activeSlot: park.id }, select: { id: true } }),
      lineup
        ? tx.experimentalHybridJob.findFirst({
            where: {
              parkId: park.id,
              lineageId: lineup.id,
              claimedAt: { not: null },
              cancelledAt: null,
            },
            orderBy: { sequence: 'desc' },
            select: { attempt: true, success: true },
          })
        : null,
    ]);
    if (park.repeatSyntheses.length || busy)
      blockers.push('진행 중인 합성 결과를 먼저 수령하세요.');
    if (lineup?.artworkState !== 'ready' && !this.artist.enabled)
      blockers.push('지금은 새 외형을 만들 수 없어요. 잠시 후 다시 시도하세요.');
    if (gold < reply.gold) blockers.push(`${reply.gold.toLocaleString('ko-KR')}골드가 필요해요.`);

    const requirements: Ingredient[] = [...design.cost.ingredients];
    if (selection.stabilizer)
      requirements.push({
        material: ResearchMaterial.STABILIZER,
        quality:
          selection.tier === Rarity.LEGENDARY ? MaterialQuality.HIGH : MaterialQuality.MIDDLE,
        amount: 1,
      });
    const { debits, shortages } = spendIngredients(requirements, park.resourceInventory);
    const refunds = failureRefunds(debits, !!selection.stabilizer);
    reply.ingredients = requirements.map((item) => {
      const allocations = debits
        .filter(({ material }) => item.material === material)
        .map(({ material, quality, amount }) => ({
          quality,
          amount,
          failureRefund:
            refunds.find((refund) => refund.material === material && refund.quality === quality)
              ?.amount ?? 0,
        }));
      return {
        ...item,
        available: park.resourceInventory
          .filter(({ material, quality }) => material === item.material && quality >= item.quality)
          .reduce((sum, batch) => sum + batch.amount, 0),
        allocations,
        failureRefund: allocations.reduce((sum, batch) => sum + batch.failureRefund, 0),
      };
    });
    for (const { material, amount } of shortages)
      blockers.push(`${RESEARCH_MATERIAL_LABELS[material]} ${amount}개가 더 필요해요.`);
    reply.attempt = prior && !prior.success ? prior.attempt + 1 : 1;
    reply.successChance = reply.attempt >= rule.guaranteedAttempt ? 1 : rule.successRate;
    reply.reasons = [
      ...design.reasons,
      registered ? '등록한 연구자료로 연구비와 시간을 줄였어요.' : '새 조합의 실험 비용이에요.',
    ];
    return { park, quote: reply, lineup, design, debits };
  }

  private async registerLineage(tx: Tx, design: Design) {
    const key = lineageKey(design.parentSpeciesIds, design.focus, design.tier);
    // Different parks can independently start the same lineage at the same time.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${key}))`;
    const id = 'hybrid-' + randomUUID();
    return tx.experimentalHybridLineage.upsert({
      where: { key },
      create: {
        id,
        key,
        parentSpeciesIds: design.parentSpeciesIds,
        focus: design.focus,
        tier: design.tier,
        species: { ...design.species, id } as unknown as Prisma.InputJsonValue,
        artworkWidth: design.artworkWidth,
      },
      update: {},
      select: HYBRID_LINEAGE_SELECT,
    });
  }

  private jobState(
    job: ExperimentalHybridJob & { lineage: HybridLineage },
    now: Date,
    owned = false,
  ): ExperimentalHybridJobState {
    const hasArt = job.lineage.artworkState === 'ready';
    const artError =
      job.success && !hasArt && (job.lineage.artworkState === 'failed' || !this.artist.enabled);
    let status: ExperimentalHybridJobState['status'] = 'incubating';
    if (job.claimedAt) status = job.cancelledAt ? 'refunded' : job.success ? 'succeeded' : 'failed';
    else if (artError) status = 'ready';
    else if (job.readyAt <= now) status = !job.success || hasArt ? 'ready' : 'generating';
    const revealed = status === 'succeeded';
    const identity = lineageIdentity(job.lineage, revealed);
    return {
      id: job.id,
      design: revealed
        ? identity
        : { ...identity, species: { ...identity.species, id: 'experimental-preview' } },
      status,
      readyAt: job.readyAt.toISOString(),
      dinosaurId: owned ? job.resultDinosaurId : null,
      stats: revealed ? (job.traits as unknown as DinosaurCompetitiveStats) : null,
      refunds:
        status === 'refunded'
          ? (job.debits as unknown as Ingredient[])
          : status === 'failed'
            ? (job.refunds as unknown as Ingredient[])
            : [],
    };
  }

  private async stateFor(tx: Tx, userId: string, now: Date): Promise<ExperimentalHybridState> {
    const { park, gold, gates } = await this.context(tx, userId, now);
    const lockReasons = gates(Rarity.EPIC);
    const [job, registered, archive, mine, marketplace, pendingProceeds] = await Promise.all([
      tx.experimentalHybridJob.findFirst({
        where: { parkId: park.id },
        include: { lineage: { select: HYBRID_LINEAGE_SELECT } },
        orderBy: { sequence: 'desc' },
      }),
      tx.experimentalHybridRecipe.findMany({
        where: { parkId: park.id },
        include: { lineage: { select: HYBRID_LINEAGE_SELECT } },
        orderBy: { learnedAt: 'desc' },
      }),
      tx.scoutAssignment.findFirst({
        where: { scout: { parkId: park.id }, missionId: ARCHIVE_MISSION, claimedAt: { not: null } },
        select: { id: true },
      }),
      this.market.ownListings(tx, park.id, now),
      this.market.activeListings(tx),
      this.market.pendingProceeds(tx, park.id),
    ]);
    const documents: ExperimentalHybridDocument[] = registered.map((doc) => {
      const activity = mine.get(doc.lineageId);
      return {
        id: doc.lineageId,
        lineage: lineageIdentity(doc.lineage, !!doc.lineage.discoveredBy),
        tier: doc.lineage.tier as ExperimentalHybridTier,
        author: doc.lineage.discoveredBy ?? (doc.source === 'archive' ? '버려진 연구소' : null),
        source: doc.source as ExperimentalHybridDocument['source'],
        canPublish:
          !lockReasons.length &&
          doc.source !== 'market' &&
          !activity?.activeListingId &&
          !activity?.onCooldown,
        activeListingId: activity?.activeListingId ?? null,
      };
    });
    const learned = new Set(registered.map((doc) => doc.lineageId));
    const recoveredKey = lineageKey(['iguanodon', 'triceratops'], 'balanced', Rarity.EPIC);
    return {
      serverTime: now.toISOString(),
      unlocked: !lockReasons.length,
      lockReasons,
      gold,
      artEnabled: this.artist.enabled,
      parents: park.dinosaurs.flatMap((parent) => {
        const species = classicParent(parent.speciesId);
        if (!species) return [];
        const care = currentDinosaurState(parent, now.getTime(), park);
        return [
          {
            id: parent.id,
            speciesId: parent.speciesId,
            name: species.name,
            nameKo: species.nameKo,
            nickname: parent.nickname,
            rarity: species.rarity,
            happiness: care.happiness,
            hunger: care.hunger,
          },
        ];
      }),
      job: job
        ? this.jobState(
            job,
            now,
            park.dinosaurs.some(({ id }) => id === job.resultDinosaurId),
          )
        : null,
      documents,
      archive: {
        missionId: ARCHIVE_MISSION,
        reportReceived: !!archive,
        recovered: registered.some((record) => record.lineage.key === recoveredKey),
      },
      market: marketplace.map(({ listing, seller }) => ({
        id: listing.id,
        lineage: lineageIdentity(listing.lineage, !!listing.lineage.discoveredBy),
        tier: listing.lineage.tier as ExperimentalHybridTier,
        seller,
        price: listing.price,
        mine: listing.sellerParkId === park.id,
        registered: learned.has(listing.lineageId),
      })),
      pendingProceeds,
    };
  }

  private async locked<T>(userId: string, task: (tx: Tx, now: Date) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      const { settledAt } = await this.operations.settleInTransaction(tx, userId, true);
      return task(tx, settledAt);
    });
  }

  async state(userId: string) {
    this.worker.wake();
    return this.locked(userId, (tx, now) => this.stateFor(tx, userId, now));
  }

  quote(userId: string, selection: ExperimentalHybridSelection) {
    return this.locked(
      userId,
      async (tx, now) => (await this.quoteFor(tx, userId, selection, now)).quote,
    );
  }

  async start(userId: string, { requestId, ...selection }: ExperimentalHybridStart) {
    const state = await this.locked(userId, async (tx, now) => {
      const { park, quote, lineup, design, debits } = await this.quoteFor(
        tx,
        userId,
        selection,
        now,
      );
      const existing = await tx.experimentalHybridJob.findUnique({
        where: { parkId_requestId: { parkId: park.id, requestId } },
        select: { id: true },
      });
      if (existing) return this.stateFor(tx, userId, now);
      lockedAction(quote.blockers);
      if (!design) throw new BadRequestException('실험할 수 없는 원종 조합이에요.');
      const lineage = lineup ?? (await this.registerLineage(tx, design));
      for (const { material, quality, amount } of debits) {
        const result = await tx.resourceInventory.updateMany({
          where: { parkId: park.id, material, quality, amount: { gte: amount } },
          data: { amount: { decrement: amount } },
        });
        if (!result.count) throw new BadRequestException('합성 재료가 부족해요.');
      }
      await this.recordGold(tx, userId, -quote.gold, '하이브리드 실험 합성');
      const success = randomInt(100) < quote.successChance * 100;
      const latest = await tx.experimentalHybridJob.findFirst({
        where: { parkId: park.id },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });
      await tx.experimentalHybridJob.create({
        data: {
          parkId: park.id,
          lineageId: lineage.id,
          requestId,
          activeSlot: park.id,
          parentIds: selection.parentIds,
          attempt: quote.attempt,
          sequence: (latest?.sequence ?? 0) + 1,
          successChance: quote.successChance,
          success,
          traits: success
            ? { ...rollExperimentalHybridStats(design, () => randomInt(100) / 100) }
            : Prisma.DbNull,
          debits: debits as unknown as Prisma.InputJsonValue,
          refunds: failureRefunds(
            debits,
            !!selection.stabilizer,
          ) as unknown as Prisma.InputJsonValue,
          goldCost: quote.gold,
          startedAt: now,
          readyAt: new Date(now.getTime() + quote.durationSeconds * 1000),
        },
      });
      if (success)
        await tx.experimentalHybridLineage.updateMany({
          where: { id: lineage.id, artworkState: { in: ['idle', 'failed'] } },
          data: { artworkState: 'queued', artworkAttempts: 0 },
        });
      return this.stateFor(tx, userId, now);
    });
    this.worker.wake();
    return state;
  }

  private async recordGold(tx: Tx, userId: string, amount: number, reason: string) {
    if (amount < 0) {
      const debit = await tx.currency.updateMany({
        where: { userId, gold: { gte: -amount } },
        data: { gold: { increment: amount } },
      });
      if (!debit.count) throw new BadRequestException('골드가 부족해요.');
    } else {
      await tx.currency.update({ where: { userId }, data: { gold: { increment: amount } } });
    }
    const { gold } = await tx.currency.findUniqueOrThrow({
      where: { userId },
      select: { gold: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        type: amount < 0 ? 'SPEND' : 'EARN',
        currencyType: 'gold',
        amount,
        balanceAfter: gold,
        reason,
      },
    });
  }

  private async restoreIngredients(tx: Tx, parkId: string, ingredients: Ingredient[]) {
    for (const { material, quality, amount } of ingredients) {
      const key = { parkId, material, quality };
      await tx.resourceInventory.upsert({
        where: { parkId_material_quality: key },
        create: { ...key, amount },
        update: { amount: { increment: amount } },
      });
    }
  }

  async claim(userId: string, id: string) {
    const state = await this.locked(userId, async (tx, now) => {
      const park = await tx.park.findUniqueOrThrow({
        where: { userId },
        include: { user: { select: { nickname: true } } },
      });
      const job = await tx.experimentalHybridJob.findFirst({
        where: { id, parkId: park.id },
        include: { lineage: { select: HYBRID_LINEAGE_SELECT } },
      });
      if (!job) throw new NotFoundException('내 합성 작업을 찾을 수 없어요.');
      if (job.claimedAt) return this.stateFor(tx, userId, now);
      const active = this.jobState(job, now).status;
      if (active === 'incubating') throw new BadRequestException('아직 배양 중이에요.');
      if (active === 'generating')
        throw new BadRequestException('외형 생성이 끝나면 결과를 수령할 수 있어요.');
      const technicalFailure = job.success && job.lineage.artworkState !== 'ready';
      let resultDinosaurId: string | null = null;
      if (technicalFailure) {
        await this.restoreIngredients(tx, park.id, job.debits as unknown as Ingredient[]);
        await this.recordGold(tx, userId, job.goldCost, '하이브리드 외형 생성 실패 환불');
      } else if (!job.success) {
        await this.restoreIngredients(tx, park.id, job.refunds as unknown as Ingredient[]);
      } else {
        const identity = lineageIdentity(job.lineage);
        const result = await tx.dinosaur.create({
          data: {
            parkId: park.id,
            speciesId: identity.species.id,
            hybridSpecies: identity as unknown as Prisma.InputJsonValue,
            competitiveStats: job.traits as Prisma.InputJsonValue,
            isInPark: false,
            positionX: 0,
            positionY: 0,
            lastFedAt: now,
          },
          select: { id: true },
        });
        resultDinosaurId = result.id;
        await tx.dinosaurCollection.upsert({
          where: { parkId_speciesId: { parkId: park.id, speciesId: identity.species.id } },
          create: { parkId: park.id, speciesId: identity.species.id, firstCollectedAt: now },
          update: {},
        });
        await tx.experimentalHybridRecipe.upsert({
          where: { parkId_lineageId: { parkId: park.id, lineageId: job.lineageId } },
          create: { parkId: park.id, lineageId: job.lineageId, source: 'discovered' },
          update: {},
        });
        await tx.experimentalHybridLineage.updateMany({
          where: { id: job.lineageId, discoveredBy: null },
          data: { discoveredBy: park.user.nickname },
        });
      }
      await tx.experimentalHybridJob.update({
        where: { id },
        data: {
          activeSlot: null,
          claimedAt: now,
          cancelledAt: technicalFailure ? now : null,
          resultDinosaurId,
        },
      });
      return this.stateFor(tx, userId, now);
    });
    this.worker.wake();
    return state;
  }

  async recoverArchive(userId: string) {
    return this.locked(userId, async (tx, now) => {
      const { park, gates } = await this.context(tx, userId, now);
      lockedAction(gates(Rarity.EPIC));
      const report = await tx.scoutAssignment.findFirst({
        where: { scout: { parkId: park.id }, missionId: ARCHIVE_MISSION, claimedAt: { not: null } },
        select: { id: true },
      });
      if (!report)
        throw new BadRequestException('외벽 보관동 반복 조사의 보고서를 먼저 수령하세요.');
      const parentA = getDinosaurById('iguanodon')!;
      const parentB = getDinosaurById('triceratops')!;
      const recovered = getExperimentalHybridDesign(
        parentA,
        parentB,
        'balanced',
        Rarity.EPIC,
        true,
      );
      if (!recovered) throw new Error('Archive recipe is incompatible.');
      const lineage = await this.registerLineage(tx, recovered);
      await tx.experimentalHybridRecipe.upsert({
        where: { parkId_lineageId: { parkId: park.id, lineageId: lineage.id } },
        create: { parkId: park.id, lineageId: lineage.id, source: 'archive' },
        update: {},
      });
      return this.stateFor(tx, userId, now);
    });
  }

  async listDocument(userId: string, lineageId: string, price: number, requestId: string) {
    return this.locked(userId, async (tx, now) => {
      const { park, gates } = await this.context(tx, userId, now);
      lockedAction(gates(Rarity.EPIC));
      await this.market.list(tx, park.id, lineageId, price, requestId, now);
      return this.stateFor(tx, userId, now);
    });
  }

  async cancelListing(userId: string, listingId: string) {
    return this.locked(userId, async (tx, now) => {
      const { park } = await this.context(tx, userId, now);
      await this.market.cancel(tx, park.id, listingId, now);
      return this.stateFor(tx, userId, now);
    });
  }

  async buyDocument(userId: string, listingId: string) {
    return this.market.purchase(userId, listingId, async (tx, now) => {
      const { gates } = await this.context(tx, userId, now);
      lockedAction(gates(Rarity.EPIC));
      return this.stateFor(tx, userId, now);
    });
  }

  async collectProceeds(userId: string) {
    return this.locked(userId, async (tx, now) => {
      const { id } = await tx.park.findUniqueOrThrow({
        where: { userId },
        select: { id: true },
      });
      await this.market.collect(tx, userId, id, now);
      return this.stateFor(tx, userId, now);
    });
  }

  async artwork(id: string) {
    const result = await this.prisma.experimentalHybridLineage.findFirst({
      where: { id, artworkState: 'ready', discoveredBy: { not: null } },
      select: { artwork: true },
    });
    if (!result?.artwork) throw new NotFoundException('공룡 외형을 찾을 수 없어요.');
    return result.artwork;
  }
}
