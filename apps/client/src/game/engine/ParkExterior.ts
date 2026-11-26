import * as PIXI from 'pixi.js';
import {
  resolveParkEntranceSide,
  type ParkEntranceSide,
  type ParkOperationsResponse,
} from '@dino-park/shared';
import { gridToScreen, ISO_CONFIG } from './IsometricGrid';
import {
  containsIslandLand,
  getIslandCoastClearance,
  getIslandScreenBounds,
  islandCoast,
  islandScreenCoast,
  PARK_MEADOW_SITE,
} from './IslandWorld';

type Point = { x: number; y: number };
type BoundarySide = ParkEntranceSide;
type EntranceOpening = { side: BoundarySide; from: number; to: number };
type Entrance = Pick<
  NonNullable<ParkOperationsResponse['entrance']>,
  'x' | 'y' | 'width' | 'height' | 'onBoundary' | 'side'
>;
export type ParkEntranceFrame = EntranceOpening & { start: Point; end: Point; center: Point };

const GATE_PATH_HALF_WIDTH = 0.93;

export const PARK_MEADOW_COLOR = 0x97ab61;
const FOREST_CANOPY = '/assets/environment/forest-canopy.webp';
const FOREST_EDGE = '/assets/environment/forest-edge.webp';
const FOREST_UNDERSTORY = '/assets/environment/forest-understory.webp';
const COASTAL_OUTCROP = '/assets/environment/coastal-outcrop.webp';
const MEADOW = '/assets/environment/park-meadow.webp';
const WILD_MEADOW = '/assets/environment/first-expedition-meadow.webp';
const WATER = '/assets/environment/coastal-water.webp';
const SHORE = '/assets/environment/coastal-shore.webp';
const OAK = '/assets/environment/woodland-oak.webp';
const PINE = '/assets/environment/woodland-pine.webp';
const ROCKS = '/assets/environment/woodland-rocks.webp';
const BOULDERS = '/assets/environment/coastal-boulders.webp';
const RIDGE = '/assets/environment/woodland-ridge.webp';
export const parkEnvironmentTexturePaths = [
  MEADOW,
  WILD_MEADOW,
  WATER,
  SHORE,
  OAK,
  PINE,
  ROCKS,
  BOULDERS,
  RIDGE,
  FOREST_CANOPY,
  FOREST_EDGE,
  FOREST_UNDERSTORY,
  COASTAL_OUTCROP,
];

const boundarySides: BoundarySide[] = ['top', 'left', 'bottom', 'right'];
const behindPlayArea = (side: BoundarySide) => side === 'top' || side === 'left';
const horizontalEdge = (side: BoundarySide) => side === 'top' || side === 'bottom';

const islandGroves = [
  { x: 28, y: 15, spreadX: 10, spreadY: 11, count: 32, pines: 0.32 },
  { x: 31, y: 39, spreadX: 13, spreadY: 13, count: 43, pines: 0.26 },
  { x: 16, y: 64, spreadX: 18, spreadY: 17, count: 74, pines: 0.27 },
  { x: 65, y: 52, spreadX: 19, spreadY: 17, count: 89, pines: 0.37 },
  { x: 83, y: 14, spreadX: 19, spreadY: 14, count: 67, pines: 0.81 },
  { x: 102, y: 87, spreadX: 16, spreadY: 21, count: 78, pines: 0.66 },
  { x: 55, y: 102, spreadX: 18, spreadY: 15, count: 50, pines: 0.42 },
] as const;

const islandRidges = [
  { x: -4.7, y: 7.2, width: 280 },
  { x: 11, y: -7, width: 294 },
  { x: 32, y: -5, width: 328 },
  { x: 45, y: 5, width: 426 },
  { x: 50, y: 9, width: 394 },
  { x: 53, y: 13, width: 354 },
  { x: 57, y: 10, width: 450 },
  { x: 59, y: 6, width: 372 },
  { x: 70, y: 21, width: 354 },
  { x: 93, y: 38, width: 352 },
  { x: 97, y: 39, width: 412 },
  { x: 99, y: 43, width: 370 },
  { x: 110, y: 41, width: 364 },
  { x: 106, y: 46, width: 360 },
  { x: 91, y: 109, width: 330 },
  { x: 87, y: 111, width: 388 },
] as const;

