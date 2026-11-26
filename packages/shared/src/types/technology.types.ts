export type TechnologyFamily = 'ops' | 'care' | 'exp' | 'gene';

export interface TechnologyPrerequisite {
  technologyId: string;
  level: number;
}

export interface ResearchCosts {
  gold: number;
  wood: number;
  stone: number;
  metal: number;
}

export interface TechnologyRankDefinition {
  level: number;
  labLevel: number;
  afterFirstHero: boolean;
  costs: ResearchCosts;
  durationSeconds: number;
  minimumDurationSeconds: number;
}

export interface TechnologyDefinition {
  id: string;
  name: string;
  description: string;
  family: TechnologyFamily;
  prerequisites: readonly TechnologyPrerequisite[];
  ranks: readonly TechnologyRankDefinition[];
}

export interface ResearchFacilityUpgrade {
  level: number;
  costs: ResearchCosts;
  durationSeconds: number;
  minimumDurationSeconds: number;
  parkLevel: number;
  afterFirstHero: boolean;
  effect: number;
  upkeep: number;
  prerequisite?: TechnologyPrerequisite;
}

export interface ResearchPrerequisite extends TechnologyPrerequisite {
  name: string;
  completedLevel: number;
}

export interface ResearchRankQuote extends TechnologyRankDefinition {
  unavailableReason?: string;
}

export interface ResearchTechnologyState {
  id: string;
  name: string;
  family: TechnologyFamily;
  connected: boolean;
  completedLevel: number;
  maxLevel: number;
  prerequisites: ResearchPrerequisite[];
  next: ResearchRankQuote | null;
}

export interface ResearchFacilityQuote extends Omit<
  ResearchFacilityUpgrade,
  'upkeep' | 'afterFirstHero' | 'prerequisite'
> {
  prerequisite?: ResearchPrerequisite;
  unavailableReason?: string;
}

export interface ResearchFacilityState {
  typeId: string;
  name: string;
  completedLevel: number;
  effect: number;
  cap: number;
  building: { id: string; level: number; status: string; completesAt: string | null } | null;
  next: ResearchFacilityQuote | null;
}

export interface ResearchStateResponse {
  serverNow: string;
  parkLevel: number;
  gold: number;
  goldCapacity: number;
  capacityPerMaterial: number;
  stock: Omit<ResearchCosts, 'gold'>;
  queue: {
    capacity: number;
    jobs: Array<{
      technologyId: string;
      name: string;
      level: number;
      startedAt: string;
      completesAt: string;
    }>;
  };
  technologies: ResearchTechnologyState[];
  facilities: ResearchFacilityState[];
}
