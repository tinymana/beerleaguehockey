import { describe, expect, it } from 'vitest';
import { GOALIE, goalieDepth, goalieTarget, makeGoalie, reachShare, resolveShot, stepGoalie } from '../src/match/sim/goalie';
import { PLAY_SCALE as S, RINK, goalLineY } from '../src/match/sim/rink';
import { SIM_DT, SkatingSim } from '../src/match/sim/skatingSim';
import type { SimEvent } from '../src/match/sim/skatingSim';
import { SHOOT, cloneTuning } from '../src/match/sim/tuning';

const IDLE = { moveX: 0, moveY: 0, shoot: false } as never;
const line = goalLineY(RINK, 'top');

/**
 * Fire a loose puck at the north net from straight out, at a sideways offset, speed and height.
 * Distances, speeds and heights are given at the 48 px design scale and shrunk to the game's scale, so the same
 * shots are tested whatever size the player and net are.
 */
function fire(opts: { from?: number; aim?: number; speed?: number; z?: number; vz?: number; goalies?: boolean; setup?: (sim: SkatingSim) => void }): { sim: SkatingSim; events: SimEvent[] } {
  const sim = new SkatingSim(cloneTuning());
  sim.setGoalies(opts.goalies ?? true);
  sim.skater.x = RINK.centerX;
  sim.skater.y = RINK.centerY + 200; // well out of the way
  const p = sim.puck;
  const from = (opts.from ?? 0) * S;
  const aim = opts.aim === undefined ? from : opts.aim * S;
  const distance = 60 * S;
  p.state = 'free';
  p.x = RINK.centerX + from;
  p.y = line + distance;
  const speed = (opts.speed ?? 320) * S;
  const dx = aim - from;
  const len = Math.hypot(dx, distance);
  p.vx = (dx / len) * speed;
  p.vy = (-distance / len) * speed;
  p.z = (opts.z ?? 0) * S;
  p.vz = (opts.vz ?? 0) * S;
  opts.setup?.(sim);
  const events: SimEvent[] = [];
  for (let i = 0; i < 90; i++) {
    events.push(...sim.step(IDLE));
    if (events.some((e) => e.type === 'goal' || e.type === 'save' || e.type === 'post' || e.type === 'crossbar' || e.type === 'over')) break;
  }
  return { sim, events };
}
const kinds = (events: SimEvent[]): string[] => events.filter((e) => e.type !== 'boards').map((e) => (e.type === 'save' ? `save:${e.kind}` : e.type));

describe('shots (Decision 78)', () => {
  it('a quick release is a wrist shot that climbs; a full wind-up is a slap shot that is harder and lower', () => {
    const shot = (hold: number) => {
      const sim = new SkatingSim(cloneTuning());
      for (let i = 0; i < 30; i++) sim.step({ moveX: 0, moveY: -1, shoot: false } as never);
      for (let i = 0; i < 900 && !sim.skater.hasPuck; i++) sim.step(IDLE);
      for (let i = 0; i < Math.round(hold / SIM_DT); i++) sim.step({ moveX: 0, moveY: 0, shoot: true } as never);
      const e = sim.step(IDLE).find((x) => x.type === 'shot');
      return { kind: e && e.type === 'shot' ? e.kind : null, speed: Math.hypot(sim.puck.vx, sim.puck.vy), vz: sim.puck.vz, shots: sim.stats.shots };
    };
    const wrist = shot(SIM_DT);
    const slap = shot(1);
    expect(wrist.kind).toBe('wrist');
    expect(slap.kind).toBe('slap');
    expect(slap.speed).toBeGreaterThan(wrist.speed);
    expect(wrist.vz).toBeGreaterThan(slap.vz);
    expect(wrist.shots).toBe(1);
    expect(SHOOT.wristLift).toBeGreaterThan(SHOOT.slapLift);
  });

  it('a lifted puck rises, falls and lands, and only the ice slows it hard', () => {
    const sim = new SkatingSim(cloneTuning());
    sim.skater.y = RINK.centerY + 250;
    const p = sim.puck;
    p.x = RINK.centerX;
    p.y = RINK.centerY;
    p.vx = 0;
    p.vy = -200;
    p.z = 1;
    p.vz = SHOOT.wristLift;
    let peak = 0, airborne = 0;
    for (let i = 0; i < 200; i++) {
      sim.step(IDLE);
      peak = Math.max(peak, p.z);
      if (p.z > 0) airborne++;
    }
    // A wrist shot's peak is a little above the crossbar, at any scale.
    expect(peak).toBeGreaterThan(RINK.netFrontHeight);
    expect(peak).toBeLessThan(RINK.netFrontHeight * 1.25);
    expect(p.z).toBe(0);
    expect(airborne).toBeGreaterThan(60);
  });
});

