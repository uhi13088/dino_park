import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FirstExpeditionStateResponse } from '@dino-park/shared';
import { api } from '../client';
import { queryKeys, useClaimFirstExpedition } from './index';

const mission = {
  id: 'mission',
  regionId: 'grassland',
  status: 'CLAIMED',
  step: 3,
  totalSteps: 3,
  clue: null,
};
const next: FirstExpeditionStateResponse = {
  stage: 'egg',
  tutorialStep: 4,
  unlocked: true,
  requirements: [],
  gold: 900,
  mission,
  egg: {
    id: 'egg',
    speciesId: 'iguanodon',
    status: 'stored',
    completesAt: null,
    remainingSeconds: 0,
    dinosaurId: null,
  },
  dinosaur: null,
  hatchingSlots: { used: 0, total: 1 },
  reusedExisting: false,
};
afterEach(() => vi.restoreAllMocks());

describe('confirmed first expedition mutation state', () => {
  it('aborts an older expedition read before receiving an earned egg', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.currency(), { gold: 1000 });
    client.setQueryData(queryKeys.firstExpedition(), {
      ...next,
      stage: 'reward',
      mission: { ...next.mission!, status: 'COMPLETED' },
      egg: null,
    });
    let aborted = false;
    const pending = client.fetchQuery({
      queryKey: queryKeys.firstExpedition(),
      queryFn: ({ signal }) =>
        new Promise<FirstExpeditionStateResponse>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('Cancelled', 'AbortError'));
          });
        }),
    });
    void pending.catch(() => undefined);
    const post = vi.spyOn(api, 'post').mockResolvedValue(next);
    const { result } = renderHook(() => useClaimFirstExpedition(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync('mission');
    });
    expect(aborted).toBe(true);
    expect(post).toHaveBeenCalledWith('/explorations/first/mission/claim');
    expect(
      client.getQueryData<FirstExpeditionStateResponse>(queryKeys.firstExpedition())?.egg?.id,
    ).toBe('egg');
    expect(client.getQueryData<{ gold: number }>(queryKeys.currency())).toMatchObject({
      gold: 900,
    });
    client.clear();
  });
});
