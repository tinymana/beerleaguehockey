/**
 * A basic goalie for the Milestone 1 shooting prototype (Decision 78). Pure rules, no rendering.
 *
 * He is deliberately honest: he plays the angle, moves at a finite speed, and reacts to where the puck was a
 * moment ago. Nothing here is tuned to make the bigger net harder to score on. Every number is data.
 */
import type { Rng } from '../../core/rng';
import type { RinkEnd, RinkGeometry } from './rink';
import { PLAY_SCALE, goalLineY } from './rink';

/**
 * Sizes are written for the 48 px net (a 6 ft net, so 8 px a foot) and scaled with the net and the player by PLAY_SCALE,
 * so he keeps the same proportions at any scale (Decision 80).
 * (The first version of these numbers was left at the old 24 px net's scale, which made him half size: he could not
 * cover the sides of a net twice as wide. That was a scale error, corrected here, not a difficulty setting.)
 */
export const GOALIE = {
  /** How far out from the goal line he stands: a little over two feet, inside the crease. */
  depthOut: 18 * PLAY_SCALE,
  /** Half the width of his body and pads together: he is three feet wide. */
  halfBody: 12 * PLAY_SCALE,
  /** Extra reach to each side, above the pads. */
  gloveReach: 7 * PLAY_SCALE,
  blockerReach: 6 * PLAY_SCALE,
  /** Extra reach along the ice with a pad or skate. */
  padReach: 5 * PLAY_SCALE,
  /** Top of the pads, and the highest he can reach. */
  padHeight: 10 * PLAY_SCALE,
  reachHeight: 30 * PLAY_SCALE,
  /** Seconds, after he reacts, to get a glove, blocker or pad to full stretch. A shot that arrives sooner finds only part of his reach. */
  reachTime: 0.3,
  /** From a sharp angle he backs toward his line: his depth shrinks once the puck is closer to the goal line than this. */
  retreatWithin: 50 * PLAY_SCALE,
  minDepthShare: 0.3,
  /** Sideways speed, px/s. */
  speed: 95 * PLAY_SCALE,
  /** Seconds between the puck moving and the goalie seeing it. */
  reaction: 0.12,
  /** Sliding faster than this opens the five-hole: a low puck through the middle gets by. */
  fiveHoleSpeed: 40 * PLAY_SCALE,
  fiveHoleHalf: 2.5 * PLAY_SCALE,
  fiveHoleHeight: 4 * PLAY_SCALE,
  /** Seconds he holds a caught puck before dropping it for play. */
  holdTime: 0.9,
  padRestitution: 0.4,
  blockerRestitution: 0.6,
  /** He stops tracking when the puck is this far up the ice, and squares up to the middle. */
  trackingRange: 420 * PLAY_SCALE,
};

export type SaveKind = 'glove' | 'blocker' | 'pad' | 'body';

export interface Goalie {
  end: RinkEnd;
  x: number;
  y: number;
  vx: number;
  /** +1 if his glove hand is toward the right of the screen, -1 if toward the left. He catches with the left hand. */
  gloveSide: 1 | -1;
  /** Seconds left holding a caught puck; 0 when he has none. */
  holding: number;
}

export function makeGoalie(rink: RinkGeometry, end: RinkEnd): Goalie {
  const line = goalLineY(rink, end);
  // The north goalie faces down the screen, so his left (glove) hand is on the viewer's right; the south goalie is the reverse.
  return { end, x: rink.centerX, y: end === 'top' ? line + GOALIE.depthOut : line - GOALIE.depthOut, vx: 0, gloveSide: end === 'top' ? 1 : -1, holding: 0 };
}

/** Where he wants to be: on the line between the puck (as he last saw it) and the middle of the net. */
export function goalieTarget(rink: RinkGeometry, goalie: Goalie, seenX: number, seenY: number): number {
  const line = goalLineY(rink, goalie.end);
  const out = goalie.end === 'top' ? seenY - line : line - seenY;
  // He goes as far as hugging a post: half his body outside it, never more.
  const limit = Math.max(0, rink.mouthHalfWidth - GOALIE.halfBody / 2);
  if (out <= 0 || out > GOALIE.trackingRange) return rink.centerX;
  const depth = goalieDepth(out);
  const share = out <= depth ? 1 : depth / out;
  return rink.centerX + Math.max(-limit, Math.min(limit, (seenX - rink.centerX) * share));
}

