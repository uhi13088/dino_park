import { describe, expect, it } from 'vitest';
import { BuildingStatus } from '@dino-park/shared';
import { gridToScreen } from '../engine/IsometricGrid';
import { findParasaurolophusWalk, sampleParasaurolophusWalk } from './parasaurolophusWalk';

const para = { id: 'para', positionX: 9, positionY: 9, isInPark: true };
const grassland = {
  id: 'grassland',
  typeId: 'habitat-grassland',
  positionX: 8,
  positionY: 8,
  status: BuildingStatus.ACTIVE,
};
const grid = { width: 20, height: 20 };

describe('Parasaurolophus enclosure motion', () => {
  it('keeps its projected track inside the grassland and rejects a missing, unbuilt or distant enclosure', () => {
    const corner = { ...para, positionX: 8, positionY: 8 };
    const route = findParasaurolophusWalk(corner, [grassland], [corner], grid);
    expect(route?.home).toEqual(gridToScreen(8, 8));
    expect(route?.destination.y).toBe(route?.home.y);
    // Riding farther along the horizontal projected row would take a foot outside the fence.
    expect(route?.destination.x).toBeCloseTo(0.28 * 64);
    expect(findParasaurolophusWalk(para, [], [para], grid)).toBeNull();
    expect(
      findParasaurolophusWalk(
        para,
        [{ ...grassland, status: BuildingStatus.CONSTRUCTING }],
        [para],
        grid,
      ),
    ).toBeNull();
    expect(
      findParasaurolophusWalk({ ...para, positionX: 12 }, [grassland], [para], grid),
    ).toBeNull();
  });

  it('takes the other direction when a nearby dinosaur occupies its route, or stays idle if both are blocked', () => {
    const right = { ...para, id: 'right', positionX: 10 };
    const left = { ...para, id: 'left', positionX: 8 };
    const route = findParasaurolophusWalk(para, [grassland], [para, right], grid);
    expect(route?.destination.x).toBeLessThan(route?.home.x ?? 0);
    expect(findParasaurolophusWalk(para, [grassland], [para, right, left], grid)).toBeNull();
    expect(
      findParasaurolophusWalk(para, [grassland], [para, { ...right, isInPark: false }], grid)
        ?.destination.x,
    ).toBeGreaterThan(0);
  });

  it('idles, advances the walk frames, stops and mirrors the return leg', () => {
    const route = { home: { x: 0, y: 288 }, destination: { x: 27, y: 288 } };
    const sample = (time: number) => sampleParasaurolophusWalk(route, time, 6);
    expect(sample(900)).toEqual({ position: route.home, facingRight: true, frame: null });
    expect(sample(1220).position.x).toBeCloseTo(3.24);
    expect(sample(1220)).toMatchObject({ position: { y: 288 }, facingRight: true, frame: 1 });
    expect(sample(2200)).toEqual({ position: route.destination, facingRight: true, frame: null });
    expect(sample(4000).facingRight).toBe(false);
    expect(sample(4000).position.x).toBeLessThan(27);
    expect(sample(4800)).toEqual({ position: route.home, facingRight: true, frame: null });
  });
});
