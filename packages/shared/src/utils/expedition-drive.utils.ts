export const DRIVE_SECTOR_MS = 18_000;
export const DRIVE_TICK_MS = 100;
export const DRIVE_TICKS_PER_SECTOR = DRIVE_SECTOR_MS / DRIVE_TICK_MS;
export const DRIVE_SECTOR_COUNT = 3;
export const DRIVE_MAX_X = 1000;
export const DRIVE_MAX_DAMAGE = 3;
const MAX_STEP = 44;

export interface DriveEvent {
  id: string;
  tick: number;
  x: number;
  radius: number;
  kind: 'pickup' | 'rock' | 'crossing' | 'poacher';
  amount: number;
  approachX: number;
}

export interface DriveProgress {
  collected: number;
  damage: number;
}

export function stepDriveX(current: number, target: number): number {
  const clamped = Math.max(0, Math.min(DRIVE_MAX_X, Math.round(target)));
  return current + Math.max(-MAX_STEP, Math.min(MAX_STEP, clamped - current));
}

export function getDriveEvents(seed: number, sector: number): DriveEvent[] {
  // Stable on client and server and reproducible after a reload.
  let state = (seed ^ Math.imul(sector + 1, 0x9e3779b9)) >>> 0;
  const roll = (range: number) => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return Math.floor((state / 0x100000000) * range);
  };
  const events: DriveEvent[] = [];
  let side = roll(2);
  for (let i = 0; i < 6; i++) {
    const tick = 23 + i * 27;
    const x = sector === 0 && i === 0 ? 500 : (side === 0 ? 135 : 655) + roll(211);
    events.push({
      id: `${sector}:pickup:${i}`,
      tick,
      x,
      radius: 115,
      kind: 'pickup',
      amount: sector + 1,
      approachX: x,
    });
    side = 1 - side;
    // The opposite edge is safe until the next pickup; event spacing allows crossing the road.
    if (i < 2 + sector) {
      const obstacleX = (i % 2 === 0 ? 90 : 560) + roll(351);
      const kind = i % 3 === 0 ? 'rock' : i % 3 === 1 ? 'crossing' : 'poacher';
      events.push({
        id: `${sector}:obstacle:${i}`,
        tick: tick + 12,
        x: obstacleX,
        radius: kind === 'rock' ? 130 : 155,
        kind,
        amount: 0,
        approachX: kind === 'crossing' ? (obstacleX < 500 ? 0 : DRIVE_MAX_X) : obstacleX,
      });
    }
  }
  return events;
}

export function applyDriveEvent(
  progress: DriveProgress,
  event: DriveEvent,
  x: number,
): DriveProgress {
  if (progress.damage >= DRIVE_MAX_DAMAGE || Math.abs(event.x - x) > event.radius) return progress;
  return event.kind === 'pickup'
    ? { ...progress, collected: progress.collected + event.amount }
    : { ...progress, damage: progress.damage + 1 };
}

/** Replay a sector's sampled path. Null denotes an invalid position trace. */
export function replayDriveSector(
  seed: number,
  sector: number,
  initial: DriveProgress & { x: number },
  positions: readonly number[],
): (DriveProgress & { x: number }) | null {
  if (sector < 0 || sector >= DRIVE_SECTOR_COUNT || positions.length !== DRIVE_TICKS_PER_SECTOR)
    return null;
  let x = initial.x;
  let progress = { collected: initial.collected, damage: initial.damage };
  const events = new Map(getDriveEvents(seed, sector).map((event) => [event.tick, event]));
  for (let tick = 0; tick < positions.length; tick++) {
    const next = positions[tick];
    if (!Number.isInteger(next) || next !== stepDriveX(x, next)) return null;
    x = next;
    const event = events.get(tick);
    if (event) progress = applyDriveEvent(progress, event, x);
  }
  return { x, ...progress };
}
