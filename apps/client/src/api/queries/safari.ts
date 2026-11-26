import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CurrencyResponse,
  ParkSafariResponse,
  SaveParkSafariRequest,
} from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from '.';
import { cancelResourceReads } from './resources';

const safariKey = [...queryKeys.park, 'safari'] as const;

export function useParkSafari(enabled = true) {
  return useQuery({
    queryKey: safariKey,
    queryFn: ({ signal }) => api.get<ParkSafariResponse>('/parks/me/safari', { signal }),
    enabled: enabled && tokenManager.isAuthenticated(),
  });
}

export function useSaveParkSafari() {
  const client = useQueryClient();
  return useMutation({
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: safariKey, exact: true }),
        cancelResourceReads(client),
      ]);
    },
    mutationFn: (request: SaveParkSafariRequest) =>
      api.put<ParkSafariResponse>('/parks/me/safari', request),
    onSuccess: async (safari) => {
      await cancelResourceReads(client);
      client.setQueryData(safariKey, safari);
      client.setQueryData<CurrencyResponse>(
        queryKeys.currency(),
        (currency) => currency && { ...currency, gold: safari.gold },
      );
      void client.invalidateQueries({ queryKey: queryKeys.parkOperations() });
      void client.invalidateQueries({ queryKey: queryKeys.dinosaurs });
      void client.invalidateQueries({ queryKey: queryKeys.economy });
    },
  });
}
