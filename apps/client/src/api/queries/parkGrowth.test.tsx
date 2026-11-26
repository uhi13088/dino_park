import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ParkGrowthResponse, ParkGrowthStage } from '@dino-park/shared';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { api, tokenManager } from '../client';
import { parkGrowthKey, useParkGrowth, useParkGrowthAction } from './parkGrowth';

const previousStage: ParkGrowthResponse = {
  stage: 5,
  unlocked: true,
  level: 6,
  exp: 0,
  expForNextLevel: 5031,
  targetLevel: 6,
  goals: [{ id: 'facility', status: 'claimed', xp: 897, progress: 1, target: 1 }],
  research: {
    status: 'completed',
    completesAt: null,
    costs: { gold: 500, wood: 5, stone: 5 },
    durationSeconds: 60,
    entranceBonusPercent: 4,
    unavailableReason: null,
  },
};

afterEach(() => vi.restoreAllMocks());

it('keeps a prior claim retry scoped to Lv.6 while the Lv.7 panel is open', async () => {
  const nextStage: ParkGrowthResponse = {
    ...previousStage,
    stage: 6,
    targetLevel: 7,
    goals: [{ id: 'facility', status: 'claimable', xp: 1257, progress: 1, target: 1 }],
  };
  vi.spyOn(tokenManager, 'isAuthenticated').mockReturnValue(true);
  const get = vi
    .spyOn(api, 'get')
    .mockImplementation(async (path) => (path.endsWith('?stage=6') ? nextStage : previousStage));
  const post = vi.spyOn(api, 'post').mockResolvedValue(previousStage);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result, rerender } = renderHook(
    ({ stage }: { stage: ParkGrowthStage }) => ({
      state: useParkGrowth(stage),
      action: useParkGrowthAction(),
    }),
    {
      initialProps: { stage: 5 },
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  await waitFor(() => expect(result.current.state.data?.targetLevel).toBe(6));
  rerender({ stage: 6 });
  await waitFor(() => expect(result.current.state.data?.targetLevel).toBe(7));

  await act(async () => {
    await result.current.action.mutateAsync({ kind: 'claim', goalId: 'facility' });
  });
  expect(get).toHaveBeenCalledWith('/parks/me/growth?stage=6', expect.any(Object));
  expect(post).toHaveBeenCalledWith('/parks/me/growth/goals/facility/claim', {});
  expect(result.current.state.data?.goals[0]).toMatchObject({ status: 'claimable', xp: 1257 });

  post.mockResolvedValue({ ...nextStage, goals: [{ ...nextStage.goals[0], status: 'claimed' }] });
  await act(async () => {
    await result.current.action.mutateAsync({ kind: 'claim', goalId: 'facility', stage: 6 });
  });
  expect(post).toHaveBeenLastCalledWith('/parks/me/growth/goals/facility/claim?stage=6', {});
  await waitFor(() => expect(result.current.state.data?.goals[0].status).toBe('claimed'));
  client.clear();
});

it('claims a route through its stage-specific endpoint and updates the displayed rank', async () => {
  const completed: ParkGrowthResponse = {
    ...previousStage,
    stage: 7,
    targetLevel: 8,
    level: 8,
    goals: [],
  };
  const post = vi.spyOn(api, 'post').mockResolvedValue(completed);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(() => useParkGrowthAction(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await act(async () => {
    await result.current.mutateAsync({ kind: 'claim-route', routeId: 'exploration', stage: 7 });
  });
  expect(post).toHaveBeenCalledWith('/parks/me/growth/routes/exploration/claim?stage=7', {});
  expect(client.getQueryData([...parkGrowthKey, 7])).toMatchObject({ level: 8 });
  client.clear();
});

it('marks the cached next stage stale after the current stage reaches its target', async () => {
  vi.spyOn(api, 'post').mockResolvedValue(previousStage);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const nextStageKey = [...parkGrowthKey, 6];
  const nextStage = { ...previousStage, unlocked: false, stage: 6, level: 5, targetLevel: 7 };
  client.setQueryData(nextStageKey, nextStage);
  const { result } = renderHook(() => useParkGrowthAction(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await act(async () => {
    await result.current.mutateAsync({ kind: 'claim', goalId: 'operation' });
  });
  expect(client.getQueryState(nextStageKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState([...parkGrowthKey, 5])?.isInvalidated).toBe(false);
  client.clear();
});

it('refreshes alternate research that starts after claiming the operations route', async () => {
  const cleared: ParkGrowthResponse = {
    ...previousStage,
    stage: 7,
    targetLevel: 8,
    level: 8,
    goals: [],
    routes: {
      rewardXp: 0,
      claimedRoute: 'operations',
      operations: {
        status: 'claimed',
        exhibits: 4,
        targetExhibits: 4,
        visitors: 70,
        targetVisitors: 70,
        achieved: true,
      },
      exploration: { status: 'incomplete', completedMissions: [], researchCompleted: false },
    },
    research: { ...previousStage.research, status: 'available' },
  };
  vi.spyOn(tokenManager, 'isAuthenticated').mockReturnValue(true);
  const get = vi
    .spyOn(api, 'get')
    .mockResolvedValueOnce(cleared)
    .mockResolvedValue({
      ...cleared,
      routes: {
        ...cleared.routes!,
        exploration: { ...cleared.routes!.exploration, researchCompleted: true },
      },
      research: { ...cleared.research, status: 'completed' },
    });
  vi.spyOn(api, 'post').mockResolvedValue({
    ...cleared,
    research: { ...cleared.research, status: 'running', completesAt: new Date().toISOString() },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(
    () => ({ state: useParkGrowth(7), action: useParkGrowthAction() }),
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  await waitFor(() => {
    const state = result.current.state.data;
    expect(state && 'research' in state && state.research.status).toBe('available');
  });
  await act(async () => {
    await result.current.action.mutateAsync({ kind: 'start-research', stage: 7 });
  });
  await waitFor(
    () => {
      const state = result.current.state.data;
      expect(state && 'research' in state && state.routes?.exploration.researchCompleted).toBe(
        true,
      );
    },
    { timeout: 2500 },
  );
  expect(get).toHaveBeenCalledTimes(2);
  client.clear();
});
