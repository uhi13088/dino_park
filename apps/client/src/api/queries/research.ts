import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResearchStateResponse } from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { parkGrowthKey } from './parkGrowth';
import { cancelResourceReads, resourcesQueryKey } from './resources';

export function useResearch() {
  return useQuery({
    queryKey: queryKeys.research,
    queryFn: ({ signal }) => api.get<ResearchStateResponse>('/research', { signal }),
    enabled: tokenManager.isAuthenticated(),
    staleTime: 2500,
    refetchInterval: ({ state }) => (state.data?.queue.jobs.length ? 2500 : 10_000),
  });
}

export function useStartTechnologyResearch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, level }: { id: string; level: number }) =>
      api.post<ResearchStateResponse>(`/research/${id}/start`, { level }),
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: queryKeys.research }),
        cancelResourceReads(client),
      ]);
    },
    onSuccess: (state) => {
      client.setQueryData(queryKeys.research, state);
      for (const key of [
        queryKeys.currency(),
        queryKeys.scoutExpedition(),
        queryKeys.parkOperations(),
        resourcesQueryKey,
        parkGrowthKey,
      ])
        void client.invalidateQueries({ queryKey: key });
    },
  });
}
