import {
  ENERGY_PER_EXPLORATION,
  MaterialQuality,
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  ResearchMaterial,
  type DriveExpeditionMission,
  type DriveMissionReward,
} from '@dino-park/shared';

type MissionData = Omit<DriveExpeditionMission, 'status' | 'repeatable' | 'requirement' | 'egg'>;
const PARENT_HATCH_SECONDS = 3600;
const fossilValley = { regionId: 'fossil-valley', regionName: '화석 계곡' };
const abandonedLab = { regionId: 'abandoned-lab', regionName: '폐연구소' };
const mission = (
  id: MissionData['id'],
  title: string,
  goldCost: number,
  target: number,
  reward: DriveMissionReward,
  place = fossilValley,
): MissionData => ({
  id,
  title,
  goldCost,
  target,
  reward,
  ...place,
  energyCost: ENERGY_PER_EXPLORATION,
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
  mission('trike', '트리케라톱스 알 회수', 250, 10, egg('triceratops')),
  mission('stego', '스테고사우루스 알 회수', 400, 11, egg('stegosaurus')),
  mission('dna1', '화석 계곡 DNA 조사 1', 250, 11, material(ResearchMaterial.DNA, 10)),
  mission('dna2', '화석 계곡 DNA 조사 2', 250, 12, material(ResearchMaterial.DNA, 10)),
  mission('culture', '원시 습지 배양 시료', 250, 12, material(ResearchMaterial.CULTURE, 2), {
    regionId: 'primal-swamp',
    regionName: '원시 습지',
  }),
  mission('catalyst', '버려진 연구소 촉매 회수', 400, 13, material(ResearchMaterial.CATALYST, 1), {
    regionId: 'abandoned-lab',
    regionName: '버려진 연구소',
  }),
] as const;

// mission.abandoned-lab.basic-catalyst.v1 in the progression and balance tables.
export const PARK_LEVEL_SIX_CATALYST_MISSION = mission(
  PARK_LEVEL_SIX_CATALYST_MISSION_ID,
  '폐연구소 기초 촉매 회수',
  350,
  8,
  {
    type: 'material',
    material: ResearchMaterial.CATALYST,
    quality: MaterialQuality.LOW,
    amount: 1,
  },
  abandonedLab,
);

export const EARLY_PARENT_HATCH_XP = 800;
// Previously collected uncommon species use the established repeat egg cost.
export const EARLY_PARENT_REACQUIRE_GOLD = 1000;
