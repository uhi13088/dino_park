import {
  getBuildingById,
  getDinosaurById,
  getScoutMission,
  getTechnology,
  SECURITY_CENTER_LEVEL_ONE_STATS,
  SECURITY_CENTER_TYPE_ID,
} from '@dino-park/game-data';
import { DinosaurCategory, DinosaurSize } from '@dino-park/shared';
import type { Prisma } from '@prisma/client';
import {
  activeAt,
  admissionSnapshot,
  contains,
  dinosaurExhibitRiskPoints,
  type AdmissionWorld,
} from '../park/park-admission.logic';

export interface StoryRequirement {
  message: string;
  kind: 'research' | 'facility' | 'exploration' | 'operations';
  technologyId?: string;
  level?: number;
  facilityId?: string;
  missionId?: string;
}

const MARINE_AQUARIUM = 'habitat-marine-aquarium';
export const MARINE_STORY_RESEARCH_ID = 'care-marine';
export const MARINE_OBSERVATION_FLAG = 'story-marine-observation-v1';

type Snapshot = ReturnType<typeof admissionSnapshot>;

function securityAvailable(world: AdmissionWorld, at: number) {
  return world.buildings.some(
    (building) => building.typeId === SECURITY_CENTER_TYPE_ID && activeAt(building, at),
  );
}

function exceedsSecurity(world: AdmissionWorld, snapshot: Snapshot, at: number) {
  const visible = new Set(snapshot.exhibitedDinosaurIds);
  const required = world.dinosaurs.reduce(
    (points, dinosaur) =>
      points + (visible.has(dinosaur.id) ? dinosaurExhibitRiskPoints(dinosaur) : 0),
    0,
  );
  return (
    required > (securityAvailable(world, at) ? SECURITY_CENTER_LEVEL_ONE_STATS.riskCapacity : 0)
  );
}

function safeExhibits(world: AdmissionWorld, snapshot: Snapshot, at: number) {
  return world.buildings.flatMap((building) => {
    const exhibit = snapshot.exhibits.get(building.id);
    const capacity = getBuildingById(building.typeId)?.baseStats.capacity ?? 0;
    if (!exhibit) return [];
    const occupants = world.dinosaurs.filter(
      (dinosaur) =>
        dinosaur.isInPark &&
        dinosaur.createdAt.getTime() <= at &&
        contains(building, { x: dinosaur.positionX, y: dinosaur.positionY }),
    );
    const occupiedTiles = new Set(
      occupants.map(({ positionX, positionY }) => `${positionX},${positionY}`),
    );
    return occupants.length <= capacity &&
      occupants.length === exhibit.dinosaurIds.length &&
      occupiedTiles.size === occupants.length
      ? [{ building, occupants }]
      : [];
  });
}

export function qualifyingMarineExhibitIds(world: AdmissionWorld, snapshot: Snapshot, at: number) {
  const researchComplete = world.technologyResearch?.some(
    ({ technologyId, level = 1, completesAt }) =>
      technologyId === MARINE_STORY_RESEARCH_ID && level >= 1 && completesAt.getTime() <= at,
  );
  if (!researchComplete || !snapshot.admittingVisitors || exceedsSecurity(world, snapshot, at))
    return new Set<string>();

  return new Set(
    safeExhibits(world, snapshot, at).flatMap(({ building, occupants }) => {
      if (building.typeId !== MARINE_AQUARIUM) return [];
      const appropriate = occupants.every(({ speciesId }) => {
        const species = getDinosaurById(speciesId);
        return species?.category === DinosaurCategory.MARINE && species.size !== DinosaurSize.GIANT;
      });
      return appropriate ? [building.id] : [];
    }),
  );
}

function researchRequirement(technologyId: string, level: number): StoryRequirement {
  const name = getTechnology(technologyId)?.name ?? technologyId;
  return {
    kind: 'research',
    technologyId,
    level,
    message: `${name} Lv.${level} 연구를 완료하세요.`,
  };
}

