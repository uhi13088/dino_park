export const SAFARI_DURATION = 15;

export const SAFARI_FRAMES = {
  idle: { first: 0, count: 8, duration: 1.2, loop: true },
  walk: { first: 8, count: 12, duration: 1.14, loop: true },
  threat: { first: 20, count: 10, duration: 1.15, loop: false },
  attack: { first: 30, count: 12, duration: 1.14, loop: false },
  react: { first: 42, count: 8, duration: 0.76, loop: false },
  retreat: { first: 50, count: 10, duration: 1.1, loop: true },
  turn: { first: 60, count: 4, duration: 0.42, loop: false },
} as const;

export type SafariClip = keyof typeof SAFARI_FRAMES;
export type Point = { x: number; y: number };
export type SafariPose = Point & { facing: 1 | -1; frame: number };
type MotionPoint = Point & { at: number; eased?: boolean };

export const SAFARI_SCENE = {
  width: 1152,
  height: 648,
  frameWidth: 192,
  frameHeight: 160,
  columns: 8,
  rows: 8,
  footX: 96,
  footY: 119,
} as const;

export const SAFARI_EVENTS = {
  threat: 4.2,
  stegoTurn: 5.06,
  robotEntry: 5.8,
  intervention: 6.8,
  charge: 6.4,
  strike: 7.53,
  recoil: 7.67,
  retreat: 8.45,
} as const;

export const SAFARI_CONTACT = { x: 566, y: 330 } as const;

const STEGO_TURN_END = SAFARI_EVENTS.stegoTurn + SAFARI_FRAMES.turn.duration;
const STEGO_BRACE_SECONDS = 0.12;

const trexApproach: MotionPoint[] = [
  { at: 0, x: 315, y: 350 },
  { at: 2.4, x: 382, y: 357 },
  { at: 4.2, x: 447, y: 369 },
];
const stegoApproach: MotionPoint[] = [
  { at: 0, x: 786, y: 399 },
  { at: 2.2, x: 718, y: 389 },
  { at: 4.2, x: 661, y: 376 },
];
const trexCharge: MotionPoint[] = [
  { at: SAFARI_EVENTS.charge, x: 447, y: 369 },
  { at: 6.78, x: 459, y: 372, eased: true },
  { at: SAFARI_EVENTS.strike, x: 506, y: 369 },
  { at: SAFARI_EVENTS.recoil, x: 506, y: 369 },
  { at: 8.02, x: 485, y: 371, eased: true },
  { at: 8.45, x: 475, y: 369 },
  { at: 12, x: 368, y: 353 },
];
const trexYield: MotionPoint[] = [
  { at: SAFARI_EVENTS.intervention, x: 447, y: 369 },
  { at: 7.43, x: 422, y: 366, eased: true },
  { at: 8.45, x: 414, y: 366 },
  { at: 12, x: 349, y: 342 },
];
const stegoStrike: MotionPoint[] = [
  { at: SAFARI_EVENTS.charge, x: 661, y: 376 },
  { at: 7.08, x: 655, y: 377, eased: true },
  { at: SAFARI_EVENTS.strike, x: 655, y: 384 },
  { at: SAFARI_EVENTS.recoil, x: 655, y: 384 },
  { at: 8.5, x: 648, y: 375, eased: true },
  { at: 12.1, x: 749, y: 388 },
];
const stegoYield: MotionPoint[] = [
  { at: SAFARI_EVENTS.intervention, x: 661, y: 376 },
  { at: 8.45, x: 674, y: 377, eased: true },
  { at: 12.1, x: 764, y: 391 },
];
const robotRoute: MotionPoint[] = [
  { at: SAFARI_EVENTS.robotEntry, x: 612, y: 451 },
  { at: 6.89, x: 592, y: 410, eased: true },
  { at: 10.9, x: 592, y: 410 },
  { at: 12.6, x: 616, y: 453, eased: true },
];
const jeepRoute: MotionPoint[] = [
  { at: 0, x: 273, y: 505 },
  { at: 2.75, x: 384, y: 535 },
  { at: 5, x: 504, y: 551, eased: true },
  { at: 9.1, x: 504, y: 551 },
  { at: 11.3, x: 620, y: 565, eased: true },
  { at: 15, x: 868, y: 569 },
];

function unit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function position(path: MotionPoint[], time: number): Point {
  const first = path[0];
  const endIndex = path.findIndex(({ at }) => at > time);
  if (endIndex === 0) return { x: first.x, y: first.y };
  if (endIndex === -1) {
    const last = path[path.length - 1];
    return { x: last.x, y: last.y };
  }
  const before = path[endIndex - 1];
  const after = path[endIndex];
  const fraction = unit((time - before.at) / (after.at - before.at));
  const progress = after.eased ? fraction * fraction * (3 - 2 * fraction) : fraction;
  return {
    x: before.x + (after.x - before.x) * progress,
    y: before.y + (after.y - before.y) * progress,
  };
}

