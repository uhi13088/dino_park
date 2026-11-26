import { PARK_SAFARI, SAFARI_ZONES } from '../constants/safari.constants';
import type {
  SafariBounds,
  SafariGate,
  SafariLayout,
  SafariSighting,
  SafariTile,
  SafariTour,
  SafariZone,
  SafariZoneKind,
} from '../types/safari.types';

const key = ({ x, y }: SafariTile) => `${x},${y}`;
const neighbors = ({ x, y }: SafariTile): SafariTile[] => [
  { x: x - 1, y },
  { x: x + 1, y },
  { x, y: y - 1 },
  { x, y: y + 1 },
];
const inside = ({ x, y }: SafariTile, { width, height }: SafariBounds) =>
  x >= 0 && y >= 0 && x < width && y < height;

export function emptySafariLayout(): SafariLayout {
  return {
    zones: {
      herbivore: { tiles: [], dinosaurIds: [], water: [], brush: [] },
      carnivore: { tiles: [], dinosaurIds: [], water: [], brush: [] },
    },
    stops: [],
  };
}

export function getSafariOccupiedTiles(
  layout: SafariLayout,
  path: readonly SafariTile[] = [],
): SafariTile[] {
  return [
    ...new Map(
      [...SAFARI_ZONES.flatMap((kind) => layout.zones[kind].tiles), ...layout.stops, ...path].map(
        (tile) => [key(tile), tile],
      ),
    ).values(),
  ];
}

export function getSafariExpansionGold(
  layout: SafariLayout,
  purchasedTiles: Record<SafariZoneKind, number>,
) {
  return (
    SAFARI_ZONES.reduce(
      (sum, kind) => sum + Math.max(0, layout.zones[kind].tiles.length - purchasedTiles[kind]),
      0,
    ) * PARK_SAFARI.tileGold
  );
}

function flood(start: SafariTile, canVisit: (tile: SafariTile) => boolean, goal?: SafariTile) {
  const visited = new Map<string, SafariTile | null>([[key(start), null]]);
  const queue = [start];
  const target = goal && key(goal);
  for (let i = 0; i < queue.length; i++) {
    const tile = queue[i];
    if (target === key(tile)) break;
    for (const next of neighbors(tile)) {
      const id = key(next);
      if (!visited.has(id) && canVisit(next)) {
        visited.set(id, tile);
        queue.push(next);
      }
    }
  }
  return visited;
}

function hasEnclosedGap(tiles: SafariTile[], tileKeys: Set<string>) {
  const left = Math.min(...tiles.map(({ x }) => x)) - 1;
  const right = Math.max(...tiles.map(({ x }) => x)) + 1;
  const top = Math.min(...tiles.map(({ y }) => y)) - 1;
  const bottom = Math.max(...tiles.map(({ y }) => y)) + 1;
  const outside = flood(
    { x: left, y: top },
    (tile) =>
      tile.x >= left &&
      tile.x <= right &&
      tile.y >= top &&
      tile.y <= bottom &&
      !tileKeys.has(key(tile)),
  );
  return outside.size + tiles.length !== (right - left + 1) * (bottom - top + 1);
}

function trace(parents: ReadonlyMap<string, SafariTile | null>, start: SafariTile) {
  const path: SafariTile[] = [];
  for (let tile: SafariTile | null = start; tile; tile = parents.get(key(tile)) ?? null) {
    path.push(tile);
  }
  return path;
}

function meetsCarnivoreSize(tiles: readonly SafariTile[]) {
  if (tiles.length < PARK_SAFARI.minTiles.carnivore) return false;
  const x = tiles.map((tile) => tile.x);
  const y = tiles.map((tile) => tile.y);
  return (
    Math.max(...x) - Math.min(...x) + 1 >= PARK_SAFARI.carnivoreMinSpan &&
    Math.max(...y) - Math.min(...y) + 1 >= PARK_SAFARI.carnivoreMinSpan
  );
}

export function getSafariCarnivoreSizeIssue(
  tiles: readonly SafariTile[],
  existingTiles: readonly SafariTile[] = [],
): string | null {
  if (!tiles.length || meetsCarnivoreSize(tiles)) return null;
  if (existingTiles.length && !meetsCarnivoreSize(existingTiles)) {
    const floor = new Set(tiles.map(key));
    if (existingTiles.every((tile) => floor.has(key(tile)))) return null;
  }
  return `육식 우리는 최소 ${PARK_SAFARI.minTiles.carnivore}칸을 이어, 가로와 세로가 각각 ${PARK_SAFARI.carnivoreMinSpan}칸 이상이 되게 만들어주세요.`;
}

function minimumInternalTiles(enclosure: SafariZone) {
  return meetsCarnivoreSize(enclosure.tiles) ? 4 : 3;
}

