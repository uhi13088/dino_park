import { describe, expect, it } from 'vitest';
import { getVisitorRoute } from './ParkScenery';

const entrance = { id: 'gate', x: 2, y: 6, width: 2, height: 2, onBoundary: true };

describe('visitor road walk', () => {
  it('keeps an ordered route inside the connected road, including a branching union', () => {
    const tiles = [
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 9, y: 9 }, // A disconnected tile must never teleport the walker.
    ];
    const route = getVisitorRoute(tiles, entrance);
    expect(route[0]).toEqual({ x: 2, y: 5 });
    expect(route.length).toBeGreaterThan(3);
    expect(route).not.toContainEqual({ x: 9, y: 9 });
    for (let i = 1; i < route.length; i++) {
      expect(tiles).toContainEqual(route[i]);
      expect(Math.abs(route[i].x - route[i - 1].x) + Math.abs(route[i].y - route[i - 1].y)).toBe(1);
    }
  });
  it('draws no walk when there is no gate or road', () => {
    expect(getVisitorRoute([], entrance)).toEqual([]);
    expect(getVisitorRoute([{ x: 1, y: 1 }], null)).toEqual([]);
  });
});
