import {
  ENTRANCE_RESEARCH,
  ENVIRONMENT_ADAPTATION_RESEARCH,
  FIELD_MAPPING_RESEARCH,
  GOLD_VAULT_ID,
  getResearchFacilityUpgrade,
  getTechnology,
  RESEARCH_LAB_ID,
  RESEARCH_STORAGE_ID,
  SCOUT_MISSIONS,
  TECHNOLOGY_RESEARCH_POLICY,
  type TechnologyDefinition,
} from '@dino-park/game-data';
import type { ResearchCosts, ResearchPrerequisite, ResearchRankQuote } from '@dino-park/shared';
import type { ParkTechnologyResearch } from '@prisma/client';

export const RESEARCHER_CAPACITY = TECHNOLOGY_RESEARCH_POLICY.defaultResearcherCount;
export const RESEARCH_FACILITY_IDS = [RESEARCH_LAB_ID, GOLD_VAULT_ID, RESEARCH_STORAGE_ID] as const;
export const RESEARCH_MATERIALS = ['wood', 'stone', 'metal'] as const;

const growthResearch = new Map<
  string,
  {
    plan: { costs: Omit<ResearchCosts, 'metal'>; durationSeconds: number };
    parkLevel: number;
  }
>([
  [ENTRANCE_RESEARCH.technologyId, { plan: ENTRANCE_RESEARCH, parkLevel: 0 }],
  [
    ENVIRONMENT_ADAPTATION_RESEARCH.technologyId,
    { plan: ENVIRONMENT_ADAPTATION_RESEARCH, parkLevel: 6 },
  ],
  [FIELD_MAPPING_RESEARCH.technologyId, { plan: FIELD_MAPPING_RESEARCH, parkLevel: 7 }],
]);
const supported = new Map<string, number>();

function includePrerequisites(id: string, level: number) {
  if (level <= (supported.get(id) ?? 0)) return;
  supported.set(id, level);
  for (const prerequisite of getTechnology(id)?.prerequisites ?? [])
    includePrerequisites(prerequisite.technologyId, prerequisite.level);
}

for (const id of growthResearch.keys()) includePrerequisites(id, 1);
includePrerequisites(ENTRANCE_RESEARCH.technologyId, 2);
includePrerequisites(ENVIRONMENT_ADAPTATION_RESEARCH.technologyId, 3);
includePrerequisites('care-marine', 1);
includePrerequisites('ops-engineering', 3);
includePrerequisites('gene-study-budget', 5);
includePrerequisites('gene-study-protocol', 5);
for (const { gate } of SCOUT_MISSIONS)
  if (gate?.research) includePrerequisites(gate.research.id, gate.research.level);

export function isConnectedResearch(id: string, level = 1) {
  return level <= (supported.get(id) ?? 0);
}

export function completedTechnologyLevels(
  rows: readonly Pick<ParkTechnologyResearch, 'technologyId' | 'level' | 'completesAt'>[],
  now: Date,
) {
  const completed = new Map<string, number>();
  for (const row of rows) {
    if (row.completesAt <= now)
      completed.set(row.technologyId, Math.max(row.level, completed.get(row.technologyId) ?? 0));
  }
  return completed;
}

export function describePrerequisite(
  prerequisite: { technologyId: string; level: number },
  completed: ReadonlyMap<string, number>,
): ResearchPrerequisite {
  return {
    ...prerequisite,
    name: getTechnology(prerequisite.technologyId)?.name ?? prerequisite.technologyId,
    completedLevel: completed.get(prerequisite.technologyId) ?? 0,
  };
}

