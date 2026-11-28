import { describe, expect, it } from 'vitest';
import { SKATER_ATTRIBUTES } from '../src/dynasty/attributes';
import { confirmDraft, emptyDraft, emptyStore } from '../src/dynasty/createdPlayer';
import type { CreatedPlayer } from '../src/dynasty/createdPlayer';
import { startingArchetypesFor } from '../src/dynasty/archetypes';
import { INFLUENCES } from '../src/dynasty/influences';
import { playStylesFor } from '../src/dynasty/playStyles';
import { GOALIE_INDEX, PICKUP_ROSTER, makePickupRoster, portraitOf, withCreatedPlayer } from '../src/dynasty/pickupRoster';
import { RINK, goalLineY } from '../src/match/sim/rink';
import { ICE_RATINGS, MODS, NO_MODS, modsFromRatings } from '../src/match/sim/skaterMods';
import { SkatingSim } from '../src/match/sim/skatingSim';
import { cloneTuning } from '../src/match/sim/tuning';

const IDLE = { moveX: 0, moveY: 0, shoot: false };

function created(position: 'forward' | 'defense' | 'goalie', over: Partial<CreatedPlayer['profile']> = {}, face = 'face:face_07'): CreatedPlayer {
  const influence = INFLUENCES.find((i) => i.position === position);
  if (!influence) throw new Error(`no influence for ${position}`);
  const style = playStylesFor(position)[0];
  const archetype = startingArchetypesFor(position, 'youth')[0];
  if (!style || !archetype) throw new Error('no style or archetype');
  const draft = { ...emptyDraft(), firstName: 'Dusty', lastName: 'Rhodes', position, primary: influence.id, playStyle: style.id, archetype: archetype.id };
  const { player, problems } = confirmDraft({ ...emptyStore(), draft }, 77);
  if (!player) throw new Error(problems.join('; '));
  return { ...player, profile: { ...player.profile, ...over }, appearance: { ...player.appearance, face } };
}

