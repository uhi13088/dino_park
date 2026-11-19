import { describe, expect, it } from 'vitest';
import { BuildingStatus, type BuildingResponse, type DinosaurResponse } from '@dino-park/shared';
import { suggestDinosaurPlacement } from './placement';
const habitat: BuildingResponse = {
  id: 'grass',
  typeId: 'habitat-grassland',
  level: 1,
  positionX: 8,
  positionY: 8,
  status: BuildingStatus.ACTIVE,
  assignedGreatFigureId: null,
};
const para: DinosaurResponse = {
  id: 'para',
  speciesId: 'parasaurolophus',
  nickname: '파라',
  level: 1,
  exp: 0,
  happiness: 95,
  hunger: 0,
  intimacy: 5,
  positionX: 9,
  positionY: 9,
  isInPark: true,
};
const igua = { ...para, id: 'igua', speciesId: 'iguanodon', isInPark: false };
describe('new dinosaur habitat suggestion', () => {
  it('keeps the second dinosaur inside the grassland and apart from the starter', () => {
    const tile = suggestDinosaurPlacement(igua, [habitat], [para, igua], 20, 20);
    expect(tile).not.toEqual({ x: 9, y: 9 });
    expect(tile.x).toBeGreaterThanOrEqual(8);
    expect(tile.x).toBeLessThan(11);
    expect(tile.y).toBeGreaterThanOrEqual(8);
    expect(tile.y).toBeLessThan(11);
    expect(igua).toMatchObject({ positionX: 9, positionY: 9, isInPark: false });
  });
  it('preserves an already placed dinosaur position and avoids an unfinished habitat', () => {
    expect(suggestDinosaurPlacement(para, [habitat], [para], 20, 20)).toEqual({ x: 9, y: 9 });
    expect(
      suggestDinosaurPlacement(
        igua,
        [{ ...habitat, status: BuildingStatus.CONSTRUCTING }],
        [para],
        20,
        20,
      ),
    ).toEqual({ x: 9, y: 9 });
  });
});