export function getParkEntranceFrame(
  width: number,
  height: number,
  entrance: Entrance | null | undefined,
): ParkEntranceFrame | null {
  if (!entrance?.onBoundary) return null;
  const { x, y, width: gateWidth, height: gateHeight } = entrance;
  const side = resolveParkEntranceSide(width, height, entrance, entrance.side);
  if (!side) return null;
  const horizontal = horizontalEdge(side);
  const from = horizontal ? x : y;
  const to = from + (horizontal ? gateWidth : gateHeight);
  const project = (span: number) => {
    const tile = edgePoint(side, span, 0, width, height);
    return gridToScreen(tile.x, tile.y);
  };
  return {
    side,
    from,
    to,
    start: project(from - 0.5),
    end: project(to - 0.5),
    center: project((from + to - 1) / 2),
  };
}

/** An opening's span follows its edge, while distance is positive outside the park. */
function edgePoint(
  side: BoundarySide,
  span: number,
  distance: number,
  width: number,
  height: number,
): Point {
  switch (side) {
    case 'top':
      return { x: span, y: -0.5 - distance };
    case 'left':
      return { x: -0.5 - distance, y: span };
    case 'bottom':
      return { x: span, y: height - 0.5 + distance };
    case 'right':
      return { x: width - 0.5 + distance, y: span };
  }
}

function noise(x: number, y: number): number {
  const sample = Math.sin(x * 19.91 + y * 71.83) * 28394.93;
  return sample - Math.floor(sample);
}

function surfaceFill(
  texture: PIXI.Texture | undefined,
  color: number,
  scaleX: number,
  scaleY: number,
): number | PIXI.FillStyle {
  return texture
    ? { texture, matrix: new PIXI.Matrix().scale(scaleX, scaleY), textureSpace: 'global' }
    : color;
}

function ribbonGeometry(sections: { left: Point; right: Point; progress: number }[]) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  sections.forEach(({ left, right, progress }, index) => {
    positions.push(left.x, left.y, right.x, right.y);
    uvs.push(progress, 0, progress, 1);
    if (!index) return;
    const a = (index - 1) * 2;
    const b = index * 2;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  });
  const geometry = new PIXI.MeshGeometry({
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  });
  geometry.batchMode = 'no-batch';
  return geometry;
}

function destroyRibbon(mesh: PIXI.Mesh | null) {
  if (!mesh) return;
  const geometry = mesh.geometry;
  mesh.destroy();
  geometry.destroy(true);
}

function makeApproachFade() {
  const width = 64;
  const height = 4;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const edge = y === 0 || y === height - 1;
    for (let x = 0; x < width; x++) {
      const tip = Math.max(0, (x / (width - 1) - 0.7) / 0.3);
      const opacity = 1 - tip * tip * (3 - 2 * tip);
      pixels.set(
        [206, 188, 141, Math.round(255 * opacity * (edge ? 0.22 : 1))],
        (y * width + x) * 4,
      );
    }
  }
  return new PIXI.Texture({
    source: new PIXI.BufferImageSource({ resource: pixels, width, height }),
  });
}

function makeLandscapeTint() {
  const width = 48;
  const pixels = new Uint8Array(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.hypot((2 * x) / (width - 1) - 1, (2 * y) / (width - 1) - 1);
      const alpha = Math.max(0, 1 - distance ** 2) ** 2;
      pixels.set([255, 255, 255, Math.round(alpha * 255)], (y * width + x) * 4);
    }
  }
  return new PIXI.Texture({
    source: new PIXI.BufferImageSource({ resource: pixels, width, height: width }),
  });
}

function coastClearance(side: BoundarySide, span: number, width: number, height: number) {
  const origin = edgePoint(side, span, 0, width, height);
  return getIslandCoastClearance(
    origin,
    horizontalEdge(side) ? 'y' : 'x',
    behindPlayArea(side) ? -1 : 1,
  );
}

