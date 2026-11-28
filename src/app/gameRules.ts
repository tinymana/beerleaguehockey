/**
 * The rules a Pick-Up game is played under, as the Options screen sets them.
 * Pure data and small functions (tested); only load and save touch the browser.
 * The choices offered are for trying things out: none of them is approved balance.
 */
import { MATCH } from '../match/sim/match';

export interface GameRules {
  periodSeconds: number;
  icing: boolean;
  offside: boolean;
  penalties: boolean;
  /** 0 is no overtime: a tie goes straight to the shootout. */
  overtimeSeconds: number;
  overtimeSkaters: number;
}

export type RuleKey = keyof GameRules;

/** What a new player gets: the creative director's rulings (Decisions 86, 95). */
export const DEFAULT_RULES: Readonly<GameRules> = { periodSeconds: 180, icing: true, offside: true, penalties: true, overtimeSeconds: 120, overtimeSkaters: 3 };

const clock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const onOff = (v: number | boolean): string => (v ? 'On' : 'Off');

export interface RuleRow {
  key: RuleKey;
  label: string;
  /** The values offered, in order. */
  choices: readonly (number | boolean)[];
  show: (value: number | boolean) => string;
}

export const RULE_ROWS: readonly RuleRow[] = [
  { key: 'periodSeconds', label: 'Period length', choices: [60, 120, 180, 300], show: (v) => clock(Number(v)) },
  { key: 'icing', label: 'Icing', choices: [true, false], show: onOff },
  { key: 'offside', label: 'Offside', choices: [true, false], show: onOff },
  { key: 'penalties', label: 'Penalties', choices: [true, false], show: onOff },
  { key: 'overtimeSeconds', label: 'Overtime', choices: [0, 60, 120, 180], show: (v) => (v ? clock(Number(v)) : 'Off') },
  { key: 'overtimeSkaters', label: 'Overtime skaters', choices: [3, 4, 5], show: (v) => `${v} on ${v}` },
];

/** The next (or previous) choice for one rule, wrapping round. A value that is not on the list starts from the default. */
export function cycleRule(rules: GameRules, key: RuleKey, step: 1 | -1): GameRules {
  const row = RULE_ROWS.find((r) => r.key === key);
  if (!row) return rules;
  const at = row.choices.indexOf(rules[key]);
  const from = at === -1 ? row.choices.indexOf(DEFAULT_RULES[key]) : at;
  const next = row.choices[(from + step + row.choices.length) % row.choices.length];
  return { ...rules, [key]: next } as GameRules;
}

/** "Period length" and "3:00", for one row of the screen. */
export function ruleText(rules: GameRules, row: RuleRow): [string, string] {
  return [row.label, row.show(rules[row.key])];
}

/** Read saved rules, keeping only values that are on the lists; anything else falls back to the default. Never throws. */
export function parseRules(text: string | null): GameRules {
  const out: GameRules = { ...DEFAULT_RULES };
  if (!text) return out;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return out;
  }
  if (typeof raw !== 'object' || raw === null) return out;
  for (const row of RULE_ROWS) {
    const v = (raw as Record<string, unknown>)[row.key];
    if ((typeof v === 'number' || typeof v === 'boolean') && row.choices.includes(v)) (out as unknown as Record<string, number | boolean>)[row.key] = v;
  }
  return out;
}

export const isDefault = (rules: GameRules): boolean => RULE_ROWS.every((r) => rules[r.key] === DEFAULT_RULES[r.key]);

/** Put the lengths into the game's match data, and return the on-off switches for the simulation. Call before a game is set up. */
export function applyRules(rules: GameRules): { icing: boolean; offside: boolean; penalties: boolean } {
  MATCH.periodSeconds = rules.periodSeconds;
  MATCH.overtimeSeconds = rules.overtimeSeconds;
  MATCH.overtimeSkaters = rules.overtimeSkaters;
  return { icing: rules.icing, offside: rules.offside, penalties: rules.penalties };
}

const STORAGE_KEY = 'blh.rules.v1';

export function loadRules(): GameRules {
  try {
    return parseRules(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_RULES };
  }
}

export function saveRules(rules: GameRules): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // Storage is unavailable (private window): the rules still hold for this visit.
  }
}
