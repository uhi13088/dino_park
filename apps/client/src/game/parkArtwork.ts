import { BUILDING_DATA, FUEL_DEPOT_TYPE_ID, SECURITY_CENTER_TYPE_ID } from '@dino-park/game-data';
import {
  BuildingCategory,
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
  type BuildingResponse,
} from '@dino-park/shared';
import { buildingIds } from './buildingRasterManifest.json';

const dinosaurArt = [
  'parasaurolophus',
  'iguanodon',
  'triceratops',
  'stegosaurus',
  FIRST_HYBRID_SPECIES_ID,
];
const placeholder = (id: string) => `/assets/placeholders/${id}.svg`;
const buildingRaster = (id: string) => `/assets/buildings/${id}.webp`;
const platformDefault = '/assets/buildings/viewing-platform.webp';
const platformCovered = '/assets/buildings/viewing-platform-lv5.webp';
const parasaurolophusFolder = '/assets/dinosaurs/parasaurolophus';

export const entranceGateId = PARK_ADMISSION.entranceTypeId;
const openGatePath = buildingRaster(`${entranceGateId}-open`);
export type BuildingRaster = { path: string; groundAnchorY?: number };

export const HABITAT_FENCE_UPGRADE_LEVEL = 5;
export const SAFARI_CARNIVORE_FENCE_HEIGHT = 32;
export const safariGatePylonArtwork = {
  path: buildingRaster('safari-security-pylon'),
  groundAnchorY: 0.9,
  width: 36,
};
const reinforcedHabitatArtwork = new Map<string, BuildingRaster>(
  [
    'habitat-grassland',
    'habitat-forest',
    'habitat-carnivore',
    FIRST_HYBRID_HABITAT_ID,
    'habitat-desert',
    'habitat-volcanic',
    'habitat-glacier',
  ].map((typeId) => [typeId, { path: buildingRaster(`${typeId}-lv5`) }]),
);

const existingBuildingArtwork = new Map<string, BuildingRaster>([
  [entranceGateId, { path: buildingRaster(entranceGateId), groundAnchorY: 0.604 }],
  [PARK_ADMISSION.platformTypeId, { path: platformDefault }],
  [FIRST_HYBRID_LAB_ID, { path: buildingRaster(FIRST_HYBRID_LAB_ID), groundAnchorY: 0.644 }],
  [
    'production-lumberyard',
    { path: buildingRaster('production-lumberyard'), groundAnchorY: 0.748 },
  ],
  ['production-quarry', { path: buildingRaster('production-quarry'), groundAnchorY: 0.664 }],
  [FUEL_DEPOT_TYPE_ID, { path: buildingRaster(FUEL_DEPOT_TYPE_ID), groundAnchorY: 0.61 }],
  ['habitat-carnivore', { path: buildingRaster('habitat-carnivore-electric') }],
  [
    SECURITY_CENTER_TYPE_ID,
    { path: buildingRaster(SECURITY_CENTER_TYPE_ID), groundAnchorY: 0.664 },
  ],
]);

const starterHabitats = ['habitat-grassland', FIRST_HYBRID_HABITAT_ID];
const deliveredRasters = new Set<string>(buildingIds);
export const buildingRasterArtwork = new Map<string, BuildingRaster>([
  ...Array.from(existingBuildingArtwork),
  ...BUILDING_DATA.filter(
    ({ id, category }) =>
      category !== BuildingCategory.DECORATION &&
      !existingBuildingArtwork.has(id) &&
      deliveredRasters.has(id),
  ).map(({ id }): [string, BuildingRaster] => [id, { path: buildingRaster(id) }]),
]);

export const starterHabitatTexturePaths = starterHabitats
  .filter((id) => buildingRasterArtwork.has(id))
  .map(buildingRaster);

export const parasaurolophusArtwork = {
  speciesId: 'parasaurolophus',
  placeholder: placeholder('parasaurolophus'),
  idle: `${parasaurolophusFolder}/idle.webp`,
  walk: [
    'walk-01.webp',
    'walk-02.webp',
    'walk-03.webp',
    'walk-04.webp',
    'walk-05.webp',
    'walk-06.webp',
  ].map((name) => `${parasaurolophusFolder}/${name}`),
};

export const dinosaurRasterArtwork = new Map([
  [parasaurolophusArtwork.speciesId, { path: parasaurolophusArtwork.idle, width: 66 }],
  ['iguanodon', { path: '/assets/dinosaurs/iguanodon/idle.webp', width: 76 }],
  ['triceratops', { path: '/assets/dinosaurs/triceratops/idle.webp', width: 78 }],
  ['stegosaurus', { path: '/assets/dinosaurs/stegosaurus/idle.webp', width: 96 }],
  ['tyrannosaurus-rex', { path: '/assets/dinosaurs/tyrannosaurus-rex/idle.webp', width: 112 }],
  [FIRST_HYBRID_SPECIES_ID, { path: '/assets/dinosaurs/stegoceratops/idle.webp', width: 86 }],
]);

export const parkTexturePaths = [
  ...[...dinosaurArt, ...starterHabitats].map(placeholder),
  ...Array.from(existingBuildingArtwork.values(), ({ path }) => path),
  openGatePath,
  platformCovered,
];

export const fallbackBuildingArtwork = (typeId: string) =>
  placeholder(starterHabitats.includes(typeId) ? typeId : 'habitat-grassland');

export const fallbackDinosaurArtwork = (speciesId: string) =>
  dinosaurArt.includes(speciesId) ? placeholder(speciesId) : parasaurolophusArtwork.placeholder;

export function hybridArtworkUrl(path: string) {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  return path.startsWith('/api/experimental-hybrids/art/')
    ? apiBase.replace(/\/$/, '') + path.slice(4)
    : path;
}

export const dinosaurArtwork = (
  speciesId: string,
  hybrid?: { artwork: { idleUrl: string } | null },
) =>
  hybrid?.artwork
    ? hybridArtworkUrl(hybrid.artwork.idleUrl)
    : (dinosaurRasterArtwork.get(speciesId)?.path ?? fallbackDinosaurArtwork(speciesId));

export function hasHabitatFenceUpgrade(typeId: string): boolean {
  return reinforcedHabitatArtwork.has(typeId);
}

export function getCompletedBuildingArtworkLevel({
  level,
  status,
}: Pick<BuildingResponse, 'level' | 'status'>): number {
  return Math.max(1, level - Number(status.toUpperCase() === 'UPGRADING'));
}

export function getBuildingRasterArtwork(
  typeId: string,
  completedLevel = 1,
): BuildingRaster | undefined {
  const reinforced =
    completedLevel >= HABITAT_FENCE_UPGRADE_LEVEL
      ? reinforcedHabitatArtwork.get(typeId)
      : undefined;
  return reinforced ?? buildingRasterArtwork.get(typeId);
}

export function buildingArtwork(typeId: string, completedLevel = 1, gateOpen = false): string {
  if (typeId === PARK_ADMISSION.platformTypeId) {
    return completedLevel >= 5 ? platformCovered : platformDefault;
  }
  if (typeId === entranceGateId && gateOpen) return openGatePath;
  return getBuildingRasterArtwork(typeId, completedLevel)?.path ?? fallbackBuildingArtwork(typeId);
}