function approachLength(gate: EntranceOpening, width: number, height: number) {
  const clearance = coastClearance(gate.side, (gate.from + gate.to - 1) / 2, width, height);
  return Math.max(0, Math.min(gate.side === 'bottom' ? 12 : 18, clearance - 0.92));
}

export function getEntranceApproachOutline(
  width: number,
  height: number,
  gate: EntranceOpening,
  margin = 0,
): Point[] {
  const middle = (gate.from + gate.to - 1) / 2;
  const path = [
    { distance: 0, bend: 0, radius: GATE_PATH_HALF_WIDTH },
    { distance: 1.35, bend: 0, radius: 1 },
    { distance: 3, bend: 0.3, radius: 0.96 },
    { distance: 4.9, bend: 0.76, radius: 1.08 },
    { distance: 7.1, bend: 0.69, radius: 1.16 },
    { distance: 10.3, bend: 0.17, radius: 0.97 },
    { distance: 14.5, bend: -0.17, radius: 0.78 },
    { distance: 21, bend: -0.4, radius: 0.63 },
  ];
  const length = approachLength(gate, width, height);
  const edge = (direction: number) =>
    path.map(({ distance, bend, radius }) => {
      const span = middle + (bend * length) / 21 + direction * (radius + margin);
      const depth = (distance / 21) * length;
      const outside = Math.max(
        0,
        Math.min(depth, coastClearance(gate.side, span, width, height) - 0.54),
      );
      return edgePoint(gate.side, span, outside, width, height);
    });
  return [...edge(-1), ...edge(1).reverse()];
}

/** Continue the outside lane under the gate and meet the server's inside road. */
export function getEntranceThresholdOutline(
  width: number,
  height: number,
  frame: ParkEntranceFrame,
  entrance: Entrance,
  pathTiles: readonly Point[],
): Point[] {
  const { side, from, to } = frame;
  const horizontal = horizontalEdge(side);
  const depth = horizontal ? entrance.height : entrance.width;
  const middle = (from + to - 1) / 2;
  const preferredExit = edgePoint(side, Math.ceil(middle), -(depth + 0.5), width, height);
  const { x, y, width: gateWidth, height: gateHeight } = entrance;
  const touchesGate = (tile: Point) =>
    ((tile.x === x - 1 || tile.x === x + gateWidth) && tile.y >= y && tile.y < y + gateHeight) ||
    ((tile.y === y - 1 || tile.y === y + gateHeight) && tile.x >= x && tile.x < x + gateWidth);
  const distanceToExit = (tile: Point) =>
    Math.abs(tile.x - preferredExit.x) + Math.abs(tile.y - preferredExit.y);
  const egress =
    pathTiles.filter(touchesGate).sort((a, b) => distanceToExit(a) - distanceToExit(b))[0] ??
    edgePoint(side, middle, -Math.max(0.5, depth - 0.5), width, height);
  const spread = horizontal ? { x: 0.42, y: 0 } : { x: 0, y: 0.42 };
  return [
    edgePoint(side, middle - GATE_PATH_HALF_WIDTH, 0, width, height),
    { x: egress.x - spread.x, y: egress.y - spread.y },
    { x: egress.x + spread.x, y: egress.y + spread.y },
    edgePoint(side, middle + GATE_PATH_HALF_WIDTH, 0, width, height),
  ];
}

/** Grass, rocks and trees are decoration on the outer side of the buildable map. */
export class ParkExterior extends PIXI.Container {
  private readonly meadow = new PIXI.Graphics();
  private readonly wildMeadow: PIXI.Sprite | null;
  private readonly regionColors = new PIXI.Container();
  private readonly regionMask = new PIXI.Graphics();
  private readonly regionTint = makeLandscapeTint();
  private readonly shore = new PIXI.Container();
  private readonly shadows = new PIXI.Graphics();
  private readonly approachSurface = new PIXI.Container();
  private readonly approachFade = makeApproachFade();
  private readonly approach = new PIXI.Graphics();
  private readonly plants = new PIXI.Container({ sortableChildren: true });
  private coastline: PIXI.Mesh | null = null;
  private approachRibbon: PIXI.Mesh | null = null;
  private terrainDrawn = false;

