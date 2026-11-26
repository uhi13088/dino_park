import { MaterialQuality as Q, ResearchMaterial as M } from '@dino-park/shared';
import { failureRefunds, lineageKey, spendIngredients } from './experimental-hybrid-records';

describe('experimental hybrid resources', () => {
  it('uses the lowest eligible quality first and exposes shortages without drawing lower stock', () => {
    const need = [
      { material: M.DNA, quality: Q.MIDDLE, amount: 5 },
      { material: M.CATALYST, quality: Q.HIGH, amount: 1 },
    ];
    const result = spendIngredients(need, [
      { material: M.DNA, quality: Q.LOW, amount: 50 },
      { material: M.DNA, quality: Q.MIDDLE, amount: 3 },
      { material: M.DNA, quality: Q.HIGH, amount: 10 },
      { material: M.CATALYST, quality: Q.MIDDLE, amount: 10 },
    ]);
    expect(result).toEqual({
      debits: [
        { material: M.DNA, quality: Q.MIDDLE, amount: 3 },
        { material: M.DNA, quality: Q.HIGH, amount: 2 },
      ],
      shortages: [{ material: M.CATALYST, quality: Q.HIGH, amount: 1 }],
    });
  });

  it('refunds actual spent quality, with optional stability consuming only the stabilizer', () => {
    const paid = [
      { material: M.DNA, quality: Q.MIDDLE, amount: 20 },
      { material: M.CATALYST, quality: Q.HIGH, amount: 1 },
      { material: M.CULTURE, quality: Q.MIDDLE, amount: 2 },
    ];
    expect(failureRefunds(paid, false)).toEqual([
      { material: M.DNA, quality: Q.MIDDLE, amount: 16 },
      { material: M.CULTURE, quality: Q.MIDDLE, amount: 1 },
    ]);
    expect(
      failureRefunds([...paid, { material: M.STABILIZER, quality: Q.MIDDLE, amount: 1 }], true),
    ).toEqual(paid);
  });

  it('preserves the design for reversed parents and distinguishes orientation and tier', () => {
    const a = lineageKey(['iguana', 'trike'], 'audience', 'epic');
    expect(a).toEqual(lineageKey(['trike', 'iguana'], 'audience', 'epic'));
    expect(a).not.toEqual(lineageKey(['trike', 'iguana'], 'sprint', 'epic'));
    expect(a).not.toEqual(lineageKey(['trike', 'iguana'], 'audience', 'legendary'));
  });
});