export function missingFunds(
  cost: ResearchCosts,
  gold: number,
  stock: Omit<ResearchCosts, 'gold'>,
  goldCapacity: number,
  materialCapacity: number,
) {
  if (gold < cost.gold) {
    if (cost.gold > goldCapacity)
      return `파크 금고를 강화해 ${cost.gold.toLocaleString('ko-KR')}골드를 보관하세요.`;
    return '골드가 부족해요.';
  }
  const material = RESEARCH_MATERIALS.find((item) => stock[item] < cost[item]);
  if (!material) return undefined;
  const names = { wood: '목재', stone: '석재', metal: '금속' };
  const name = names[material];
  return cost[material] > materialCapacity
    ? `창고를 강화해 ${name} ${cost[material]}개를 보관하세요.`
    : `${name}가 부족해요.`;
}

type ResearchQuoteContext = {
  parkLevel: number;
  labLevel: number;
  firstHero: boolean;
  completed: ReadonlyMap<string, number>;
  activeJobs: number;
  gold: number;
  goldCapacity: number;
  capacityPerMaterial: number;
  stock: Omit<ResearchCosts, 'gold'>;
};

export function quoteResearchRank(
  technology: TechnologyDefinition,
  rank: TechnologyDefinition['ranks'][number],
  context: ResearchQuoteContext,
): ResearchRankQuote {
  const earlyPlan = rank.level === 1 ? growthResearch.get(technology.id) : undefined;
  const afterFirstHero = earlyPlan ? earlyPlan.parkLevel > 0 : rank.afterFirstHero;
  const labDiscount = getResearchFacilityUpgrade(RESEARCH_LAB_ID, context.labLevel)?.effect ?? 0;
  const budgetReduction =
    TECHNOLOGY_RESEARCH_POLICY.budgetPercent[
      (context.completed.get('gene-study-budget') ?? 0) - 1
    ] ?? 0;
  const procedureReduction =
    TECHNOLOGY_RESEARCH_POLICY.protocolPercent[
      (context.completed.get('gene-study-protocol') ?? 0) - 1
    ] ?? 0;
  const durationSeconds =
    earlyPlan?.plan.durationSeconds ??
    Math.max(
      rank.minimumDurationSeconds,
      Math.ceil((rank.durationSeconds * (100 - labDiscount) * (100 - procedureReduction)) / 10_000),
    );
  const costs = earlyPlan
    ? { ...earlyPlan.plan.costs, metal: 0 }
    : { ...rank.costs, gold: Math.ceil((rank.costs.gold * (100 - budgetReduction)) / 100) };
  const missingPrerequisite = technology.prerequisites.find(
    ({ technologyId, level }) => (context.completed.get(technologyId) ?? 0) < level,
  );

  let unavailableReason: string | undefined;
  if (!isConnectedResearch(technology.id, rank.level))
    unavailableReason = '아직 적용되지 않은 연구 단계예요.';
  else if (earlyPlan && context.parkLevel < earlyPlan.parkLevel)
    unavailableReason = `파크 Lv.${earlyPlan.parkLevel}에 도달하세요.`;
  else if (afterFirstHero && !context.firstHero)
    unavailableReason = '첫 스테고케라톱스를 수령하세요.';
  else if (context.labLevel < rank.labLevel)
    unavailableReason = `DNA 연구소 Lv.${rank.labLevel}을 완공하세요.`;
  else if (missingPrerequisite) {
    const prerequisite = describePrerequisite(missingPrerequisite, context.completed);
    unavailableReason = `${prerequisite.name} Lv.${prerequisite.level} 연구를 먼저 완료하세요.`;
  } else if (context.activeJobs >= RESEARCHER_CAPACITY)
    unavailableReason = '다른 연구가 진행 중이에요.';
  else
    unavailableReason = missingFunds(
      costs,
      context.gold,
      context.stock,
      context.goldCapacity,
      context.capacityPerMaterial,
    );
  return {
    level: rank.level,
    labLevel: rank.labLevel,
    costs,
    durationSeconds,
    minimumDurationSeconds: earlyPlan ? 0 : rank.minimumDurationSeconds,
    afterFirstHero,
    ...(unavailableReason ? { unavailableReason } : {}),
  };
}
