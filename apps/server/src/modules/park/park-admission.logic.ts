import type { Building, Dinosaur, Park } from '@prisma/client';
import {
  ENTRANCE_RESEARCH,
  getBuildingById,
  getDinosaurById,
  getViewingPlatformCompletedLevel,
  getViewingPlatformStats,
} from '@dino-park/game-data';
import {
  BuildingCategory,
  HAPPINESS_DECAY_PER_HOUR,
  HUNGER_INCREASE_PER_HOUR,
  PARK_ADMISSION,
} from '@dino-park/shared';
import { dinosaurCompetitiveStats } from '../dinosaur/dinosaur-competitive-stats';

export type Tile = { x: number; y: number };
export type AdmissionWorld = Pick<
  Park,
  'gridSizeX' | 'gridSizeY' | 'isOpen' | 'admissionCareCompleted'
> & {
  buildings: Building[];
  dinosaurs: Dinosaur[];
  technologyResearch?: Array<{ completesAt: Date }>;
};

export const admissionResearch = {
  where: { technologyId: ENTRANCE_RESEARCH.technologyId, level: ENTRANCE_RESEARCH.level },
  select: { completesAt: true },
} as const;
const key = ({ x, y }: Tile) => `${x},${y}`;
const adjacent = ({ x, y }: Tile): Tile[] => [
  { x: x - 1, y },
  { x: x + 1, y },
  { x, y: y - 1 },
  { x, y: y + 1 },
];

export function buildingSize(building: Pick<Building, 'typeId'>) {
  return getBuildingById(building.typeId)?.size ?? { width: 1, height: 1 };
}
export function completionTime(building: Building): number | null {
  if (building.status !== 'CONSTRUCTING' && building.status !== 'UPGRADING') return null;
  return (
    building.completesAt?.getTime() ??
    building.createdAt.getTime() + (getBuildingById(building.typeId)?.constructionTime ?? 60) * 1000
  );
}
export function activeAt(building: Building, at: number) {
  if (building.createdAt.getTime() > at) return false;
  // The existing deck remains usable while its extension is under construction.
  if (building.typeId === PARK_ADMISSION.platformTypeId && building.status === 'UPGRADING')
    return true;
  return building.status === 'ACTIVE' || (completionTime(building) ?? Infinity) <= at;
}

function operatingStats(building: Building, at: number) {
  if (building.typeId === PARK_ADMISSION.platformTypeId) {
    const extending =
      building.status === 'UPGRADING' && (completionTime(building) ?? Infinity) > at;
    return getViewingPlatformStats(getViewingPlatformCompletedLevel(building.level, extending));
  }
  return getBuildingById(building.typeId)?.baseStats ?? { capacity: 0, maintenanceCost: 0 };
}

export function contains(building: Building, tile: Tile) {
  const { width, height } = buildingSize(building);
  return (
    tile.x >= building.positionX &&
    tile.x < building.positionX + width &&
    tile.y >= building.positionY &&
    tile.y < building.positionY + height
  );
}
export function footprint(building: Building): Tile[] {
  const { width, height } = buildingSize(building);
  return Array.from({ length: width * height }, (_, index) => ({
    x: building.positionX + (index % width),
    y: building.positionY + Math.floor(index / width),
  }));
}
export function onBoundary(
  building: Building,
  world: Pick<AdmissionWorld, 'gridSizeX' | 'gridSizeY'>,
) {
  const { width, height } = buildingSize(building);
  return (
    building.positionX >= 0 &&
    building.positionY >= 0 &&
    building.positionX + width <= world.gridSizeX &&
    building.positionY + height <= world.gridSizeY &&
    (building.positionX === 0 ||
      building.positionY === 0 ||
      building.positionX + width === world.gridSizeX ||
      building.positionY + height === world.gridSizeY)
  );
}
export function entranceExit(
  building: Building,
  world: Pick<AdmissionWorld, 'gridSizeX' | 'gridSizeY'>,
): Tile {
  const { width, height } = buildingSize(building);
  if (building.positionY + height === world.gridSizeY)
    return { x: building.positionX + Math.floor(width / 2), y: building.positionY - 1 };
  if (building.positionX + width === world.gridSizeX)
    return { x: building.positionX - 1, y: building.positionY + Math.floor(height / 2) };
  if (building.positionY === 0) return { x: building.positionX + Math.floor(width / 2), y: height };
  return { x: width, y: building.positionY + Math.floor(height / 2) };
}

export function currentDinosaurState(
  dino: Pick<Dinosaur, 'lastFedAt' | 'happiness' | 'hunger'>,
  at: number,
) {
  const hours = Math.max(0, at - dino.lastFedAt.getTime()) / 3600000;
  return {
    happiness: Math.max(0, dino.happiness - Math.floor(hours * HAPPINESS_DECAY_PER_HOUR)),
    hunger: Math.min(100, dino.hunger + Math.floor(hours * HUNGER_INCREASE_PER_HOUR)),
  };
}

