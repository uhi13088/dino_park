import {
  EARLY_RESOURCE_CAPACITY,
  GOLD_VAULT_ID,
  RESEARCH_FACILITY_UPGRADES,
  RESEARCH_STORAGE_ID,
  getResearchFacilityUpgrade,
} from '@dino-park/game-data';
import { PARK_ADMISSION } from '@dino-park/shared';
import type { Building, Prisma } from '@prisma/client';
import { completionTime } from '../park/park-admission.logic';

const storageIds = [GOLD_VAULT_ID, RESEARCH_STORAGE_ID];
type StorageBuilding = Pick<Building, 'typeId' | 'level' | 'status' | 'createdAt' | 'completesAt'>;

export const MAX_MATERIAL_STORAGE = Math.max(
  ...RESEARCH_FACILITY_UPGRADES[RESEARCH_STORAGE_ID].map(({ effect }) => effect),
);

export function getStorageLimits(buildings: readonly StorageBuilding[], at = Date.now()) {
  let goldCapacity: number = PARK_ADMISSION.baseGoldCapacity;
  let capacityPerMaterial: number = EARLY_RESOURCE_CAPACITY;
  for (const building of buildings) {
    if (!storageIds.includes(building.typeId) || building.createdAt.getTime() > at) continue;
    const completed = building.status === 'ACTIVE' || (completionTime(building) ?? Infinity) <= at;
    const level = completed
      ? building.level
      : building.status === 'UPGRADING'
        ? building.level - 1
        : 0;
    const capacity = getResearchFacilityUpgrade(building.typeId, level)?.effect;
    if (capacity === undefined) continue;
    if (building.typeId === GOLD_VAULT_ID) goldCapacity = Math.max(goldCapacity, capacity);
    else capacityPerMaterial = Math.max(capacityPerMaterial, capacity);
  }
  return { goldCapacity, capacityPerMaterial };
}

export async function getParkStorageLimits(
  tx: Prisma.TransactionClient,
  parkId: string,
  now: Date,
) {
  const buildings = await tx.building.findMany({
    where: { parkId, typeId: { in: storageIds } },
    select: { typeId: true, level: true, status: true, createdAt: true, completesAt: true },
  });
  return getStorageLimits(buildings, now.getTime());
}
