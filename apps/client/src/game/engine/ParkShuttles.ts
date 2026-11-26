import * as PIXI from 'pixi.js';
import { PARK_SHUTTLE, type ParkShuttleResponse } from '@dino-park/shared';
import { gridToScreen } from './IsometricGrid';

const front = '/assets/vehicles/shuttle-front.webp';
const back = '/assets/vehicles/shuttle-back.webp';
export const shuttleTexturePaths = [front, back];

type Point = { x: number; y: number };
type Destination = ParkShuttleResponse['destinations'][number];
type Vehicle = { body: PIXI.Container; sprite: PIXI.Sprite; scale: number };
type Route = {
  points: Point[];
  vehicles: Vehicle[];
  key: string;
  startedAt: number;
  departureInterval: number;
};

export class ParkShuttles {
  readonly path = new PIXI.Graphics({ eventMode: 'none' });
  private readonly stops = new PIXI.Graphics({ eventMode: 'none' });
  private routes = new Map<string, Route>();
  private destinations: Destination[] = [];
  private focusedExhibit: string | null = null;
  private seconds = 0;
  private displayKey = '';

  constructor(
    private readonly textures: Readonly<Record<string, PIXI.Texture>>,
    private readonly traffic: PIXI.Container,
    private readonly reducedMotion: boolean,
  ) {
    traffic.addChild(this.stops);
  }

  sync(shuttle?: ParkShuttleResponse): void {
    this.destinations = shuttle?.destinations ?? [];
    const displayKey = JSON.stringify(
      this.destinations.map(({ exhibitId, path, route }) => [
        exhibitId,
        path,
        route?.status,
        route?.busCount,
        route?.estimate?.departureIntervalSeconds,
      ]),
    );
    if (displayKey === this.displayKey) return;
    this.displayKey = displayKey;

    const currentRoutes = new Set<string>();
    if (this.textures[front] && this.textures[back]) {
      for (const { exhibitId, route, path } of this.destinations) {
        const estimate = route?.estimate;
        if (route?.status !== 'running' || !estimate || path.length < 2) continue;
        currentRoutes.add(exhibitId);
        const departureInterval = estimate.departureIntervalSeconds;
        const key = JSON.stringify([path, route.busCount, departureInterval]);
        const existing = this.routes.get(exhibitId);
        if (existing?.key === key) continue;
        existing?.vehicles.forEach(({ body }) => body.destroy({ children: true }));
        this.routes.set(exhibitId, {
          key,
          points: path.map(({ x, y }) => gridToScreen(x, y)),
          vehicles: Array.from({ length: route.busCount }, () => this.createVehicle()),
          startedAt: this.seconds,
          departureInterval,
        });
      }
    }
    for (const [id, route] of this.routes) {
      if (currentRoutes.has(id)) continue;
      route.vehicles.forEach(({ body }) => body.destroy({ children: true }));
      this.routes.delete(id);
    }
    this.drawStops();
    this.drawFocus();
    this.update(0);
  }

  focus(exhibitId: string | null): void {
    if (exhibitId === this.focusedExhibit) return;
    this.focusedExhibit = exhibitId;
    this.drawFocus();
  }

  private createVehicle(): Vehicle {
    const body = new PIXI.Container({ eventMode: 'none' });
    const shadow = new PIXI.Graphics().ellipse(0, -1, 15, 6).fill({ color: 0x403923, alpha: 0.23 });
    const sprite = new PIXI.Sprite(this.textures[front]);
    sprite.anchor.set(0.5, 0.92);
    const scale = 44 / sprite.texture.width;
    sprite.scale.set(scale);
    body.addChild(shadow, sprite);
    this.traffic.addChild(body);
    return { body, sprite, scale };
  }

  private drawFocus(): void {
    this.path.clear();
    const tiles = this.destinations.find(
      ({ exhibitId }) => exhibitId === this.focusedExhibit,
    )?.path;
    if (!tiles || tiles.length < 2) return;
    const points = tiles.map(({ x, y }) => gridToScreen(x, y));
    const draw = () => {
      this.path.moveTo(points[0].x, points[0].y);
      for (const { x, y } of points.slice(1)) this.path.lineTo(x, y);
    };
    draw();
    this.path.stroke({ color: 0x734519, width: 8, alpha: 0.8, cap: 'round', join: 'round' });
    draw();
    this.path.stroke({ color: 0xffcf72, width: 4, cap: 'round', join: 'round' });
  }

  private drawStops(): void {
    this.stops.clear();
    const drawnStops = new Set<string>();
    for (const { path, route } of this.destinations) {
      if (!route || route.status === 'disconnected' || path.length < 2) continue;
      for (const tile of [path[0], path[path.length - 1]]) {
        const key = `${tile.x},${tile.y}`;
        if (drawnStops.has(key)) continue;
        drawnStops.add(key);
        const { x, y } = gridToScreen(tile.x, tile.y);
        this.stops
          .moveTo(x + 14, y - 2)
          .lineTo(x + 14, y - 18)
          .stroke({ color: 0x624328, width: 2 })
          .roundRect(x + 9, y - 22, 10, 9, 2)
          .fill(0xf5cc72)
          .stroke({ color: 0x765429, width: 1 });
      }
    }
  }

  update(deltaMs: number): void {
    if (this.reducedMotion && deltaMs > 0) return;
    this.seconds += deltaMs / 1000;
    const speed = PARK_SHUTTLE.secondsPerBusTile;
    const stop = PARK_SHUTTLE.terminalTurnaroundSeconds;
    for (const { points, vehicles, startedAt, departureInterval } of this.routes.values()) {
      const steps = points.length - 1;
      const ride = steps * speed;
      const cycle = departureInterval * vehicles.length;
      vehicles.forEach(({ body, sprite, scale }, index) => {
        const elapsed = this.reducedMotion ? 0 : this.seconds - startedAt;
        const shift = elapsed - index * departureInterval;
        const phase = ((shift % cycle) + cycle) % cycle;
        body.visible = phase < (ride + stop) * 2;
        if (!body.visible) return;
        const returning = phase >= ride + stop;
        const position = returning
          ? Math.max(0, steps - (phase - ride - stop) / speed)
          : Math.min(steps, phase / speed);
        const segment = Math.min(steps - 1, Math.floor(position));
        const a = points[segment];
        const b = points[segment + 1];
        const ratio = position - segment;
        body.position.set(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio);
        const direction = returning ? -1 : 1;
        sprite.texture = this.textures[(b.y - a.y) * direction > 0 ? front : back];
        sprite.scale.x = (b.x - a.x) * direction > 0 ? scale : -scale;
      });
    }
  }
}
