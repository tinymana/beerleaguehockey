/**
 * Created players: what Create a Player produces and keeps.
 *
 * Two things are stored. A draft is the set of choices being made: it holds no seed and no ratings,
 * so reloading or reopening the creator cannot be used to roll again. A confirmed player holds the
 * Player DNA rolled once, at confirmation, and is never rolled again.
 *
 * Pure data and checks: where it is kept (the browser, for now) is the app's business.
 */
import type { Position } from './attributes';
import type { AppearanceRecord } from './appearance';
import { defaultAppearance, repairAppearance } from './appearance';
import { startingArchetypeById, startingArchetypesFor } from './archetypes';
import { backgroundsForAge, CREATED_PLAYER_AGE } from './backgrounds';
import type { DnaInput, PlayerDNA } from './dna';
import { dnaInputProblems, generateDNA, parseDNA, serializeDNA } from './dna';
import { playStyleById } from './playStyles';

export const CREATED_PLAYER_STORE_VERSION = 1;
/** Settings (Decision 63). Eight slots for Creator V1. */
export const CREATED_PLAYER_CONFIG = { maxPlayers: 8 };
/** Kept for callers that only want the number. */
export const MAX_CREATED_PLAYERS = CREATED_PLAYER_CONFIG.maxPlayers;
export const NAME_MAX = 12;

/** Personal details chosen in the creator. None of them changes an attribute. */
export interface PlayerProfile {
  /** Jersey number 0 to 99, or null for none yet. */
  number: number | null;
  shoots: 'L' | 'R';
  heightIn: number;
  weightLb: number;
  hometown: string;
}

export const PROFILE_LIMITS = { heightIn: [60, 82], weightLb: [120, 300], hometownMax: 16 } as const;

export function defaultProfile(): PlayerProfile {
  return { number: null, shoots: 'L', heightIn: 71, weightLb: 185, hometown: '' };
}

export function repairProfile(raw: unknown): PlayerProfile {
  const base = defaultProfile();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<PlayerProfile>;
  const within = (v: unknown, [lo, hi]: readonly [number, number], fallback: number): number => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : fallback);
  return {
    number: typeof r.number === 'number' && Number.isInteger(r.number) && r.number >= 0 && r.number <= 99 ? r.number : null,
    shoots: r.shoots === 'R' ? 'R' : 'L',
    heightIn: within(r.heightIn, PROFILE_LIMITS.heightIn, base.heightIn),
    weightLb: within(r.weightLb, PROFILE_LIMITS.weightLb, base.weightLb),
    hometown: cleanName(typeof r.hometown === 'string' ? r.hometown : '', PROFILE_LIMITS.hometownMax),
  };
}

export interface PlayerDraft {
  firstName: string;
  lastName: string;
  position: Position;
  background: string;
  primary: string | null;
  secondaries: string[];
  playStyle: string | null;
  archetype: string | null;
  /** How the player looks. Holds no rolled values and stays editable after confirmation. */
  appearance: AppearanceRecord;
  profile: PlayerProfile;
}

export interface CreatedPlayer {
  /** 1, 2, 3... in order of confirmation. Never reused. */
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  /** The starting archetype chosen in the creator. */
  archetype: string;
  dna: PlayerDNA;
  appearance: AppearanceRecord;
  profile: PlayerProfile;
}

export interface CreatedPlayerStore {
  version: number;
  /** The next id to hand out. */
  nextId: number;
  players: CreatedPlayer[];
  draft: PlayerDraft | null;
  /** The created player chosen for Pick-Up games, if any. No dynasty career is needed. */
  pickUpId?: number | null;
}

export function emptyDraft(): PlayerDraft {
  return { firstName: '', lastName: '', position: 'forward', background: 'youth', primary: null, secondaries: [], playStyle: null, archetype: null, appearance: defaultAppearance(), profile: defaultProfile() };
}

export function emptyStore(): CreatedPlayerStore {
  return { version: CREATED_PLAYER_STORE_VERSION, nextId: 1, players: [], draft: null, pickUpId: null };
}

