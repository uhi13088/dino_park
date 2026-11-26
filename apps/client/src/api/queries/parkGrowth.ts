import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ParkGrowthResponse,
  ParkGrowthRouteId,
  ParkGrowthStage,
  ParkResponse,
} from '@dino-park/shared';
import { api, tokenManager } from '../client';
import { queryKeys } from './index';
import { cancelResourceReads, resourcesQueryKey } from './resources';
import { currentParkGrowthStage, LAST_PARK_GROWTH_STAGE } from '@/utils/parkGrowthNavigation';

export const parkGrowthKey = [...queryKeys.park, 'growth'] as const;
const growthPath = '/parks/me/growth';

type GrowthAction =
  | { kind: 'start-research'; stage?: ParkGrowthStage }
  | { kind: 'claim'; goalId: ParkGrowthResponse['goals'][number]['id']; stage?: ParkGrowthStage }
  | { kind: 'claim-route'; routeId: ParkGrowthRouteId; stage: 6 | 7 };

const growthStageKey = (stage: ParkGrowthStage) => [...parkGrowthKey, stage] as const;
const stageQuery = (stage: ParkGrowthStage) => (stage === 5 ? '' : `?stage=${stage}`);

function validateStage(state: ParkGrowthResponse, stage: ParkGrowthStage) {
  if (state.targetLevel !== stage + 1 || (state.stage !== undefined && state.stage !== stage)) {
    throw new Error(`Lv.${stage + 1} 성장 목표를 확인하지 못했어요.`);
  }
  return state;
}

export function useParkGrowth(stage: ParkGrowthStage = 5) {
  return useQuery({
    queryKey: growthStageKey(stage),
    queryFn: async ({ signal }) => {
      const state = await api.get<ParkGrowthResponse>(`${growthPath}${stageQuery(stage)}`, {
        signal,
      });
      return validateStage(state, stage);
    },
    enabled: tokenManager.isAuthenticated(),
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state && 'research' in state && state.research.status === 'running') return 1000;
      if (state && 'routes' in state && state.routes) {
        if (state.level >= state.targetLevel) return false;
      } else if (state?.goals.every(({ status }) => status === 'claimed')) return false;
      return 5000;
    },
    refetchIntervalInBackground: false,
  });
}

export function useParkGrowthAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (action: GrowthAction) => {
      const path =
        action.kind === 'claim'
          ? `${growthPath}/goals/${action.goalId}/claim`
          : action.kind === 'claim-route'
            ? `${growthPath}/routes/${action.routeId}/claim`
            : `${growthPath}/research/start`;
      const stage = action.stage ?? 5;
      return validateStage(
        await api.post<ParkGrowthResponse>(`${path}${stageQuery(stage)}`, {}),
        stage,
      );
    },
    onMutate: (action) =>
      Promise.all([
        client.cancelQueries({ queryKey: growthStageKey(action.stage ?? 5) }),
        client.cancelQueries({ queryKey: queryKeys.parkMe() }),
        cancelResourceReads(client),
      ]),
    onSuccess: (state, action) => {
      const stage = action.stage ?? 5;
      client.setQueryData(growthStageKey(stage), state);
      if (stage < LAST_PARK_GROWTH_STAGE && state.level >= state.targetLevel) {
        void client.invalidateQueries({
          queryKey: growthStageKey(currentParkGrowthStage(stage + 1)),
        });
      }
      client.setQueryData<ParkResponse>(queryKeys.parkMe(), (park) =>
        park ? { ...park, level: state.level, exp: state.exp } : undefined,
      );
      for (const key of [
        queryKeys.parkMe(),
        queryKeys.parkOperations(),
        queryKeys.currency(),
        queryKeys.research,
        queryKeys.scoutExpedition(),
        resourcesQueryKey,
      ])
        void client.invalidateQueries({ queryKey: key });
    },
  });
}
