import {
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_LAB_ID,
  FIRST_HYBRID_SPECIES_ID,
  PARK_ADMISSION,
} from '@dino-park/shared';

const dinosaurArt = [
  'parasaurolophus',
  'iguanodon',
  'triceratops',
  'stegosaurus',
  FIRST_HYBRID_SPECIES_ID,
];
const buildingArt = [
  'habitat-grassland',
  'operation-entrance-gate',
  'production-lumberyard',
  'production-quarry',
  FIRST_HYBRID_HABITAT_ID,
  FIRST_HYBRID_LAB_ID,
];
const placeholder = (id: string) => `/assets/placeholders/${id}.svg`;
const platformDefault = '/assets/buildings/viewing-platform.webp';
const platformCovered = '/assets/buildings/viewing-platform-lv5.webp';

export const parkTexturePaths = [
  ...[...dinosaurArt, ...buildingArt, 'operation-entrance-gate-open'].map(placeholder),
  platformDefault,
  platformCovered,
];

export const dinosaurArtwork = (speciesId: string) =>
  placeholder(dinosaurArt.includes(speciesId) ? speciesId : 'parasaurolophus');
export function buildingArtwork(typeId: string, completedLevel = 1): string {
  if (typeId === PARK_ADMISSION.platformTypeId) {
    return completedLevel >= 5 ? platformCovered : platformDefault;
  }
  return placeholder(buildingArt.includes(typeId) ? typeId : 'habitat-grassland');
}
