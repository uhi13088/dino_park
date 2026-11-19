import type { Prisma } from '@prisma/client';
import type { getViewingPlatformUpgrade } from '@dino-park/game-data';

export async function hasClaimedFirstHero(tx: Prisma.TransactionClient, parkId: string) {
  const claim = await tx.firstSynthesisJob.findUnique({
    where: { parkId },
    select: { claimedAt: true },
  });
  return Boolean(claim?.claimedAt);
}

export function isBuilderBusy(building: { status: string }) {
  return building.status === 'CONSTRUCTING' || building.status === 'UPGRADING';
}

export function getViewingPlatformProgressBlock(
  parkLevel: number,
  claimedFirstHero: boolean,
  upgrade: NonNullable<ReturnType<typeof getViewingPlatformUpgrade>>,
) {
  if (parkLevel < upgrade.requiredLevel)
    return `관람대 확장은 파크 Lv.${upgrade.requiredLevel}부터 가능해요.`;
  if (upgrade.materials.metal && !claimedFirstHero)
    return '첫 스테고케라톱스를 수령하면 금속 구매와 관람대 확장이 열려요.';
  return null;
}
