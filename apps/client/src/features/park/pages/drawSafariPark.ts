import {
  getSafariDinosaurPositions,
  type BuildingResponse,
  type ParkSafariResponse,
  type SafariGate,
  type SafariTile,
  type SafariView,
  type SafariZoneKind,
} from '@dino-park/shared';
import { getBuildingById } from '@dino-park/game-data';
import { gridToScreen, ISO_CONFIG } from '@game/engine/IsometricGrid';
import { islandScreenCoast } from '@game/engine/IslandWorld';
import {
  dinosaurRasterArtwork,
  getBuildingRasterArtwork,
  getCompletedBuildingArtworkLevel,
  safariGatePylonArtwork,
  SAFARI_CARNIVORE_FENCE_HEIGHT,
} from '@game/parkArtwork';
import { sameSafariTile, safariTileKey, safariZones, type SafariDraft } from './safariEditor';

type ScreenPoint = { x: number; y: number };
export type SafariCamera = ScreenPoint & { zoom: number };
type PathCorner = [number, number];
type MapLayer = { depth: number; draw: () => void };
type Images = ReadonlyMap<string, HTMLImageElement>;

export const safariMapArt = {
  meadow: '/assets/environment/park-meadow.webp',
  sea: '/assets/environment/coastal-water.webp',
  shrub: '/assets/environment/forest-understory.webp',
  jeep: '/assets/safari-encounter/jeep.webp',
  gatePylon: safariGatePylonArtwork.path,
};

export function safariDinosaurArt(speciesId: string): string | undefined {
  return dinosaurRasterArtwork.get(speciesId)?.path;
}

const edges = [
  { across: { x: 0, y: -1 }, from: [-0.5, -0.5], to: [0.5, -0.5], front: false },
  { across: { x: -1, y: 0 }, from: [-0.5, -0.5], to: [-0.5, 0.5], front: false },
  { across: { x: 1, y: 0 }, from: [0.5, -0.5], to: [0.5, 0.5], front: true },
  { across: { x: 0, y: 1 }, from: [-0.5, 0.5], to: [0.5, 0.5], front: true },
] satisfies { across: SafariTile; from: PathCorner; to: PathCorner; front: boolean }[];

function polygon(ctx: CanvasRenderingContext2D, points: ScreenPoint[]) {
  ctx.beginPath();
  for (const point of points) ctx.lineTo(point.x, point.y);
  ctx.closePath();
}

function tileDiamond(ctx: CanvasRenderingContext2D, tile: SafariTile, half = 0.5) {
  polygon(ctx, [
    gridToScreen(tile.x - half, tile.y - half),
    gridToScreen(tile.x + half, tile.y - half),
    gridToScreen(tile.x + half, tile.y + half),
    gridToScreen(tile.x - half, tile.y + half),
  ]);
}

