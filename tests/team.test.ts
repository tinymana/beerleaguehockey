import { describe, expect, it } from 'vitest';
import { RINK, goalLineY } from '../src/match/sim/rink';
import { SkatingSim } from '../src/match/sim/skatingSim';
import type { SimEvent } from '../src/match/sim/skatingSim';
import { attackDir, faceoffSpot, formationSpot } from '../src/match/sim/teamAi';
import { AIM, FEEL, TEAM, cloneTuning } from '../src/match/sim/tuning';

const IDLE = { moveX: 0, moveY: 0, shoot: false };
const D = Math.SQRT1_2;
const line = goalLineY(RINK, 'top');

function teams(demo = false): SkatingSim {
  const sim = new SkatingSim(cloneTuning());
  sim.demo = demo;
  sim.setTeams(true);
  return sim;
}

/** Put the puck on a skater's stick. */
function give(sim: SkatingSim, index: number): void {
  for (const s of sim.skaters) s.hasPuck = false;
  const s = sim.skaters[index];
  if (!s) throw new Error('no skater');
  s.hasPuck = true;
  s.possessTick = sim.tick;
  sim.puck.state = 'carried';
  if (s.team === 0) sim.controlled = index;
}

describe('shot aim help (Nov 26 feedback: corner shots are hard to aim on a keyboard)', () => {
  /** Stand in the slot with the puck, let the goalie set, and release a wrist shot with a direction held. */
  function slotShot(moveX: number, assist: boolean, offset = 0): { sim: SkatingSim; xAtLine: number } {
    const sim = new SkatingSim(cloneTuning());
    sim.aimAssist = assist;
    const s = sim.skater;
    s.x = RINK.centerX + offset;
    s.y = line + 60;
    s.facing = -Math.PI / 2;
    sim.puck.x = sim.bladeX();
    sim.puck.y = sim.bladeY();
    sim.step(IDLE);
    expect(s.hasPuck).toBe(true);
    sim.step({ moveX: 0, moveY: 0, shoot: true });
    sim.step({ moveX: moveX * (moveX ? D : 1), moveY: moveX ? -D : -1, shoot: false });
    const p = sim.puck;
    return { sim, xAtLine: p.x + (p.vx / p.vy) * (line - p.y) };
  }

  it('sends a shot with a diagonal held to that side of the net, inside the spread', () => {
    const corner = RINK.mouthHalfWidth - FEEL.puckRadius - AIM.cornerInset;
    for (const side of [-1, 1]) {
      const { xAtLine } = slotShot(side, true);
      expect(Math.abs(xAtLine - (RINK.centerX + side * corner))).toBeLessThanOrEqual(AIM.spread + 0.001);
    }
    // Without the help the same diagonal misses the net by a long way.
    expect(Math.abs(slotShot(-1, false).xAtLine - RINK.centerX)).toBeGreaterThan(40);
  });

  it('leaves a straight shot exactly where the stick points', () => {
    expect(slotShot(0, true, 9).xAtLine).toBeCloseTo(slotShot(0, false, 9).xAtLine, 6);
  });

  it('allows for the skater drifting sideways, and does nothing far from the net or for a big change of direction', () => {
    const sim = new SkatingSim(cloneTuning());
    const s = sim.skater;
    const shoot = (x: number, y: number, vx: number): number => {
      sim.resetPuck();
      [s.x, s.y, s.vx, s.vy, s.facing, s.pickupCooldown] = [x, y, vx, 0, -Math.PI / 2, 0];
      sim.puck.x = sim.bladeX();
      sim.puck.y = sim.bladeY();
      sim.step(IDLE);
      s.vx = vx;
      sim.step({ moveX: 0, moveY: 0, shoot: true });
      s.vx = vx;
      sim.step({ moveX: D, moveY: -D, shoot: false });
      return sim.puck.x + (sim.puck.vx / sim.puck.vy) * (line - sim.puck.y);
    };
    const corner = RINK.centerX + RINK.mouthHalfWidth - FEEL.puckRadius - AIM.cornerInset;
    expect(Math.abs(shoot(RINK.centerX, line + 70, 150) - corner)).toBeLessThanOrEqual(AIM.spread + 0.5);
    // From outside the range the diagonal is a plain diagonal: nowhere near the net.
    expect(Math.abs(shoot(RINK.centerX, line + AIM.range + 60, 0) - RINK.centerX)).toBeGreaterThan(100);
    // From far to the right, up-right would need more than the allowed turn to reach the net: left alone.
    expect(shoot(RINK.centerX + 120, line + 40, 0)).toBeGreaterThan(RINK.centerX + 120);
  });
});

