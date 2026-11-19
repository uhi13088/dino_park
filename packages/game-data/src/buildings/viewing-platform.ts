import type { EarlyResourceMaterial } from '@dino-park/shared';

interface ViewingPlatformUpgrade {
  requiredLevel: number;
  gold: number;
  materials: { wood: number; stone: number } & Partial<Record<EarlyResourceMaterial, number>>;
  seconds: number;
  targetLevel: number;
  capacity: number;
  upkeep: number;
}

export const VIEWING_PLATFORM_BASE_STATS = { capacity: 20, maintenanceCost: 20 };

export const FIRST_PLATFORM_UPGRADE = {
  requiredLevel: 3,
  gold: 3000,
  materials: { wood: 20, stone: 10 },
  seconds: 120,
  targetLevel: 2,
  capacity: 40,
  upkeep: 35,
} as const;

// Keep these runtime anchors aligned with the viewing-platform rows of balance 0.6.
const viewingPlatformUpgrades: readonly ViewingPlatformUpgrade[] = [
  FIRST_PLATFORM_UPGRADE,
  {
    requiredLevel: 5,
    gold: 4000,
    materials: { wood: 30, stone: 20, metal: 10 },
    seconds: 120,
    targetLevel: 3,
    capacity: 60,
    upkeep: 50,
  },
  {
    requiredLevel: 5,
    gold: 5700,
    materials: { wood: 30, stone: 20, metal: 10 },
    seconds: 300,
    targetLevel: 4,
    capacity: 80,
    upkeep: 54,
  },
  {
    requiredLevel: 5,
    gold: 7800,
    materials: { wood: 46, stone: 23, metal: 12 },
    seconds: 600,
    targetLevel: 5,
    capacity: 100,
    upkeep: 58,
  },
];

export const MAX_VIEWING_PLATFORM_LEVEL =
  viewingPlatformUpgrades[viewingPlatformUpgrades.length - 1].targetLevel;

export function getViewingPlatformUpgrade(targetLevel: number) {
  return viewingPlatformUpgrades.find((upgrade) => upgrade.targetLevel === targetLevel);
}

export function getViewingPlatformCompletedLevel(level: number, upgrading: boolean) {
  return Math.max(1, level - Number(upgrading));
}

export function getViewingPlatformStats(completedLevel: number) {
  const upgrade = getViewingPlatformUpgrade(Math.min(completedLevel, MAX_VIEWING_PLATFORM_LEVEL));
  return upgrade
    ? { capacity: upgrade.capacity, maintenanceCost: upgrade.upkeep }
    : VIEWING_PLATFORM_BASE_STATS;
}
