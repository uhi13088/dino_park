import type { DinosaurCompetitiveStats } from '@dino-park/shared';
import { repeatSynthesisFocusOptions, rollCompetitiveStats } from './repeat-synthesis.rules';

const mockRoll = jest.fn<number, []>();
jest.mock('node:crypto', () => ({ randomInt: () => mockRoll() }));

describe('repeat synthesis ability odds', () => {
  it.each(repeatSynthesisFocusOptions)(
    'matches the displayed odds for $label',
    ({ id, outcomes }) => {
      const values = Array.from({ length: 100 }, (_, roll) => {
        mockRoll.mockReturnValue(roll);
        return rollCompetitiveStats(id);
      });
      for (const trait of Object.keys(outcomes) as (keyof DinosaurCompetitiveStats)[]) {
        const preview = outcomes[trait];
        expect(new Set(values.map((stats) => stats[trait]))).toEqual(
          new Set(preview.map(({ value }) => value)),
        );
        for (const { value, chance } of preview)
          expect(values.filter((stats) => stats[trait] === value)).toHaveLength(chance);
      }
    },
  );

  it('rolls each ability separately', () => {
    mockRoll
      .mockClear()
      .mockReturnValueOnce(24)
      .mockReturnValueOnce(25)
      .mockReturnValueOnce(74)
      .mockReturnValueOnce(75);
    expect(rollCompetitiveStats('balanced')).toEqual({
      appeal: 22,
      speed: 65,
      stamina: 68,
      aggression: 55,
    });
    expect(mockRoll).toHaveBeenCalledTimes(4);
  });
});
