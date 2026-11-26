import { gridToScreen } from './IsometricGrid';

type Point = { x: number; y: number };

export const PARK_MEADOW_SITE = { x: 12, y: -4 } as const;

// The first plot is near the southwest inlet. Legacy plots use the positive
// axes, which remain inside the same coast at every expansion level.
const coastKnots = [
  { x: -13, y: -7 },
  { x: 0, y: -12 },
  { x: 19, y: -17 },
  { x: 35, y: -13 },
  { x: 53, y: -18 },
  { x: 70, y: -12 },
  { x: 85, y: -14 },
  { x: 103, y: -11 },
  { x: 115, y: -5 },
  { x: 119, y: 5 },
  { x: 123, y: 19 },
  { x: 118, y: 34 },
  { x: 123, y: 49 },
  { x: 119, y: 62 },
  { x: 123, y: 81 },
  { x: 118, y: 102 },
  { x: 112, y: 114 },
  { x: 99, y: 120 },
  { x: 83, y: 123 },
  { x: 67, y: 119 },
  { x: 53, y: 123 },
  { x: 37, y: 116 },
  { x: 21, y: 118 },
  { x: 7, y: 112 },
  { x: -4, y: 109 },
  { x: -12, y: 97 },
  { x: -15, y: 86 },
  { x: -17, y: 73 },
  { x: -11, y: 57 },
  { x: -9, y: 46 },
  { x: -3.7, y: 34 },
  { x: -2.35, y: 25 },
  { x: -2.1, y: 19 },
  { x: -4.6, y: 13 },
  { x: -8.8, y: 8 },
  { x: -10.6, y: 2 },
] satisfies Point[];

function blendKnot(a: number, b: number, c: number, d: number, t: number): number {
  return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * b - a - 3 * c + d)));
}

const knotCount = coastKnots.length;
const knotAt = (index: number) => coastKnots[(index + knotCount) % knotCount];
export const islandCoast = coastKnots.flatMap((b, index) => {
  const a = knotAt(index - 1);
  const c = knotAt(index + 1);
  const d = knotAt(index + 2);
  const steps = Math.ceil(Math.hypot(c.x - b.x, c.y - b.y) / 1.15);
  return Array.from({ length: steps }, (_, step) => ({
    x: blendKnot(a.x, b.x, c.x, d.x, step / steps),
    y: blendKnot(a.y, b.y, c.y, d.y, step / steps),
  }));
});

export const islandScreenCoast = islandCoast.map(({ x, y }) => gridToScreen(x, y));
const visibleWaterMargin = 96;
const screenBounds = Object.freeze({
  left: Math.min(...islandScreenCoast.map(({ x }) => x)) - visibleWaterMargin,
  top: Math.min(...islandScreenCoast.map(({ y }) => y)) - visibleWaterMargin,
  right: Math.max(...islandScreenCoast.map(({ x }) => x)) + visibleWaterMargin,
  bottom: Math.max(...islandScreenCoast.map(({ y }) => y)) + visibleWaterMargin,
});

export function getIslandScreenBounds() {
  return screenBounds;
}

export function containsIslandLand({ x, y }: Point): boolean {
  let inside = false;
  for (const [index, a] of islandCoast.entries()) {
    const b = islandCoast[(index + 1) % islandCoast.length];
    if (a.y > y !== b.y > y && x < a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y)) inside = !inside;
  }
  return inside;
}

/** Distance in tiles to the first coast crossing straight out from an entrance. */
export function getIslandCoastClearance(origin: Point, axis: keyof Point, direction: number) {
  const across = axis === 'x' ? 'y' : 'x';
  let nearest = Infinity;
  for (const [index, a] of islandCoast.entries()) {
    const b = islandCoast[(index + 1) % islandCoast.length];
    if (a[across] > origin[across] === b[across] > origin[across]) continue;
    const fraction = (origin[across] - a[across]) / (b[across] - a[across]);
    const distance = (a[axis] + (b[axis] - a[axis]) * fraction - origin[axis]) * direction;
    if (distance > 0) nearest = Math.min(nearest, distance);
  }
  return nearest;
}
