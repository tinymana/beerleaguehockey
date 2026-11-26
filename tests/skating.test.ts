import { describe, expect, it } from 'vitest';
import { NO_INPUT, quantize8 } from '../src/match/sim/input';
import type { SimInput } from '../src/match/sim/input';
import { SIM_DT, SkatingSim } from '../src/match/sim/skatingSim';
import { DEFAULT_TUNING, FEEL, TUNING_SPECS, cloneTuning, SHOOT } from '../src/match/sim/tuning';

const UP: SimInput = { moveX: 0, moveY: -1, shoot: false };
const DOWN: SimInput = { moveX: 0, moveY: 1, shoot: false };
const RIGHT: SimInput = { moveX: 1, moveY: 0, shoot: false };
const LEFT: SimInput = { moveX: -1, moveY: 0, shoot: false };

function run(sim: SkatingSim, input: SimInput, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / SIM_DT); i++) sim.step(input);
}

function speed(sim: SkatingSim): number {
  return Math.hypot(sim.skater.vx, sim.skater.vy);
}

/** Sim with the puck parked out of the way so skating tests are not disturbed. */
function skatingOnly(tuning = cloneTuning()): SkatingSim {
  const sim = new SkatingSim(tuning);
  sim.puck.x = sim.rink.left + 60;
  sim.puck.y = sim.rink.bottom - 200;
  return sim;
}

describe('eight-direction input', () => {
  it('returns unit vectors in eight directions', () => {
    const seen = new Set<string>();
    for (let a = 0; a < 360; a += 5) {
      const r = (a * Math.PI) / 180;
      const q = quantize8(Math.cos(r), Math.sin(r));
      expect(Math.hypot(q.x, q.y)).toBeCloseTo(1, 6);
      seen.add(`${q.x.toFixed(3)},${q.y.toFixed(3)}`);
    }
    expect(seen.size).toBe(8);
  });

  it('ignores input inside the deadzone', () => {
    expect(quantize8(0.1, -0.1)).toEqual({ x: 0, y: 0 });
  });

  it('skates diagonally no faster than straight', () => {
    const straight = skatingOnly();
    const diagonal = skatingOnly();
    const d = quantize8(1, -1);
    run(straight, RIGHT, 1);
    run(diagonal, { moveX: d.x, moveY: d.y, shoot: false }, 1);
    expect(speed(diagonal)).toBeCloseTo(speed(straight), 3);
  });
});

describe('skating', () => {
  it('accelerates from rest up to max speed and no further', () => {
    const sim = skatingOnly();
    sim.step(UP);
    const first = speed(sim);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(DEFAULT_TUNING.maxSpeed / 4);
    run(sim, UP, 0.2);
    expect(speed(sim)).toBeGreaterThan(first);
    run(sim, UP, 1);
    expect(speed(sim)).toBeCloseTo(DEFAULT_TUNING.maxSpeed, 3);
  });

  it('carries momentum and glides to a stop with no input', () => {
    const sim = skatingOnly();
    run(sim, UP, 1);
    const y0 = sim.skater.y;
    run(sim, NO_INPUT, 0.5);
    expect(sim.skater.y).toBeLessThan(y0 - 30);
    expect(speed(sim)).toBeGreaterThan(0);
    expect(speed(sim)).toBeLessThan(DEFAULT_TUNING.maxSpeed);
    run(sim, NO_INPUT, 12);
    expect(speed(sim)).toBe(0);
  });

  it('glides further on lower ice friction', () => {
    const slick = skatingOnly({ ...cloneTuning(), iceFriction: 0.2 });
    const sticky = skatingOnly({ ...cloneTuning(), iceFriction: 2 });
    for (const sim of [slick, sticky]) {
      run(sim, RIGHT, 0.4);
      run(sim, NO_INPUT, 0.5);
    }
    expect(slick.skater.x).toBeGreaterThan(sticky.skater.x);
  });

  it('brakes faster by pushing against travel than by gliding', () => {
    const braking = skatingOnly();
    const gliding = skatingOnly();
    run(braking, RIGHT, 0.6);
    run(gliding, RIGHT, 0.6);
    run(braking, LEFT, 0.15);
    run(gliding, NO_INPUT, 0.15);
    expect(braking.skater.vx).toBeLessThan(gliding.skater.vx);
  });

  it('slides through a turn, more so with low turning responsiveness', () => {
    const loose = skatingOnly({ ...cloneTuning(), turnResponse: 1 });
    const tight = skatingOnly({ ...cloneTuning(), turnResponse: 15 });
    for (const sim of [loose, tight]) {
      run(sim, RIGHT, 0.6);
      run(sim, UP, 0.2);
    }
    // Both still carry some of the old direction; the loose setup carries more.
    expect(loose.skater.vx).toBeGreaterThan(tight.skater.vx);
    expect(tight.skater.vx).toBeGreaterThanOrEqual(0);
    expect(loose.skater.vy).toBeLessThan(0);
  });

  it('turns the body toward the held direction', () => {
    const sim = skatingOnly();
    run(sim, RIGHT, 0.5);
    expect(sim.skater.facing).toBeCloseTo(0, 5);
    run(sim, DOWN, 0.5);
    expect(sim.skater.facing).toBeCloseTo(Math.PI / 2, 5);
  });
});

