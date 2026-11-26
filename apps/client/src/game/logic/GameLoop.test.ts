import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameLoop } from './GameLoop';

describe('server-owned park gold', () => {
  afterEach(() => vi.useRealTimers());
  it('does not add dinosaur or offline gold to the local cache', () => {
    vi.useFakeTimers();
    const loop = new GameLoop();
    loop.setState({
      currency: {
        gold: 500,
        diamond: 100,
        dna: 0,
      },
    });
    loop.addDinosaur({
      id: 'para',
      speciesId: 'parasaurolophus',
      nickname: '파라',
      level: 1,
      exp: 0,
      happiness: 95,
      hunger: 0,
      intimacy: 0,
      positionX: 9,
      positionY: 9,
      isInPark: true,
    });
    loop.start();
    vi.advanceTimersByTime(60_000);
    expect(loop.getState()?.currency.gold).toBe(500);
    expect(loop.getState()?.accumulatedGold).toBe(0);
    expect(loop.processOfflineProgress(new Date(Date.now() - 3600_000)).goldEarned).toBe(0);
    loop.stop();
  });
});
