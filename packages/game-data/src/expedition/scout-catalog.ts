import {
  MaterialQuality,
  Rarity,
  ResearchMaterial,
  type ScoutMission,
  type ScoutRegion,
  type ScoutReward,
  type ScoutSpot,
} from '@dino-park/shared';
import { getDinosaurById } from '../dinosaurs';
import { FIELD_MAPPING_RESEARCH } from '../research/park-growth';
import { getTechnology } from '../research/progression';
import {
  EARLY_DRIVE_MISSIONS,
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION,
  PARK_LEVEL_SEVEN_DNA_MISSION,
  PARK_LEVEL_SIX_CATALYST_MISSION,
} from './early-drive';
import { FIRST_EXPEDITION } from './first-expedition';
import { SCOUT_LAYOUT } from './scout-layout';
import { SCOUT_MATERIAL_TARGETS, SCOUT_NATURAL_TARGETS } from './scout-target-data';

type MissionGate = NonNullable<ScoutMission['gate']>;
type MaterialItem = Extract<ScoutReward, { type: 'materials' }>['items'][number];

const MINUTE_SECONDS = 60;
const HERO_GATE: MissionGate = { firstHero: true };

function researched(id: string, level: number): MissionGate {
  const definition = getTechnology(id);
  const rank = definition?.ranks[level - 1];
  if (!definition || !rank) throw new Error(`Unknown scout technology rank: ${id}:${level}`);
  return {
    firstHero: true,
    labLevel: rank.labLevel,
    research: { id, level, name: definition.name },
  };
}

function sample(
  material: ResearchMaterial,
  quality: MaterialQuality,
  amount: number,
): MaterialItem {
  return { material, quality, amount };
}

function collection(
  id: string,
  title: string,
  seconds: number,
  gold: number,
  gate: MissionGate,
  items: MaterialItem[],
): ScoutMission {
  return { id, title, seconds, gold, gate, reward: { type: 'materials', items } };
}

type LegacyDriveMission = (typeof EARLY_DRIVE_MISSIONS)[number];

function legacyDispatch(
  mission: LegacyDriveMission,
  minutes: number,
  gate: MissionGate,
): ScoutMission {
  const { id, title, reward, goldCost } = mission;
  return {
    id,
    legacyMissionId: id,
    title,
    seconds: minutes * MINUTE_SECONDS,
    gold: goldCost,
    reward:
      reward.type === 'egg'
        ? reward
        : { type: 'materials', items: [sample(reward.material, reward.quality, reward.amount)] },
    gate,
  };
}

const EARLY_GATES: Record<string, { minutes: number; gate: MissionGate }> = {
  trike: {
    minutes: 20,
    gate: { iguanodon: true, once: true, noDuplicateEgg: true },
  },
  stego: {
    minutes: 25,
    gate: { iguanodon: true, once: true, noDuplicateEgg: true },
  },
  dna1: {
    minutes: 15,
    gate: { iguanodon: true, safety: true, afterExhibitionToRepeat: true },
  },
  dna2: {
    minutes: 15,
    gate: { iguanodon: true, safety: true, claimed: ['dna1'], afterExhibitionToRepeat: true },
  },
  culture: {
    minutes: 20,
    gate: { iguanodon: true, safety: true, afterExhibitionToRepeat: true },
  },
  catalyst: {
    minutes: 25,
    gate: {
      iguanodon: true,
      safety: true,
      claimed: ['dna2', 'culture'],
      afterExhibitionToRepeat: true,
    },
  },
};

// Legacy IDs preserve claim history as well as park and synthesis progression.
const LEGACY_MISSIONS: ScoutMission[] = [
  {
    id: FIRST_EXPEDITION.id,
    legacyMissionId: FIRST_EXPEDITION.id,
    title: FIRST_EXPEDITION.name,
    seconds: 3 * MINUTE_SECONDS,
    gold: FIRST_EXPEDITION.goldCost,
    reward: {
      type: 'egg',
      speciesId: FIRST_EXPEDITION.speciesId,
      hatchSeconds: FIRST_EXPEDITION.hatchSeconds,
    },
    gate: { platform: true, once: true, noDuplicateEgg: true },
  },
  ...EARLY_DRIVE_MISSIONS.map((mission) => {
    const { minutes, gate } = EARLY_GATES[mission.id];
    return legacyDispatch(mission, minutes, gate);
  }),
  legacyDispatch(PARK_LEVEL_SIX_CATALYST_MISSION, 15, { firstHero: true, parkLevel: 5 }),
  legacyDispatch(PARK_LEVEL_SEVEN_DNA_MISSION, 15, { firstHero: true, parkLevel: 5 }),
  legacyDispatch(PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION, 20, {
    ...researched(FIELD_MAPPING_RESEARCH.technologyId, FIELD_MAPPING_RESEARCH.level),
    parkLevel: 5,
  }),
];

const NATURAL_EGG_GOLD: Record<Rarity, number> = {
  [Rarity.COMMON]: 500,
  [Rarity.UNCOMMON]: 1000,
  [Rarity.RARE]: 2000,
  [Rarity.EPIC]: 4000,
  [Rarity.LEGENDARY]: 6000,
};
const NATURAL_DISPATCH_MINUTES: Record<Rarity, number> = {
  [Rarity.COMMON]: 20,
  [Rarity.UNCOMMON]: 40,
  [Rarity.RARE]: 70,
  [Rarity.EPIC]: 100,
  [Rarity.LEGENDARY]: 140,
};

