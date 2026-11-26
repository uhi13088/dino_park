import * as PIXI from 'pixi.js';
import {
  getSafariDinosaurPositions,
  SAFARI_ZONES,
  type ParkSafariResponse,
  type SafariTile,
  type SafariZoneKind,
} from '@dino-park/shared';
import {
  dinosaurArtwork,
  dinosaurRasterArtwork,
  SAFARI_CARNIVORE_FENCE_HEIGHT,
  safariGatePylonArtwork,
} from '../parkArtwork';
import { createDinosaurShadow } from './DinosaurShadow';
import { gridToScreen, type IsometricGrid } from './IsometricGrid';

const brushPath = '/assets/environment/forest-understory.webp';
const brushTextureWidth = 52;
const sides = [
  { dx: 0, dy: -1, start: [-0.5, -0.5], end: [0.5, -0.5] },
  { dx: 1, dy: 0, start: [0.5, -0.5], end: [0.5, 0.5] },
  { dx: 0, dy: 1, start: [0.5, 0.5], end: [-0.5, 0.5] },
  { dx: -1, dy: 0, start: [-0.5, 0.5], end: [-0.5, -0.5] },
] as const;
const tileKey = ({ x, y }: SafariTile) => `${x},${y}`;

const materials = {
  herbivore: {
    grass: [0x9bb263, 0xa2b769, 0xa7b96d],
    base: 0x6f492a,
    rail: 0xc6985f,
    top: 0xe7bf83,
    height: 11,
  },
  carnivore: {
    grass: [0x9da95f, 0xa7af62, 0xa0af62],
    base: 0x41483d,
    rail: 0x818a75,
    top: 0xd3be8e,
    height: SAFARI_CARNIVORE_FENCE_HEIGHT,
  },
};

type DrawPoint = ReturnType<typeof gridToScreen>;

function gateAt(from: DrawPoint, to: DrawPoint, texture?: PIXI.Texture) {
  const gate = new PIXI.Container({ eventMode: 'none', label: 'safari-vehicle-gate' });
  const door = new PIXI.Graphics();
  const height = SAFARI_CARNIVORE_FENCE_HEIGHT - 3;
  door
    .poly([from.x, from.y, to.x, to.y, to.x, to.y - height, from.x, from.y - height])
    .fill(0x333e36);
  for (const elevation of [5, 14, height]) {
    door
      .moveTo(from.x, from.y - elevation)
      .lineTo(to.x, to.y - elevation)
      .stroke({ color: elevation === 14 ? 0xc09653 : 0x748374, width: 2.7 });
  }
  const seam = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  door
    .moveTo(seam.x, seam.y - 3)
    .lineTo(seam.x, seam.y - height)
    .stroke({ color: 0x202d25, width: 2 });
  door
    .poly([from.x, from.y - 35, to.x, to.y - 35, to.x, to.y - 41, from.x, from.y - 41])
    .fill(0x364735)
    .moveTo(from.x, from.y - 40)
    .lineTo(to.x, to.y - 40)
    .stroke({ color: 0xa8a385, width: 2 })
    .roundRect(seam.x - 5, seam.y - 40, 10, 5, 1)
    .fill(0xdab05d)
    .circle(seam.x, seam.y - 37.5, 1.2)
    .fill(0xffdd8b);
  for (const [post, mirror] of [
    [from, false],
    [to, true],
  ] as const) {
    door.ellipse(post.x + 3, post.y + 3, 10, 4.2).fill({ color: 0x363f26, alpha: 0.36 });
    if (!texture) {
      door
        .rect(post.x - 6, post.y - 36, 12, 36)
        .fill(0x69614f)
        .rect(post.x - 6, post.y - 36, 5, 36)
        .fill(0xbea987)
        .rect(post.x - 7, post.y - 37, 14, 4)
        .fill(0xddc498)
        .circle(post.x, post.y - 39, 2)
        .fill(0xebae64);
      continue;
    }
    const pylon = new PIXI.Sprite({ texture, eventMode: 'none' });
    pylon.anchor.set(0.5, safariGatePylonArtwork.groundAnchorY);
    pylon.width = safariGatePylonArtwork.width;
    pylon.height = (pylon.width * texture.height) / texture.width;
    if (mirror) pylon.scale.x *= -1;
    pylon.position.set(post.x, post.y);
    gate.addChild(pylon);
  }
  gate.addChildAt(door, 0);
  return gate;
}

