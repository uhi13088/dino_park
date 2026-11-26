import {
  PARK_SAFARI,
  SAFARI_ZONES,
  emptySafariLayout,
  getSafariOccupiedTiles,
  type SafariLayout,
  type SafariTile,
  type SafariZoneKind,
} from '@dino-park/shared';

export interface SafariState {
  revision: number;
  layout: SafariLayout;
  purchasedTiles: Record<SafariZoneKind, number>;
  path: SafariTile[];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function readTiles(value: unknown, max: number) {
  if (!Array.isArray(value) || value.length > max) return null;
  const tiles: SafariTile[] = [];
  for (const item of value) {
    const point = record(item);
    if (
      !point ||
      typeof point.x !== 'number' ||
      typeof point.y !== 'number' ||
      !Number.isSafeInteger(point.x) ||
      !Number.isSafeInteger(point.y)
    )
      return null;
    tiles.push({ x: point.x, y: point.y });
  }
  return tiles;
}

export function readSafariLayout(value: unknown): SafariLayout | null {
  const input = record(value);
  const zones = record(input?.zones);
  const stops = readTiles(input?.stops, SAFARI_ZONES.length);
  if (!zones || !stops) return null;
  const layout = emptySafariLayout();
  layout.stops = stops;
  for (const kind of SAFARI_ZONES) {
    const zone = record(zones[kind]);
    const tiles = readTiles(zone?.tiles, PARK_SAFARI.maxTilesPerZone);
    const water = readTiles(zone?.water, PARK_SAFARI.waterPerZone);
    const brush = readTiles(zone?.brush, PARK_SAFARI.brushPerZone);
    const ids: unknown = zone?.dinosaurIds;
    if (
      !tiles ||
      !water ||
      !brush ||
      !Array.isArray(ids) ||
      ids.length > PARK_SAFARI.maxTilesPerZone ||
      !ids.every((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 128)
    )
      return null;
    layout.zones[kind] = { tiles, water, brush, dinosaurIds: ids };
  }
  return layout;
}

export function readSafariState(value: unknown): SafariState {
  const input = record(value);
  const layout = readSafariLayout(input?.layout) ?? emptySafariLayout();
  const purchasedTiles = record(input?.purchasedTiles);
  const paid = (kind: SafariZoneKind) => {
    const amount = purchasedTiles?.[kind];
    return typeof amount === 'number' && Number.isSafeInteger(amount)
      ? Math.min(PARK_SAFARI.maxTilesPerZone, Math.max(layout.zones[kind].tiles.length, amount))
      : layout.zones[kind].tiles.length;
  };
  const version = input?.revision;
  return {
    revision:
      typeof version === 'number' && Number.isSafeInteger(version) && version >= 0 ? version : 0,
    layout,
    purchasedTiles: {
      herbivore: paid('herbivore'),
      carnivore: paid('carnivore'),
    },
    path: readTiles(input?.path, 10000) ?? [],
  };
}

export function safariReservedTiles(value: unknown) {
  if (!value) return [];
  const { layout, path } = readSafariState(value);
  return getSafariOccupiedTiles(layout, path);
}

export function safariContainsDinosaur(value: unknown, id: string) {
  if (!value) return false;
  const { layout } = readSafariState(value);
  return SAFARI_ZONES.some((kind) => layout.zones[kind].dinosaurIds.includes(id));
}
