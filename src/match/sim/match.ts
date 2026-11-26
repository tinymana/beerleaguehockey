/**
 * A full game around the 5-on-5 play: clock and periods, whistles and faceoffs, icing and offside,
 * the contact button, penalties, and a shootout for ties (creative director rulings of Nov 26, Decision 86).
 *
 * This file is the data and the small pure rules. The state lives in the simulation (`skatingSim.ts`).
 * Every number is a starting value for hands-on testing, not approved balance.
 */
import { PLAY_SCALE, goalLineY } from './rink';
import type { RinkGeometry } from './rink';
import type { Role } from './teamAi';
import { attackDir } from './teamAi';

export const MATCH = {
  periods: 3,
  /** Seconds in a period, on a running clock. */
  periodSeconds: 180,
  /** A minor penalty lasts this share of a period. */
  penaltyShare: 0.1,
  /** At most this many skaters of one team in the box at once; further fouls by that team go uncalled. */
  maxBoxed: 2,
  /** Seconds between a whistle and the teams lining up, and the least and most the referee waits before dropping the puck. */
  whistlePause: 1,
  dropWait: [0.9, 1.7] as const,
  /** Seconds after the drop in which a button press wins the draw; pressing before the drop locks a centre out this long. */
  /** A beat between the foul and the whistle: the referee's arm goes up, play carries on, then he blows it down. */
  callBeat: 0.7,
  /** The longest the faceoff waits for a penalized skater to reach the box. */
  boxWalk: 5,
  /** The penalty boxes are this far down the ice from centre (where the arena art has them): home's on the left boards, away's on the right. */
  boxFromCentre: 124,
  /** The longest the drop waits for the referee to reach the dot. */
  refereeWait: 4,
  drawWindow: 0.45,
  earlyLock: 0.4,
  /** How long the computer's centre takes to press, least and most. */
  aiDraw: [0.1, 0.34] as const,
  /** Speed of a won draw. */
  drawSpeed: 150,
  /** Shootout: attempts each before sudden death, and the seconds a shooter has. */
  shootoutRounds: 3,
  attemptSeconds: 9,
  attemptPause: 1.2,
};

/** The contact button (Decision 85): tap to stick check, hold to bump, hold too long and it is a check. */
export const CONTACT = {
  /** A stick check reaches a puck or a body this far from the checker's blade or body. */
  reach: 13 * PLAY_SCALE,
  bodyReach: 9 * PLAY_SCALE,
  /** Seconds a checker who hit nothing is flat-footed, and before he can stick check again. */
  missLock: 0.35,
  cooldown: 0.5,
  /** Seconds the button is held before it is a bump, and before it becomes a check. */
  bumpAfter: 0.15,
  checkAfter: 0.5,
  /** A bump or check needs the bodies this close (centre to centre). */
  touch: 17 * PLAY_SCALE,
  /** Share of his speed a bumped skater keeps each second. */
  bumpDrag: 0.05,
  /** Seconds a checked skater is down, and the speed he and the puck are sent off at. */
  downTime: 1.3,
  hitSpeed: 90,
  /** Within this distance of the boards a check is boarding. */
  boards: 18,
  /** A foul from behind is this much likelier to be called. */
  fromBehind: 1.4,
};

export type Foul = 'hooking' | 'tripping' | 'slashing' | 'roughing' | 'boarding';

/**
 * A referee is how likely each foul is to be called when he is working. Rec referees miss a lot, and each
 * has his own blind spots (creative director, Nov 26: learning what a referee lets go is part of the game).
 * These three are placeholder profiles with descriptive labels, not characters.
 */
export interface Referee {
  id: string;
  label: string;
  calls: Record<Foul, number>;
}

export const REFEREES: readonly Referee[] = [
  { id: 'book', label: 'By the book', calls: { hooking: 0.7, tripping: 0.75, slashing: 0.6, roughing: 0.9, boarding: 0.95 } },
  { id: 'play', label: 'Lets them play', calls: { hooking: 0.25, tripping: 0.35, slashing: 0.2, roughing: 0.6, boarding: 0.8 } },
  { id: 'sticks', label: 'Hates stick work', calls: { hooking: 0.85, tripping: 0.8, slashing: 0.85, roughing: 0.45, boarding: 0.65 } },
];

export type Phase = 'play' | 'whistle' | 'faceoff' | 'draw' | 'intermission' | 'shootout' | 'final';
export type StopReason = 'start' | 'goal' | 'freeze' | 'icing' | 'offside' | 'penalty' | 'period';

export interface Penalty {
  skater: number;
  team: 0 | 1;
  foul: Foul;
  /** Seconds of game clock left. */
  left: number;
}

export interface TeamStats {
  goals: number;
  shots: number;
  saves: number;
  faceoffs: number;
  takeaways: number;
  /** Penalty minutes, as the scoresheet would show them (2 a minor). */
  pim: number;
  powerPlayGoals: number;
}