function line(
  ctx: CanvasRenderingContext2D,
  from: ScreenPoint,
  to: ScreenPoint,
  color: string,
  width: number,
  lift = 0,
) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y - lift);
  ctx.lineTo(to.x, to.y - lift);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  point: ScreenPoint,
  w: number,
  h: number,
  color: string,
) {
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, w, h, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function sprite(
  ctx: CanvasRenderingContext2D,
  images: Images,
  path: string | undefined,
  point: ScreenPoint,
  width: number,
  anchor: number,
  flip = false,
) {
  const image = path ? images.get(path) : undefined;
  if (!image) return;
  const height = (width * image.naturalHeight) / image.naturalWidth;
  ctx.save();
  ctx.translate(point.x, point.y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, -width / 2, -height * anchor, width, height);
  ctx.restore();
}

const shadowMasks = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

function dinosaurShadow(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  point: ScreenPoint,
  width: number,
  flipped: boolean,
) {
  if (image) {
    let mask = shadowMasks.get(image);
    if (!mask) {
      const surface = document.createElement('canvas');
      surface.width = image.naturalWidth;
      surface.height = image.naturalHeight;
      const ink = surface.getContext('2d');
      if (ink) {
        ink.drawImage(image, 0, 0);
        ink.globalCompositeOperation = 'source-in';
        ink.fillStyle = '#252f1d';
        ink.fillRect(0, 0, surface.width, surface.height);
        mask = surface;
        shadowMasks.set(image, surface);
      }
    }
    if (mask) {
      const height = (width * mask.height) / mask.width;
      ctx.save();
      ctx.translate(point.x + 1, point.y + 2);
      ctx.transform(flipped ? -0.86 : 0.86, 0.04, -0.48, -0.27, 0, 0);
      ctx.globalAlpha = 0.32;
      ctx.filter = 'blur(1.5px)';
      ctx.drawImage(mask, -width / 2, -height * 0.89, width, height);
      ctx.restore();
    }
  }
  ellipse(ctx, { x: point.x + 5, y: point.y + 2 }, width * 0.25, width * 0.064, '#27321c45');
  ellipse(ctx, { x: point.x + 3, y: point.y + 0.5 }, width * 0.16, width * 0.033, '#202c1c75');
}

function herbivoreFence(
  ctx: CanvasRenderingContext2D,
  a: ScreenPoint,
  b: ScreenPoint,
  front: boolean,
) {
  const height = front ? 9 : 13;
  const rail = '#90643a';
  const trim = '#d8aa69';
  line(ctx, a, b, '#35442755', 6, -1);
  for (const fraction of [0.32, 0.77]) {
    line(ctx, a, b, rail, 4, height * fraction);
    line(ctx, a, b, trim, 1, height * fraction + 1);
  }
  const post = (p: ScreenPoint) => {
    ctx.fillStyle = rail;
    ctx.fillRect(p.x - 2.1, p.y - height, 4.2, height + 1);
    ctx.fillStyle = trim;
    ctx.fillRect(p.x - 2.1, p.y - height - 1, 2, height);
  };
  post(a);
  post(b);
}

const raised = (point: ScreenPoint, amount: number): ScreenPoint => ({
  x: point.x,
  y: point.y - amount,
});

function steelMesh(
  ctx: CanvasRenderingContext2D,
  a: ScreenPoint,
  b: ScreenPoint,
  height: number,
  near: boolean,
) {
  const panelTop = raised(a, height);
  const panelEnd = raised(b, height);
  polygon(ctx, [a, b, panelEnd, panelTop]);
  ctx.fillStyle = near ? '#35474126' : '#34443b69';
  ctx.fill();

  const wires = near ? '#2d3c3671' : '#293b32a8';
  for (const lift of [6, 12, 18, 24]) line(ctx, a, b, wires, 0.8, lift);
  for (let step = 1; step < 7; step++) {
    const fraction = step / 7;
    const point = { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
    line(ctx, point, raised(point, height), wires, 0.7);
  }
  line(ctx, a, panelEnd, near ? '#46585193' : '#45544a', 2.3);
  line(ctx, panelTop, b, near ? '#5a6a5c94' : '#57685a', 1.45);
  line(ctx, a, b, '#35463c', 3.5, 2);
  line(ctx, a, b, '#2d3d32', 4.2, height);
  line(ctx, a, b, '#9eaa93', 1.4, height + 1.1);
}

function steelColumn(
  ctx: CanvasRenderingContext2D,
  foot: ScreenPoint,
  height: number,
  wide: number,
) {
  const { x, y } = foot;
  ellipse(ctx, { x: x + 3, y: y + 2 }, wide + 2, 3, '#35442770');
  ctx.fillStyle = '#aaa08a';
  ctx.fillRect(x - wide - 1, y - 4, wide * 2 + 3, 5);
  ctx.fillStyle = '#323f36';
  ctx.fillRect(x - wide, y - height, wide * 2, height);
  ctx.fillStyle = '#89988a';
  ctx.fillRect(x - wide, y - height, wide * 0.68, height - 2);
  ctx.fillStyle = '#c79b4a';
  ctx.fillRect(x - wide, y - height + 2, wide * 2, 2.5);
  polygon(ctx, [
    { x: x - wide, y: y - height },
    { x: x, y: y - height - 3 },
    { x: x + wide, y: y - height },
    { x: x, y: y - height + 2 },
  ]);
  ctx.fillStyle = '#aeb59c';
  ctx.fill();
}

function carnivoreFence(
  ctx: CanvasRenderingContext2D,
  a: ScreenPoint,
  b: ScreenPoint,
  front: boolean,
) {
  const height = SAFARI_CARNIVORE_FENCE_HEIGHT;
  line(ctx, a, b, '#39452c76', 10, -2.8);
  line(ctx, a, b, '#7f7c68', 8, -1);
  line(ctx, a, b, '#bbb59c', 6.3, 0.2);
  steelMesh(ctx, a, b, height, front);
  steelColumn(ctx, a, height + 2, 3.15);
  steelColumn(ctx, b, height + 2, 3.15);
}

function gateHinges(from: SafariTile, to: SafariTile): [SafariTile, SafariTile] {
  const spread = 0.29;
  const shoulder = { x: (to.x - from.x) * spread, y: (to.y - from.y) * spread };
  return [
    { x: from.x - shoulder.x, y: from.y - shoulder.y },
    { x: to.x + shoulder.x, y: to.y + shoulder.y },
  ];
}

function drawGateDoors(
  ctx: CanvasRenderingContext2D,
  left: SafariTile,
  right: SafariTile,
  gate: SafariGate,
  opening: number,
) {
  const a = gridToScreen(left.x, left.y);
  const b = gridToScreen(right.x, right.y);
  const angle = (Math.PI / 2) * opening;
  const along = Math.cos(angle) * 0.5;
  const inward = (Math.sin(angle) * Math.hypot(right.x - left.x, right.y - left.y)) / 2;
  const dx = (gate.inside.x - gate.outside.x) * inward;
  const dy = (gate.inside.y - gate.outside.y) * inward;
  const height = SAFARI_CARNIVORE_FENCE_HEIGHT - 3;

  for (const [hinge, other, foot] of [
    [left, right, a],
    [right, left, b],
  ]) {
    const end = gridToScreen(
      hinge.x + (other.x - hinge.x) * along + dx,
      hinge.y + (other.y - hinge.y) * along + dy,
    );
    steelMesh(ctx, foot, end, height, false);
    polygon(ctx, [foot, end, raised(end, 9), raised(foot, 9)]);
    ctx.fillStyle = '#47594f';
    ctx.fill();
    line(ctx, foot, end, '#c38d48', 2.75, 9);
    line(ctx, foot, end, '#24332b', 2.4, 1);
    line(ctx, end, raised(end, height), '#304138', 3.15);
  }
}

function drawGatePylon(
  ctx: CanvasRenderingContext2D,
  images: Images,
  foot: ScreenPoint,
  mirror: boolean,
) {
  if (!images.has(safariMapArt.gatePylon)) {
    steelColumn(ctx, foot, SAFARI_CARNIVORE_FENCE_HEIGHT + 13, 7);
    return;
  }
  ellipse(ctx, { x: foot.x + 6, y: foot.y + 2 }, 14, 5.2, '#2c382b75');
  sprite(
    ctx,
    images,
    safariMapArt.gatePylon,
    foot,
    safariGatePylonArtwork.width,
    safariGatePylonArtwork.groundAnchorY,
    mirror,
  );
}

function drawGateBeam(ctx: CanvasRenderingContext2D, a: ScreenPoint, b: ScreenPoint) {
  const clearance = SAFARI_CARNIVORE_FENCE_HEIGHT + 8;
  line(ctx, a, b, '#2e352d', 6.5, clearance - 1);
  line(ctx, a, b, '#5b6254', 4.5, clearance);
  line(ctx, a, b, '#aeb297', 1.6, clearance + 2);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - clearance };
  const offset = { x: (b.x - a.x) * 0.13, y: (b.y - a.y) * 0.13 };
  const start = { x: mid.x - offset.x, y: mid.y - offset.y };
  const end = { x: mid.x + offset.x, y: mid.y + offset.y };
  line(ctx, start, end, '#3f3727', 7.5);
  line(ctx, start, end, '#ca9040', 4.75);
  ellipse(ctx, raised(mid, 1), 2.4, 1.5, '#ffe9a4');
}

function drawPool(ctx: CanvasRenderingContext2D, point: ScreenPoint) {
  ellipse(ctx, point, 25, 11, '#8b9465');
  ellipse(ctx, point, 21, 8.5, '#426f64');
  ellipse(ctx, { x: point.x, y: point.y - 1 }, 19, 7, '#69a6a6');
  ellipse(ctx, { x: point.x - 7, y: point.y - 3 }, 7, 0.9, '#c4dcbc');
  for (const [x, y, w] of [
    [-19, 4, 3],
    [16, 4, 4],
    [19, -6, 2.5],
    [-5, 8, 4],
  ]) {
    ellipse(ctx, { x: point.x + x, y: point.y + y }, w, 2.5, '#d0bd91');
  }
}

function marker(
  ctx: CanvasRenderingContext2D,
  text: string,
  point: ScreenPoint,
  color: string,
  scale: number,
) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff1cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -14, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#fff6df';
  ctx.fillText(text, 0, -13.5);
  ctx.restore();
}

