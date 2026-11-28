/**
 * On-ice simulation: skaters, one puck, one rink. One skater on his own for the skating and shooting
 * prototypes, or two teams of five for the 5-on-5 test game (`setTeams`).
 *
 * Pure TypeScript with a fixed timestep. No Phaser, no DOM, no clock, no
 * randomness: the same inputs always produce the same state. The Phaser
 * scene only reads this state and draws it.
 */
import { rotateToward } from '../../core/math';
import type { SimInput } from './input';
import { RINK, collideWithBoards, collideWithBox, goalLineY, netBox } from './rink';
import type { Body, RinkEnd, RinkGeometry } from './rink';
import { Rng } from '../../core/rng';
import type { Goalie, SaveKind } from './goalie';
import { GOALIE, makeGoalie, reboundVelocity, resolveShot, stepGoalie } from './goalie';
import { AIM, FEEL, ONE_TIMER, SHOOT, TEAM } from './tuning';
import { AI, faceoffSpot, teamInputs } from './teamAi';
import type { Role } from './teamAi';
import { attackDir, attackEnd } from './teamAi';
import { CONTACT, MATCH, REFEREES, boxDoor, emptyStats, endZoneDot, faceoffDots, lineupSpot, neutralDot, penaltySeconds } from './match';
import { quantize8, stickAim } from './input';
import type { Foul, MatchState, StopReason } from './match';
import { NO_INPUT } from './input';
import { dropSpot, makeReferee, signalReferee, stepReferee } from './referee';
import type { RefereeState } from './referee';
import { NO_MODS } from './skaterMods';
import type { SkaterMods } from './skaterMods';
import type { Tuning } from './tuning';

export const SIM_DT = 1 / 60;

export interface Skater extends Body {
  /** Radians; 0 points right, PI/2 points down the screen. */
  facing: number;
  hasPuck: boolean;
  /** Seconds the shoot button has been held with the puck. */
  charge: number;
  pickupCooldown: number;
  /** Distance skated, drives the stride animation. */
  stride: number;
  /** Place in `skaters`. */
  index: number;
  /** 0 attacks the top net, 1 the bottom net. */
  team: 0 | 1;
  role: Role;
  /** Was a direction held on the last step? (For the stride animation.) */
  pushing: boolean;
  /** Button states on the last step, to tell a press from a hold. */
  shootHeld: boolean;
  passHeld: boolean;
  /** Seconds before he can poke the puck off a carrier again. */
  pokeCooldown: number;
  /** Tick he last gained the puck and last shot, -1000 before any. */
  possessTick: number;
  shotTick: number;
  /** Computer-controlled skaters only: ticks left winding up a shot, and the side of the net picked. */
  aiHold: number;
  aiSide: -1 | 0 | 1;
  aiWait: number;
  /** Ticks he has been pushing without getting anywhere, and ticks left of stepping around whatever is in the way. */
  aiStill: number;
  aiDodge: number;
  /** Ticks the computer keeps the contact button down. */
  aiCheck: number;
  /** Off the ice: in the penalty box, or waiting his turn in a shootout. */
  out: boolean;
  /** Seconds left knocked down, and seconds left flat-footed after a missed stick check. */
  down: number;
  lock: number;
  /** The contact button: held last step, seconds held, whether this hold has already become a check, and seconds before the next stick check. */
  checkHeld: boolean;
  checkTime: number;
  checked: boolean;
  checkCooldown: number;
  /** Seconds the shoot button has been held without the puck (winding up for a one-timer), and the direction held. */
  windup: number;
  aimX: number;
  aimY: number;
  /** Penalized and skating to the box. */
  toBox: boolean;
  /** What his ratings do to his skating, shooting, passing and stick (skaterMods.ts). `NO_MODS` plays as the tuning says. */
  mods: SkaterMods;
}

export interface Puck extends Body {
  state: 'free' | 'carried' | 'inNet' | 'held';
  /** Height off the ice and its rate of change. */
  z: number;
  vz: number;
}

export type ShotKind = 'wrist' | 'slap';

export interface ShootingStats {
  shots: number;
  goals: number;
  saves: number;
  posts: number;
  crossbars: number;
  over: number;
  fiveHole: number;
  /** The last thing a shot did, for the test readout. */
  last: string;
}

export type SimEvent =
  | { type: 'shot'; power: number; kind: ShotKind; team: 0 | 1; oneTimer?: boolean }
  | { type: 'save'; kind: SaveKind; end: RinkEnd }
  | { type: 'post'; end: RinkEnd }
  | { type: 'crossbar'; end: RinkEnd }
  | { type: 'over'; end: RinkEnd }
  | { type: 'boards'; speed: number }
  | { type: 'pickup'; team: 0 | 1 }
  | { type: 'pass'; team: 0 | 1 }
  | { type: 'poke'; team: 0 | 1 }
  | { type: 'whistle'; reason: StopReason }
  | { type: 'drop' }
  | { type: 'draw'; team: 0 | 1 | -1 }
  | { type: 'hit'; team: 0 | 1; target: number }
  | { type: 'call'; team: 0 | 1; skater: number; foul: Foul }
  | { type: 'penalty'; team: 0 | 1; skater: number; foul: Foul; seconds: number }
  | { type: 'penaltyOver'; team: 0 | 1; skater: number }
  | { type: 'period'; period: number }
  | { type: 'attempt'; team: 0 | 1; goal: boolean }
  | { type: 'final'; winner: 0 | 1 }
  | { type: 'goal'; end: RinkEnd; fiveHole: boolean };

export class SkatingSim {
  readonly rink: RinkGeometry;
  /** Shared, live-editable tuning object. */
  tuning: Tuning;
  skaters: Skater[] = [];
  /** Which of `skaters` the player controls. */
  controlled = 0;
  /** Two teams of five (the 5-on-5 test) instead of one skater. */
  teams = false;
  /** Goals for team 0 (attacking the top net) and team 1. */
  score: [number, number] = [0, 0];
  /** The skater a pass was sent to, or -1. */
  passTarget = -1;
  private passTimer = 0;
  /** The tick the puck was last dropped, and how many ticks each team's computer skaters take to react to it. */
  dropTick = 0;
  drawDelay: [number, number] = [0, 0];
  /** Shots with a diagonal held toward a net are aimed at that corner. Off for tests of the raw puck physics. */
  aimAssist = true;
  /** Whether the player's input on this step asked for the aim help (a keyboard does, a stick does not). */
  private aimHelpNow = true;
  /** The computer plays every skater, the player's included. For tests and measurements. */
  demo = false;
  aiRng = new Rng(7).fork('team-ai');
  private aimRng = new Rng(3).fork('aim');
  /** Stray on shots and passes from the skaters' accuracy ratings. Its own stream: a skater with no ratings never draws from it. */
  private modRng = new Rng(5).fork('ratings');
  puck!: Puck;
  tick = 0;
  goals = 0;
  private goalTimer = 0;
  /** The player's own button states: they stay with the player when control moves to another skater. */
  private shootHeld = false;
  private passHeld = false;
  private checkHeld = false;
  /** A full game around the 5-on-5 play (clock, whistles, penalties), or null for free play. */
  match: MatchState | null = null;
  /** The referee on the ice, in a full game. */
  referee: RefereeState | null = null;
  private matchOn = false;
  private matchSeed = 11;
  /** Rule switches (Options, later). */
  rules = { icing: true, offside: true, penalties: true };
  private matchRng = new Rng(11).fork('match');
  /** The team that last had the puck, where a shot or pass was last let go, and the teammates who have handled it in a row. */
  private lastTouch: 0 | 1 | -1 = -1;
  private release: { team: 0 | 1; x: number; y: number } | null = null;
  private chain: number[] = [];
  /** Goalies are off unless switched on: the skating prototype and its tests run without them. */
  goalies: Goalie[] = [];
  stats: ShootingStats = { shots: 0, goals: 0, saves: 0, posts: 0, crossbars: 0, over: 0, fiveHole: 0, last: '' };
  private rng = new Rng(1).fork('rebounds');
  /** Where the puck has been, so a goalie reacts to the past and not the present. */
  private seen: { x: number; y: number }[] = [];
  private beatGoalie = false;
  private overNet = false;
  private throughFiveHole = false;
  /** The tick a shot, pass or rebound set the puck going, for how long a goalie has had to react. -1 when it is not moving fast. */
  private launchTick = -1;

  constructor(tuning: Tuning, rink: RinkGeometry = RINK) {
    this.tuning = tuning;
    this.rink = rink;
    this.reset();
  }

  /** Give a skater ratings to play by (see skaterMods.ts), or take them away. They hold until the teams are set again. */
  setSkaterMods(index: number, mods: SkaterMods | null): void {
    const s = this.skaters[index];
    if (s) s.mods = mods ?? NO_MODS;
  }

  /** The skater the player controls. */
  get skater(): Skater {
    return this.skaters[this.controlled] as Skater;
  }

