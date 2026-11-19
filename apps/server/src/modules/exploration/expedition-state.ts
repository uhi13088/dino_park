import {
  ENERGY_RECHARGE_MINUTES,
  MAX_EXPLORATION_ENERGY,
  getParkLevelExperience,
  type FirstExpeditionStateResponse,
} from '@dino-park/shared';
import type { Building, HatchingQueue, Prisma } from '@prisma/client';

export const IGUANODON_CARE_RECEIPT = 'first-iguanodon-care-v1';
export const parentCareReceipt = (speciesId: string) => `first-parent-care-${speciesId}-v1`;

export function getExpeditionEnergy(
  currency: { explorationEnergy: number; energyLastRechargedAt: Date },
  now = new Date(),
) {
  const interval = ENERGY_RECHARGE_MINUTES * 60_000;
  const count = Math.max(
    0,
    Math.floor((now.getTime() - currency.energyLastRechargedAt.getTime()) / interval),
  );
  const value = Math.max(
    currency.explorationEnergy,
    Math.min(MAX_EXPLORATION_ENERGY, currency.explorationEnergy + count),
  );
  return {
    value,
    last:
      value >= MAX_EXPLORATION_ENERGY
        ? now
        : new Date(currency.energyLastRechargedAt.getTime() + count * interval),
  };
}

export function getHatchingSlots(
  buildings: Array<Pick<Building, 'typeId' | 'status'>>,
  eggs: Array<Pick<HatchingQueue, 'readyToStart' | 'completed'>>,
) {
  return {
    used: eggs.filter((egg) => !egg.readyToStart && !egg.completed).length,
    total: buildings.some((b) => b.typeId === 'research-hatchery' && b.status === 'ACTIVE') ? 3 : 1,
  };
}

export function getHatchingEggState(
  egg: HatchingQueue,
  speciesId: string,
  hatchSeconds: number,
  now = Date.now(),
): NonNullable<FirstExpeditionStateResponse['egg']> {
  const remainingSeconds = Math.max(0, Math.ceil((egg.completesAt.getTime() - now) / 1000));
  let status: NonNullable<FirstExpeditionStateResponse['egg']>['status'] = 'ready';
  if (egg.completed) status = 'claimed';
  else if (egg.readyToStart) status = 'stored';
  else if (remainingSeconds) status = 'hatching';
  return {
    id: egg.id,
    speciesId,
    status,
    completesAt: egg.readyToStart ? null : egg.completesAt.toISOString(),
    remainingSeconds: egg.readyToStart ? hatchSeconds : remainingSeconds,
    dinosaurId: egg.claimedDinosaurId,
  };
}

/** Call under the park lock so each one-time progression receipt remains atomic. */
export async function grantHatchingExperience(
  tx: Prisma.TransactionClient,
  userId: string,
  park: { id: string; level: number; exp: number },
  flagId: string,
  amount: number,
) {
  const receipt = await tx.storyFlag.createMany({
    data: { userId, flagId, value: true },
    skipDuplicates: true,
  });
  if (!receipt.count) return park;
  let level = park.level,
    exp = park.exp + amount;
  while (level < 50 && exp >= getParkLevelExperience(level)) {
    exp -= getParkLevelExperience(level);
    level++;
  }
  return tx.park.update({
    where: { id: park.id },
    data: { level, exp: level >= 50 ? 0 : exp },
  });
}
