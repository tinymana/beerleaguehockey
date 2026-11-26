/**
 * The referee on the ice. He follows the play from along the side boards, comes to the dot to drop the puck,
 * and signals goals, penalties and stoppages. Pure rules; he is not a body yet: nothing collides with him.
 * Every number is a starting value.
 */
import { goalLineY } from './rink';
import type { RinkGeometry } from './rink';

export const REF = {
  /** How far inside the side boards he skates, and how far from a dot he stands to drop the puck. */
  lane: 20,
  atDot: 13,
  maxSpeed: 170,
  /** How quickly he gets up to speed (per second). */
  response: 6,
  /** He changes sides only when the puck is this far past centre on his side. */
  sideSwitch: 45,
  /** Seconds he holds a signal. */
  signal: { goal: 1.5, penalty: 1.6, washout: 0.9 } as Record<RefSignal, number>,
  /** Skating distance per stride frame, in px. */
  stride: 9,
};

export type RefSignal = 'goal' | 'penalty' | 'washout';

export interface RefereeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** -1 skates the left boards, 1 the right. */
  side: -1 | 1;
  signal: RefSignal | null;
  signalTime: number;
  /** Distance skated, for the stride frames. */
  stride: number;
  /** Is he facing the camera (looking down the screen)? */
  facingCamera: boolean;
  /** Seconds on the ice, for his idle shuffle. */
  time: number;
}

export function makeReferee(rink: RinkGeometry): RefereeState {
  // He starts at centre ice, ready for the opening faceoff.
  return { x: rink.centerX - REF.atDot, y: rink.centerY, vx: 0, vy: 0, side: -1, signal: null, signalTime: 0, stride: 0, facingCamera: true, time: 0 };
}

/** Where he drops the puck from: beside the dot, on the side nearer the boards, so he is not between the centres. */
export function dropSpot(rink: RinkGeometry, dot: { x: number; y: number }): { x: number; y: number } {
  return { x: dot.x + (dot.x <= rink.centerX ? -REF.atDot : REF.atDot), y: dot.y };
}

export function signalReferee(ref: RefereeState, signal: RefSignal): void {
  ref.signal = signal;
  ref.signalTime = REF.signal[signal];
}

/**
 * One step. `dot` is where the next faceoff is while play is stopped, or null while the puck is live.
 * He watches the puck: he faces the camera when the puck is below him on the screen.
 */
export function stepReferee(ref: RefereeState, rink: RinkGeometry, puck: { x: number; y: number }, dot: { x: number; y: number } | null, dt: number): void {
  ref.time += dt;
  if (ref.signalTime > 0) {
    ref.signalTime -= dt;
    if (ref.signalTime <= 0) ref.signal = null;
  }
  let tx: number;
  let ty: number;
  if (dot) {
    ({ x: tx, y: ty } = dropSpot(rink, dot));
  } else {
    const off = puck.x - rink.centerX;
    // Stay on the far side of the ice from the puck, out of the way.
    if (off * ref.side > REF.sideSwitch) ref.side = ref.side === 1 ? -1 : 1;
    tx = ref.side < 0 ? rink.left + REF.lane : rink.right - REF.lane;
    ty = Math.max(goalLineY(rink, 'top') + 24, Math.min(goalLineY(rink, 'bottom') - 24, puck.y));
  }
  const dx = tx - ref.x;
  const dy = ty - ref.y;
  const dist = Math.hypot(dx, dy);
  // He stands still to signal. Otherwise he heads for his spot, easing in.
  const want = ref.signal ? 0 : Math.min(REF.maxSpeed, dist * 5);
  const wx = dist > 0.5 ? (dx / dist) * want : 0;
  const wy = dist > 0.5 ? (dy / dist) * want : 0;
  const k = Math.min(1, REF.response * dt);
  ref.vx += (wx - ref.vx) * k;
  ref.vy += (wy - ref.vy) * k;
  ref.x += ref.vx * dt;
  ref.y += ref.vy * dt;
  ref.stride += Math.hypot(ref.vx, ref.vy) * dt;
  const look = (dot ? dot.y : puck.y) - ref.y;
  if (Math.abs(look) > 6) ref.facingCamera = look > 0;
}

/** The art frame for him: `referee_<view>_<pose>` without the extension. */
export function refereeFrame(ref: RefereeState): string {
  const view = ref.facingCamera ? 'front' : 'back';
  if (ref.signal) return `referee_${view}_${ref.signal}_01`;
  const speed = Math.hypot(ref.vx, ref.vy);
  if (speed > 18) return `referee_${view}_skate_0${(Math.floor(ref.stride / REF.stride) % 4) + 1}`;
  return `referee_${view}_idle_0${(Math.floor(ref.time * 1.5) % 2) + 1}`;
}

/** Every frame name, for loading. */
export const REFEREE_FRAMES: readonly string[] = (['front', 'back'] as const).flatMap((view) =>
  ['idle_01', 'idle_02', 'skate_01', 'skate_02', 'skate_03', 'skate_04', 'goal_01', 'penalty_01', 'washout_01'].map((pose) => `referee_${view}_${pose}`),
);
