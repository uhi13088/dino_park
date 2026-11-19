/** Early ordinary resources. Quality is intentionally absent from this UI/API. */
export type EarlyResourceMaterial = 'wood' | 'stone' | 'metal';

export interface ResourceInventoryItem {
  material: EarlyResourceMaterial;
  name: string;
  amount: number;
  buyPrice: number;
}

export interface ResourceProductionRecipe {
  material: EarlyResourceMaterial;
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
  inventory: ResourceInventoryItem[];
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
  material: EarlyResourceMaterial;
  quantity: number;
  requestId?: string;
}

export interface StartProductionRequest {
  buildingId: string;
  lots: number;
}
