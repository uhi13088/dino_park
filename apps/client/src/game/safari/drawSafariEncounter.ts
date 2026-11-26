import {
  SAFARI_CONTACT,
  SAFARI_DURATION,
  SAFARI_EVENTS,
  SAFARI_SCENE,
  type Point,
  type SafariPose,
  type SafariSnapshot,
} from './safariEncounter';

const assetBase = '/assets/safari-encounter';

const textures = {
  habitat: 'waterhole.webp',
  trex: 'trex.webp',
  stego: 'stegosaurus.webp',
  jeep: 'jeep.webp',
  robot: 'robot.webp',
} as const;

export type SafariAssets = Record<keyof typeof textures, HTMLImageElement>;
export type SafariCamera = Point & { zoom: number };

export function defaultSafariCamera(): SafariCamera {
  return { x: SAFARI_SCENE.width / 2, y: 336, zoom: 1 };
}

export const SAFARI_SOUND_URLS = {
  warning: `${assetBase}/warning.mp3`,
  impact: `${assetBase}/impact.mp3`,
  intervene: `${assetBase}/intervene.mp3`,
} as const;

export async function loadSafariAssets(): Promise<SafariAssets> {
  const pairs = await Promise.all(
    Object.entries(textures).map(async ([name, path]) => {
      const image = new Image();
      image.src = `${assetBase}/${path}`;
      await image.decode();
      if (name === 'trex' || name === 'stego') {
        const { columns, rows, frameWidth, frameHeight } = SAFARI_SCENE;
        if (
          image.naturalWidth !== columns * frameWidth ||
          image.naturalHeight !== rows * frameHeight
        )
          throw new Error(`${path} atlas does not match the animation frames`);
      }
      return [name, image] as const;
    }),
  );
  return Object.fromEntries(pairs) as SafariAssets;
}

function shadow(ctx: CanvasRenderingContext2D, point: Point, width: number, height: number) {
  ctx.save();
  ctx.translate(point.x + 7, point.y + 6);
  ctx.scale(width, height);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, 'rgb(32 26 17 / 0.45)');
  gradient.addColorStop(0.55, 'rgb(32 26 17 / 0.3)');
  gradient.addColorStop(1, 'rgb(32 26 17 / 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawDinosaur(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  { x, y, frame, facing }: SafariPose,
  scale: number,
) {
  const { columns, frameWidth, frameHeight, footX, footY } = SAFARI_SCENE;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  ctx.drawImage(
    atlas,
    (frame % columns) * frameWidth,
    Math.floor(frame / columns) * frameHeight,
    frameWidth,
    frameHeight,
    -footX,
    -footY,
    frameWidth,
    frameHeight,
  );
  ctx.restore();
}

function drawVehicle(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  point: Point,
  width: number,
) {
  const height = (width * sprite.naturalHeight) / sprite.naturalWidth;
  ctx.drawImage(sprite, point.x - width / 2, point.y - height * 0.88, width, height);
}

function drawDust(ctx: CanvasRenderingContext2D, position: Point, age: number, full: boolean) {
  if (age < 0 || age >= 0.86) return;
  ctx.save();
  ctx.translate(position.x, position.y);
  const fade = 1 - age / 0.86;
  for (let i = 0; i < (full ? 11 : 5); i++) {
    const angle = (i * 2.39996) % (Math.PI * 2);
    const distance = (18 + ((i * 17) % 40)) * age;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.46 - age * (7 + (i % 3) * 9);
    const size = 3 + age * (5 + (i % 5) * 2);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(239,213,148,${fade * (full ? 0.58 : 0.4)})`);
    gradient.addColorStop(1, 'rgba(239,213,148,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }
  ctx.restore();
}

function drawRobotPulse(ctx: CanvasRenderingContext2D, point: Point, age: number) {
  if (age < 0 || age >= 1.8) return;
  const playhead = (age % 0.75) / 0.75;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, 11 + 56 * playhead, 4 + 20 * playhead, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(186,237,232,${(1 - playhead) * 0.8})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function followCamera(snapshot: SafariSnapshot): SafariCamera {
  const pullback = Math.max(
    0,
    (snapshot.time - SAFARI_EVENTS.retreat) / (SAFARI_DURATION - SAFARI_EVENTS.retreat),
  );
  const jeepWeight = 0.47 + 0.13 * pullback;
  return {
    x: snapshot.jeep.x * jeepWeight + ((snapshot.trex.x + snapshot.stego.x) / 2) * (1 - jeepWeight),
    y: Math.min(snapshot.jeep.y - 116, 412),
    zoom: 1.42 - 0.17 * pullback,
  };
}

export function drawSafariFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  assets: SafariAssets,
  snapshot: SafariSnapshot,
  camera: SafariCamera,
  follow: boolean,
  reducedMotion: boolean,
) {
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(canvas.clientWidth * pixelRatio);
  const height = Math.round(canvas.clientHeight * pixelRatio);
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const { width: sceneWidth, height: sceneHeight } = SAFARI_SCENE;
  const target = follow ? followCamera(snapshot) : defaultSafariCamera();
  const step = reducedMotion ? 1 : 0.15;
  camera.x += (target.x - camera.x) * step;
  camera.y += (target.y - camera.y) * step;
  camera.zoom += (target.zoom - camera.zoom) * step;
  const isPortrait = width / height < 1.12;
  const cover = Math.max(width / sceneWidth, height / sceneHeight);
  const fit = Math.min(width / sceneWidth, height / sceneHeight);
  const scale = (isPortrait ? fit : cover) * camera.zoom;
  const rangeX = Math.min(sceneWidth / 2, width / (2 * scale));
  const rangeY = Math.min(sceneHeight / 2, height / (2 * scale));
  const x = Math.max(rangeX, Math.min(sceneWidth - rangeX, camera.x));
  const y = Math.max(rangeY, Math.min(sceneHeight - rangeY, camera.y));
  const hit = snapshot.impactAge;
  const shake =
    !reducedMotion && hit !== null && hit < 0.3 ? Math.sin(hit * 49) * 3 * (1 - hit / 0.3) : 0;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#273520';
  ctx.fillRect(0, 0, width, height);
  ctx.setTransform(scale, 0, 0, scale, width / 2 - x * scale + shake, height / 2 - y * scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(assets.habitat, 0, 0, sceneWidth, sceneHeight);

  const { trex, stego, robot, jeep } = snapshot;
  shadow(ctx, trex, 49, 18);
  shadow(ctx, stego, 62, 17);
  shadow(ctx, jeep, 42, 13);
  if (robot) {
    shadow(ctx, robot, 18, 7);
    if (snapshot.pulseAge !== null) drawRobotPulse(ctx, robot, snapshot.pulseAge);
  }
  const actors: Array<{ depth: number; paint: () => void }> = [
    { depth: trex.y, paint: () => drawDinosaur(ctx, assets.trex, trex, 1.18) },
    { depth: stego.y, paint: () => drawDinosaur(ctx, assets.stego, stego, 1.08) },
    { depth: jeep.y, paint: () => drawVehicle(ctx, assets.jeep, jeep, 96) },
  ];
  if (robot)
    actors.push({ depth: robot.y, paint: () => drawVehicle(ctx, assets.robot, robot, 39) });
  actors.sort((first, second) => first.depth - second.depth);
  for (const actor of actors) actor.paint();

  if (snapshot.stage === 'charge')
    drawDust(ctx, { x: trex.x - 24, y: trex.y + 1 }, (snapshot.time * 2.8) % 1, false);
  if (hit !== null) drawDust(ctx, SAFARI_CONTACT, hit, true);
}
