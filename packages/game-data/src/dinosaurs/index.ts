/**
 * 공룡 데이터
 * 참조: docs/dino_park_dinosaur_codex.md
 */

import type { DinosaurSpecies } from '@dino-park/shared';

// 공룡 데이터는 Phase 4에서 상세 구현
export const DINOSAUR_DATA: DinosaurSpecies[] = [];

export function getDinosaurById(id: string): DinosaurSpecies | undefined {
  return DINOSAUR_DATA.find((d) => d.id === id);
}

export function getDinosaursByCategory(
  category: string,
): DinosaurSpecies[] {
  return DINOSAUR_DATA.filter((d) => d.category === category);
}

export function getDinosaursByRarity(rarity: string): DinosaurSpecies[] {
  return DINOSAUR_DATA.filter((d) => d.rarity === rarity);
}
