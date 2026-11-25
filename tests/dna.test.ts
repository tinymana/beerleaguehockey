import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GOALIE_ATTRIBUTES, SKATER_ATTRIBUTES, applyPermanentChange, attributesFor, effectiveRating, overall, withTemporary, withoutTemporary } from '../src/dynasty/attributes';
import type { AttributeKey, Position } from '../src/dynasty/attributes';
import { BACKGROUNDS, CREATED_PLAYER_AGE, backgroundsForAge } from '../src/dynasty/backgrounds';
import { DNA_CONFIG, DNA_VERSION, attributeBounds, dnaInputProblems, generateDNA, influenceBias, parseDNA, serializeDNA, startingAttributes } from '../src/dynasty/dna';
import type { DnaInput } from '../src/dynasty/dna';
import { INFLUENCES, influenceById, influenceName, influencesFor, missingAliases, registryProblems } from '../src/dynasty/influences';

const ROOT = join(__dirname, '..');
const skater = (over: Partial<DnaInput> = {}): DnaInput => ({ seed: 1, position: 'forward', background: 'youth', primary: 'F01', secondaries: [], ...over });
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

describe('attributes', () => {
  it('has the 21 skater attributes from the brief and a goalie set', () => {
    expect(SKATER_ATTRIBUTES.length).toBe(21);
    expect(new Set(SKATER_ATTRIBUTES).size).toBe(21);
    expect(GOALIE_ATTRIBUTES.length).toBe(17);
    expect(new Set(GOALIE_ATTRIBUTES).size).toBe(17);
  });

  it('keeps current ability, potential, temporary modifiers and permanent changes apart', () => {
    let a = startingAttributes(generateDNA(skater()));
    const before = a.current.skatingSpeed ?? 0;
    a = withTemporary(a, { id: 'tired', attribute: 'skatingSpeed', amount: -6, reason: 'third game this week' });
    expect(effectiveRating(a, 'skatingSpeed')).toBe(Math.max(1, before - 6));
    expect(a.current.skatingSpeed).toBe(before);
    a = withoutTemporary(a, 'tired');
    expect(effectiveRating(a, 'skatingSpeed')).toBe(before);

    const potential = a.potential.skatingSpeed ?? 0;
    const hurt = { id: 'knee-2031', attribute: 'skatingSpeed' as const, current: -3, potential: -5, reason: 'knee injury' };
    const after = applyPermanentChange(a, hurt);
    expect(after.current.skatingSpeed).toBe(Math.max(1, before - 3));
    expect(after.potential.skatingSpeed).toBe(Math.max(1, potential - 5));
    expect(after.permanent).toEqual([hurt]);
    // Applying the same change again does nothing: once and only once.
    expect(applyPermanentChange(after, hurt)).toBe(after);
    // The original record is untouched.
    expect(a.current.skatingSpeed).toBe(before);
  });
});

describe('Hockey Influences registry', () => {
  it('is sound: about 60 curated players, unique neutral ids, valid weights', () => {
    expect(registryProblems()).toEqual([]);
    expect(INFLUENCES.length).toBeGreaterThanOrEqual(55);
    expect(INFLUENCES.length).toBeLessThanOrEqual(70);
    for (const i of INFLUENCES) expect(i.id).toMatch(/^[FDG]\d\d$/);
    expect(influencesFor('goalie').length).toBeGreaterThanOrEqual(8);
    expect(influencesFor('forward')).toEqual(influencesFor('defense'));
  });

  it('includes the twelve example influences from the brief', () => {
    const names = new Set(INFLUENCES.map((i) => i.name));
    for (const n of ['Wayne Gretzky', 'Jari Kurri', 'Teemu Selanne', 'Mario Lemieux', 'Pavel Bure', 'Steve Yzerman', 'Mark Messier', 'Brett Hull', 'Nicklas Lidstrom', 'Scott Stevens', 'Patrick Roy', 'Dominik Hasek']) {
      expect(names.has(n), n).toBe(true);
    }
  });

  it('takes every fact from the supplied reference file', () => {
    const rows = readFileSync(join(ROOT, 'data', 'reference', 'nhl_players.csv'), 'utf8').split(/\r?\n/).map((l) => l.split(','));
    const byId = new Map(rows.map((r) => [r[0], r]));
    for (const i of INFLUENCES) {
      const row = byId.get(i.referenceId);
      expect(row, i.id).toBeDefined();
      expect(row?.[1]).toBe(i.name);
      expect(row?.[4]?.startsWith(String(i.born))).toBe(true);
      expect({ F: 'forward', D: 'defense', G: 'goalie' }[row?.[2] ?? '']).toBe(i.position);
    }
  });

  it('can hide every real name: ids are neutral, blurbs name nobody, and fictional mode never shows a real name', () => {
    for (const i of INFLUENCES) {
      const surname = i.name.split(' ').pop() ?? '';
      expect(i.blurb.toLowerCase().includes(surname.toLowerCase()), i.id).toBe(false);
      expect(influenceName(i, 'real')).toBe(i.name);
      expect(influenceName(i, 'fictional')).not.toBe(i.name);
    }
    // Development uses real names (Decision 34). This is the list still to write before they could be switched off.
    expect(missingAliases().length).toBe(INFLUENCES.length);
  });
});

