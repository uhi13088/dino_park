import { randomUUID } from 'node:crypto';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { getDinosaurById } from '@dino-park/game-data';
import type {
  DinosaurSpecies,
  ExperimentalHybridTier,
  RepeatSynthesisFocus,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ExperimentalHybridArtService,
  ExperimentalHybridProviderError,
} from './experimental-hybrid-art.service';

const MAX_ATTEMPTS = 3;
const LEASE_MS = 5 * 60 * 1000;
const POLL_MS = 5000;

@Injectable()
export class ExperimentalHybridArtWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExperimentalHybridArtWorker.name);
  private timer?: NodeJS.Timeout;
  private active?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly artist: ExperimentalHybridArtService,
  ) {}

  onModuleInit() {
    if (!this.artist.enabled) return;
    this.timer = setInterval(() => this.wake(), POLL_MS);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.active;
  }

  wake() {
    if (this.active || !this.artist.enabled) return;
    this.active = this.work()
      .catch(() => this.logger.warn('하이브리드 외형 작업을 다음 주기에 다시 확인합니다.'))
      .finally(() => {
        this.active = undefined;
      });
  }

  private async work() {
    const now = new Date();
    await this.prisma.experimentalHybridLineage.updateMany({
      where: {
        artworkState: 'running',
        artworkLease: { lte: now },
        artworkAttempts: { gte: MAX_ATTEMPTS },
      },
      data: { artworkState: 'failed', artworkLease: null, artworkToken: null },
    });
    const available = {
      artworkAttempts: { lt: MAX_ATTEMPTS },
      OR: [
        {
          artworkState: 'queued',
          OR: [{ artworkLease: null }, { artworkLease: { lte: now } }],
        },
        { artworkState: 'running', artworkLease: { lte: now } },
      ],
    };
    const candidate = await this.prisma.experimentalHybridLineage.findFirst({
      where: available,
      select: { id: true, species: true, parentSpeciesIds: true, focus: true, tier: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    if (!candidate) return;
    const token = randomUUID();
    const reserved = await this.prisma.experimentalHybridLineage.updateMany({
      where: { id: candidate.id, ...available },
      data: {
        artworkState: 'running',
        artworkToken: token,
        artworkAttempts: { increment: 1 },
        artworkLease: new Date(now.getTime() + LEASE_MS),
      },
    });
    if (!reserved.count) return;
    const where = { id: candidate.id, artworkToken: token, artworkState: 'running' };
    try {
      const species = candidate.species as unknown as DinosaurSpecies;
      const artwork = await this.artist.generate({
        lineageId: candidate.id,
        name: species.nameKo,
        parentNames: candidate.parentSpeciesIds.map((id) => getDinosaurById(id)?.nameKo ?? id),
        focus: candidate.focus as RepeatSynthesisFocus,
        size: species.size,
        tier: candidate.tier as ExperimentalHybridTier,
      });
      await this.prisma.experimentalHybridLineage.updateMany({
        where,
        data: { artwork, artworkState: 'ready', artworkToken: null, artworkLease: null },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown artwork error';
      this.logger.warn(`하이브리드 외형 생성에 실패했습니다 (${candidate.id}): ${reason}`);
      const attempted = await this.prisma.experimentalHybridLineage.findFirst({
        where,
        select: { artworkAttempts: true },
      });
      if (!attempted) return;
      const retry =
        attempted.artworkAttempts < MAX_ATTEMPTS &&
        (!(error instanceof ExperimentalHybridProviderError) || error.retryable);
      await this.prisma.experimentalHybridLineage.updateMany({
        where,
        data: {
          artworkState: retry ? 'queued' : 'failed',
          artworkToken: null,
          artworkLease: retry
            ? new Date(Date.now() + POLL_MS * 2 ** attempted.artworkAttempts)
            : null,
        },
      });
    }
  }
}
