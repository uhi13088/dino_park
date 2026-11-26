import { MaterialQuality, type ResearchMaterial } from './codex.types';

/** Early ordinary resources. Quality is intentionally absent from this UI/API. */
export type EarlyResourceMaterial = 'wood' | 'stone' | 'metal';
export type SupplyMaterial = EarlyResourceMaterial | 'fuel';

export const RESEARCH_MATERIAL_UPGRADE = {
  ratio: 3,
  gold: { [MaterialQuality.LOW]: 50, [MaterialQuality.MIDDLE]: 150 },
} as const;

export interface UpgradeResearchMaterialRequest {
  material: ResearchMaterial;
  fromQuality: MaterialQuality.LOW | MaterialQuality.MIDDLE;
  quantity: number;
  requestId: string;
}

export interface ResourceInventoryItem {
  material: EarlyResourceMaterial;
  name: string;
  amount: number;
  buyPrice: number;
}

export interface ResourceProductionRecipe {
  material: SupplyMaterial;
  batchQuantity: number;
  batchCost: number;
  batchSeconds: number;
  maxLots: number;
}

export interface ResourceProductionJob {
  id: string;
  lots: number;
  quantity: number;
  readyAt: string;
  ready: boolean;
  claimBlocked: boolean;
}

export interface ResourcesResponse {
  gold: number;
  parkLevel: number;
  capacityPerMaterial: number;
  fuel: { amount: number; capacity: number; nextRechargeAt: string | null };
  inventory: ResourceInventoryItem[];
  researchMaterials?: { material: ResearchMaterial; quality: MaterialQuality; amount: number }[];
  facilities: Array<{
    typeId: string;
    name: string;
    unlockLevel: number;
    cost: number;
    constructionSeconds: number;
    building: { id: string; status: string; completesAt: string | null } | null;
    recipe: ResourceProductionRecipe;
    job: ResourceProductionJob | null;
  }>;
  platformUpgrade: {
    buildingId: string;
    level: number;
    targetLevel: number | null;
    completesAt: string | null;
    available: boolean;
    reason: string | null;
    cost: { gold: number; wood: number; stone: number; metal?: number };
    seconds: number;
    targetCapacity: number;
  } | null;
}

export interface PurchaseResourceRequest {
  material: SupplyMaterial;
  quantity: number;
  requestId?: string;
}

export interface StartProductionRequest {
  buildingId: string;
  lots: number;
}
