import { randomInt } from 'node:crypto';
import { FIRST_EXPEDITION, getDinosaurById } from '@dino-park/game-data';
import {
  EARLY_SYNTHESIS_SAFETY_FLAG,
  type ScoutExpeditionState,
  type ScoutMission,
  type ScoutReward,
} from '@dino-park/shared';
import type { ScoutWorld } from './scout-world';

export function scoutAbilities(experience: number) {
  const level = experience >= 15 ? 3 : experience >= 5 ? 2 : 1;
  return { searchLevel: level, mobilityLevel: level, responseLevel: level };
}

export function scoutMissionClaimed(world: ScoutWorld, mission: ScoutMission) {
  const legacyId = mission.legacyMissionId;
  return (
    world.claimed.has(mission.id) ||
    (!!legacyId && world.claimedDrives.has(legacyId)) ||
    (legacyId === FIRST_EXPEDITION.id && world.firstIguanodonRecorded)
  );
}

export function scoutMissionBlock(
  world: ScoutWorld,
  mission: ScoutMission,
  responseLevel: number,
): ScoutExpeditionState['missions'][string] | undefined {
  if (world.legacyBlocked) return { blockedReason: '완료된 기존 탐험의 보상을 먼저 수령하세요.' };
  const { gate, reward } = mission;
  const speciesId = reward.type === 'egg' ? reward.speciesId : null;
  if (speciesId && !getDinosaurById(speciesId))
    return { blockedReason: '이 공룡의 조사 목표를 준비하고 있어요.' };
  if (gate?.platform && !world.platformReady)
    return { blockedReason: '첫 관람대를 먼저 완공하세요.' };
  if (
    gate?.iguanodon &&
    !world.owned.has(FIRST_EXPEDITION.speciesId) &&
    !world.registered.has(FIRST_EXPEDITION.speciesId)
  )
    return { blockedReason: '이구아노돈을 먼저 부화하고 수령하세요.' };
  if (gate?.safety && !world.flags.has(EARLY_SYNTHESIS_SAFETY_FLAG))
    return { blockedReason: '2장 안전 목표를 먼저 완료하세요.' };
  if (gate?.firstHero && !world.park.firstSynthesis?.claimedAt)
    return { blockedReason: '첫 스테고케라톱스를 수령하세요.' };
  if (gate?.parkLevel && world.park.level < gate.parkLevel)
    return {
      blockedReason: `파크 Lv.${gate.parkLevel}부터 파견할 수 있어요.`,
      blocker: { kind: 'park', level: gate.parkLevel },
    };
  if (gate?.labLevel && world.labLevel < gate.labLevel)
    return {
      blockedReason: `DNA 연구소 Lv.${gate.labLevel}을 완공하세요.`,
      blocker: { kind: 'lab', level: gate.labLevel },
    };
  if (gate?.research && (world.research.get(gate.research.id) ?? 0) < gate.research.level)
    return {
      blockedReason: `${gate.research.name} Lv.${gate.research.level} 연구를 완료하세요.`,
      blocker: { kind: 'research', technologyId: gate.research.id, level: gate.research.level },
    };
  if (gate?.claimed?.some((id) => !world.claimed.has(id) && !world.claimedDrives.has(id)))
    return { blockedReason: '먼저 열리는 조사 목표의 보상을 수령하세요.' };
  if (
    gate?.registered &&
    !world.registered.has(gate.registered) &&
    !world.owned.has(gate.registered)
  )
    return { blockedReason: '이 공룡을 먼저 도감에 등록하세요.' };

  const claimed = scoutMissionClaimed(world, mission);
  if (gate?.once && (claimed || (speciesId && world.registered.has(speciesId))))
    return { blockedReason: '최초 조사 보상은 이미 수령했어요.' };
  if (gate?.afterExhibitionToRepeat && claimed && !world.park.firstSynthesis?.exhibitedAt)
    return { blockedReason: '첫 스테고케라톱스를 전시하면 이 조사를 다시 파견할 수 있어요.' };
  if (gate?.noDuplicateEgg && speciesId) {
    if (world.owned.has(speciesId) || world.eggs.some((egg) => egg.speciesId === speciesId))
      return { blockedReason: '이미 이 종의 공룡이나 알을 보유하고 있어요.' };
    if (
      world.assignments.some((assignment) => {
        const pending = assignment.reward as ScoutReward;
        return pending.type === 'egg' && pending.speciesId === speciesId;
      })
    )
      return { blockedReason: '이미 이 종의 알을 조사하고 있어요.' };
  }
  if (
    (gate?.once || (gate?.afterExhibitionToRepeat && !claimed)) &&
    world.assignments.some((assignment) => assignment.missionId === mission.id)
  )
    return { blockedReason: '이 조사의 보고서를 기다리는 중이에요.' };
  if (gate?.responseLevel && responseLevel < gate.responseLevel)
    return { blockedReason: `탐험 대응력 Lv.${gate.responseLevel}인 탐험가가 필요해요.` };
  return undefined;
}

export function scoutRewardForDispatch(
  world: ScoutWorld,
  mission: ScoutMission,
  searchLevel: number,
) {
  const { reward } = mission;
  if (
    reward.type !== 'materials' ||
    reward.items.length !== 1 ||
    mission.gate?.once ||
    searchLevel === 1 ||
    !scoutMissionClaimed(world, mission)
  )
    return reward;

  const chance = searchLevel === 3 ? 30 : 15;
  if (randomInt(100) >= chance) return reward;
  const item = reward.items[0];
  return { ...reward, items: [{ ...item, amount: item.amount + 1 }] };
}
