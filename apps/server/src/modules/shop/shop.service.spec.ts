import type { Prisma } from '@prisma/client';
import { ValidationPipe } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

const NOW = Date.parse('2026-11-23T00:00:00Z');

function shopFixture() {
  const state = {
    gold: 20000,
    diamond: 100,
    explorationEnergy: 39,
  };
  const receipts: Array<{ reason: string; createdAt: Date }> = [];
  let locked = false;
  const tx = {
    $queryRaw: jest.fn(async (_query: TemplateStringsArray, userId: string) => {
      expect(userId).toBe('player');
      locked = true;
    }),
    currency: {
      findUnique: jest.fn(async () => {
        expect(locked).toBe(true);
        return { ...state };
      }),
      update: jest.fn(async ({ data }: Prisma.CurrencyUpdateArgs) => {
        expect(locked).toBe(true);
        const diamond = data.diamond;
        if (diamond && typeof diamond === 'object' && diamond.decrement)
          state.diamond -= diamond.decrement;
        if (typeof data.explorationEnergy === 'number')
          state.explorationEnergy = data.explorationEnergy;
        const gold = data.gold;
        if (gold && typeof gold === 'object' && gold.decrement) state.gold -= gold.decrement;
        return { ...state };
      }),
    },
    transaction: {
      count: jest.fn(async ({ where }: { where: { reason: string; createdAt: { gte: Date } } }) => {
        expect(locked).toBe(true);
        return receipts.filter(
          (receipt) => receipt.reason === where.reason && receipt.createdAt >= where.createdAt.gte,
        ).length;
      }),
      create: jest.fn(async ({ data }: { data: (typeof receipts)[number] }) => {
        expect(locked).toBe(true);
        receipts.push(data);
      }),
    },
  };
  let queue = Promise.resolve();
  const prisma = {
    $transaction: (run: (context: typeof tx) => Promise<unknown>) => {
      const next = queue.then(async () => {
        try {
          return await run(tx);
        } finally {
          locked = false;
        }
      });
      queue = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    },
    transaction: {
      findMany: async ({
        where,
      }: {
        where: { reason: { startsWith: string }; createdAt: { gte: Date } };
      }) =>
        receipts.filter(
          (receipt) =>
            receipt.reason.startsWith(where.reason.startsWith) &&
            receipt.createdAt >= where.createdAt.gte,
        ),
    },
  };
  return { service: new ShopService(prisma as unknown as PrismaService), state, tx, receipts };
}

describe('Gold Shop purchases', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(NOW));
  afterEach(() => jest.useRealTimers());

  it('hides old fuel items and rejects stale requests without any debit or reward', async () => {
    const { service, state, tx } = shopFixture();
    const retiredIds = ['goldshop-energy-small', 'goldshop-energy-full'];
    const visible = (await service.getGoldShopItems('player')).map(({ id }) => id);
    for (const id of retiredIds) {
      expect(visible).not.toContain(id);
      await expect(service.purchaseGoldShopItem('player', id)).rejects.toThrow(
        '아이템을 찾을 수 없습니다.',
      );
    }
    expect(state).toMatchObject({ gold: 20000, diamond: 100, explorationEnergy: 39 });
    expect(tx.currency.update).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('keeps the purchase item ID through strict request validation', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const [, metatype] = Reflect.getMetadata(
      'design:paramtypes',
      ShopController.prototype,
      'purchaseGoldShopItem',
    );
    const parameter = { type: 'body' as const, metatype };
    const itemId = 'goldshop-speedup-1h';
    await expect(pipe.transform({ itemId }, parameter)).resolves.toMatchObject({ itemId });
    await expect(pipe.transform({ itemId: '' }, parameter)).rejects.toThrow('Bad Request');
    await expect(pipe.transform({ itemId, extra: true }, parameter)).rejects.toThrow('Bad Request');
  });

  it('checks the current diamond balance again when two purchases target the same money', async () => {
    const { service, state, receipts } = shopFixture();
    state.diamond = 20;
    const purchases = Array.from({ length: 2 }, () =>
      service.purchaseGoldShopItem('player', 'goldshop-speedup-1h'),
    );
    const [first, second] = await Promise.allSettled(purchases);
    expect(first.status).toBe('fulfilled');
    expect(second).toEqual({
      status: 'rejected',
      reason: expect.objectContaining({
        message: '다이아가 부족합니다.',
      }),
    });
    expect(state).toMatchObject({ diamond: 0, explorationEnergy: 39 });
    expect(receipts).toHaveLength(1);
  });

  it('honors old receipts when concurrent purchases compete for the last daily slot', async () => {
    const { service, state, receipts } = shopFixture();
    const reason = '골드샵 구매: 청동 상자';
    receipts.push(...Array.from({ length: 2 }, () => ({ reason, createdAt: new Date(NOW) })));
    receipts.push({ reason, createdAt: new Date(NOW - 86_400_000) });
    const itemId = 'goldshop-chest-bronze';
    expect(
      (await service.getGoldShopItems('player')).find(({ id }) => id === itemId),
    ).toMatchObject({ purchasedToday: 2, remainingLimit: 1 });

    const [first, second] = await Promise.allSettled([
      service.purchaseGoldShopItem('player', itemId),
      service.purchaseGoldShopItem('player', itemId),
    ]);
    expect(first.status).toBe('fulfilled');
    expect(second).toEqual({
      status: 'rejected',
      reason: expect.objectContaining({
        message: '오늘의 구매 한도를 초과했습니다.',
      }),
    });
    expect(state).toMatchObject({ gold: 10000, diamond: 100, explorationEnergy: 39 });
    expect(
      (await service.getGoldShopItems('player')).find(({ id }) => id === itemId),
    ).toMatchObject({ purchasedToday: 3, remainingLimit: 0, canPurchase: false });
  });
});