function naturalEgg(id: string, speciesId: string, gate: MissionGate): ScoutMission {
  const species = getDinosaurById(speciesId);
  if (!species) throw new Error(`Scout egg target has no catalog species: ${speciesId}`);
  return {
    id,
    title: `${species.nameKo} 알 회수`,
    seconds: NATURAL_DISPATCH_MINUTES[species.rarity] * MINUTE_SECONDS,
    gold: NATURAL_EGG_GOLD[species.rarity],
    reward: { type: 'egg', speciesId, hatchSeconds: species.hatchTime / 1000 },
    gate,
  };
}

const EGG_MISSIONS = [
  naturalEgg('first-target-velociraptor', 'velociraptor', {
    safety: true,
    once: true,
    noDuplicateEgg: true,
  }),
  ...['parasaurolophus', 'iguanodon', 'triceratops', 'stegosaurus', 'velociraptor'].map(
    (speciesId) =>
      naturalEgg(`return-target-${speciesId}`, speciesId, {
        registered: speciesId,
        noDuplicateEgg: true,
      }),
  ),
  ...SCOUT_NATURAL_TARGETS.map(([id, speciesId, technologyId, level]) =>
    naturalEgg(id, speciesId, researched(technologyId, level)),
  ),
];

const RESEARCH_MISSION_MINUTES: Partial<Record<string, number>> = {
  'exp-apex-tracking': 110,
  'exp-deep-expedition': 90,
  'exp-evidence-validation': 65,
  'exp-field-mapping': 20,
  'exp-frontier-routes': 35,
  'exp-highgrade-sampling': 85,
  'exp-quality-survey': 45,
};

const MATERIAL_MISSIONS = [
  ...SCOUT_MATERIAL_TARGETS.map(
    ([id, title, technologyId, level, material, quality, amount, gold]) =>
      collection(
        id,
        title,
        (RESEARCH_MISSION_MINUTES[technologyId] ?? 25 + 10 * level) * MINUTE_SECONDS,
        gold,
        researched(technologyId, level),
        [sample(material, quality, amount)],
      ),
  ),
  collection(
    'mission.primal-swamp.basic-culture.v1',
    '수로 초입 배양액 채집',
    15 * MINUTE_SECONDS,
    150,
    HERO_GATE,
    [sample(ResearchMaterial.CULTURE, MaterialQuality.LOW, 1)],
  ),
  collection(
    'mission.mineral-cave.basic-stabilizer.v1',
    '갱도 입구 안정제 채집',
    20 * MINUTE_SECONDS,
    250,
    HERO_GATE,
    [sample(ResearchMaterial.STABILIZER, MaterialQuality.LOW, 1)],
  ),
  collection(
    'mission.mutation-crater.basic-mutation-cell.v1',
    '외곽 온천 변이세포 채집',
    25 * MINUTE_SECONDS,
    450,
    { ...researched('gene-analysis', 2), parkLevel: 15 },
    [sample(ResearchMaterial.MUTATION_CELL, MaterialQuality.MIDDLE, 1)],
  ),
  collection(
    'mission.mineral-cave.crystal-core.v1',
    '붕락 너머 결정핵 채집',
    120 * MINUTE_SECONDS,
    1150,
    { ...researched('exp-deep-expedition', 2), responseLevel: 2 },
    [
      sample(ResearchMaterial.STABILIZER, MaterialQuality.HIGH, 1),
      sample(ResearchMaterial.STABILIZER, MaterialQuality.MIDDLE, 1),
    ],
  ),
  collection(
    'mission.mutation-crater.welded-rock-core.v1',
    '용결암 시추 표본 회수',
    150 * MINUTE_SECONDS,
    1250,
    { ...researched('exp-deep-expedition', 3), responseLevel: 3 },
    [
      sample(ResearchMaterial.MUTATION_CELL, MaterialQuality.HIGH, 1),
      sample(ResearchMaterial.MUTATION_CELL, MaterialQuality.MIDDLE, 1),
    ],
  ),
];

export const SCOUT_MISSIONS: readonly ScoutMission[] = [
  ...LEGACY_MISSIONS,
  ...EGG_MISSIONS,
  ...MATERIAL_MISSIONS,
];

export const SCOUT_REGIONS: readonly ScoutRegion[] = SCOUT_LAYOUT.map(
  ({ id, name, kind, spots }) => ({
    id,
    name,
    type: kind,
    spots: spots.map(([spotId, spotName, stars, missionIds]) => ({
      id: spotId,
      name: spotName,
      stars,
      missionIds,
    })),
  }),
);

const missionsById = new Map(SCOUT_MISSIONS.map((mission) => [mission.id, mission]));
const spotsById = new Map(
  SCOUT_REGIONS.flatMap(({ spots }) => spots.map((spot) => [spot.id, spot])),
);
const deepSeaSpotIds = new Set(
  SCOUT_REGIONS.find(({ id }) => id === 'deep-sea')?.spots.map(({ id }) => id),
);

export function getScoutMission(id: string): ScoutMission | undefined {
  return missionsById.get(id);
}

export function getScoutSpot(id: string): ScoutSpot | undefined {
  return spotsById.get(id);
}

export function getScoutFuelCost(spotId: string, missionId: string): number {
  const mission = getScoutMission(missionId);
  if (!mission || !getScoutSpot(spotId)?.missionIds.includes(missionId)) return 0;
  if (mission.gate?.research?.id === 'exp-deep-expedition') return 10;
  return deepSeaSpotIds.has(spotId) ? 5 : 0;
}
