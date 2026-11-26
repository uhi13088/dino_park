import type { getResearchFacilityUpgrade } from '@dino-park/game-data';
import type { Building } from '@prisma/client';
import { describePrerequisite } from './technology-progress';

type FacilityUpgrade = NonNullable<ReturnType<typeof getResearchFacilityUpgrade>>;

export function researchFacilityLevel(building: Pick<Building, 'level' | 'status'>) {
  if (building.status === 'ACTIVE') return building.level;
  return building.status === 'UPGRADING' ? Math.max(0, building.level - 1) : 0;
}

export function highestCompletedFacilityLevel(
  buildings: readonly Pick<Building, 'typeId' | 'level' | 'status'>[],
  typeId: string,
) {
  return buildings.reduce(
    (level, building) =>
      building.typeId === typeId ? Math.max(level, researchFacilityLevel(building)) : level,
    0,
  );
}

export function researchFacilityCap(completed: ReadonlyMap<string, number>) {
  return [5, 10, 20, 25][Math.min(3, completed.get('ops-engineering') ?? 0)];
}

export function researchFacilityBlock(
  plan: FacilityUpgrade,
  parkLevel: number,
  firstHero: boolean,
  completed: ReadonlyMap<string, number>,
) {
  if (parkLevel < plan.parkLevel) return `파크 Lv.${plan.parkLevel}에서 이용할 수 있어요.`;
  if (plan.afterFirstHero && !firstHero) return '첫 스테고케라톱스를 수령하세요.';
  if (plan.prerequisite) {
    const prerequisite = describePrerequisite(plan.prerequisite, completed);
    if (prerequisite.completedLevel < prerequisite.level)
      return `${prerequisite.name} Lv.${prerequisite.level} 연구를 먼저 완료하세요.`;
  }
  return undefined;
}
