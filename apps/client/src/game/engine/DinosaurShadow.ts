import * as PIXI from 'pixi.js';

export function createDinosaurShadow(spriteWidth: number) {
  const shadow = new PIXI.Graphics({ eventMode: 'none' });
  for (const [extent, alpha] of [
    [1, 0.09],
    [0.87, 0.11],
    [0.72, 0.14],
  ]) {
    shadow
      .ellipse(spriteWidth * 0.12, 4, spriteWidth * 0.29 * extent, 8 * extent)
      .fill({ color: 0x3b4626, alpha });
  }
  return shadow.ellipse(1, 1, spriteWidth * 0.17, 4.2).fill({ color: 0x30351f, alpha: 0.36 });
}
