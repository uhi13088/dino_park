import * as PIXI from 'pixi.js';
import type { ParkOperationsResponse } from '@dino-park/shared';
import { gridToScreen } from './IsometricGrid';

type Tile = { x: number; y: number };

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
  readonly ground = new PIXI.Graphics();
  readonly backFence = new PIXI.Graphics();
  readonly frontFence = new PIXI.Graphics();
  readonly visitors = new PIXI.Container();
  private route: Tile[] = [];
  private walkers: Array<{ graphic: PIXI.Graphics; offset: number }> = [];
  private seconds = 0;
  private worldKey = '';
  private reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  sync(width: number, height: number, state: ParkOperationsResponse): void {
    const worldKey = JSON.stringify([width, height, state.pathTiles, state.entrance]);
    if (worldKey !== this.worldKey) {
      this.worldKey = worldKey;
      this.route = getVisitorRoute(state.pathTiles, state.entrance);
      this.drawRoad(state.pathTiles);
      this.drawBoundary(width, height, state.entrance);
    }
    const count =
      state.isOpen && state.visitorsPerMinute > 0 && this.route.length > 1
        ? Math.min(10, Math.max(3, Math.ceil(state.visitorsPerMinute / 4)))
        : 0;
    if (count === this.walkers.length) return;
    for (const { graphic } of this.walkers) graphic.destroy();
    this.walkers = [];
    const shirts = [0xf5c667, 0xd77c63, 0x557eb0, 0x725b99, 0xf2f0d9];
    for (let i = 0; i < count; i++) {
      const graphic = new PIXI.Graphics()
        .ellipse(0, 1, 4, 2)
        .fill({ color: 0x25452c, alpha: 0.22 })
        .moveTo(-1.8, -2)
        .lineTo(-2.4, 1)
        .moveTo(1.8, -2)
        .lineTo(2.4, 1)
        .stroke({ color: 0x344d51, width: 2 })
        .roundRect(-3.5, -8, 7, 7, 2)
        .fill(shirts[i % shirts.length])
        .circle(0, -11, 3.5)
        .fill(0xe3b38b)
        .ellipse(0, -13, 4.5, 1.8)
        .fill(i % 2 ? 0x6b553f : 0xf1dd9d);
      graphic.eventMode = 'none';
      this.visitors.addChild(graphic);
      this.walkers.push({ graphic, offset: i / count });
    }
    this.update(0);
  }

  update(deltaMs: number): void {
    if (this.route.length < 2) return;
    if (!this.reducedMotion) this.seconds += deltaMs / 1000;
    const distance = this.route.length - 1;
    for (const { graphic, offset } of this.walkers) {
      const progress = (this.seconds / 2 + offset * distance * 2) % (distance * 2);
      const position = progress <= distance ? progress : distance * 2 - progress;
      const index = Math.min(this.route.length - 2, Math.floor(position));
      const ratio = position - index;
      const a = this.route[index],
        b = this.route[index + 1];
      const point = gridToScreen(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio);
      graphic.position.set(point.x, point.y);
    }
  }

  private drawRoad(tiles: Tile[]): void {
    this.ground.clear();
    for (const tile of tiles) {
      const { x, y } = gridToScreen(tile.x, tile.y);
      this.ground.poly([x, y - 16, x + 32, y, x, y + 16, x - 32, y]).fill(0xc9b686);
      this.ground
        .poly([x, y - 12, x + 24, y, x, y + 12, x - 24, y])
        .stroke({ color: 0xe7d7ac, width: 1, alpha: 0.6 });
    }
  }

  private drawBoundary(
    width: number,
    height: number,
    entrance: ParkOperationsResponse['entrance'],
  ): void {
    this.backFence.clear();
    this.frontFence.clear();
    const gap = (side: 'left' | 'right' | 'top' | 'bottom', index: number) => {
      if (!entrance?.onBoundary) return false;
      if (
        (side === 'left' && entrance.x === 0) ||
        (side === 'right' && entrance.x + entrance.width === width)
      ) {
        return index >= entrance.y && index < entrance.y + entrance.height;
      }
      if (
        (side === 'top' && entrance.y === 0) ||
        (side === 'bottom' && entrance.y + entrance.height === height)
      ) {
        return index >= entrance.x && index < entrance.x + entrance.width;
      }
      return false;
    };
    const segment = (graphics: PIXI.Graphics, a: Tile, b: Tile) => {
      const start = gridToScreen(a.x, a.y),
        end = gridToScreen(b.x, b.y);
      for (const elevation of [7, 15]) {
        graphics
          .moveTo(start.x, start.y - elevation)
          .lineTo(end.x, end.y - elevation)
          .stroke({ color: 0x9b6d41, width: 3 });
      }
      for (const point of [start, end]) {
        graphics
          .moveTo(point.x, point.y + 1)
          .lineTo(point.x, point.y - 19)
          .stroke({ color: 0x725037, width: 4 });
        graphics.circle(point.x, point.y - 19, 2).fill(0xc29a61);
      }
    };
    for (let x = 0; x < width; x++) {
      if (!gap('top', x)) segment(this.backFence, { x: x - 0.5, y: -0.5 }, { x: x + 0.5, y: -0.5 });
      if (!gap('bottom', x))
        segment(this.frontFence, { x: x - 0.5, y: height - 0.5 }, { x: x + 0.5, y: height - 0.5 });
    }
    for (let y = 0; y < height; y++) {
      if (!gap('left', y))
        segment(this.backFence, { x: -0.5, y: y - 0.5 }, { x: -0.5, y: y + 0.5 });
      if (!gap('right', y))
        segment(this.frontFence, { x: width - 0.5, y: y - 0.5 }, { x: width - 0.5, y: y + 0.5 });
    }
  }
}
