export interface ExhibitPlacementRates {
  demandPerMinute: number;
  visitorsPerMinute: number;
  occupancyCapacity: number;
  exhibitCount: number;
}

export interface ExhibitPlacementEstimate {
  current: ExhibitPlacementRates;
  proposed: ExhibitPlacementRates | null;
  explanation: string | null;
  exhibit?: {
    currentVisitors: number;
    proposedVisitors: number;
    proposedCrowdingPercent: number;
  };
}
