/** Admission economy from docs/current/balance.md. */
export const PARK_ADMISSION = {
  ticketPrice: 20,
  baseGoldCapacity: 25000,
  baseCapacity: 24,
  additionalExhibitCapacity: 20,
  baseExhibitViewingCapacity: 12,
  visitSeconds: 120,
  onlineGraceSeconds: 15,
  firstVisitorsTarget: 10,
  firstVisitorsXp: 200,
  platformTypeId: 'visitor-viewing-platform',
  entranceTypeId: 'operation-entrance-gate',
} as const;

export function getParkLevelExperience(level: number): number {
  return Math.floor(200 * Math.pow(level, 1.8));
}
