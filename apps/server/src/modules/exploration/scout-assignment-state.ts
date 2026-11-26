import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export async function assertNoScoutAssignment(tx: Prisma.TransactionClient, parkId: string) {
  const assignment = await tx.scoutAssignment.findFirst({
    where: { scout: { parkId }, claimedAt: null },
    select: { id: true },
  });
  if (assignment) throw new BadRequestException('탐험가의 보고서를 먼저 수령해주세요.');
}
