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
import { INFLUENCE_DATA } from './data/curatedInfluences';
import { Rng } from '../core/rng';
import { CORE_POOL_SIZE, NAME_POOLS } from './names';
import { PLAY_STYLES, playStyleWeight } from './playStyles';

export interface InfluenceRecord {
  id: string;
  /** The name shown. For curated influences this is the fictional identity (Decision 74): the build holds no real names. */
  name: string;
  /** Same as name for curated influences; null elsewhere. Kept so older code and saves read the same. */
  alias: string | null;
  /** An outside reference id, when one is known. Empty in the public registry. */
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
  /** True for a stable id whose record is not in this build. Position is unknown, so it is not checked. */
  unlisted?: boolean;
}

/**
 * curated: hand-written, the featured set. derived: one mild leaning from the career record (Decision 53).
 * limited: selectable, shapes nothing, shown with a limited-data label.
 * fictional: an invented professional in the fallback registry, with an authored-by-rule style profile (Decision 68).
 */
export type InfluenceSource = 'curated' | 'derived' | 'limited' | 'fictional';

export type InfluenceNameSet = 'real' | 'fictional';

/** Kept for compatibility. Every standard build is fictional (Decision 74); 'real' now shows the same names, because no real names are built in. */
export const INFLUENCE_NAME_SET: InfluenceNameSet = 'fictional';

export const INFLUENCES: readonly InfluenceRecord[] = INFLUENCE_DATA;

const BY_ID = new Map(INFLUENCES.map((i) => [i.id, i]));

const EXTENDED_POSITION: Record<string, Position> = { F: 'forward', D: 'defense', G: 'goalie' };

const MILD: Record<string, { weights: Partial<Record<AttributeKey, number>>; tags: string[]; blurb: string }> = {
  f: { weights: { offensiveAwareness: 1 }, tags: ['finisher'], blurb: 'Career record leans toward finishing.' },
  p: { weights: { passing: 1 }, tags: ['playmaker'], blurb: 'Career record leans toward setting others up.' },
};

function widerRecord(id: string, referenceId: string, name: string, position: Position, born: number, country: string, letter: string): InfluenceRecord {
  // One mild leaning for a skater whose record leans clearly one way (Decision 53). Goalies are always neutral.
  const mild = position === 'goalie' ? undefined : MILD[letter];
  return {
    id,
    name,
    alias: null,
    referenceId,
    position,
    born,
    country,
    shoots: null,
    heightIn: null,
    weightLb: null,
    tags: mild?.tags ?? [],
    weights: mild?.weights ?? {},
    blurb: mild?.blurb ?? 'Limited data: no playing style on file.',
    source: mild ? 'derived' : 'limited',
  };
}

/** The fictional professional registry (Decision 68). Settings, not rules. */
export const FALLBACK_COUNT = { forward: 120, defense: 80, goalie: 40 } as const;
export const FICTIONAL_CONFIG = {
  /** Share of fictional professionals who shoot (or catch) right-handed. */
  rightHandedShare: 0.25,
  /** Career accomplishment tiers and how common each is. Flavour only: they change no numbers. */
  accomplishments: [
    { label: 'Hall of Fame career', share: 0.05 },
    { label: 'Perennial all-star', share: 0.15 },
    { label: 'Long-time regular', share: 0.5 },
    { label: 'Brief stay in the big league', share: 0.3 },
  ],
} as const;

/**
 * The fictional professional registry: invented professionals, generated from the fictional name pools with a
 * fixed seed, so the game works with no outside data at all. Ids "X001" onward and their names are stable for as
 * long as the pools and the seed are unchanged. Each has a nationality, a generation, a position, a handedness,
 * a career accomplishment (flavour), and a balanced style profile taken from one of the approved play styles:
 * the style's main attribute counts 2, its others 1, the ones it leans away from -1.
 * This registry is separate from the recreational player population, which is generated elsewhere.
 */