function pose(point: Point, facing: 1 | -1, clip: SafariClip, elapsed: number): SafariPose {
  const { first, count, duration, loop } = SAFARI_FRAMES[clip];
  const fraction = Math.max(0, elapsed / duration);
  const local = loop ? fraction % 1 : Math.min(fraction, 1);
  return { ...point, facing, frame: first + Math.min(count - 1, Math.floor(local * count)) };
}

function warningPose(point: Point, time: number): SafariPose {
  if (time < SAFARI_EVENTS.stegoTurn) {
    const brace = SAFARI_EVENTS.stegoTurn - SAFARI_EVENTS.threat - STEGO_BRACE_SECONDS;
    return pose(point, -1, 'threat', Math.min(time - SAFARI_EVENTS.threat, brace));
  }
  if (time < STEGO_TURN_END) return pose(point, 1, 'turn', time - SAFARI_EVENTS.stegoTurn);
  return pose(point, 1, 'threat', time - STEGO_TURN_END - STEGO_BRACE_SECONDS);
}

function getDinosaurPoses(time: number, robotOn: boolean) {
  const trex =
    time < SAFARI_EVENTS.charge
      ? position(trexApproach, time)
      : position(robotOn ? trexYield : trexCharge, time);
  const stego =
    time < SAFARI_EVENTS.charge
      ? position(stegoApproach, time)
      : position(robotOn ? stegoYield : stegoStrike, time);
  if (time < SAFARI_EVENTS.threat)
    return { trex: pose(trex, 1, 'walk', time), stego: pose(stego, -1, 'walk', time) };
  if (time < SAFARI_EVENTS.charge || (robotOn && time < SAFARI_EVENTS.intervention)) {
    const warning = time - SAFARI_EVENTS.threat;
    return {
      trex: pose(trex, 1, 'threat', warning),
      stego: warningPose(stego, time),
    };
  }
  if (!robotOn && time < SAFARI_EVENTS.recoil) {
    const attackTime = Math.min(time, SAFARI_EVENTS.strike);
    return {
      trex: pose(trex, 1, 'attack', attackTime - SAFARI_EVENTS.charge),
      stego: time < 6.8 ? warningPose(stego, time) : pose(stego, 1, 'attack', attackTime - 6.8),
    };
  }
  if (time < SAFARI_EVENTS.retreat) {
    return {
      trex: pose(
        trex,
        1,
        'react',
        time - (robotOn ? SAFARI_EVENTS.intervention : SAFARI_EVENTS.recoil),
      ),
      stego: robotOn
        ? pose(stego, 1, 'react', time - 6.95)
        : pose(stego, 1, 'attack', time - 6.8 - (SAFARI_EVENTS.recoil - SAFARI_EVENTS.strike)),
    };
  }
  return {
    trex: pose(trex, 1, time < 12 ? 'retreat' : 'idle', time - SAFARI_EVENTS.retreat),
    stego: pose(stego, 1, time < 12.1 ? 'walk' : 'idle', time - SAFARI_EVENTS.retreat),
  };
}

function getStageAt(time: number, robotOn: boolean) {
  if (time >= SAFARI_DURATION) return 'complete';
  if (time >= SAFARI_EVENTS.retreat) return 'retreat';
  if (robotOn) {
    if (time >= SAFARI_EVENTS.intervention) return 'intervention';
    if (time >= SAFARI_EVENTS.robotEntry) return 'robot-entry';
  } else {
    if (time >= SAFARI_EVENTS.strike) return 'strike';
    if (time >= SAFARI_EVENTS.charge) return 'charge';
  }
  if (time >= SAFARI_EVENTS.stegoTurn && time < STEGO_TURN_END) return 'turn';
  return time >= SAFARI_EVENTS.threat ? 'threat' : 'approach';
}

export function getSafariSnapshot(elapsed: number, robotOn: boolean) {
  const time = Math.max(0, Math.min(elapsed, SAFARI_DURATION));
  const { trex, stego } = getDinosaurPoses(time, robotOn);
  const stage = getStageAt(time, robotOn);
  const robot =
    robotOn && time >= SAFARI_EVENTS.robotEntry && time < 12.6 ? position(robotRoute, time) : null;
  const incident = robotOn ? SAFARI_EVENTS.intervention : SAFARI_EVENTS.strike;
  return {
    stage,
    time,
    trex,
    stego,
    jeep: position(jeepRoute, time),
    robot,
    outcome: time < incident ? 'pending' : robotOn ? 'separated' : 'repelled',
    impactAge: !robotOn && time >= SAFARI_EVENTS.strike ? time - SAFARI_EVENTS.strike : null,
    pulseAge:
      robotOn && time >= SAFARI_EVENTS.intervention ? time - SAFARI_EVENTS.intervention : null,
  } as const;
}

export type SafariSnapshot = ReturnType<typeof getSafariSnapshot>;
