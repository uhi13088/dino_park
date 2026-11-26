import * as PIXI from 'pixi.js';
import { FIRST_HYBRID_HABITAT_ID } from '@dino-park/shared';
import { gridToScreen } from './IsometricGrid';

type Point = { x: number; y: number };
type HabitatMaterials = {
  ground: number;
  grassLight: number;
  grassShade: number;
  rail: number;
  railLight: number;
  railShade: number;
  foundation: number | null;
};

const grassland: HabitatMaterials = {
  ground: 0x9fb862,
  grassLight: 0xb1c674,
  grassShade: 0x8ba255,
  rail: 0xc68f52,
  railLight: 0xe4b679,
  railShade: 0x956b40,
  foundation: null,
};

const hybrid: HabitatMaterials = {
  ground: 0x90ac6b,
  grassLight: 0xa6ba75,
  grassShade: 0x7c9a60,
  rail: 0xb87847,
  railLight: 0xdca370,
  railShade: 0x885339,
  foundation: 0xbea485,
};

export const isHabitatWithScenery = (typeId: string) =>
  typeId === 'habitat-grassland' || typeId === FIRST_HYBRID_HABITAT_ID;

function path(points: Point[]): number[] {
  return points.flatMap(({ x, y }) => [x, y]);
}

function drawRail(
  layer: PIXI.Graphics,
  start: Point,
  end: Point,
  materials: HabitatMaterials,
  height: number,
): void {
  if (materials.foundation !== null) {
    layer
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({ color: materials.railShade, width: 6, alpha: 0.75 })
      .moveTo(start.x, start.y - 1)
      .lineTo(end.x, end.y - 1)
      .stroke({ color: materials.foundation, width: 4 });
  } else {
    layer
      .moveTo(start.x + 1, start.y + 2)
      .lineTo(end.x + 1, end.y + 2)
      .stroke({ color: 0x435b2a, width: 4, alpha: 0.25 });
    if (height > 6) {
      layer
        .moveTo(start.x, start.y - 5)
        .lineTo(end.x, end.y - 5)
        .stroke({ color: materials.railShade, width: 3 });
    }
  }

  layer
    .moveTo(start.x, start.y - height + 2)
    .lineTo(end.x, end.y - height + 2)
    .stroke({ color: materials.railShade, width: 3.5 })
    .moveTo(start.x, start.y - height + 1)
    .lineTo(end.x, end.y - height + 1)
    .stroke({ color: materials.rail, width: 2.5 });
}

function drawPost(layer: PIXI.Graphics, point: Point, materials: HabitatMaterials, height: number) {
  const top = point.y - height - 2;
  layer.rect(point.x - 2, top, 5, height + 3).fill(materials.railShade);
  layer.rect(point.x - 2, top, 3, height + 2).fill(materials.rail);
  layer
    .poly([point.x - 2, top, point.x, top - 1, point.x + 3, top, point.x, top + 1])
    .fill(materials.railLight);
}

export function createHabitatScenery(typeId: string, width: number, height: number) {
  const materials = typeId === FIRST_HYBRID_HABITAT_ID ? hybrid : grassland;
  const ground = new PIXI.Graphics();
  const front = new PIXI.Graphics();
  front.eventMode = 'none';

  const left = -width / 2 + 0.06;
  const right = width / 2 - 0.06;
  const top = -height / 2 + 0.06;
  const bottom = height / 2 - 0.06;
  const far = gridToScreen(left, top);
  const east = gridToScreen(right, top);
  const near = gridToScreen(right, bottom);
  const west = gridToScreen(left, bottom);

  ground.poly(path([far, east, near, west])).fill(materials.ground);
  ground
    .poly(path([gridToScreen(left, top + 0.7), east, gridToScreen(right - 0.9, bottom), west]))
    .fill(materials.grassLight);
  ground
    .poly(
      path([west, near, gridToScreen(right, bottom - 0.6), gridToScreen(left + 0.7, bottom - 0.4)]),
    )
    .fill(materials.grassShade);

  const pool = gridToScreen(right - 0.7, top + 0.8);
  ground.ellipse(pool.x, pool.y, 21, 10).fill(0xb5a77a);
  ground.ellipse(pool.x, pool.y, 18, 8).fill(0x718f75);
  ground.ellipse(pool.x - 1, pool.y - 1, 16, 7).fill(0x82a9a0);
  ground.ellipse(pool.x - 5, pool.y - 3, 7, 1).fill({ color: 0xbacbb1, alpha: 0.7 });
  const planting = gridToScreen(left + 0.42, top + 0.75);
  ground.ellipse(planting.x, planting.y, 13, 6).fill(materials.grassShade);
  ground
    .ellipse(planting.x - 4, planting.y - 2, 5, 3.3)
    .fill(0x819e58)
    .ellipse(planting.x + 3, planting.y - 3, 6, 3.8)
    .fill(0x94a95c)
    .ellipse(planting.x + 8, planting.y - 1, 4, 2.7)
    .fill(0x719050);

  const feeder = gridToScreen(left + 0.65, bottom - 0.85);
  ground
    .poly([
      feeder.x,
      feeder.y - 5,
      feeder.x + 11,
      feeder.y,
      feeder.x,
      feeder.y + 5,
      feeder.x - 11,
      feeder.y,
    ])
    .fill(0xb79358)
    .stroke({ color: 0x807549, width: 1.5 });
  ground.ellipse(feeder.x, feeder.y, 6, 2.3).fill(0x78955b);

  drawRail(ground, west, far, materials, 13);
  drawRail(ground, far, east, materials, 13);
  drawPost(ground, far, materials, 13);
  for (let column = 1; column < width; column++) {
    drawPost(ground, gridToScreen(left + column, top), materials, 13);
    drawPost(front, gridToScreen(left + column, bottom), materials, 6);
  }
  for (let row = 1; row < height; row++) {
    drawPost(ground, gridToScreen(left, top + row), materials, 13);
    drawPost(front, gridToScreen(right, top + row), materials, 6);
  }
  drawRail(front, west, near, materials, 6);
  drawRail(front, east, near, materials, 6);
  for (const corner of [west, near, east]) drawPost(front, corner, materials, 6);

  return { ground, front };
}
