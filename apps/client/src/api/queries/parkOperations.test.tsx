import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import type { ParkOperationsResponse } from '@dino-park/shared';
import { api } from '../client';
import { queryKeys, useSetParkOpen } from './index';

const opened: ParkOperationsResponse = {
  isOpen: true,
  canOpen: true,
  openingRequirements: [],
  ticketPrice: 20,
  visitorsPerMinute: 12,
  demandPerMinute: 19.5,
  capacity: 12,
  totalVisitors: 0,
  totalAdmissionGold: 0,
  hourlyMaintenance: 95,
  gold: 9900,
  parkLevel: 1,
  firstVisitorsGoal: { current: 0, target: 10, rewarded: false },
  pathTiles: [],
  entrance: { id: 'gate', x: 11, y: 16, width: 4, height: 4, onBoundary: true },
  suggestedEntrance: null,
  viewingPlatform: null,
};

afterEach(() => vi.restoreAllMocks());

describe('park operation mutations', () => {
  it('cancels an older heartbeat before opening and keeps the confirmed server balance', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(queryKeys.currency(), { gold: 10000 });
    queryClient.setQueryData(queryKeys.parkOperations(), { ...opened, isOpen: false });
    let aborted = false;
    const pendingHeartbeat = queryClient.fetchQuery({
      queryKey: queryKeys.parkOperations(),
      queryFn: ({ signal }) =>
        new Promise<ParkOperationsResponse>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('Cancelled heartbeat', 'AbortError'));
          });
        }),
    });
    void pendingHeartbeat.catch(() => undefined);
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(opened);
    const { result } = renderHook(() => useSetParkOpen(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await act(async () => {
      await result.current.mutateAsync(true);
    });

    expect(aborted).toBe(true);
    expect(patch).toHaveBeenCalledWith('/parks/me/open', { isOpen: true });
    expect(
      queryClient.getQueryData<ParkOperationsResponse>(queryKeys.parkOperations())?.isOpen,
    ).toBe(true);
    expect(queryClient.getQueryData<{ gold: number }>(queryKeys.currency())?.gold).toBe(9900);
    queryClient.clear();
  });
});
