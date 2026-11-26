import { describe, expect, it } from 'vitest';
import { startingArchetypesFor, STARTING_ARCHETYPES } from '../src/dynasty/archetypes';
import { CREATED_PLAYER_CONFIG, CREATED_PLAYER_STORE_VERSION, MAX_CREATED_PLAYERS, choosePickUpPlayer, cleanName, confirmDraft, deletePlayer, draftProblems, emptyDraft, emptyStore, parseStore, reconcileDraft, serializeStore } from '../src/dynasty/createdPlayer';
import type { CreatedPlayerStore, PlayerDraft } from '../src/dynasty/createdPlayer';
import { PROFILES, profileFit } from '../src/app/stage';

const ready = (over: Partial<PlayerDraft> = {}): PlayerDraft => ({ ...emptyDraft(), firstName: 'Dusty', lastName: 'Bottoms', primary: 'F01', secondaries: ['F08'], playStyle: 'PS02', archetype: 'AR04', ...over });
const withDraft = (draft: PlayerDraft, store: CreatedPlayerStore = emptyStore()): CreatedPlayerStore => ({ ...store, draft });

describe('starting archetypes (Decision 54)', () => {
  it('offers seven, by background and position, and always at least Rookie and Equipment Guy', () => {
    expect(STARTING_ARCHETYPES.map((a) => a.id)).toEqual(['AR01', 'AR02', 'AR03', 'AR04', 'AR05', 'AR06', 'AR07']);
    expect(startingArchetypesFor('forward', 'beginner').map((a) => a.id)).toEqual(['AR01', 'AR06']);
    expect(startingArchetypesFor('forward', 'pond').map((a) => a.id)).toEqual(['AR01', 'AR02', 'AR06']);
    expect(startingArchetypesFor('goalie', 'junior').map((a) => a.id)).toEqual(['AR01', 'AR03', 'AR06', 'AR07']);
    expect(startingArchetypesFor('defense', 'highSchool').map((a) => a.id)).toContain('AR04');
  });
});