  constructor(private readonly textures: Readonly<Record<string, PIXI.Texture>>) {
    super({ eventMode: 'none' });
    const wildMeadow = textures[WILD_MEADOW];
    this.wildMeadow = wildMeadow ? new PIXI.Sprite(wildMeadow) : null;
    this.addChild(
      this.meadow,
      this.regionColors,
      this.regionMask,
      this.shore,
      this.shadows,
      this.approachSurface,
      this.approach,
      this.plants,
    );
    this.regionColors.mask = this.regionMask;
    if (this.wildMeadow) {
      const center = gridToScreen(PARK_MEADOW_SITE.x, PARK_MEADOW_SITE.y);
      this.wildMeadow.anchor.set(0.5);
      this.wildMeadow.position.set(center.x, center.y);
      // Match the ground grid used by the 10.4-tile orthographic scene.
      this.wildMeadow.scale.set(
        (10.4 * ISO_CONFIG.TILE_WIDTH) / Math.SQRT2 / this.wildMeadow.texture.width,
      );
      this.addChildAt(this.wildMeadow, this.getChildIndex(this.approachSurface));
    }
  }

  draw(width: number, height: number, frame: ParkEntranceFrame | null): void {
    if (!this.terrainDrawn) {
      this.drawTerrain();
      this.terrainDrawn = true;
    }
    this.shadows.clear();
    for (const plant of this.plants.removeChildren()) plant.destroy();

    const approach = frame ?? undefined;
    this.drawApproach(width, height, approach);
    this.drawCoastalRocks(width, height, approach);
    this.drawTrees(width, height, approach);
    this.drawRidge(width, height, approach);
  }

  override destroy(options?: PIXI.DestroyOptions): void {
    destroyRibbon(this.coastline);
    destroyRibbon(this.approachRibbon);
    this.approachFade.destroy(true);
    this.regionTint.destroy(true);
    super.destroy(options);
  }

  private drawTerrain(): void {
    const { left, right, top, bottom } = getIslandScreenBounds();
    const waterMargin = 12000;
    const shoreline = islandScreenCoast.flatMap(({ x, y }) => [x, y]);
    const grass = this.textures[MEADOW];
    this.meadow
      .rect(
        left - waterMargin,
        top - waterMargin,
        right - left + 2 * waterMargin,
        bottom - top + 2 * waterMargin,
      )
      .fill(surfaceFill(this.textures[WATER], 0x437d90, 1.05, 0.85))
      .poly(shoreline)
      .fill(surfaceFill(grass, PARK_MEADOW_COLOR, 0.86, 0.8));
    if (grass) this.meadow.poly(shoreline).fill({ color: 0x879963, alpha: 0.24 });
    this.regionMask.poly(shoreline).fill(0xffffff);
    this.addRegionColors();
    const shore = this.textures[SHORE];
    if (shore) this.drawShoreRibbon(shore);
    else this.meadow.poly(shoreline).stroke({ color: 0xc8b78b, width: 14, alpha: 0.85 });
  }

  private addRegionColors(): void {
    const colors = [
      { x: 14, y: 17, width: 2450, height: 890, tint: 0xc4c17a, alpha: 0.22 },
      { x: 16, y: 69, width: 2650, height: 1460, tint: 0x526e49, alpha: 0.5 },
      { x: 64, y: 54, width: 2750, height: 1280, tint: 0x456b3e, alpha: 0.53 },
      { x: 54, y: 9, width: 2500, height: 1000, tint: 0xb68c59, alpha: 0.44 },
      { x: 83, y: 14, width: 2100, height: 1060, tint: 0x637b52, alpha: 0.42 },
      { x: 99, y: 86, width: 2340, height: 1340, tint: 0x586f44, alpha: 0.56 },
      { x: 61, y: 98, width: 2200, height: 1150, tint: 0xbac481, alpha: 0.39 },
      { x: 93, y: 105, width: 2500, height: 1250, tint: 0xc1a56b, alpha: 0.4 },
    ];
    for (const region of colors) {
      const surface = new PIXI.Sprite(this.regionTint);
      const center = gridToScreen(region.x, region.y);
      surface.anchor.set(0.5);
      surface.position.set(center.x, center.y);
      surface.width = region.width;
      surface.height = region.height;
      surface.tint = region.tint;
      surface.alpha = region.alpha;
      this.regionColors.addChild(surface);
    }
  }