function fenceSide(
  { dx, dy, start, end }: (typeof sides)[number],
  kind: SafariZoneKind,
  vehicleGate: boolean,
  pylonTexture?: PIXI.Texture,
) {
  const { base, rail, top, height } = materials[kind];
  const from = gridToScreen(start[0] - dx / 2, start[1] - dy / 2);
  const to = gridToScreen(end[0] - dx / 2, end[1] - dy / 2);
  if (vehicleGate) {
    const spread = 0.29;
    const gapX = (to.x - from.x) * spread;
    const gapY = (to.y - from.y) * spread;
    return gateAt(
      { x: from.x - gapX, y: from.y - gapY },
      { x: to.x + gapX, y: to.y + gapY },
      pylonTexture,
    );
  }
  const fence = new PIXI.Graphics({ eventMode: 'none' });
  fence
    .moveTo(from.x, from.y + 2)
    .lineTo(to.x, to.y + 2)
    .stroke({ color: 0x414a2b, alpha: 0.3, width: 5 });
  if (kind === 'carnivore') {
    const front = dx > 0 || dy > 0;
    fence
      .poly([from.x, from.y - 3, to.x, to.y - 3, to.x, to.y - height, from.x, from.y - height])
      .fill({ color: 0x424b3e, alpha: front ? 0.2 : 0.38 })
      .moveTo(from.x, from.y - 3)
      .lineTo(to.x, to.y - 3)
      .stroke({ color: 0x807664, width: 7 })
      .moveTo(from.x, from.y - 5)
      .lineTo(to.x, to.y - height + 3)
      .stroke({ color: rail, width: 1.9, alpha: 0.8 });
    for (const lift of [8, 16, 24]) {
      fence
        .moveTo(from.x, from.y - lift)
        .lineTo(to.x, to.y - lift)
        .stroke({ color: 0xb1b9a2, width: 1, alpha: front ? 0.3 : 0.5 });
    }
  }
  for (const elevation of [height * 0.45, height]) {
    fence
      .moveTo(from.x, from.y - elevation)
      .lineTo(to.x, to.y - elevation)
      .stroke({ color: base, width: 4 });
    fence
      .moveTo(from.x, from.y - elevation - 1)
      .lineTo(to.x, to.y - elevation - 1)
      .stroke({ color: rail, width: 2.1 });
  }
  if (kind === 'carnivore') {
    for (let position = 0.2; position < 1; position += 0.2) {
      const x = from.x + (to.x - from.x) * position;
      const y = from.y + (to.y - from.y) * position;
      fence
        .moveTo(x, y - 3)
        .lineTo(x, y - height)
        .stroke({ color: rail, width: 1.25, alpha: 0.65 });
    }
  }
  const postWidth = kind === 'carnivore' ? 4 : 2.5;
  fence
    .rect(from.x - postWidth, from.y - height - 2, postWidth * 2, height + 3)
    .fill(base)
    .rect(from.x - postWidth, from.y - height - 2, postWidth + 0.5, height + 3)
    .fill(rail);
  fence
    .poly([
      from.x - postWidth,
      from.y - height - 2,
      from.x,
      from.y - height - 4,
      from.x + postWidth,
      from.y - height - 2,
      from.x,
      from.y - height,
    ])
    .fill(top);
  return fence;
}

function drawJeepTrail(ground: PIXI.Graphics, path: SafariTile[]) {
  for (const [index, tile] of path.entries()) {
    const { x, y } = gridToScreen(tile.x, tile.y);
    ground.poly([x, y - 11, x + 22, y, x, y + 11, x - 22, y]).fill(0xc3a16e);
    const next = path[index + 1];
    if (!next) continue;
    const offsetX = (next.y - tile.y) * 0.31;
    const offsetY = (tile.x - next.x) * 0.31;
    const coordinates = [
      gridToScreen(tile.x - offsetX, tile.y - offsetY),
      gridToScreen(next.x - offsetX, next.y - offsetY),
      gridToScreen(next.x + offsetX, next.y + offsetY),
      gridToScreen(tile.x + offsetX, tile.y + offsetY),
    ];
    ground.poly(coordinates.flatMap(({ x, y }) => [x, y])).fill(0xc3a16e);
  }
  for (const [index, tile] of path.entries()) {
    const next = path[index + 1];
    if (!next) continue;
    const offsetX = (next.y - tile.y) * 0.18;
    const offsetY = (tile.x - next.x) * 0.18;
    for (const side of [-1, 1]) {
      const start = gridToScreen(tile.x + offsetX * side, tile.y + offsetY * side);
      const end = gridToScreen(next.x + offsetX * side, next.y + offsetY * side);
      ground
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ color: 0x835f38, width: 1, alpha: 0.4 });
    }
  }
}

