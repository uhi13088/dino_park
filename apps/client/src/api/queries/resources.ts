import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  CurrencyResponse,
  PurchaseResourceRequest,
  ResourcesResponse,
  StartProductionRequest,
} from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';

export const resourcesQueryKey = ['resources'] as const;

function syncResources(client: QueryClient, state: ResourcesResponse) {
  client.setQueryData<CurrencyResponse>(queryKeys.currency(), (current) =>
    current ? { ...current, gold: state.gold } : current,
  );
  return state;
}

export async function cancelResourceReads(client: QueryClient) {
  await Promise.all([
    client.cancelQueries({ queryKey: resourcesQueryKey }),
    client.cancelQueries({ queryKey: queryKeys.firstExpedition() }),
    client.cancelQueries({ queryKey: queryKeys.parkOperations() }),
    client.cancelQueries({ queryKey: queryKeys.currency() }),
  ]);
}

export function useResources() {
  const client = useQueryClient();
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return useQuery({
    queryKey: resourcesQueryKey,
    queryFn: async ({ signal }) =>
      syncResources(client, await api.get<ResourcesResponse>('/resources', { signal })),
    enabled: tokenManager.isAuthenticated() && visible,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

function useResourceMutation<T>(send: (variables: T) => Promise<ResourcesResponse>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: send,
    onMutate: () => cancelResourceReads(client),
    onSuccess: (state) => {
      syncResources(client, state);
      client.setQueryData(resourcesQueryKey, state);
      void client.invalidateQueries({ queryKey: queryKeys.park });
      void client.invalidateQueries({ queryKey: queryKeys.buildings });
    },
  });
}

export function usePurchaseResource() {
  return useResourceMutation((request: PurchaseResourceRequest) =>
    api.post<ResourcesResponse>('/resources/purchase', request),
  );
}
export function useStartResourceProduction() {
  return useResourceMutation((request: StartProductionRequest) =>
    api.post<ResourcesResponse>('/resources/production', request),
  );
}
export function useClaimResourceProduction() {
  return useResourceMutation((id: string) =>
    api.post<ResourcesResponse>(`/resources/production/${id}/claim`),
  );
}