  private propClearOfPlot(root: Point, size: number, width: number, height: number): boolean {
    // Tall, wide silhouettes back away from the fence as well as their contact points.
    const side = size / 128;
    const reach = side + size / 68;
    return (
      root.x < -0.5 - side ||
      root.y < -0.5 - side ||
      root.x > width - 0.5 + reach ||
      root.y > height - 0.5 + reach
    );
  }

  private nearApproach(
    point: Point,
    width: number,
    height: number,
    approach?: EntranceOpening,
    clearance = 2.7,
  ): boolean {
    if (!approach) return false;
    const middle = (approach.from + approach.to - 1) / 2;
    const start = edgePoint(approach.side, middle, 0, width, height);
    const horizontal = horizontalEdge(approach.side);
    const depth =
      (horizontal ? point.y - start.y : point.x - start.x) *
      (behindPlayArea(approach.side) ? -1 : 1);
    return (
      depth > 0 &&
      depth < (approach.side === 'bottom' ? 15 : 21) &&
      Math.abs(horizontal ? point.x - start.x : point.y - start.y) < clearance
    );
  }

  private drawCoastalRocks(width: number, height: number, approach?: EntranceOpening): void {
    const boulders = this.textures[BOULDERS] ?? this.textures[COASTAL_OUTCROP];
    for (let index = 1; index < islandCoast.length; index += 7) {
      const seed = noise(index, 54);
      if (seed < 0.28) continue;
      const root = islandCoast[index];
      const size = 78 + seed * 114;
      if (
        !this.propClearOfPlot(root, size, width, height) ||
        this.nearApproach(root, width, height, approach, 3.5)
      )
        continue;
      const rock = seed < 0.48 ? (this.textures[COASTAL_OUTCROP] ?? boulders) : boulders;
      this.placeProp(rock, gridToScreen(root.x, root.y), size, 0xffffff, seed > 0.53);
    }
  }

  private drawShoreRibbon(texture: PIXI.Texture): void {
    const style = texture.source.style;
    style.addressModeU = 'repeat';
    style.addressModeV = 'clamp-to-edge';
    style.update();

    const count = islandScreenCoast.length;
    let distance = 0;
    let last = islandScreenCoast[0];
    const sections = [...islandScreenCoast, last].map((center, index) => {
      const previous = islandScreenCoast[(index + count - 1) % count];
      const next = islandScreenCoast[(index + 1) % count];
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const scale = 37 / Math.hypot(dx, dy);
      const ox = -dy * scale;
      const oy = dx * scale;
      distance += Math.hypot(center.x - last.x, center.y - last.y);
      last = center;
      return {
        left: { x: center.x + ox, y: center.y + oy },
        right: { x: center.x - ox, y: center.y - oy },
        progress: distance / 330,
      };
    });
    this.coastline = new PIXI.Mesh({
      geometry: ribbonGeometry(sections),
      texture,
      eventMode: 'none',
    });
    this.shore.addChild(this.coastline);
  }