describe('hockey background', () => {
  it('offers an 18-year-old only backgrounds an 18-year-old can have', () => {
    const ids = backgroundsForAge(CREATED_PLAYER_AGE).map((b) => b.id);
    expect(ids).toEqual(['beginner', 'pond', 'roller', 'youth', 'highSchool', 'junior']);
    expect(backgroundsForAge(40).length).toBe(BACKGROUNDS.length);
  });

  it('sets the starting level and experience, and does not touch potential', () => {
    const sample = (background: string) => Array.from({ length: 400 }, (_, seed) => generateDNA(skater({ seed, background })));
    const start = (list: ReturnType<typeof sample>) => mean(list.map((d) => overall(d.start, SKATER_ATTRIBUTES)));
    const beginner = sample('beginner');
    const junior = sample('junior');
    expect(start(junior) - start(beginner)).toBeGreaterThan(20);
    expect(Math.abs(start(beginner) - 16)).toBeLessThan(2);
    // Same seeds, different background: natural talent is identical.
    beginner.forEach((d, i) => expect(d.talent).toBe(junior[i]?.talent));
    // Experience shows in the head, not the legs.
    const iqGap = mean(junior.map((d) => d.start.hockeyIQ ?? 0)) - mean(beginner.map((d) => d.start.hockeyIQ ?? 0));
    const speedGap = mean(junior.map((d) => d.start.skatingSpeed ?? 0)) - mean(beginner.map((d) => d.start.skatingSpeed ?? 0));
    expect(iqGap - speedGap).toBeGreaterThan(4);
  });
});