describe('boards', () => {
  it('keeps the skater inside the rink in every direction, corners included', () => {
    for (let a = 0; a < 8; a++) {
      const sim = skatingOnly();
      const r = (a * Math.PI) / 4;
      const move = quantize8(Math.cos(r), Math.sin(r));
      run(sim, { moveX: move.x, moveY: move.y, shoot: false }, 8);
      const { rink, skater } = sim;
      expect(skater.x).toBeGreaterThanOrEqual(rink.left + FEEL.skaterRadius - 1e-6);
      expect(skater.x).toBeLessThanOrEqual(rink.right - FEEL.skaterRadius + 1e-6);
      expect(skater.y).toBeGreaterThanOrEqual(rink.top + FEEL.skaterRadius - 1e-6);
      expect(skater.y).toBeLessThanOrEqual(rink.bottom - FEEL.skaterRadius + 1e-6);
      // Corner check: never outside the rounded corner arc.
      const cr = rink.cornerRadius;
      const cx = skater.x < rink.left + cr ? rink.left + cr : skater.x > rink.right - cr ? rink.right - cr : skater.x;
      const cy = skater.y < rink.top + cr ? rink.top + cr : skater.y > rink.bottom - cr ? rink.bottom - cr : skater.y;
      expect(Math.hypot(skater.x - cx, skater.y - cy)).toBeLessThanOrEqual(cr - FEEL.skaterRadius + 1e-6);
    }
  });

  it('rebounds the puck off the side boards, keeping the restitution share of speed', () => {
    const sim = new SkatingSim({ ...cloneTuning(), puckFriction: 0, boardRestitution: 0.5 });
    sim.puck.x = sim.rink.left + 30;
    sim.puck.y = sim.rink.centerY - 150;
    sim.puck.vx = -300;
    const events = [];
    for (let i = 0; i < 30; i++) events.push(...sim.step(NO_INPUT));
    expect(sim.puck.vx).toBeCloseTo(150, 3);
    expect(sim.puck.x).toBeGreaterThan(sim.rink.left);
    expect(events.some((e) => e.type === 'boards')).toBe(true);
  });

  it('keeps a hard-shot puck inside the rink for a long time', () => {
    const sim = new SkatingSim({ ...cloneTuning(), puckFriction: 0, boardRestitution: 1 });
    sim.skater.x = sim.rink.left + 40;
    sim.skater.y = sim.rink.bottom - 150;
    sim.puck.x = sim.rink.centerX + 37;
    sim.puck.y = sim.rink.centerY + 91;
    sim.puck.vx = 611;
    sim.puck.vy = -437;
    sim.skater.pickupCooldown = 1e9;
    for (let i = 0; i < 60 * 30; i++) {
      sim.step(NO_INPUT);
      if (sim.puck.state !== 'free') sim.resetPuck();
      expect(sim.puck.x).toBeGreaterThanOrEqual(sim.rink.left);
      expect(sim.puck.x).toBeLessThanOrEqual(sim.rink.right);
      expect(sim.puck.y).toBeGreaterThanOrEqual(sim.rink.top);
      expect(sim.puck.y).toBeLessThanOrEqual(sim.rink.bottom);
    }
  });

  it('slows a loose puck with puck friction until it rests', () => {
    const sim = new SkatingSim(cloneTuning());
    sim.skater.pickupCooldown = 1e9;
    sim.puck.y = sim.rink.centerY - 100;
    sim.puck.vx = 200;
    run(sim, NO_INPUT, 0.5);
    const v = Math.hypot(sim.puck.vx, sim.puck.vy);
    expect(v).toBeLessThan(200);
    expect(v).toBeGreaterThan(100);
    run(sim, NO_INPUT, 20);
    expect(Math.hypot(sim.puck.vx, sim.puck.vy)).toBe(0);
  });
});

