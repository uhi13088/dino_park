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
      gold: 9600,
      parkLevel: 2,
      capacityPerMaterial: 100,
      inventory: [{ material: 'wood', name: '목재', amount: 20, buyPrice: 20 }],
      facilities: [],
      platformUpgrade: null,
    };
    client.setQueryData(queryKeys.currency(), { gold: 10000 });
    const keys = [
      resourcesQueryKey,
      queryKeys.firstExpedition(),
      queryKeys.parkOperations(),
      queryKeys.currency(),
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
      await result.current.mutateAsync({ material: 'wood', quantity: 20 });
    });
    expect(aborted.size).toBe(4);
    expect(post).toHaveBeenCalledWith('/resources/purchase', { material: 'wood', quantity: 20 });
    expect(client.getQueryData<ResourcesResponse>(resourcesQueryKey)?.inventory[0].amount).toBe(20);
    expect(client.getQueryData<{ gold: number }>(queryKeys.currency())?.gold).toBe(9600);
    client.clear();
  });
});