export function cleanName(text: string, max: number = NAME_MAX): string {
  return text.replace(/[^A-Za-z' -]/g, '').replace(/\s+/g, ' ').slice(0, max);
}

/** Drop choices that no longer make sense after the position or background changed. */
export function reconcileDraft(draft: PlayerDraft): PlayerDraft {
  const next = { ...draft, secondaries: [...draft.secondaries], appearance: repairAppearance(draft.appearance), profile: repairProfile(draft.profile) };
  if (!backgroundsForAge(CREATED_PLAYER_AGE).some((b) => b.id === next.background)) next.background = 'youth';
  const style = next.playStyle ? playStyleById(next.playStyle) : undefined;
  if (!style || !style.positions.includes(next.position)) next.playStyle = null;
  if (!next.archetype || !startingArchetypesFor(next.position, next.background).some((a) => a.id === next.archetype)) next.archetype = null;
  const fits = (id: string | null): boolean => id !== null && dnaInputProblems({ seed: 0, position: next.position, background: next.background, primary: id, secondaries: [] }).length === 0;
  if (!fits(next.primary)) next.primary = null;
  next.secondaries = next.secondaries.filter((id, i, all) => fits(id) && id !== next.primary && all.indexOf(id) === i).slice(0, 2);
  if (next.primary === null) next.secondaries = [];
  return next;
}

/** What still stops this draft from being confirmed. Empty when it is ready. */
export function draftProblems(draft: PlayerDraft): string[] {
  const problems: string[] = [];
  if (!cleanName(draft.firstName).trim()) problems.push('First name');
  if (!cleanName(draft.lastName).trim()) problems.push('Last name');
  if (!draft.primary) problems.push('Primary influence');
  if (!draft.playStyle) problems.push('Play style');
  if (!draft.archetype) problems.push('Archetype');
  if (draft.primary) {
    const input = draftInput(draft, 0);
    if (input) problems.push(...dnaInputProblems(input));
  }
  return problems;
}

export function draftInput(draft: PlayerDraft, seed: number): DnaInput | null {
  if (!draft.primary) return null;
  return { seed, position: draft.position, background: draft.background, primary: draft.primary, secondaries: draft.secondaries, playStyle: draft.playStyle };
}

/**
 * Confirm the draft: roll the player once with the seed given, add them to the store and clear the draft.
 * Returns the same store untouched, with the reasons, if the draft is not ready or the store is full.
 */
export function confirmDraft(store: CreatedPlayerStore, seed: number): { store: CreatedPlayerStore; player: CreatedPlayer | null; problems: string[] } {
  const draft = store.draft;
  if (!draft) return { store, player: null, problems: ['No player is being created'] };
  const problems = draftProblems(draft);
  if (store.players.length >= CREATED_PLAYER_CONFIG.maxPlayers) problems.push(`No more than ${CREATED_PLAYER_CONFIG.maxPlayers} created players`);
  const input = draftInput(draft, seed);
  if (problems.length || !input || !draft.archetype) return { store, player: null, problems };
  const player: CreatedPlayer = {
    id: store.nextId,
    firstName: cleanName(draft.firstName).trim(),
    lastName: cleanName(draft.lastName).trim(),
    age: CREATED_PLAYER_AGE,
    archetype: draft.archetype,
    dna: generateDNA(input),
    appearance: repairAppearance(draft.appearance),
    profile: repairProfile(draft.profile),
  };
  return { store: { ...store, nextId: store.nextId + 1, players: [...store.players, player], draft: null, pickUpId: store.pickUpId ?? null }, player, problems: [] };
}

/**
 * Delete a created player. Only ever called after the player has explicitly confirmed.
 * A character in an active dynasty career is protected: `inCareer` says which ids those are (career saves are
 * stored separately and are never touched from here). The id is never handed out again.
 */
export function deletePlayer(store: CreatedPlayerStore, id: number, inCareer: (id: number) => boolean = () => false): { store: CreatedPlayerStore; problems: string[] } {
  if (!store.players.some((p) => p.id === id)) return { store, problems: ['No such player'] };
  if (inCareer(id)) return { store, problems: ['This player is in an active career and cannot be deleted'] };
  return { store: { ...store, players: store.players.filter((p) => p.id !== id), pickUpId: store.pickUpId === id ? null : (store.pickUpId ?? null) }, problems: [] };
}

/** Choose (or clear) the created player used in Pick-Up games. */
export function choosePickUpPlayer(store: CreatedPlayerStore, id: number | null): CreatedPlayerStore {
  return { ...store, pickUpId: id !== null && store.players.some((p) => p.id === id) ? id : null };
}

/** Change how a confirmed player looks. Nothing else about them can be changed. */
export function setPlayerAppearance(store: CreatedPlayerStore, id: number, appearance: AppearanceRecord): CreatedPlayerStore {
  return { ...store, players: store.players.map((p) => (p.id === id ? { ...p, appearance: repairAppearance(appearance) } : p)) };
}

/** Change a confirmed player's jersey number: the one personal detail that stays editable. */
export function setPlayerNumber(store: CreatedPlayerStore, id: number, number: number | null): CreatedPlayerStore {
  return { ...store, players: store.players.map((p) => (p.id === id ? { ...p, profile: repairProfile({ ...p.profile, number }) } : p)) };
}

export function serializeStore(store: CreatedPlayerStore): string {
  return JSON.stringify({ ...store, players: store.players.map((p) => ({ ...p, dna: serializeDNA(p.dna) })) });
}

/**
 * Read a store back. A confirmed player that cannot be read is never dropped silently: the whole
 * read fails with the reason, so the caller can keep the original text for recovery.
 */
export function parseStore(text: string): CreatedPlayerStore {
  const raw = JSON.parse(text) as { version?: number; nextId?: number; players?: unknown[]; draft?: Partial<PlayerDraft> | null; pickUpId?: number | null };
  if (raw.version !== CREATED_PLAYER_STORE_VERSION) throw new Error(`Created-player store version ${String(raw.version)} is not supported`);
  const players: CreatedPlayer[] = [];
  for (const entry of raw.players ?? []) {
    const p = entry as { id?: number; firstName?: string; lastName?: string; age?: number; archetype?: string; dna?: string; appearance?: unknown; profile?: unknown };
    if (typeof p.id !== 'number' || typeof p.dna !== 'string' || !p.archetype || !startingArchetypeById(p.archetype)) throw new Error('A created player record is damaged');
    players.push({ id: p.id, firstName: cleanName(p.firstName ?? ''), lastName: cleanName(p.lastName ?? ''), age: p.age ?? CREATED_PLAYER_AGE, archetype: p.archetype, dna: parseDNA(p.dna), appearance: repairAppearance(p.appearance), profile: repairProfile(p.profile) });
  }
  if (new Set(players.map((p) => p.id)).size !== players.length) throw new Error('Two created players share an id');
  const nextId = Math.max(raw.nextId ?? 1, ...players.map((p) => p.id + 1), 1);
  let draft: PlayerDraft | null = null;
  if (raw.draft) {
    const d = raw.draft;
    const position: Position = d.position === 'defense' || d.position === 'goalie' ? d.position : 'forward';
    // A draft is only choices: anything unreadable in it is reset rather than refused.
    draft = reconcileDraft({
      ...emptyDraft(),
      firstName: cleanName(String(d.firstName ?? '')),
      lastName: cleanName(String(d.lastName ?? '')),
      position,
      background: typeof d.background === 'string' ? d.background : 'youth',
      primary: typeof d.primary === 'string' ? d.primary : null,
      secondaries: Array.isArray(d.secondaries) ? d.secondaries.filter((s): s is string => typeof s === 'string') : [],
      playStyle: typeof d.playStyle === 'string' ? d.playStyle : null,
      archetype: typeof d.archetype === 'string' ? d.archetype : null,
      appearance: repairAppearance((d as { appearance?: unknown }).appearance),
      profile: repairProfile((d as { profile?: unknown }).profile),
    });
  }
  const pickUpId = typeof raw.pickUpId === 'number' && players.some((p) => p.id === raw.pickUpId) ? raw.pickUpId : null;
  return { version: CREATED_PLAYER_STORE_VERSION, nextId, players, draft, pickUpId };
}
