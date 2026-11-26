import { describe, expect, it } from 'vitest';
import { CONTACT, MATCH, REFEREES, clockText, faceoffDots, lineupSpot, penaltySeconds } from '../src/match/sim/match';
import type { Referee } from '../src/match/sim/match';
import { RINK, goalLineY } from '../src/match/sim/rink';
import { SIM_DT, SkatingSim } from '../src/match/sim/skatingSim';
import type { SimEvent, Skater } from '../src/match/sim/skatingSim';
import { attackDir } from '../src/match/sim/teamAi';
import { cloneTuning } from '../src/match/sim/tuning';

const IDLE = { moveX: 0, moveY: 0, shoot: false };
const ALWAYS: Referee = { id: 'always', label: 'Always', calls: { hooking: 1, tripping: 1, slashing: 1, roughing: 1, boarding: 1 } };
const NEVER: Referee = { id: 'never', label: 'Never', calls: { hooking: 0, tripping: 0, slashing: 0, roughing: 0, boarding: 0 } };

function game(opts: { demo?: boolean; seed?: number; referee?: Referee } = {}): SkatingSim {
  const sim = new SkatingSim(cloneTuning());
  sim.demo = opts.demo ?? false;
  sim.setTeams(true, true, opts.seed ?? 11);
  if (opts.referee && sim.match) sim.match.referee = opts.referee;
  return sim;
}
const match = (sim: SkatingSim) => {
  if (!sim.match) throw new Error('no match');
  return sim.match;
};
const sk = (sim: SkatingSim, i: number): Skater => {
  const s = sim.skaters[i];
  if (!s) throw new Error('no skater');
  return s;
};
/** Step until a phase is reached, collecting events. */
function until(sim: SkatingSim, phase: string, input = IDLE, limit = 2000): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < limit && match(sim).phase !== phase; i++) events.push(...sim.step(input));
  expect(match(sim).phase).toBe(phase);
  return events;
}
/** Get to live play with nobody but the listed skaters on the ice, each where the test puts him. */
function onlyThese(sim: SkatingSim, keep: number[]): void {
  until(sim, 'play');
  for (const s of sim.skaters) {
    s.out = !keep.includes(s.index);
    s.hasPuck = false;
    if (s.out) s.x = -200;
    [s.vx, s.vy] = [0, 0];
  }
  sim.puck.state = 'free';
  [sim.puck.vx, sim.puck.vy] = [0, 0];
}
/** Put a skater somewhere and let him collect the puck from his own blade. */
function take(sim: SkatingSim, i: number, x: number, y: number, facing: number): Skater {
  const s = sk(sim, i);
  [s.x, s.y, s.vx, s.vy, s.facing, s.pickupCooldown] = [x, y, 0, 0, facing, 0];
  if (s.team === 0) sim.controlled = i;
  [sim.puck.x, sim.puck.y, sim.puck.vx, sim.puck.vy, sim.puck.state] = [sim.bladeX(s), sim.bladeY(s), 0, 0, 'free'];
  sim.step(IDLE);
  expect(s.hasPuck).toBe(true);
  return s;
}
const UP = -Math.PI / 2;
const top = goalLineY(RINK, 'top');

