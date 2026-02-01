/**
 * 위인 데이터
 * 참조: docs/dino_park_great_figures.md
 */

import type { GreatFigureType } from '@dino-park/shared';

// 위인 데이터는 Phase 4에서 상세 구현
export const GREAT_FIGURE_DATA: GreatFigureType[] = [];

export function getGreatFigureById(id: string): GreatFigureType | undefined {
  return GREAT_FIGURE_DATA.find((f) => f.id === id);
}

export function getGreatFiguresByJob(job: string): GreatFigureType[] {
  return GREAT_FIGURE_DATA.filter((f) => f.job === job);
}
