import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GOALIE_ATTRIBUTES, SKATER_ATTRIBUTES, applyPermanentChange, attributesFor, effectiveRating, overall, withTemporary, withoutTemporary } from '../src/dynasty/attributes';
import type { AttributeKey, Position } from '../src/dynasty/attributes';
import { BACKGROUNDS, CREATED_PLAYER_AGE, backgroundsForAge } from '../src/dynasty/backgrounds';
import { DNA_CONFIG, DNA_VERSION, attributeBounds, dnaInputProblems, generateDNA, influenceBias, parseDNA, serializeDNA, startingAttributes, startingBias } from '../src/dynasty/dna';
import { PLAY_STYLES, developsFaster, playStyleById, playStylesFor } from '../src/dynasty/playStyles';
import type { DnaInput } from '../src/dynasty/dna';
import { INFLUENCES, extendedInfluences, influenceById, influenceName, influenceSource, influencesFor, missingAliases, registryProblems, searchInfluences } from '../src/dynasty/influences';

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
    for (const shares of DNA_CONFIG.shares) expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    // Decision 41: 60 / 25 / 15, and the same 60:25 ratio when there is only one secondary.
    expect(DNA_CONFIG.shares[2]).toEqual([0.6, 0.25, 0.15]);
    expect((DNA_CONFIG.shares[1]?.[0] ?? 0) / (DNA_CONFIG.shares[1]?.[1] ?? 1)).toBeCloseTo(60 / 25, 9);
    // The first secondary counts for more than the second: order matters.
    const ab = influenceBias(skater({ primary: 'F01', secondaries: ['F33', 'F04'] }));
    const ba = influenceBias(skater({ primary: 'F01', secondaries: ['F04', 'F33'] }));
    expect(ab.checking).toBeGreaterThan(ba.checking ?? 0);
    expect(ba.skatingSpeed).toBeGreaterThan(ab.skatingSpeed ?? 0);
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

describe('play styles (Decision 48)', () => {
  const sum = (r: Record<string, number | undefined>) => Object.values(r).reduce<number>((a, b) => a + (b ?? 0), 0);

  it('registers 17 styles, each for real positions and real attributes, none leaning both ways', () => {
    expect(PLAY_STYLES.length).toBe(17);
    expect(new Set(PLAY_STYLES.map((s) => s.id)).size).toBe(17);
    for (const style of PLAY_STYLES) {
      for (const position of style.positions) {
        const keys = position === 'goalie' ? GOALIE_ATTRIBUTES : SKATER_ATTRIBUTES;
        for (const key of [...style.toward, ...style.away]) expect(keys, `${style.id} ${key}`).toContain(key);
      }
      expect(style.toward.filter((k) => style.away.includes(k))).toEqual([]);
      expect(developsFaster(style, style.toward[0]!)).toBe(true);
    }
    expect(playStylesFor('forward').length).toBe(9);
    expect(playStylesFor('defense').length).toBe(7);
    expect(playStylesFor('goalie').length).toBe(4);
  });

  it('is a quarter of the starting spread and faster development by a fifth, as settings', () => {
    expect(DNA_CONFIG.playStyleShare).toBe(0.25);
    expect(DNA_CONFIG.playStyleDevelopment).toBe(0.2);
    const none = startingBias(skater());
    const styled = startingBias(skater({ playStyle: 'PS01' }));
    expect(none).toEqual(influenceBias(skater()));
    expect(Math.abs(sum(styled))).toBeLessThan(1e-9);
    // With the share at zero the style does nothing; at one the influences do nothing.
    expect(startingBias(skater({ playStyle: 'PS01' }), { ...DNA_CONFIG, playStyleShare: 0 })).toEqual(none);
    const all = startingBias(skater({ playStyle: 'PS01' }), { ...DNA_CONFIG, playStyleShare: 1 });
    expect(all).toEqual(startingBias(skater({ playStyle: 'PS01', primary: 'F08' }), { ...DNA_CONFIG, playStyleShare: 1 }));
    for (const key of SKATER_ATTRIBUTES) expect(styled[key]).toBeCloseTo(0.75 * (none[key] ?? 0) + 0.25 * (all[key] ?? 0), 9);
  });

  it('reshapes the starting player inside the same budget and never moves a ceiling', () => {
    for (const style of PLAY_STYLES) {
      const position = style.positions[0]!;
      const primary = position === 'goalie' ? 'G01' : position === 'defense' ? 'D01' : 'F01';
      let plainTotal = 0, styledTotal = 0, toward = 0, away = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const base = { seed, position, background: 'youth', primary, secondaries: [] } as DnaInput;
        const plain = generateDNA(base);
        const styled = generateDNA({ ...base, playStyle: style.id });
        expect(styled.potential).toEqual(plain.potential);
        expect(styled.talent).toBe(plain.talent);
        for (const key of attributesFor(position)) expect(styled.start[key]!).toBeLessThanOrEqual(styled.potential[key]!);
        plainTotal += sum(plain.start);
        styledTotal += sum(styled.start);
        toward += styled.start[style.toward[0]!]! - plain.start[style.toward[0]!]!;
        away += styled.start[style.away[0]!]! - plain.start[style.away[0]!]!;
      }
      const attributes = (position === 'goalie' ? GOALIE_ATTRIBUTES : SKATER_ATTRIBUTES).length;
      // Same budget: the average rating moves by well under a point (rounding and the ceiling cap only).
      expect(Math.abs(styledTotal - plainTotal) / 150 / attributes, style.id).toBeLessThan(0.5);
      // The style's own attribute gains on the one it leans away from. (A style that matches the influence adds little on top: that is intended.)
      expect((toward - away) / 150, style.id).toBeGreaterThan(0.8);
    }
  });

  it('stays inside the published range, refuses a style for the wrong position, and reads old saves', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const input = skater({ seed, playStyle: 'PS04', primary: 'F33', secondaries: ['F08'] });
      const dna = generateDNA(input);
      for (const key of SKATER_ATTRIBUTES) {
        const bounds = attributeBounds(input, key);
        expect(dna.start[key]!).toBeGreaterThanOrEqual(bounds.current[0]);
        expect(dna.start[key]!).toBeLessThanOrEqual(bounds.current[1]);
        expect(dna.potential[key]!).toBeGreaterThanOrEqual(bounds.potential[0]);
        expect(dna.potential[key]!).toBeLessThanOrEqual(bounds.potential[1]);
      }
    }
    expect(dnaInputProblems(skater({ playStyle: 'PS14' })).join()).toMatch(/not a play style/);
    expect(dnaInputProblems(skater({ playStyle: 'PS99' })).join()).toMatch(/unknown play style/);
    expect(playStyleById('PS07')?.positions).toEqual(['forward', 'defense']);
    const styled = generateDNA(skater({ playStyle: 'PS02' }));
    expect(parseDNA(serializeDNA(styled))).toEqual(styled);
    const old = generateDNA(skater());
    const { playStyle: _dropped, ...v1 } = old;
    const migrated = parseDNA(JSON.stringify({ ...v1, version: 1 }));
    expect(migrated).toEqual(old);
    expect(migrated.playStyle).toBeNull();
  });
});

