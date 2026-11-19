import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ParkGrowthResponse, ParkResponse } from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { cancelResourceReads, resourcesQueryKey } from './resources';

const growthKey = [...queryKeys.park, 'growth'] as const;
const growthPath = '/parks/me/growth';

type GrowthAction =
  | { kind: 'start-research' }
  | { kind: 'claim'; goalId: ParkGrowthResponse['goals'][number]['id'] };

export function useParkGrowth() {
  return useQuery({
    queryKey: growthKey,
    queryFn: ({ signal }) => api.get<ParkGrowthResponse>(growthPath, { signal }),
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state?.goals.every(({ status }) => status === 'claimed')) return false;
      return state?.research.status === 'running' ? 1000 : 5000;
    },
    refetchIntervalInBackground: false,
  });
}

export function useParkGrowthAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: GrowthAction) =>
      api.post<ParkGrowthResponse>(
        action.kind === 'claim'
          ? `${growthPath}/goals/${action.goalId}/claim`
          : `${growthPath}/research/start`,
        {},
      ),
    onMutate: () =>
      Promise.all([
        client.cancelQueries({ queryKey: growthKey }),
        client.cancelQueries({ queryKey: queryKeys.parkMe() }),
        cancelResourceReads(client),
      ]),
    onSuccess: (state) => {
      client.setQueryData(growthKey, state);
      client.setQueryData<ParkResponse>(queryKeys.parkMe(), (park) =>
        park ? { ...park, level: state.level, exp: state.exp } : undefined,
      );
      for (const key of [
        queryKeys.parkMe(),
        queryKeys.parkOperations(),
        queryKeys.currency(),
        resourcesQueryKey,
      ])
        void client.invalidateQueries({ queryKey: key });
    },
  });
}
