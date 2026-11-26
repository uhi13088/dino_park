import { Injectable } from '@nestjs/common';
import type { DinosaurSize, ExperimentalHybridTier, RepeatSynthesisFocus } from '@dino-park/shared';
import sharp from 'sharp';

interface ArtRequest {
  lineageId: string;
  name: string;
  parentNames: string[];
  focus: RepeatSynthesisFocus;
  size: DinosaurSize;
  tier: ExperimentalHybridTier;
}

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 4 * 1024 * 1024;
export class ExperimentalHybridProviderError extends Error {
  constructor(readonly status: number) {
    super(`Hybrid artwork provider returned HTTP ${status}`);
  }

  get retryable() {
    return this.status >= 500 || this.status === 429;
  }
}

const focusShape: Record<RepeatSynthesisFocus, string> = {
  audience:
    'An impressive silhouette, with the head and neck shaped together around its most recognizable crest, frill, or horn.',
  sprint:
    'A lean, low profile with form-fitting, swept-back head features, strong legs and a balanced tail.',
  balanced: 'Balanced body proportions with distinctive traits from both parent species visible.',
};

function artPrompt({ parentNames, focus, size, tier }: ArtRequest) {
  return [
    'Create one coherent fictional animal for a stylized, semi-realistic 2.5D dinosaur park management game.',
    `The creature combines recognizable visual traits of ${parentNames.join(' and ')}. It has a ${size} build and belongs to the ${tier} collection tier.`,
    focusShape[focus],
    'Design the entire animal as a unified sculpt, with plausible musculature and joints, warm natural colors, readable shapes, slightly exaggerated proportions, and matte scaly skin. Use soft light from upper left.',
    'Full body visible in a consistent mildly top-down orthographic three-quarter view facing right. Stand calmly on the same implied ground plane, show legs, feet and tail tip, use comfortable padding. No ground, no shadows, no labels, no typography, no graphic effects.',
    'Fill the entire background with one perfectly flat, saturated RGB (255, 0, 255) magenta color for studio chroma key. Keep the dinosaur entirely in natural olive, warm brown and ivory hues, with no magenta on the subject and no magenta light spilling onto it.',
  ].join(' ');
}

async function imageBytes(response: Response): Promise<Buffer> {
  if (!response.ok || !response.body) throw new Error('Generated image could not be loaded');
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_IMAGE_BYTES) throw new Error('Generated image exceeds the input limit');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks, length);
}

/** Align one validated cutout to the park renderer's 384×256, (192,228) foot anchor. */
export async function prepareExperimentalHybridSprite(
  bytes: Buffer,
  studioMatte = false,
): Promise<Buffer> {
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('Generated image exceeds the input limit');
  const source = sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'warning' });
  const meta = await source.metadata();
  if (meta.format !== 'png' || (!studioMatte && !meta.hasAlpha) || (meta.pages ?? 1) !== 1)
    throw new Error('Generated image must be a transparent PNG');

  const { data, info } = await source.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const matteStrength = (offset: number) =>
    Math.min(data[offset], data[offset + 2]) - data[offset + 1];
  const corners = [0, (info.width - 1) * 4, (info.height - 1) * info.width * 4, data.length - 4];
  if (studioMatte && corners.every((offset) => matteStrength(offset) >= 130)) {
    for (let offset = 0; offset < data.length; offset += 4) {
      const key = matteStrength(offset);
      if (key < 65) continue;
      const alpha = Math.min(data[offset + 3], Math.max(0, 255 - 4 * (key - 65)));
      if (alpha) {
        // Limit magenta fringing in the partially transparent silhouette boundary.
        data[offset] = Math.min(data[offset], data[offset + 1] + 44);
        data[offset + 2] = Math.min(data[offset + 2], data[offset + 1] + 28);
      }
      data[offset + 3] = alpha;
    }
  }
  let left = info.width;
  let right = 0;
  let top = info.height;
  let bottom = 0;
  let transparent = 0;
  let opaque = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha < 16) transparent++;
      if (alpha >= 145) {
        opaque++;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  const pixels = info.width * info.height;
  if (
    transparent / pixels < 0.18 ||
    opaque / pixels < 0.055 ||
    right - left < 48 ||
    bottom - top < 36
  )
    throw new Error('The generated cutout did not pass transparency and framing checks');

  const crop = {
    left: Math.max(0, left - 3),
    top: Math.max(0, top - 3),
    width: Math.min(info.width, right + 4) - Math.max(0, left - 3),
    height: Math.min(info.height, bottom + 4) - Math.max(0, top - 3),
  };
  const { data: sprite, info: scaled } = await sharp(data, { raw: info })
    .extract(crop)
    .resize({ width: 348, height: 212, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const anchor = Math.round(((bottom - crop.top) * scaled.height) / crop.height);

  return sharp({ create: { width: 384, height: 256, channels: 4, background: '#00000000' } })
    .composite([{ input: sprite, left: Math.round((384 - scaled.width) / 2), top: 228 - anchor }])
    .png()
    .toBuffer();
}

@Injectable()
export class ExperimentalHybridArtService {
  get enabled(): boolean {
    return process.env.HYBRID_ART_PROVIDER === 'fal' && Boolean(process.env.FAL_KEY);
  }

  async generate(input: ArtRequest): Promise<Buffer> {
    if (!this.enabled) throw new Error('Hybrid image generation is unavailable');
    const response = await fetch('https://fal.run/openai/gpt-image-2', {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(180_000),
      body: JSON.stringify({
        prompt: artPrompt(input),
        image_size: 'landscape_4_3',
        quality: 'medium',
        background: 'auto',
        output_format: 'png',
        num_images: 1,
        enable_safety_checker: true,
      }),
    });
    if (!response.ok) throw new ExperimentalHybridProviderError(response.status);

    const result = (await response.json()) as { images?: { url?: string }[] };
    const image = result.images?.[0]?.url;
    if (!image) throw new Error('Hybrid artwork provider returned no image');
    const url = new URL(image);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      !(url.hostname === 'fal.media' || url.hostname.endsWith('.fal.media'))
    )
      throw new Error('Hybrid artwork provider returned an unexpected media URL');

    return prepareExperimentalHybridSprite(
      await imageBytes(
        await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) }),
      ),
      true,
    );
  }
}
