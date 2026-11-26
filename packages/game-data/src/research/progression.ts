import type {
  ResearchFacilityUpgrade,
  TechnologyDefinition,
  TechnologyFamily,
} from '@dino-park/shared';
import generated from './progression.generated.json';

export type { TechnologyDefinition } from '@dino-park/shared';

export const RESEARCH_LAB_ID = 'research-dna-lab';
export const RESEARCH_STORAGE_ID = 'production-warehouse';
export const GOLD_VAULT_ID = 'operation-vault';

export const TECHNOLOGY_CATALOG: readonly TechnologyDefinition[] = generated.technology.map(
  (node) => ({ ...node, family: node.family as TechnologyFamily }),
);

export const TECHNOLOGY_RESEARCH_POLICY = generated.researchPolicy;

const technologyById = new Map(TECHNOLOGY_CATALOG.map((technology) => [technology.id, technology]));
export const RESEARCH_FACILITY_UPGRADES: Record<
  typeof RESEARCH_LAB_ID | typeof RESEARCH_STORAGE_ID | typeof GOLD_VAULT_ID,
  readonly ResearchFacilityUpgrade[]
> = generated.facilities;

export function getTechnology(id: string): TechnologyDefinition | undefined {
  return technologyById.get(id);
}

export function getResearchFacilityUpgrade(
  blueprintId: string,
  targetLevel: number,
): ResearchFacilityUpgrade | undefined {
  if (!Object.hasOwn(RESEARCH_FACILITY_UPGRADES, blueprintId)) return undefined;

  const levels = RESEARCH_FACILITY_UPGRADES[blueprintId as keyof typeof RESEARCH_FACILITY_UPGRADES];
  return levels[targetLevel - 1];
}
