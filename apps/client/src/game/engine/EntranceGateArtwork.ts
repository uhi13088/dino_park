import type { Sprite, Texture } from 'pixi.js';
import type { ParkEntranceFrame } from './ParkExterior';

const closedGate = '/assets/buildings/entrance-isometric-up.webp';
const openGate = '/assets/buildings/entrance-isometric-up-open.webp';
const leftPier = { x: 80, y: 469.5 };
const rightPier = { x: 417.25, y: 292.5 };

export const entranceGateTexturePaths = [closedGate, openGate];

export const entranceGateThumbnail = (isOpen = false): string => (isOpen ? openGate : closedGate);

export function placeEntranceGateArtwork(
  sprite: Sprite,
  frame: ParkEntranceFrame | null,
  fallbackSpan: number,
  textures: Readonly<Record<string, Texture>>,
  isOpen: boolean,
): void {
  const dx = frame ? frame.end.x - frame.start.x : fallbackSpan;
  const risesToRight = frame && (frame.end.y - frame.start.y) * dx < 0;
  const texture = textures[entranceGateThumbnail(isOpen)];
  if (sprite.texture !== texture) sprite.texture = texture;
  // Keep the fence midpoint fixed when the two pier positions are mirrored.
  sprite.anchor.set(
    (leftPier.x + rightPier.x) / (2 * texture.width),
    (leftPier.y + rightPier.y) / (2 * texture.height),
  );
  const scale = Math.abs(dx) / (rightPier.x - leftPier.x);
  sprite.scale.set(risesToRight ? scale : -scale, scale);
}
