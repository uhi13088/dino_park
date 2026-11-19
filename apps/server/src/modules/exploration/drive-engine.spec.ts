import {
  DRIVE_SECTOR_COUNT,
  DRIVE_TICKS_PER_SECTOR,
  getDriveEvents,
  replayDriveSector,
  stepDriveX,
} from '@dino-park/shared';

function safeTrace(seed: number, sector: number, initialX: number) {
  const events = getDriveEvents(seed, sector);
  let x = initialX;
  let marker = 0;
  return Array.from({ length: DRIVE_TICKS_PER_SECTOR }, (_, tick) => {
    const event = events[marker];
    if (!event) return x;
    const destination = event.kind === 'pickup' ? event.x : event.x < 500 ? 960 : 40;
    x = stepDriveX(x, destination);
    if (tick === event.tick) marker++;
    return x;
  });
}

describe('server replay of an expedition drive', () => {
  it('supports a continuous safe path and gathers enough for every early goal across seed variations', () => {
    for (let seed = 1; seed <= 100; seed++) {
      let saved = { x: 500, collected: 0, damage: 0 };
      for (let sector = 0; sector < DRIVE_SECTOR_COUNT; sector++) {
        const trace = safeTrace(seed, sector, saved.x);
        const original = replayDriveSector(seed, sector, saved, trace);
        const resumed = replayDriveSector(seed, sector, { ...saved }, trace);
        expect(original).toEqual(resumed);
        expect(original).not.toBeNull();
        saved = original!;
      }
      expect(saved.damage).toBe(0);
      expect(saved.collected).toBeGreaterThanOrEqual(13);
    }
  });

  it('rejects partial, impossible, or outside-road traces and scores idle driving below any goal', () => {
    const start = { x: 500, collected: 0, damage: 0 };
    const idle = Array<number>(DRIVE_TICKS_PER_SECTOR).fill(500);
    expect(replayDriveSector(7, 0, start, idle.slice(1))).toBeNull();
    expect(replayDriveSector(7, 0, start, [1000, ...idle.slice(1)])).toBeNull();
    expect(replayDriveSector(7, 0, { ...start, x: 0 }, [-1, ...idle.slice(1)])).toBeNull();
    let saved = start;
    for (let sector = 0; sector < DRIVE_SECTOR_COUNT; sector++)
      saved = replayDriveSector(7, sector, saved, idle)!;
    expect(saved.collected).toBeLessThan(10);
  });
});
