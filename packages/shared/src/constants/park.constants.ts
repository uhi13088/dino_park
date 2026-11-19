/** Admission economy implemented from docs/current/balance.md (0.4). */
export const PARK_ADMISSION = {
  ticketPrice: 20,
  baseCapacity: 12,
  visitSeconds: 60,
  onlineGraceSeconds: 15,
  firstVisitorsTarget: 10,
  firstVisitorsXp: 200,
  platformTypeId: 'visitor-viewing-platform',
  entranceTypeId: 'operation-entrance-gate',
} as const;

export function getParkLevelExperience(level: number): number {
  return Math.floor(200 * Math.pow(level, 1.8));
}
