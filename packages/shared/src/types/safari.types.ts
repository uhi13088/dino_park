export type SafariZoneKind = 'herbivore' | 'carnivore';

export interface SafariTile {
  x: number;
  y: number;
}

export interface SafariBounds {
  width: number;
  height: number;
}

export interface SafariZone {
  tiles: SafariTile[];
  dinosaurIds: string[];
  water: SafariTile[];
  brush: SafariTile[];
}

export interface SafariLayout {
  zones: Record<SafariZoneKind, SafariZone>;
  stops: SafariTile[];
}

export interface SafariDinosaur {
  id: string;
  speciesId: string;
  name: string;
  zoneKind: SafariZoneKind;
  isInPark: boolean;
  space: number;
}

export interface SafariSighting {
  dinosaurId: string;
  tile: SafariTile;
  behavior: 'drinking' | 'resting';
}

export interface SafariView {
  tile: SafariTile;
  zoneKind: SafariZoneKind;
  sightings: SafariSighting[];
  hiddenCount: number;
}

export interface SafariGate {
  outside: SafariTile;
  inside: SafariTile;
}

export interface SafariTour {
  path: SafariTile[];
  gate: SafariGate;
  views: SafariView[];
}

export interface ParkSafariResponse {
  revision: number;
  parkLevel: number;
  gold: number;
  bounds: SafariBounds;
  blockedTiles: SafariTile[];
  dinosaurs: SafariDinosaur[];
  layout: SafariLayout;
  purchasedTiles: Record<SafariZoneKind, number>;
  carnivoreUnavailableReason: string | null;
  tour: SafariTour | null;
}

export interface SaveParkSafariRequest {
  revision: number;
  layout: SafariLayout;
}
