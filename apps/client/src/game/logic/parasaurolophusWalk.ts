import { getBuildingById } from '@dino-park/game-data';
import type { BuildingResponse, DinosaurResponse } from '@dino-park/shared';
import { gridToScreen } from '../engine/IsometricGrid';

const GRASSLAND_ID = 'habitat-grassland';
const FENCE_CLEARANCE = 0.22;
const MAX_WALK_GRID_OFFSET = 0.65;
const SHORTEST_WALK_GRID_OFFSET = 0.2;
const CREATURE_CLEARANCE = { x: 40, y: 23 };
const HOME_REST_MS = 1100;
const AWAY_REST_MS = 1700;
const WALK_PIXELS_PER_SECOND = 27;
const WALK_FRAME_MS = 120;

type Point = { x: number; y: number };
type GridSize = { width: number; height: number };
type Building = Pick<BuildingResponse, 'id' | 'typeId' | 'positionX' | 'positionY' | 'status'>;
type Dinosaur = Pick<DinosaurResponse, 'id' | 'positionX' | 'positionY' | 'isInPark'>;

export interface ParasaurolophusWalkRoute {
  home: Point;
  destination: Point;
}

/** Find a short level-looking track so the two facing directions can share the same frames. */
export function findParasaurolophusWalk(
  dinosaur: Dinosaur,
  buildings: Building[],
  dinosaurs: Dinosaur[],
  grid: GridSize,
): ParasaurolophusWalkRoute | null {
  const x = dinosaur.positionX;
  const y = dinosaur.positionY;
  if (!dinosaur.isInPark || x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null;

  const grasslandSize = getBuildingById(GRASSLAND_ID)?.size;
  if (!grasslandSize) return null;
  const habitat = buildings.find(
    (item) =>
      item.typeId === GRASSLAND_ID &&
      item.status.toLowerCase() === 'active' &&
      x >= item.positionX &&
      x < item.positionX + grasslandSize.width &&
      y >= item.positionY &&
      y < item.positionY + grasslandSize.height,
  );
  if (!habitat) return null;

  const cellInset = 0.5 - FENCE_CLEARANCE;
  const minX = Math.max(0, habitat.positionX) - cellInset;
  const minY = Math.max(0, habitat.positionY) - cellInset;
  const maxX = Math.min(grid.width, habitat.positionX + grasslandSize.width) - 1 + cellInset;
  const maxY = Math.min(grid.height, habitat.positionY + grasslandSize.height) - 1 + cellInset;
  const home = gridToScreen(x, y);
  const depth = x + y;
  const obstructions = buildings
    .filter((item) => item.id !== habitat.id)
    .map((item) => {
      const size = getBuildingById(item.typeId)?.size ?? { width: 1, height: 1 };
      // The track has constant x + y. Intersect its interval with the building footprint.
      return {
        start: Math.max(item.positionX - 0.5, depth - (item.positionY + size.height - 0.5)),
        end: Math.min(item.positionX + size.width - 0.5, depth - (item.positionY - 0.5)),
      };
    });
  const neighbors = dinosaurs
    .filter((item) => item.isInPark && item.id !== dinosaur.id)
    .map((item) => gridToScreen(item.positionX, item.positionY));
  const maxRight = Math.min(MAX_WALK_GRID_OFFSET, maxX - x, y - minY);
  const maxLeft = Math.min(MAX_WALK_GRID_OFFSET, x - minX, maxY - y);

  for (const direction of maxRight >= maxLeft ? [1, -1] : [-1, 1]) {
    const maxOffset = direction === 1 ? maxRight : maxLeft;
    for (const offset of [maxOffset, maxOffset * 0.67]) {
      if (offset < SHORTEST_WALK_GRID_OFFSET) continue;
      const targetX = x + offset * direction;
      const start = Math.min(x, targetX);
      const end = Math.max(x, targetX);
      if (obstructions.some((block) => Math.max(start, block.start) <= Math.min(end, block.end)))
        continue;

      const destination = gridToScreen(targetX, y - offset * direction);
      const left = Math.min(home.x, destination.x);
      const right = Math.max(home.x, destination.x);
      const reachesCreature = neighbors.some((neighbor) => {
        const nearestX = Math.min(right, Math.max(left, neighbor.x));
        return (
          Math.hypot(
            (neighbor.x - nearestX) / CREATURE_CLEARANCE.x,
            (neighbor.y - home.y) / CREATURE_CLEARANCE.y,
          ) < 1
        );
      });
      if (!reachesCreature) return { home, destination };
    }
  }
  return null;
}

export function sampleParasaurolophusWalk(
  route: ParasaurolophusWalkRoute,
  elapsedMs: number,
  frameCount: number,
): { position: Point; facingRight: boolean; frame: number | null } {
  const { home, destination } = route;
  const walkMs = (Math.abs(destination.x - home.x) / WALK_PIXELS_PER_SECOND) * 1000;
  const timeInLoop = elapsedMs % (HOME_REST_MS + AWAY_REST_MS + 2 * walkMs);
  const facesOut = destination.x > home.x;
  if (timeInLoop < HOME_REST_MS) return { position: home, facingRight: facesOut, frame: null };

  const awayMs = timeInLoop - HOME_REST_MS - walkMs;
  if (awayMs >= 0 && awayMs < AWAY_REST_MS)
    return { position: destination, facingRight: facesOut, frame: null };

  const returning = awayMs >= AWAY_REST_MS;
  const legTime = returning ? awayMs - AWAY_REST_MS : timeInLoop - HOME_REST_MS;
  const progress = returning ? 1 - legTime / walkMs : legTime / walkMs;
  return {
    position: { x: home.x + (destination.x - home.x) * progress, y: home.y },
    facingRight: returning ? !facesOut : facesOut,
    frame: Math.floor(legTime / WALK_FRAME_MS) % frameCount,
  };
}