describe('creating a player', () => {
  it('says what a draft still needs', () => {
    expect(draftProblems(emptyDraft())).toEqual(['First name', 'Last name', 'Primary influence', 'Play style', 'Archetype']);
    expect(draftProblems(ready())).toEqual([]);
    expect(cleanName("D4ve<>  O'Neil")).toBe("Dve O'Neil");
    expect(cleanName('Bartholomew-Fitzgerald').length).toBe(12);
  });

  it('drops choices that stop making sense when the position or background changes', () => {
    const goalie = reconcileDraft(ready({ position: 'goalie' }));
    expect(goalie.primary).toBeNull();
    expect(goalie.secondaries).toEqual([]);
    expect(goalie.playStyle).toBeNull();
    expect(goalie.archetype).toBe('AR04'); // Rink Rat depends on background, not position
    expect(reconcileDraft(ready({ position: 'goalie', archetype: 'AR07' })).archetype).toBe('AR07');
    expect(reconcileDraft(ready({ archetype: 'AR07' })).archetype).toBeNull();
    expect(reconcileDraft(ready({ background: 'pond' })).archetype).toBeNull();
    expect(reconcileDraft(ready({ secondaries: ['F01', 'F08', 'F08', 'F09', 'F10'] })).secondaries).toEqual(['F08', 'F09']);
    expect(reconcileDraft(ready())).toEqual(ready());
  });

  it('rolls once at confirmation, keeps the player, clears the draft, and never reuses an id', () => {
    const first = confirmDraft(withDraft(ready()), 12345);
    expect(first.problems).toEqual([]);
    expect(first.player?.id).toBe(1);
    expect(first.player?.dna.seed).toBe(12345);
    expect(first.player?.dna.playStyle).toBe('PS02');
    expect(first.player?.age).toBe(18);
    expect(first.store.draft).toBeNull();
    expect(first.store.players.length).toBe(1);
    const second = confirmDraft(withDraft(ready({ firstName: 'Chet' }), first.store), 777);
    expect(second.player?.id).toBe(2);
    expect(second.store.players[0]).toEqual(first.player);
    // Nothing to confirm, or not ready: the store is returned untouched.
    expect(confirmDraft(first.store, 1).player).toBeNull();
    const unready = withDraft(ready({ playStyle: null }), first.store);
    expect(confirmDraft(unready, 1).store).toBe(unready);
  });

  it('holds no seed or ratings before confirmation, so reopening the creator cannot roll again', () => {
    const text = serializeStore(withDraft(ready()));
    expect(text).not.toMatch(/seed|potential|talent|start"/);
    expect(Object.keys(ready()).sort()).toEqual(['archetype', 'background', 'firstName', 'lastName', 'playStyle', 'position', 'primary', 'secondaries']);
  });

  it('stops at the limit', () => {
    let store = emptyStore();
    for (let i = 0; i < MAX_CREATED_PLAYERS; i++) store = confirmDraft(withDraft(ready(), store), i + 1).store;
    expect(store.players.length).toBe(MAX_CREATED_PLAYERS);
    const over = confirmDraft(withDraft(ready(), store), 99);
    expect(over.player).toBeNull();
    expect(over.problems.join()).toMatch(/No more than/);
  });

  it('survives a save and load exactly, and refuses a damaged or unknown save rather than dropping players', () => {
    const store = withDraft(ready({ firstName: 'Next' }), confirmDraft(withDraft(ready()), 4242).store);
    const back = parseStore(serializeStore(store));
    expect(back).toEqual(store);
    expect(back.version).toBe(CREATED_PLAYER_STORE_VERSION);
    const raw = JSON.parse(serializeStore(store)) as { version: number; players: { dna: string; archetype: string }[]; draft: Record<string, unknown> };
    expect(() => parseStore(JSON.stringify({ ...raw, version: 9 }))).toThrow(/version/);
    expect(() => parseStore(JSON.stringify({ ...raw, players: [{ ...raw.players[0], dna: '{"version":2}' }] }))).toThrow();
    expect(() => parseStore(JSON.stringify({ ...raw, players: [{ ...raw.players[0], archetype: 'AR99' }] }))).toThrow(/damaged/);
    expect(() => parseStore(JSON.stringify({ ...raw, players: [raw.players[0], raw.players[0]] }))).toThrow(/share an id/);
    // A draft is only choices: a bad one is repaired, not refused.
    const repaired = parseStore(JSON.stringify({ ...raw, draft: { ...raw.draft, position: 'wizard', primary: 'G01', playStyle: 'PS99' } }));
    expect(repaired.draft?.position).toBe('forward');
    expect(repaired.draft?.primary).toBeNull();
    expect(repaired.draft?.playStyle).toBeNull();
    expect(repaired.players).toEqual(store.players);
  });
});

describe('stored players (Decision 63)', () => {
  const three = (): CreatedPlayerStore => {
    let store = emptyStore();
    for (let i = 0; i < 3; i++) store = confirmDraft(withDraft(ready({ firstName: `P${'abc'[i]}` }), store), i + 1).store;
    return store;
  };

  it('has eight slots, as a setting', () => {
    expect(CREATED_PLAYER_CONFIG.maxPlayers).toBe(8);
  });

  it('deletes only the player named, never reuses an id, and frees the slot', () => {
    const store = three();
    const result = deletePlayer(store, 2);
    expect(result.problems).toEqual([]);
    expect(result.store.players.map((p) => p.id)).toEqual([1, 3]);
    expect(result.store.players[0]).toBe(store.players[0]);
    expect(result.store.nextId).toBe(4);
    const next = confirmDraft(withDraft(ready(), result.store), 50);
    expect(next.player?.id).toBe(4);
    expect(deletePlayer(store, 99).problems).toEqual(['No such player']);
    expect(parseStore(serializeStore(result.store))).toEqual(result.store);
  });

  it('refuses to delete a character in an active career', () => {
    const store = three();
    const result = deletePlayer(store, 2, (id) => id === 2);
    expect(result.store).toBe(store);
    expect(result.problems.join()).toMatch(/active career/);
  });

  it('lets a created player be chosen for Pick-Up without a career, and clears the choice if they are deleted', () => {
    let store = choosePickUpPlayer(three(), 3);
    expect(store.pickUpId).toBe(3);
    expect(parseStore(serializeStore(store)).pickUpId).toBe(3);
    expect(choosePickUpPlayer(store, 42).pickUpId).toBeNull();
    store = deletePlayer(store, 3).store;
    expect(store.pickUpId).toBeNull();
    // A store saved before this field existed still loads.
    const old = JSON.parse(serializeStore(three())) as Record<string, unknown>;
    delete old.pickUpId;
    expect(parseStore(JSON.stringify(old)).pickUpId).toBeNull();
  });
});

describe('rendering profiles (Decision 38)', () => {
  it('keeps the ice at 480x320 and puts off-ice screens at 960x540', () => {
    expect(PROFILES.ice).toEqual({ width: 480, height: 320 });
    expect(PROFILES.offIce).toEqual({ width: 960, height: 540 });
  });

  it('scales by whole numbers where the window allows and shrinks to fit only below the design size', () => {
    expect(profileFit('offIce', 1920, 1080)).toEqual({ zoom: 2, shrink: 1 });
    expect(profileFit('offIce', 2560, 1440)).toEqual({ zoom: 2, shrink: 1 });
    expect(profileFit('offIce', 3840, 2160)).toEqual({ zoom: 4, shrink: 1 });
    expect(profileFit('offIce', 1366, 768)).toEqual({ zoom: 1, shrink: 1 });
    expect(profileFit('offIce', 800, 600).zoom).toBe(1);
    expect(profileFit('offIce', 800, 600).shrink).toBeCloseTo(800 / 960, 9);
    expect(profileFit('ice', 1920, 1080)).toEqual({ zoom: 3, shrink: 1 });
    expect(profileFit('ice', 400, 300).shrink).toBeCloseTo(400 / 480, 9);
  });
});