  drawApproach(width: number, height: number, gate?: EntranceOpening | null): void {
    this.approach.clear();
    destroyRibbon(this.approachRibbon);
    this.approachRibbon = null;
    if (this.wildMeadow)
      this.wildMeadow.visible = !this.nearApproach(
        PARK_MEADOW_SITE,
        width,
        height,
        gate ?? undefined,
        4,
      );
    if (!gate) return;
    const middle = (gate.from + gate.to - 1) / 2;
    const length = approachLength(gate, width, height);
    if (!length) return;
    const outline = getEntranceApproachOutline(width, height, gate, 0.16);
    const normal = horizontalEdge(gate.side) ? 'y' : 'x';
    const firstSide = outline.slice(0, outline.length / 2);
    const oppositeSide = outline.slice(outline.length / 2).reverse();
    const depths = firstSide.map((point, index) =>
      Math.abs((point[normal] + oppositeSide[index][normal]) / 2 - outline[0][normal]),
    );
    const lastDepth = depths.at(-1) ?? length;
    const sections = firstSide.map((point, index) => {
      const opposite = oppositeSide[index];
      return {
        left: gridToScreen(point.x, point.y),
        right: gridToScreen(opposite.x, opposite.y),
        progress: depths[index] / lastDepth,
      };
    });
    this.approachRibbon = new PIXI.Mesh({
      geometry: ribbonGeometry(sections),
      texture: this.approachFade,
      eventMode: 'none',
    });
    this.approachSurface.addChild(this.approachRibbon);

    for (let i = 0; i < Math.min(24, (length - 0.5) / 0.6); i++) {
      const distance = 0.5 + i * 0.6;
      const span = middle + noise(i, 18) * 1.12 - 0.23;
      if (distance >= coastClearance(gate.side, span, width, height) - 0.6) continue;
      const tile = edgePoint(gate.side, span, distance, width, height);
      const { x, y } = gridToScreen(tile.x, tile.y);
      const color = i % 2 ? 0xe9d6a6 : 0xb39f74;
      const alpha = Math.min(0.65, (1 - distance / length) * 2);
      this.approach
        .ellipse(x, y, 1.5 + noise(i, 19) * 2.1, 0.8 + noise(i, 20))
        .fill({ color, alpha });
    }
  }

  private drawTrees(width: number, height: number, gate?: EntranceOpening): void {
    const oak = this.textures[OAK] ?? this.textures[FOREST_CANOPY];
    const pine = this.textures[PINE] ?? this.textures[FOREST_EDGE];
    const shrubs = this.textures[FOREST_UNDERSTORY];
    const rocks = this.textures[ROCKS] ?? this.textures[COASTAL_OUTCROP];
    for (const [region, grove] of islandGroves.entries()) {
      for (let index = 0; index < grove.count; index++) {
        const seed = noise(index, region + 29);
        const radius = Math.sqrt((index + 0.8) / grove.count);
        const angle = index * 2.39996 + (seed - 0.5) * 0.66;
        const root = {
          x: grove.x + Math.cos(angle) * radius * grove.spreadX,
          y: grove.y + Math.sin(angle) * radius * grove.spreadY,
        };
        // Keep the visible clearing on the near side as the surrounding grove fills in.
        if (region === 0 && root.x < 24.5 && root.y > 12 && root.y < 18) continue;
        const deciduous = seed > grove.pines;
        const isUnderstory = noise(index + 7, region + 41) > 0.77;
        const texture = isUnderstory ? (seed > 0.82 ? rocks : shrubs) : deciduous ? oak : pine;
        const size = isUnderstory ? 70 + seed * 30 : 106 + seed * 65;
        if (
          !containsIslandLand(root) ||
          !this.propClearOfPlot(root, size, width, height) ||
          this.nearApproach(root, width, height, gate, 4.4)
        )
          continue;
        const tint = isUnderstory || deciduous ? 0xf2efd5 : 0xd6e0ca;
        this.placeProp(texture, gridToScreen(root.x, root.y), size, tint, seed > 0.56);
      }
    }
  }

  private drawRidge(width: number, height: number, gate?: EntranceOpening): void {
    const ridge = this.textures[RIDGE] ?? this.textures[ROCKS];
    const rocks = this.textures[ROCKS] ?? this.textures[COASTAL_OUTCROP];
    for (const [index, peak] of islandRidges.entries()) {
      if (
        !this.propClearOfPlot(peak, peak.width, width, height) ||
        this.nearApproach(peak, width, height, gate, 5)
      )
        continue;
      this.placeProp(ridge, gridToScreen(peak.x, peak.y), peak.width, 0xffffff, index % 3 === 1);
      const root = { x: peak.x + 0.82, y: peak.y + 2.15 };
      if (
        containsIslandLand(root) &&
        this.propClearOfPlot(root, 93, width, height) &&
        !this.nearApproach(root, width, height, gate, 4)
      ) {
        this.placeProp(rocks, gridToScreen(root.x, root.y), 80 + noise(index, 65) * 55);
      }
    }
  }

