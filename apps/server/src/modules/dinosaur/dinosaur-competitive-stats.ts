import type { Dinosaur } from '@prisma/client';
import { getDinosaurById } from '@dino-park/game-data';
import {
  FIRST_HYBRID_SPECIES_ID,
  STEGO_BASE_COMPETITIVE_STATS,
  type DinosaurCompetitiveStats,
} from '@dino-park/shared';

type OwnDinosaur = Pick<Dinosaur, 'speciesId' | 'competitiveStats'>;

function score(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

export function dinosaurCompetitiveStats(dinosaur: OwnDinosaur): DinosaurCompetitiveStats | null {
  const stored = dinosaur.competitiveStats;
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    const { appeal, speed, stamina, aggression } = stored;
    if (score(appeal) && score(speed) && score(stamina) && score(aggression))
      return { appeal, speed, stamina, aggression };
  }
  if (dinosaur.speciesId !== FIRST_HYBRID_SPECIES_ID) return null;
  return {
    ...STEGO_BASE_COMPETITIVE_STATS,
    appeal:
      getDinosaurById(dinosaur.speciesId)?.stats.popularity ?? STEGO_BASE_COMPETITIVE_STATS.appeal,
  };
}
