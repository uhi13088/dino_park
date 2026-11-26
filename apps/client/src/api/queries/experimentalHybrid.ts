import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExperimentalHybridQuote,
  ExperimentalHybridSelection,
  ExperimentalHybridStart,
  ExperimentalHybridState,
} from '@dino-park/shared';
import { useAuthStore } from '@/stores/useAuthStore';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { cancelResourceReads, resourcesQueryKey } from './resources';

const endpoint = '/experimental-hybrids';
const stateKey = (userId: string | undefined) => ['experimental-hybrids', userId] as const;
const quoteKey = (userId: string | undefined) => ['experimental-hybrid-quote', userId] as const;

export type ExperimentalHybridAction =
  | { kind: 'start'; request: ExperimentalHybridStart }
  | { kind: 'claim'; id: string }
  | { kind: 'recover' }
  | { kind: 'list'; request: { lineageId: string; price: number; requestId: string } }
  | { kind: 'buy'; id: string }
  | { kind: 'collect' }
  | { kind: 'cancel'; id: string };

export function useExperimentalHybridState() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: stateKey(userId),
    queryFn: ({ signal }) => api.get<ExperimentalHybridState>(endpoint, { signal }),
    enabled: tokenManager.isAuthenticated() && !!userId,
    staleTime: 1_000,
    refetchInterval: ({ state }) => {
      const status = state.data?.job?.status;
      return status === 'incubating' || status === 'generating' ? 3_000 : 10_000;
    },
  });
}

export function useExperimentalHybridQuote(input: ExperimentalHybridSelection | null) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...quoteKey(userId), input],
    queryFn: ({ signal }) =>
      api.post<ExperimentalHybridQuote>(`${endpoint}/quote`, input, { signal }),
    enabled: tokenManager.isAuthenticated() && !!userId && input !== null,
    staleTime: 2_000,
    retry: false,
  });
}

export function useExperimentalHybridAction() {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationFn: (action: ExperimentalHybridAction): Promise<ExperimentalHybridState> => {
      switch (action.kind) {
        case 'start':
          return api.post<ExperimentalHybridState>(`${endpoint}/start`, action.request);
        case 'claim':
          return api.post<ExperimentalHybridState>(
            `${endpoint}/jobs/${encodeURIComponent(action.id)}/claim`,
            {},
          );
        case 'recover':
          return api.post<ExperimentalHybridState>(`${endpoint}/archive/recover`, {});
        case 'list':
          return api.post<ExperimentalHybridState>(`${endpoint}/listings`, action.request);
        case 'buy':
          return api.post<ExperimentalHybridState>(
            `${endpoint}/listings/${encodeURIComponent(action.id)}/buy`,
            {},
          );
        case 'collect':
          return api.post<ExperimentalHybridState>(`${endpoint}/market/collect`, {});
        case 'cancel':
          return api.delete<ExperimentalHybridState>(
            `${endpoint}/listings/${encodeURIComponent(action.id)}`,
          );
      }
    },
    onMutate: () =>
      Promise.all([
        cancelResourceReads(client),
        client.cancelQueries({ queryKey: stateKey(userId) }),
        client.cancelQueries({ queryKey: quoteKey(userId) }),
      ]),
    onSuccess: async (state) => {
      client.setQueryData(stateKey(userId), state);
      const keys = [
        quoteKey(userId),
        queryKeys.dinosaurs,
        resourcesQueryKey,
        queryKeys.currency(),
        queryKeys.parkOperations(),
        queryKeys.firstSynthesis(),
      ];
      await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
    },
  });
}
