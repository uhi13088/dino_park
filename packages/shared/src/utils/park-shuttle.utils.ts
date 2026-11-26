export const PARK_SHUTTLE = {
  minimumParkLevel: 10,
  minimumExhibits: 2,
  minimumDistance: 12,
  purchaseGold: 6_000,
  maxBuses: 8,
  maxRoutes: 4,
  seats: 12,
  departureIntervals: [30, 60, 90] as const,
  secondsPerWalkingTile: 5,
  secondsPerBusTile: 2,
  terminalTurnaroundSeconds: 12,
  goldPerDeparture: 2,
} as const;

export type ShuttleDepartureInterval = (typeof PARK_SHUTTLE.departureIntervals)[number];

export function estimateShuttleRoute(
  distance: number,
  demandPerMinute: number,
  busCount: number,
  interval: ShuttleDepartureInterval,
) {
  const walkingSeconds = distance * PARK_SHUTTLE.secondsPerWalkingTile;
  const ridingSeconds = distance * PARK_SHUTTLE.secondsPerBusTile;
  const roundTripSeconds = (ridingSeconds + PARK_SHUTTLE.terminalTurnaroundSeconds) * 2;
  const departureIntervalSeconds = Math.max(interval, Math.ceil(roundTripSeconds / busCount));
  const averageWaitSeconds = departureIntervalSeconds / 2;
  const capacityPerMinute = (PARK_SHUTTLE.seats * 60) / departureIntervalSeconds;
  const shuttleSeconds = ridingSeconds + averageWaitSeconds;
  const ridersPerMinute =
    shuttleSeconds < walkingSeconds ? Math.min(demandPerMinute, capacityPerMinute) : 0;
  const walkingPerMinute = Math.max(0, demandPerMinute - ridersPerMinute);
  const averageTravelSeconds = demandPerMinute
    ? (shuttleSeconds * ridersPerMinute + walkingSeconds * walkingPerMinute) / demandPerMinute
    : walkingSeconds;
  return {
    walkingSeconds,
    ridingSeconds,
    roundTripSeconds,
    departureIntervalSeconds,
    averageWaitSeconds,
    capacityPerMinute,
    ridersPerMinute,
    walkingPerMinute,
    averageTravelSeconds,
    hourlyGold: Math.ceil((PARK_SHUTTLE.goldPerDeparture * 3600) / departureIntervalSeconds),
  };
}

export type ShuttleRouteEstimate = ReturnType<typeof estimateShuttleRoute>;

export function parkTravelSatisfactionPenalty(travelSeconds: number): number {
  return Math.min(24, Math.round(Math.max(0, travelSeconds - 45) / 4));
}
