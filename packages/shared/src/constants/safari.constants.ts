export const SAFARI_ZONES = ['herbivore', 'carnivore'] as const;

export const PARK_SAFARI = {
  unlockParkLevel: 10,
  tileGold: 120,
  minTiles: { herbivore: 9, carnivore: 48 },
  carnivoreMinSpan: 6,
  maxTilesPerZone: 144,
  waterPerZone: 2,
  brushPerZone: 16,
  maxViewDistance: 8,
  species: { stegosaurus: 'herbivore', 'tyrannosaurus-rex': 'carnivore' },
} as const;