  private makeSkater(index: number, team: 0 | 1, role: Role, x: number, y: number): Skater {
    return {
      x, y, vx: 0, vy: 0,
      facing: team === 0 ? -Math.PI / 2 : Math.PI / 2,
      hasPuck: false, charge: 0, pickupCooldown: 0, stride: 0,
      index, team, role, pushing: false, shootHeld: false, passHeld: false, pokeCooldown: 0,
      possessTick: -1000, shotTick: -1000, aiHold: 0, aiSide: 1, aiWait: 0, aiStill: 0, aiDodge: 0, aiCheck: 0,
      out: false, down: 0, lock: 0, checkHeld: false, checkTime: 0, checked: false, checkCooldown: 0, windup: 0, aimX: 0, aimY: 0, toBox: false, mods: NO_MODS,
    };
  }

  /** Everyone to his faceoff spot (or the lone skater below centre). */
  private lineUp(): void {
    const { centerX, centerY } = this.rink;
    this.skaters = [];
    if (!this.teams) {
      this.skaters.push(this.makeSkater(0, 0, 'C', centerX, centerY + 40));
    } else {
      const roles: Role[] = ['C', 'LW', 'RW', 'LD', 'RD'];
      for (const team of [0, 1] as const) {
        for (const role of roles) {
          const spot = faceoffSpot(this.rink, team, role);
          this.skaters.push(this.makeSkater(this.skaters.length, team, role, spot.x, spot.y));
        }
      }
    }
    this.controlled = 0;
    this.passTarget = -1;
    this.dropTick = this.tick;
    this.drawDelay = [0, 0];
    if (this.teams) this.drawDelay = [0, 1].map(() => Math.round(this.aiRng.range(AI.drawDelay[0], AI.drawDelay[1]) / SIM_DT)) as [number, number];
  }

  /** The computer's skaters use the contact button (a full game) instead of knocking the puck loose on touch. */
  get contact(): boolean {
    return this.match !== null && this.match.phase === 'play';
  }

  /** Where the blue line of the zone the puck is not in stops attackers, or null when offside is off. */
  get offside(): boolean {
    return this.match !== null && this.rules.offside && this.match.phase !== 'shootout';
  }

  /** Two teams of five, or back to one skater. `match` adds the clock, whistles, penalties and the rest of a full game. Restarts play. */
  setTeams(on: boolean, match = false, seed = 11): void {
    this.matchOn = on && match;
    this.matchSeed = seed;
    this.teams = on;
    if (on && !this.goalies.length) this.setGoalies(true);
    this.reset();
  }

  reset(): void {
    const { centerX, centerY } = this.rink;
    this.lineUp();
    this.score = [0, 0];
    this.aiRng = new Rng(7).fork('team-ai');
    this.aimRng = new Rng(3).fork('aim');
    this.modRng = new Rng(5).fork('ratings');
    this.puck = { x: centerX, y: centerY, vx: 0, vy: 0, state: 'free', z: 0, vz: 0 };
    this.stats = { shots: 0, goals: 0, saves: 0, posts: 0, crossbars: 0, over: 0, fiveHole: 0, last: '' };
    this.rng = new Rng(1).fork('rebounds');
    this.seen = [];
    if (this.goalies.length) this.goalies = [makeGoalie(this.rink, 'top'), makeGoalie(this.rink, 'bottom')];
    this.tick = 0;
    this.dropTick = 0;
    this.goals = 0;
    this.goalTimer = 0;
    this.shootHeld = false;
    this.passHeld = false;
    this.checkHeld = false;
    this.lastTouch = -1;
    this.release = null;
    this.chain = [];
    this.matchRng = new Rng(this.matchSeed).fork('match');
    this.match = null;
    this.referee = this.matchOn ? makeReferee(this.rink) : null;
    if (this.matchOn) {
      const dots = faceoffDots(this.rink);
      this.match = {
        phase: 'whistle', period: 1, clock: MATCH.periodSeconds, reason: 'start', dot: dots.centre, timer: 0,
        sinceDrop: 0, taker: [0, 5], aiPress: [0, 0], locked: [0, 0], penalties: [], pending: null,
        stats: [emptyStats(), emptyStats()], goals: [], referee: this.matchRng.pick(REFEREES), shootout: null, winner: null,
      };
    }
  }

  /** Put the puck back at centre ice. With teams, everyone lines up for it again. */
  resetPuck(): void {
    if (this.match) {
      // In a game the puck goes back to centre by a faceoff, with everyone who is on the ice.
      if (this.match.phase === 'play') this.blow('start', faceoffDots(this.rink).centre, []);
      return;
    }
    if (this.teams) this.lineUp();
    for (const s of this.skaters) {
      s.hasPuck = false;
      s.charge = 0;
    }
    this.puck.x = this.rink.centerX;
    this.puck.y = this.rink.centerY;
    this.puck.vx = 0;
    this.puck.vy = 0;
    this.puck.state = 'free';
    this.puck.z = 0;
    this.puck.vz = 0;
    this.goalTimer = 0;
    for (const g of this.goalies) g.holding = 0;
  }

  /** Put a basic goalie in each net, or take them out. */
  setGoalies(on: boolean): void {
    this.goalies = on ? [makeGoalie(this.rink, 'top'), makeGoalie(this.rink, 'bottom')] : [];
  }

  /** Shot power 0..1 for the current wind-up. */
  chargeLevel(): number {
    return Math.min(this.skater.charge / FEEL.maxChargeTime, 1);
  }

  bladeX(s: Skater = this.skater): number {
    return s.x + Math.cos(s.facing) * FEEL.stickReach;
  }

  bladeY(s: Skater = this.skater): number {
    return s.y + Math.sin(s.facing) * FEEL.stickReach;
  }

  /** Who has the puck, if anyone. */
  carrier(): Skater | null {
    return this.skaters.find((s) => s.hasPuck) ?? null;
  }

  /** Advance one fixed step. Returns what happened, for sound and effects. */
  step(input: SimInput): SimEvent[] {
    const events: SimEvent[] = [];
    const dt = SIM_DT;
    this.tick++;
    this.aimHelpNow = input.aimHelp !== false;

    const m = this.match;
    if (m && this.referee) {
      const stopped = m.phase === 'whistle' || m.phase === 'faceoff' || m.phase === 'draw';
      stepReferee(this.referee, this.rink, this.puck, stopped ? m.dot : null, dt);
    }
    if (m && m.phase !== 'play') {
      this.stepStopped(m, input, events);
      this.shootHeld = input.shoot;
      this.passHeld = !!input.pass;
      this.checkHeld = !!input.check;
      return events;
    }
    const puckWasY = this.puck.y;
    // Pass button without the puck: take control of the teammate nearest the puck.
    if (this.teams && input.pass && !this.passHeld && !this.skater.hasPuck) this.switchControl();
    // The player's button history follows him to whichever skater he controls.
    if (!this.demo) {
      this.skater.shootHeld = this.shootHeld;
      this.skater.passHeld = this.passHeld;
      this.skater.checkHeld = this.checkHeld;
    }
    const inputs = this.teams ? teamInputs(this, input) : [input];
    this.skaters.forEach((s, i) => this.stepSkater(s, inputs[i] ?? input, dt));
    if (this.teams) this.separate();
    // A shot or pass can hand control to another skater: everyone acts on the buttons he was given this step.
    const before = this.skaters.slice();
    if (m) before.forEach((s, i) => this.stepContact(s, inputs[i] ?? input, dt, events));
    before.forEach((s, i) => this.stepShooting(s, inputs[i] ?? input, dt, events));
    this.stepGoalies(dt);
    this.stepPuck(dt, events);
    if (this.passTarget >= 0 && (this.passTimer -= dt) <= 0) this.passTarget = -1;

    before.forEach((s, i) => {
      s.shootHeld = (inputs[i] ?? input).shoot;
      s.passHeld = !!(inputs[i] ?? input).pass;
      s.checkHeld = !!(inputs[i] ?? input).check;
    });
    this.shootHeld = input.shoot;
    this.passHeld = !!input.pass;
    this.checkHeld = !!input.check;
    if (m) this.stepRules(m, puckWasY, dt, events);
    return events;
  }

  /** Compact state string, for determinism tests. */
  snapshot(): string {
    const s = this.skater;
    const p = this.puck;
    const others = this.teams ? this.skaters.flatMap((o) => [o.x, o.y, o.hasPuck]) : [];
    return [this.tick, s.x, s.y, s.vx, s.vy, s.facing, s.hasPuck, p.x, p.y, p.vx, p.vy, p.state, this.goals, ...others]
      .map((v) => (typeof v === 'number' ? v.toFixed(6) : String(v)))
      .join('|');
  }

  /** Control goes to the player's skater nearest the puck. */
  private switchControl(): void {
    let best = this.controlled;
    let bestD = Infinity;
    for (const s of this.skaters) {
      if (s.team !== 0 || s.out || s.toBox) continue;
      const d = Math.hypot(s.x - this.puck.x, s.y - this.puck.y);
      if (d < bestD) {
        bestD = d;
        best = s.index;
      }
    }
    this.takeControl(best);
  }

