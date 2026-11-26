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
import { FEEL } from './tuning';
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
  state: 'free' | 'carried' | 'inNet';
}

export type SimEvent =
  | { type: 'shot'; power: number }
  | { type: 'boards'; speed: number }
  | { type: 'pickup' }
  | { type: 'goal'; end: RinkEnd };

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
    this.puck = { x: centerX, y: centerY, vx: 0, vy: 0, state: 'free' };
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
    this.goalTimer = 0;
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
    s.hasPuck = false;
    s.charge = 0;
    s.pickupCooldown = FEEL.pickupCooldown;
    events.push({ type: 'shot', power });
  }

  private stepPuck(dt: number, events: SimEvent[]): void {
    const p = this.puck;
    const s = this.skater;
    const t = this.tuning;

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

    const drag = Math.exp(-t.puckFriction * dt);
    p.vx *= drag;
    p.vy *= drag;
    if (Math.hypot(p.vx, p.vy) < 1) {
      p.vx = 0;
      p.vy = 0;
    }
    const prevX = p.x;
    const prevY = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const impact = collideWithBoards(p, FEEL.puckRadius, t.boardRestitution, this.rink);
    if (impact > 20) events.push({ type: 'boards', speed: impact });

    for (const end of ['top', 'bottom'] as const) {
      const line = goalLineY(this.rink, end);
      const box = netBox(this.rink, end);
      // A goal needs the whole puck between the posts: the same opening the goal art shows.
      const inMouth = Math.abs(p.x - this.rink.centerX) <= this.rink.mouthHalfWidth - FEEL.puckRadius;
      const cameFromFront = end === 'top' ? prevY > line : prevY < line;
      if (cameFromFront && inMouth) {
        const crossed = end === 'top' ? p.y <= line : p.y >= line;
        if (crossed) {
          p.state = 'inNet';
          p.vx = 0;
          p.vy = 0;
          p.y = end === 'top' ? line - this.rink.netDepth / 2 : line + this.rink.netDepth / 2;
          this.goals++;
          this.goalTimer = FEEL.goalPause;
          events.push({ type: 'goal', end });
          return;
        }
        continue;
      }
      if (collideWithBox(p, prevX, prevY, FEEL.puckRadius, t.boardRestitution, box)) {
        events.push({ type: 'boards', speed: Math.hypot(p.vx, p.vy) });
      }
    }

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
