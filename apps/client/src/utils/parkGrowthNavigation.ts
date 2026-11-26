import type { ParkGrowthStage, ParkMidgameGrowthStage } from '@dino-park/shared';

export const LAST_PARK_GROWTH_STAGE = 14;

export function isMidgameGrowthStage(stage: ParkGrowthStage): stage is ParkMidgameGrowthStage {
  return stage >= 8;
}

export function parseParkGrowthStage(value: string | null): ParkGrowthStage | undefined {
  const stage = Number(value);
  return Number.isInteger(stage) && stage >= 5 && stage <= LAST_PARK_GROWTH_STAGE
    ? (stage as ParkGrowthStage)
    : undefined;
}

export function currentParkGrowthStage(parkLevel: number): ParkGrowthStage {
  return Math.max(5, Math.min(parkLevel, LAST_PARK_GROWTH_STAGE)) as ParkGrowthStage;
}

export function parkGrowthHref(stage?: ParkGrowthStage) {
  return stage === undefined ? '/park?panel=growth' : `/park?panel=growth&stage=${stage}`;
}

export function growthOriginParams(stage: ParkGrowthStage) {
  return new URLSearchParams({ stage: String(stage), from: 'growth' });
}

export function storyReturnHref(chapter: string, stage?: ParkGrowthStage) {
  const params = new URLSearchParams({ chapter });
  if (stage !== undefined) params.set('stage', String(stage));
  return `/story?${params}`;
}