describe('a full game: clock, periods and faceoffs (Decision 86)', () => {
  it('opens with a faceoff at centre: everyone on his own side, the puck held, then dropped', () => {
    const sim = game();
    sim.step(IDLE);
    const m = match(sim);
    expect(m.phase).toBe('faceoff');
    expect([m.period, m.clock]).toEqual([1, MATCH.periodSeconds]);
    expect(sim.puck.state).toBe('held');
    expect([sim.puck.x, sim.puck.y]).toEqual([RINK.centerX, RINK.centerY]);
    for (const s of sim.skaters) expect((s.y - RINK.centerY) * attackDir(s.team)).toBeLessThan(0);
    const events = until(sim, 'draw');
    expect(events.some((e) => e.type === 'drop')).toBe(true);
    expect(sim.puck.state).toBe('free');
    // The clock has not started: it does not run before the opening drop.
    expect(m.clock).toBe(MATCH.periodSeconds);
  });

  it('gives the draw to the player who presses just after the drop, and to the other side if he jumps it', () => {
    const quick = game({ seed: 3 });
    until(quick, 'draw');
    const won = quick.step({ moveX: 0, moveY: 1, shoot: true });
    expect(won).toContainEqual({ type: 'draw', team: 0 });
    expect(match(quick).stats[0].faceoffs).toBe(1);
    expect(quick.puck.vy).toBeGreaterThan(0); // sent back toward his own end, where he was holding
    expect(match(quick).phase).toBe('play');

    const early = game({ seed: 3 });
    early.step(IDLE);
    early.step({ moveX: 0, moveY: 0, shoot: true }); // before the drop
    until(early, 'draw');
    const events: SimEvent[] = [];
    for (let i = 0; i < 40 && match(early).phase === 'draw'; i++) events.push(...early.step({ moveX: 0, moveY: 0, shoot: i % 2 === 0 }));
    expect(events).toContainEqual({ type: 'draw', team: 1 });
  });

  it('lines every team up on its own side of all nine dots, inside the boards', () => {
    const dots = faceoffDots(RINK);
    for (const dot of [dots.centre, ...dots.endZone, ...dots.neutral]) {
      for (const team of [0, 1] as const) {
        for (const role of ['C', 'LW', 'RW', 'LD', 'RD'] as const) {
          const spot = lineupSpot(RINK, team, role, dot);
          expect((spot.y - dot.y) * attackDir(team)).toBeLessThan(0);
          expect(spot.x).toBeGreaterThan(RINK.left + 10);
          expect(spot.x).toBeLessThan(RINK.right - 10);
        }
      }
    }
    expect(dots.endZone.length + dots.neutral.length + 1).toBe(9);
  });

  it('runs three periods on the clock, stops for an intermission, and ends with a winner', () => {
    const sim = game({ demo: true, seed: 5 });
    const m = match(sim);
    until(sim, 'play');
    sim.step(IDLE);
    expect(m.clock).toBeLessThan(MATCH.periodSeconds);
    m.clock = 0.05;
    const events = until(sim, 'intermission');
    expect(events).toContainEqual({ type: 'period', period: 1 });
    // Nothing moves until the player carries on.
    for (let i = 0; i < 60; i++) sim.step(IDLE);
    expect(m.phase).toBe('intermission');
    sim.advance();
    expect([m.period, m.clock, m.phase]).toEqual([2, MATCH.periodSeconds, 'faceoff']);
    until(sim, 'play');
    m.clock = 0.05;
    until(sim, 'intermission');
    sim.advance();
    until(sim, 'play');
    sim.score = [3, 1];
    m.clock = 0.05;
    const end = until(sim, 'final');
    expect(end).toContainEqual({ type: 'final', winner: 0 });
    expect(m.winner).toBe(0);
    expect(clockText(m.clock)).toBe('0:00');
  });

  it('settles a tie with a shootout, three shots each then sudden death, and keeps shootout goals off the score', () => {
    const sim = game({ demo: true, seed: 9 });
    const m = match(sim);
    until(sim, 'play');
    m.period = MATCH.periods;
    sim.score = [2, 2];
    m.clock = 0.05;
    until(sim, 'shootout');
    expect(sim.skaters.filter((s) => !s.out).length).toBe(1);
    const events = until(sim, 'final', IDLE, 60 * 240);
    const attempts = events.filter((e) => e.type === 'attempt');
    const so = m.shootout;
    if (!so) throw new Error('no shootout');
    expect(attempts.length).toBe(so.results[0].length + so.results[1].length);
    expect(Math.abs(so.results[0].length - so.results[1].length)).toBeLessThanOrEqual(1);
    const [a, b] = so.results.map((r) => r.filter(Boolean).length) as [number, number];
    expect(a).not.toBe(b);
    expect(m.winner).toBe(a > b ? 0 : 1);
    expect(sim.score).toEqual([2, 2]);
    expect(sim.skaters.every((s) => !s.out)).toBe(true);
  });

  it('stops play when the goalie freezes the puck, and faces off beside him', () => {
    const sim = game({ seed: 2 });
    onlyThese(sim, [0]);
    const s = sk(sim, 0);
    [s.x, s.y] = [RINK.centerX, RINK.centerY + 200];
    const g = sim.goalies.find((x) => x.end === 'top');
    if (!g) throw new Error('no goalie');
    // A soft shot straight into his chest.
    [sim.puck.x, sim.puck.y, sim.puck.vx, sim.puck.vy, sim.puck.z] = [g.x, g.y + 30, 0, -220, 9];
    const events = until(sim, 'whistle', IDLE, 120);
    expect(events).toContainEqual({ type: 'whistle', reason: 'freeze' });
    expect(match(sim).dot.y).toBe(top + 80);
    expect(match(sim).stats[1].saves).toBe(1);
  });
});