describe('possession and shooting', () => {
  it('collects a loose puck when the blade reaches it', () => {
    const sim = new SkatingSim(cloneTuning());
    expect(sim.skater.hasPuck).toBe(false);
    const events = [];
    for (let i = 0; i < 60 && !sim.skater.hasPuck; i++) events.push(...sim.step(UP));
    expect(sim.skater.hasPuck).toBe(true);
    expect(sim.puck.state).toBe('carried');
    expect(events.some((e) => e.type === 'pickup')).toBe(true);
  });

  it('does not collect a puck outside the pickup radius', () => {
    const sim = new SkatingSim({ ...cloneTuning(), pickupRadius: 4 });
    sim.puck.x = sim.bladeX() + 15;
    sim.puck.y = sim.bladeY();
    run(sim, NO_INPUT, 0.5);
    expect(sim.skater.hasPuck).toBe(false);
    sim.tuning.pickupRadius = 20;
    sim.step(NO_INPUT);
    expect(sim.skater.hasPuck).toBe(true);
  });

  it('carries the puck on the blade while skating', () => {
    const sim = new SkatingSim(cloneTuning());
    run(sim, UP, 1);
    expect(sim.skater.hasPuck).toBe(true);
    expect(Math.hypot(sim.puck.x - sim.bladeX(), sim.puck.y - sim.bladeY())).toBeLessThan(0.001);
  });

  it('shoots on release, harder after a longer wind-up', () => {
    const shotSpeed = (holdSeconds: number): number => {
      const sim = new SkatingSim(cloneTuning());
      run(sim, UP, 0.4);
      run(sim, NO_INPUT, 15); // glide to a complete stop so the shot inherits no skater speed
      expect(sim.skater.hasPuck).toBe(true);
      expect(Math.hypot(sim.skater.vx, sim.skater.vy)).toBe(0);
      run(sim, { ...NO_INPUT, shoot: true }, holdSeconds);
      expect(sim.skater.hasPuck).toBe(true);
      const events = sim.step(NO_INPUT);
      expect(events.some((e) => e.type === 'shot')).toBe(true);
      expect(sim.skater.hasPuck).toBe(false);
      expect(sim.puck.vy).toBeLessThan(0);
      return Math.hypot(sim.puck.vx, sim.puck.vy);
    };
    const tap = shotSpeed(SIM_DT);
    const full = shotSpeed(1);
    expect(full).toBeGreaterThan(tap);
    // A shot leaves the ice, so for its first step it is slowed by the air and not by the ice.
    expect(full).toBeCloseTo(DEFAULT_TUNING.shotVelocity * Math.exp(-SHOOT.airDrag * SIM_DT), 1);
  });

  it('does not instantly re-collect a puck it just shot', () => {
    const sim = new SkatingSim(cloneTuning());
    run(sim, UP, 0.4);
    run(sim, { ...NO_INPUT, shoot: true }, 0.1);
    sim.step(NO_INPUT);
    sim.step(NO_INPUT);
    expect(sim.skater.hasPuck).toBe(false);
  });

  it('scores when the puck crosses the goal line between the posts, then resets the puck', () => {
    const sim = new SkatingSim(cloneTuning());
    sim.skater.x = sim.rink.left + 40;
    sim.skater.y = sim.rink.centerY;
    sim.puck.x = sim.rink.centerX;
    sim.puck.y = sim.rink.top + 120;
    sim.puck.vy = -400;
    const events = [];
    for (let i = 0; i < 60; i++) events.push(...sim.step(NO_INPUT));
    expect(events.filter((e) => e.type === 'goal')).toHaveLength(1);
    expect(sim.goals).toBe(1);
    run(sim, NO_INPUT, FEEL.goalPause + 0.1);
    expect(sim.puck.state).toBe('free');
    expect(sim.puck.y).toBe(sim.rink.centerY);
  });

  it('does not score from behind the net', () => {
    const sim = new SkatingSim({ ...cloneTuning(), puckFriction: 0 });
    sim.skater.x = sim.rink.left + 40;
    sim.skater.y = sim.rink.centerY;
    sim.puck.x = sim.rink.centerX;
    sim.puck.y = sim.rink.top + 8;
    sim.puck.vy = 300;
    run(sim, NO_INPUT, 1);
    expect(sim.goals).toBe(0);
  });
});

describe('determinism and tuning', () => {
  it('replays identically from the same inputs', () => {
    const script = (i: number): SimInput => {
      const d = quantize8(Math.cos(i / 37), Math.sin(i / 23));
      return { moveX: d.x, moveY: d.y, shoot: i % 97 > 80 };
    };
    const a = new SkatingSim(cloneTuning());
    const b = new SkatingSim(cloneTuning());
    for (let i = 0; i < 3000; i++) {
      a.step(script(i));
      b.step(script(i));
    }
    expect(a.snapshot()).toBe(b.snapshot());
    expect(a.tick).toBe(3000);
  });

  it('reads tuning live, so panel changes apply without a restart', () => {
    const sim = skatingOnly();
    run(sim, RIGHT, 0.7);
    expect(speed(sim)).toBeCloseTo(DEFAULT_TUNING.maxSpeed, 3);
    sim.tuning.maxSpeed = 90;
    sim.step(RIGHT);
    expect(speed(sim)).toBeCloseTo(90, 3);
  });

  it('exposes every tuning value in the panel spec, with defaults inside range', () => {
    const keys = Object.keys(DEFAULT_TUNING).sort();
    expect(TUNING_SPECS.map((s) => s.key).sort()).toEqual(keys);
    for (const spec of TUNING_SPECS) {
      expect(DEFAULT_TUNING[spec.key]).toBeGreaterThanOrEqual(spec.min);
      expect(DEFAULT_TUNING[spec.key]).toBeLessThanOrEqual(spec.max);
    }
  });
});
