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
import { AIM, FEEL, SHOOT, TEAM } from './tuning';
import { AI, faceoffSpot, teamInputs } from './teamAi';
import type { Role } from './teamAi';
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
  aiSide: -1 | 1;
  aiWait: number;
  /** Ticks he has been pushing without getting anywhere, and ticks left of stepping around whatever is in the way. */
  aiStill: number;
  aiDodge: number;
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
  | { type: 'shot'; power: number; kind: ShotKind }
  | { type: 'save'; kind: SaveKind; end: RinkEnd }
  | { type: 'post'; end: RinkEnd }
  | { type: 'crossbar'; end: RinkEnd }
  | { type: 'over'; end: RinkEnd }
  | { type: 'boards'; speed: number }
  | { type: 'pickup'; team: 0 | 1 }
  | { type: 'pass'; team: 0 | 1 }
  | { type: 'poke'; team: 0 | 1 }
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
  /** The computer plays every skater, the player's included. For tests and measurements. */
  demo = false;
  aiRng = new Rng(7).fork('team-ai');
  private aimRng = new Rng(3).fork('aim');
  puck!: Puck;
  tick = 0;
  goals = 0;
  private goalTimer = 0;
  /** The player's own button states: they stay with the player when control moves to another skater. */
  private shootHeld = false;
  private passHeld = false;
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
      possessTick: -1000, shotTick: -1000, aiHold: 0, aiSide: 1, aiWait: 0, aiStill: 0, aiDodge: 0,
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

  /** Two teams of five, or back to one skater. Restarts play. */
  setTeams(on: boolean): void {
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
  }

  /** Put the puck back at centre ice. With teams, everyone lines up for it again. */
  resetPuck(): void {
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

    // Pass button without the puck: take control of the teammate nearest the puck.
    if (this.teams && input.pass && !this.passHeld && !this.skater.hasPuck) this.switchControl();
    // The player's button history follows him to whichever skater he controls.
    if (!this.demo) {
      this.skater.shootHeld = this.shootHeld;
      this.skater.passHeld = this.passHeld;
    }
    const inputs = this.teams ? teamInputs(this, input) : [input];
    this.skaters.forEach((s, i) => this.stepSkater(s, inputs[i] ?? input, dt));
    if (this.teams) this.separate();
    // A shot or pass can hand control to another skater: everyone acts on the buttons he was given this step.
    const before = this.skaters.slice();
    before.forEach((s, i) => this.stepShooting(s, inputs[i] ?? input, dt, events));
    this.stepGoalies(dt);
    this.stepPuck(dt, events);
    if (this.passTarget >= 0 && (this.passTimer -= dt) <= 0) this.passTarget = -1;

    before.forEach((s, i) => {
      s.shootHeld = (inputs[i] ?? input).shoot;
      s.passHeld = !!(inputs[i] ?? input).pass;
    });
    this.shootHeld = input.shoot;
    this.passHeld = !!input.pass;
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
      if (s.team !== 0) continue;
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
      const shed = Math.exp(-t.turnResponse * dt);
      slideX *= shed;
      slideY *= shed;
      // Pushing against travel brakes harder than a normal stride accelerates.
      along += (along < 0 ? t.deceleration : t.acceleration) * dt;
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
    if (speed > t.maxSpeed) {
      const k = t.maxSpeed / speed;
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
  private pass(s: Skater, input: SimInput, events: SimEvent[]): void {
    let dirX = Math.cos(s.facing);
    let dirY = Math.sin(s.facing);
    if (input.moveX !== 0 || input.moveY !== 0) {
      dirX = input.moveX;
      dirY = input.moveY;
    }
    let mate: Skater | null = null;
    let best = -Infinity;
    for (const m of this.skaters) {
      if (m === s || m.team !== s.team) continue;
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
    const bx = this.bladeX(s);
    const by = this.bladeY(s);
    if (mate) {
      // Lead him: aim where he will be when the puck gets there.
      const lead = Math.min(TEAM.passLead, Math.hypot(mate.x - bx, mate.y - by) / TEAM.passSpeed);
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
    p.vx = dirX * TEAM.passSpeed;
    p.vy = dirY * TEAM.passSpeed;
    p.z = 0;
    p.vz = 0;
    s.hasPuck = false;
    s.charge = 0;
    s.pickupCooldown = FEEL.pickupCooldown;
    this.stats.last = 'Pass';
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
   */
  private aimAtCorner(s: Skater, dirX: number, dirY: number, sideways: number): { x: number; y: number } | null {
    if (!this.aimAssist || sideways === 0 || dirY === 0) return null;
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
    if (!s.hasPuck) {
      s.charge = 0;
      return;
    }
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
    const t = this.tuning;
    const power = Math.min(s.charge / FEEL.maxChargeTime, 1);
    const factor = FEEL.minShotFactor + (1 - FEEL.minShotFactor) * power;
    let dirX = Math.cos(s.facing);
    let dirY = Math.sin(s.facing);
    if (input.moveX !== 0 || input.moveY !== 0) {
      dirX = input.moveX;
      dirY = input.moveY;
    }
    const p = this.puck;
    p.state = 'free';
    p.x = this.bladeX(s);
    p.y = this.bladeY(s);
    const speed = t.shotVelocity * factor;
    const inheritX = s.vx * FEEL.shotInherit;
    const inheritY = s.vy * FEEL.shotInherit;
    p.vx = dirX * speed + inheritX;
    p.vy = dirY * speed + inheritY;
    const aim = this.aimAtCorner(s, dirX, dirY, input.moveX);
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
    this.stats.last = kind === 'slap' ? 'Slap shot' : 'Wrist shot';
    this.beatGoalie = false;
    this.throughFiveHole = false;
    s.hasPuck = false;
    s.charge = 0;
    s.pickupCooldown = FEEL.pickupCooldown;
    s.shotTick = this.tick;
    this.passTarget = -1;
    events.push({ type: 'shot', power, kind });
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
      if (this.teams) this.pokeCheck(s, events);
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
          if (this.teams) this.score[end === 'top' ? 0 : 1]++;
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
      if (k.pickupCooldown > 0) continue;
      const blade = Math.hypot(p.x - this.bladeX(k), p.y - this.bladeY(k));
      const nearBlade = blade <= t.pickupRadius;
      const nearBody = Math.hypot(p.x - k.x, p.y - k.y) <= FEEL.skaterRadius + FEEL.puckRadius;
      const relSpeed = Math.hypot(p.vx - k.vx, p.vy - k.vy);
      if ((nearBlade || nearBody) && relSpeed <= FEEL.pickupMaxRelativeSpeed && blade < nearest) {
        nearest = blade;
        taker = k;
      }
    }
    // A puck in the air over the skaters' sticks cannot be collected.
    if (taker && (!this.teams || p.z <= TEAM.pickupHeight)) {
      p.state = 'carried';
      p.z = 0;
      p.vz = 0;
      taker.hasPuck = true;
      taker.charge = 0;
      taker.possessTick = this.tick;
      this.passTarget = -1;
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
}