describe('Player DNA generation', () => {
  it('is deterministic: the same choices and seed give the same player', () => {
    const input = skater({ seed: 20261125, secondaries: ['F07', 'D03'] });
    expect(generateDNA(input)).toEqual(generateDNA(input));
    expect(generateDNA({ ...input, seed: 20261126 })).not.toEqual(generateDNA(input));
  });

  it('rejects choices that make no sense', () => {
    expect(dnaInputProblems(skater())).toEqual([]);
    expect(dnaInputProblems(skater({ primary: 'G01' })).length).toBe(1);
    expect(dnaInputProblems(skater({ position: 'goalie', primary: 'G01', secondaries: ['F01'] })).length).toBe(1);
    expect(dnaInputProblems(skater({ secondaries: ['F01'] })).length).toBe(1);
    expect(dnaInputProblems(skater({ secondaries: ['F02', 'F03', 'F04'] })).length).toBe(1);
    expect(dnaInputProblems(skater({ background: 'astronaut' })).length).toBe(1);
    expect(() => generateDNA(skater({ primary: 'nobody' }))).toThrow();
  });

  it('keeps every rating between 1 and 99, potential above the start, and inside the published range for those choices', () => {
    let seed = 0;
    for (const position of ['forward', 'defense', 'goalie'] as Position[]) {
      const pool = influencesFor(position);
      for (const background of BACKGROUNDS) {
        for (let n = 0; n < 60; n++) {
          const primary = pool[seed % pool.length];
          const second = pool[(seed * 7 + 3) % pool.length];
          if (!primary || !second) throw new Error('empty pool');
          const input: DnaInput = { seed: seed++, position, background: background.id, primary: primary.id, secondaries: second.id === primary.id || n % 3 === 0 ? [] : [second.id] };
          const dna = generateDNA(input);
          for (const key of attributesFor(position)) {
            const s = dna.start[key] ?? -1;
            const p = dna.potential[key] ?? -1;
            const bounds = attributeBounds(input, key);
            expect(s >= 1 && s <= 99 && p >= 1 && p <= 99, `${input.primary} ${key}`).toBe(true);
            expect(p).toBeGreaterThanOrEqual(Math.min(99, s + DNA_CONFIG.minimumGrowth));
            expect(s >= bounds.current[0] && s <= bounds.current[1], `${key} start ${s} outside ${bounds.current}`).toBe(true);
            expect(p >= bounds.potential[0] && p <= bounds.potential[1], `${key} potential ${p} outside ${bounds.potential}`).toBe(true);
          }
          expect(Object.keys(dna.start).sort()).toEqual([...attributesFor(position)].sort());
        }
      }
    }
    expect(seed).toBe(1800);
  });

  it('moves ability around without adding any: every influence gives the same average player', () => {
    const averages = INFLUENCES.map((influence) => {
      const players = Array.from({ length: 150 }, (_, seed) => generateDNA({ seed, position: influence.position, background: 'highSchool', primary: influence.id, secondaries: [] }));
      const keys = attributesFor(influence.position);
      return { id: influence.id, start: mean(players.map((d) => overall(d.start, keys))), potential: mean(players.map((d) => overall(d.potential, keys))) };
    });
    const skaters = averages.filter((a) => !a.id.startsWith('G'));
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    expect(spread(skaters.map((a) => a.start))).toBeLessThan(1);
    expect(spread(skaters.map((a) => a.potential))).toBeLessThan(1.5);
    const bias = influenceBias(skater());
    expect(Math.abs(mean(Object.values(bias)))).toBeLessThan(1e-9);
  });

  it('makes a player lean the way their influence did, more in potential than at the start', () => {
    const lean = (id: string, key: AttributeKey, field: 'start' | 'potential') => {
      const position = influenceById(id)?.position ?? 'forward';
      return mean(Array.from({ length: 300 }, (_, seed) => generateDNA({ seed, position, background: 'youth', primary: id, secondaries: [] })[field][key] ?? 0));
    };
    // Playmaker against power forward: passing and checking swap.
    expect(lean('F01', 'passing', 'start')).toBeGreaterThan(lean('F21', 'passing', 'start') + 5);
    expect(lean('F21', 'checking', 'start')).toBeGreaterThan(lean('F01', 'checking', 'start') + 8);
    const startGap = lean('F01', 'passing', 'start') - lean('F21', 'passing', 'start');
    const potentialGap = lean('F01', 'passing', 'potential') - lean('F21', 'passing', 'potential');
    expect(potentialGap).toBeGreaterThan(startGap * 1.5);
    // Goalies too.
    expect(lean('G02', 'reflexes', 'potential')).toBeGreaterThan(lean('G04', 'reflexes', 'potential') + 10);
  });

  it('names strengths and weaknesses that follow the influence, and takes tendencies from it', () => {
    const counts = new Map<string, number>();
    for (let seed = 0; seed < 300; seed++) for (const key of generateDNA(skater({ seed, primary: 'F08' })).strengths) counts.set(key, (counts.get(key) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).sort();
    expect(top).toEqual(['slapShotAccuracy', 'slapShotPower', 'wristShotPower']);
    const dna = generateDNA(skater({ primary: 'F01', secondaries: ['F33', 'D03'] }));
    expect(dna.tendencies.slice(0, 2)).toEqual(['playmaker', 'vision']);
    expect(dna.tendencies.length).toBeLessThanOrEqual(DNA_CONFIG.maxTendencies);
    expect(dna.strengths.length).toBe(3);
    expect(dna.weaknesses.length).toBe(3);
    expect(dna.strengths.some((k) => dna.weaknesses.includes(k))).toBe(false);
  });

  it('blends secondary influences in, with the primary counting most', () => {
    const solo = influenceBias(skater({ primary: 'F01' }));
    const blended = influenceBias(skater({ primary: 'F01', secondaries: ['F33'] }));
    const enforcer = influenceBias(skater({ primary: 'F33' }));
    expect(blended.checking).toBeGreaterThan(solo.checking ?? 0);
    expect(blended.checking).toBeLessThan(enforcer.checking ?? 0);
    expect(blended.passing).toBeGreaterThan(enforcer.passing ?? 0);
    expect(DNA_CONFIG.shares.map((s) => s.reduce((a, b) => a + b, 0))).toEqual([1, 1, 1]);
  });

  it('does not make copies: two players with the same hero differ, and none is elite at 18', () => {
    const players = Array.from({ length: 500 }, (_, seed) => generateDNA(skater({ seed, background: 'junior', primary: 'F01' })));
    expect(new Set(players.map((d) => JSON.stringify(d.start))).size).toBe(500);
    expect(Math.max(...players.map((d) => overall(d.start, SKATER_ATTRIBUTES)))).toBeLessThan(60);
    // Not everyone can become great at everything.
    const ceilings = players.map((d) => overall(d.potential, SKATER_ATTRIBUTES));
    expect(Math.min(...ceilings)).toBeLessThan(52);
    expect(Math.max(...ceilings)).toBeLessThan(85);
  });

  it('survives a trip through a save, and refuses a save it does not understand', () => {
    const dna = generateDNA(skater({ seed: 77, position: 'goalie', primary: 'G03', secondaries: ['G01'] }));
    expect(parseDNA(serializeDNA(dna))).toEqual(dna);
    expect(dna.version).toBe(DNA_VERSION);
    expect(() => parseDNA(JSON.stringify({ ...dna, version: 99 }))).toThrow(/version/);
    expect(() => parseDNA(JSON.stringify({ ...dna, primary: 'F01' }))).toThrow();
    expect(() => parseDNA(JSON.stringify({ ...dna, start: { ...dna.start, reflexes: 140 } }))).toThrow();
    // Saves carry neutral ids only, never a real name.
    for (const i of INFLUENCES) expect(serializeDNA(dna).includes(i.name)).toBe(false);
  });
});
