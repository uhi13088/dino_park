import { getBuildingById, resolveDinosaurSpecies } from '@dino-park/game-data';
import type { BuildingResponse, DinosaurResponse } from '@dino-park/shared';

type PendingDinosaur = Pick<
  DinosaurResponse,
  'id' | 'speciesId' | 'positionX' | 'positionY' | 'isInPark' | 'hybrid'
>;

/** Suggest a free compatible habitat cell, without changing saved placement or server validation. */
export function suggestDinosaurPlacement(
  dinosaur: PendingDinosaur,
  buildings: BuildingResponse[],
  dinosaurs: DinosaurResponse[],
  width: number,
  height: number,
) {
  const fallback = { x: dinosaur.positionX, y: dinosaur.positionY };
  if (dinosaur.isInPark) return fallback;
  const species = resolveDinosaurSpecies(dinosaur);
  const occupied = dinosaurs.filter((item) => item.isInPark && item.id !== dinosaur.id);
  const candidates: Array<{ x: number; y: number }> = [];
  for (const building of buildings) {
    if (
      building.status.toLowerCase() !== 'active' ||
      !species?.habitat.some((tag) => building.typeId === `habitat-${tag}`)
    )
      continue;
    const size = getBuildingById(building.typeId)?.size ?? { width: 1, height: 1 };
    for (let y = building.positionY; y < building.positionY + size.height; y++) {
      for (let x = building.positionX; x < building.positionX + size.width; x++) {
        if (
          x < 0 ||
          y < 0 ||
          x >= width ||
          y >= height ||
          occupied.some((item) => item.positionX === x && item.positionY === y)
        )
          continue;
        const blocked = buildings.some((other) => {
          if (other.id === building.id) return false;
          const footprint = getBuildingById(other.typeId)?.size ?? { width: 1, height: 1 };
          return (
            x >= other.positionX &&
            x < other.positionX + footprint.width &&
            y >= other.positionY &&
            y < other.positionY + footprint.height
          );
        });
        if (!blocked) candidates.push({ x, y });
      }
    }
  }
  const separation = (position: { x: number; y: number }) =>
    occupied.length
      ? Math.min(
          ...occupied.map((item) =>
            Math.hypot(
              (position.x - position.y - item.positionX + item.positionY) * 32,
              (position.x + position.y - item.positionX - item.positionY) * 16,
            ),
          ),
        )
      : 0;
  candidates.sort(
    (a, b) =>
      separation(b) - separation(a) ||
      Math.abs(a.x - fallback.x) +
        Math.abs(a.y - fallback.y) -
        Math.abs(b.x - fallback.x) -
        Math.abs(b.y - fallback.y),
  );
  return candidates[0] ?? fallback;
}
