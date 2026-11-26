/**
 * A basic goalie for the Milestone 1 shooting prototype (Decision 78). Pure rules, no rendering.
 *
 * He is deliberately honest: he plays the angle, moves at a finite speed, and reacts to where the puck was a
 * moment ago. Nothing here is tuned to make the bigger net harder to score on. Every number is data.
 */
import type { Rng } from '../../core/rng';
import type { RinkEnd, RinkGeometry } from './rink';
import { goalLineY } from './rink';

export const GOALIE = {
  /** How far out from the goal line he stands. */
  depthOut: 10,
  /** Half the width of his body and pads together. */
  halfBody: 7,
  /** Extra reach to each side, above the pads. */
  gloveReach: 7,
  blockerReach: 6,
  /** Extra reach along the ice with a pad or skate. */
  padReach: 5,
  /** Top of the pads, and the highest he can reach. */
  padHeight: 10,
  reachHeight: 30,
  /** Sideways speed, px/s. */
  speed: 95,
  /** Seconds between the puck moving and the goalie seeing it. */
  reaction: 0.12,
  /** Sliding faster than this opens the five-hole: a low puck through the middle gets by. */
  fiveHoleSpeed: 40,
  fiveHoleHalf: 2.5,
  fiveHoleHeight: 4,
  /** Seconds he holds a caught puck before dropping it for play. */
  holdTime: 0.9,
  padRestitution: 0.4,
  blockerRestitution: 0.6,
  /** He stops tracking when the puck is this far up the ice, and squares up to the middle. */
  trackingRange: 420,
} as const;

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
  const limit = rink.mouthHalfWidth - 2;
  if (out <= 0 || out > GOALIE.trackingRange) return rink.centerX;
  const share = out <= GOALIE.depthOut ? 1 : GOALIE.depthOut / out;
  return rink.centerX + Math.max(-limit, Math.min(limit, (seenX - rink.centerX) * share));
}

export function stepGoalie(rink: RinkGeometry, goalie: Goalie, seenX: number, seenY: number, dt: number): void {
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
 * `height` how high it is off the ice.
 */
export function resolveShot(goalie: Goalie, offset: number, height: number): ShotOutcome {
  const reach = Math.abs(offset);
  const side: 'glove' | 'blocker' = Math.sign(offset || 1) === goalie.gloveSide ? 'glove' : 'blocker';
  if (reach <= GOALIE.fiveHoleHalf && height <= GOALIE.fiveHoleHeight && Math.abs(goalie.vx) >= GOALIE.fiveHoleSpeed) return { saved: null, fiveHole: true };
  if (height > GOALIE.reachHeight) return { saved: null, fiveHole: false };
  if (reach <= GOALIE.halfBody) return { saved: height <= GOALIE.padHeight ? 'pad' : 'body' };
  if (height <= GOALIE.padHeight) return reach <= GOALIE.halfBody + GOALIE.padReach ? { saved: 'pad' } : { saved: null, fiveHole: false };
  const arm = side === 'glove' ? GOALIE.gloveReach : GOALIE.blockerReach;
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
