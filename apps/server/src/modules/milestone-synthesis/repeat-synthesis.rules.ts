import { randomInt } from 'node:crypto';
import {
  REPEAT_SYNTHESIS_FOCI,
  type DinosaurCompetitiveStats,
  type RepeatStatOutcome,
  type RepeatSynthesisFocus,
  type RepeatSynthesisFocusOption,
} from '@dino-park/shared';

const ODDS = [25, 50, 25];

function outcomes(...values: [number, number, number]): RepeatStatOutcome[] {
  return values.map((value, index) => ({ value, chance: ODDS[index] }));
}

const FOCI: Record<RepeatSynthesisFocus, RepeatSynthesisFocusOption> = {
  audience: {
    id: 'audience',
    label: '관람형',
    outcomes: {
      appeal: outcomes(28, 33, 38),
      speed: outcomes(57, 62, 67),
      stamina: outcomes(60, 65, 70),
      aggression: outcomes(35, 40, 45),
    },
  },
  sprint: {
    id: 'sprint',
    label: '질주형',
    outcomes: {
      appeal: outcomes(18, 22, 26),
      speed: outcomes(74, 79, 84),
      stamina: outcomes(51, 56, 61),
      aggression: outcomes(43, 48, 53),
    },
  },
  balanced: {
    id: 'balanced',
    label: '균형형',
    outcomes: {
      appeal: outcomes(22, 26, 30),
      speed: outcomes(60, 65, 70),
      stamina: outcomes(63, 68, 73),
      aggression: outcomes(45, 50, 55),
    },
  },
};

export const repeatSynthesisFocusOptions = REPEAT_SYNTHESIS_FOCI.map((id) => FOCI[id]);

export function rollCompetitiveStats(focus: RepeatSynthesisFocus): DinosaurCompetitiveStats {
  const options = FOCI[focus].outcomes;
  const roll = (stat: keyof DinosaurCompetitiveStats) => {
    let number = randomInt(100);
    for (const outcome of options[stat]) {
      number -= outcome.chance;
      if (number < 0) return outcome.value;
    }
    throw new Error('능력치 확률 합계는 100이어야 합니다.');
  };
  return {
    appeal: roll('appeal'),
    speed: roll('speed'),
    stamina: roll('stamina'),
    aggression: roll('aggression'),
  };
}
