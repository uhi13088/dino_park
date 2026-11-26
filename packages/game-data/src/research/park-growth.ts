import type { ParkGrowthGoalId, ParkMidgameGrowthDefinition } from '@dino-park/shared';
import generatedGrowth from './park-growth.generated.json';
import { getTechnology, TECHNOLOGY_RESEARCH_POLICY } from './progression';

export const PARK_MIDGAME_GROWTH: readonly ParkMidgameGrowthDefinition[] =
  generatedGrowth as ParkMidgameGrowthDefinition[];

export function getParkMidgameGrowth(stage: number): ParkMidgameGrowthDefinition | undefined {
  return PARK_MIDGAME_GROWTH.find((definition) => definition.stage === stage);
}

function firstGrowthResearch(technologyId: string) {
  const rank = getTechnology(technologyId)?.ranks[0];
  if (!rank) throw new Error(`Missing growth research: ${technologyId}`);
  const { labLevel, durationSeconds, costs } = rank;
  const { gold, wood, stone } = costs;
  return { labLevel, durationSeconds, costs: { gold, wood, stone } };
}

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
  ...firstGrowthResearch('ops-entry'),
  bonusPercent: TECHNOLOGY_RESEARCH_POLICY.entryBonusPercent[0],
} as const;

export const PARK_LEVEL_SEVEN_GROWTH = {
  startsAtLevel: 6,
  targetLevel: 7,
  rewardXp: { facility: 1257, research: 1257, field: 1257, operation: 1260 },
  paidVisitorTarget: 400,
  platformLevel: 2,
  completedPlatformFlagId: 'park-growth-platform-level-2-v1',
} as const;

export const PARK_GROWTH_OPERATIONS_MILESTONES = {
  6: { exhibits: 3, visitors: 50, flagId: 'park-growth-operations-6-v1' },
  7: { exhibits: 4, visitors: 70, flagId: 'park-growth-operations-7-v1' },
} as const;

export const ENVIRONMENT_ADAPTATION_RESEARCH = {
  technologyId: 'care-adaptation',
  level: 1,
  ...firstGrowthResearch('care-adaptation'),
  careDecayReductionPercent: TECHNOLOGY_RESEARCH_POLICY.careAdaptationPercent[0],
} as const;

export const PARK_LEVEL_EIGHT_GROWTH = {
  startsAtLevel: 7,
  targetLevel: 8,
  rewardXp: 1660,
  paidVisitorTarget: 900,
  completedSecurityCenterFlagId: 'park-growth-security-center-level-2-v1',
} as const;

export const FIELD_MAPPING_RESEARCH = {
  technologyId: 'exp-field-mapping',
  level: 1,
  ...firstGrowthResearch('exp-field-mapping'),
} as const;

export function growthFacilityHasCompletedLevel(
  { status, level }: { status: string; level: number },
  requiredLevel: number,
) {
  return (
    (status === 'ACTIVE' && level >= requiredLevel) ||
    (status === 'UPGRADING' && level > requiredLevel)
  );
}
