/**
 * Skating prototype simulation: one skater, one puck, one rink.
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
import { FEEL, SHOOT } from './tuning';
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
  | { type: 'pickup' }
  | { type: 'goal'; end: RinkEnd; fiveHole: boolean };

export class SkatingSim {
  readonly rink: RinkGeometry;
  /** Shared, live-editable tuning object. */
  tuning: Tuning;
  skater!: Skater;
  puck!: Puck;
  tick = 0;
  goals = 0;
  private goalTimer = 0;
  private shootHeld = false;
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

  reset(): void {
    const { centerX, centerY } = this.rink;
    this.skater = {
      x: centerX,
      y: centerY + 40,
      vx: 0,
      vy: 0,
      facing: -Math.PI / 2,
      hasPuck: false,
      charge: 0,
      pickupCooldown: 0,
      stride: 0,
    };
    this.puck = { x: centerX, y: centerY, vx: 0, vy: 0, state: 'free', z: 0, vz: 0 };
    this.stats = { shots: 0, goals: 0, saves: 0, posts: 0, crossbars: 0, over: 0, fiveHole: 0, last: '' };
    this.rng = new Rng(1).fork('rebounds');
    this.seen = [];
    if (this.goalies.length) this.goalies = [makeGoalie(this.rink, 'top'), makeGoalie(this.rink, 'bottom')];
    this.tick = 0;
    this.goals = 0;
    this.goalTimer = 0;
    this.shootHeld = false;
  }

  /** Put the puck back at centre ice. */
  resetPuck(): void {
    this.skater.hasPuck = false;
    this.skater.charge = 0;
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

  bladeX(): number {
    return this.skater.x + Math.cos(this.skater.facing) * FEEL.stickReach;
  }

  bladeY(): number {
    return this.skater.y + Math.sin(this.skater.facing) * FEEL.stickReach;
  }

  /** Advance one fixed step. Returns what happened, for sound and effects. */
  step(input: SimInput): SimEvent[] {
    const events: SimEvent[] = [];
    const dt = SIM_DT;
    this.tick++;

    this.stepSkater(input, dt);
    this.stepShooting(input, dt, events);
    this.stepGoalies(dt);
    this.stepPuck(dt, events);

    this.shootHeld = input.shoot;
    return events;
  }

  /** Compact state string, for determinism tests. */
  snapshot(): string {
    const s = this.skater;
    const p = this.puck;
    return [this.tick, s.x, s.y, s.vx, s.vy, s.facing, s.hasPuck, p.x, p.y, p.vx, p.vy, p.state, this.goals]
      .map((v) => (typeof v === 'number' ? v.toFixed(6) : String(v)))
      .join('|');
  }

  private stepSkater(input: SimInput, dt: number): void {
    const s = this.skater;
    const t = this.tuning;
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

  private stepShooting(input: SimInput, dt: number, events: SimEvent[]): void {
    const s = this.skater;
    if (!s.hasPuck) {
      s.charge = 0;
      return;
    }
    if (input.shoot) {
      s.charge = Math.min(s.charge + dt, FEEL.maxChargeTime);
      return;
    }
    if (!this.shootHeld) return;

    // Button released with the puck: shoot where the stick is pointed.
    const t = this.tuning;
    const power = this.chargeLevel();
    const factor = FEEL.minShotFactor + (1 - FEEL.minShotFactor) * power;
    let dirX = Math.cos(s.facing);
    let dirY = Math.sin(s.facing);
    if (input.moveX !== 0 || input.moveY !== 0) {
      dirX = input.moveX;
      dirY = input.moveY;
    }
    const p = this.puck;
    p.state = 'free';
    p.x = this.bladeX();
    p.y = this.bladeY();
    p.vx = dirX * t.shotVelocity * factor + s.vx * FEEL.shotInherit;
    p.vy = dirY * t.shotVelocity * factor + s.vy * FEEL.shotInherit;
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
    const s = this.skater;
    const t = this.tuning;

    if (p.state === 'held') return;

    if (p.state === 'inNet') {
      this.goalTimer -= dt;
      if (this.goalTimer <= 0) this.resetPuck();
      return;
    }

    if (p.state === 'carried') {
      p.x = this.bladeX();
      p.y = this.bladeY();
      p.vx = s.vx;
      p.vy = s.vy;
      // The blade cannot poke through the boards.
      collideWithBoards(p, FEEL.puckRadius, 0, this.rink);
      p.vx = s.vx;
      p.vy = s.vy;
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

    // Possession: a loose puck near the blade is collected.
    if (s.pickupCooldown <= 0) {
      const dx = p.x - this.bladeX();
      const dy = p.y - this.bladeY();
      const bodyDx = p.x - s.x;
      const bodyDy = p.y - s.y;
      const nearBlade = Math.hypot(dx, dy) <= t.pickupRadius;
      const nearBody = Math.hypot(bodyDx, bodyDy) <= FEEL.skaterRadius + FEEL.puckRadius;
      const relSpeed = Math.hypot(p.vx - s.vx, p.vy - s.vy);
      if ((nearBlade || nearBody) && relSpeed <= FEEL.pickupMaxRelativeSpeed) {
        p.state = 'carried';
        s.hasPuck = true;
        s.charge = 0;
        events.push({ type: 'pickup' });
      }
    }
  }
}
