import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Recompose the game's existing placeholder artwork. No generated species,
// labels, or replacement drawing is introduced into this cover illustration.
const guidebookDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(guidebookDir, '../..');
const assetDir = path.join(projectRoot, 'apps/client/public/assets/placeholders');
const outputFile = path.join(guidebookDir, 'artwork/park-cover.png');
const bundledNodeDir = path.join(
  os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node',
);
const requireBundled = createRequire(path.join(bundledNodeDir, 'package.json'));
const sharp = requireBundled('sharp');

async function artwork(name) {
  const svg = await fs.readFile(path.join(assetDir, name), 'utf8');
  const match = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/);
  if (!match) throw new Error(`Invalid SVG asset: ${name}`);
  return match[1];
}

const [grassland, entrance, para, iguanodon, lumberyard, quarry] = await Promise.all([
  'habitat-grassland.svg',
  'operation-entrance-gate-open.svg',
  'parasaurolophus.svg',
  'iguanodon.svg',
  'production-lumberyard.svg',
  'production-quarry.svg',
].map(artwork));

// The first two grassland paths are the original island surface and its edge;
// the entrance's first path is its original paved forecourt. Keep their SVG
// markup verbatim, using only group position, size, and opacity for composition.
function firstPaths(body, count) {
  const paths = [...body.matchAll(/<path\b[^>]*\/>/g)].slice(0, count);
  if (paths.length !== count) throw new Error('Required original surface is missing');
  return paths.map(([markup]) => markup).join('\n');
}

const ground = firstPaths(grassland, 2);
const paving = firstPaths(entrance, 1);
const group = (body, x, y, sx, sy = sx, opacity = 1) =>
  `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" opacity="${opacity}">${body}</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480">
  ${group(ground, 24, -28, 6, 4, 0.16)}
  ${group(paving, 230, 188, 3.35, 0.75, 0.55)}
  ${group(lumberyard, 778, 132, 1.3)}
  ${group(quarry, 864, 210, 1.08)}
  ${group(grassland, 421, 111, 1.9)}
  ${group(para, 464, 153, 0.92)}
  ${group(iguanodon, 590, 169, 0.87)}
  ${group(entrance, 168, 164, 1.32)}
</svg>`;

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await sharp(Buffer.from(svg), { density: 144 })
  .resize(1200, 480)
  .flatten({ background: '#ffffff' })
  .png({ compressionLevel: 9 })
  .toFile(outputFile);
const { width, height } = await sharp(outputFile).metadata();
console.log(JSON.stringify({ output: outputFile, width, height, assets: 6 }));
