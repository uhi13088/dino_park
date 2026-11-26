import type { Rarity } from './common.types';
import type { MaterialQuality, ResearchMaterial } from './codex.types';
import type { DinosaurCompetitiveStats, DinosaurSpecies } from './dinosaur.types';
import type { RepeatSynthesisFocus, RepeatSynthesisFocusOption } from './repeat-synthesis.types';

export type ExperimentalHybridTier = Rarity.EPIC | Rarity.LEGENDARY;

export const EXPERIMENTAL_HYBRID_LISTING_MIN_GOLD = 100;
export const EXPERIMENTAL_HYBRID_LISTING_MAX_GOLD = 1_000_000;

export interface ExperimentalHybridIdentity {
  species: DinosaurSpecies;
  artwork: { idleUrl: string; width: number } | null;
  parentSpeciesIds: string[];
  focus: RepeatSynthesisFocus;
}

export interface ExperimentalHybridSelection {
  parentIds: [string, string];
  focus: RepeatSynthesisFocus;
  tier: ExperimentalHybridTier;
  stabilizer?: boolean;
}

export interface ExperimentalHybridStart extends ExperimentalHybridSelection {
  requestId: string;
}

export interface ExperimentalHybridMaterial {
  material: ResearchMaterial;
  quality: MaterialQuality;
  amount: number;
  available: number;
  failureRefund: number;
  allocations: { quality: MaterialQuality; amount: number; failureRefund: number }[];
}

export interface ExperimentalHybridQuote {
  selection: ExperimentalHybridSelection;
  design: ExperimentalHybridIdentity | null;
  registered: boolean;
  artReady: boolean;
  gold: number;
  durationSeconds: number;
  ingredients: ExperimentalHybridMaterial[];
  blockers: string[];
  reasons: string[];
  attempt: number;
  guaranteedAttempt: number;
  successChance: number;
  estimatedStats: RepeatSynthesisFocusOption['outcomes'] | null;
}

export interface ExperimentalHybridParent {
  id: string;
  speciesId: string;
  name: string;
  nameKo: string;
  nickname?: string | null;
  rarity: Rarity;
  happiness: number;
  hunger: number;
}

export interface ExperimentalHybridDocument {
  id: string;
  lineage: ExperimentalHybridIdentity;
  tier: ExperimentalHybridTier;
  author: string | null;
  source: 'discovered' | 'archive' | 'market';
  canPublish: boolean;
  activeListingId: string | null;
}

export interface ExperimentalHybridListing {
  id: string;
  lineage: ExperimentalHybridIdentity;
  tier: ExperimentalHybridTier;
  seller: string;
  price: number;
  mine: boolean;
  registered: boolean;
}

export interface ExperimentalHybridJobState {
  id: string;
  design: ExperimentalHybridIdentity;
  status: 'incubating' | 'generating' | 'ready' | 'succeeded' | 'failed' | 'refunded';
  readyAt: string;
  dinosaurId: string | null;
  stats?: DinosaurCompetitiveStats | null;
  refunds: { material: ResearchMaterial; quality: MaterialQuality; amount: number }[];
}

export interface ExperimentalHybridState {
  serverTime: string;
  unlocked: boolean;
  lockReasons: string[];
  gold: number;
  artEnabled: boolean;
  parents: ExperimentalHybridParent[];
  job: ExperimentalHybridJobState | null;
  documents: ExperimentalHybridDocument[];
  archive: { missionId: string; reportReceived: boolean; recovered: boolean };
  market: ExperimentalHybridListing[];
  pendingProceeds: number;
}