describe('icing and offside', () => {
  function iced(setup?: (sim: SkatingSim) => void): SimEvent[] {
    const sim = game({ seed: 4, referee: NEVER });
    onlyThese(sim, [3]);
    sim.setGoalies(false);
    setup?.(sim);
    // Home defenceman, in his own half and well to the left, hammers it the length of the ice.
    take(sim, 3, RINK.centerX - 110, RINK.centerY + 120, UP);
    for (let i = 0; i < 40; i++) sim.step({ moveX: 0, moveY: 0, shoot: true });
    const events: SimEvent[] = [];
    for (let i = 0; i < 400 && match(sim).phase === 'play'; i++) events.push(...sim.step(IDLE));
    return events;
  }

  it('calls icing on a puck sent from a team\'s own half over the far goal line untouched, and faces off back in its end', () => {
    const sim = game({ seed: 4, referee: NEVER });
    onlyThese(sim, [3]);
    sim.setGoalies(false);
    take(sim, 3, RINK.centerX - 110, RINK.centerY + 120, UP);
    for (let i = 0; i < 40; i++) sim.step({ moveX: 0, moveY: 0, shoot: true });
    const events = until(sim, 'whistle', IDLE, 400);
    expect(events).toContainEqual({ type: 'whistle', reason: 'icing' });
    const m = match(sim);
    expect(m.dot.y).toBeGreaterThan(RINK.centerY + 200);
    expect(m.dot.x).toBeLessThan(RINK.centerX);
    // A running clock: it keeps going through the stoppage.
    const before = m.clock;
    sim.step(IDLE);
    expect(m.clock).toBeLessThan(before);
  });

  it('does not call icing when it is switched off, or on a team that is short-handed', () => {
    expect(iced((sim) => (sim.rules.icing = false)).some((e) => e.type === 'whistle')).toBe(false);
    expect(iced((sim) => match(sim).penalties.push({ skater: 1, team: 0, foul: 'hooking', left: 99 })).some((e) => e.type === 'whistle' && e.reason === 'icing')).toBe(false);
    expect(iced().some((e) => e.type === 'whistle' && e.reason === 'icing')).toBe(true);
  });

  function entry(mateAhead: boolean, on = true): SimEvent[] {
    const sim = game({ seed: 6, referee: NEVER });
    onlyThese(sim, [0, 1]);
    sim.rules.offside = on;
    const blue = RINK.centerY - RINK.blueLineOffset;
    const mate = sk(sim, 1);
    [mate.x, mate.y] = [RINK.centerX - 100, mateAhead ? blue - 30 : blue + 40];
    take(sim, 0, RINK.centerX + 60, blue + 30, UP);
    const events: SimEvent[] = [];
    for (let i = 0; i < 40 && match(sim).phase === 'play'; i++) events.push(...sim.step({ moveX: 0, moveY: -1, shoot: false }));
    return events;
  }

  it('calls offside when the puck is carried over the blue line with a teammate already in the zone', () => {
    expect(entry(true)).toContainEqual({ type: 'whistle', reason: 'offside' });
    expect(entry(false).some((e) => e.type === 'whistle')).toBe(false);
    expect(entry(true, false).some((e) => e.type === 'whistle')).toBe(false);
  });
});

