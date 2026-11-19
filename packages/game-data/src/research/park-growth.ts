import type { ParkGrowthGoalId } from '@dino-park/shared';

export const PARK_LEVEL_SIX_GROWTH = {
  startsAtLevel: 5,
  targetLevel: 6,
  rewardXp: 897,
  paidVisitorTarget: 100,
  goalIds: ['facility', 'research', 'field', 'operation'] satisfies ParkGrowthGoalId[],
} as const;

export const ENTRANCE_RESEARCH = {
  technologyId: 'ops-entry',
  level: 1,
  labLevel: 1,
  costs: { gold: 500, wood: 5, stone: 5 },
  durationSeconds: 60,
  bonusPercent: 4,
} as const;
