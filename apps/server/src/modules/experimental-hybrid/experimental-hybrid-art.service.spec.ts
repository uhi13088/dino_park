import sharp from 'sharp';
import { prepareExperimentalHybridSprite } from './experimental-hybrid-art.service';

describe('generated hybrid sprite preparation', () => {
  it('fits transparent output to the map art dimensions and ground anchor', async () => {
    const subject = await sharp({
      create: { width: 164, height: 95, channels: 4, background: '#876624ff' },
    })
      .png()
      .toBuffer();
    const cutout = await sharp({
      create: { width: 320, height: 260, channels: 4, background: '#00000000' },
    })
      .composite([{ input: subject, left: 20, top: 60 }])
      .png()
      .toBuffer();

    const result = await prepareExperimentalHybridSprite(cutout);
    const { data, info } = await sharp(result).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height, info.channels]).toEqual([384, 256, 4]);
    expect(data[3]).toBe(0);
    const alphaAt = (x: number, y: number) => data[(y * 384 + x) * 4 + 3];
    expect(alphaAt(192, 227)).toBeGreaterThan(128);
    expect(alphaAt(192, 237)).toBe(0);
  });

  it('rejects a PNG with a white backing even when it has an alpha channel', async () => {
    const opaque = await sharp({
      create: { width: 128, height: 128, channels: 4, background: '#ffffffff' },
    })
      .png()
      .toBuffer();
    await expect(prepareExperimentalHybridSprite(opaque)).rejects.toThrow('transparency');
  });

  it('separates a studio matte from a generated opaque PNG', async () => {
    const subject = await sharp({
      create: { width: 130, height: 85, channels: 3, background: '#82682e' },
    })
      .png()
      .toBuffer();
    const raster = await sharp({
      create: { width: 290, height: 205, channels: 3, background: '#ff00ff' },
    })
      .composite([{ input: subject, left: 80, top: 61 }])
      .removeAlpha()
      .png()
      .toBuffer();
    const cutout = await prepareExperimentalHybridSprite(raster, true);
    const { data } = await sharp(cutout).raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0);
    expect(data[(193 * 384 + 192) * 4 + 3]).toBe(255);
  });
});
