import type { Prisma } from '@prisma/client';
import {
  PARK_SHUTTLE,
  estimateShuttleRoute,
  parkTravelSatisfactionPenalty,
  type ParkShuttleDestination,
  type ParkShuttleResponse,
  type ShuttleDepartureInterval,
} from '@dino-park/shared';

type ShuttleRoute = {
  exhibitId: string;
  busCount: number;
  departureIntervalSeconds: ShuttleDepartureInterval;
};
type Tile = { x: number; y: number };

export function readShuttleService(value: Prisma.JsonValue | undefined) {
  const raw = jsonRecord(value);
  const requestIds = (Array.isArray(raw?.requestIds) ? raw.requestIds : []).filter(
    (id): id is string => typeof id === 'string',
  );
  const purchases = [...new Set(requestIds)].slice(0, PARK_SHUTTLE.maxBuses);
  const routes: ShuttleRoute[] = [];
  let unassigned = purchases.length;
  for (const routeValue of Array.isArray(raw?.routes) ? raw.routes : []) {
    if (routes.length >= PARK_SHUTTLE.maxRoutes) break;
    const route = jsonRecord(routeValue);
    const { exhibitId, busCount, departureIntervalSeconds } = route ?? {};
    if (
      typeof exhibitId !== 'string' ||
      typeof busCount !== 'number' ||
      !Number.isInteger(busCount) ||
      busCount < 1 ||
      busCount > unassigned ||
      !isShuttleInterval(departureIntervalSeconds) ||
      routes.some((saved) => saved.exhibitId === exhibitId)
    )
      continue;
    routes.push({ exhibitId, busCount, departureIntervalSeconds });
    unassigned -= busCount;
  }
  return { requestIds: purchases, routes };
}

function jsonRecord(value: Prisma.JsonValue | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function isShuttleInterval(value: unknown): value is ShuttleDepartureInterval {
  return PARK_SHUTTLE.departureIntervals.some((interval) => interval === value);
}

type ShuttleContext = {
  parkLevel: number;
  shuttleService?: Prisma.JsonValue;
  buildings: readonly { id: string; typeId: string }[];
  exhibits: ReadonlyMap<string, { interest: number }>;
  exhibitInterest: number;
  visitorPaths: ReadonlyMap<string, Tile[]>;
  operatingVisitorsPerMinute: number;
  isOperating: boolean;
};

export function shuttleSnapshot(context: ShuttleContext) {
  const { requestIds, routes } = readShuttleService(context.shuttleService);
  const unavailableReason =
    context.parkLevel < PARK_SHUTTLE.minimumParkLevel
      ? `파크 Lv.${PARK_SHUTTLE.minimumParkLevel}에 도달해주세요.`
      : context.exhibits.size < PARK_SHUTTLE.minimumExhibits
        ? `관람길로 연결된 전시를 ${PARK_SHUTTLE.minimumExhibits}곳 운영해주세요.`
        : null;
  const unlocked = unavailableReason === null;
  const routeByExhibit = new Map(routes.map((route) => [route.exhibitId, route]));
  const destinations: ParkShuttleDestination[] = [];
  const penaltyByExhibit = new Map<string, number>();
  let hourlyGold = 0;
  const availableExhibits = unlocked ? context.exhibits.keys() : [];
  for (const exhibitId of new Set([...availableExhibits, ...routeByExhibit.keys()])) {
    const exhibit = context.exhibits.get(exhibitId);
    const path = exhibit ? (context.visitorPaths.get(exhibitId) ?? []) : [];
    const distance = path.length - 1;
    const reachable = distance >= PARK_SHUTTLE.minimumDistance;
    const config = routeByExhibit.get(exhibitId);
    if (!config && !reachable) continue;
    const visitorShare = !exhibit
      ? 0
      : context.exhibitInterest
        ? exhibit.interest / context.exhibitInterest
        : 1 / context.exhibits.size;
    const demandPerMinute = context.operatingVisitorsPerMinute * visitorShare;
    let route: ParkShuttleDestination['route'] = null;
    if (config) {
      const { busCount, departureIntervalSeconds } = config;
      const status =
        !reachable || !unlocked ? 'disconnected' : context.isOperating ? 'running' : 'closed';
      const estimate =
        status === 'disconnected'
          ? null
          : estimateShuttleRoute(distance, demandPerMinute, busCount, departureIntervalSeconds);
      route = { busCount, departureIntervalSeconds, status, estimate };
      if (status === 'running' && estimate) hourlyGold += estimate.hourlyGold;
    }
    if (unlocked && reachable) {
      const travelSeconds =
        route?.status === 'running' && route.estimate
          ? route.estimate.averageTravelSeconds
          : distance * PARK_SHUTTLE.secondsPerWalkingTile;
      penaltyByExhibit.set(exhibitId, parkTravelSatisfactionPenalty(travelSeconds));
    }
    destinations.push({
      exhibitId,
      typeId: context.buildings.find(({ id }) => id === exhibitId)?.typeId ?? null,
      distance: reachable ? distance : null,
      demandPerMinute,
      path: reachable ? path : [],
      route,
    });
  }
  const state: ParkShuttleResponse = {
    unlocked,
    unavailableReason,
    ownedBusCount: requestIds.length,
    unassignedBusCount: requestIds.length - routes.reduce((sum, route) => sum + route.busCount, 0),
    destinations,
  };
  return { state, penaltyByExhibit, hourlyGold };
}
