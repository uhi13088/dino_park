export const PARK_ENTRANCE_SIDES = ['bottom', 'right', 'top', 'left'] as const;
export type ParkEntranceSide = (typeof PARK_ENTRANCE_SIDES)[number];

type EntrancePlot = { x: number; y: number; width: number; height: number };

export function getParkEntranceSides(
  gridWidth: number,
  gridHeight: number,
  { x, y, width, height }: EntrancePlot,
): ParkEntranceSide[] {
  if (x < 0 || y < 0 || x + width > gridWidth || y + height > gridHeight) return [];

  const sides: ParkEntranceSide[] = [];
  if (y + height === gridHeight) sides.push('bottom');
  if (x + width === gridWidth) sides.push('right');
  if (y === 0) sides.push('top');
  if (x === 0) sides.push('left');
  return sides;
}

export function resolveParkEntranceSide(
  gridWidth: number,
  gridHeight: number,
  plot: EntrancePlot,
  preferredSide?: string | null,
): ParkEntranceSide | null {
  const sides = getParkEntranceSides(gridWidth, gridHeight, plot);
  return sides.find((side) => side === preferredSide) ?? sides[0] ?? null;
}
