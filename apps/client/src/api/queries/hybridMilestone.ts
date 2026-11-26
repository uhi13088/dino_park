import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DriveMissionReward, FirstSynthesisState } from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { parkGrowthKey } from './parkGrowth';
import { cancelResourceReads, resourcesQueryKey } from './resources';

const legacyDriveRewardKey = ['explorations', 'drive-reward'] as const;
export const synthesisKey = queryKeys.firstSynthesis();

type LegacyDriveRewardState = {
  run: { id: string; title: string; reward: DriveMissionReward } | null;
};

type SynthesisAction =
  | { kind: 'safety' | 'prepare' | 'claim' }
  | { kind: 'start'; parentIds: string[] };

export function useLegacyDriveReward() {
  return useQuery({
    queryKey: legacyDriveRewardKey,
    enabled: tokenManager.isAuthenticated(),
    queryFn: ({ signal }) => api.get<LegacyDriveRewardState>('/explorations/drive', { signal }),
  });
}

export function useClaimLegacyDriveReward() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<LegacyDriveRewardState>(`/explorations/drive/${id}/claim`),
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: legacyDriveRewardKey }),
        cancelResourceReads(client),
      ]);
    },
    onSuccess: (state) => {
      client.setQueryData(legacyDriveRewardKey, state);
      void client.invalidateQueries({ queryKey: synthesisKey });
      void client.invalidateQueries({ queryKey: queryKeys.hatching });
      void client.invalidateQueries({ queryKey: queryKeys.currency() });
      void client.invalidateQueries({ queryKey: resourcesQueryKey });
      void client.invalidateQueries({ queryKey: parkGrowthKey });
      void client.invalidateQueries({ queryKey: queryKeys.scoutExpedition() });
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
        queryKeys.scoutExpedition(),
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