type Viewport = { width: number; height: number };
type Scene = {
  draft: SafariDraft;
  safari: ParkSafariResponse;
  buildings: readonly BuildingResponse[];
  pathTiles: readonly SafariTile[];
  camera: SafariCamera;
  viewport: Viewport;
  images: Images;
  activeZone: SafariZoneKind;
  selectedTile?: SafariTile;
  route?: SafariTile[];
  tourView?: SafariView;
  gate?: SafariGate;
  gateOpening: number;
  jeep?: SafariTile;
  jeepFlipped: boolean;
  edit: boolean;
};

export function drawSafariPark(ctx: CanvasRenderingContext2D, scene: Scene) {
  const { draft, safari, camera, images, viewport, activeZone, edit, route, tourView, gate, jeep } =
    scene;
  const layers: MapLayer[] = [];
  const bounds = safari.bounds;
  const half = { x: viewport.width / 2 / camera.zoom, y: viewport.height / 2 / camera.zoom };
  const visible = (p: ScreenPoint, pad = 64) =>
    Math.abs(p.x - camera.x) < half.x + pad && Math.abs(p.y - camera.y) < half.y + pad;
  const paintExtent = { x: camera.x - half.x, y: camera.y - half.y, w: half.x * 2, h: half.y * 2 };
  const terrainTint = ['#d8c96d12', '#5a7b3a18', '#f7dc9210', '#8bb1571f'];
  const blocked = new Set(safari.blockedTiles.map(safariTileKey));
  const publicPaths = new Set(scene.pathTiles.map(safariTileKey));
  ctx.save();
  ctx.translate(viewport.width / 2, viewport.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  const sea = images.get(safariMapArt.sea);
  ctx.fillStyle = (sea && ctx.createPattern(sea, 'repeat')) || '#53979e';
  ctx.fillRect(paintExtent.x, paintExtent.y, paintExtent.w, paintExtent.h);
  const meadow = images.get(safariMapArt.meadow);
  const grass = (meadow && ctx.createPattern(meadow, 'repeat')) || '#9cb365';
  polygon(ctx, islandScreenCoast);
  ctx.strokeStyle = '#cfbb83';
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.fillStyle = grass;
  ctx.fill();

  for (let y = 0; y < bounds.height; y++) {
    for (let x = 0; x < bounds.width; x++) {
      const tile = { x, y };
      const point = gridToScreen(x, y);
      if (!visible(point, 40)) continue;
      const key = safariTileKey(tile);
      tileDiamond(ctx, tile);
      ctx.fillStyle = terrainTint[Math.abs(x * 51 + y * 27 + x * y * 13) % terrainTint.length];
      ctx.fill();
      if (blocked.has(key)) {
        ctx.fillStyle = publicPaths.has(key) ? '#d4b786' : '#39342118';
        ctx.fill();
      }
      if (edit) {
        ctx.strokeStyle = '#2a3f282e';
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }
    }
  }

  for (const kind of safariZones) {
    const { tiles, water, brush } = draft.zones[kind];
    const zoneKeys = new Set(tiles.map(safariTileKey));
    const heavy = kind === 'carnivore';
    for (const tile of tiles) {
      const point = gridToScreen(tile.x, tile.y);
      if (!visible(point)) continue;
      tileDiamond(ctx, tile);
      ctx.fillStyle = heavy ? '#a4753d66' : '#afc76d86';
      ctx.fill();
      if (edit && kind === activeZone) {
        ctx.strokeStyle = '#f1e7a652';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (const edge of edges) {
        const { across, from, to, front } = edge;
        const neighbor = { x: tile.x + across.x, y: tile.y + across.y };
        if (zoneKeys.has(safariTileKey(neighbor))) continue;
        const a = { x: tile.x + from[0], y: tile.y + from[1] };
        const b = { x: tile.x + to[0], y: tile.y + to[1] };
        const depth = point.y + (front ? 10 : -10);
        if (
          heavy &&
          gate &&
          sameSafariTile(tile, gate.inside) &&
          sameSafariTile(neighbor, gate.outside)
        ) {
          const [left, right] = gateHinges(a, b);
          layers.push({
            depth,
            draw: () => drawGateDoors(ctx, left, right, gate, scene.gateOpening),
          });
          const posts = [gridToScreen(left.x, left.y), gridToScreen(right.x, right.y)];
          posts.sort((first, second) => first.x - second.x);
          layers.push({
            depth: Math.max(posts[0].y, posts[1].y) + 5,
            draw: () => drawGateBeam(ctx, posts[0], posts[1]),
          });
          for (const [index, foot] of posts.entries()) {
            layers.push({
              depth: foot.y + 11,
              draw: () => drawGatePylon(ctx, images, foot, index === 1),
            });
          }
        } else {
          const fence = heavy ? carnivoreFence : herbivoreFence;
          layers.push({
            depth,
            draw: () => fence(ctx, gridToScreen(a.x, a.y), gridToScreen(b.x, b.y), front),
          });
        }
      }
    }

    for (const tile of water) {
      const p = gridToScreen(tile.x, tile.y);
      if (visible(p)) layers.push({ depth: p.y - 8, draw: () => drawPool(ctx, p) });
    }
    for (const tile of brush) {
      const p = gridToScreen(tile.x, tile.y);
      if (!visible(p)) continue;
      layers.push({
        depth: p.y,
        draw: () => {
          ellipse(ctx, { x: p.x + 5, y: p.y + 1 }, 23, 7, '#364c2b66');
          sprite(ctx, images, safariMapArt.shrub, p, 61, 0.82);
        },
      });
    }

    const animals =
      tourView?.zoneKind === kind
        ? tourView.sightings
        : getSafariDinosaurPositions(draft.zones[kind], heavy ? route : undefined);
    for (const [index, { dinosaurId, tile }] of animals.entries()) {
      const dinosaur = safari.dinosaurs.find((dino) => dino.id === dinosaurId);
      if (!dinosaur) continue;
      const p = gridToScreen(tile.x, tile.y);
      if (!visible(p, 100)) continue;
      const neighbor = animals.find(
        ({ tile: other }) => Math.abs(other.x - tile.x) + Math.abs(other.y - tile.y) === 1,
      );
      const bank = water.some((pool) => pool.x === tile.x && pool.y === tile.y);
      const offset = neighbor
        ? 15 * Math.sign(p.x - gridToScreen(neighbor.tile.x, neighbor.tile.y).x)
        : bank
          ? -13
          : 0;
      const at = { x: p.x + offset, y: p.y + 6 };
      const art = safariDinosaurArt(dinosaur.speciesId);
      const flipped = index % 2 === 1;
      layers.push({
        depth: at.y + 0.1,
        draw: () => {
          const width = dinosaur.speciesId === 'tyrannosaurus-rex' ? 113 : 91;
          dinosaurShadow(ctx, art ? images.get(art) : undefined, at, width, flipped);
          sprite(ctx, images, art, at, width, 0.89, flipped);
          if (!art) marker(ctx, dinosaur.name.slice(0, 1), at, '#52634c', 1.2);
        },
      });
    }
  }

  if (gate) {
    const approach = gridToScreen(gate.outside.x, gate.outside.y);
    const yard = gridToScreen(gate.inside.x, gate.inside.y);
    line(ctx, approach, yard, '#676347a6', 34);
    line(ctx, approach, yard, '#bbb19a', 30);
    line(ctx, approach, yard, '#d9ccae', 26);
  }
  if (route?.length) {
    ctx.beginPath();
    for (const tile of route) {
      const point = gridToScreen(tile.x, tile.y);
      ctx.lineTo(point.x, point.y);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7c623774';
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.strokeStyle = '#e7c995';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = '#f8edd4bb';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (tourView) {
    const start = gridToScreen(tourView.tile.x, tourView.tile.y);
    ctx.setLineDash([5, 6]);
    for (const sighting of tourView.sightings)
      line(ctx, start, gridToScreen(sighting.tile.x, sighting.tile.y), '#fff3bb', 2);
    ctx.setLineDash([]);
  }

  if (edit && scene.selectedTile) {
    tileDiamond(ctx, scene.selectedTile, 0.48);
    ctx.fillStyle = '#ffe8a841';
    ctx.fill();
    ctx.strokeStyle = '#fff0b8';
    ctx.lineWidth = 2 / camera.zoom;
    ctx.stroke();
  }

  for (const building of scene.buildings) {
    const size = getBuildingById(building.typeId)?.size ?? { width: 1, height: 1 };
    const at = gridToScreen(
      building.positionX + (size.width - 1) / 2,
      building.positionY + (size.height - 1) / 2,
    );
    if (!visible(at, 180)) continue;
    const art = getBuildingRasterArtwork(
      building.typeId,
      getCompletedBuildingArtworkLevel(building),
    );
    const width = ISO_CONFIG.TILE_WIDTH * size.width * 0.95;
    layers.push({
      depth: at.y,
      draw: () => {
        ctx.save();
        ctx.globalAlpha = 0.82;
        sprite(ctx, images, art?.path, at, width, art?.groundAnchorY ?? 0.65, building.isMirrored);
        ctx.restore();
      },
    });
  }

  // Keep the existing park boundary legible on the plot overlay.
  const outer = [
    gridToScreen(-0.5, -0.5),
    gridToScreen(bounds.width - 0.5, -0.5),
    gridToScreen(bounds.width - 0.5, bounds.height - 0.5),
    gridToScreen(-0.5, bounds.height - 0.5),
  ];
  polygon(ctx, outer);
  ctx.strokeStyle = '#304b3288';
  ctx.lineWidth = 2.75;
  ctx.stroke();
  for (const [index, tile] of draft.stops.entries()) {
    if (!tile) continue;
    const p = gridToScreen(tile.x, tile.y);
    const color = index === 0 ? '#506912' : '#824e28';
    if (!visible(p)) continue;
    layers.push({
      depth: p.y + 15,
      draw: () =>
        marker(
          ctx,
          String(index + 1),
          { x: p.x, y: p.y - (jeep ? 16 : 4) },
          color,
          Math.max(1, 0.8 / camera.zoom),
        ),
    });
  }

  if (jeep) {
    const p = gridToScreen(jeep.x, jeep.y);
    layers.push({
      depth: p.y + 6,
      draw: () => {
        ellipse(ctx, { x: p.x + 5, y: p.y + 5 }, 26, 7, '#3441267c');
        sprite(ctx, images, safariMapArt.jeep, p, 51, 0.87, scene.jeepFlipped);
      },
    });
  }

  layers.sort((a, b) => a.depth - b.depth);
  for (const layer of layers) layer.draw();
  ctx.restore();
}
