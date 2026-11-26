export const SECURITY_CENTER_TYPE_ID = 'operation-security-center';

export const SECURITY_CENTER_LEVEL_ONE_STATS = {
  maintenanceCost: 80,
  riskCapacity: 3,
} as const;

// The first expansion uses the security-center row from balance 0.6.
export const SECURITY_CENTER_LEVEL_TWO_UPGRADE = {
  targetLevel: 2,
  gold: 6000,
  materials: { wood: 20, stone: 40 },
  seconds: 150,
  maintenanceCost: 87,
  riskCapacity: 3,
  hazardousUpkeepReductionPercent: 0.5,
} as const;
