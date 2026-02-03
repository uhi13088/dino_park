import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/dinosaurs/index.ts',
    'src/buildings/index.ts',
    'src/great-figures/index.ts',
    'src/balance/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
