import { describe, expect, it } from 'vitest';
import {
  getSafariSnapshot,
  SAFARI_DURATION,
  SAFARI_EVENTS,
  SAFARI_FRAMES,
} from './safariEncounter';

describe('the safari encounter', () => {
  it('keeps the approach identical before the robot can enter', () => {
    const on = getSafariSnapshot(4.5, true);
    const off = getSafariSnapshot(4.5, false);
    expect(on).toEqual(off);
    expect(on.stage).toBe('threat');
    expect(on.trex.x).toBeGreaterThan(getSafariSnapshot(0, true).trex.x);
    expect(on.stego.x).toBeLessThan(getSafariSnapshot(0, true).stego.x);
  });

  it('braces, shows every authored turning frame, then settles facing the other direction', () => {
    const { first, count, duration } = SAFARI_FRAMES.turn;
    const start = SAFARI_EVENTS.stegoTurn;
    const brace = getSafariSnapshot(start - 0.1, false).stego;
    expect(getSafariSnapshot(start - 0.01, false).stego).toEqual(brace);
    expect(brace.facing).toBe(-1);

    for (let index = 0; index < count; index++) {
      const time = start + ((index + 0.5) * duration) / count;
      const left = getSafariSnapshot(time, false);
      expect(left).toEqual(getSafariSnapshot(time, true));
      expect(left.stage).toBe('turn');
      expect(left.stego).toEqual({ ...brace, facing: 1, frame: first + index });
    }

    const after = getSafariSnapshot(start + duration + 0.01, false);
    expect(after.stage).toBe('threat');
    expect(after.stego).toEqual({ ...brace, facing: 1, frame: SAFARI_FRAMES.threat.first });
    expect(getSafariSnapshot(start + duration + 0.1, false).stego).toEqual(after.stego);
  });

  it('resolves the occupied clearing through intervention or a synchronized tail strike', () => {
    const entry = getSafariSnapshot(SAFARI_EVENTS.robotEntry, true);
    const interception = getSafariSnapshot(SAFARI_EVENTS.intervention, true);
    const charge = getSafariSnapshot(SAFARI_EVENTS.charge, false);
    const strike = getSafariSnapshot(SAFARI_EVENTS.strike, false);

    expect(entry.stage).toBe('robot-entry');
    expect(entry.robot).not.toBeNull();
    expect(interception).toMatchObject({
      stage: 'intervention',
      outcome: 'separated',
      impactAge: null,
    });
    expect(strike).toMatchObject({
      stage: 'strike',
      outcome: 'repelled',
      robot: null,
      impactAge: 0,
    });
    expect(strike.trex.x).toBeGreaterThan(charge.trex.x);
    expect(strike.trex.frame).toBe(SAFARI_FRAMES.react.first - 1);
    expect(getSafariSnapshot(7.6, false).trex).toEqual(strike.trex);
    expect(getSafariSnapshot(7.6, false).stego).toEqual(strike.stego);
    expect(getSafariSnapshot(SAFARI_EVENTS.recoil, false).trex.frame).toBe(
      SAFARI_FRAMES.react.first,
    );
    expect(strike.stego.frame).toBeGreaterThanOrEqual(SAFARI_FRAMES.attack.first);
    expect(strike.stego.frame).toBeLessThan(SAFARI_FRAMES.react.first);
    expect(getSafariSnapshot(8.45, false).trex.x).toBeLessThan(strike.trex.x);
    expect(getSafariSnapshot(8.45, true).trex.x).toBeLessThan(interception.trex.x);
  });

  it('selects only delivered atlas frames, stops the jeep for observation, and ends in 15 seconds', () => {
    const atlasFrames = Object.values(SAFARI_FRAMES).reduce((total, clip) => total + clip.count, 0);
    for (const robotOn of [true, false]) {
      const atStop = getSafariSnapshot(5, robotOn).jeep;
      expect(getSafariSnapshot(8, robotOn).jeep).toEqual(atStop);
      expect(getSafariSnapshot(14, robotOn).jeep.x).toBeGreaterThan(atStop.x);
      for (let ticks = 0; ticks <= 150; ticks++) {
        const { trex, stego } = getSafariSnapshot(ticks / 10, robotOn);
        expect(trex.frame).toBeGreaterThanOrEqual(0);
        expect(stego.frame).toBeGreaterThanOrEqual(0);
        expect(trex.frame).toBeLessThan(SAFARI_FRAMES.turn.first);
        expect(stego.frame).toBeLessThan(atlasFrames);
      }
      const finish = getSafariSnapshot(30, robotOn);
      expect(finish).toMatchObject({
        stage: 'complete',
        time: SAFARI_DURATION,
        outcome: robotOn ? 'separated' : 'repelled',
        robot: null,
      });
    }
  });
});