function getSafariRoute(layout: SafariLayout, bounds: SafariBounds, occupied: Set<string>) {
  const [start, goal] = layout.stops;
  const enclosure = layout.zones.carnivore;
  const obstructions = new Set([...enclosure.brush, ...enclosure.water].map(key));
  const minInterior = minimumInternalTiles(enclosure);
  const insideTiles = new Set(enclosure.tiles.map(key).filter((tile) => !obstructions.has(tile)));
  const approach = flood(start, (tile) => inside(tile, bounds) && !occupied.has(key(tile)));
  const interior = flood(goal, (tile) => insideTiles.has(key(tile)));
  let shortest: SafariTile[] = [];
  for (const tile of enclosure.tiles) {
    if (!interior.has(key(tile))) continue;
    const towardsStop = trace(interior, tile);
    if (
      towardsStop.length < minInterior ||
      enclosure.tiles.length - towardsStop.length < enclosure.dinosaurIds.length
    )
      continue;
    for (const exterior of neighbors(tile)) {
      if (!approach.has(key(exterior))) continue;
      const path = [...trace(approach, exterior).reverse(), ...towardsStop];
      if (!shortest.length || path.length < shortest.length) shortest = path;
    }
  }
  return shortest;
}

function firstInteriorIndex(layout: SafariLayout, path: readonly SafariTile[]) {
  const enclosure = new Set(layout.zones.carnivore.tiles.map(key));
  return path.findIndex((tile) => enclosure.has(key(tile)));
}

export function getSafariGate(
  layout: SafariLayout,
  path: readonly SafariTile[],
): SafariGate | null {
  const entry = firstInteriorIndex(layout, path);
  return entry > 0 ? { outside: path[entry - 1], inside: path[entry] } : null;
}

/** Preserve a previously chosen drive when the pens and scenery still leave it passable. */
export function isSafariRouteUsable(
  layout: SafariLayout,
  bounds: SafariBounds,
  blockedTiles: readonly SafariTile[],
  path: readonly SafariTile[],
) {
  if (!path.length || layout.stops.length !== 2) return false;
  if (key(path[0]) !== key(layout.stops[0]) || key(path[path.length - 1]) !== key(layout.stops[1]))
    return false;
  const entry = firstInteriorIndex(layout, path);
  const internalLength = path.length - entry;
  const carnivores = layout.zones.carnivore;
  if (
    entry < 1 ||
    internalLength < minimumInternalTiles(carnivores) ||
    carnivores.tiles.length - internalLength < carnivores.dinosaurIds.length
  )
    return false;
  const interior = new Set(carnivores.tiles.map(key));
  const forbidden = new Set(
    [
      ...blockedTiles,
      ...layout.zones.herbivore.tiles,
      ...carnivores.water,
      ...carnivores.brush,
    ].map(key),
  );
  const visited = new Set<string>();
  return path.every((tile, index) => {
    const id = key(tile);
    if (
      !inside(tile, bounds) ||
      visited.has(id) ||
      forbidden.has(id) ||
      interior.has(id) !== index >= entry ||
      (index > 0 && !neighbors(path[index - 1]).some((neighbor) => key(neighbor) === id))
    )
      return false;
    visited.add(id);
    return true;
  });
}

export function inspectSafariLayout(
  layout: SafariLayout,
  bounds: SafariBounds,
  blockedTiles: readonly SafariTile[],
  { existingCarnivoreTiles }: { existingCarnivoreTiles?: readonly SafariTile[] } = {},
): { issue: string | null; path: SafariTile[] } {
  const fail = (issue: string) => ({ issue, path: [] });
  const occupied = new Set(blockedTiles.map(key));
  for (const kind of SAFARI_ZONES) {
    const { tiles, water, brush, dinosaurIds } = layout.zones[kind];
    const title = kind === 'herbivore' ? '초식 우리' : '육식 우리';
    if (kind === 'carnivore') {
      const sizeIssue = getSafariCarnivoreSizeIssue(tiles, existingCarnivoreTiles);
      if (sizeIssue) return fail(sizeIssue);
    } else if (tiles.length && tiles.length < PARK_SAFARI.minTiles.herbivore) {
      return fail(`${title}를 최소 ${PARK_SAFARI.minTiles.herbivore}칸까지 넓혀주세요.`);
    }
    if (tiles.length > PARK_SAFARI.maxTilesPerZone)
      return fail(`${title}는 최대 ${PARK_SAFARI.maxTilesPerZone}칸까지 배치할 수 있어요.`);
    const tileKeys = new Set(tiles.map(key));
    if (tileKeys.size !== tiles.length) return fail('같은 칸은 한 번만 선택할 수 있어요.');
    if (tiles.some((tile) => !inside(tile, bounds) || occupied.has(key(tile))))
      return fail('보유 부지에서 시설·관람길·다른 우리와 겹치지 않는 칸을 골라주세요.');
    if (tiles.length && flood(tiles[0], (tile) => tileKeys.has(key(tile))).size !== tiles.length)
      return fail('우리 칸들은 변이 닿도록 이어주세요.');
    if (tiles.length && hasEnclosedGap(tiles, tileKeys))
      return fail('울타리 안의 빈 칸이 남지 않게 채워주세요.');
    if (!tiles.length && dinosaurIds.length) return fail('공룡을 배치할 우리를 먼저 만들어주세요.');
    if (water.length > PARK_SAFARI.waterPerZone || brush.length > PARK_SAFARI.brushPerZone)
      return fail('우리 한 곳에 둘 수 있는 물가나 수풀의 수를 확인해주세요.');
    const props = [...water, ...brush].map(key);
    if (new Set(props).size !== props.length || props.some((id) => !tileKeys.has(id)))
      return fail('물가와 수풀은 울타리 안의 서로 다른 칸에 놓아주세요.');
    tileKeys.forEach((id) => occupied.add(id));
  }
  const { stops } = layout;
  if (!stops.length) return { issue: null, path: [] };
  if (stops.length !== 2 || key(stops[0]) === key(stops[1]))
    return fail('초식 우리 밖과 육식 우리 안에 정차 지점을 하나씩 정해주세요.');
  const [herbivoreStop, carnivoreStop] = stops;
  const adjacent = new Set(neighbors(herbivoreStop).map(key));
  if (
    !inside(herbivoreStop, bounds) ||
    occupied.has(key(herbivoreStop)) ||
    !layout.zones.herbivore.tiles.some((tile) => adjacent.has(key(tile)))
  )
    return fail('첫 정차 지점은 초식 울타리에 변이 닿는 바깥 빈 칸에 놓아주세요.');
  const carnivores = layout.zones.carnivore;
  if (
    !carnivores.tiles.some((tile) => key(tile) === key(carnivoreStop)) ||
    [...carnivores.water, ...carnivores.brush].some((tile) => key(tile) === key(carnivoreStop))
  )
    return fail('두 번째 정차 지점은 물가와 수풀이 없는 육식 우리 안에 놓아주세요.');
  const path = getSafariRoute(layout, bounds, occupied);
  return path.length
    ? { issue: null, path }
    : fail(
        `출입문을 지나 우리 안에서 ${minimumInternalTiles(carnivores) - 1}칸 이상 달릴 수 있도록 빈 통로를 이어주세요.`,
      );
}

