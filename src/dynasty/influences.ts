/**
 * Hockey Influences: the professionals a player grew up watching and tries to play like.
 * An influence shapes how a player's ability is distributed and where it can grow.
 * It never makes the player a copy of anyone.
 *
 * The registry is data (data/influences/curated.tsv). Ids are neutral ("F07"), so saves
 * never contain a real name, and every display name can be swapped for a fictional alias.
 */
import type { AttributeKey, Position } from './attributes';
import { attributesFor } from './attributes';
import { INFLUENCE_DATA } from './data/influences';
import { EXTENDED_INFLUENCE_LINES } from './data/influencesExtended';

export interface InfluenceRecord {
  id: string;
  /** Real name, used during development (Decision 34). */
  name: string;
  /** Fictional replacement, when one has been written. */
  alias: string | null;
  /** Row in data/reference/nhl_players.csv this record's facts came from. */
  referenceId: string;
  position: Position;
  born: number;
  country: string;
  shoots: string | null;
  heightIn: number | null;
  weightLb: number | null;
  /** Playing tendencies. */
  tags: string[];
  /** 2 signature, 1 strong, -1 weak. Unlisted attributes are 0. */
  weights: Partial<Record<AttributeKey, number>>;
  blurb: string;
  /** Where the style profile came from. Absent means curated. */
  source?: InfluenceSource;
}

/**
 * curated: hand-written, the featured set. derived: one mild leaning from the career record (Decision 53).
 * limited: selectable, shapes nothing, shown with a limited-data label.
 */
export type InfluenceSource = 'curated' | 'derived' | 'limited';

export type InfluenceNameSet = 'real' | 'fictional';

/** Which names the game shows. 'real' during development; switch to 'fictional' if a release requires it. */
export const INFLUENCE_NAME_SET: InfluenceNameSet = 'real';

export const INFLUENCES: readonly InfluenceRecord[] = INFLUENCE_DATA;

const BY_ID = new Map(INFLUENCES.map((i) => [i.id, i]));

const EXTENDED_POSITION: Record<string, Position> = { F: 'forward', D: 'defense', G: 'goalie' };

/**
 * The wider registry: everyone else in the reference file. Ids are "N" plus the NHL id.
 * Skaters whose career record leans clearly one way get a single mild leaning: a finisher toward
 * offensive awareness, a playmaker toward passing. Nothing else is inferred, and goalies are always neutral.
 */
function parseExtended(lines: string): InfluenceRecord[] {
  const out: InfluenceRecord[] = [];
  for (const line of lines.split('\n')) {
    const [referenceId, name, pos, born, country, letter] = line.split('|');
    const position = EXTENDED_POSITION[pos ?? ''];
    if (!referenceId || !name || !position) continue;
    const tendency = position === 'goalie' ? '' : letter;
    const weights: Partial<Record<AttributeKey, number>> = tendency === 'f' ? { offensiveAwareness: 1 } : tendency === 'p' ? { passing: 1 } : {};
    out.push({
      id: `N${referenceId}`,
      name,
      alias: null,
      referenceId,
      position,
      born: Number(born) || 0,
      country: country ?? '',
      shoots: null,
      heightIn: null,
      weightLb: null,
      tags: tendency === 'f' ? ['finisher'] : tendency === 'p' ? ['playmaker'] : [],
      weights,
      blurb: tendency === 'f' ? 'Career record leans toward finishing.' : tendency === 'p' ? 'Career record leans toward setting others up.' : 'Limited data: no playing style on file.',
      source: tendency === 'f' || tendency === 'p' ? 'derived' : 'limited',
    });
  }
  return out;
}

let extended: InfluenceRecord[] | null = null;
let extendedById: Map<string, InfluenceRecord> | null = null;

/** Everyone outside the curated set, in surname order. Parsed on first use. */
export function extendedInfluences(): readonly InfluenceRecord[] {
  if (!extended) {
    extended = parseExtended(EXTENDED_INFLUENCE_LINES);
    extendedById = new Map(extended.map((i) => [i.id, i]));
  }
  return extended;
}

export function influenceById(id: string): InfluenceRecord | undefined {
  const curated = BY_ID.get(id);
  if (curated || !id.startsWith('N')) return curated;
  extendedInfluences();
  return extendedById?.get(id);
}

export function influenceSource(influence: InfluenceRecord): InfluenceSource {
  return influence.source ?? 'curated';
}

/** Lower-case, accents removed: so "lidstrom" finds "Lidström". */
export function searchKey(text: string): string {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Influences a player at this position may choose, curated first, then the wider registry in surname order.
 * `query` matches any part of the name. Returns at most `limit`.
 */
export function searchInfluences(position: Position, query: string, limit = 50): InfluenceRecord[] {
  const goalie = position === 'goalie';
  const q = searchKey(query.trim());
  // Curated before the wider registry; within each, names where a word starts with the query before names that merely contain it.
  const out: InfluenceRecord[] = [];
  for (const list of [INFLUENCES, extendedInfluences()]) {
    const inside: InfluenceRecord[] = [];
    for (const i of list) {
      if ((i.position === 'goalie') !== goalie) continue;
      if (!q) {
        out.push(i);
      } else {
        const name = searchKey(influenceName(i));
        const at = name.indexOf(q);
        if (at < 0) continue;
        if (at === 0 || name[at - 1] === ' ' || name.includes(` ${q}`)) out.push(i);
        else inside.push(i);
      }
      if (out.length >= limit) return out;
    }
    out.push(...inside);
    if (out.length >= limit) return out.slice(0, limit);
  }
  return out;
}

/** The name to show. With fictional names on, an influence without an alias shows its id rather than a real name. */
export function influenceName(influence: InfluenceRecord, nameSet: InfluenceNameSet = INFLUENCE_NAME_SET): string {
  return nameSet === 'real' ? influence.name : (influence.alias ?? `Influence ${influence.id}`);
}

/** Goalies learn from goalies; skaters may take any skater as an influence, whatever position either plays. */
export function influencesFor(position: Position): InfluenceRecord[] {
  return INFLUENCES.filter((i) => (i.position === 'goalie') === (position === 'goalie'));
}

export function influenceWeight(influence: InfluenceRecord, key: AttributeKey): number {
  return influence.weights[key] ?? 0;
}

/** Problems with the registry itself. Empty when it is sound. */
export function registryProblems(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const i of INFLUENCES) {
    if (ids.has(i.id)) problems.push(`${i.id}: duplicate id`);
    ids.add(i.id);
    const allowed = new Set<string>(attributesFor(i.position));
    for (const [key, weight] of Object.entries(i.weights)) {
      if (!allowed.has(key)) problems.push(`${i.id}: ${key} is not a ${i.position} attribute`);
      if (weight !== 2 && weight !== 1 && weight !== -1) problems.push(`${i.id}: ${key} has weight ${weight}`);
    }
    const values = Object.values(i.weights);
    if (!values.includes(2) || !values.includes(-1)) problems.push(`${i.id}: needs at least one signature strength and one weakness`);
    if (i.tags.length === 0) problems.push(`${i.id}: no tags`);
    if (!i.blurb) problems.push(`${i.id}: no blurb`);
  }
  return problems;
}

/** Influences that still need a fictional alias before real names could be switched off. */
export function missingAliases(): string[] {
  return INFLUENCES.filter((i) => !i.alias).map((i) => i.id);
}