describe('ratings on the ice (Decision 101)', () => {
  it('an average rating changes nothing; 99 and 1 move each thing by its span, evenly', () => {
    const average = modsFromRatings({});
    for (const key of ['speed', 'accel', 'turn', 'wristPower', 'slapPower', 'passSpeed', 'checkReach'] as const) expect(average[key]).toBe(1);
    expect(modsFromRatings(Object.fromEntries(ICE_RATINGS.map((k) => [k, MODS.average])))).toEqual(average);
    const best = modsFromRatings(Object.fromEntries(ICE_RATINGS.map((k) => [k, 99])));
    const worst = modsFromRatings(Object.fromEntries(ICE_RATINGS.map((k) => [k, 1])));
    expect(best.speed).toBeCloseTo(1 + MODS.span.speed, 6);
    expect(worst.speed).toBeCloseTo(1 - MODS.span.speed, 6);
    expect(best.slapPower).toBeCloseTo(1 + MODS.span.slapPower, 6);
    // Accuracy: the better the rating, the less a shot strays.
    expect(best.wristError).toBeCloseTo(MODS.shotError * MODS.errorAt99, 6);
    expect(average.wristError).toBeCloseTo(MODS.shotError, 6);
    expect(worst.wristError).toBeCloseTo(MODS.shotError * MODS.errorAt1, 6);
    // Out-of-range ratings are held to 1 and 99.
    expect(modsFromRatings({ skatingSpeed: 500 }).speed).toBeCloseTo(best.speed, 6);
    expect(modsFromRatings({ skatingSpeed: -3 }).speed).toBeCloseTo(worst.speed, 6);
    expect(NO_MODS.wristError).toBe(0);
  });

  it('the ratings the ice uses are all real skater attributes', () => {
    for (const key of ICE_RATINGS) expect(SKATER_ATTRIBUTES).toContain(key);
    expect([...PICKUP_ROSTER.rated]).toEqual([...ICE_RATINGS]);
  });

  it('a faster skater tops out faster and gets there sooner', () => {
    const topSpeed = (rating: number): { top: number; early: number } => {
      const sim = new SkatingSim(cloneTuning());
      sim.setSkaterMods(0, modsFromRatings({ skatingSpeed: rating, acceleration: rating }));
      const s = sim.skater;
      [s.x, s.y] = [RINK.centerX, RINK.centerY + 200];
      let early = 0;
      let top = 0;
      for (let i = 0; i < 90; i++) {
        sim.step({ moveX: 0, moveY: -1, shoot: false });
        if (i === 12) early = Math.hypot(s.vx, s.vy);
        top = Math.max(top, Math.hypot(s.vx, s.vy));
      }
      return { top, early };
    };
    const [slow, mid, quick] = [1, MODS.average, 99].map(topSpeed) as [ReturnType<typeof topSpeed>, ReturnType<typeof topSpeed>, ReturnType<typeof topSpeed>];
    expect(mid.top).toBeCloseTo(cloneTuning().maxSpeed, 3);
    expect(quick.top).toBeCloseTo(mid.top * (1 + MODS.span.speed), 3);
    expect(slow.top).toBeCloseTo(mid.top * (1 - MODS.span.speed), 3);
    expect(quick.early).toBeGreaterThan(mid.early);
    expect(mid.early).toBeGreaterThan(slow.early);
  });

  it('a heavier shot leaves harder, and an inaccurate one strays, but never past its limit', () => {
    const line = goalLineY(RINK, 'top');
    const shot = (ratings: Parameters<typeof modsFromRatings>[0] | null, seedSteps = 0): { speed: number; angle: number } => {
      const sim = new SkatingSim(cloneTuning());
      sim.setGoalies(false);
      if (ratings) sim.setSkaterMods(0, modsFromRatings(ratings));
      const s = sim.skater;
      [s.x, s.y, s.facing] = [RINK.centerX, line + 120, -Math.PI / 2];
      sim.puck.x = sim.bladeX();
      sim.puck.y = sim.bladeY();
      for (let i = 0; i <= seedSteps; i++) sim.step(IDLE);
      sim.step({ moveX: 0, moveY: 0, shoot: true });
      sim.step(IDLE);
      return { speed: Math.hypot(sim.puck.vx, sim.puck.vy), angle: Math.atan2(sim.puck.vy, sim.puck.vx) };
    };
    const plain = shot(null);
    expect(plain.angle).toBeCloseTo(-Math.PI / 2, 6);
    expect(shot({ wristShotPower: 99 }).speed).toBeCloseTo(plain.speed * (1 + MODS.span.wristPower), 3);
    expect(shot({ wristShotPower: 1 }).speed).toBeCloseTo(plain.speed * (1 - MODS.span.wristPower), 3);
    // Twenty shots from a poor shooter: they stray, some each way, none past his limit.
    const limit = MODS.shotError * MODS.errorAt1;
    const strays: number[] = [];
    const sim = new SkatingSim(cloneTuning());
    sim.setGoalies(false);
    sim.setSkaterMods(0, modsFromRatings({ wristShotAccuracy: 1 }));
    for (let i = 0; i < 20; i++) {
      const s = sim.skater;
      [s.x, s.y, s.vx, s.vy, s.facing] = [RINK.centerX, line + 120, 0, 0, -Math.PI / 2];
      s.hasPuck = true;
      s.pickupCooldown = 0;
      sim.puck.state = 'carried';
      sim.step({ moveX: 0, moveY: 0, shoot: true });
      sim.step(IDLE);
      strays.push(Math.atan2(sim.puck.vy, sim.puck.vx) + Math.PI / 2);
    }
    expect(Math.max(...strays.map(Math.abs))).toBeLessThanOrEqual(limit + 1e-9);
    expect(strays.some((a) => a > 0.005) && strays.some((a) => a < -0.005)).toBe(true);
  });

  it('pick-up skaters get throwaway ratings in range, the same for the same seed, and the names a seed gives did not change', () => {
    const a = makePickupRoster(11);
    expect(makePickupRoster(11)).toEqual(a);
    for (const p of a.slice(0, 10)) {
      for (const key of ICE_RATINGS) {
        const v = p.ratings[key] ?? -1;
        expect(v >= PICKUP_ROSTER.ratings[0] && v <= PICKUP_ROSTER.ratings[1]).toBe(true);
      }
    }
    expect(a[GOALIE_INDEX[0]]?.ratings).toEqual({});
    // Not everyone alike.
    expect(new Set(a.slice(0, 10).map((p) => p.ratings.skatingSpeed)).size).toBeGreaterThan(3);
  });

  it('a created forward takes the centre with his name, number, face and ratings; nobody else keeps his number or face', () => {
    const base = makePickupRoster(11);
    const clash = base[2]?.number ?? 0;
    const player = created('forward', { number: clash });
    const roster = withCreatedPlayer(base, player);
    const me = roster[0];
    expect(me).toMatchObject({ first: 'Dusty', last: 'Rhodes', number: clash, face: 6, createdId: player.id });
    expect(me?.ratings.skatingSpeed).toBe(player.dna.start.skatingSpeed);
    // The teammate who wore it takes the replaced player's number; the away side is untouched.
    expect(roster[2]?.number).toBe(base[0]?.number);
    expect(new Set(roster.slice(0, 5).map((p) => p.number)).size).toBe(5);
    expect(roster.slice(5, 10)).toEqual(base.slice(5, 10).map((p) => (p.face === 6 ? { ...p, face: base[0]?.face } : p)));
    expect(roster.filter((p) => p.face === 6).length).toBe(1);
    expect(base[0]?.createdId).toBeUndefined();
  });

  it('a defenseman goes to left defense, a goalie into the net by name only, and a face that is not on the sheet keeps the old portrait', () => {
    const base = makePickupRoster(11);
    const d = withCreatedPlayer(base, created('defense'));
    expect(d[PICKUP_ROSTER.createdPlace.defense]).toMatchObject({ last: 'Rhodes' });
    expect(d[0]).toEqual(base[0]);
    const g = withCreatedPlayer(base, created('goalie', { number: null }, 'bald:bald_03'));
    const keeper = g[GOALIE_INDEX[0]];
    expect(keeper).toMatchObject({ last: 'Rhodes', number: base[GOALIE_INDEX[0]]?.number, face: base[GOALIE_INDEX[0]]?.face, ratings: {} });
    expect(portraitOf(created('forward', {}, 'bald:bald_03'))).toBe(null);
    expect(portraitOf(created('forward', {}, 'face:face_24'))).toBe(23);
    expect(portraitOf(created('forward', {}, 'face:face_25'))).toBe(null);
  });
});