/** Read-only park view of the same pens and viewing lane used by the safari editor. */
export class ParkSafariScenery {
  readonly ground = new PIXI.Graphics({ eventMode: 'none' });
  private props: PIXI.Container[] = [];
  private state?: ParkSafariResponse;

  constructor(private readonly textures: Readonly<Record<string, PIXI.Texture>>) {}

  sync(grid: IsometricGrid, state?: ParkSafariResponse) {
    if (state === this.state) return;
    this.state = state;
    this.props.forEach((prop) => prop.destroy({ children: true }));
    this.props = [];
    this.ground.clear();
    if (!state) return;

    const addProp = (prop: PIXI.Container, tile: SafariTile) => {
      this.props.push(prop);
      grid.addEntity(prop, tile.x, tile.y);
    };
    const occupants = new Map(state.dinosaurs.map((dino) => [dino.id, dino]));
    const path = state.tour?.path ?? [];
    const gate = state.tour?.gate;

    for (const kind of SAFARI_ZONES) {
      const zone = state.layout.zones[kind];
      const footprint = new Set(zone.tiles.map(tileKey));
      const palette = materials[kind].grass;
      for (const tile of zone.tiles) {
        const { x, y } = gridToScreen(tile.x, tile.y);
        const shade = ((tile.x * 17 + tile.y * 13) % 7) % palette.length;
        this.ground.poly([x, y - 16, x + 32, y, x, y + 16, x - 32, y]).fill(palette[shade]);
        for (const side of sides) {
          const neighbor = { x: tile.x + side.dx, y: tile.y + side.dy };
          if (footprint.has(tileKey(neighbor))) continue;
          const vehicleGate =
            kind === 'carnivore' &&
            gate !== undefined &&
            tileKey(tile) === tileKey(gate.inside) &&
            tileKey(neighbor) === tileKey(gate.outside);
          addProp(fenceSide(side, kind, vehicleGate, this.textures[safariGatePylonArtwork.path]), {
            x: (tile.x + neighbor.x) / 2,
            y: (tile.y + neighbor.y) / 2,
          });
        }
      }
      for (const tile of zone.water) {
        const { x, y } = gridToScreen(tile.x, tile.y);
        this.ground
          .ellipse(x, y, 25, 12)
          .fill(0xb7a477)
          .ellipse(x, y, 22, 10)
          .fill(0x567d74)
          .ellipse(x, y - 1, 17, 7)
          .fill(0x75aca1);
        this.ground
          .moveTo(x - 12, y + 1)
          .lineTo(x - 2, y + 1)
          .stroke({ color: 0xc1e1c5, width: 1, alpha: 0.72 });
      }
      for (const tile of zone.brush) {
        const texture = this.textures[brushPath];
        if (!texture) continue;
        const brush = new PIXI.Sprite({ texture, eventMode: 'none' });
        brush.anchor.set(0.5, 0.84);
        brush.width = brushTextureWidth;
        brush.height = (brushTextureWidth * texture.height) / texture.width;
        addProp(brush, tile);
      }
      const driveableTiles = kind === 'carnivore' ? path : undefined;
      for (const { dinosaurId, tile } of getSafariDinosaurPositions(zone, driveableTiles)) {
        const dinosaur = occupants.get(dinosaurId);
        if (!dinosaur) continue;
        const texture = this.textures[dinosaurArtwork(dinosaur.speciesId)];
        if (!texture) continue;
        const sprite = new PIXI.Sprite({ texture, eventMode: 'none' });
        const width = dinosaurRasterArtwork.get(dinosaur.speciesId)?.width ?? 96;
        sprite.anchor.set(0.5, 228 / 256);
        sprite.width = width;
        sprite.height = (width * texture.height) / texture.width;
        const creature = new PIXI.Container({ eventMode: 'none' });
        creature.addChild(createDinosaurShadow(width), sprite);
        addProp(creature, tile);
      }
    }
    drawJeepTrail(this.ground, path);

    for (const tile of state.layout.stops) {
      const sign = new PIXI.Graphics({ eventMode: 'none' });
      sign
        .ellipse(0, 2, 7, 3)
        .fill({ color: 0x3f4627, alpha: 0.3 })
        .rect(-1, -14, 3, 15)
        .fill(0x493f2b)
        .roundRect(-6, -21, 13, 12, 3)
        .fill(0x825338)
        .roundRect(-5, -21, 11, 10, 3)
        .fill(0xe9b56b)
        .circle(0.5, -16, 2.5)
        .fill(0x5f662f);
      addProp(sign, tile);
    }
  }
}