function facilityRequirement(facilityId: string): StoryRequirement {
  const name = getBuildingById(facilityId)?.nameKo ?? facilityId;
  return { kind: 'facility', facilityId, level: 1, message: `${name} Lv.1을 완공하세요.` };
}

type Tx = Prisma.TransactionClient;

async function marineRequirement(
  tx: Tx,
  userId: string,
  now: Date,
): Promise<StoryRequirement | undefined> {
  const evidence = await tx.storyFlag.findUnique({
    where: { userId_flagId: { userId, flagId: MARINE_OBSERVATION_FLAG } },
    select: { value: true },
  });
  if (evidence?.value === true) return undefined;

  const park = await tx.park.findUnique({
    where: { userId },
    select: {
      buildings: { where: { typeId: MARINE_AQUARIUM } },
      technologyResearch: {
        where: {
          technologyId: MARINE_STORY_RESEARCH_ID,
          level: { gte: 1 },
          completesAt: { lte: now },
        },
        select: { level: true },
      },
    },
  });
  if (!park?.technologyResearch.length) return researchRequirement(MARINE_STORY_RESEARCH_ID, 1);
  if (!park.buildings.some((building) => activeAt(building, now.getTime())))
    return facilityRequirement(MARINE_AQUARIUM);
  return {
    kind: 'operations',
    message: '해양관에 호환 해양종을 전시하고, 보안센터와 관람길을 갖춘 뒤 손님을 받으세요.',
  };
}

async function investigationRequirement(
  tx: Tx,
  userId: string,
  now: Date,
  missionId: string,
): Promise<StoryRequirement | undefined> {
  const mission = getScoutMission(missionId);
  if (!mission?.gate?.research) throw new Error(`Missing story scout research: ${missionId}`);
  const { id: technologyId, level } = mission.gate.research;
  const park = await tx.park.findUnique({
    where: { userId },
    select: {
      id: true,
      technologyResearch: {
        where: { technologyId, level: { gte: level }, completesAt: { lte: now } },
        select: { level: true },
      },
    },
  });
  if (!park?.technologyResearch.length) return researchRequirement(technologyId, level);
  const report = await tx.scoutAssignment.findFirst({
    where: { scout: { parkId: park.id }, missionId, claimedAt: { not: null } },
    select: { id: true },
  });
  return report
    ? undefined
    : {
        kind: 'exploration',
        missionId,
        message: `${mission.title}에 파견한 뒤 귀환 보고서를 수령하세요.`,
      };
}

async function operationsRequirement(
  tx: Tx,
  userId: string,
  now: Date,
): Promise<StoryRequirement | undefined> {
  const park = await tx.park.findUnique({
    where: { userId },
    include: { buildings: true, dinosaurs: true },
  });
  const at = now.getTime();
  if (!park || !securityAvailable(park, at)) return facilityRequirement(SECURITY_CENTER_TYPE_ID);
  const snapshot = admissionSnapshot(park, at);
  if (!snapshot.exhibits.size || !snapshot.connectedPlatformIds.length)
    return {
      kind: 'operations',
      message: '입구에서 관람대와 공룡을 전시한 서식지까지 관람길을 이으세요.',
    };
  if (
    safeExhibits(park, snapshot, at).length < snapshot.exhibits.size ||
    exceedsSecurity(park, snapshot, at)
  )
    return { kind: 'operations', message: '현재 전시의 서식지 수용량과 보안 점수를 확인하세요.' };
  return undefined;
}

export function storySceneRequirement(tx: Tx, userId: string, sceneId: string, now = new Date()) {
  switch (sceneId) {
    case 'ch4-scene-2':
      return marineRequirement(tx, userId, now);
    case 'ch4-scene-3':
      return investigationRequirement(tx, userId, now, 'mission.primal-swamp.watermark-compare.v1');
    case 'ch5-scene-1':
    case 'ch5-scene-3':
      return operationsRequirement(tx, userId, now);
    case 'ch6-scene-1':
      return investigationRequirement(
        tx,
        userId,
        now,
        'mission.mutation-crater.thermal-pattern.v1',
      );
    default:
      return Promise.resolve(undefined);
  }
}