  private takeControl(index: number): void {
    if (index === this.controlled) return;
    this.skater.charge = 0;
    this.controlled = index;
    this.skater.aiHold = 0;
  }

  /** Skaters do not skate through each other: overlapping bodies are pushed apart. No checking yet. */
  private separate(): void {
    const min = FEEL.skaterRadius * 2;
    for (let i = 0; i < this.skaters.length; i++) {
      for (let j = i + 1; j < this.skaters.length; j++) {
        const a = this.skaters[i] as Skater;
        const b = this.skaters[j] as Skater;
        if (a.out || b.out) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= min || d === 0) continue;
        const nx = dx / d;
        const ny = dy / d;
        const push = (min - d) / 2;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
        // Take out the speed they had toward each other.
        const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (closing > 0) {
          a.vx -= nx * closing * 0.5;
          a.vy -= ny * closing * 0.5;
          b.vx += nx * closing * 0.5;
          b.vy += ny * closing * 0.5;
        }
      }
    }
  }

  private stepSkater(s: Skater, input: SimInput, dt: number): void {
    const t = this.tuning;
    const mods = s.mods;
    if (s.out) return;
    if (s.checkCooldown > 0) s.checkCooldown = Math.max(0, s.checkCooldown - dt);
    // Knocked down or flat-footed: he cannot push, he only slides.
    const helpless = s.down > 0 || s.lock > 0;
    if (s.down > 0) s.down = Math.max(0, s.down - dt);
    if (s.lock > 0) s.lock = Math.max(0, s.lock - dt);
    if (helpless) input = NO_INPUT;
    s.pushing = input.moveX !== 0 || input.moveY !== 0;
    if (s.pokeCooldown > 0) s.pokeCooldown = Math.max(0, s.pokeCooldown - dt);
    const ix = input.moveX;
    const iy = input.moveY;

    if (ix !== 0 || iy !== 0) {
      // Split velocity into the part along the held direction and the
      // sideways slide. The edges bite: sideways slide is shed over time.
      let along = s.vx * ix + s.vy * iy;
      let slideX = s.vx - along * ix;
      let slideY = s.vy - along * iy;
      const shed = Math.exp(-t.turnResponse * mods.turn * dt);
      slideX *= shed;
      slideY *= shed;
      // Pushing against travel brakes harder than a normal stride accelerates.
      along += (along < 0 ? t.deceleration : t.acceleration * mods.accel) * dt;
      s.vx = along * ix + slideX;
      s.vy = along * iy + slideY;
      s.facing = rotateToward(s.facing, Math.atan2(iy, ix), FEEL.facingTurnRate * dt);
    } else {
      // No direction held: glide.
      const drag = Math.exp(-t.iceFriction * dt);
      s.vx *= drag;
      s.vy *= drag;
      if (Math.hypot(s.vx, s.vy) < FEEL.restSpeed) {
        s.vx = 0;
        s.vy = 0;
      }
    }

    const speed = Math.hypot(s.vx, s.vy);
    const top = t.maxSpeed * mods.speed;
    if (speed > top) {
      const k = top / speed;
      s.vx *= k;
      s.vy *= k;
    }

    const prevX = s.x;
    const prevY = s.y;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.stride += Math.hypot(s.x - prevX, s.y - prevY);

    collideWithBoards(s, FEEL.skaterRadius, FEEL.skaterBoardRestitution, this.rink);
    collideWithBox(s, prevX, prevY, FEEL.skaterRadius, FEEL.skaterBoardRestitution, netBox(this.rink, 'top'));
    collideWithBox(s, prevX, prevY, FEEL.skaterRadius, FEEL.skaterBoardRestitution, netBox(this.rink, 'bottom'));

    if (s.pickupCooldown > 0) s.pickupCooldown = Math.max(0, s.pickupCooldown - dt);
  }

  /** Send the puck to the teammate the stick (or the held direction) points at, or straight ahead if there is none. */
  /** The teammate a pass would go to: the one the held direction (or the stick) points at best. Null if nobody is in line. */
  passMate(s: Skater, input: SimInput): Skater | null {
    let dirX = Math.cos(s.facing);
    let dirY = Math.sin(s.facing);
    if (input.moveX !== 0 || input.moveY !== 0) {
      dirX = input.moveX;
      dirY = input.moveY;
    }
    let mate: Skater | null = null;
    let best = -Infinity;
    for (const m of this.skaters) {
      if (m === s || m.team !== s.team || m.out) continue;
      const dx = m.x - s.x;
      const dy = m.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < TEAM.passMin || d > TEAM.passMax) continue;
      const along = (dx * dirX + dy * dirY) / d;
      if (along < TEAM.passCone) continue;
      const score = along - d / 600;
      if (score > best) {
        best = score;
        mate = m;
      }
    }
    return mate;
  }

  private pass(s: Skater, input: SimInput, events: SimEvent[]): void {
    let dirX = Math.cos(s.facing);
    let dirY = Math.sin(s.facing);
    if (input.moveX !== 0 || input.moveY !== 0) {
      dirX = input.moveX;
      dirY = input.moveY;
    }
    const mate = this.passMate(s, input);
    const bx = this.bladeX(s);
    const by = this.bladeY(s);
    if (mate) {
      // Lead him: aim where he will be when the puck gets there.
      const lead = Math.min(TEAM.passLead, Math.hypot(mate.x - bx, mate.y - by) / (TEAM.passSpeed * s.mods.passSpeed));
      const tx = mate.x + mate.vx * lead - bx;
      const ty = mate.y + mate.vy * lead - by;
      const len = Math.hypot(tx, ty) || 1;
      dirX = tx / len;
      dirY = ty / len;
    }
    const p = this.puck;
    p.state = 'free';
    p.x = bx;
    p.y = by;
    if (s.mods.passError > 0) {
      const turn = (this.modRng.next() * 2 - 1) * s.mods.passError;
      [dirX, dirY] = [dirX * Math.cos(turn) - dirY * Math.sin(turn), dirX * Math.sin(turn) + dirY * Math.cos(turn)];
    }
    p.vx = dirX * TEAM.passSpeed * s.mods.passSpeed;
    p.vy = dirY * TEAM.passSpeed * s.mods.passSpeed;
    p.z = 0;
    p.vz = 0;
    s.hasPuck = false;
    s.charge = 0;
    s.pickupCooldown = FEEL.pickupCooldown;
    this.stats.last = 'Pass';
    if (this.match) this.release = { team: s.team, x: s.x, y: s.y };
    this.passTarget = mate ? mate.index : -1;
    this.passTimer = TEAM.passWatch;
    // The player follows his pass: control goes to the receiver.
    if (mate && s.index === this.controlled) this.takeControl(mate.index);
    events.push({ type: 'pass', team: s.team });
  }

  /**
   * Shot aim help. A shot is sent where the stick or the held direction points, one of eight ways, which rarely
   * lines up with a corner of the net. With a diagonal held toward a net, the shot is aimed at the corner on that
   * side instead, as long as that is not a big change of direction. Straight shots are left exactly as they are.
   * Only the skater the player controls gets it, and only when he is on a keyboard.
   */
  private aimAtCorner(s: Skater, dirX: number, dirY: number, sideways: number): { x: number; y: number } | null {
    if (!this.aimAssist || sideways === 0 || dirY === 0) return null;
    // The help is for the player's hands on a keyboard or stick; a computer skater shoots where his stick points (Decision 98).
    if (this.teams && (this.demo || s.index !== this.controlled)) return null;
    // And only for a keyboard: a stick aims for itself.
    if (!this.aimHelpNow) return null;
    const end: RinkEnd = dirY < 0 ? 'top' : 'bottom';
    const line = goalLineY(this.rink, end);
    const bx = this.bladeX(s);
    const by = this.bladeY(s);
    const out = Math.abs(line - by);
    if ((line - by) * dirY <= 0 || out > AIM.range) return null;
    // Nobody picks a corner perfectly: the aim point wanders a little either way, from a seeded stream.
    const wander = (this.aimRng.next() * 2 - 1) * AIM.spread;
    const corner = this.rink.centerX + Math.sign(sideways) * (this.rink.mouthHalfWidth - FEEL.puckRadius - AIM.cornerInset) + wander;
    const tx = corner - bx;
    const ty = line - by;
    const len = Math.hypot(tx, ty) || 1;
    const turn = Math.acos(Math.max(-1, Math.min(1, (tx * dirX + ty * dirY) / len)));
    return turn <= AIM.maxTurn ? { x: tx / len, y: ty / len } : null;
  }

  private stepShooting(s: Skater, input: SimInput, dt: number, events: SimEvent[]): void {
    if (s.out || s.down > 0) return;
    if (!s.hasPuck) {
      s.charge = 0;
      // Holding shoot without the puck is winding up: a pass that arrives is hit first time.
      s.windup = input.shoot ? Math.min(s.windup + dt, FEEL.maxChargeTime) : 0;
      // A stick's exact direction if there is one, else the held direction, one of eight ways.
      const waiting = stickAim(input);
      s.aimX = waiting ? waiting.x : input.moveX;
      s.aimY = waiting ? waiting.y : input.moveY;
      return;
    }
    s.windup = 0;
    if (this.teams && input.pass && !s.passHeld) {
      this.pass(s, input, events);
      return;
    }
    if (input.shoot) {
      s.charge = Math.min(s.charge + dt, FEEL.maxChargeTime);
      return;
    }
    if (!s.shootHeld) return;

    // Button released with the puck: shoot where the stick is pointed.
    let dirX = Math.cos(s.facing);
    let dirY = Math.sin(s.facing);
    if (input.moveX !== 0 || input.moveY !== 0) {
      dirX = input.moveX;
      dirY = input.moveY;
    }
    // A gamepad or touch stick aims for itself: the shot goes exactly where it is pushed.
    const stick = stickAim(input);
    if (stick) [dirX, dirY] = [stick.x, stick.y];
    this.fire(s, dirX, dirY, input.moveX, Math.min(s.charge / FEEL.maxChargeTime, 1), 1, false, events);
  }

  /** The puck leaves his stick as a shot. */
  private fire(s: Skater, dirX: number, dirY: number, sideways: number, power: number, boost: number, oneTimer: boolean, events: SimEvent[]): void {
    const t = this.tuning;
    const factor = FEEL.minShotFactor + (1 - FEEL.minShotFactor) * power;
    const p = this.puck;
    p.state = 'free';
    p.x = this.bladeX(s);
    p.y = this.bladeY(s);
    // His shot: harder or softer with his power rating, and it strays a little from his aim with his accuracy.
    const slap = power >= SHOOT.slapThreshold;
    const speed = t.shotVelocity * factor * boost * (slap ? s.mods.slapPower : s.mods.wristPower);
    const error = slap ? s.mods.slapError : s.mods.wristError;
    if (error > 0) {
      const turn = (this.modRng.next() * 2 - 1) * error;
      [dirX, dirY] = [dirX * Math.cos(turn) - dirY * Math.sin(turn), dirX * Math.sin(turn) + dirY * Math.cos(turn)];
    }
    const inheritX = s.vx * FEEL.shotInherit;
    const inheritY = s.vy * FEEL.shotInherit;
    p.vx = dirX * speed + inheritX;
    p.vy = dirY * speed + inheritY;
    const aim = this.aimAtCorner(s, dirX, dirY, sideways);
    if (aim) {
      // Aimed at the corner: the skater's own drift is allowed for, so the puck travels along the aimed line.
      const along = aim.x * inheritX + aim.y * inheritY;
      const k = along + Math.sqrt(Math.max(0, along * along - (inheritX * inheritX + inheritY * inheritY) + speed * speed));
      p.vx = aim.x * k;
      p.vy = aim.y * k;
    }
    // A quick release is a wrist shot: slower, and it climbs. A full wind-up is a slap shot: hard and low.
    const kind: ShotKind = power >= SHOOT.slapThreshold ? 'slap' : 'wrist';
    p.z = SHOOT.releaseHeight;
    p.vz = kind === 'slap' ? SHOOT.slapLift : SHOOT.wristLift;
    this.launchTick = this.tick;
    this.stats.shots++;
    this.stats.last = oneTimer ? 'One-timer' : kind === 'slap' ? 'Slap shot' : 'Wrist shot';
    this.beatGoalie = false;
    this.throughFiveHole = false;
    s.hasPuck = false;
    s.charge = 0;
    s.windup = 0;
    s.pickupCooldown = FEEL.pickupCooldown;
    s.shotTick = this.tick;
    this.passTarget = -1;
    events.push(oneTimer ? { type: 'shot', power, kind, team: s.team, oneTimer: true } : { type: 'shot', power, kind, team: s.team });
    if (this.match) {
      this.match.stats[s.team].shots++;
      this.release = { team: s.team, x: s.x, y: s.y };
    }
  }

  /**
   * A one-timer: a skater winding up (shoot held, no puck) meets a moving puck and hits it first time.
   * It goes where he is holding if that is toward the net he attacks, otherwise straight at that net.
   */
  private oneTime(s: Skater, events: SimEvent[]): void {
    const bx = this.bladeX(s);
    const by = this.bladeY(s);
    let dirX = s.aimX;
    let dirY = s.aimY;
    let sideways = s.aimX;
    const held = dirX !== 0 || dirY !== 0;
    if (this.teams) {
      const nx = this.rink.centerX - bx;
      const ny = goalLineY(this.rink, attackEnd(s.team)) - by;
      const len = Math.hypot(nx, ny) || 1;
      if (!held || (dirX * nx + dirY * ny) / len < ONE_TIMER.towardNet) {
        [dirX, dirY, sideways] = [nx / len, ny / len, 0];
      }
    } else if (!held) {
      [dirX, dirY] = [Math.cos(s.facing), Math.sin(s.facing)];
    }
    // He counts as having touched it: the pass before it is an assist.
    if (this.lastTouch !== s.team) this.chain = [];
    if (this.chain[this.chain.length - 1] !== s.index) this.chain.push(s.index);
    this.lastTouch = s.team;
    this.puck.z = 0;
    const power = Math.max(ONE_TIMER.minPower, s.windup / FEEL.maxChargeTime);
    this.fire(s, dirX, dirY, sideways, power, ONE_TIMER.boost, true, events);
  }

  private stepGoalies(dt: number): void {
    if (!this.goalies.length) return;
    this.seen.push({ x: this.puck.x, y: this.puck.y });
    const delay = Math.round(GOALIE.reaction / SIM_DT);
    while (this.seen.length > delay + 1) this.seen.shift();
    const saw = this.seen[0] as { x: number; y: number };
    for (const g of this.goalies) {
      const had = g.holding > 0;
      stepGoalie(this.rink, g, saw.x, saw.y, dt);
      if (had && g.holding === 0 && this.puck.state === 'held') {
        // He drops the puck to his glove side for play to go on.
        const away = g.end === 'top' ? 1 : -1;
        this.puck.state = 'free';
        this.puck.x = g.x + g.gloveSide * 6;
        this.puck.y = g.y + away * 6;
        this.puck.vx = g.gloveSide * 45;
        this.puck.vy = away * 25;
        this.puck.z = 0;
        this.puck.vz = 0;
      } else if (g.holding > 0 && this.puck.state === 'held') {
        this.puck.x = g.x + g.gloveSide * 4;
        this.puck.y = g.y;
      }
    }
  }

  private stepPuck(dt: number, events: SimEvent[]): void {
    const p = this.puck;
    const t = this.tuning;

    if (p.state === 'held') return;

    if (p.state === 'inNet') {
      // In a game the goal is followed by a faceoff, run by the match clock.
      if (this.match) return;
      this.goalTimer -= dt;
      if (this.goalTimer <= 0) this.resetPuck();
      return;
    }

    const s = this.carrier();
    if (p.state === 'carried' && !s) p.state = 'free';
    if (p.state === 'carried' && s) {
      p.x = this.bladeX(s);
      p.y = this.bladeY(s);
      p.vx = s.vx;
      p.vy = s.vy;
      // The blade cannot poke through the boards.
      collideWithBoards(p, FEEL.puckRadius, 0, this.rink);
      p.vx = s.vx;
      p.vy = s.vy;
      // Free play: the puck comes off on touch. In a game it takes the contact button.
      if (this.teams && !this.match) this.pokeCheck(s, events);
      return;
    }

    // Height: a lifted puck flies, falls and lands. The ice only slows it while it is on the ice.
    if (p.z > 0 || p.vz > 0) {
      p.z += p.vz * dt;
      p.vz -= SHOOT.gravity * dt;
      if (p.z <= 0) {
        p.z = 0;
        p.vz = 0;
      }
    }
    const drag = Math.exp(-(p.z > 0 ? SHOOT.airDrag : t.puckFriction) * dt);
    p.vx *= drag;
    p.vy *= drag;
    if (Math.hypot(p.vx, p.vy) < 1) {
      p.vx = 0;
      p.vy = 0;
    }
    // A loose puck that is suddenly moving fast was launched by something: start the clock. A slow one stops it.
    const moving = Math.hypot(p.vx, p.vy);
    if (moving > SHOOT.launchSpeed && this.launchTick < 0) this.launchTick = this.tick;
    else if (moving < SHOOT.launchSpeed * 0.6) this.launchTick = -1;
    const prevX = p.x;
    const prevY = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const impact = collideWithBoards(p, FEEL.puckRadius, t.boardRestitution, this.rink);
    if (impact > 20) events.push({ type: 'boards', speed: impact });

    for (const end of ['top', 'bottom'] as const) {
      const line = goalLineY(this.rink, end);
      const box = netBox(this.rink, end);
      const toward = end === 'top' ? -1 : 1;
      const off = Math.abs(p.x - this.rink.centerX);

      // The goalie stands in front of the line: a puck heading for the net reaches him first.
      const goalie = this.goalies.find((g) => g.end === end);
      if (goalie && !this.beatGoalie && Math.sign(p.vy) === toward) {
        const reached = end === 'top' ? prevY > goalie.y && p.y <= goalie.y : prevY < goalie.y && p.y >= goalie.y;
        if (reached) {
          // Judge the shot where it actually crossed his line, not where the step ended.
          const at = prevX + ((p.x - prevX) * (prevY - goalie.y)) / (prevY - p.y || 1);
          p.x = at;
          const flight = this.launchTick < 0 ? Infinity : (this.tick - this.launchTick) * SIM_DT;
          const outcome = resolveShot(goalie, at - goalie.x, p.z, flight);
          if (outcome.saved) {
            this.stats.saves++;
            this.stats.last = `${outcome.saved[0]?.toUpperCase()}${outcome.saved.slice(1)} save`;
            events.push({ type: 'save', kind: outcome.saved, end });
            this.noteSave(end);
            p.y = goalie.y;
            p.z = 0;
            p.vz = 0;
            if (outcome.saved === 'glove' || outcome.saved === 'body') {
              p.state = 'held';
              p.vx = 0;
              p.vy = 0;
              goalie.holding = GOALIE.holdTime;
              return;
            }
            const v = reboundVelocity(goalie, outcome.saved, p.x - goalie.x, p.vx, p.vy, this.rng);
            p.vx = v.vx;
            p.vy = v.vy;
            this.launchTick = this.tick;
            p.y = goalie.y - toward;
            continue;
          }
          this.beatGoalie = true;
          this.throughFiveHole = outcome.fiveHole;
          if (outcome.fiveHole) this.stats.last = 'Five-hole';
        }
      }

      const cameFromFront = end === 'top' ? prevY > line : prevY < line;
      const crossed = end === 'top' ? p.y <= line : p.y >= line;
      // Where the puck crossed the goal line, not where the step ended: an angled shot must not drift onto a post.
      const xAtLine = cameFromFront && crossed ? prevX + ((p.x - prevX) * (prevY - line)) / (prevY - p.y || 1) : p.x;
      const offAtLine = Math.abs(xAtLine - this.rink.centerX);
      if (cameFromFront && crossed && offAtLine <= this.rink.netHalfWidth + FEEL.puckRadius) {
        const bar = this.rink.netFrontHeight;
        // He fills the part of the goal line his body stands in front of. Without this a shot along the goal line from a
        // sharp angle could slip between him and the post he is standing against.
        if (goalie && goalie.holding === 0 && !this.throughFiveHole && p.z <= GOALIE.reachHeight && Math.abs(xAtLine - goalie.x) <= GOALIE.halfBody) {
          const kind = p.z <= GOALIE.padHeight ? 'pad' : 'body';
          this.stats.saves++;
          this.stats.last = `${kind === 'pad' ? 'Pad' : 'Body'} save`;
          events.push({ type: 'save', kind, end });
          this.noteSave(end);
          p.x = xAtLine;
          p.y = line - toward * (FEEL.puckRadius + 0.5);
          const v = reboundVelocity(goalie, 'pad', xAtLine - goalie.x, p.vx, p.vy, this.rng);
          p.vx = v.vx;
          p.vy = v.vy;
          p.z = 0;
          p.vz = 0;
          this.launchTick = this.tick;
          continue;
        }
        // A goal needs the whole puck between the posts and under the bar: the same opening the goal art shows.
        const betweenPosts = offAtLine <= this.rink.mouthHalfWidth - FEEL.puckRadius;
        if (p.z > bar + SHOOT.barThickness) {
          // Over the net: it carries on above the goal frame until it comes down.
          if (!this.overNet) {
            this.overNet = true;
            this.stats.over++;
            this.stats.last = 'Over the net';
            events.push({ type: 'over', end });
          }
        } else if (betweenPosts && p.z < bar - SHOOT.barThickness) {
          const fiveHole = this.stats.last === 'Five-hole';
          p.state = 'inNet';
          p.vx = 0;
          p.vy = 0;
          p.z = 0;
          p.vz = 0;
          p.y = end === 'top' ? line - this.rink.netDepth / 2 : line + this.rink.netDepth / 2;
          this.goals++;
          if (this.teams && this.match?.phase !== 'shootout') this.score[end === 'top' ? 0 : 1]++;
          this.stats.goals++;
          if (fiveHole) this.stats.fiveHole++;
          this.stats.last = fiveHole ? 'Goal: five-hole' : 'Goal';
          this.goalTimer = FEEL.goalPause;
          events.push({ type: 'goal', end, fiveHole });
          return;
        } else {
          // Iron: the crossbar if it was between the posts, otherwise a post. The puck comes back out.
          const crossbar = betweenPosts;
          if (crossbar) this.stats.crossbars++;
          else this.stats.posts++;
          this.stats.last = crossbar ? 'Crossbar' : 'Post';
          events.push({ type: crossbar ? 'crossbar' : 'post', end });
          p.x = xAtLine;
          p.y = line - toward * (FEEL.puckRadius + 0.5);
          p.vy = -p.vy * SHOOT.ironRestitution;
          if (!crossbar) p.vx += Math.sign(p.x - this.rink.centerX) * Math.abs(p.vy) * 0.5;
          p.vz = crossbar ? -Math.abs(p.vz) : p.vz;
          continue;
        }
      }
      // Coming at the goal from the front: the goal line decides what happens (goal, post or bar), not the net's box.
      if (cameFromFront && !crossed && off <= this.rink.netHalfWidth + FEEL.puckRadius) continue;
      // A puck above the frame does not hit the net; once it drops below the back bar it does.
      if (this.overNet && p.z > this.rink.netBackHeight) continue;
      if (collideWithBox(p, prevX, prevY, FEEL.puckRadius, t.boardRestitution, box)) {
        events.push({ type: 'boards', speed: Math.hypot(p.vx, p.vy) });
      }
    }
    if (p.z === 0) this.overNet = false;

    // Possession: a loose puck near a blade is collected, by whoever's blade is nearest.
    let taker: Skater | null = null;
    let nearest = Infinity;
    for (const k of this.skaters) {
      if (k.pickupCooldown > 0 || k.out || k.down > 0) continue;
      const blade = Math.hypot(p.x - this.bladeX(k), p.y - this.bladeY(k));
      const nearBlade = blade <= t.pickupRadius;
      const nearBody = Math.hypot(p.x - k.x, p.y - k.y) <= FEEL.skaterRadius + FEEL.puckRadius;
      const relSpeed = Math.hypot(p.vx - k.vx, p.vy - k.vy);
      // A skater winding up can meet a harder pass than one who is trying to settle it.
      const limit = k.windup > 0 ? ONE_TIMER.maxPuckSpeed : FEEL.pickupMaxRelativeSpeed;
      if ((nearBlade || nearBody) && relSpeed <= limit && blade < nearest) {
        nearest = blade;
        taker = k;
      }
    }
    // A puck in the air over the skaters' sticks cannot be collected.
    if (taker && taker.windup > 0 && p.z <= TEAM.pickupHeight && Math.hypot(p.vx, p.vy) >= ONE_TIMER.minPuckSpeed) {
      this.oneTime(taker, events);
      return;
    }
    if (taker && (!this.teams || p.z <= TEAM.pickupHeight)) {
      p.state = 'carried';
      p.z = 0;
      p.vz = 0;
      taker.hasPuck = true;
      taker.charge = 0;
      taker.possessTick = this.tick;
      this.passTarget = -1;
      if (this.lastTouch !== taker.team) this.chain = [];
      if (this.chain[this.chain.length - 1] !== taker.index) this.chain.push(taker.index);
      this.lastTouch = taker.team;
      this.release = null;
      // The player always controls his team's puck carrier.
      if (this.teams && taker.team === 0) this.takeControl(taker.index);
      events.push({ type: 'pickup', team: taker.team });
    }
  }

  /** An opponent who gets his stick or body to a carried puck knocks it loose. */
  private pokeCheck(carrier: Skater, events: SimEvent[]): void {
    if (this.tick - carrier.possessTick < TEAM.pokeGrace / SIM_DT) return;
    const p = this.puck;
    for (const o of this.skaters) {
      if (o.team === carrier.team || o.pokeCooldown > 0) continue;
      const reach = Math.min(Math.hypot(p.x - this.bladeX(o), p.y - this.bladeY(o)), Math.hypot(p.x - o.x, p.y - o.y));
      if (reach > TEAM.pokeRadius) continue;
      const dx = p.x - carrier.x;
      const dy = p.y - carrier.y;
      const len = Math.hypot(dx, dy) || 1;
      p.state = 'free';
      p.vx = (dx / len) * TEAM.pokeSpeed + o.vx * 0.5;
      p.vy = (dy / len) * TEAM.pokeSpeed + o.vy * 0.5;
      carrier.hasPuck = false;
      carrier.charge = 0;
      carrier.aiHold = 0;
      carrier.pickupCooldown = TEAM.strippedCooldown;
      o.pokeCooldown = TEAM.pokeCooldown;
      events.push({ type: 'poke', team: o.team });
      return;
    }
  }

  // ---- a full game: clock, whistles, faceoffs, rules, contact, penalties, shootout ----

  private boxed(team: 0 | 1): number {
    return this.match ? this.match.penalties.filter((p) => p.team === team).length : 0;
  }

  private noteSave(end: RinkEnd): void {
    if (!this.match) return;
    // The top net is defended by team 1.
    this.match.stats[end === 'top' ? 1 : 0].saves++;
    this.release = null;
  }

  /** Stop play. Everyone coasts, then lines up at `dot`. */
  private blow(reason: StopReason, dot: { x: number; y: number }, events: SimEvent[]): void {
    const m = this.match;
    if (!m) return;
    m.phase = 'whistle';
    m.reason = reason;
    m.dot = dot;
    m.timer = reason === 'goal' ? MATCH.goalPause : reason === 'penalty' ? MATCH.penaltyPause : MATCH.whistlePause;
    for (const s of this.skaters) {
      s.hasPuck = false;
      s.charge = 0;
      s.aiHold = 0;
      s.aiCheck = 0;
      s.checkTime = 0;
      s.checked = false;
    }
    if (reason !== 'goal') {
      this.puck.state = 'held';
      this.puck.vx = 0;
      this.puck.vy = 0;
      this.puck.z = 0;
      this.puck.vz = 0;
    }
    for (const g of this.goalies) g.holding = 0;
    this.passTarget = -1;
    this.release = null;
    if (this.referee && reason !== 'start' && reason !== 'period' && reason !== 'penalty') signalReferee(this.referee, reason === 'goal' ? 'goal' : 'washout');
    events.push({ type: 'whistle', reason });
  }

  /** Both teams to their spots around the dot, the puck in the referee's hand above it. */
  private lineUpAt(m: MatchState): void {
    const order: Role[] = ['C', 'LW', 'RW', 'LD', 'RD'];
    for (const team of [0, 1] as const) {
      const on = this.skaters.filter((s) => s.team === team && !s.out && !s.toBox).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
      const taker = on[0];
      if (!taker) continue;
      m.taker[team] = taker.index;
      for (const s of on) {
        const spot = lineupSpot(this.rink, team, s === taker ? 'C' : s.role, m.dot);
        s.x = spot.x;
        s.y = spot.y;
        s.vx = 0;
        s.vy = 0;
        collideWithBoards(s, FEEL.skaterRadius, 0, this.rink);
        s.vx = 0;
        s.vy = 0;
        s.facing = Math.atan2(m.dot.y - s.y, m.dot.x - s.x);
        s.down = 0;
        s.lock = 0;
        s.pickupCooldown = 0;
        s.aiStill = 0;
        s.aiDodge = 0;
        s.aiWait = 0;
      }
    }
    const p = this.puck;
    [p.x, p.y, p.vx, p.vy, p.z, p.vz] = [m.dot.x, m.dot.y, 0, 0, 0, 0];
    p.state = 'held';
    if (this.goalies.length) this.goalies = [makeGoalie(this.rink, 'top'), makeGoalie(this.rink, 'bottom')];
    this.seen = [];
    this.launchTick = -1;
    this.chain = [];
    this.lastTouch = -1;
    // The player takes the draw.
    this.controlled = m.taker[0];
    m.phase = 'faceoff';
    m.timer = this.matchRng.range(MATCH.dropWait[0], MATCH.dropWait[1]);
    m.locked = [0, 0];
    m.sinceDrop = 0;
  }

  /** The clock and the penalties on it. Ends the period when it runs out. */
  private runClock(m: MatchState, dt: number, events: SimEvent[]): boolean {
    m.clock -= dt;
    for (const pen of m.penalties.slice()) {
      pen.left -= dt;
      if (pen.left <= 0) this.endPenalty(m, pen, events);
    }
    if (m.clock > 0) return false;
    this.endPeriod(m, events);
    return true;
  }

  private endPenalty(m: MatchState, pen: MatchState['penalties'][number], events: SimEvent[]): void {
    m.penalties = m.penalties.filter((p) => p !== pen);
    const s = this.skaters[pen.skater];
    if (!s) return;
    // Out of the box door and back onto the ice.
    const door = boxDoor(this.rink, s.team);
    s.out = false;
    s.toBox = false;
    s.x = door.x + (s.team === 0 ? 6 : -6);
    s.y = door.y;
    s.vx = 0;
    s.vy = 0;
    s.down = 0;
    s.lock = 0;
    events.push({ type: 'penaltyOver', team: s.team, skater: s.index });
  }

  private endPeriod(m: MatchState, events: SimEvent[]): void {
    m.clock = 0;
    m.pending = null;
    events.push({ type: 'period', period: m.period });
    for (const s of this.skaters) {
      s.hasPuck = false;
      s.charge = 0;
      s.aiHold = 0;
    }
    if (this.puck.state !== 'inNet') this.puck.state = 'held';
    [this.puck.vx, this.puck.vy, this.puck.z, this.puck.vz] = [0, 0, 0, 0];
    for (const g of this.goalies) g.holding = 0;
    const tied = this.score[0] === this.score[1];
    if (m.period < MATCH.periods || (tied && m.period === MATCH.periods && MATCH.overtimeSeconds > 0)) {
      // A break; after the last period of a tied game, the break before sudden-death overtime.
      m.phase = 'intermission';
    } else if (tied) {
      this.beginShootout(m);
    } else {
      m.winner = this.score[0] > this.score[1] ? 0 : 1;
      m.phase = 'final';
      events.push({ type: 'final', winner: m.winner });
    }
  }

  /** The player has read who scored: get on with the faceoff. */
  skipGoalPause(): void {
    const m = this.match;
    if (m && m.phase === 'whistle' && m.reason === 'goal' && m.timer > MATCH.goalSkip) m.timer = MATCH.goalSkip;
  }

  /** Carry on from an intermission: the next period starts with a faceoff at centre. */
  advance(): void {
    const m = this.match;
    if (!m || m.phase !== 'intermission') return;
    m.period++;
    m.clock = m.period > MATCH.periods ? MATCH.overtimeSeconds : MATCH.periodSeconds;
    if (m.period > MATCH.periods) this.thinForOvertime(m);
    m.reason = 'period';
    m.dot = faceoffDots(this.rink).centre;
    this.lineUpAt(m);
  }

  /**
   * Overtime is played short-handed on both sides: the centre, a winger and a defenceman stay, the rest sit.
   * A skater serving a penalty counts as one of his side's places, so his side is a man down until he is back.
   */
  private thinForOvertime(m: MatchState): void {
    const order: Role[] = ['C', 'LW', 'RD', 'RW', 'LD'];
    for (const team of [0, 1] as const) {
      const boxed = new Set(m.penalties.filter((p) => p.team === team).map((p) => p.skater));
      const free = this.skaters.filter((s) => s.team === team && !boxed.has(s.index)).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
      const places = Math.max(1, MATCH.overtimeSkaters - boxed.size);
      free.slice(places).forEach((s) => {
        s.out = true;
        s.hasPuck = false;
        s.x = -200;
        [s.vx, s.vy] = [0, 0];
      });
    }
  }

  /** One step while play is stopped. */
  private stepStopped(m: MatchState, input: SimInput, events: SimEvent[]): void {
    const dt = SIM_DT;
    // A running clock: it keeps going through a freeze, an icing or an offside, and stops for goals, penalties and period breaks.
    const running = m.reason === 'freeze' || m.reason === 'icing' || m.reason === 'offside';
    const pressed = (input.shoot && !this.shootHeld) || (!!input.pass && !this.passHeld) || (!!input.check && !this.checkHeld);
    if (m.phase === 'whistle') {
      if (m.reason === 'start' && this.tick <= 1) m.timer = 0;
      // Everyone coasts, except a penalized skater: he skates to the box, and the faceoff waits for him.
      let walking = false;
      for (const s of this.skaters) {
        if (!s.toBox) {
          this.stepSkater(s, NO_INPUT, dt);
          continue;
        }
        const door = boxDoor(this.rink, s.team);
        const late = m.timer < -MATCH.boxWalk;
        if (late || Math.hypot(door.x - s.x, door.y - s.y) < 9) {
          s.toBox = false;
          s.out = true;
          s.x = -200;
          [s.vx, s.vy] = [0, 0];
          continue;
        }
        walking = true;
        const go = quantize8(door.x - s.x, door.y - s.y, 0);
        this.stepSkater(s, { moveX: go.x, moveY: go.y, shoot: false }, dt);
      }
      this.separate();
      if (running && this.runClock(m, dt, events)) return;
      m.timer -= dt;
      if (m.timer <= 0 && !walking) {
        if (m.reason === 'goal' && m.period === MATCH.periods + 1 && this.score[0] !== this.score[1]) {
          // Sudden death: an overtime goal ends the game once its card has been read.
          m.winner = this.score[0] > this.score[1] ? 0 : 1;
          m.phase = 'final';
          events.push({ type: 'final', winner: m.winner });
        } else {
          this.lineUpAt(m);
        }
      }
    } else if (m.phase === 'faceoff') {
      if (running && this.runClock(m, dt, events)) return;
      // Jumping the drop costs the draw.
      if (pressed && !this.demo) m.locked[0] = MATCH.earlyLock;
      // The puck is not dropped until the referee is at the dot (he is given a few seconds to get there).
      const ref = this.referee;
      if (ref && m.sinceDrop < MATCH.refereeWait) {
        const spot = dropSpot(this.rink, m.dot);
        if (Math.hypot(ref.x - spot.x, ref.y - spot.y) > 3) {
          m.sinceDrop += dt;
          return;
        }
      }
      m.timer -= dt;
      if (m.timer <= 0) {
        m.phase = 'draw';
        m.sinceDrop = 0;
        m.aiPress = [this.matchRng.range(MATCH.aiDraw[0], MATCH.aiDraw[1]), this.matchRng.range(MATCH.aiDraw[0], MATCH.aiDraw[1])];
        this.puck.state = 'free';
        events.push({ type: 'drop' });
      }
    } else if (m.phase === 'draw') {
      m.sinceDrop += dt;
      const wants = (team: 0 | 1): boolean => {
        if (m.sinceDrop < m.locked[team]) return false;
        return team === 0 && !this.demo ? pressed : m.sinceDrop >= m.aiPress[team];
      };
      const [home, away] = [wants(0), wants(1)];
      const winner: 0 | 1 | -1 = home && away ? (this.matchRng.next() < 0.5 ? 0 : 1) : home ? 0 : away ? 1 : -1;
      if (winner !== -1) this.winDraw(m, winner, input, events);
      else if (m.sinceDrop > MATCH.drawWindow) this.startPlay(m, -1, events);
    } else if (m.phase === 'shootout') {
      this.stepShootout(m, input, events);
    }
  }

  private winDraw(m: MatchState, team: 0 | 1, input: SimInput, events: SimEvent[]): void {
    // Back to his own defence, or wherever the player is holding.
    let dx = (this.matchRng.next() - 0.5) * 0.9;
    let dy = -attackDir(team);
    if (team === 0 && !this.demo && (input.moveX !== 0 || input.moveY !== 0)) [dx, dy] = [input.moveX, input.moveY];
    const len = Math.hypot(dx, dy) || 1;
    this.puck.vx = (dx / len) * MATCH.drawSpeed;
    this.puck.vy = (dy / len) * MATCH.drawSpeed;
    m.stats[team].faceoffs++;
    this.lastTouch = team;
    // Neither centre can grab it straight back.
    for (const i of m.taker) {
      const s = this.skaters[i];
      if (s) s.pickupCooldown = 0.3;
    }
    this.startPlay(m, team, events);
  }

  private startPlay(m: MatchState, winner: 0 | 1 | -1, events: SimEvent[]): void {
    m.phase = 'play';
    this.dropTick = this.tick;
    this.drawDelay = [0, 0];
    events.push({ type: 'draw', team: winner });
  }

  /** After a step of live play: the goal, the clock, the goalie's freeze, offside and icing. */
  private stepRules(m: MatchState, puckWasY: number, dt: number, events: SimEvent[]): void {
    if (m.phase !== 'play') return;
    const { rink, puck } = this;
    const goal = events.find((e) => e.type === 'goal');
    if (goal && goal.type === 'goal') {
      // A goal against the team about to be penalized wipes the call out.
      if (m.pending && m.pending.team !== (goal.end === 'top' ? 0 : 1)) m.pending = null;
      this.onGoal(m, goal.end, events);
      return;
    }
    if (this.runClock(m, dt, events)) return;
    // The referee's arm has been up for a beat: now he blows it down.
    if (m.pending && (m.pending.timer -= dt) <= 0) {
      const call = m.pending;
      m.pending = null;
      const offender = this.skaters[call.skater];
      if (offender && !offender.out) {
        this.whistlePenalty(m, offender, call.foul, events);
        return;
      }
    }
    if (puck.state === 'held') {
      const g = this.goalies.find((x) => x.holding > 0);
      this.blow('freeze', endZoneDot(rink, g ? g.end : puck.y < rink.centerY ? 'top' : 'bottom', puck.x), events);
      return;
    }
    for (const team of [0, 1] as const) {
      const dir = attackDir(team);
      const end = attackEnd(team);
      // Offside: the puck is brought over the blue line with a teammate already in the zone.
      if (this.rules.offside && this.lastTouch === team) {
        const blue = rink.centerY + dir * rink.blueLineOffset;
        if ((puckWasY - blue) * dir <= 0 && (puck.y - blue) * dir > 0) {
          const ahead = this.skaters.some((s) => s.team === team && !s.out && !s.hasPuck && (s.y - blue) * dir > 3);
          if (ahead) {
            this.blow('offside', neutralDot(rink, end, puck.x), events);
            return;
          }
        }
      }
      // Icing: sent from his own side of centre, over the far goal line, untouched. Not called on a team that is short-handed.
      const rel = this.release;
      if (this.rules.icing && rel && rel.team === team && puck.state === 'free') {
        const line = goalLineY(rink, end);
        const crossed = (puckWasY - line) * dir <= 0 && (puck.y - line) * dir > 0;
        const fromOwnHalf = (rel.y - rink.centerY) * dir < 0;
        const other = team === 0 ? 1 : 0;
        if (crossed && fromOwnHalf && this.boxed(team) <= this.boxed(other)) {
          this.blow('icing', endZoneDot(rink, attackEnd(other), rel.x), events);
          return;
        }
      }
    }
  }

  private onGoal(m: MatchState, end: RinkEnd, events: SimEvent[]): void {
    const team: 0 | 1 = end === 'top' ? 0 : 1;
    const other: 0 | 1 = team === 0 ? 1 : 0;
    const own = this.lastTouch === team;
    const powerPlay = this.boxed(other) > this.boxed(team);
    m.stats[team].goals++;
    if (powerPlay) m.stats[team].powerPlayGoals++;
    m.goals.push({
      team,
      scorer: own ? (this.chain[this.chain.length - 1] ?? -1) : -1,
      assists: own ? this.chain.slice(-3, -1).reverse() : [],
      period: m.period,
      time: m.clock,
      powerPlay,
    });
    // A power-play goal lets the first penalized skater out.
    const served = m.penalties.find((p) => p.team === other);
    if (powerPlay && served) this.endPenalty(m, served, events);
    this.blow('goal', faceoffDots(this.rink).centre, events);
  }

  /** The contact button: tap to stick check, hold to bump, hold too long and it is a check (Decision 85). */
  private stepContact(s: Skater, input: SimInput, dt: number, events: SimEvent[]): void {
    if (s.out || s.down > 0 || s.lock > 0 || s.hasPuck) {
      s.checkTime = 0;
      s.checked = false;
      return;
    }
    if (input.check) {
      s.checkTime += dt;
      if (s.checkTime < CONTACT.bumpAfter || s.checked) return;
      let o: Skater | null = null;
      let best = CONTACT.touch;
      for (const k of this.skaters) {
        if (k.team === s.team || k.out || k.down > 0) continue;
        const d = Math.hypot(k.x - s.x, k.y - s.y);
        if (d <= best) [o, best] = [k, d];
      }
      if (!o) return;
      if (s.checkTime >= CONTACT.checkAfter) {
        s.checked = true;
        this.hit(s, o, events);
      } else {
        // A bump: he is leaned on and slowed.
        const keep = Math.pow(CONTACT.bumpDrag, dt);
        o.vx *= keep;
        o.vy *= keep;
      }
      return;
    }
    if (s.checkHeld && s.checkTime > 0 && s.checkTime < CONTACT.bumpAfter && s.checkCooldown <= 0) this.stickCheck(s, events);
    s.checkTime = 0;
    s.checked = false;
  }

  /** Is `s` behind `o`, where `o` cannot see him coming? */
  private behind(s: Skater, o: Skater): boolean {
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    return (Math.cos(o.facing) * dx + Math.sin(o.facing) * dy) / d > 0.5;
  }

  private stickCheck(s: Skater, events: SimEvent[]): void {
    const m = this.match;
    if (!m) return;
    s.checkCooldown = CONTACT.cooldown;
    const p = this.puck;
    const from = (x: number, y: number): number => Math.min(Math.hypot(x - this.bladeX(s), y - this.bladeY(s)), Math.hypot(x - s.x, y - s.y));
    const c = this.carrier();
    const onPuck = c !== null && c.team !== s.team && from(p.x, p.y) <= CONTACT.reach * s.mods.checkReach;
    // He has only just got it: the stick finds nothing, and nothing is called.
    if (onPuck && c && this.tick - c.possessTick < TEAM.pokeGrace / SIM_DT) return;
    if (onPuck && c) {
      // A clean stick check: the puck is knocked loose.
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      p.state = 'free';
      p.vx = (dx / len) * TEAM.pokeSpeed + s.vx * 0.5;
      p.vy = (dy / len) * TEAM.pokeSpeed + s.vy * 0.5;
      c.hasPuck = false;
      c.charge = 0;
      c.aiHold = 0;
      c.pickupCooldown = TEAM.strippedCooldown;
      m.stats[s.team].takeaways++;
      this.lastTouch = s.team;
      this.chain = [];
      this.release = null;
      events.push({ type: 'poke', team: s.team });
      // From behind it is a hook, if the referee sees it that way.
      if (this.behind(s, c)) this.foul(s, 'hooking', true, events);
      return;
    }
    let o: Skater | null = null;
    let best = CONTACT.bodyReach;
    for (const k of this.skaters) {
      if (k.team === s.team || k.out || k.down > 0) continue;
      const d = from(k.x, k.y);
      if (d <= best) [o, best] = [k, d];
    }
    if (!o) {
      // Nothing there: he is caught reaching.
      s.lock = CONTACT.missLock;
      return;
    }
    if (o === c) {
      // The stick finds his skates, not the puck.
      o.vx *= 0.6;
      o.vy *= 0.6;
      this.foul(s, 'tripping', this.behind(s, o), events);
    } else {
      this.foul(s, 'slashing', this.behind(s, o), events);
    }
  }

  /** A check: he goes down and the puck is free. Likely a penalty. */
  private hit(s: Skater, o: Skater, events: SimEvent[]): void {
    const m = this.match;
    if (!m) return;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const len = Math.hypot(dx, dy) || 1;
    o.down = CONTACT.downTime;
    o.vx = (dx / len) * CONTACT.hitSpeed;
    o.vy = (dy / len) * CONTACT.hitSpeed;
    o.charge = 0;
    o.aiHold = 0;
    if (o.hasPuck) {
      o.hasPuck = false;
      this.puck.state = 'free';
      this.puck.vx = (dx / len) * CONTACT.hitSpeed * 0.6 + s.vx * 0.3;
      this.puck.vy = (dy / len) * CONTACT.hitSpeed * 0.6 + s.vy * 0.3;
      m.stats[s.team].takeaways++;
      this.lastTouch = s.team;
      this.chain = [];
      this.release = null;
    }
    events.push({ type: 'hit', team: s.team, target: o.index });
    const r = this.rink;
    const toBoards = Math.min(o.x - r.left, r.right - o.x, o.y - r.top, r.bottom - o.y);
    this.foul(s, toBoards < CONTACT.boards ? 'boarding' : 'roughing', this.behind(s, o), events);
  }

  /** A foul happened. Whether it is a penalty depends on tonight's referee: he misses plenty. */
  private foul(s: Skater, kind: Foul, fromBehind: boolean, events: SimEvent[]): void {
    const m = this.match;
    if (!m || !this.rules.penalties || m.phase !== 'play' || s.out) return;
    if (this.boxed(s.team) >= MATCH.maxBoxed) return;
    // One call at a time: while his arm is up for one foul he is not looking for another.
    if (m.pending) return;
    const chance = Math.min(1, m.referee.calls[kind] * (fromBehind ? CONTACT.fromBehind : 1));
    if (this.matchRng.next() >= chance) return;
    // He saw it. His arm goes up, play carries on for a beat, then the whistle.
    m.pending = { skater: s.index, team: s.team, foul: kind, timer: MATCH.callBeat };
    if (this.referee) signalReferee(this.referee, 'penalty', MATCH.callBeat + 1.6);
    events.push({ type: 'call', team: s.team, skater: s.index, foul: kind });
  }

  /** The whistle for a penalty: play stops, the offender skates to the box, and the faceoff is in his end. */
  private whistlePenalty(m: MatchState, s: Skater, kind: Foul, events: SimEvent[]): void {
    const other: 0 | 1 = s.team === 0 ? 1 : 0;
    const seconds = penaltySeconds();
    m.penalties.push({ skater: s.index, team: s.team, foul: kind, left: seconds });
    m.stats[s.team].pim += 2;
    events.push({ type: 'penalty', team: s.team, skater: s.index, foul: kind, seconds });
    this.blow('penalty', endZoneDot(this.rink, attackEnd(other), this.puck.x), events);
    s.toBox = true;
    s.down = 0;
    s.lock = 0;
    if (this.controlled === s.index) this.switchControl();
  }

  // ---- shootout ----

  private beginShootout(m: MatchState): void {
    m.phase = 'shootout';
    m.period = MATCH.periods + 2;
    for (const pen of m.penalties) {
      const s = this.skaters[pen.skater];
      if (s) s.out = false;
    }
    m.penalties = [];
    m.shootout = { results: [[], []], team: 0, shooter: 0, timer: 0, live: false, winner: null };
    this.nextAttempt(m);
  }

  private nextAttempt(m: MatchState): void {
    const so = m.shootout;
    if (!so) return;
    const team: 0 | 1 = so.results[0].length <= so.results[1].length ? 0 : 1;
    const mine = this.skaters.filter((s) => s.team === team);
    const shooter = mine[so.results[team].length % mine.length];
    if (!shooter) return;
    const dir = attackDir(team);
    for (const s of this.skaters) {
      s.out = s !== shooter;
      s.hasPuck = false;
      s.charge = 0;
      s.aiHold = 0;
      s.aiWait = 0;
      s.down = 0;
      s.lock = 0;
      if (s.out) s.x = -200;
    }
    [shooter.x, shooter.y, shooter.vx, shooter.vy] = [this.rink.centerX, this.rink.centerY - dir * 24, 0, 0];
    shooter.facing = dir < 0 ? -Math.PI / 2 : Math.PI / 2;
    shooter.hasPuck = true;
    shooter.pickupCooldown = 0;
    shooter.possessTick = this.tick;
    const p = this.puck;
    p.state = 'carried';
    [p.x, p.y, p.vx, p.vy, p.z, p.vz] = [this.bladeX(shooter), this.bladeY(shooter), 0, 0, 0, 0];
    if (this.goalies.length) this.goalies = [makeGoalie(this.rink, 'top'), makeGoalie(this.rink, 'bottom')];
    this.seen = [];
    this.launchTick = -1;
    this.beatGoalie = false;
    this.throughFiveHole = false;
    this.overNet = false;
    this.dropTick = this.tick;
    this.drawDelay = [0, 0];
    if (team === 0) this.controlled = shooter.index;
    so.team = team;
    so.shooter = shooter.index;
    so.timer = MATCH.attemptSeconds;
    so.live = true;
  }

  private stepShootout(m: MatchState, input: SimInput, events: SimEvent[]): void {
    const so = m.shootout;
    if (!so) return;
    const dt = SIM_DT;
    if (!so.live) {
      so.timer += dt;
      if (so.timer < 0) return;
      const [a, b] = so.results;
      const [ga, gb] = [a.filter(Boolean).length, b.filter(Boolean).length];
      const rounds = MATCH.shootoutRounds;
      let winner: 0 | 1 | null = null;
      if (a.length <= rounds && b.length <= rounds) {
        // Decided early once one side cannot be caught.
        if (ga > gb + (rounds - b.length)) winner = 0;
        else if (gb > ga + (rounds - a.length)) winner = 1;
      }
      if (winner === null && a.length === b.length && a.length >= rounds && ga !== gb) winner = ga > gb ? 0 : 1;
      if (winner === null) {
        this.nextAttempt(m);
        return;
      }
      so.winner = winner;
      m.winner = winner;
      m.phase = 'final';
      for (const s of this.skaters) s.out = false;
      events.push({ type: 'final', winner });
      return;
    }
    const shooter = this.skaters[so.shooter];
    if (!shooter) return;
    if (!this.demo && shooter.team === 0) {
      shooter.shootHeld = this.shootHeld;
      shooter.passHeld = true; // no passing in a shootout
    }
    const mine = teamInputs(this, input)[so.shooter] ?? input;
    const act = { ...mine, pass: false, check: false };
    this.stepSkater(shooter, act, dt);
    this.stepShooting(shooter, act, dt, events);
    this.stepGoalies(dt);
    this.stepPuck(dt, events);
    shooter.shootHeld = act.shoot;
    so.timer -= dt;
    const p = this.puck;
    let result: boolean | null = null;
    if (events.some((e) => e.type === 'goal')) result = true;
    else if (events.some((e) => e.type === 'save') || p.state === 'held') result = false;
    else {
      const dir = attackDir(so.team);
      const past = (p.y - goalLineY(this.rink, attackEnd(so.team))) * dir > 6;
      const shot = shooter.shotTick > this.dropTick;
      // One shot: no rebounds, and a puck that has died is done.
      const dead = shot && (shooter.hasPuck || (p.state === 'free' && Math.hypot(p.vx, p.vy) < 8));
      if (past || dead || so.timer <= 0) result = false;
    }
    if (result === null) return;
    so.results[so.team].push(result);
    if (this.referee) signalReferee(this.referee, result ? 'goal' : 'washout');
    so.live = false;
    so.timer = -MATCH.attemptPause;
    shooter.hasPuck = false;
    if (p.state === 'carried') p.state = 'free';
    events.push({ type: 'attempt', team: so.team, goal: result });
  }
}