export interface GoalRecord {
  team: 0 | 1;
  scorer: number;
  assists: number[];
  period: number;
  /** Seconds left in the period. */
  time: number;
  powerPlay: boolean;
}

export interface Shootout {
  /** Attempts taken and scored by each team, in order: true is a goal. */
  results: [boolean[], boolean[]];
  /** Whose attempt this is, and which of his team's skaters. */
  team: 0 | 1;
  shooter: number;
  /** Seconds left in the attempt; negative while pausing after it. */
  timer: number;
  live: boolean;
  winner: 0 | 1 | null;
}

export interface MatchState {
  phase: Phase;
  period: number;
  /** Seconds left in the period. */
  clock: number;
  reason: StopReason;
  /** Where the next faceoff is. */
  dot: { x: number; y: number };
  /** Seconds left in the current pause (whistle, or the wait before the drop). */
  timer: number;
  /** Draw: seconds since the drop, the skater taking it for each team, when the computer's centres press, and lock-outs. */
  sinceDrop: number;
  taker: [number, number];
  aiPress: [number, number];
  locked: [number, number];
  penalties: Penalty[];
  /** A foul the referee has his arm up for, not yet whistled: seconds left of the beat. */
  pending: { skater: number; team: 0 | 1; foul: Foul; timer: number } | null;
  stats: [TeamStats, TeamStats];
  goals: GoalRecord[];
  referee: Referee;
  shootout: Shootout | null;
  /** Who won, once it is over: by the score, or by the shootout. */
  winner: 0 | 1 | null;
}

export const emptyStats = (): TeamStats => ({ goals: 0, shots: 0, saves: 0, faceoffs: 0, takeaways: 0, pim: 0, powerPlayGoals: 0 });

/** The nine faceoff dots: centre, four in the end zones, four in the neutral zone. Same numbers as the rink markings. */
export function faceoffDots(rink: RinkGeometry): { centre: { x: number; y: number }; endZone: { x: number; y: number }[]; neutral: { x: number; y: number }[] } {
  const xs = [rink.centerX - 88, rink.centerX + 88];
  const endYs = [goalLineY(rink, 'top') + 80, goalLineY(rink, 'bottom') - 80];
  const neutralYs = [rink.centerY - rink.blueLineOffset + 20, rink.centerY + rink.blueLineOffset - 20];
  return {
    centre: { x: rink.centerX, y: rink.centerY },
    endZone: endYs.flatMap((y) => xs.map((x) => ({ x, y }))),
    neutral: neutralYs.flatMap((y) => xs.map((x) => ({ x, y }))),
  };
}

/** The end-zone dot at one end of the rink on the side of `x`. */
export function endZoneDot(rink: RinkGeometry, end: 'top' | 'bottom', x: number): { x: number; y: number } {
  const dots = faceoffDots(rink).endZone.filter((d) => (end === 'top' ? d.y < rink.centerY : d.y > rink.centerY));
  return (x < rink.centerX ? dots[0] : dots[1]) as { x: number; y: number };
}

/** The neutral-zone dot just outside one end's blue line on the side of `x`. */
export function neutralDot(rink: RinkGeometry, end: 'top' | 'bottom', x: number): { x: number; y: number } {
  const dots = faceoffDots(rink).neutral.filter((d) => (end === 'top' ? d.y < rink.centerY : d.y > rink.centerY));
  return (x < rink.centerX ? dots[0] : dots[1]) as { x: number; y: number };
}

const LINEUP: Record<Role, { x: number; back: number }> = {
  C: { x: 0, back: 11 },
  LW: { x: -34, back: 15 },
  RW: { x: 34, back: 15 },
  LD: { x: -22, back: 50 },
  RD: { x: 22, back: 50 },
};

/** Where a skater stands for a faceoff at a dot: every skater on his own team's side of it. */
export function lineupSpot(rink: RinkGeometry, team: 0 | 1, role: Role, dot: { x: number; y: number }): { x: number; y: number } {
  const spot = LINEUP[role];
  const x = Math.max(rink.left + 14, Math.min(rink.right - 14, dot.x + spot.x));
  const y = Math.max(rink.top + 16, Math.min(rink.bottom - 16, dot.y - attackDir(team) * spot.back));
  return { x, y };
}

/** The door of a team's penalty box, on the ice side of the boards. */
export function boxDoor(rink: RinkGeometry, team: 0 | 1): { x: number; y: number } {
  return { x: team === 0 ? rink.left + 10 : rink.right - 10, y: rink.centerY + MATCH.boxFromCentre };
}

/** Seconds a minor lasts. */
export function penaltySeconds(): number {
  return MATCH.periodSeconds * MATCH.penaltyShare;
}

/** The clock as the scorebug shows it. */
export function clockText(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function periodText(period: number): string {
  return period === 1 ? '1st' : period === 2 ? '2nd' : period === 3 ? '3rd' : 'SO';
}
