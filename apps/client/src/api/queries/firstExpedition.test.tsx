import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FirstExpeditionStateResponse } from '@dino-park/shared';
import { api } from '../client';
import { queryKeys, useChooseFirstExpedition } from './index';

const next: FirstExpeditionStateResponse = {
  stage: 'exploring',
  tutorialStep: 4,
  unlocked: true,
  requirements: [],
  gold: 900,
  energy: 25,
  mission: {
    id: 'mission',
    regionId: 'grassland',
    status: 'IN_PROGRESS',
    step: 1,
    totalSteps: 3,
    clue: null,
  },
  egg: null,
  dinosaur: null,
  hatchingSlots: { used: 0, total: 1 },
  reusedExisting: false,
  feedback: { correct: true, message: '발자국을 찾았어요.' },
};
afterEach(() => vi.restoreAllMocks());

describe('confirmed first expedition mutation state', () => {
  it('aborts an older read before choosing a clue so the old step cannot replace the confirmed one', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.currency(), { gold: 1000, explorationEnergy: 30 });
    client.setQueryData(queryKeys.firstExpedition(), {
      ...next,
      mission: { ...next.mission!, step: 0 },
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
    const { result } = renderHook(() => useChooseFirstExpedition(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'mission', step: 0, choiceId: 'footprints' });
    });
    expect(aborted).toBe(true);
    expect(post).toHaveBeenCalledWith('/explorations/first/mission/choice', {
      step: 0,
      choiceId: 'footprints',
    });
    expect(
      client.getQueryData<FirstExpeditionStateResponse>(queryKeys.firstExpedition())?.mission?.step,
    ).toBe(1);
    expect(
      client.getQueryData<{ gold: number; explorationEnergy: number }>(queryKeys.currency()),
    ).toMatchObject({ gold: 900, explorationEnergy: 25 });
    client.clear();
  });
});
