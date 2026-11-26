import {
  getDinosaurById,
  getScoutMission,
  getTechnology,
  growthFacilityHasCompletedLevel,
  PARK_MIDGAME_GROWTH,
} from '@dino-park/game-data';
import {
  getParkLevelExperience,
  MaterialQuality,
  type ParkGrowthAlternativeView,
  type ParkGrowthCondition,
  type ParkMidgameGrowthDefinition,
  type ParkMidgameGrowthResponse,
} from '@dino-park/shared';
import type { Building, Prisma } from '@prisma/client';
import { completedTechnologyLevels, isConnectedResearch } from '../research/technology-progress';

type Tx = Prisma.TransactionClient;
type Facility = Extract<ParkGrowthCondition, { kind: 'building' }>;

const facilities = PARK_MIDGAME_GROWTH.flatMap(({ goals }) =>
  goals.flatMap(({ alternatives }) =>
    alternatives.filter((item): item is Facility => item.kind === 'building'),
  ),
);
const playableFacilities = new Set([
  'research-dna-lab',
  'production-warehouse',
  'visitor-viewing-platform',
]);
const facilityFlagId = ({ typeId, level }: Facility) =>
  `park-growth-completed-${typeId}-${level}-v1`;

export async function retainDemolishedGrowthFacility(
  tx: Tx,
  userId: string,
  building: Pick<Building, 'typeId' | 'status' | 'level'>,
) {
  const flagIds = new Set(
    facilities
      .filter(
        ({ typeId, level }) =>
          typeId === building.typeId && growthFacilityHasCompletedLevel(building, level),
      )
      .map(facilityFlagId),
  );
  if (flagIds.size)
    await tx.storyFlag.createMany({
      data: [...flagIds].map((flagId) => ({ userId, flagId, value: true })),
      skipDuplicates: true,
    });
}

function isRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesDispatchReward(
  condition: Extract<ParkGrowthCondition, { kind: 'dispatch' }>,
  actual: Prisma.JsonValue,
) {
  const expected = getScoutMission(condition.missionId)?.reward;
  if (!expected || !isRecord(actual)) return false;
  if (condition.reward === 'egg') {
    return (
      expected.type === 'egg' && actual.type === 'egg' && actual.speciesId === expected.speciesId
    );
  }
  if (expected.type !== 'materials' || actual.type !== 'materials' || !Array.isArray(actual.items))
    return false;
  const qualifyingItems = expected.items.filter(({ quality }) => quality === MaterialQuality.LOW);
  const receivedItems = actual.items.filter(isRecord);
  return qualifyingItems.some(({ material, quality }) =>
    receivedItems.some(
      (item) =>
        item.material === material &&
        item.quality === quality &&
        typeof item.amount === 'number' &&
        item.amount > 0,
    ),
  );
}

