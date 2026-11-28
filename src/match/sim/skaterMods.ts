/**
 * How a skater's ratings change the way he plays. Pure data and arithmetic.
 *
 * The simulation knows nothing about careers or player creation: it takes plain ratings by name (1 to 99)
 * and turns them into multipliers. A skater with no modifiers plays exactly as the tuning says.
 * Every number here is a starting value for hands-on testing, not approved balance (Decision 101).
 */

/** The ratings the ice uses so far. Names match the attribute list; anything missing counts as average. */
export const ICE_RATINGS = ['skatingSpeed', 'acceleration', 'agility', 'wristShotPower', 'wristShotAccuracy', 'slapShotPower', 'slapShotAccuracy', 'passing', 'checking'] as const;
export type IceRating = (typeof ICE_RATINGS)[number];
export type IceRatings = Partial<Record<IceRating, number>>;

export const MODS = {
  /**
   * The rating that plays exactly as the tuning says: an ordinary beer-league skater. A newly created player's
   * ratings average about 28 (measured over 30 created forwards: 23 to 32), so he starts near it.
   */
  average: 30,
  /** How far a rating of 99 (or 1) moves each thing from the tuning: 0.12 is 12% faster at 99, 12% slower at 1. */
  span: {
    speed: 0.12,
    accel: 0.2,
    turn: 0.2,
    wristPower: 0.1,
    slapPower: 0.1,
    passSpeed: 0.1,
    checkReach: 0.15,
  },
  /**
   * Accuracy: the most a shot or pass can stray from where it was aimed, in radians, for an average player.
   * A 99 strays about a third as much, a 1 about twice as much.
   */
  shotError: 0.035,
  passError: 0.03,
  errorAt99: 0.35,
  errorAt1: 2,
};

/** What the simulation applies to one skater. All 1 (and the errors at the average) for an average player. */
export interface SkaterMods {
  speed: number;
  accel: number;
  turn: number;
  wristPower: number;
  slapPower: number;
  passSpeed: number;
  checkReach: number;
  /** Largest stray angle, radians. */
  wristError: number;
  slapError: number;
  passError: number;
}

const clamp = (r: number): number => Math.min(99, Math.max(1, r));
/** -1 at a rating of 1, 0 at the average, +1 at 99. */
const lean = (r: number | undefined): number => {
  const v = clamp(r ?? MODS.average);
  return v >= MODS.average ? (v - MODS.average) / (99 - MODS.average) : (v - MODS.average) / (MODS.average - 1);
};
const scale = (r: number | undefined, span: number): number => 1 + lean(r) * span;
const stray = (r: number | undefined, base: number): number => {
  const l = lean(r);
  return base * (l >= 0 ? 1 + l * (MODS.errorAt99 - 1) : 1 - l * (MODS.errorAt1 - 1));
};

export function modsFromRatings(r: IceRatings): SkaterMods {
  return {
    speed: scale(r.skatingSpeed, MODS.span.speed),
    accel: scale(r.acceleration, MODS.span.accel),
    turn: scale(r.agility, MODS.span.turn),
    wristPower: scale(r.wristShotPower, MODS.span.wristPower),
    slapPower: scale(r.slapShotPower, MODS.span.slapPower),
    passSpeed: scale(r.passing, MODS.span.passSpeed),
    checkReach: scale(r.checking, MODS.span.checkReach),
    wristError: stray(r.wristShotAccuracy, MODS.shotError),
    slapError: stray(r.slapShotAccuracy, MODS.shotError),
    passError: stray(r.passing, MODS.passError),
  };
}

/** A skater the tuning describes exactly: no change, no stray. Used where a skater has no ratings. */
export const NO_MODS: Readonly<SkaterMods> = Object.freeze({ speed: 1, accel: 1, turn: 1, wristPower: 1, slapPower: 1, passSpeed: 1, checkReach: 1, wristError: 0, slapError: 0, passError: 0 });
