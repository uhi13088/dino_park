import { Rarity } from '../types/common.types';
import { DinosaurCategory, DinosaurOrigin, DinosaurSize } from '../types/dinosaur.types';
import { MaterialQuality, ResearchMaterial } from '../types/codex.types';

export const CODEX_RARITY_LABELS: Record<Rarity, string> = {
  [Rarity.COMMON]: '일반',
  [Rarity.UNCOMMON]: '고급',
  [Rarity.RARE]: '희귀',
  [Rarity.EPIC]: '영웅',
  [Rarity.LEGENDARY]: '전설',
};

export const CODEX_ORIGIN_LABELS: Record<DinosaurOrigin, string> = {
  [DinosaurOrigin.NATURAL]: '자연종',
  [DinosaurOrigin.VARIANT]: '변종',
  [DinosaurOrigin.HYBRID]: '하이브리드',
};

export const CODEX_CATEGORY_LABELS: Record<DinosaurCategory, string> = {
  [DinosaurCategory.HERBIVORE]: '초식 공룡',
  [DinosaurCategory.CARNIVORE]: '육식 공룡',
  [DinosaurCategory.PTEROSAUR]: '익룡',
  [DinosaurCategory.MARINE]: '해양 파충류',
  [DinosaurCategory.HYBRID]: '하이브리드 구역',
};

export const CODEX_SIZE_LABELS: Record<DinosaurSize, string> = {
  [DinosaurSize.SMALL]: '소형',
  [DinosaurSize.MEDIUM]: '중형',
  [DinosaurSize.LARGE]: '대형',
  [DinosaurSize.GIANT]: '거대',
};

export const RESEARCH_MATERIAL_LABELS: Record<ResearchMaterial, string> = {
  [ResearchMaterial.DNA]: 'DNA 샘플',
  [ResearchMaterial.CATALYST]: '합성 촉매',
  [ResearchMaterial.CULTURE]: '배양액',
  [ResearchMaterial.STABILIZER]: '안정제',
  [ResearchMaterial.MUTATION_CELL]: '변이세포',
};

export const MATERIAL_QUALITY_LABELS: Record<MaterialQuality, string> = {
  [MaterialQuality.LOW]: '하급',
  [MaterialQuality.MIDDLE]: '중급',
  [MaterialQuality.HIGH]: '상급',
};
