import type { Building, Dinosaur, Park, ParkTechnologyResearch } from '@prisma/client';
import {
  ENTRANCE_RESEARCH,
  ENVIRONMENT_ADAPTATION_RESEARCH,
  SECURITY_CENTER_LEVEL_ONE_STATS,
  SECURITY_CENTER_LEVEL_TWO_UPGRADE,
  SECURITY_CENTER_TYPE_ID,
  TECHNOLOGY_RESEARCH_POLICY,
  getBuildingById,
  resolveDinosaurSpecies,
  getViewingPlatformStats,
  getViewingPlatformUpgrade,
} from '@dino-park/game-data';
import {
  BuildingCategory,
  DinosaurCategory,
  DinosaurOrigin,
  HAPPINESS_DECAY_PER_HOUR,
  HUNGER_INCREASE_PER_HOUR,
  PARK_ADMISSION,
  getParkEntranceSides,
  resolveParkEntranceSide,
  type ExhibitViewingExperience,
  type ParkOperationsResponse,
} from '@dino-park/shared';
import { dinosaurCompetitiveStats } from '../dinosaur/dinosaur-competitive-stats';
import { shuttleSnapshot } from './park-shuttle.logic';
import { readSafariState, safariReservedTiles } from './park-safari-state';

export type Tile = { x: number; y: number };
type VisitorRouteNode = { tile: Tile; distance: number; parent: VisitorRouteNode | null };
export type AdmissionDinosaur = Omit<Dinosaur, 'hybridSpecies'> &
  Partial<Pick<Dinosaur, 'hybridSpecies'>>;
export type AdmissionWorld = Pick<
  Park,
  'gridSizeX' | 'gridSizeY' | 'isOpen' | 'admissionCareCompleted'
> &
  Partial<Pick<Park, 'level' | 'shuttleService' | 'safariLayout'>> & {
    buildings: Building[];
    dinosaurs: AdmissionDinosaur[];
    technologyResearch?: Array<
      Pick<ParkTechnologyResearch, 'technologyId' | 'completesAt'> &
        Partial<Pick<ParkTechnologyResearch, 'level'>>
    >;
  };

export const careResearch = {
  where: { technologyId: ENVIRONMENT_ADAPTATION_RESEARCH.technologyId },
  select: { technologyId: true, level: true, completesAt: true },
} as const;
export const admissionResearch = {
  where: { OR: [{ technologyId: ENTRANCE_RESEARCH.technologyId }, careResearch.where] },
  select: careResearch.select,
};
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
export function completionTime(
  building: Pick<Building, 'typeId' | 'status' | 'createdAt' | 'completesAt'>,
): number | null {
  if (building.status !== 'CONSTRUCTING' && building.status !== 'UPGRADING') return null;
  return (
    building.completesAt?.getTime() ??
    building.createdAt.getTime() + (getBuildingById(building.typeId)?.constructionTime ?? 60) * 1000
  );
}
export function activeAt(building: Building, at: number) {
  if (building.createdAt.getTime() > at) return false;
  // The previously completed level still operates during these expansions.
  if (
    building.status === 'UPGRADING' &&
    (building.typeId === PARK_ADMISSION.platformTypeId ||
      building.typeId === SECURITY_CENTER_TYPE_ID)
  )
    return true;
  return building.status === 'ACTIVE' || (completionTime(building) ?? Infinity) <= at;
}

function completedOperatingLevel(building: Building, at: number) {
  const extending = building.status === 'UPGRADING' && (completionTime(building) ?? Infinity) > at;
  return Math.max(1, building.level - Number(extending));
}

function operatingMaintenance(building: Building, at: number) {
  if (building.typeId === PARK_ADMISSION.platformTypeId) {
    return getViewingPlatformStats(completedOperatingLevel(building, at)).maintenanceCost;
  }
  if (hasExpandedSecurityCenter(building, at)) {
    return SECURITY_CENTER_LEVEL_TWO_UPGRADE.maintenanceCost;
  }
  return getBuildingById(building.typeId)?.baseStats.maintenanceCost ?? 0;
}

