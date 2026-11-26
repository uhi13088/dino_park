import * as PIXI from 'pixi.js';
import type { ParkOperationsResponse } from '@dino-park/shared';
import { gridToScreen } from './IsometricGrid';
import { ParkShuttles } from './ParkShuttles';
import {
  drawParkBoundary,
  getEntranceThresholdOutline,
  getParkEntranceFrame,
  ParkExterior,
  type ParkEntranceFrame,
} from './ParkExterior';

export { PARK_MEADOW_COLOR, parkEnvironmentTexturePaths } from './ParkExterior';

type Tile = { x: number; y: number };

type VisitorGroup = {
  route: Tile[];
  walkers: PIXI.Graphics[];
  waiting: number;
  marker?: PIXI.Graphics;
};

const VISITOR_SHIRTS = [0xf5c667, 0xd77c63, 0x557eb0, 0x725b99, 0xf2f0d9];

/** Choose one connected walk through the server's road tiles. Never cross a habitat. */
export function getVisitorRoute(
  tiles: Tile[],
  entrance: ParkOperationsResponse['entrance'],
): Tile[] {
  if (!tiles.length || !entrance) return [];
  const key = (tile: Tile) => `${tile.x},${tile.y}`;
  const allowed = new Map(tiles.map((tile) => [key(tile), tile]));
  const center = {
    x: entrance.x + (entrance.width - 1) / 2,
    y: entrance.y + (entrance.height - 1) / 2,
  };
  const start = [...tiles].sort(
    (a, b) =>
      Math.abs(a.x - center.x) +
      Math.abs(a.y - center.y) -
      Math.abs(b.x - center.x) -
      Math.abs(b.y - center.y),
  )[0];
  const queue = [start];
  const previous = new Map<string, Tile | null>([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const tile = queue[i];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = allowed.get(`${tile.x + dx},${tile.y + dy}`);
      if (!next || previous.has(key(next))) continue;
      previous.set(key(next), tile);
      queue.push(next);
    }
  }
  const route: Tile[] = [];
  let tile: Tile | null = queue[queue.length - 1];
  while (tile) {
    route.unshift(tile);
    tile = previous.get(key(tile)) ?? null;
  }
  return route;
}

/** Map decoration mirrors server state; drawn visitors never award currency. */
export class ParkScenery {
  readonly exterior: ParkExterior;
  readonly ground = new PIXI.Graphics();
  readonly backFence = new PIXI.Graphics();
  readonly frontFence = new PIXI.Graphics();
  readonly visitors = new PIXI.Container();
  readonly shuttleTraffic = new PIXI.Container({ eventMode: 'none' });
  readonly crowdMarkers = new PIXI.Container({ eventMode: 'none' });
  private route: Tile[] = [];
  private groups = new Map<string | null, VisitorGroup>();
  private seconds = 0;
  private worldKey = '';
  private exteriorKey = '';
  private entranceFrame: ParkEntranceFrame | null = null;
  private entrancePreview: ParkEntranceFrame | null = null;
  private reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  private readonly shuttles: ParkShuttles;

  get shuttlePath() {
    return this.shuttles.path;
  }

  constructor(textures: Readonly<Record<string, PIXI.Texture>> = {}) {
    this.exterior = new ParkExterior(textures);
    this.shuttles = new ParkShuttles(textures, this.shuttleTraffic, this.reducedMotion);
  }

  setShuttleFocus(exhibitId: string | null): void {
    this.shuttles.focus(exhibitId);
  }

  previewEntrance(width: number, height: number, frame: ParkEntranceFrame | null): void {
    const previous = this.entrancePreview;
    if (
      previous?.side === frame?.side &&
      previous?.from === frame?.from &&
      previous?.to === frame?.to
    ) {
      return;
    }
    this.entrancePreview = frame;
    const visibleFrame = frame ?? this.entranceFrame;
    this.exterior.drawApproach(width, height, visibleFrame);
    drawParkBoundary(this.backFence, this.frontFence, width, height, visibleFrame);
  }

  sync(width: number, height: number, state: ParkOperationsResponse): void {
    this.shuttles.sync(state.shuttle);
    const exteriorKey = JSON.stringify([width, height, state.entrance]);
    const worldKey = JSON.stringify([width, height, state.pathTiles, state.entrance]);
    const frame = getParkEntranceFrame(width, height, state.entrance);
    if (exteriorKey !== this.exteriorKey) {
      this.exteriorKey = exteriorKey;
      this.entranceFrame = frame;
      this.exterior.draw(width, height, frame);
      if (this.entrancePreview) this.exterior.drawApproach(width, height, this.entrancePreview);
      drawParkBoundary(
        this.backFence,
        this.frontFence,
        width,
        height,
        this.entrancePreview ?? frame,
      );
    }
    if (worldKey !== this.worldKey) {
      this.worldKey = worldKey;
      this.route = getVisitorRoute(state.pathTiles, state.entrance);
      this.drawRoad(width, height, state.pathTiles, frame, state.entrance);
    }
    const visibleGroups = new Set<string | null>();
    let hasExhibitRoutes = false;
    for (const exhibit of state.admission?.exhibits ?? []) {
      const { id, visitorPath, visitors, crowdingPercent } = exhibit;
      if (!visitorPath || visitors === undefined) continue;
      hasExhibitRoutes = true;
      if (!visitorPath.length || visitors <= 0) continue;
      const count = Math.min(12, Math.ceil(visitors / 3));
      const waiting = Math.round((count * crowdingPercent) / 100);
      this.syncGroup(id, visitorPath, count, waiting);
      visibleGroups.add(id);
    }

    if (!hasExhibitRoutes && this.route.length > 1) {
      const visitorsOnMap = state.occupancy
        ? Math.ceil(state.occupancy.current / 4)
        : state.isOpen && state.visitorsPerMinute > 0
          ? Math.max(3, Math.ceil(state.visitorsPerMinute / 4))
          : 0;
      if (visitorsOnMap > 0) {
        this.syncGroup(null, this.route, Math.min(10, visitorsOnMap), 0);
        visibleGroups.add(null);
      }
    }

    for (const [id, group] of this.groups) {
      if (visibleGroups.has(id)) continue;
      for (const graphic of group.walkers) graphic.destroy();
      group.marker?.destroy();
      this.groups.delete(id);
    }
    this.update(0);
  }