export function admissionSnapshot(world: AdmissionWorld, at: number) {
  const inside = (t: Tile) =>
    t.x >= 0 && t.y >= 0 && t.x < world.gridSizeX && t.y < world.gridSizeY;
  const entrances = world.buildings.filter((b) => b.typeId === PARK_ADMISSION.entranceTypeId);
  const entrance =
    entrances.find((b) => onBoundary(b, world) && activeAt(b, at)) ?? entrances[0] ?? null;
  const boundaryReady = !!entrance && onBoundary(entrance, world) && activeAt(entrance, at);
  const blocked = new Set(world.buildings.flatMap(footprint).map(key));
  // Free-roaming dinosaurs are not a safe visitor path. Habitats themselves remain fenced.
  world.dinosaurs
    .filter((d) => d.isInPark)
    .forEach((d) => blocked.add(key({ x: d.positionX, y: d.positionY })));
  const start = boundaryReady ? entranceExit(entrance!, world) : null;
  const parent = new Map<string, Tile | null>();
  if (start && inside(start) && !blocked.has(key(start))) {
    const queue = [start];
    parent.set(key(start), null);
    for (let i = 0; i < queue.length; i++) {
      for (const next of adjacent(queue[i])) {
        if (!inside(next) || blocked.has(key(next)) || parent.has(key(next))) continue;
        parent.set(key(next), queue[i]);
        queue.push(next);
      }
    }
  }
  const paths = new Map<string, Tile>();
  const connect = (building: Building) => {
    const candidates = footprint(building)
      .flatMap(adjacent)
      .filter((t) => parent.has(key(t)));
    const target = candidates[0];
    if (!target) return false;
    let current: Tile | null = target;
    while (current) {
      paths.set(key(current), current);
      current = parent.get(key(current)) ?? null;
    }
    return true;
  };
  const habitats = world.buildings.filter(
    (b) =>
      getBuildingById(b.typeId)?.category === BuildingCategory.DINOSAUR &&
      activeAt(b, at) &&
      connect(b),
  );
  const visible = world.dinosaurs.filter(
    (d) =>
      d.isInPark &&
      d.createdAt.getTime() <= at &&
      habitats.some(
        (h) =>
          contains(h, { x: d.positionX, y: d.positionY }) &&
          getDinosaurById(d.speciesId)?.habitat.some((tag) => h.typeId === `habitat-${tag}`),
      ),
  );
  const platforms = world.buildings.filter(
    (b) => b.typeId === PARK_ADMISSION.platformTypeId && activeAt(b, at) && connect(b),
  );
  const groups = new Map<string, Array<{ appeal: number; quality: number }>>();
  for (const dinosaur of visible) {
    const species = getDinosaurById(dinosaur.speciesId);
    if (!species) continue;
    const state = currentDinosaurState(dinosaur, at);
    const quality = (0.5 + (0.5 * state.happiness) / 100) * (state.hunger > 80 ? 0.5 : 1);
    const appeal = dinosaurCompetitiveStats(dinosaur)?.appeal ?? species.stats.popularity;
    groups.set(species.id, [...(groups.get(species.id) ?? []), { appeal, quality }]);
  }
  let attraction = 0,
    weightedQuality = 0;
  for (const group of groups.values()) {
    group
      .sort((a, b) => b.appeal * b.quality - a.appeal * a.quality || b.quality - a.quality)
      .slice(0, 3)
      .forEach((dino, rank) => {
        const weight = dino.appeal * [1, 0.25, 0.1][rank];
        attraction += weight;
        weightedQuality += weight * dino.quality;
      });
  }
  const quality = attraction ? weightedQuality / attraction : 0;
  const demand = (8 + 4 * attraction + 4 * Math.max(0, groups.size - 1)) * quality;
  const baseGateCapacity =
    entrance && boundaryReady ? (getBuildingById(entrance.typeId)?.baseStats.capacity ?? 100) : 0;
  const entryResearchDone = world.technologyResearch?.some(
    (research) => research.completesAt.getTime() <= at,
  );
  const gateCapacity = entryResearchDone
    ? (baseGateCapacity * (100 + ENTRANCE_RESEARCH.bonusPercent)) / 100
    : baseGateCapacity;
  const capacity = Math.min(
    gateCapacity,
    PARK_ADMISSION.baseCapacity +
      platforms.reduce((sum, b) => sum + operatingStats(b, at).capacity, 0),
  );
  const healthy = visible.some((d) => {
    const s = currentDinosaurState(d, at);
    return s.happiness >= 80 && s.hunger <= 20;
  });
  // Existing feed/interaction history survives hunger and happiness decay.
  const careCompleted =
    world.admissionCareCompleted || visible.some((d) => d.intimacy > 0) || healthy;
  const requirements: string[] = [];
  if (!entrance) requirements.push('입구 게이트를 준비해주세요.');
  else if (!boundaryReady) requirements.push('입구를 파크 테두리로 무료 이동해주세요.');
  if (boundaryReady && !habitats.length)
    requirements.push('입구와 서식지 사이에 방문객 길이 필요해요.');
  if (!visible.length) requirements.push('길이 닿는 서식지에 공룡을 배치해주세요.');
  if (visible.length && !careCompleted)
    requirements.push('첫 공룡에게 먹이를 주고 돌봄을 마쳐주세요.');
  const hourlyMaintenance =
    world.dinosaurs
      .filter((d) => d.createdAt.getTime() <= at)
      .reduce((sum, d) => sum + (getDinosaurById(d.speciesId)?.stats.maintenanceCost ?? 0), 0) +
    world.buildings
      .filter((b) => activeAt(b, at))
      .reduce((sum, b) => sum + operatingStats(b, at).maintenanceCost, 0);
  return {
    entrance,
    boundaryReady,
    pathTiles: [...paths.values()],
    connectedHabitatIds: habitats.map((habitat) => habitat.id),
    connectedPlatformIds: platforms.map((platform) => platform.id),
    requirements,
    canOpen: requirements.length === 0,
    demand,
    capacity,
    visitorsPerMinute:
      world.isOpen && boundaryReady && visible.length
        ? Math.min(demand, (capacity * 60) / PARK_ADMISSION.visitSeconds)
        : 0,
    hourlyMaintenance,
  };
}
