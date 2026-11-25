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
}

export type InfluenceNameSet = 'real' | 'fictional';

/** Which names the game shows. 'real' during development; switch to 'fictional' if a release requires it. */
export const INFLUENCE_NAME_SET: InfluenceNameSet = 'real';

export const INFLUENCES: readonly InfluenceRecord[] = INFLUENCE_DATA;

const BY_ID = new Map(INFLUENCES.map((i) => [i.id, i]));

export function influenceById(id: string): InfluenceRecord | undefined {
  return BY_ID.get(id);
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
