/**
 * Computer-controlled skaters for the 5-on-5 test game. Pure rules: each skater is given the same
 * eight-way stick and two buttons the player has, so the computer plays by the player's physics.
 *
 * This is a first, simple team: a formation that follows the puck, one skater who goes to the puck,
 * a carrier who skates in, passes under pressure and shoots when he is in range. There are no
 * offsides, icing, penalties, line changes or body checks yet. Every number is a starting value.
 */
import type { Rng } from '../../core/rng';
import type { Goalie } from './goalie';
import { quantize8 } from './input';
import type { SimInput } from './input';
import { goalLineY } from './rink';
import type { RinkEnd, RinkGeometry } from './rink';

export type Role = 'C' | 'LW' | 'RW' | 'LD' | 'RD';

export const AI = {
  /** A skater this close to where he wants to be stops pushing and glides. */
  arrive: 8,
  /** The carrier may shoot from inside this distance of the goal line, and not from closer than `tooClose`. */
  shootRange: 115,
  tooClose: 22,
  /** Chance per tick of taking the shot once in range (about a quarter of a second on average). */
  shootChance: 0.07,
  /** From farther out than this he winds up a slap shot. */
  slapFrom: 70,
  /** Ticks the shoot button is held: a wrist shot, and the shortest and longest slap shot wind-ups. */
  wristTicks: 3,
  slapTicks: [20, 34] as const,
  /** An opponent this close ahead of the carrier is pressure; a teammate with no opponent this close is open. */
  pressure: 30,
  open: 24,
  /** Chance per tick of passing when pressured and a teammate is open. */
  passChance: 0.12,
  /** Ticks a carrier waits after a decision before making another. */
  wait: 24,
  /** Seconds the computer's skaters take to react to a puck drop, least and most: drawn afresh for each team at each drop. */
  drawDelay: [0.12, 0.4] as const,
  /** A skater pushing at under this speed for `stuckTicks` steps sideways for `dodgeTicks`. A carrier stuck that long gets rid of the puck. */
  stuckSpeed: 14,
  stuckTicks: 30,
  dodgeTicks: 22,
  /** A teammate goes to a loose puck only if he is this much nearer than the player's own skater. */
  helpMargin: 40,
};

export interface AiSkater {
  x: number;
  y: number;
  vx: number;
  vy: number;
  index: number;
  team: 0 | 1;
  role: Role;
  hasPuck: boolean;
  aiHold: number;
  aiSide: -1 | 1;
  aiWait: number;
  aiStill: number;
  aiDodge: number;
}

export interface TeamView {
  rink: RinkGeometry;
  skaters: AiSkater[];
  puck: { x: number; y: number; vx: number; vy: number; state: string };
  goalies: Goalie[];
  controlled: number;
  passTarget: number;
  aiRng: Rng;
  tuning: { maxSpeed: number };
  tick: number;
  dropTick: number;
  drawDelay: [number, number];
  /** Every skater is the computer's: nobody is treated as the player's. For tests and measurements. */
  demo: boolean;
}

/** +1 if the team attacks down the screen, -1 if up. Team 0 attacks the top net. */
export function attackDir(team: 0 | 1): 1 | -1 {
  return team === 0 ? -1 : 1;
}

export function attackEnd(team: 0 | 1): RinkEnd {
  return team === 0 ? 'top' : 'bottom';
}

const FACEOFF: Record<Role, { x: number; back: number }> = {
  C: { x: 0, back: 24 },
  LW: { x: -80, back: 22 },
  RW: { x: 80, back: 22 },
  LD: { x: -45, back: 85 },
  RD: { x: 45, back: 85 },
};

