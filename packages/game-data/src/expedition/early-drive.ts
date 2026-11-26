import {
  MaterialQuality,
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
  PARK_LEVEL_SEVEN_DNA_MISSION_ID,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  ResearchMaterial,
  type DriveMissionId,
  type DriveMissionReward,
} from '@dino-park/shared';

type MissionData = {
  id: DriveMissionId;
  title: string;
  goldCost: number;
  reward: DriveMissionReward;
  regionId: string;
  regionName: string;
};
const PARENT_HATCH_SECONDS = 3600;
const fossilValley = { regionId: 'fossil-valley', regionName: '화석 계곡' };
const abandonedLab = { regionId: 'abandoned-lab', regionName: '폐연구소' };
const mission = (
  id: DriveMissionId,
  title: string,
  goldCost: number,
  reward: DriveMissionReward,
  place = fossilValley,
): MissionData => ({
  id,
  title,
  goldCost,
  reward,
  ...place,
});
const egg = (speciesId: string): DriveMissionReward => ({
  type: 'egg',
  speciesId,
  hatchSeconds: PARENT_HATCH_SECONDS,
});
const material = (kind: ResearchMaterial, amount: number): DriveMissionReward => ({
  type: 'material',
  material: kind,
  quality: MaterialQuality.MIDDLE,
  amount,
});

export const EARLY_DRIVE_MISSIONS = [
  mission('trike', '트리케라톱스 알 회수', 250, egg('triceratops')),
  mission('stego', '스테고사우루스 알 회수', 400, egg('stegosaurus')),
  mission('dna1', '화석 계곡 DNA 조사 1', 250, material(ResearchMaterial.DNA, 10)),
  mission('dna2', '화석 계곡 DNA 조사 2', 250, material(ResearchMaterial.DNA, 10)),
  mission('culture', '원시 습지 배양 시료', 250, material(ResearchMaterial.CULTURE, 2), {
    regionId: 'primal-swamp',
    regionName: '원시 습지',
  }),
  mission('catalyst', '버려진 연구소 촉매 회수', 400, material(ResearchMaterial.CATALYST, 1), {
    regionId: 'abandoned-lab',
    regionName: '버려진 연구소',
  }),
] as const;

// mission.abandoned-lab.basic-catalyst.v1 in the progression and balance tables.
export const PARK_LEVEL_SIX_CATALYST_MISSION = mission(
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  '폐연구소 기초 촉매 회수',
  350,
  {
    type: 'material',
    material: ResearchMaterial.CATALYST,
    quality: MaterialQuality.LOW,
    amount: 1,
  },
  abandonedLab,
);

// mission.fossil-valley.basic-dna.v1 in the progression and balance tables.
export const PARK_LEVEL_SEVEN_DNA_MISSION = mission(
  PARK_LEVEL_SEVEN_DNA_MISSION_ID,
  '화석 계곡 하급 DNA 회수',
  100,
  { type: 'material', material: ResearchMaterial.DNA, quality: MaterialQuality.LOW, amount: 3 },
);

// mission.fossil-valley.repeat-rim-survey.v1 in the progression and balance tables.
export const PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION = mission(
  PARK_LEVEL_EIGHT_REPEAT_RIM_MISSION_ID,
  '화석 계곡 재조사',
  150,
  { type: 'material', material: ResearchMaterial.DNA, quality: MaterialQuality.LOW, amount: 5 },
  { ...fossilValley, regionName: '화석 계곡 · 기슭 화석층' },
);

export const EARLY_PARENT_HATCH_XP = 800;
// Previously collected uncommon species use the established repeat egg cost.
export const EARLY_PARENT_REACQUIRE_GOLD = 1000;