  private syncGroup(id: string | null, path: Tile[], count: number, waiting: number): void {
    const route = path.map(({ x, y }) => gridToScreen(x, y));
    const group = this.groups.get(id) ?? { route, walkers: [], waiting };
    group.route = route;
    group.waiting = waiting;
    this.groups.set(id, group);

    while (group.walkers.length > count) group.walkers.pop()?.destroy();
    for (let i = group.walkers.length; i < count; i++) {
      const graphic = new PIXI.Graphics()
        .ellipse(0, 1, 4, 2)
        .fill({ color: 0x25452c, alpha: 0.22 })
        .moveTo(-1.8, -2)
        .lineTo(-2.4, 1)
        .moveTo(1.8, -2)
        .lineTo(2.4, 1)
        .stroke({ color: 0x344d51, width: 2 })
        .roundRect(-3.5, -8, 7, 7, 2)
        .fill(VISITOR_SHIRTS[i % VISITOR_SHIRTS.length])
        .stroke({ color: 0x344331, width: 0.7, alpha: 0.75 })
        .circle(0, -11, 3.5)
        .fill(0xe3b38b)
        .ellipse(0, -13, 4.5, 1.8)
        .fill(i % 2 ? 0x6b553f : 0xf1dd9d);
      graphic.eventMode = 'none';
      this.visitors.addChild(graphic);
      group.walkers.push(graphic);
    }

    if (waiting === 0) {
      group.marker?.destroy();
      group.marker = undefined;
      return;
    }
    if (!group.marker) {
      group.marker = new PIXI.Graphics()
        .poly([-11, -6, 11, -6, 11, 7, 2, 7, -2, 11, -2, 7, -11, 7])
        .fill({ color: 0xffc36a, alpha: 0.96 })
        .stroke({ color: 0x673a24, width: 1.5, join: 'round' })
        .roundRect(-1.2, -3.8, 2.4, 5.5, 1)
        .fill(0x673a24)
        .circle(0, 4.2, 1.2)
        .fill(0x673a24);
      this.crowdMarkers.addChild(group.marker);
    }
    const destination = route[route.length - 1];
    group.marker.position.set(destination.x + 10, destination.y - 23);
  }

  update(deltaMs: number): void {
    this.shuttles.update(deltaMs);
    if (this.groups.size === 0 || (this.reducedMotion && deltaMs > 0)) return;
    if (!this.reducedMotion) this.seconds += deltaMs / 1000;
    for (const [id, { route, walkers, waiting }] of this.groups) {
      const distance = route.length - 1;
      const viewing = id === null ? 0 : Math.ceil((walkers.length - waiting) / 2);
      const standing = distance === 0 ? walkers.length : waiting + viewing;
      for (let i = 0; i < walkers.length; i++) {
        const graphic = walkers[i];
        if (i < waiting) {
          // A short line forms on the approach rather than on the habitat itself.
          const position = Math.max(0, distance - Math.floor(i / 2) * 0.36);
          this.positionVisitor(graphic, route, position, i % 2 ? -5 : 5, 0);
        } else if (i < standing) {
          const viewer = i - waiting;
          this.positionVisitor(
            graphic,
            route,
            distance,
            ((viewer % 4) - 1.5) * 8,
            Math.floor(viewer / 4) * 5 - 5,
          );
        } else {
          const phase = (i - standing) / (walkers.length - standing);
          const progress = (this.seconds / 2 + phase * distance * 2) % (distance * 2);
          const position = progress <= distance ? progress : distance * 2 - progress;
          this.positionVisitor(graphic, route, position, id !== null && i % 2 ? 4 : 0, 0);
        }
      }
    }
  }

  private positionVisitor(
    graphic: PIXI.Graphics,
    route: Tile[],
    position: number,
    offsetX: number,
    offsetY: number,
  ): void {
    const index = Math.floor(position);
    const ratio = position - index;
    const a = route[index];
    const b = route[index + 1] ?? a;
    graphic.position.set(a.x + (b.x - a.x) * ratio + offsetX, a.y + (b.y - a.y) * ratio + offsetY);
    graphic.alpha = this.reducedMotion ? 1 : Math.min(1, 0.2 + position * 2);
  }

  private drawRoad(
    width: number,
    height: number,
    tiles: Tile[],
    frame: ParkEntranceFrame | null,
    entrance: ParkOperationsResponse['entrance'],
  ): void {
    this.ground.clear();
    if (frame && entrance) {
      const threshold = getEntranceThresholdOutline(width, height, frame, entrance, tiles);
      this.ground
        .poly(
          threshold.flatMap((tile) => {
            const { x, y } = gridToScreen(tile.x, tile.y);
            return [x, y];
          }),
        )
        .fill(0xcebc8d);
    }
    for (const tile of tiles) {
      const { x, y } = gridToScreen(tile.x, tile.y);
      this.ground.poly([x, y - 16, x + 32, y, x, y + 16, x - 32, y]).fill(0xc9b686);
      this.ground
        .poly([x, y - 12, x + 24, y, x, y + 12, x - 24, y])
        .stroke({ color: 0xe7d7ac, width: 1, alpha: 0.6 });
    }
  }
}