/** Where a skater lines up for the puck drop at centre: each team on its own side of the red line. */
export function faceoffSpot(rink: RinkGeometry, team: 0 | 1, role: Role): { x: number; y: number } {
  const spot = FACEOFF[role];
  return { x: rink.centerX + spot.x, y: rink.centerY - attackDir(team) * spot.back };
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Where a skater without the puck wants to be. Positions are worked out as "how far up the ice toward
 * the net we attack" so both teams share one set of numbers.
 */
export function formationSpot(rink: RinkGeometry, s: AiSkater, puck: { x: number; y: number }, possession: 0 | 1 | -1): { x: number; y: number } {
  const dir = attackDir(s.team);
  const half = goalLineY(rink, 'bottom') - rink.centerY;
  const up = (puck.y - rink.centerY) * dir;
  const side = puck.x - rink.centerX;
  const left = s.role === 'LW' || s.role === 'LD' ? -1 : 1;
  let x = 0;
  let u = 0;
  if (possession === s.team) {
    // Attacking: wingers wide and ahead, centre in the slot away from the puck, defence at the points.
    if (s.role === 'C') [x, u] = [-side * 0.35, up + 40];
    else if (s.role === 'LW' || s.role === 'RW') [x, u] = [left * 85, up + 28];
    else [x, u] = [left * 50, Math.min(up - 70, half - 150)];
    if (s.role !== 'LD' && s.role !== 'RD') u = Math.min(u, half - 26);
  } else if (possession === -1) {
    if (s.role === 'C') [x, u] = [side * 0.5, up];
    else if (s.role === 'LW' || s.role === 'RW') [x, u] = [left * 80, up + 5];
    else [x, u] = [left * 45, up - 70];
  } else {
    // Defending: centre between the puck and our net, wingers on the points, defence in front of the net.
    if (s.role === 'C') [x, u] = [side * 0.5, up - 30];
    else if (s.role === 'LW' || s.role === 'RW') [x, u] = [left * 70, up - 5];
    else [x, u] = [left * 28 + side * 0.3, up - 75];
  }
  u = clamp(u, -half + 22, half - 20);
  return { x: clamp(rink.centerX + x, rink.left + 16, rink.right - 16), y: rink.centerY + dir * u };
}

function toward(s: AiSkater, x: number, y: number, arrive: number): { moveX: number; moveY: number } {
  const dx = x - s.x;
  const dy = y - s.y;
  if (Math.hypot(dx, dy) <= arrive) return { moveX: 0, moveY: 0 };
  const q = quantize8(dx, dy, 0);
  return { moveX: q.x, moveY: q.y };
}

/** One step of buttons for every skater: the player's own for the skater he controls, the computer's for the rest. */
export function teamInputs(v: TeamView, human: SimInput): SimInput[] {
  const { puck, rink } = v;
  const mine = v.demo ? -1 : v.controlled;
  const carrier = v.skaters.find((s) => s.hasPuck) ?? null;
  const possession: 0 | 1 | -1 = carrier ? carrier.team : -1;
  const dist = (s: AiSkater): number => Math.hypot(s.x - puck.x, s.y - puck.y);

  // One skater a team goes to the puck: its nearest. The player's own skater counts as his team's first choice.
  const chaser: [number, number] = [-1, -1];
  for (const team of [0, 1] as const) {
    if (possession === team) continue;
    let best: AiSkater | null = null;
    for (const s of v.skaters) {
      if (s.team !== team || s.index === mine) continue;
      if (!best || dist(s) < dist(best)) best = s;
    }
    if (!best) continue;
    if (team === 0) {
      const me = v.skaters[mine];
      const defending = possession === 1 && (puck.y - rink.centerY) * attackDir(0) < 0;
      if (me && !defending && dist(best) + AI.helpMargin > dist(me)) continue;
    }
    chaser[team] = best.index;
  }

  return v.skaters.map((s) => {
    if (s.index === mine) return human;
    // Nobody jumps the puck drop: each team's computer skaters react a moment after it.
    if (v.tick - v.dropTick < v.drawDelay[s.team]) return { moveX: 0, moveY: 0, shoot: false };
    return unstick(v, s, decide(s));
  });

  function decide(s: AiSkater): SimInput {
    if (!s.hasPuck) s.aiHold = 0;
    if (s.aiWait > 0) s.aiWait--;
    if (s.hasPuck) return carry(v, s);
    if (puck.state === 'free' && (s.index === v.passTarget || s.index === chaser[s.team])) {
      // Go to where the puck will be, not where it is.
      const t = Math.min(0.6, dist(s) / v.tuning.maxSpeed);
      return { ...toward(s, puck.x + puck.vx * t, puck.y + puck.vy * t, 0), shoot: false };
    }
    if (carrier && s.index === chaser[s.team]) return { ...toward(s, puck.x + carrier.vx * 0.2, puck.y + carrier.vy * 0.2, 0), shoot: false };
    const spot = formationSpot(rink, s, puck, possession);
    return { ...toward(s, spot.x, spot.y, AI.arrive), shoot: false };
  }
}

/** A skater who is pushing and going nowhere (a body or the net in the way) steps around it; a stuck carrier moves the puck. */
function unstick(v: TeamView, s: AiSkater, input: SimInput): SimInput {
  const pushing = input.moveX !== 0 || input.moveY !== 0;
  s.aiStill = pushing && Math.hypot(s.vx, s.vy) < AI.stuckSpeed ? s.aiStill + 1 : 0;
  if (s.aiDodge === 0 && s.aiStill >= AI.stuckTicks) {
    s.aiStill = 0;
    s.aiDodge = AI.dodgeTicks * (v.aiRng.next() < 0.5 ? -1 : 1);
    if (s.hasPuck && s.aiHold === 0) {
      const line = goalLineY(v.rink, attackEnd(s.team));
      const out = (line - s.y) * attackDir(s.team);
      // Near the net: jam it on goal. Otherwise: move it to a teammate.
      if (out > 4 && out < AI.shootRange) {
        s.aiHold = AI.wristTicks;
        s.aiSide = s.x > v.rink.centerX ? -1 : 1;
        return { ...input, shoot: true };
      }
      return { ...input, pass: true };
    }
  }
  if (s.aiDodge !== 0 && pushing && s.aiHold === 0) {
    const side = Math.sign(s.aiDodge);
    s.aiDodge -= side;
    // A quarter turn off the way he wants to go.
    const q = quantize8(input.moveX - side * input.moveY, input.moveY + side * input.moveX, 0);
    return { ...input, moveX: q.x, moveY: q.y };
  }
  if (!pushing) s.aiDodge = 0;
  return input;
}

/** The computer's puck carrier: skate in, pass if pressured, shoot when in range. */
function carry(v: TeamView, s: AiSkater): SimInput {
  const { rink } = v;
  const dir = attackDir(s.team);
  const line = goalLineY(rink, attackEnd(s.team));
  const out = (line - s.y) * dir;
  const off = s.x - rink.centerX;

  if (s.aiHold > 0) {
    // Winding up. On the last tick the button is let go with a diagonal held toward the chosen corner.
    s.aiHold--;
    if (s.aiHold === 0) {
      s.aiWait = AI.wait;
      return { moveX: s.aiSide * Math.SQRT1_2, moveY: dir * Math.SQRT1_2, shoot: false };
    }
    return { ...toward(s, rink.centerX, line - dir * 30, 0), shoot: true };
  }

  const inRange = out > AI.tooClose && out < AI.shootRange && Math.abs(off) < out * 1.1 + 18;
  if (inRange && s.aiWait === 0 && v.aiRng.next() < AI.shootChance) {
    const slap = out > AI.slapFrom;
    s.aiHold = slap ? AI.slapTicks[0] + v.aiRng.int(AI.slapTicks[1] - AI.slapTicks[0] + 1) : AI.wristTicks;
    // He picks a side without reading the goalie: a coin toss.
    s.aiSide = v.aiRng.next() < 0.5 ? -1 : 1;
    return { ...toward(s, rink.centerX, line - dir * 30, 0), shoot: true };
  }

  if (s.aiWait === 0) {
    const pressed = v.skaters.some((o) => o.team !== s.team && Math.hypot(o.x - s.x, o.y - s.y) < AI.pressure && (o.y - s.y) * dir > -6);
    if (pressed && v.aiRng.next() < AI.passChance) {
      let mate: AiSkater | null = null;
      for (const m of v.skaters) {
        if (m.team !== s.team || m === s) continue;
        if ((m.y - s.y) * dir < -10) continue;
        if (v.skaters.some((o) => o.team !== s.team && Math.hypot(o.x - m.x, o.y - m.y) < AI.open)) continue;
        if (!mate || (m.y - mate.y) * dir > 0) mate = m;
      }
      if (mate) {
        s.aiWait = AI.wait;
        return { ...toward(s, mate.x, mate.y, 0), shoot: false, pass: true };
      }
    }
  }

  // Skate in: up his own lane until the top of the circles, then to the slot on his side.
  const tx = out > 130 ? rink.centerX + clamp(off, -75, 75) : rink.centerX + Math.sign(off || 1) * 18;
  const ty = out > 130 ? line - dir * 120 : line - dir * 50;
  return { ...toward(s, tx, ty, 4), shoot: false };
}