  private placeProp(
    texture: PIXI.Texture | undefined,
    position: Point,
    width: number,
    tint = 0xffffff,
    mirror = false,
  ): void {
    if (!texture) return;
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5, 0.94);
    const scale = width / texture.width;
    sprite.scale.set(mirror ? -scale : scale, scale);
    sprite.tint = tint;
    sprite.position.set(position.x, position.y);
    sprite.zIndex = position.y;
    this.shadows
      .ellipse(position.x + width * 0.08, position.y + 1, width * 0.33, width * 0.095)
      .fill({ color: 0x273e26, alpha: 0.13 })
      .ellipse(position.x + width * 0.065, position.y + 1, width * 0.22, width * 0.064)
      .fill({ color: 0x273e26, alpha: 0.09 });
    this.plants.addChild(sprite);
  }
}

function drawRails(graphic: PIXI.Graphics, start: Point, end: Point): void {
  for (const rise of [5, 11]) {
    const a = start.y - rise;
    const b = end.y - rise;
    graphic.poly([start.x, a, end.x, b, end.x, b + 4, start.x, a + 4]).fill(0x754823);
    graphic
      .poly([start.x - 1, a - 1, end.x - 1, b - 1, end.x + 1, b + 1, start.x + 1, a + 1])
      .fill(0xb38250);
  }
}

function drawPost(graphic: PIXI.Graphics, point: Point, terminal: boolean, stone: boolean): void {
  const { x, y } = point;
  const radius = terminal ? 6.6 : stone ? 4.2 : 2.1;
  const halfDepth = radius * 0.55;
  const height = terminal ? 21 : stone ? 15 : 13;
  const top = y - height;
  const cap = stone ? 0xe4c38e : 0xb78a59;
  const sun = stone ? 0xc49a65 : 0x966237;
  const shade = stone ? 0x9d744b : 0x714b29;

  graphic
    .ellipse(x + 2, y + 1, radius * 1.3, halfDepth * 1.4)
    .fill({ color: 0x3f572c, alpha: 0.23 })
    .poly([x - radius, top, x, top + halfDepth, x, y + halfDepth, x - radius, y])
    .fill(sun)
    .poly([x, top + halfDepth, x + radius, top, x + radius, y, x, y + halfDepth])
    .fill(shade)
    .poly([x - radius, top, x, top - halfDepth, x + radius, top, x, top + halfDepth])
    .fill(cap);
  if (stone) {
    graphic
      .moveTo(x - radius, y - height / 3)
      .lineTo(x, y - height / 3 + halfDepth)
      .lineTo(x + radius, y - height / 3)
      .stroke({ color: 0x927149, alpha: 0.67, width: 1 });
  }
}

/** Render outer boundary edges, leaving the buildable cells and gate opening unchanged. */
export function drawParkBoundary(
  back: PIXI.Graphics,
  front: PIXI.Graphics,
  width: number,
  height: number,
  frame: ParkEntranceFrame | null,
): void {
  back.clear();
  front.clear();
  for (const side of boundarySides) {
    const layer = behindPlayArea(side) ? back : front;
    const length = horizontalEdge(side) ? width : height;
    const gate = frame?.side === side ? frame : null;
    const point = (index: number) => {
      if (index === gate?.from) return gate.start;
      if (index === gate?.to) return gate.end;
      const { x, y } = edgePoint(side, index - 0.5, 0, width, height);
      return gridToScreen(x, y);
    };
    const hasRail = (index: number) =>
      index >= 0 && index < length && !(gate && index >= gate.from && index < gate.to);
    for (let index = 0; index < length; index += 1) {
      if (hasRail(index)) drawRails(layer, point(index), point(index + 1));
    }
    for (let index = 0; index <= length; index += 1) {
      if (!hasRail(index - 1) && !hasRail(index)) continue;
      const post = point(index);
      if (frame && [frame.start, frame.end].some(({ x, y }) => x === post.x && y === post.y))
        continue;
      const terminal = index === 0 || index === length;
      drawPost(layer, post, terminal, terminal || index % 2 === 0);
    }
  }
}