describe('the goal frame (Decision 78)', () => {
  it('scores under the bar, rings the crossbar at its height, and sails over above it', () => {
    expect(kinds(fire({ goalies: false, z: 10 }).events)).toEqual(['goal']);
    // Thrown so that it arrives level with the bar (it falls about two pixels on the way).
    expect(kinds(fire({ goalies: false, z: RINK.netFrontHeight / S, vz: 11 }).events)).toEqual(['crossbar']);
    const over = fire({ goalies: false, z: RINK.netFrontHeight / S + 10, vz: 20 });
    expect(kinds(over.events)).toEqual(['over']);
    expect(over.sim.goals).toBe(0);
    expect(over.sim.stats.over).toBe(1);
  });

  it('a post sends the puck back out and counts nothing', () => {
    const { sim, events } = fire({ goalies: false, from: (RINK.mouthHalfWidth + 1) / S });
    expect(kinds(events)).toEqual(['post']);
    expect(sim.puck.vy).toBeGreaterThan(0);
    expect(sim.goals).toBe(0);
    expect(sim.stats.posts).toBe(1);
  });
});

describe('the basic goalie (Decision 78)', () => {
  it('is sized to the 48 px net: three feet wide, standing inside the crease, and cannot cover the whole net standing still', () => {
    const foot = (RINK.mouthHalfWidth * 2) / 6;
    expect(GOALIE.halfBody * 2).toBe(3 * foot);
    expect(GOALIE.depthOut).toBeGreaterThan(2 * foot);
    expect(GOALIE.depthOut).toBeLessThan(RINK.mouthHalfWidth * 2); // inside a crease as deep as the mouth is wide
    // Centred, even at full stretch he leaves the corners: positioning has to do the rest.
    expect(GOALIE.halfBody + GOALIE.gloveReach).toBeLessThan(RINK.mouthHalfWidth - 2);
    expect(GOALIE.halfBody + GOALIE.padReach).toBeLessThan(RINK.mouthHalfWidth - 2);
  });

  it('plays the angle: on the line between the puck and the middle of the net, never outside the posts', () => {
    const g = makeGoalie(RINK, 'top');
    expect(g.y).toBe(line + GOALIE.depthOut);
    expect(goalieTarget(RINK, g, RINK.centerX, line + 100)).toBe(RINK.centerX);
    const limit = RINK.mouthHalfWidth - GOALIE.halfBody / 2;
    expect(goalieTarget(RINK, g, RINK.centerX + 40, line + 100)).toBeCloseTo(RINK.centerX + (40 * GOALIE.depthOut) / 100, 6);
    // From wide he goes to the near post and hugs it.
    expect(goalieTarget(RINK, g, RINK.centerX + 500, line + 12)).toBe(RINK.centerX + limit);
    expect(goalieTarget(RINK, g, RINK.centerX - 500, line + 12)).toBe(RINK.centerX - limit);
    // Puck behind the net or far up the ice: square to the middle.
    expect(goalieTarget(RINK, g, RINK.centerX + 60, line - 5)).toBe(RINK.centerX);
    expect(goalieTarget(RINK, g, RINK.centerX + 60, line + GOALIE.trackingRange + 1)).toBe(RINK.centerX);
  });

  it('moves no faster than his speed', () => {
    const g = makeGoalie(RINK, 'top');
    stepGoalie(RINK, g, RINK.centerX + 400, line + 12, SIM_DT);
    expect(g.x - RINK.centerX).toBeCloseTo(GOALIE.speed * SIM_DT, 9);
    expect(g.vx).toBeCloseTo(GOALIE.speed, 6);
  });

  it('saves by where the puck arrives: pads low, body high, glove on his left, blocker on his right', () => {
    const north = makeGoalie(RINK, 'top');
    expect(north.gloveSide).toBe(1);
    expect(makeGoalie(RINK, 'bottom').gloveSide).toBe(-1);
    expect(resolveShot(north, 0, 2)).toEqual({ saved: 'pad' });
    expect(resolveShot(north, 3, 18)).toEqual({ saved: 'body' });
    expect(resolveShot(north, GOALIE.halfBody + 4, 18)).toEqual({ saved: 'glove' });
    expect(resolveShot(north, -(GOALIE.halfBody + 4), 18)).toEqual({ saved: 'blocker' });
    expect(resolveShot(north, GOALIE.halfBody + 3, 3)).toEqual({ saved: 'pad' });
    // Beaten: wide of his reach, low past the pad, or over everything.
    expect(resolveShot(north, GOALIE.halfBody + GOALIE.gloveReach + 1, 18)).toEqual({ saved: null, fiveHole: false });
    expect(resolveShot(north, GOALIE.halfBody + GOALIE.padReach + 1, 3)).toEqual({ saved: null, fiveHole: false });
    expect(resolveShot(north, 0, GOALIE.reachHeight + 1)).toEqual({ saved: null, fiveHole: false });
    // The glove reaches a little further than the blocker.
    expect(GOALIE.gloveReach).toBeGreaterThan(GOALIE.blockerReach);
  });

  it('opens the five-hole only while he is sliding', () => {
    const g = makeGoalie(RINK, 'top');
    expect(resolveShot(g, 0, 1)).toEqual({ saved: 'pad' });
    g.vx = GOALIE.fiveHoleSpeed + 1;
    expect(resolveShot(g, 0, 1)).toEqual({ saved: null, fiveHole: true });
    expect(resolveShot(g, 0, GOALIE.fiveHoleHeight + 1)).toEqual({ saved: 'pad' });
    expect(resolveShot(g, GOALIE.fiveHoleHalf + 1, 1)).toEqual({ saved: 'pad' });
  });

  it('stops a shot straight at him, kicks out a rebound from the pads, and holds a glove save before dropping the puck', () => {
    const pad = fire({ z: 0 });
    expect(kinds(pad.events)).toEqual(['save:pad']);
    expect(pad.sim.puck.state).toBe('free');
    expect(pad.sim.puck.vy).toBeGreaterThan(0); // coming back out
    expect(pad.sim.stats.saves).toBe(1);
    const held = fire({ z: 18, vz: 8 });
    expect(kinds(held.events)).toEqual(['save:body']);
    expect(held.sim.puck.state).toBe('held');
    for (let i = 0; i < Math.round(GOALIE.holdTime / SIM_DT) + 2; i++) held.sim.step(IDLE);
    expect(held.sim.puck.state).toBe('free');
    expect(held.sim.goals).toBe(0);
  });

  it('is beaten when he is caught on the wrong side, and the same shot always ends the same way', () => {
    // He was covering a puck on the right; the shot comes from the left before he can get across.
    const caught = (sim: SkatingSim): void => {
      sim.goalies[0]!.x = RINK.centerX + 16 * S;
    };
    const quick = fire({ from: -50, aim: -14, speed: 480, setup: caught });
    expect(kinds(quick.events)).toEqual(['goal']);
    expect(fire({ from: -50, aim: -14, speed: 480, setup: caught }).sim.snapshot()).toBe(quick.sim.snapshot());
    // Two rebounds from identical shots are identical too: rebound variation is seeded.
    expect(fire({ z: 0 }).sim.snapshot()).toBe(fire({ z: 0 }).sim.snapshot());
  });

  it('covers the sides when he is set: the same shots that beat him out of position are stopped', () => {
    const settle = (sim: SkatingSim): void => {
      // Let him read the puck where it is before it is shot.
      const p = sim.puck;
      const hold = { x: p.x, y: p.y, vx: p.vx, vy: p.vy };
      for (let i = 0; i < 90; i++) {
        Object.assign(p, { x: hold.x, y: hold.y, vx: 0, vy: 0 });
        sim.step(IDLE);
      }
      Object.assign(p, hold);
    };
    // From the left circle, set: near post and far post are both covered.
    expect(kinds(fire({ from: -50, aim: -14, speed: 480, setup: settle }).events)[0]).toMatch(/^save/);
    expect(kinds(fire({ from: -50, aim: -20, speed: 480, setup: settle }).events)[0]).toMatch(/^save/);
    // From a sharp angle he hugs the post: nothing slips between him and it.
    const sharp = fire({ from: -90, aim: -21, speed: 420, setup: settle });
    expect(sharp.sim.goals).toBe(0);
    // From the slot a quick shot into a corner still beats him: he cannot stretch that far in time.
    const corner = fire({ from: 0, aim: 20, speed: 520, setup: settle });
    expect(kinds(corner.events)).toEqual(['goal']);
  });

  it('needs time to stretch: his body is always there, his glove and pads are not', () => {
    const g = makeGoalie(RINK, 'top');
    const wide = GOALIE.halfBody + GOALIE.gloveReach - 1;
    expect(resolveShot(g, wide, 18, 1)).toEqual({ saved: 'glove' });
    expect(resolveShot(g, wide, 18, GOALIE.reaction)).toEqual({ saved: null, fiveHole: false });
    expect(resolveShot(g, GOALIE.halfBody - 1, 18, 0)).toEqual({ saved: 'body' });
    expect(reachShare(GOALIE.reaction)).toBe(0);
    expect(reachShare(GOALIE.reaction + GOALIE.reachTime)).toBe(1);
    // From a sharp angle he backs onto his line.
    expect(goalieDepth(200)).toBe(GOALIE.depthOut);
    expect(goalieDepth(10)).toBeLessThan(GOALIE.depthOut / 2);
  });

  it('leaves the skating prototype exactly as it was when goalies are off', () => {
    const sim = new SkatingSim(cloneTuning());
    expect(sim.goalies).toEqual([]);
    expect(kinds(fire({ goalies: false }).events)).toEqual(['goal']);
  });
});
