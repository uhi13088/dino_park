import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DispatchScoutRequest,
  HireScoutRequest,
  ScoutExpeditionState,
} from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { synthesisKey } from './hybridMilestone';
import { parkGrowthKey } from './parkGrowth';
import { cancelResourceReads, resourcesQueryKey } from './resources';

const endpoint = '/explorations/scouts';
const scoutKey = queryKeys.scoutExpedition();

export type ScoutAction =
  | { kind: 'hire'; request: HireScoutRequest }
  | { kind: 'dispatch'; request: DispatchScoutRequest }
  | { kind: 'claim'; id: string };

export function useScoutExpedition() {
  return useQuery({
    queryKey: scoutKey,
    enabled: tokenManager.isAuthenticated(),
    queryFn: ({ signal }) => api.get<ScoutExpeditionState>(endpoint, { signal }),
    staleTime: 2500,
    refetchOnMount: 'always',
    refetchInterval: 12000,
  });
}

export function useScoutAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: ScoutAction) => {
      if (action.kind === 'hire')
        return api.post<ScoutExpeditionState>(`${endpoint}/hire`, action.request);
      if (action.kind === 'dispatch')
        return api.post<ScoutExpeditionState>(`${endpoint}/dispatch`, action.request);
      return api.post<ScoutExpeditionState>(`${endpoint}/reports/${action.id}/claim`);
    },
    onMutate: () => cancelResourceReads(client),
    onSuccess: (state, action) => {
      client.setQueryData(scoutKey, state);
      for (const key of [queryKeys.currency(), resourcesQueryKey])
        void client.invalidateQueries({ queryKey: key });
      if (action.kind === 'claim') {
        for (const key of [
          queryKeys.firstExpedition(),
          queryKeys.hatching,
          queryKeys.explorationList(),
          queryKeys.userMe(),
          synthesisKey,
          parkGrowthKey,
        ])
          void client.invalidateQueries({ queryKey: key });
      }
    },
  });
}
