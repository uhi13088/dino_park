import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RepeatSynthesisStart, RepeatSynthesisState } from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { cancelResourceReads, resourcesQueryKey } from './resources';

type RepeatSynthesisAction =
  | { kind: 'start'; request: RepeatSynthesisStart }
  | { kind: 'claim'; id: string };

export function useRepeatSynthesis() {
  return useQuery({
    queryKey: queryKeys.repeatSynthesis(),
    enabled: tokenManager.isAuthenticated(),
    queryFn: ({ signal }) =>
      api.get<RepeatSynthesisState>('/milestone-synthesis/repeat', { signal }),
    refetchInterval: (query) => (query.state.data?.job?.status === 'incubating' ? 3000 : 5000),
  });
}

export function useRepeatSynthesisAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: RepeatSynthesisAction) =>
      action.kind === 'start'
        ? api.post<RepeatSynthesisState>('/milestone-synthesis/repeat/start', action.request)
        : api.post<RepeatSynthesisState>(`/milestone-synthesis/repeat/${action.id}/claim`, {}),
    onMutate: async () => {
      await Promise.all([
        cancelResourceReads(client),
        client.cancelQueries({ queryKey: queryKeys.repeatSynthesis() }),
      ]);
    },
    onSuccess: (state) => {
      client.setQueryData(queryKeys.repeatSynthesis(), state);
      for (const key of [
        queryKeys.scoutExpedition(),
        resourcesQueryKey,
        queryKeys.currency(),
        queryKeys.parkOperations(),
        queryKeys.dinosaurs,
      ])
        void client.invalidateQueries({ queryKey: key });
    },
  });
}