export function getSafariLayoutIssue(
  layout: SafariLayout,
  bounds: SafariBounds,
  blockedTiles: readonly SafariTile[],
  options?: Parameters<typeof inspectSafariLayout>[3],
) {
  return inspectSafariLayout(layout, bounds, blockedTiles, options).issue;
}

function brushBlocks(start: SafariTile, end: SafariTile, brush: Set<string>) {
  let { x, y } = start;
  const dx = Math.abs(end.x - x);
  const dy = -Math.abs(end.y - y);
  const sx = Math.sign(end.x - x);
  const sy = Math.sign(end.y - y);
  let error = dx + dy;
  while (x !== end.x || y !== end.y) {
    const nextError = error * 2;
    if (nextError >= dy) {
      x += sx;
      error += dy;
    }
    if (nextError <= dx) {
      y += sy;
      error += dx;
    }
    if (brush.has(key({ x, y }))) return true;
  }
  return false;
}

const distance = (left: SafariTile, right: SafariTile) =>
  Math.hypot(left.x - right.x, left.y - right.y);

export function getSafariDinosaurPositions(
  zone: SafariZone,
  reservedPath: readonly SafariTile[] = [],
): SafariSighting[] {
  if (!zone.dinosaurIds.length || !zone.tiles.length) return [];
  const center = {
    x: zone.tiles.reduce((sum, tile) => sum + tile.x, 0) / zone.tiles.length,
    y: zone.tiles.reduce((sum, tile) => sum + tile.y, 0) / zone.tiles.length,
  };
  const cover = new Set(zone.brush.map(key));
  const reserved = new Set(reservedPath.map(key));
  const available = new Map(
    zone.tiles.filter((tile) => !reserved.has(key(tile))).map((tile) => [key(tile), tile]),
  );
  return zone.dinosaurIds.flatMap((dinosaurId, index) => {
    const water = zone.water.length ? zone.water[index % zone.water.length] : undefined;
    const tile = [...available.values()].sort(
      (a, b) =>
        Number(cover.has(key(a))) - Number(cover.has(key(b))) ||
        distance(a, water ?? center) - distance(b, water ?? center) ||
        a.y - b.y ||
        a.x - b.x,
    )[0];
    if (!tile) return [];
    available.delete(key(tile));
    return {
      dinosaurId,
      tile,
      behavior: water && distance(tile, water) <= 1 ? 'drinking' : 'resting',
    };
  });
}

export function getSafariTour(layout: SafariLayout, path: SafariTile[]): SafariTour | null {
  if (!path.length || layout.stops.length !== 2) return null;
  const gate = getSafariGate(layout, path);
  if (!gate) return null;
  const brush = new Set(SAFARI_ZONES.flatMap((kind) => layout.zones[kind].brush.map(key)));
  return {
    path,
    gate,
    views: SAFARI_ZONES.map((zoneKind, index) => {
      const tile = layout.stops[index];
      const positions = getSafariDinosaurPositions(layout.zones[zoneKind], path);
      const sightings = positions.filter(
        (sighting) =>
          distance(tile, sighting.tile) <= PARK_SAFARI.maxViewDistance &&
          !brushBlocks(tile, sighting.tile, brush),
      );
      return { tile, zoneKind, sightings, hiddenCount: positions.length - sightings.length };
    }),
  };
}