function hasExpandedSecurityCenter(building: Building, at: number) {
  return (
    building.typeId === SECURITY_CENTER_TYPE_ID &&
    activeAt(building, at) &&
    completedOperatingLevel(building, at) >= SECURITY_CENTER_LEVEL_TWO_UPGRADE.targetLevel
  );
}

const managedHerbivores = new Set(['stegoceratops', 'ankylodocus', 'parasaurolophus-lux']);

export function dinosaurExhibitRiskPoints(
  input: string | { speciesId: string; hybridSpecies?: unknown },
) {
  const species = resolveDinosaurSpecies(typeof input === 'string' ? { speciesId: input } : input);
  if (
    !species ||
    managedHerbivores.has(species.id) ||
    species.habitat.includes('hybrid-zone') ||
    species.category === DinosaurCategory.HERBIVORE
  )
    return 0;
  return species.origin === DinosaurOrigin.HYBRID || species.category === DinosaurCategory.HYBRID
    ? 3
    : 1;
}

function hasHazardousUpkeep(species: NonNullable<ReturnType<typeof resolveDinosaurSpecies>>) {
  return (
    !managedHerbivores.has(species.id) &&
    !species.habitat.includes('hybrid-zone') &&
    (species.category !== DinosaurCategory.HERBIVORE || species.origin === DinosaurOrigin.HYBRID)
  );
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

type ExhibitOccupancy = Pick<AdmissionWorld, 'buildings' | 'dinosaurs' | 'safariLayout'>;

function compatibleHabitat(
  buildings: readonly Building[],
  dinosaur: AdmissionDinosaur,
  tile: Tile,
) {
  const species = resolveDinosaurSpecies(dinosaur);
  return buildings.find(
    (building) =>
      species?.habitat.some((tag) => building.typeId === `habitat-${tag}`) &&
      contains(building, tile),
  );
}

function occupiedHabitatRisk(
  buildings: readonly Building[],
  dinosaur: AdmissionDinosaur,
  tile: Tile,
  at: number,
) {
  const points = dinosaurExhibitRiskPoints(dinosaur);
  if (!points) return 0;
  const habitat = compatibleHabitat(buildings, dinosaur, tile);
  return habitat && activeAt(habitat, at) ? points : 0;
}

export function parkExhibitRiskPoints(world: ExhibitOccupancy, at: number) {
  const safari = world.safariLayout
    ? readSafariState(world.safariLayout).layout.zones.carnivore.dinosaurIds
    : [];
  const safariAssigned = new Set(safari);
  return world.dinosaurs.reduce((total, dinosaur) => {
    if (dinosaur.createdAt.getTime() > at) return total;
    if (!dinosaur.isInPark)
      return total + (safariAssigned.has(dinosaur.id) ? dinosaurExhibitRiskPoints(dinosaur) : 0);
    return (
      total +
      occupiedHabitatRisk(
        world.buildings,
        dinosaur,
        { x: dinosaur.positionX, y: dinosaur.positionY },
        at,
      )
    );
  }, 0);
}

export function safariExhibitSafetyIssue(
  world: ExhibitOccupancy,
  proposedCarnivores: readonly string[],
  at: number,
) {
  if (!proposedCarnivores.length) return null;
  const hasCenter = world.buildings.some(
    (building) => building.typeId === SECURITY_CENTER_TYPE_ID && activeAt(building, at),
  );
  if (!hasCenter) return '육식 우리에 공룡을 배치하려면 보안센터를 먼저 완공해주세요.';
  const proposed = new Set(proposedCarnivores);
  const existingRisk = parkExhibitRiskPoints(
    {
      ...world,
      safariLayout: null,
      dinosaurs: world.dinosaurs.filter(({ id }) => !proposed.has(id)),
    },
    at,
  );
  const safariRisk = world.dinosaurs.reduce(
    (sum, dinosaur) => sum + (proposed.has(dinosaur.id) ? dinosaurExhibitRiskPoints(dinosaur) : 0),
    0,
  );
  return existingRisk + safariRisk > SECURITY_CENTER_LEVEL_ONE_STATS.riskCapacity
    ? '다른 위험 전시를 정리해 보안 여유를 확보해주세요.'
    : null;
}

export function exhibitSafetyIssue(
  world: ExhibitOccupancy,
  dinosaur: AdmissionDinosaur,
  tile: Tile,
  at: number,
) {
  const required = dinosaurExhibitRiskPoints(dinosaur);
  if (!required) return null;
  const habitat = compatibleHabitat(world.buildings, dinosaur, tile);
  if (!habitat) return null;
  if (!activeAt(habitat, at)) return '공룡에 맞는 서식지를 먼저 완공해주세요.';
  // Occupied habitats use security even before a visitor path reaches them.
  if (
    dinosaur.isInPark &&
    occupiedHabitatRisk(
      world.buildings,
      dinosaur,
      { x: dinosaur.positionX, y: dinosaur.positionY },
      at,
    )
  )
    return null;

  const center = world.buildings.some(
    (building) => building.typeId === SECURITY_CENTER_TYPE_ID && activeAt(building, at),
  );
  if (!center) return '위험종을 배치하려면 보안센터를 먼저 완공해주세요.';
  return parkExhibitRiskPoints(world, at) + required > SECURITY_CENTER_LEVEL_ONE_STATS.riskCapacity
    ? '다른 위험 전시를 정리해 보안 여유를 확보해주세요.'
    : null;
}

export function footprint(building: Building): Tile[] {
  const { width, height } = buildingSize(building);
  return Array.from({ length: width * height }, (_, index) => ({
    x: building.positionX + (index % width),
    y: building.positionY + Math.floor(index / width),
  }));
}
function entrancePlot(building: Building) {
  return { x: building.positionX, y: building.positionY, ...buildingSize(building) };
}

export function entranceSides(
  building: Building,
  world: Pick<AdmissionWorld, 'gridSizeX' | 'gridSizeY'>,
) {
  return getParkEntranceSides(world.gridSizeX, world.gridSizeY, entrancePlot(building));
}

export function onBoundary(
  building: Building,
  world: Pick<AdmissionWorld, 'gridSizeX' | 'gridSizeY'>,
) {
  return entranceSides(building, world).length > 0;
}

function entranceSide(building: Building, world: Pick<AdmissionWorld, 'gridSizeX' | 'gridSizeY'>) {
  return resolveParkEntranceSide(
    world.gridSizeX,
    world.gridSizeY,
    entrancePlot(building),
    building.entranceSide,
  );
}

export function entranceExit(
  building: Building,
  world: Pick<AdmissionWorld, 'gridSizeX' | 'gridSizeY'>,
): Tile | null {
  const { x, y, width, height } = entrancePlot(building);
  switch (entranceSide(building, world)) {
    case 'bottom':
      return { x: x + Math.floor(width / 2), y: y - 1 };
    case 'right':
      return { x: x - 1, y: y + Math.floor(height / 2) };
    case 'top':
      return { x: x + Math.floor(width / 2), y: y + height };
    case 'left':
      return { x: x + width, y: y + Math.floor(height / 2) };
    case null:
      return null;
  }
}

export type DinosaurCareWorld = Pick<AdmissionWorld, 'buildings' | 'technologyResearch'>;
type CareDinosaur = Pick<Dinosaur, 'lastFedAt' | 'happiness' | 'hunger'> &
  Partial<
    Pick<
      Dinosaur,
      'careProgress' | 'speciesId' | 'positionX' | 'positionY' | 'isInPark' | 'hybridSpecies'
    >
  >;

const CARE_MS_PER_HOUR = 3_600_000;
const CARE_BOUNDARY_EPSILON_MS = 0.001;

function compatibleHabitatAvailableAt(dino: CareDinosaur, world: DinosaurCareWorld | undefined) {
  if (
    !dino.isInPark ||
    !dino.speciesId ||
    dino.positionX === undefined ||
    dino.positionY === undefined
  )
    return Infinity;
  const tile = { x: dino.positionX, y: dino.positionY };
  const species = resolveDinosaurSpecies({ ...dino, speciesId: dino.speciesId });
  let availableAt = Infinity;
  for (const building of world?.buildings ?? []) {
    if (
      !species?.habitat.some((tag) => building.typeId === `habitat-${tag}`) ||
      !contains(building, tile)
    )
      continue;
    const createdAt = building.createdAt.getTime();
    const start = building.status === 'ACTIVE' ? createdAt : (completionTime(building) ?? Infinity);
    availableAt = Math.min(availableAt, Math.max(createdAt, start));
  }
  return availableAt;
}

function dinosaurCareTimeline(dino: CareDinosaur, world: DinosaurCareWorld | undefined) {
  const fedAt = dino.lastFedAt.getTime();
  const checkpoint = dino.careProgress;
  const validCheckpoint =
    checkpoint &&
    !Array.isArray(checkpoint) &&
    typeof checkpoint === 'object' &&
    typeof checkpoint.at === 'number' &&
    Number.isFinite(checkpoint.at) &&
    checkpoint.at >= fedAt &&
    typeof checkpoint.savedMs === 'number' &&
    Number.isFinite(checkpoint.savedMs);
  const checkpointAt = validCheckpoint ? (checkpoint.at as number) : fedAt;
  const savedMs = validCheckpoint
    ? Math.max(0, Math.min(checkpoint.savedMs as number, checkpointAt - fedAt))
    : 0;
  const adaptationSteps = (world?.technologyResearch ?? [])
    .filter(({ technologyId }) => technologyId === ENVIRONMENT_ADAPTATION_RESEARCH.technologyId)
    .sort((left, right) => left.completesAt.getTime() - right.completesAt.getTime());
  const researchedAt = adaptationSteps[0]?.completesAt.getTime() ?? Infinity;
  const protectedFrom = adaptationSteps.length
    ? Math.max(checkpointAt, compatibleHabitatAvailableAt(dino, world))
    : Infinity;
  const phases: Array<{ from: number; saved: number; reduction: number }> = [];
  if (Number.isFinite(protectedFrom)) {
    for (const { level = 1, completesAt } of adaptationSteps) {
      const from = Math.max(protectedFrom, completesAt.getTime());
      const reduction = (TECHNOLOGY_RESEARCH_POLICY.careAdaptationPercent[level - 1] ?? 0) / 100;
      const previous = phases[phases.length - 1];
      if (reduction <= (previous?.reduction ?? 0)) continue;
      const saved = previous
        ? previous.saved + (from - previous.from) * previous.reduction
        : savedMs;
      phases.push({ from, saved, reduction });
    }
  }
  const savedAt = (at: number) => {
    for (let index = phases.length - 1; index >= 0; index--) {
      const phase = phases[index];
      if (at >= phase.from) return phase.saved + (at - phase.from) * phase.reduction;
    }
    return savedMs;
  };
  return {
    researchedAt,
    savedAt,
    elapsedAt: (at: number) => Math.max(0, at - fedAt - savedAt(at)),
    wallAt: (elapsed: number) => {
      let wall = fedAt + savedMs + elapsed;
      for (const { from, saved, reduction } of phases) {
        const elapsedBeforePhase = from - fedAt - saved;
        if (elapsed <= elapsedBeforePhase) break;
        wall = from + (elapsed - elapsedBeforePhase) / (1 - reduction);
      }
      return wall;
    },
  };
}

/** Preserve the exact decay phase before moving a dinosaur or changing habitat eligibility. */
export function dinosaurCareCheckpoint(dino: CareDinosaur, world: DinosaurCareWorld, at: number) {
  const timeline = dinosaurCareTimeline(dino, world);
  if (timeline.researchedAt > at) return undefined;
  return { at, savedMs: timeline.savedAt(at) };
}

export function dinosaurCareBoundaries(
  dino: CareDinosaur,
  world: DinosaurCareWorld,
  from: number,
  end: number,
) {
  const timeline = dinosaurCareTimeline(dino, world);
  const elapsed = timeline.elapsedAt(from) + CARE_BOUNDARY_EPSILON_MS;
  const times: number[] = [];
  for (const rate of [HAPPINESS_DECAY_PER_HOUR, HUNGER_INCREASE_PER_HOUR]) {
    const period = CARE_MS_PER_HOUR / rate;
    for (let next = (Math.floor(elapsed / period) + 1) * period; ; next += period) {
      const at = timeline.wallAt(next);
      if (at >= end) break;
      if (at > from) times.push(at);
    }
  }
  return times;
}

export function currentDinosaurState(dino: CareDinosaur, at: number, world?: DinosaurCareWorld) {
  const elapsed = dinosaurCareTimeline(dino, world).elapsedAt(at) + CARE_BOUNDARY_EPSILON_MS;
  const hours = elapsed / CARE_MS_PER_HOUR;
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
  const side = entrance && entranceSide(entrance, world);
  const boundaryReady = !!entrance && !!side && activeAt(entrance, at);
  const existingBuildings = world.buildings.filter(
    (building) => building.createdAt.getTime() <= at,
  );
  const placedDinosaurs = world.dinosaurs.filter((d) => d.isInPark && d.createdAt.getTime() <= at);
  const blocked = new Set(existingBuildings.flatMap(footprint).map(key));
  safariReservedTiles(world.safariLayout).forEach((tile) => blocked.add(key(tile)));
  // Free-roaming dinosaurs are not a safe visitor path. Habitats themselves remain fenced.
  placedDinosaurs.forEach((d) => blocked.add(key({ x: d.positionX, y: d.positionY })));
  const start = boundaryReady ? entranceExit(entrance!, world) : null;
  const walkable = new Map<string, VisitorRouteNode>();
  if (start && inside(start) && !blocked.has(key(start))) {
    const first: VisitorRouteNode = { tile: start, distance: 0, parent: null };
    const queue = [first];
    walkable.set(key(start), first);
    for (let i = 0; i < queue.length; i++) {
      const parent = queue[i];
      for (const tile of adjacent(parent.tile)) {
        const tileKey = key(tile);
        if (!inside(tile) || blocked.has(tileKey) || walkable.has(tileKey)) continue;
        const visit = { tile, distance: parent.distance + 1, parent };
        walkable.set(tileKey, visit);
        queue.push(visit);
      }
    }
  }
  const paths = new Map<string, Tile>();
  const access = new Map<string, Tile[]>();
  const visitorPaths = new Map<string, Tile[]>();
  const connect = (building: Building) => {
    const candidates = footprint(building)
      .flatMap(adjacent)
      .flatMap((tile) => walkable.get(key(tile)) ?? [])
      .sort((a, b) => a.distance - b.distance);
    const target = candidates[0];
    if (!target) return false;
    access.set(
      building.id,
      candidates.map(({ tile }) => tile),
    );
    const route: Tile[] = [];
    for (let current: VisitorRouteNode | null = target; current; current = current.parent) {
      paths.set(key(current.tile), current.tile);
      route.push(current.tile);
    }
    visitorPaths.set(building.id, route.reverse());
    return true;
  };
  const habitats = existingBuildings.filter(
    (b) =>
      getBuildingById(b.typeId)?.category === BuildingCategory.DINOSAUR &&
      activeAt(b, at) &&
      connect(b),
  );
  const platforms = existingBuildings.filter(
    (b) => b.typeId === PARK_ADMISSION.platformTypeId && activeAt(b, at) && connect(b),
  );
  type Exhibit = { id: string; dinosaurIds: string[]; interest: number };
  const exhibits = new Map<string, Exhibit>();
  const visible: AdmissionDinosaur[] = [];
  const groups = new Map<
    string,
    Array<{ id: string; appeal: number; quality: number; exhibit: Exhibit }>
  >();
  for (const dinosaur of placedDinosaurs) {
    const species = resolveDinosaurSpecies(dinosaur);
    if (!species) continue;
    const habitat = habitats.find(
      (building) =>
        contains(building, { x: dinosaur.positionX, y: dinosaur.positionY }) &&
        species.habitat.some((tag) => building.typeId === `habitat-${tag}`),
    );
    if (!habitat) continue;
    const exhibit = exhibits.get(habitat.id) ?? { id: habitat.id, dinosaurIds: [], interest: 0 };
    exhibit.dinosaurIds.push(dinosaur.id);
    exhibits.set(habitat.id, exhibit);
    visible.push(dinosaur);

    const state = currentDinosaurState(dinosaur, at, world);
    const quality = (0.5 + (0.5 * state.happiness) / 100) * (state.hunger > 80 ? 0.5 : 1);
    const appeal = dinosaurCompetitiveStats(dinosaur)?.appeal ?? species.stats.popularity;
    const group = groups.get(species.id) ?? [];
    group.push({ id: dinosaur.id, appeal, quality, exhibit });
    groups.set(species.id, group);
  }
  let attraction = 0,
    weightedQuality = 0;
  for (const group of groups.values()) {
    group
      .sort(
        (a, b) =>
          b.appeal * b.quality - a.appeal * a.quality ||
          b.quality - a.quality ||
          a.id.localeCompare(b.id, 'en'),
      )
      .slice(0, 3)
      .forEach((dino, rank) => {
        const weight = dino.appeal * [1, 0.25, 0.1][rank];
        attraction += weight;
        weightedQuality += weight * dino.quality;
        dino.exhibit.interest += weight * dino.quality;
      });
  }
  const quality = attraction ? weightedQuality / attraction : 0;
  const demand = (8 + 4 * attraction + 4 * Math.max(0, groups.size - 1)) * quality;
  const baseGateCapacity =
    entrance && boundaryReady ? (getBuildingById(entrance.typeId)?.baseStats.capacity ?? 100) : 0;
  const entryResearchLevel = (world.technologyResearch ?? []).reduce(
    (level, research) =>
      research.technologyId === ENTRANCE_RESEARCH.technologyId &&
      research.completesAt.getTime() <= at
        ? Math.max(level, research.level ?? 1)
        : level,
    0,
  );
  const entryBonus = TECHNOLOGY_RESEARCH_POLICY.entryBonusPercent[entryResearchLevel - 1] ?? 0;
  const gateCapacity = (baseGateCapacity * (100 + entryBonus)) / 100;
  const occupancyCapacity = exhibits.size
    ? PARK_ADMISSION.baseCapacity + (exhibits.size - 1) * PARK_ADMISSION.additionalExhibitCapacity
    : 0;
  const exhibitCapacity = (occupancyCapacity * 60) / PARK_ADMISSION.visitSeconds;
  const capacity = Math.min(gateCapacity, exhibitCapacity);
  const admittingVisitors = world.isOpen && boundaryReady && visible.length > 0;
  const healthy = visible.some((d) => {
    const s = currentDinosaurState(d, at, world);
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
  const exhibitsReceivingSecurity = world.buildings.some((building) =>
    hasExpandedSecurityCenter(building, at),
  )
    ? new Set(visible.map(({ id }) => id))
    : new Set<string>();
  const operatingVisitorsPerMinute = Math.min(demand, capacity);
  const shuttle = shuttleSnapshot({
    parkLevel: world.level ?? 0,
    shuttleService: world.shuttleService,
    buildings: world.buildings,
    exhibits,
    exhibitInterest: weightedQuality,
    visitorPaths,
    operatingVisitorsPerMinute,
    isOperating: admittingVisitors && careCompleted,
  });
  const hourlyMaintenance =
    world.dinosaurs
      .filter((d) => d.createdAt.getTime() <= at)
      .reduce((sum, dinosaur) => {
        const species = resolveDinosaurSpecies(dinosaur);
        if (!species) return sum;
        const reduction =
          exhibitsReceivingSecurity.has(dinosaur.id) && hasHazardousUpkeep(species)
            ? SECURITY_CENTER_LEVEL_TWO_UPGRADE.hazardousUpkeepReductionPercent / 100
            : 0;
        return sum + species.stats.maintenanceCost * (1 - reduction);
      }, 0) +
    world.buildings
      .filter((b) => activeAt(b, at))
      .reduce((sum, b) => sum + operatingMaintenance(b, at), 0) +
    shuttle.hourlyGold;
  return {
    entrance,
    entranceSide: side,
    boundaryReady,
    pathTiles: [...paths.values()],
    connectedHabitatIds: habitats.map((habitat) => habitat.id),
    connectedPlatformIds: platforms.map((platform) => platform.id),
    exhibitedDinosaurIds: visible.map((dinosaur) => dinosaur.id),
    requirements,
    canOpen: requirements.length === 0,
    demand,
    capacity,
    occupancyCapacity,
    gateCapacity,
    exhibitCapacity,
    exhibits,
    exhibitInterest: weightedQuality,
    platforms,
    walkable,
    access,
    visitorPaths,
    entranceResearchCompleted: entryResearchLevel > 0,
    admittingVisitors,
    visitorsPerMinute: admittingVisitors ? operatingVisitorsPerMinute : 0,
    hourlyMaintenance,
    shuttle,
  };
}

type AdmissionSnapshot = ReturnType<typeof admissionSnapshot>;

/** Route each platform to the closest active exhibit using accessible perimeter tiles. */
function platformAssignments(snapshot: AdmissionSnapshot) {
  type Route = { exhibitId: string; distance: number };
  const nearest = new Map<string, Route>();
  const queue: Tile[] = [];
  for (const exhibitId of [...snapshot.exhibits.keys()].sort((a, b) => a.localeCompare(b, 'en'))) {
    for (const tile of snapshot.access.get(exhibitId) ?? []) {
      const tileKey = key(tile);
      if (nearest.has(tileKey)) continue;
      nearest.set(tileKey, { exhibitId, distance: 0 });
      queue.push(tile);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const tile = queue[i];
    const route = nearest.get(key(tile))!;
    for (const nextTile of adjacent(tile)) {
      const nextKey = key(nextTile);
      if (!snapshot.walkable.has(nextKey) || nearest.has(nextKey)) continue;
      nearest.set(nextKey, { exhibitId: route.exhibitId, distance: route.distance + 1 });
      queue.push(nextTile);
    }
  }
  const assigned = new Map<string, string>();
  for (const platform of snapshot.platforms) {
    const routes = (snapshot.access.get(platform.id) ?? [])
      .flatMap((tile) => nearest.get(key(tile)) ?? [])
      .sort((a, b) => a.distance - b.distance || a.exhibitId.localeCompare(b.exhibitId, 'en'));
    if (routes[0]) assigned.set(platform.id, routes[0].exhibitId);
  }
  return assigned;
}

function exhibitViewingCapacity(deckLevel: number) {
  return deckLevel
    ? getViewingPlatformStats(deckLevel).capacity
    : PARK_ADMISSION.baseExhibitViewingCapacity;
}

function viewingExperience(
  visitors: number,
  deckLevel: number,
  travelPenalty = 0,
): ExhibitViewingExperience {
  const viewingCapacity = exhibitViewingCapacity(deckLevel);
  const crowdingPercent = visitors
    ? Math.round(100 * Math.max(0, 1 - viewingCapacity / visitors))
    : 0;
  const satisfactionPercent =
    Math.min(100, Math.round(75 + 5 * deckLevel - 0.3 * crowdingPercent)) - travelPenalty;
  return { crowdingPercent, satisfactionPercent };
}

export function admissionDiagnosis(
  snapshot: AdmissionSnapshot,
  platform: Building | undefined,
  at: number,
  occupancy = 0,
): NonNullable<ParkOperationsResponse['admission']> {
  const factors = [
    ['demand', snapshot.demand],
    ['entrance', snapshot.gateCapacity],
    ['exhibit', snapshot.exhibitCapacity],
  ] as const;
  const bottlenecks = snapshot.admittingVisitors
    ? factors
        .filter(([, rate]) => Math.abs(rate - snapshot.visitorsPerMinute) < 1e-9)
        .map(([id]) => id)
    : [];
  const assigned = snapshot.platforms.length
    ? platformAssignments(snapshot)
    : new Map<string, string>();
  const bestDeck = new Map<string, number>();
  for (const deck of snapshot.platforms) {
    const exhibitId = assigned.get(deck.id);
    if (!exhibitId) continue;
    const level = completedOperatingLevel(deck, at);
    bestDeck.set(exhibitId, Math.max(bestDeck.get(exhibitId) ?? 0, level));
  }
  const visitorShare = (interest: number) =>
    snapshot.exhibitInterest ? interest / snapshot.exhibitInterest : 1 / snapshot.exhibits.size;
  const allocations = [...snapshot.exhibits.values()].map(({ id, dinosaurIds, interest }) => {
    const estimated = occupancy * visitorShare(interest);
    const visitors = Math.floor(estimated);
    const deckLevel = bestDeck.get(id) ?? 0;
    const exhibit = {
      id,
      dinosaurIds,
      visitorPath: snapshot.visitorPaths.get(id),
      visitors,
      viewingCapacity: exhibitViewingCapacity(deckLevel),
      ...viewingExperience(estimated, deckLevel, snapshot.shuttle.penaltyByExhibit.get(id)),
    };
    return { exhibit, remainder: estimated - visitors };
  });
  // Distribute the rounding remainder without changing the total inside the park.
  const visitorsToAllocate =
    occupancy - allocations.reduce((sum, { exhibit }) => sum + exhibit.visitors, 0);
  const rankedRemainders = [...allocations].sort(
    (a, b) => b.remainder - a.remainder || a.exhibit.id.localeCompare(b.exhibit.id, 'en'),
  );
  for (const { exhibit } of rankedRemainders.slice(0, visitorsToAllocate)) exhibit.visitors++;
  const exhibits = allocations.map(({ exhibit }) => exhibit);
  let platformImpact: NonNullable<ParkOperationsResponse['admission']>['platformImpact'] = null;
  if (platform && (platform.status === 'ACTIVE' || platform.status === 'UPGRADING')) {
    const fromLevel = completedOperatingLevel(platform, at);
    const toLevel = platform.status === 'UPGRADING' ? platform.level : fromLevel + 1;
    const upgrade = toLevel > fromLevel ? getViewingPlatformUpgrade(toLevel) : undefined;
    if (upgrade) {
      const exhibitId = assigned.get(platform.id) ?? null;
      const exhibit = exhibitId ? snapshot.exhibits.get(exhibitId) : undefined;
      const typicalVisitors = exhibit
        ? (Math.min(snapshot.demand, snapshot.capacity) *
            PARK_ADMISSION.visitSeconds *
            visitorShare(exhibit.interest)) /
          60
        : 0;
      const effectiveLevel = exhibit ? (bestDeck.get(exhibit.id) ?? 0) : 0;
      const travelPenalty = exhibit ? snapshot.shuttle.penaltyByExhibit.get(exhibit.id) : 0;
      platformImpact = {
        buildingId: platform.id,
        fromLevel,
        toLevel: upgrade.targetLevel,
        exhibitId,
        before: exhibit ? viewingExperience(typicalVisitors, effectiveLevel, travelPenalty) : null,
        after: exhibit
          ? viewingExperience(
              typicalVisitors,
              Math.max(effectiveLevel, upgrade.targetLevel),
              travelPenalty,
            )
          : null,
      };
    }
  }
  return {
    gatePerMinute: snapshot.gateCapacity,
    exhibitPerMinute: snapshot.exhibitCapacity,
    exhibitCount: snapshot.exhibits.size,
    bottlenecks,
    entranceResearchCompleted: snapshot.entranceResearchCompleted,
    exhibitedDinosaurIds: snapshot.exhibitedDinosaurIds,
    exhibits,
    platformImpact,
  };
}