describe('5-on-5 test game', () => {
  it('lines up two teams of five on their own sides of centre, with the player on the home centre', () => {
    const sim = teams();
    expect(sim.skaters.length).toBe(10);
    expect(sim.goalies.length).toBe(2);
    for (const s of sim.skaters) {
      expect((s.y - RINK.centerY) * attackDir(s.team)).toBeLessThan(0);
      expect(faceoffSpot(RINK, s.team, s.role)).toEqual({ x: s.x, y: s.y });
    }
    expect([sim.skater.team, sim.skater.role]).toEqual([0, 'C']);
    // Both centres are the same distance from the puck.
    const [home, away] = [sim.skaters[0], sim.skaters[5]];
    expect(Math.abs((home?.y ?? 0) - RINK.centerY)).toBe(Math.abs((away?.y ?? 0) - RINK.centerY));
  });

  it('keeps the one-skater prototype exactly as it was', () => {
    const sim = new SkatingSim(cloneTuning());
    expect(sim.skaters.length).toBe(1);
    expect(sim.teams).toBe(false);
    expect(sim.snapshot().split('|').length).toBe(13);
  });

  it('is deterministic: the same buttons give the same game', () => {
    const play = (): string => {
      const sim = teams();
      for (let i = 0; i < 1500; i++) sim.step({ moveX: i % 200 < 100 ? 0 : D, moveY: -D, shoot: i % 90 > 80, pass: i % 131 === 0 });
      return sim.snapshot();
    };
    expect(play()).toBe(play());
  });

  it('passes to the teammate the held direction points at, leads him, and hands the player control of the receiver', () => {
    const sim = teams();
    give(sim, 0);
    const wing = sim.skaters[2]; // right wing
    if (!wing) throw new Error('no wing');
    const events = sim.step({ moveX: 1, moveY: 0, shoot: false, pass: true });
    expect(events.some((e) => e.type === 'pass')).toBe(true);
    expect(sim.passTarget).toBe(2);
    expect(sim.controlled).toBe(2);
    expect(sim.puck.vx).toBeGreaterThan(0);
    expect(Math.hypot(sim.puck.vx, sim.puck.vy)).toBeGreaterThan(TEAM.passSpeed * 0.98);
    // Holding the button does not pass again when it arrives.
    let got = false;
    for (let i = 0; i < 120 && !got; i++) got = sim.step({ moveX: 0, moveY: 0, shoot: false, pass: true }).some((e) => e.type === 'pickup' && e.team === 0);
    expect(got).toBe(true);
    expect(sim.skater.hasPuck).toBe(true);
    expect(sim.skater.index).toBe(2);
  });

  it('gives the player the teammate nearest the puck when the pass button is pressed without it', () => {
    const sim = teams();
    sim.puck.x = RINK.centerX - 90;
    sim.puck.y = RINK.centerY + 30;
    sim.step({ moveX: 0, moveY: 0, shoot: false, pass: true });
    expect(sim.skater.role).toBe('LW');
  });

  it('lets an opponent knock the puck off a carrier, but not in the first moment he has it', () => {
    const sim = teams();
    give(sim, 0);
    const me = sim.skater;
    const them = sim.skaters[5];
    if (!them) throw new Error('no opponent');
    [them.x, them.y] = [sim.bladeX(me), sim.bladeY(me) - 6];
    let events: SimEvent[] = sim.step(IDLE);
    expect(events.some((e) => e.type === 'poke')).toBe(false);
    for (let i = 0; i < 40 && !events.some((e) => e.type === 'poke'); i++) {
      [them.x, them.y, them.vx, them.vy] = [sim.bladeX(me), sim.bladeY(me) - 6, 0, 0];
      events = sim.step(IDLE);
    }
    expect(events.some((e) => e.type === 'poke' && e.team === 1)).toBe(true);
    expect(me.hasPuck).toBe(false);
    expect(me.pickupCooldown).toBeGreaterThan(0);
  });

  it('keeps skaters from standing inside each other', () => {
    const sim = teams(true);
    for (let i = 0; i < 1800; i++) {
      sim.step(IDLE);
      if (i % 30 !== 0) continue;
      for (const a of sim.skaters) for (const b of sim.skaters) if (a.index < b.index) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(FEEL.skaterRadius * 2 - 1.5);
    }
  });

  it('places the formation on the right side of the puck for each team', () => {
    const puck = { x: RINK.centerX + 40, y: RINK.centerY };
    for (const team of [0, 1] as const) {
      const at = (role: 'C' | 'LW' | 'RW' | 'LD' | 'RD', possession: 0 | 1 | -1) => {
        const spot = formationSpot(RINK, { x: 0, y: 0, vx: 0, vy: 0, index: 0, team, role, hasPuck: false, aiHold: 0, aiSide: 1, aiWait: 0, aiStill: 0, aiDodge: 0 }, puck, possession);
        return { x: spot.x, up: (spot.y - puck.y) * attackDir(team) };
      };
      const other = team === 0 ? 1 : 0;
      // Attacking: forwards ahead of the puck, defence behind it. Defending: everyone goalside of it.
      expect(at('LW', team).up).toBeGreaterThan(0);
      expect(at('LD', team).up).toBeLessThan(0);
      expect(at('LW', team).x).toBeLessThan(at('RW', team).x);
      for (const role of ['C', 'LW', 'RW', 'LD', 'RD'] as const) expect(at(role, other).up).toBeLessThan(0);
    }
  });

  it('plays a whole game by itself: both teams have the puck, pass, shoot and score, and it never stalls', () => {
    const sim = teams(true);
    const count: Record<string, number> = {};
    let longestStall = 0;
    let stall = 0;
    let last = '';
    for (let i = 0; i < 60 * 600; i++) {
      for (const e of sim.step(IDLE)) {
        const key = e.type + ('team' in e ? e.team : '');
        count[key] = (count[key] ?? 0) + 1;
      }
      const now = `${sim.puck.x.toFixed(1)},${sim.puck.y.toFixed(1)}`;
      stall = now === last && sim.puck.state !== 'inNet' ? stall + 1 : 0;
      longestStall = Math.max(longestStall, stall);
      last = now;
    }
    // Ten minutes of play. The puck never sits still for five seconds.
    expect(longestStall).toBeLessThan(300);
    for (const key of ['pickup0', 'pickup1', 'pass0', 'pass1', 'poke0', 'poke1']) expect(count[key] ?? 0, key).toBeGreaterThan(20);
    expect(count.shot ?? 0).toBeGreaterThan(30);
    expect(sim.score[0]).toBeGreaterThan(0);
    expect(sim.score[1]).toBeGreaterThan(0);
    expect(sim.score[0] + sim.score[1]).toBe(sim.goals);
    // Neither side runs away with it: the two teams play by the same rules.
    expect(Math.max(...sim.score) / Math.max(1, Math.min(...sim.score))).toBeLessThan(4);
  });

  it('holds the computer back at the puck drop, so the player can win it', () => {
    const sim = teams();
    expect(sim.drawDelay[0]).toBeGreaterThan(0);
    expect(sim.drawDelay[1]).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(...sim.drawDelay) - 1; i++) sim.step(IDLE);
    for (const s of sim.skaters) expect(Math.hypot(s.vx, s.vy)).toBe(0);
    // Skating straight at it, the player gets the puck first.
    let got: SimEvent | undefined;
    const sim2 = teams();
    for (let i = 0; i < 120 && !got; i++) got = sim2.step({ moveX: 0, moveY: -1, shoot: false }).find((e) => e.type === 'pickup');
    expect(got && got.type === 'pickup' && got.team).toBe(0);
  });

  it('lines everyone up again after a goal and counts it for the right team', () => {
    const sim = teams();
    sim.puck.x = RINK.centerX;
    sim.puck.y = line + 6;
    sim.puck.vy = -200;
    sim.setGoalies(false);
    let scored = false;
    for (let i = 0; i < 30 && !scored; i++) scored = sim.step(IDLE).some((e) => e.type === 'goal');
    expect(scored).toBe(true);
    expect(sim.score).toEqual([1, 0]);
    for (let i = 0; i < 120; i++) sim.step(IDLE);
    expect(sim.puck.state).not.toBe('inNet');
    expect(sim.tick - sim.dropTick).toBeLessThan(60);
  });
});
