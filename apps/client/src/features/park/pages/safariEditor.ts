import {
  getSafariCarnivoreSizeIssue,
  PARK_SAFARI,
  type SafariLayout,
  type SafariTile,
  type SafariZoneKind,
} from '@dino-park/shared';

export const safariZones = ['herbivore', 'carnivore'] as const;

export const safariZoneLabels: Record<SafariZoneKind, string> = {
  herbivore: '초식 구역',
  carnivore: '육식 구역',
};

export type SafariTool = 'fence' | 'water' | 'brush' | 'stop';
export type SafariStops = [SafariTile | null, SafariTile | null];
export type SafariDraft = Omit<SafariLayout, 'stops'> & { stops: SafariStops };

export const safariTileKey = ({ x, y }: SafariTile) => `${x},${y}`;
export const sameSafariTile = (a: SafariTile, b: SafariTile) => a.x === b.x && a.y === b.y;
export const safariAdjacent = (a: SafariTile, b: SafariTile) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

export function createSafariDraft(layout: SafariLayout): SafariDraft {
  return { ...layout, stops: [layout.stops[0] ?? null, layout.stops[1] ?? null] };
}

export function safariDraftLayout(draft: SafariDraft): SafariLayout {
  return { ...draft, stops: draft.stops.filter((tile): tile is SafariTile => tile !== null) };
}

function toggleTile(tiles: SafariTile[], tile: SafariTile, remove: boolean) {
  if (remove) return tiles.filter((entry) => !sameSafariTile(tile, entry));
  if (tiles.some((entry) => sameSafariTile(tile, entry))) return tiles;
  return [...tiles, tile];
}

export function applySafariTool(
  draft: SafariDraft,
  zoneKind: SafariZoneKind,
  tool: SafariTool,
  tile: SafariTile,
  remove: boolean,
  blocked: ReadonlySet<string>,
  existingCarnivoreTiles: readonly SafariTile[],
): { draft: SafariDraft; message?: string } {
  const zone = draft.zones[zoneKind];
  const other = draft.zones[zoneKind === 'herbivore' ? 'carnivore' : 'herbivore'];
  const here = zone.tiles.some((entry) => sameSafariTile(entry, tile));
  const stopped = draft.stops.some((stop) => stop && sameSafariTile(stop, tile));
  const hasFeature = (type: 'water' | 'brush') =>
    zone[type].some((entry) => sameSafariTile(entry, tile));
  if (tool === 'stop') {
    if (remove) return { draft: { ...draft, stops: [null, null] } };
    if (zoneKind === 'carnivore') {
      if (!here || hasFeature('water') || hasFeature('brush'))
        return { draft, message: '육식 우리 안에서 물가와 수풀이 없는 곳을 골라주세요.' };
    } else if (
      blocked.has(safariTileKey(tile)) ||
      here ||
      other.tiles.some((entry) => sameSafariTile(entry, tile)) ||
      !zone.tiles.some((entry) => safariAdjacent(entry, tile))
    ) {
      return { draft, message: '초식 우리 바깥에서 울타리에 붙은 빈 곳을 골라주세요.' };
    }

    const nextStops: SafariStops = [...draft.stops];
    const index = zoneKind === 'herbivore' ? 0 : 1;
    const otherStop = nextStops[1 - index];
    if (otherStop && sameSafariTile(otherStop, tile))
      return { draft, message: '두 정차 지점에는 서로 다른 자리가 필요해요.' };
    nextStops[index] = tile;
    return { draft: { ...draft, stops: nextStops } };
  }

  if (tool === 'fence') {
    if (!remove && !here) {
      if (
        blocked.has(safariTileKey(tile)) ||
        stopped ||
        other.tiles.some((entry) => sameSafariTile(entry, tile))
      )
        return { draft, message: '시설, 관람길, 정차 지점이 없는 빈 자리를 골라주세요.' };
      if (zone.tiles.length >= PARK_SAFARI.maxTilesPerZone)
        return { draft, message: '이 구역은 더 넓힐 수 없어요.' };
      if (zone.tiles.length > 0 && !zone.tiles.some((entry) => safariAdjacent(entry, tile)))
        return { draft, message: '울타리 변에 닿는 곳을 골라주세요.' };
    }
    const next = toggleTile(zone.tiles, tile, remove);
    if (next.length === zone.tiles.length) return { draft };
    if (remove && zone.dinosaurIds.length > 0) {
      const tooSmall =
        zoneKind === 'carnivore'
          ? !next.length || !!getSafariCarnivoreSizeIssue(next, existingCarnivoreTiles)
          : next.length < PARK_SAFARI.minTiles.herbivore;
      if (tooSmall) return { draft, message: '이만큼 줄이려면 공룡을 먼저 빼주세요.' };
    }
    const stops = next.length === 0 ? ([null, null] as SafariStops) : draft.stops;
    return {
      draft: {
        zones: {
          ...draft.zones,
          [zoneKind]: {
            ...zone,
            tiles: next,
            water: remove ? toggleTile(zone.water, tile, true) : zone.water,
            brush: remove ? toggleTile(zone.brush, tile, true) : zone.brush,
          },
        },
        stops,
      },
    };
  }

  if (!here) return { draft, message: '선택한 우리 안에서 자리를 골라주세요.' };
  if (!remove && stopped) return { draft, message: '정차 지점은 비워주세요.' };
  if (!remove && !hasFeature(tool)) {
    const limit = tool === 'water' ? PARK_SAFARI.waterPerZone : PARK_SAFARI.brushPerZone;
    if (zone[tool].length >= limit)
      return { draft, message: '다른 자리에 두려면 지금 놓인 장식을 먼저 눌러주세요.' };
  }
  const replaced = tool === 'water' ? 'brush' : 'water';
  return {
    draft: {
      ...draft,
      zones: {
        ...draft.zones,
        [zoneKind]: {
          ...zone,
          [tool]: toggleTile(zone[tool], tile, remove),
          [replaced]: remove ? zone[replaced] : toggleTile(zone[replaced], tile, true),
        },
      },
    },
  };
}
