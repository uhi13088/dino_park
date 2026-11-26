import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResourcesResponse } from '@dino-park/shared';
import { api } from '../client';
import { queryKeys } from './index';
import { resourcesQueryKey, usePurchaseResource } from './resources';

afterEach(() => vi.restoreAllMocks());

describe('resource mutation read ownership', () => {
  it('aborts every older balance read before purchase and keeps the confirmed stock and balance', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const state: ResourcesResponse = {
      gold: 9800,
      parkLevel: 2,
      capacityPerMaterial: 100,
      fuel: { amount: 22, capacity: 30, nextRechargeAt: '2026-11-23T09:04:00.000Z' },
      inventory: [{ material: 'wood', name: '목재', amount: 20, buyPrice: 20 }],
      facilities: [],
      platformUpgrade: null,
    };
    client.setQueryData(queryKeys.currency(), {
      gold: 10000,
      diamond: 7,
      explorationEnergy: 20,
    });
    client.setQueryData(queryKeys.scoutExpedition(), { gold: 10000, fuel: 20, fuelMax: 30 });
    const keys = [
      resourcesQueryKey,
      queryKeys.firstExpedition(),
      queryKeys.parkOperations(),
      queryKeys.currency(),
      queryKeys.scoutExpedition(),
    ];
    const aborted = new Set<number>();
    const pending = keys.map((queryKey, index) =>
      client.fetchQuery({
        queryKey,
        queryFn: ({ signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              aborted.add(index);
              reject(new DOMException('Cancelled old read', 'AbortError'));
            });
          }),
      }),
    );
    pending.forEach((promise) => void promise.catch(() => undefined));
    const post = vi.spyOn(api, 'post').mockResolvedValue(state);
    const { result } = renderHook(() => usePurchaseResource(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync({ material: 'fuel', quantity: 2 });
    });
    expect(aborted.size).toBe(5);
    expect(post).toHaveBeenCalledWith('/resources/purchase', { material: 'fuel', quantity: 2 });
    expect(client.getQueryData<ResourcesResponse>(resourcesQueryKey)?.inventory[0].amount).toBe(20);
    expect(client.getQueryData(queryKeys.currency())).toMatchObject({
      gold: 9800,
      diamond: 7,
      explorationEnergy: 22,
    });
    expect(client.getQueryData(queryKeys.scoutExpedition())).toMatchObject({
      gold: 9800,
      fuel: 22,
      fuelMax: 30,
    });
    client.clear();
  });
});