describe('the wider influence registry (Decision 53)', () => {
  it('leaves the 64 curated profiles as the featured set and adds everyone else behind neutral ids', () => {
    expect(INFLUENCES.length).toBe(64);
    const wider = extendedInfluences();
    expect(wider.length).toBeGreaterThan(8000);
    const curatedRefs = new Set(INFLUENCES.map((i) => i.referenceId));
    const ids = new Set<string>();
    for (const i of wider) {
      expect(i.id).toBe(`N${i.referenceId}`);
      expect(curatedRefs.has(i.referenceId)).toBe(false);
      ids.add(i.id);
    }
    expect(ids.size).toBe(wider.length);
    expect(influenceById('F01')?.name).toBe('Wayne Gretzky');
    expect(influenceSource(influenceById('F01')!)).toBe('curated');
  });

  it('gives a derived skater exactly one mild leaning, and nothing else to anyone', () => {
    const counts = { derived: 0, limited: 0 };
    for (const i of extendedInfluences()) {
      const entries = Object.entries(i.weights);
      const source = influenceSource(i);
      if (source === 'derived') {
        counts.derived++;
        expect(i.position).not.toBe('goalie');
        expect(entries.length).toBe(1);
        expect(entries[0]![1]).toBe(1);
        expect(['offensiveAwareness', 'passing']).toContain(entries[0]![0]);
        expect(i.tags).toEqual([entries[0]![0] === 'passing' ? 'playmaker' : 'finisher']);
      } else {
        counts.limited++;
        expect(source).toBe('limited');
        expect(entries).toEqual([]);
        expect(i.tags).toEqual([]);
      }
    }
    expect(counts.derived).toBeGreaterThan(700);
    expect(counts.derived).toBeLessThan(900);
  });

  it('a limited-data influence shapes nothing; a derived one leans mildly; both stay inside the budget', () => {
    const wider = extendedInfluences();
    const neutral = wider.find((i) => influenceSource(i) === 'limited' && i.position === 'forward')!;
    const finisher = wider.find((i) => influenceSource(i) === 'derived' && i.weights.offensiveAwareness === 1)!;
    const flat = influenceBias(skater({ primary: neutral.id }));
    for (const key of SKATER_ATTRIBUTES) expect(flat[key]).toBeCloseTo(0, 9);
    const lean = influenceBias(skater({ primary: finisher.id }));
    expect(lean.offensiveAwareness!).toBeGreaterThan(0.9);
    expect(SKATER_ATTRIBUTES.reduce((a, k) => a + (lean[k] ?? 0), 0)).toBeCloseTo(0, 9);
    // As a 15% secondary beside a curated primary it barely moves anything, and the curated profile still dominates.
    const mixed = influenceBias(skater({ primary: 'F33', secondaries: ['F08', finisher.id] }));
    expect(mixed.strength!).toBeGreaterThan(mixed.offensiveAwareness!);
    expect(generateDNA(skater({ primary: neutral.id, playStyle: 'PS01' })).playStyle).toBe('PS01');
    expect(dnaInputProblems(skater({ position: 'goalie', primary: neutral.id })).length).toBeGreaterThan(0);
  });

  it('searches by any part of a name, ignoring accents, curated first, goalies only for goalies', () => {
    const hits = searchInfluences('forward', 'lidstrom');
    expect(hits[0]?.id).toBe('D02');
    expect(searchInfluences('forward', 'gretz').map((i) => i.id)).toContain('F01');
    expect(searchInfluences('goalie', '').slice(0, 10).every((i) => i.position === 'goalie')).toBe(true);
    expect(searchInfluences('forward', '', 70).slice(0, 54).every((i) => influenceSource(i) === 'curated')).toBe(true);
    expect(searchInfluences('forward', 'zzzzqq')).toEqual([]);
    expect(searchInfluences('forward', '', 25).length).toBe(25);
  });
});
