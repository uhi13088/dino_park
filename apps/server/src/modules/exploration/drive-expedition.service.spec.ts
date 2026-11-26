import { MaterialQuality, ResearchMaterial, type DriveMissionReward } from '@dino-park/shared';
import type { DriveRunStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ParkOperationsService } from '../park/park-operations.service';
import { DriveExpeditionService } from './drive-expedition.service';

function fixture(reward: DriveMissionReward, status: DriveRunStatus = 'REWARD') {
  const run = { id: 'run', parkId: 'park', missionId: 'trike', reward, status };
  const tx = {
    driveRun: {
      findFirst: jest.fn(async ({ where }) =>
        where.park.userId === 'owner' &&
        (!where.id || where.id === run.id) &&
        (!where.status || where.status === run.status)
          ? run
          : null,
      ),
      update: jest.fn(async ({ data }) => Object.assign(run, data)),
    },
    hatchingQueue: { create: jest.fn() },
    resourceInventory: { upsert: jest.fn() },
  };
  let last = Promise.resolve<unknown>(undefined);
  const service = new DriveExpeditionService(
    {
      ...tx,
      $transaction: (callback: (client: typeof tx) => Promise<unknown>) => {
        const task = last.then(() => callback(tx));
        last = task.catch(() => undefined);
        return task;
      },
    } as unknown as PrismaService,
    { settleInTransaction: jest.fn() } as unknown as ParkOperationsService,
  );
  return { run, tx, service };
}

const egg = {
  type: 'egg',
  speciesId: 'triceratops',
  hatchSeconds: 3600,
} satisfies DriveMissionReward;

describe('completed legacy drive rewards', () => {
  it.each(['RUNNING', 'FAILED', 'ABANDONED'] as const)(
    'hides and declines an unearned %s result',
    async (status) => {
      const { service, tx } = fixture(egg, status);
      expect(await service.getState('owner')).toEqual({ run: null });
      await expect(service.claim('owner', 'run')).rejects.toThrow('완료 기록');
      expect(tx.hatchingQueue.create).not.toHaveBeenCalled();
    },
  );

  it('limits pending reports to their owner and allows one repeat-safe hatch receipt', async () => {
    const { service, tx } = fixture(egg);
    expect(await service.getState('owner')).toMatchObject({ run: { id: 'run', reward: egg } });
    expect(await service.getState('intruder')).toEqual({ run: null });
    await expect(service.claim('intruder', 'run')).rejects.toThrow('탐험 기록');
    await Promise.all([service.claim('owner', 'run'), service.claim('owner', 'run')]);
    expect(tx.hatchingQueue.create).toHaveBeenCalledTimes(1);
    expect(tx.hatchingQueue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceDriveId: 'run',
        speciesId: 'triceratops',
        readyToStart: true,
      }),
    });
    expect(await service.getState('owner')).toEqual({ run: null });
  });

  it('grants the frozen material reward and retains the canonical claimed record', async () => {
    const reward = {
      type: 'material',
      material: ResearchMaterial.DNA,
      quality: MaterialQuality.MIDDLE,
      amount: 10,
    } satisfies DriveMissionReward;
    const { service, tx } = fixture(reward);
    await service.claim('owner', 'run');
    expect(tx.resourceInventory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { amount: { increment: 10 } },
      }),
    );
    expect(tx.driveRun.update).toHaveBeenCalledWith({
      where: { id: 'run' },
      data: { activeSlot: null, status: 'CLAIMED', claimedAt: expect.any(Date) },
    });
  });
});
