import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_RULES, RULE_ROWS, applyRules, cycleRule, isDefault, parseRules, ruleText } from '../src/app/gameRules';
import { MATCH, penaltySeconds } from '../src/match/sim/match';
import { SkatingSim } from '../src/match/sim/skatingSim';
import { cloneTuning } from '../src/match/sim/tuning';

afterEach(() => {
  applyRules({ ...DEFAULT_RULES });
});

describe('Options: the Pick-Up rules (Decision 96)', () => {
  it('the standard rules are the rulings: 3:00 periods, icing, offside and penalties on, 2:00 overtime three on three', () => {
    expect(DEFAULT_RULES).toEqual({ periodSeconds: 180, icing: true, offside: true, penalties: true, overtimeSeconds: 120, overtimeSkaters: 3 });
    expect([MATCH.periodSeconds, MATCH.overtimeSeconds, MATCH.overtimeSkaters]).toEqual([180, 120, 3]);
    for (const row of RULE_ROWS) expect(row.choices, row.key).toContain(DEFAULT_RULES[row.key]);
    expect(isDefault({ ...DEFAULT_RULES })).toBe(true);
  });

  it('each rule steps through its choices both ways and wraps round', () => {
    for (const row of RULE_ROWS) {
      let rules = { ...DEFAULT_RULES };
      const seen = new Set<number | boolean>();
      for (let i = 0; i < row.choices.length; i++) {
        rules = cycleRule(rules, row.key, 1);
        seen.add(rules[row.key]);
      }
      expect(seen.size, row.key).toBe(row.choices.length);
      expect(rules).toEqual(DEFAULT_RULES);
      expect(cycleRule(cycleRule(rules, row.key, 1), row.key, -1)).toEqual(DEFAULT_RULES);
    }
    expect(isDefault(cycleRule({ ...DEFAULT_RULES }, 'icing', 1))).toBe(false);
  });

  it('the words on the screen fit a row (6 px a letter, 228 px between the margins)', () => {
    const period = RULE_ROWS[0]!;
    expect(ruleText({ ...DEFAULT_RULES }, period)).toEqual(['Period length', '3:00']);
    expect(ruleText({ ...DEFAULT_RULES, overtimeSeconds: 0 }, RULE_ROWS[4]!)).toEqual(['Overtime', 'Off']);
    expect(ruleText({ ...DEFAULT_RULES }, RULE_ROWS[5]!)).toEqual(['Overtime skaters', '3 on 3']);
    for (const row of RULE_ROWS) for (const c of row.choices) expect((`> ${row.label}`.length + `< ${row.show(c)} >`.length + 2) * 6).toBeLessThanOrEqual(228);
  });

  it('saved rules that are damaged or off the lists fall back to the standard ones', () => {
    expect(parseRules(null)).toEqual(DEFAULT_RULES);
    expect(parseRules('not json')).toEqual(DEFAULT_RULES);
    expect(parseRules('[1,2]')).toEqual(DEFAULT_RULES);
    expect(parseRules(JSON.stringify({ periodSeconds: 7, icing: 'no', offside: false, overtimeSkaters: 5, extra: 1 }))).toEqual({ ...DEFAULT_RULES, offside: false, overtimeSkaters: 5 });
    const custom = { periodSeconds: 60, icing: false, offside: false, penalties: false, overtimeSeconds: 0, overtimeSkaters: 4 };
    expect(parseRules(JSON.stringify(custom))).toEqual(custom);
  });

  it('applied before a game, they set the clock, the penalty length, overtime and the switches', () => {
    const idle = { moveX: 0, moveY: 0, shoot: false };
    const sim = new SkatingSim(cloneTuning());
    sim.demo = true;
    sim.rules = applyRules({ ...DEFAULT_RULES, periodSeconds: 60, penalties: false, overtimeSeconds: 0 });
    sim.setTeams(true, true, 3);
    const m = sim.match;
    if (!m) throw new Error('no match');
    expect(m.clock).toBe(60);
    expect(penaltySeconds()).toBe(6);
    expect(sim.rules).toEqual({ icing: true, offside: true, penalties: false });
    // No overtime: a tie after three goes straight to the shootout.
    for (let i = 0; i < 400 && m.phase !== 'play'; i++) sim.step(idle);
    m.period = MATCH.periods;
    sim.score = [1, 1];
    m.clock = 0.05;
    for (let i = 0; i < 600 && m.phase !== 'shootout'; i++) sim.step(idle);
    expect(m.phase).toBe('shootout');

    // Four on four in overtime.
    const other = new SkatingSim(cloneTuning());
    other.demo = true;
    other.rules = applyRules({ ...DEFAULT_RULES, overtimeSkaters: 4, overtimeSeconds: 60 });
    other.setTeams(true, true, 3);
    const o = other.match;
    if (!o) throw new Error('no match');
    for (let i = 0; i < 400 && o.phase !== 'play'; i++) other.step(idle);
    o.period = MATCH.periods;
    other.score = [1, 1];
    o.clock = 0.05;
    for (let i = 0; i < 600 && o.phase !== 'intermission'; i++) other.step(idle);
    other.advance();
    expect(o.clock).toBe(60);
    expect(other.skaters.filter((s) => !s.out).length).toBe(8);
  });
});