/** How far out he stands for a puck at this distance from the goal line: full depth from out front, backing onto his line for sharp angles. */
export function goalieDepth(out: number): number {
  if (out <= 0) return GOALIE.depthOut * GOALIE.minDepthShare;
  return GOALIE.depthOut * Math.max(GOALIE.minDepthShare, Math.min(1, out / GOALIE.retreatWithin));
}

/** The share of his full stretch he can reach in the time a shot gives him. */
export function reachShare(flightTime: number): number {
  return Math.max(0, Math.min(1, (flightTime - GOALIE.reaction) / GOALIE.reachTime));
}

export function stepGoalie(rink: RinkGeometry, goalie: Goalie, seenX: number, seenY: number, dt: number): void {
  const line = goalLineY(rink, goalie.end);
  const out = goalie.end === 'top' ? seenY - line : line - seenY;
  const depth = goalieDepth(out);
  const wantY = goalie.end === 'top' ? line + depth : line - depth;
  goalie.y += Math.max(-GOALIE.speed * dt, Math.min(GOALIE.speed * dt, wantY - goalie.y));
  const target = goalieTarget(rink, goalie, seenX, seenY);
  const want = target - goalie.x;
  const step = Math.max(-GOALIE.speed * dt, Math.min(GOALIE.speed * dt, want));
  goalie.vx = step / dt;
  goalie.x += step;
  if (goalie.holding > 0) goalie.holding = Math.max(0, goalie.holding - dt);
}

export type ShotOutcome = { saved: SaveKind } | { saved: null; fiveHole: boolean };

/**
 * What happens when the puck reaches the goalie. `offset` is how far the puck is to the right of his middle,
 * `height` how high it is off the ice, `flightTime` how long the shot has been on its way: his body is always there,
 * but a glove, blocker or kick save takes time to get to.
 */
export function resolveShot(goalie: Goalie, offset: number, height: number, flightTime: number = Infinity): ShotOutcome {
  const stretch = reachShare(flightTime);
  const reach = Math.abs(offset);
  const side: 'glove' | 'blocker' = Math.sign(offset || 1) === goalie.gloveSide ? 'glove' : 'blocker';
  if (reach <= GOALIE.fiveHoleHalf && height <= GOALIE.fiveHoleHeight && Math.abs(goalie.vx) >= GOALIE.fiveHoleSpeed) return { saved: null, fiveHole: true };
  if (height > GOALIE.reachHeight) return { saved: null, fiveHole: false };
  if (reach <= GOALIE.halfBody) return { saved: height <= GOALIE.padHeight ? 'pad' : 'body' };
  if (height <= GOALIE.padHeight) return reach <= GOALIE.halfBody + GOALIE.padReach * stretch ? { saved: 'pad' } : { saved: null, fiveHole: false };
  const arm = (side === 'glove' ? GOALIE.gloveReach : GOALIE.blockerReach) * stretch;
  return reach <= GOALIE.halfBody + arm ? { saved: side } : { saved: null, fiveHole: false };
}

/** New puck velocity after a save that does not hold the puck. Rebounds vary, from a seeded stream. */
export function reboundVelocity(goalie: Goalie, kind: 'pad' | 'blocker', offset: number, vx: number, vy: number, rng: Rng): { vx: number; vy: number } {
  const speed = Math.hypot(vx, vy);
  const away = goalie.end === 'top' ? 1 : -1;
  if (kind === 'blocker') {
    // Steered wide, toward the corner on the blocker side.
    return { vx: -goalie.gloveSide * speed * GOALIE.blockerRestitution, vy: away * speed * 0.25 };
  }
  const side = Math.sign(offset) || (rng.next() < 0.5 ? -1 : 1);
  const spread = (rng.next() - 0.5) * 0.9;
  const out = speed * GOALIE.padRestitution;
  return { vx: out * (side * 0.55 + spread), vy: away * out * 0.8 };
}