function buildFallback(): InfluenceRecord[] {
  const root = new Rng(20261125);
  const rng = root.fork('fallback-influences');
  // Separate stream, so adding traits never changes who the people are.
  const traits = root.fork('fictional-traits');
  const out: InfluenceRecord[] = [];
  const used = new Set<string>(INFLUENCES.map((i) => i.name));
  let n = 0;
  for (const position of ['forward', 'defense', 'goalie'] as const) {
    const styles = PLAY_STYLES.filter((st) => st.positions.includes(position));
    for (let k = 0; k < FALLBACK_COUNT[position]; k++) {
      let name = '';
      let code = '';
      do {
        const pool = NAME_POOLS[rng.int(NAME_POOLS.length)] as (typeof NAME_POOLS)[number];
        // Only the core names: the pools grow, the professionals keep their names.
        name = `${pool.first[rng.int(CORE_POOL_SIZE)]} ${pool.last[rng.int(CORE_POOL_SIZE)]}`;
        code = pool.code;
      } while (used.has(name));
      used.add(name);
      const born = 1950 + rng.int(55);
      rng.next(); // kept so the names that follow do not change (this draw used to pick a leaning)
      n++;
      const style = styles[traits.int(styles.length)] as (typeof styles)[number];
      const shoots = traits.next() < FICTIONAL_CONFIG.rightHandedShare ? 'R' : 'L';
      let roll = traits.next();
      const tier = FICTIONAL_CONFIG.accomplishments.find((a) => (roll -= a.share) < 0) ?? FICTIONAL_CONFIG.accomplishments[2];
      const weights: Partial<Record<AttributeKey, number>> = {};
      for (const key of attributesFor(position)) {
        const w = playStyleWeight(style, key);
        if (w !== 0) weights[key] = w;
      }
      out.push({
        id: `X${String(n).padStart(3, '0')}`,
        name,
        alias: null,
        referenceId: '',
        position,
        born,
        country: code,
        shoots,
        heightIn: null,
        weightLb: null,
        tags: [style.name.toLowerCase()],
        weights,
        blurb: `${tier.label}. Played as a ${style.name.toLowerCase()}.`,
        source: 'fictional',
      });
    }
  }
  return out.sort((a, b) => (a.name.split(' ')[1] ?? '').localeCompare(b.name.split(' ')[1] ?? '') || a.name.localeCompare(b.name));
}

/**
 * A wider registry supplied from outside the repository: one line per person,
 * "reference id | name | F, D or G | birth year | country | f, p or empty". Ids become "N" plus the reference id.
 * Used only in private development builds while the source data's licence is unverified.
 */
export function parseWiderRegistry(lines: string): InfluenceRecord[] {
  const out: InfluenceRecord[] = [];
  for (const line of lines.split('\n')) {
    const [referenceId, name, pos, born, country, letter] = line.trim().split('|');
    const position = EXTENDED_POSITION[pos ?? ''];
    if (!referenceId || !name || !position) continue;
    out.push(widerRecord(`N${referenceId}`, referenceId, name, position, Number(born) || 0, country ?? '', letter ?? ''));
  }
  return out;
}

let fallback: InfluenceRecord[] | null = null;
let supplied: InfluenceRecord[] | null = null;
let widerById: Map<string, InfluenceRecord> | null = null;

function index(): Map<string, InfluenceRecord> {
  if (!widerById) {
    fallback ??= buildFallback();
    widerById = new Map([...fallback, ...(supplied ?? [])].map((i) => [i.id, i]));
  }
  return widerById;
}

/** Replace the fictional fallback with a supplied registry for browsing. Fallback ids keep resolving, so no saved player breaks. */
export function registerWiderRegistry(lines: string | null): number {
  supplied = lines ? parseWiderRegistry(lines) : null;
  widerById = null;
  return supplied?.length ?? 0;
}

export function widerRegistryKind(): 'fictional fallback' | 'supplied' {
  return supplied && supplied.length ? 'supplied' : 'fictional fallback';
}

/** Everyone outside the curated set that can be browsed: the supplied registry when there is one, otherwise the fictional fallback. */
export function extendedInfluences(): readonly InfluenceRecord[] {
  index();
  return supplied && supplied.length ? supplied : (fallback as InfluenceRecord[]);
}

export function influenceById(id: string): InfluenceRecord | undefined {
  const curated = BY_ID.get(id);
  if (curated) return curated;
  const wider = index().get(id);
  if (wider) return wider;
  // A stable "N" id whose record is not in this build (the supplied registry is absent): the id stays valid
  // and resolves to a neutral placeholder, so a player saved with it still loads. Nothing is invented about them.
  if (/^N\d+$/.test(id)) return { ...widerRecord(id, id.slice(1), 'Unlisted professional', 'forward', 0, '', ''), unlisted: true };
  return undefined;
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

/** The name to show: always the name built into the record. Curated influences are built with their fictional identity (Decision 74). */
export function influenceName(influence: InfluenceRecord, _nameSet: InfluenceNameSet = INFLUENCE_NAME_SET): string {
  return influence.alias ?? influence.name;
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
