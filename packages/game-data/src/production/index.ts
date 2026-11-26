import type { EarlyResourceMaterial, ResourceProductionRecipe } from '@dino-park/shared';

/** Runtime numeric owner for the first ordinary-resource flow. */
export const EARLY_RESOURCE_CAPACITY = 100;
export const FUEL_DEPOT_TYPE_ID = 'production-fuel-depot';
export const FUEL_BUY_PRICE = 100;
export const EARLY_RESOURCES: Array<{ id: EarlyResourceMaterial; name: string; buyPrice: number }> =
  [
    { id: 'wood', name: '목재', buyPrice: 20 },
    { id: 'stone', name: '석재', buyPrice: 30 },
    { id: 'metal', name: '금속', buyPrice: 80 },
  ];

export const EARLY_PRODUCTION_RECIPES: Array<
  ResourceProductionRecipe & { buildingTypeId: string }
> = [
  {
    buildingTypeId: 'production-lumberyard',
    material: 'wood',
    batchQuantity: 20,
    batchCost: 200,
    batchSeconds: 300,
    maxLots: 3,
  },
  {
    buildingTypeId: 'production-quarry',
    material: 'stone',
    batchQuantity: 20,
    batchCost: 300,
    batchSeconds: 360,
    maxLots: 3,
  },
  {
    buildingTypeId: FUEL_DEPOT_TYPE_ID,
    material: 'fuel',
    batchQuantity: 5,
    batchCost: 300,
    batchSeconds: 600,
    maxLots: 3,
  },
];

export function getEarlyProductionRecipe(typeId: string) {
  return EARLY_PRODUCTION_RECIPES.find((recipe) => recipe.buildingTypeId === typeId);
}