describe('the contact button: stick check, bump, check (Decision 85)', () => {
  /** A home skater just below an away puck carrier who is skating up the ice, facing him or behind him. */
  function faceUp(opts: { referee: Referee; behind?: boolean }): { sim: SkatingSim; me: Skater; him: Skater } {
    const sim = game({ seed: 8, referee: opts.referee });
    onlyThese(sim, [0, 5]);
    const him = take(sim, 5, RINK.centerX, RINK.centerY, opts.behind ? UP : -UP);
    him.possessTick = -1000;
    const me = sk(sim, 0);
    sim.controlled = 0;
    // In front: below him, looking up at the puck on his stick. Behind: below him while he faces away.
    [me.x, me.y, me.facing] = opts.behind ? [RINK.centerX, RINK.centerY + 12, UP] : [RINK.centerX, RINK.centerY + 19, UP];
    return { sim, me, him };
  }
  const tap = (sim: SkatingSim): SimEvent[] => [...sim.step({ ...IDLE, check: true }), ...sim.step(IDLE)];
  /** Carry on until the referee blows a called penalty down (he holds his arm up for a beat first). */
  const whistle = (sim: SkatingSim, events: SimEvent[]): SimEvent[] => {
    for (let i = 0; i < 90 && !events.some((e) => e.type === 'penalty'); i++) events.push(...sim.step(IDLE));
    return events;
  };

  it('a tap in front of the carrier knocks the puck loose, cleanly', () => {
    const { sim, him } = faceUp({ referee: ALWAYS });
    const events = tap(sim);
    expect(events).toContainEqual({ type: 'poke', team: 0 });
    expect(events.some((e) => e.type === 'penalty')).toBe(false);
    expect(him.hasPuck).toBe(false);
    expect(match(sim).stats[0].takeaways).toBe(1);
  });

  it('a tap that reaches nothing leaves him flat-footed', () => {
    const { sim, me, him } = faceUp({ referee: ALWAYS });
    him.x += 80;
    sim.step(IDLE);
    tap(sim);
    expect(me.lock).toBeGreaterThan(0);
    const before = me.x;
    for (let i = 0; i < 10; i++) sim.step({ moveX: 1, moveY: 0, shoot: false });
    expect(me.x).toBe(before);
  });

  it('a stick on a carrier from behind is a penalty if the referee calls it: into the box, a skater short, and out when it is served', () => {
    const { sim, me } = faceUp({ referee: ALWAYS, behind: true });
    const mate = sk(sim, 1);
    [mate.out, mate.x, mate.y] = [false, RINK.centerX - 120, RINK.centerY + 150];
    const events = tap(sim);
    const m = match(sim);
    // A beat first: his arm goes up, play is still live, nobody has left the ice.
    expect(events.some((e) => e.type === 'call' && e.team === 0 && e.skater === 0)).toBe(true);
    expect(events.some((e) => e.type === 'penalty' || e.type === 'whistle')).toBe(false);
    expect([m.phase, me.out, sim.referee?.signal]).toEqual(['play', false, 'penalty']);
    whistle(sim, events);
    const call = events.find((e) => e.type === 'penalty');
    expect(call && call.type === 'penalty' && [call.team, call.skater, call.seconds]).toEqual([0, 0, penaltySeconds()]);
    expect(sim.tick * SIM_DT).toBeGreaterThan(0.5);
    // Then he skates to the box himself: still on the ice at the whistle, gone by the faceoff.
    expect([me.out, me.toBox]).toEqual([false, true]);
    expect(m.stats[0].pim).toBe(2);
    expect(m.phase).toBe('whistle');
    expect(m.reason).toBe('penalty');
    // Faceoff in the offender's end; the clock does not run until the puck is dropped.
    expect(m.dot.y).toBeGreaterThan(RINK.centerY + 200);
    const clock = m.clock;
    until(sim, 'faceoff');
    expect([me.out, me.toBox]).toEqual([true, false]);
    until(sim, 'play');
    expect(m.clock).toBe(clock);
    expect(sim.controlled).not.toBe(0);
    for (const s of sim.skaters) if (s.index !== 0) s.out = true; // empty the ice so nothing else happens
    sim.puck.state = 'free';
    [sim.puck.x, sim.puck.y, sim.puck.vx, sim.puck.vy] = [RINK.centerX, RINK.centerY, 0, 0];
    let back: SimEvent | undefined;
    for (let i = 0; i < (penaltySeconds() + 1) / SIM_DT && !back; i++) back = sim.step(IDLE).find((e) => e.type === 'penaltyOver');
    expect(back).toEqual({ type: 'penaltyOver', team: 0, skater: 0 });
    expect(me.out).toBe(false);
    expect(m.penalties.length).toBe(0);
  });

  it('the same stick work is let go by a referee who does not call it', () => {
    const { sim, me } = faceUp({ referee: NEVER, behind: true });
    expect(tap(sim).some((e) => e.type === 'penalty')).toBe(false);
    expect(me.out).toBe(false);
  });

  it('holding the button is a bump that slows him; holding too long is a check that puts him down and draws a call', () => {
    const { sim, me, him } = faceUp({ referee: ALWAYS });
    [me.x, me.y] = [him.x + 2, him.y + CONTACT.touch - 2];
    him.vy = -100;
    const events: SimEvent[] = [];
    const hold = { ...IDLE, check: true };
    for (let i = 0; i < Math.round(CONTACT.bumpAfter / SIM_DT) + 6; i++) events.push(...sim.step(hold));
    expect(events.some((e) => e.type === 'hit')).toBe(false);
    expect(him.down).toBe(0);
    [me.x, me.y] = [him.x + 2, him.y + CONTACT.touch - 2];
    for (let i = 0; i < Math.round(CONTACT.checkAfter / SIM_DT) && !events.some((e) => e.type === 'hit'); i++) {
      [me.x, me.y] = [him.x + 2, him.y + CONTACT.touch - 2];
      events.push(...sim.step(hold));
    }
    expect(events).toContainEqual({ type: 'hit', team: 0, target: 5 });
    expect(him.down).toBeGreaterThan(0);
    expect(him.hasPuck).toBe(false);
    whistle(sim, events);
    const call = events.find((e) => e.type === 'penalty');
    expect(call && call.type === 'penalty' && call.foul).toBe('roughing');
  });

  it('a power-play goal lets the penalized skater out, and is counted as one', () => {
    const { sim, me } = faceUp({ referee: ALWAYS, behind: true });
    whistle(sim, tap(sim));
    until(sim, 'play');
    expect(me.out).toBe(true);
    for (const s of sim.skaters) s.out = s.index !== 5 || s.out;
    sim.setGoalies(false);
    const bottom = goalLineY(RINK, 'bottom');
    take(sim, 5, RINK.centerX, bottom - 40, -UP);
    // The computer's skater, alone in front of an empty net, shoots when he is ready.
    const events: SimEvent[] = [];
    for (let i = 0; i < 600 && !events.some((e) => e.type === 'goal'); i++) events.push(...sim.step(IDLE));
    expect(events.some((e) => e.type === 'goal')).toBe(true);
    expect(events).toContainEqual({ type: 'penaltyOver', team: 0, skater: 0 });
    const m = match(sim);
    expect(m.stats[1].powerPlayGoals).toBe(1);
    expect(m.goals[0]).toMatchObject({ team: 1, scorer: 5, powerPlay: true, period: 1 });
    expect(sim.score).toEqual([0, 1]);
    expect(m.reason).toBe('goal');
  });
});