export async function readParkMidgameGrowth(
  tx: Tx,
  userId: string,
  now: Date,
  definition: ParkMidgameGrowthDefinition,
  receiptId: (goalId: string) => string,
) {
  const conditions = definition.goals.flatMap(({ alternatives }) => alternatives);
  const stageFacilities = conditions.filter(
    (condition): condition is Facility => condition.kind === 'building',
  );
  const missions = conditions.flatMap((condition) =>
    condition.kind === 'dispatch' ? [condition.missionId] : [],
  );
  const species = conditions.flatMap((condition) =>
    condition.kind === 'owned' ? [condition.speciesId] : [],
  );
  const technologies = conditions.flatMap((condition) =>
    condition.kind === 'research' ? [condition.technologyId] : [],
  );
  const park = await tx.park.findUniqueOrThrow({
    where: { userId },
    select: {
      id: true,
      level: true,
      exp: true,
      totalVisitors: true,
      firstSynthesis: { select: { claimedAt: true } },
      growthClaims: {
        where: { goalId: { in: definition.goals.map(({ id }) => receiptId(id)) } },
        select: { goalId: true },
      },
      buildings: {
        where: { typeId: { in: stageFacilities.map(({ typeId }) => typeId) } },
        select: { typeId: true, status: true, level: true },
      },
      technologyResearch: {
        where: { technologyId: { in: technologies }, completesAt: { lte: now } },
        select: { technologyId: true, level: true, completesAt: true },
      },
      dinosaurs: { where: { speciesId: { in: species } }, select: { speciesId: true } },
      dinosaurCollections: { where: { speciesId: { in: species } }, select: { speciesId: true } },
    },
  });
  const [facilityHistory, assignments] = await Promise.all([
    tx.storyFlag.findMany({
      where: {
        userId,
        flagId: { in: stageFacilities.map(facilityFlagId) },
        value: { equals: true },
      },
      select: { flagId: true },
    }),
    missions.length
      ? tx.scoutAssignment.findMany({
          where: {
            scout: { parkId: park.id },
            missionId: { in: missions },
            claimedAt: { lte: now },
          },
          select: { missionId: true, reward: true },
        })
      : [],
  ]);
  const unlocked = park.level >= definition.stage && !!park.firstSynthesis?.claimedAt;
  const ownedSpecies = new Set(
    [...park.dinosaurs, ...park.dinosaurCollections].map(({ speciesId }) => speciesId),
  );
  const completedResearch = completedTechnologyLevels(park.technologyResearch, now);
  const receipts = new Set(park.growthClaims.map(({ goalId }) => goalId));

  function describe(condition: ParkGrowthCondition): ParkGrowthAlternativeView {
    const view = (
      label: string,
      complete: boolean,
      available = true,
    ): ParkGrowthAlternativeView => ({
      ...condition,
      label,
      status: complete ? 'complete' : available ? 'incomplete' : 'unavailable',
    });
    switch (condition.kind) {
      case 'building':
        return view(
          `${condition.name} Lv.${condition.level} 완공`,
          park.buildings.some(
            (building) =>
              building.typeId === condition.typeId &&
              growthFacilityHasCompletedLevel(building, condition.level),
          ) || facilityHistory.some(({ flagId }) => flagId === facilityFlagId(condition)),
          playableFacilities.has(condition.typeId),
        );
      case 'research':
        return view(
          `${getTechnology(condition.technologyId)?.name ?? condition.technologyId} Lv.${condition.level} 완료`,
          (completedResearch.get(condition.technologyId) ?? 0) >= condition.level,
          isConnectedResearch(condition.technologyId, condition.level),
        );
      case 'dispatch': {
        const mission = getScoutMission(condition.missionId);
        return view(
          `${mission?.title ?? condition.missionId} 보상 수령`,
          assignments.some(
            ({ missionId, reward }) =>
              missionId === condition.missionId && matchesDispatchReward(condition, reward),
          ),
          !!mission,
        );
      }
      case 'owned':
        return view(
          `${getDinosaurById(condition.speciesId)?.nameKo ?? condition.speciesId} 개체 수령`,
          ownedSpecies.has(condition.speciesId),
          !!getDinosaurById(condition.speciesId),
        );
      case 'paid':
        return view(
          `누적 유료 입장 ${condition.amount.toLocaleString('ko-KR')}명`,
          park.totalVisitors >= condition.amount,
        );
    }
  }

  const state: ParkMidgameGrowthResponse = {
    stage: definition.stage,
    unlocked,
    level: park.level,
    exp: park.exp,
    expForNextLevel: getParkLevelExperience(park.level),
    targetLevel: definition.targetLevel,
    goals: definition.goals.map(({ id, rewardXp, alternatives: conditions }) => {
      const alternatives = conditions.map(describe);
      const complete = alternatives.some(({ status }) => status === 'complete');
      const paid = conditions.find(
        (condition): condition is Extract<ParkGrowthCondition, { kind: 'paid' }> =>
          condition.kind === 'paid',
      );
      const target = paid?.amount ?? 1;
      return {
        id,
        xp: rewardXp,
        progress: paid ? Math.min(park.totalVisitors, target) : Number(complete),
        target,
        status: receipts.has(receiptId(id))
          ? 'claimed'
          : !unlocked
            ? 'locked'
            : complete
              ? 'claimable'
              : 'incomplete',
        alternatives,
      };
    }),
  };
  return { park, state };
}
