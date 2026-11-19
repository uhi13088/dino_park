import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DriveExpeditionState, FirstSynthesisState } from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { cancelResourceReads, resourcesQueryKey } from './resources';

export const driveKey = ['explorations', 'drive'] as const;
export const synthesisKey = queryKeys.firstSynthesis();

type DriveAction =
  | { kind: 'start'; missionId: string }
  | { kind: 'checkpoint'; id: string; sector: number; positions: number[] }
  | { kind: 'claim' | 'abandon'; id: string };

type SynthesisAction =
  | { kind: 'safety' | 'prepare' | 'claim' }
  | { kind: 'start'; parentIds: string[] };

export function useDriveExpedition(enabled: boolean) {
  return useQuery({
    queryKey: driveKey,
    enabled: enabled && tokenManager.isAuthenticated(),
    queryFn: ({ signal }) => api.get<DriveExpeditionState>('/explorations/drive', { signal }),
    refetchInterval: (query) => (query.state.data?.run?.status === 'running' ? false : 5000),
  });
}

export function useDriveAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: DriveAction) => {
      if (action.kind === 'start')
        return api.post<DriveExpeditionState>('/explorations/drive/start', {
          missionId: action.missionId,
        });
      return api.post<DriveExpeditionState>(
        `/explorations/drive/${action.id}/${action.kind}`,
        action.kind === 'checkpoint' ? { sector: action.sector, positions: action.positions } : {},
      );
    },
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: driveKey }),
        cancelResourceReads(client),
      ]);
    },
    onSuccess: (state, action) => {
      client.setQueryData(driveKey, state);
      if (action.kind === 'checkpoint') return;
      void client.invalidateQueries({ queryKey: synthesisKey });
      void client.invalidateQueries({ queryKey: queryKeys.hatching });
      void client.invalidateQueries({ queryKey: queryKeys.currency() });
      void client.invalidateQueries({ queryKey: resourcesQueryKey });
    },
  });
}

export function useFirstSynthesis(enabled: boolean) {
  return useQuery({
    queryKey: synthesisKey,
    enabled: enabled && tokenManager.isAuthenticated(),
    queryFn: ({ signal }) => api.get<FirstSynthesisState>('/milestone-synthesis', { signal }),
    refetchInterval: (query) => (query.state.data?.job?.status === 'incubating' ? 3000 : 5000),
  });
}

export function useFirstSynthesisAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: SynthesisAction) =>
      api.post<FirstSynthesisState>(
        `/milestone-synthesis/${action.kind}`,
        action.kind === 'start' ? { parentIds: action.parentIds } : {},
      ),
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: synthesisKey }),
        cancelResourceReads(client),
      ]);
    },
    onSuccess: (state) => {
      client.setQueryData(synthesisKey, state);
      for (const key of [
        driveKey,
        queryKeys.dinosaurs,
        queryKeys.currency(),
        queryKeys.park,
        queryKeys.stories,
        resourcesQueryKey,
      ])
        void client.invalidateQueries({ queryKey: key });
    },
  });
}