describe('referees and whole games', () => {
  it('has three placeholder referees who call different things, none of them everything', () => {
    expect(REFEREES.length).toBe(3);
    for (const ref of REFEREES) for (const chance of Object.values(ref.calls)) expect(chance).toBeGreaterThan(0), expect(chance).toBeLessThan(1);
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((seed) => match(game({ seed })).referee.id));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('plays whole games by itself to a result: goals, whistles of every kind but icing, a few penalties, never stuck', () => {
    const reasons = new Set<string>();
    for (const seed of [21, 22, 23]) {
      const sim = game({ demo: true, seed });
      const m = match(sim);
      let penalties = 0;
      let ticks = 0;
      let playTicks = 0;
      while (m.phase !== 'final' && ticks < 60 * 1500) {
        ticks++;
        for (const e of sim.step(IDLE)) {
          if (e.type === 'whistle') reasons.add(e.reason);
          if (e.type === 'penalty') penalties++;
        }
        if (m.phase === 'play') playTicks++;
        if (m.phase === 'intermission') sim.advance();
        expect(m.penalties.filter((p) => p.team === 0).length).toBeLessThanOrEqual(MATCH.maxBoxed);
      }
      expect(m.phase).toBe('final');
      expect(m.winner === 0 || m.winner === 1).toBe(true);
      expect(sim.score[0] + sim.score[1]).toBe(m.stats[0].goals + m.stats[1].goals);
      expect(m.goals.length).toBe(sim.score[0] + sim.score[1]);
      // Most of the game is spent playing, and the referee is not blowing it every few seconds.
      expect(playTicks / ticks).toBeGreaterThan(0.6);
      expect(penalties).toBeLessThan(25);
      expect(m.stats[0].faceoffs + m.stats[1].faceoffs).toBeGreaterThan(5);
    }
    for (const reason of ['goal', 'offside', 'freeze', 'penalty']) expect(reasons.has(reason), reason).toBe(true);
  });

  it('is deterministic with the same seed and buttons', () => {
    const play = (): string => {
      const sim = game({ seed: 31 });
      for (let i = 0; i < 2400; i++) {
        sim.step({ moveX: 0, moveY: i % 300 < 200 ? -1 : 1, shoot: i % 97 > 90, pass: i % 211 === 0, check: i % 61 < 2 });
        if (match(sim).phase === 'intermission') sim.advance();
      }
      return `${sim.snapshot()}|${match(sim).clock.toFixed(4)}|${match(sim).phase}`;
    };
    expect(play()).toBe(play());
  });
});

describe('the referee on the ice', () => {
  it('comes to the dot for a faceoff, beside it and not between the centres, then follows play from the far boards', async () => {
    const { dropSpot, refereeFrame, REF, REFEREE_FRAMES } = await import('../src/match/sim/referee');
    const sim = game({ demo: true, seed: 12 });
    const ref = sim.referee;
    if (!ref) throw new Error('no referee');
    until(sim, 'draw');
    const spot = dropSpot(RINK, match(sim).dot);
    expect(Math.hypot(ref.x - spot.x, ref.y - spot.y)).toBeLessThan(4);
    expect(Math.abs(ref.x - RINK.centerX)).toBe(REF.atDot);
    until(sim, 'play');
    const frames = new Set<string>();
    let wide = 0;
    let across = 0;
    for (let i = 0; i < 60 * 40; i++) {
      sim.step(IDLE);
      frames.add(refereeFrame(ref));
      if (match(sim).phase === 'intermission') sim.advance();
      // Always on the ice, inside the boards.
      expect(ref.x).toBeGreaterThan(RINK.left + 8);
      expect(ref.x).toBeLessThan(RINK.right - 8);
      expect(ref.y).toBeGreaterThan(goalLineY(RINK, 'top'));
      expect(ref.y).toBeLessThan(goalLineY(RINK, 'bottom'));
      if (match(sim).phase === 'play' && Math.abs(sim.puck.x - RINK.centerX) > 80) {
        wide++;
        if (Math.sign(ref.x - RINK.centerX) !== Math.sign(sim.puck.x - RINK.centerX)) across++;
      }
    }
    // With the puck out wide he is mostly across the ice from it (he needs a moment to get there).
    expect(wide).toBeGreaterThan(100);
    expect(across / wide).toBeGreaterThan(0.6);
    // Every frame he shows is one of the supplied ones, in both views, standing and skating.
    for (const frame of frames) expect(REFEREE_FRAMES).toContain(frame);
    expect([...frames].some((f) => f.includes('front_skate'))).toBe(true);
    expect([...frames].some((f) => f.includes('back_'))).toBe(true);
  });

  it('signals a goal, a penalty and a stoppage, and stands still while he does', async () => {
    const { refereeFrame } = await import('../src/match/sim/referee');
    const sim = game({ seed: 13, referee: ALWAYS });
    onlyThese(sim, [0, 1, 5]);
    const ref = sim.referee;
    if (!ref) throw new Error('no referee');
    const him = take(sim, 5, RINK.centerX, RINK.centerY, UP);
    him.possessTick = -1000;
    const me = sk(sim, 0);
    sim.controlled = 0;
    [me.x, me.y, me.facing] = [RINK.centerX, RINK.centerY + 12, UP];
    sim.step({ ...IDLE, check: true });
    const events = sim.step(IDLE);
    expect(events.some((e) => e.type === 'call')).toBe(true);
    expect(ref.signal).toBe('penalty');
    for (let i = 0; i < 90 && !events.some((e) => e.type === 'penalty'); i++) events.push(...sim.step(IDLE));
    expect(events.some((e) => e.type === 'penalty')).toBe(true);
    expect(refereeFrame(ref)).toMatch(/penalty_01$/);
    // Once play is dead he stands and holds the signal.
    for (let i = 0; i < 45; i++) sim.step(IDLE);
    expect(ref.signal).toBe('penalty');
    expect(Math.hypot(ref.vx, ref.vy)).toBeLessThan(6);
    for (let i = 0; i < 200; i++) sim.step(IDLE);
    expect(ref.signal).toBeNull();
  });

  it('has every referee frame on disk at 32x32, and none without a match', async () => {
    const { REFEREE_FRAMES } = await import('../src/match/sim/referee');
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    expect(REFEREE_FRAMES.length).toBe(18);
    for (const frame of REFEREE_FRAMES) {
      const png = readFileSync(join(__dirname, '..', 'public', 'assets', 'referee', '32', `${frame}.png`));
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], frame).toEqual([32, 32]);
    }
    expect(new SkatingSim(cloneTuning()).referee).toBeNull();
  });
});

describe('a beat for the call, and the walk to the box (creative director, Nov 26)', () => {
  it('a goal against the team about to be penalized wipes the call out', () => {
    const sim = game({ seed: 14, referee: ALWAYS });
    onlyThese(sim, [0, 1, 5]);
    sim.setGoalies(false);
    const bottom = goalLineY(RINK, 'bottom');
    const him = take(sim, 5, RINK.centerX, bottom - 30, -UP);
    him.possessTick = -1000;
    const me = sk(sim, 0);
    sim.controlled = 0;
    // Slash at him from the side without reaching the puck, then he scores inside the beat.
    [me.x, me.y, me.facing] = [RINK.centerX - 9, bottom - 30, 0];
    const events = [...sim.step({ ...IDLE, check: true }), ...sim.step(IDLE)];
    expect(events.some((e) => e.type === 'call')).toBe(true);
    [sim.puck.state, sim.puck.x, sim.puck.y, sim.puck.vx, sim.puck.vy] = ['free', RINK.centerX, bottom - 8, 0, 300];
    him.hasPuck = false;
    for (let i = 0; i < 120; i++) events.push(...sim.step(IDLE));
    expect(events.some((e) => e.type === 'goal')).toBe(true);
    expect(events.some((e) => e.type === 'penalty')).toBe(false);
    expect(match(sim).penalties.length).toBe(0);
    expect(me.toBox || me.out).toBe(false);
  });

  it('puts the box where the arena art has it, and lets him out of the same door', async () => {
    const { boxDoor } = await import('../src/match/sim/match');
    expect(boxDoor(RINK, 0)).toEqual({ x: RINK.left + 10, y: 564 });
    expect(boxDoor(RINK, 1)).toEqual({ x: RINK.right - 10, y: 564 });
  });
});
