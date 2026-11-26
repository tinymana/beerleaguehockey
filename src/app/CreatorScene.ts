import Phaser from 'phaser';
import { Rng } from '../core/rng';
import { ATTRIBUTE_LABELS, attributesFor, overall } from '../dynasty/attributes';
import type { AttributeKey, Position } from '../dynasty/attributes';
import type { AppearancePart, AppearanceRecord, CatalogOption, EquipmentSlot } from '../dynasty/appearance';
import { EQUIPMENT_SLOTS, NATIONALITIES, RANDOM_FIELDS, composeAppearance, equipmentOptions, nationalityByCode, optionsFor, randomizeAppearance, skinToneColors } from '../dynasty/appearance';
import { startingArchetypeById, startingArchetypesFor } from '../dynasty/archetypes';
import { CREATED_PLAYER_AGE, backgroundById, backgroundsForAge } from '../dynasty/backgrounds';
import type { CreatedPlayer, CreatedPlayerStore, PlayerDraft, PlayerProfile } from '../dynasty/createdPlayer';
import { CREATED_PLAYER_CONFIG, NAME_MAX, PROFILE_LIMITS, setPlayerAppearance, setPlayerNumber, choosePickUpPlayer, cleanName, confirmDraft, deletePlayer, draftInput, draftProblems, emptyDraft, reconcileDraft } from '../dynasty/createdPlayer';
import { attributeBounds, startingAttributes } from '../dynasty/dna';
import { influenceById, influenceName, influenceSource, registerWiderRegistry, searchInfluences } from '../dynasty/influences';
import { randomName } from '../dynasty/names';
import type { InfluenceRecord } from '../dynasty/influences';
import { developmentFocus, playStyleById, playStylesFor } from '../dynasty/playStyles';
import { DNA_CONFIG } from '../dynasty/dna';
import { SCENES, UI, VERSION } from './config';
import { loadCreatedPlayers, saveCreatedPlayers } from './createdPlayerStore';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { createdPlayer } from './session';
import { PROFILES, setProfile, setTitleArtVisible } from './stage';

export const CARD_ART = { key: 'cards-16-10', url: './assets/cards/16_10/card_art.png', manifestKey: 'cards-16-10-manifest', manifestUrl: './assets/cards/16_10/manifest.json' };
/** On-screen keyboard, for gamepad and mouse. A physical keyboard types straight in. */
const KEYS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', "'", '-', 'SPACE', 'DEL', 'DONE'] as const;
const KEY_COLS = 7;
export const UI_KIT = { key: 'ui-16-11', url: './assets/ui/16_11/ui_atlas.png', manifestKey: 'ui-16-11-manifest', manifestUrl: './assets/ui/16_11/manifest.json' };

const W = PROFILES.offIce.width;
const STEPS = ['Profile', 'Nationality', 'Appearance', 'Background', 'Influences', 'Play Style', 'Archetype', 'Review', 'Saved Players'] as const;
type StepName = (typeof STEPS)[number];
const stepAt = (name: StepName): number => STEPS.indexOf(name);
const CHARACTER = { frames: 'character-frames', framesUrl: './assets/character/frames.json', atlases: ['model', 'face', 'bald', 'hair', 'beard', 'body', 'equipment', 'flag', 'icons'] };
/**
 * Which batch 16.09 icon stands for each attribute. Where the batch has no icon of its own for an attribute, a related
 * one is shared (wrist and slap shots share the shot icons) or none is shown (balance, faceoffs, recovery).
 */
const ATTRIBUTE_ICONS: Partial<Record<AttributeKey, string>> = {
  skatingSpeed: 'skating', acceleration: 'acceleration', agility: 'agility', endurance: 'endurance',
  wristShotPower: 'shot_power', wristShotAccuracy: 'shot_accuracy', slapShotPower: 'shot_power', slapShotAccuracy: 'shot_accuracy',
  passing: 'passing', puckControl: 'puck_control', offensiveAwareness: 'shooting', defensiveAwareness: 'defense',
  checking: 'checking', strength: 'strength', discipline: 'discipline', durability: 'durability', leadership: 'leadership',
  composure: 'composure', hockeyIQ: 'hockey_iq', reflexes: 'goaltending', positioning: 'positioning', gloveHand: 'save_hands',
  blocker: 'save_hands', padSaves: 'goaltending', reboundControl: 'rebound_control', puckHandling: 'stickhandling',
};
const GRID = { x: 710, y: 92, colW: 121, rowH: 34, rows: 11, bar: 76 };
const PARTS: readonly { part: AppearancePart; label: string; none: boolean; note: string }[] = [
  { part: 'face', label: 'Face', none: false, note: 'Preset portrait' },
  { part: 'hair', label: 'Hair', none: true, note: 'Reference: stored, not drawn yet' },
  { part: 'facialHair', label: 'Facial hair', none: true, note: 'Reference: stored, not drawn yet' },
  { part: 'skinTone', label: 'Skin tone', none: false, note: 'Stored: no skin masks yet' },
  { part: 'bodyType', label: 'Body type', none: false, note: 'Reference: one body model exists' },
];
interface Picker {
  title: string;
  items: CatalogOption[];
  current: string | null;
  none: boolean;
  note: string;
  search: boolean;
  swatch?: boolean;
  pick: (id: string | null) => void;
}
const POSITIONS: readonly { id: Position; label: string }[] = [
  { id: 'forward', label: 'Forward' },
  { id: 'defense', label: 'Defense' },
  { id: 'goalie', label: 'Goalie' },
];
const SLOTS = ['Primary 60%', '2nd 25%', '3rd 15%'] as const;
const NAV = { x: 16, y: 70, w: 192, h: 30, gap: 34 };
const OPT = { x: 232, y: 100, w: 288, h: 28, gap: 30, rows: 12 };
const CARD = { x: 536, y: 60, w: 160, h: 224 };
const GREEN = 0x5fd16b;
const RESULT_LIMIT = 200;

type CardColour = 'gold' | 'blue' | 'green' | 'panel';
interface CardInfo {
  colour: CardColour;
  title: string;
  tag: string;
  /** Frame name in the batch 16.10 card art atlas, when there is a picture for this card. */
  art?: string;
  /** Character art to show instead: frame keys from the character manifest, drawn at whole-number scale. */
  images?: { frame: string; x: number; y: number; scale?: number }[];
  swatch?: string;
  badge?: string;
  body: string;
  footer?: string[];
}
interface Option {
  label: string;
  right?: string;
  chosen?: boolean;
  frame?: 'confirm' | 'disabled';
  card?: CardInfo;
  /** Shown in the attribute panel while this option is highlighted. */
  preview?: Partial<PlayerDraft>;
  activate: () => void;
}
type TextField = 'firstName' | 'lastName' | 'search' | 'hometown';
type Mode = 'edit' | 'confirm' | 'reveal' | 'delete' | 'look';

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const feetInches = (inches: number): string => `${Math.floor(inches / 12)}'${inches % 12}`;
const range = (lo: number, hi: number, step: number): number[] => Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
const FIELD_LABELS: Record<string, string> = { face: 'Face', hair: 'Hair', facialHair: 'Facial hair', skinTone: 'Skin tone', bodyType: 'Body type' };

const ovr = (p: CreatedPlayer): number => Math.round(overall(p.dna.start, attributesFor(p.dna.position)));

const clip = (text: string, width: number): string => (text.length > width ? `${text.slice(0, width - 1)}.` : text);

/**
 * Create a Player V1 (Decision 39), in the 960x540 off-ice design space (Decision 38), drawn with the
 * batch 16.11 interface kit. Choices are shown as the range they lead to; the player is rolled once,
 * at confirmation, and kept. There is no re-roll.
 *
 * Temporary in V1: the 5x7 font; card illustrations (a labelled blank panel); no appearance, equipment
 * or nationality steps yet.
 */
export class CreatorScene extends Phaser.Scene {
  private store!: CreatedPlayerStore;
  private warning: string | null = null;
  private step = 0;
  private column: 'nav' | 'options' | 'attrs' = 'nav';
  private attrIndex = 0;
  private index = 0;
  private scroll = 0;
  private typing: TextField | null = null;
  private keyIndex = KEYS.length - 1;
  private picker: Picker | null = null;
  private pickerReturn = 0;
  /** Appearance fields the randomizer must leave alone. */
  private readonly locks = new Set<string>();
  private frames: Record<string, [string, number, number, number, number]> = {};
  private slot = 0;
  private query = '';
  private mode: Mode = 'edit';
  private shown: CreatedPlayer | null = null;
  private options: Option[] = [];
  private layer!: Phaser.GameObjects.Container;
  private dirty = true;
  private insets: [number, number, number, number] = [8, 8, 8, 8];
  private readonly seenKeys = new WeakSet<KeyboardEvent>();
  private readonly edges = { up: new Edge(), down: new Edge(), left: new Edge(), right: new Edge(), action: new Edge(), back: new Edge() };

  constructor() {
    super(SCENES.creator);
  }

  preload(): void {
    if (!this.textures.exists(UI_KIT.key)) this.load.image(UI_KIT.key, UI_KIT.url);
    if (!this.cache.json.exists(UI_KIT.manifestKey)) this.load.json(UI_KIT.manifestKey, UI_KIT.manifestUrl);
    if (!this.textures.exists(CARD_ART.key)) this.load.image(CARD_ART.key, CARD_ART.url);
    for (const atlas of CHARACTER.atlases) if (!this.textures.exists(`character-${atlas}`)) this.load.image(`character-${atlas}`, `./assets/character/${atlas}.png`);
    if (!this.cache.json.exists(CHARACTER.frames)) this.load.json(CHARACTER.frames, CHARACTER.framesUrl);
    if (!this.cache.json.exists(CARD_ART.manifestKey)) this.load.json(CARD_ART.manifestKey, CARD_ART.manifestUrl);
  }

  create(): void {
    setProfile(this.game, 'offIce');
    setTitleArtVisible(false);
    this.cameras.main.setBackgroundColor(UI.navy);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.onKey, this);
      setProfile(this.game, 'ice');
    });

    const manifest = this.cache.json.get(UI_KIT.manifestKey) as { nineSliceInsets: [number, number, number, number]; frames: Record<string, [number, number, number, number]> } | undefined;
    const texture = this.textures.get(UI_KIT.key);
    if (manifest) {
      this.insets = manifest.nineSliceInsets;
      for (const [id, [x, y, w, h]] of Object.entries(manifest.frames)) if (!texture.has(id)) texture.add(id, 0, x, y, w, h);
    }

    const cards = this.cache.json.get(CARD_ART.manifestKey) as { frames: Record<string, [number, number, number, number]> } | undefined;
    const cardTexture = this.textures.get(CARD_ART.key);
    if (cards) for (const [id, [x, y, w, h]] of Object.entries(cards.frames)) if (!cardTexture.has(id)) cardTexture.add(id, 0, x, y, w, h);

    this.frames = (this.cache.json.get(CHARACTER.frames) as { frames: Record<string, [string, number, number, number, number]> } | undefined)?.frames ?? {};
    for (const [id, [atlas, x, y, w, h]] of Object.entries(this.frames)) {
      const t = this.textures.get(`character-${atlas}`);
      if (!t.has(id)) t.add(id, 0, x, y, w, h);
    }
    this.picker = null;

    // Development only: a wider registry kept outside the repository (licence unverified). Builds never look for it.
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
      void fetch('./private/influences_wider.txt')
        .then((r) => (r.ok ? r.text() : ''))
        .then((text) => {
          if (text.includes('|') && registerWiderRegistry(text)) this.dirty = true;
        })
        .catch(() => undefined);
    }

    const loaded = loadCreatedPlayers();
    this.store = loaded.store;
    this.warning = loaded.warning;
    if (!this.store.draft) this.store = { ...this.store, draft: emptyDraft() };
    this.step = 0;
    this.column = 'nav';
    this.index = 0;
    this.scroll = 0;
    this.typing = null;
    this.mode = 'edit';
    this.shown = null;
    this.query = '';
    this.slot = 0;

    this.layer = this.add.container(0, 0);
    this.input.keyboard?.on('keydown', this.onKey, this);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (this.options.length > OPT.rows) {
        this.column = 'options';
        this.move(dy > 0 ? 1 : -1);
      }
    });
    this.dirty = true;
  }

  // ---------- state ----------

  private get draft(): PlayerDraft {
    return this.store.draft ?? emptyDraft();
  }

  private setDraft(change: Partial<PlayerDraft>): void {
    this.store = { ...this.store, draft: reconcileDraft({ ...this.draft, ...change }) };
    this.persist();
    this.dirty = true;
  }

  private persist(): void {
    if (!saveCreatedPlayers(this.store) && !this.warning) this.warning = 'Could not save in this browser.';
  }

  /** For automated checks. */
  state(): { step: string; mode: Mode; column: string; index: number; options: string[]; draft: PlayerDraft; players: number; typing: string | null; warning: string | null; size: [number, number] } {
    return { step: STEPS[this.step] ?? '', mode: this.mode, column: this.column, index: this.index, options: this.options.map((o) => o.label), draft: this.draft, players: this.store.players.length, typing: this.typing, warning: this.warning, size: [this.scale.width, this.scale.height] };
  }

  // ---------- options for each step ----------

  private influenceCard(i: InfluenceRecord): CardInfo {
    const source = influenceSource(i);
    const where = i.position === 'goalie' ? 'G' : i.position === 'defense' ? 'D' : 'F';
    const footer = source === 'limited' ? ['Limited data', 'Shapes nothing'] : [clip(i.tags.join(', '), 24), source === 'derived' ? 'Career record: mild' : source === 'fictional' ? `Fictional pro${i.shoots ? `, shoots ${i.shoots}` : ''}` : 'Curated profile'];
    return { colour: 'gold', title: influenceName(i), tag: 'HOCKEY INFLUENCE', art: `silhouette_${i.position}`, badge: where, body: `${i.blurb}${i.born ? ` Born ${i.born}${i.country ? `, ${i.country}` : ''}.` : ''}`, footer };
  }

  private buildOptions(): Option[] {
    const d = this.draft;
    if (this.picker) return this.pickerOptions(this.picker);
    if (this.mode === 'reveal') {
      const shown = this.shown;
      const out: Option[] = [{ label: 'Done', activate: () => this.leaveReveal() }];
      if (shown && this.store.players.some((p) => p.id === shown.id)) {
        const picked = this.store.pickUpId === shown.id;
        out.push({ label: picked ? 'Pick-Up player' : 'Use in Pick-Up', chosen: picked, activate: () => this.pickUp(picked ? null : shown.id) });
        out.push({ label: 'Edit look', activate: () => this.setMode('look') });
        out.push({ label: 'Number', right: shown.profile.number === null ? 'None' : `${shown.profile.number}`, activate: () => this.openNumberPicker(shown.profile.number, (n) => this.updateShown((st, id) => setPlayerNumber(st, id, n))) });
        out.push({ label: 'Delete player', activate: () => this.setMode('delete') });
      }
      return out;
    }
    if (this.mode === 'look' && this.shown) {
      const shown = this.shown;
      return [{ label: 'Done', activate: () => this.setMode('reveal') }, ...this.appearanceRows(shown.appearance, (next) => this.updateShown((st, id) => setPlayerAppearance(st, id, next)), this.playerCard(shown))];
    }
    if (this.mode === 'delete') {
      return [
        { label: 'No, keep this player', activate: () => this.setMode('reveal') },
        { label: 'Yes, delete forever', frame: 'confirm', activate: () => this.deleteShown() },
      ];
    }
    if (this.mode === 'confirm') {
      return [
        { label: 'No, keep editing', activate: () => this.setMode('edit') },
        { label: 'Yes, lock this player in', frame: 'confirm', activate: () => this.confirm() },
      ];
    }
    switch (STEPS[this.step]) {
      case 'Nationality': {
        const q = this.query.trim().toLowerCase();
        const current = d.appearance.nationality;
        const out: Option[] = [
          { label: 'Search', right: this.fieldText('search', this.query), activate: () => this.startTyping('search') },
          { label: 'Unspecified', chosen: current === null, activate: () => this.setAppearance({ nationality: null }) },
        ];
        for (const n of NATIONALITIES) {
          if (q && !n.name.toLowerCase().includes(q)) continue;
          out.push({ label: clip(n.name, 20), chosen: current === n.code, card: { colour: 'panel', title: n.name, tag: 'NATIONALITY', body: 'Shown on your profile. Random names use it when there is a name pool for it.', images: [{ frame: `flag:${n.code}`, x: 40, y: 16, scale: 2 }] }, activate: () => this.setAppearance({ nationality: n.code }) });
        }
        return out;
      }
      case 'Appearance':
        return this.appearanceRows(d.appearance, (next) => this.setDraft({ appearance: next }), this.lookCard());
      case 'Profile':
        return [
          { label: 'First name', right: this.fieldText('firstName', d.firstName), activate: () => this.startTyping('firstName') },
          { label: 'Last name', right: this.fieldText('lastName', d.lastName), activate: () => this.startTyping('lastName') },
          { label: 'Random name', activate: () => this.rollName() },
          { label: 'Hometown', right: clip(this.fieldText('hometown', d.profile.hometown), 12), activate: () => this.startTyping('hometown') },
          { label: 'Number', right: d.profile.number === null ? 'None' : `${d.profile.number}`, activate: () => this.openNumberPicker(d.profile.number, (n) => this.setProfile({ number: n })) },
          { label: 'Shoots', right: d.profile.shoots === 'L' ? 'Left' : 'Right', activate: () => this.setProfile({ shoots: d.profile.shoots === 'L' ? 'R' : 'L' }) },
          {
            label: 'Height',
            right: feetInches(d.profile.heightIn),
            activate: () => this.openPicker({ title: 'Height', items: range(PROFILE_LIMITS.heightIn[0], PROFILE_LIMITS.heightIn[1], 1).map((v) => ({ id: `${v}`, label: feetInches(v) })), current: `${d.profile.heightIn}`, none: false, note: 'For your profile. Changes no ratings.', search: false, pick: (id) => id && this.setProfile({ heightIn: Number(id) }) }),
          },
          {
            label: 'Weight',
            right: `${d.profile.weightLb} lb`,
            activate: () => this.openPicker({ title: 'Weight', items: range(PROFILE_LIMITS.weightLb[0], PROFILE_LIMITS.weightLb[1], 5).map((v) => ({ id: `${v}`, label: `${v} lb` })), current: `${d.profile.weightLb}`, none: false, note: 'For your profile. Changes no ratings.', search: false, pick: (id) => id && this.setProfile({ weightLb: Number(id) }) }),
          },
          ...POSITIONS.map((p) => ({ label: p.label, chosen: d.position === p.id, preview: { position: p.id }, activate: () => this.setDraft({ position: p.id }) })),
        ];
      case 'Background':
        return backgroundsForAge(CREATED_PLAYER_AGE).map((b) => ({
          label: b.label,
          chosen: d.background === b.id,
          preview: { background: b.id },
          card: { colour: 'panel' as const, title: b.label, tag: 'BACKGROUND', body: 'Where you learned the game. Sets how good you are on day one and how much experience you bring. It does not change what you can become.' },
          activate: () => this.setDraft({ background: b.id }),
        }));
      case 'Influences': {
        const chosen = [d.primary, ...d.secondaries];
        const current = chosen[this.slot] ? influenceById(chosen[this.slot] as string) : undefined;
        const out: Option[] = [
          { label: `Slot: ${SLOTS[this.slot]}`, right: current ? '' : 'empty', card: current ? this.influenceCard(current) : undefined, activate: () => this.nextSlot() },
          { label: 'Search', right: this.fieldText('search', this.query), activate: () => this.startTyping('search') },
        ];
        if (this.slot > 0 && chosen[this.slot]) out.push({ label: 'Clear this slot', activate: () => this.assign(null) });
        for (const i of searchInfluences(d.position, this.query, RESULT_LIMIT)) {
          const at = chosen.indexOf(i.id);
          const preview = this.assigned(i.id);
          out.push({ label: clip(influenceName(i), 18), right: at >= 0 ? ['1ST', '2ND', '3RD'][at] : influenceSource(i) === 'curated' ? 'CUR' : '', chosen: at >= 0, card: this.influenceCard(i), preview: preview ?? undefined, activate: () => this.assign(i.id) });
        }
        return out;
      }
      case 'Play Style':
        return playStylesFor(d.position).map((s) => ({
          label: s.name,
          chosen: d.playStyle === s.id,
          preview: { playStyle: s.id },
          card: { colour: 'blue' as const, title: s.name, tag: 'PLAY STYLE', art: s.id, badge: s.positions.map((p) => (p === 'goalie' ? 'G' : p === 'defense' ? 'D' : 'F')).join(''), body: s.toward.length ? `A quarter of how your starting ability is spread. Develops faster: ${s.toward.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}.` : 'Versatile. A quarter of your starting spread is kept even. Six technique skills develop a little faster.', footer: s.toward.length ? [clip(`+ ${s.toward.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}`, 24), clip(`- ${s.away.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}`, 24)] : ['Balanced start', `+${Math.round((s.developmentRate ?? DNA_CONFIG.playStyleDevelopment) * 100)}% on ${developmentFocus(s).length} skills`] },
          activate: () => this.setDraft({ playStyle: s.id }),
        }));
      case 'Archetype':
        return startingArchetypesFor(d.position, d.background).map((a) => ({
          label: a.name,
          chosen: d.archetype === a.id,
          card: { colour: 'green' as const, title: a.name, tag: 'ARCHETYPE', art: a.id, body: a.description, footer: ['Who you are in the room', 'Changes no ratings'] },
          activate: () => this.setDraft({ archetype: a.id }),
        }));
      case 'Review': {
        const problems = draftProblems(d);
        const full = this.store.players.length >= CREATED_PLAYER_CONFIG.maxPlayers;
        if (full) return [{ label: `${CREATED_PLAYER_CONFIG.maxPlayers} players saved: full`, frame: 'disabled', activate: () => undefined }];
        if (problems.length) return problems.map((p) => ({ label: `Missing: ${clip(p, 13)}`, frame: 'disabled' as const, activate: () => this.goToProblem(p) }));
        return [{ label: 'Confirm player', frame: 'confirm', activate: () => this.setMode('confirm') }];
      }
      default:
        return this.store.players.map((p) => ({
          label: clip(`${p.firstName} ${p.lastName}`, 19),
          right: `${ovr(p)}`,
          card: this.playerCard(p),
          activate: () => this.reveal(p),
        }));
    }
  }

  private playerCard(p: CreatedPlayer): CardInfo {
    const a = startingArchetypeById(p.archetype);
    const primary = influenceById(p.dna.primary);
    const style = p.dna.playStyle ? playStyleById(p.dna.playStyle) : undefined;
    return { colour: 'green', title: `${p.firstName} ${p.lastName}`, tag: a?.name.toUpperCase() ?? 'PLAYER', images: [{ frame: p.appearance.face, x: 4, y: 32 }, { frame: `model:${p.dna.position === 'goalie' ? 'goalie' : 'skater'}_front`, x: 76, y: 0 }, ...(p.appearance.nationality ? [{ frame: `flag:${p.appearance.nationality}`, x: 20, y: 0 }] : [])], badge: p.dna.position === 'goalie' ? 'G' : p.dna.position === 'defense' ? 'D' : 'F', body: `${p.profile.number === null ? '' : `No. ${p.profile.number}. `}Age ${p.age}, ${feetInches(p.profile.heightIn)}, ${p.profile.weightLb} lb, shoots ${p.profile.shoots}.${p.profile.hometown ? ` From ${p.profile.hometown}.` : ''} ${backgroundById(p.dna.background)?.label ?? ''}. Grew up watching ${primary ? influenceName(primary) : '?'}. ${style ? style.name : 'No style'}.`, footer: [`Overall ${ovr(p)}`, 'Locked in'] };
  }

  private fieldText(field: TextField, value: string): string {
    if (this.typing === field) return `${value}_`;
    return value || '...';
  }

  private assigned(id: string | null): Partial<PlayerDraft> | null {
    const d = this.draft;
    if (this.slot === 0) return id ? { primary: id, secondaries: d.secondaries.filter((s) => s !== id) } : null;
    if (!d.primary || id === d.primary) return null;
    const secondaries = [...d.secondaries];
    const at = this.slot - 1;
    if (id === null) secondaries.splice(at, 1);
    else {
      const other = secondaries.indexOf(id);
      if (other >= 0) secondaries.splice(other, 1);
      secondaries.splice(Math.min(at, secondaries.length), 0, id);
    }
    return { secondaries: secondaries.slice(0, 2) };
  }

  private assign(id: string | null): void {
    const change = this.assigned(id);
    if (!change) return;
    this.setDraft(change);
    if (id && this.slot < 2) this.slot = Math.min(this.slot + 1, 1 + this.draft.secondaries.length, 2);
  }

  private nextSlot(): void {
    const available = this.draft.primary ? Math.min(3, 2 + this.draft.secondaries.length) : 1;
    this.slot = (this.slot + 1) % available;
    this.dirty = true;
  }

  private goToProblem(problem: string): void {
    const step = problem.includes('name') ? stepAt('Profile') : problem.includes('influence') ? stepAt('Influences') : problem.includes('style') ? stepAt('Play Style') : problem.includes('Archetype') ? stepAt('Archetype') : this.step;
    this.goToStep(step);
    this.column = 'options';
  }

  private goToStep(step: number): void {
    this.step = (step + STEPS.length) % STEPS.length;
    this.index = 0;
    this.scroll = 0;
    this.typing = null;
    this.picker = null;
    this.query = '';
    this.dirty = true;
  }

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.column = 'options';
    this.index = 0;
    this.scroll = 0;
    this.dirty = true;
  }

  private confirm(): void {
    // The app layer may use the clock to pick the seed; the roll itself is seeded and happens once.
    const seed = new Rng((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0).int(2147483647);
    const result = confirmDraft(this.store, seed);
    if (!result.player) {
      this.setMode('edit');
      return;
    }
    this.store = { ...result.store, draft: emptyDraft() };
    this.persist();
    createdPlayer.dna = result.player.dna;
    this.reveal(result.player);
  }

  private pickUp(id: number | null): void {
    this.store = choosePickUpPlayer(this.store, id);
    this.persist();
    createdPlayer.dna = this.store.players.find((p) => p.id === id)?.dna ?? null;
    this.dirty = true;
  }

  private deleteShown(): void {
    if (!this.shown) return;
    // No dynasty careers exist yet. When they do, a character in an active career is protected here.
    const result = deletePlayer(this.store, this.shown.id, () => false);
    if (result.problems.length) {
      this.warning = result.problems[0] ?? null;
      this.setMode('reveal');
      return;
    }
    this.store = result.store;
    this.persist();
    this.leaveReveal();
  }

  private rollName(): void {
    // The clock only picks which fictional name comes up; the result can be edited like any typed name.
    const name = randomName(new Rng((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0), this.draft.appearance.nationality);
    this.setDraft({ firstName: name.first.slice(0, NAME_MAX), lastName: name.last.slice(0, NAME_MAX) });
  }

  private pressKey(label: string): void {
    const field = this.typing;
    if (!field) return;
    if (label === 'DONE') this.typing = null;
    else if (label === 'DEL') this.setTyped(field, this.typed(field).slice(0, -1));
    else if (this.typed(field).length < this.maxFor(field)) this.setTyped(field, this.typed(field) + (label === 'SPACE' ? ' ' : this.typed(field) && !this.typed(field).endsWith(' ') && !this.typed(field).endsWith('-') ? label.toLowerCase() : label));
    this.dirty = true;
  }

  private moveKey(dx: number, dy: number): void {
    const rows = Math.ceil(KEYS.length / KEY_COLS);
    let col = this.keyIndex % KEY_COLS;
    let row = Math.floor(this.keyIndex / KEY_COLS);
    col = (col + dx + KEY_COLS) % KEY_COLS;
    row = (row + dy + rows) % rows;
    this.keyIndex = Math.min(KEYS.length - 1, row * KEY_COLS + col);
    this.dirty = true;
  }

  private reveal(player: CreatedPlayer): void {
    this.shown = player;
    this.step = stepAt('Saved Players');
    this.setMode('reveal');
  }

  private leaveReveal(): void {
    this.shown = null;
    this.mode = 'edit';
    this.column = 'nav';
    this.goToStep(stepAt('Saved Players'));
  }

  // ---------- input ----------

  private startTyping(field: TextField): void {
    this.typing = field;
    this.keyIndex = KEYS.length - 1;
    this.dirty = true;
  }

  private typed(field: TextField): string {
    return field === 'search' ? this.query : field === 'hometown' ? this.draft.profile.hometown : this.draft[field];
  }

  private maxFor(field: TextField): number {
    return field === 'hometown' ? PROFILE_LIMITS.hometownMax : NAME_MAX;
  }

  private setProfile(change: Partial<PlayerProfile>): void {
    this.setDraft({ profile: { ...this.draft.profile, ...change } });
  }

  private setTyped(field: TextField, value: string): void {
    if (field === 'search') {
      this.query = cleanName(value);
      this.dirty = true;
    } else if (field === 'hometown') {
      this.setProfile({ hometown: cleanName(value, PROFILE_LIMITS.hometownMax) });
    } else {
      this.setDraft({ [field]: cleanName(value) });
    }
  }

  private onKey(event: KeyboardEvent): void {
    // Phaser re-reads its key queue whenever a key arrives, so two keys inside one frame would deliver the first twice.
    if (this.seenKeys.has(event)) return;
    this.seenKeys.add(event);
    const key = event.key;
    if (this.typing) {
      const field = this.typing;
      if (key === 'Escape' || key === 'Tab') {
        this.typing = null;
        this.dirty = true;
      } else if (key === 'Enter') this.pressKey(KEYS[this.keyIndex] ?? 'DONE');
      else if (key === 'Backspace') this.setTyped(field, this.typed(field).slice(0, -1));
      else if (key === 'ArrowUp') this.moveKey(0, -1);
      else if (key === 'ArrowDown') this.moveKey(0, 1);
      else if (key === 'ArrowLeft') this.moveKey(-1, 0);
      else if (key === 'ArrowRight') this.moveKey(1, 0);
      else if (key.length === 1 && this.typed(field).length < this.maxFor(field)) this.setTyped(field, this.typed(field) + key);
      event.preventDefault();
      return;
    }
    if (key === 'ArrowUp') this.move(-1);
    else if (key === 'ArrowDown') this.move(1);
    else if (key === 'ArrowLeft') this.side(-1);
    else if (key === 'ArrowRight') this.side(1);
    else if (key === 'Enter' || key === ' ') this.activate();
    else if (key === 'Escape') this.back();
    else return;
    event.preventDefault();
  }

  private move(delta: number): void {
    if (this.column === 'attrs') {
      const count = this.attributeKeys().length;
      this.attrIndex = (this.attrIndex + delta + count) % count;
    } else if (this.column === 'nav' && this.mode === 'edit' && !this.picker) {
      this.goToStep(this.step + delta);
    } else if (this.options.length) {
      this.index = (this.index + delta + this.options.length) % this.options.length;
      if (this.index < this.scroll) this.scroll = this.index;
      if (this.index >= this.scroll + OPT.rows) this.scroll = this.index - OPT.rows + 1;
    }
    this.dirty = true;
  }

  private side(delta: number): void {
    if (this.picker) return;
    const count = this.attributeKeys().length;
    if (this.column === 'attrs') {
      // The attribute grid has two columns of its own; left from the first goes back to the list.
      const inSecond = this.attrIndex >= GRID.rows;
      if (delta > 0 && !inSecond && this.attrIndex + GRID.rows < count) this.attrIndex += GRID.rows;
      else if (delta < 0 && inSecond) this.attrIndex -= GRID.rows;
      else if (delta < 0) this.column = this.options.length ? 'options' : 'nav';
    } else if (this.column === 'options') {
      if (delta > 0 && count) this.column = 'attrs';
      else if (delta < 0 && this.mode === 'edit') this.column = 'nav';
    } else if (delta > 0 && this.mode === 'edit') {
      this.column = this.options.length ? 'options' : count ? 'attrs' : 'nav';
    }
    this.dirty = true;
  }

  /** The attributes shown in the panel right now: the confirmed player's, or the draft's once it has a primary influence. */
  private attributeKeys(): readonly AttributeKey[] {
    if (this.mode !== 'edit' && this.mode !== 'confirm' && this.shown) return attributesFor(this.shown.dna.position);
    return this.draft.primary ? attributesFor(this.draft.position) : [];
  }

  private activate(): void {
    if (this.column === 'nav' && this.mode === 'edit') {
      if (this.options.length) this.column = 'options';
      this.dirty = true;
      return;
    }
    if (this.column === 'attrs') return;
    this.options[this.index]?.activate();
    this.dirty = true;
  }

  private back(): void {
    if (this.picker) {
      this.picker = null;
      this.query = '';
      this.index = this.pickerReturn;
      this.scroll = 0;
      this.dirty = true;
    } else if (this.mode === 'confirm') this.setMode('edit');
    else if (this.mode === 'delete' || this.mode === 'look') this.setMode('reveal');
    else if (this.mode === 'reveal') this.leaveReveal();
    else if (this.column === 'attrs') {
      this.column = this.options.length ? 'options' : 'nav';
      this.dirty = true;
    } else if (this.column === 'options') {
      this.column = 'nav';
      this.dirty = true;
    } else this.scene.start(SCENES.title);
  }

  update(): void {
    const pad = readPad(this);
    if (this.typing) {
      if (this.edges.up.pressed(pad.y < -0.5)) this.moveKey(0, -1);
      if (this.edges.down.pressed(pad.y > 0.5)) this.moveKey(0, 1);
      if (this.edges.left.pressed(pad.x < -0.5)) this.moveKey(-1, 0);
      if (this.edges.right.pressed(pad.x > 0.5)) this.moveKey(1, 0);
      if (this.edges.action.pressed(pad.action)) this.pressKey(KEYS[this.keyIndex] ?? 'DONE');
      if (this.edges.back.pressed(pad.back)) this.pressKey('DEL');
    } else {
      if (this.edges.up.pressed(pad.y < -0.5)) this.move(-1);
      if (this.edges.down.pressed(pad.y > 0.5)) this.move(1);
      if (this.edges.left.pressed(pad.x < -0.5)) this.side(-1);
      if (this.edges.right.pressed(pad.x > 0.5)) this.side(1);
      if (this.edges.action.pressed(pad.action)) this.activate();
      if (this.edges.back.pressed(pad.back)) this.back();
    }
    if (this.dirty) {
      this.dirty = false;
      this.render();
    }
  }

  // ---------- drawing ----------

  private slice(x: number, y: number, w: number, h: number, frame: string): Phaser.GameObjects.NineSlice {
    const [l, t, r, b] = this.insets;
    const obj = this.add.nineslice(x, y, UI_KIT.key, frame, w, h, l, r, t, b).setOrigin(0, 0);
    this.layer.add(obj);
    return obj;
  }

  private text(x: number, y: number, text: string, tint: number = UI.white, scale = 2): Phaser.GameObjects.BitmapText {
    const obj = addText(this, x, y, text, tint, scale);
    this.layer.add(obj);
    return obj;
  }

  private render(): void {
    this.layer.removeAll(true);
    this.options = this.buildOptions();
    if (this.index >= this.options.length) this.index = Math.max(0, this.options.length - 1);
    if (this.scroll > Math.max(0, this.options.length - OPT.rows)) this.scroll = Math.max(0, this.options.length - OPT.rows);
    if (this.column === 'options' && !this.options.length) this.column = 'nav';

    // Header
    this.slice(8, 8, W - 16, 44, 'panel');
    this.text(24, 19, 'CREATE A PLAYER', UI.gold, 3);
    const name = `${this.draft.firstName} ${this.draft.lastName}`.trim();
    this.text(400, 23, this.mode !== 'edit' && this.mode !== 'confirm' && this.shown ? `${this.shown.firstName} ${this.shown.lastName}` : name || 'New player', UI.ice);
    this.text(W - 150, 26, `V1  ${VERSION}`, UI.dim, 1);

    // Steps
    this.slice(8, 60, 208, 424, 'panel');
    STEPS.forEach((label, i) => {
      const focused = this.column === 'nav' && this.step === i && this.mode === 'edit';
      const y = NAV.y + i * NAV.gap;
      const button = this.slice(NAV.x, y, NAV.w, NAV.h, this.step === i ? 'button_selected' : 'button_idle');
      button.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.mode !== 'edit') return;
        this.goToStep(i);
        this.column = 'nav';
      });
      const done = this.stepDone(i);
      this.text(NAV.x + 10, y + 8, label === 'Saved Players' ? `${i + 1} Saved: ${this.store.players.length}` : `${i + 1} ${label}`, focused ? UI.navy : UI.white);
      if (done) this.text(NAV.x + NAV.w - 20, y + 8, '+', GREEN);
    });
    ['Temporary: the font. Reference', 'art for hair, beards, bodies', 'and gear. CUR = curated.'].forEach((line, k) => this.text(20, 388 + k * 10, line, UI.dim, 1));

    // Options
    this.slice(224, 60, 304, 424, 'panel');
    const heading = this.picker && !this.typing ? this.picker.title.toUpperCase() : this.typing ? (this.typing === 'search' ? 'SEARCH' : this.typing === 'firstName' ? 'FIRST NAME' : this.typing === 'hometown' ? 'HOMETOWN' : 'LAST NAME') : this.mode === 'confirm' ? 'LOCK IN?' : this.mode === 'delete' ? 'DELETE?' : this.mode === 'look' ? 'EDIT LOOK' : this.mode === 'reveal' ? 'YOUR PLAYER' : (STEPS[this.step] ?? '').toUpperCase();
    this.text(236, 72, heading, UI.gold);
    if (this.options.length > OPT.rows) this.text(440, 76, `${this.index + 1} / ${this.options.length}${this.options.length >= RESULT_LIMIT ? '+' : ''}`, UI.dim, 1);
    if (this.typing) this.drawKeyboard();
    (this.typing ? [] : this.options.slice(this.scroll, this.scroll + OPT.rows)).forEach((option, row) => {
      const i = this.scroll + row;
      const focused = this.column === 'options' && this.index === i;
      const y = OPT.y + row * OPT.gap;
      const frame = option.frame === 'confirm' ? 'button_confirm' : option.frame === 'disabled' ? 'button_disabled' : focused ? 'button_selected' : 'button_idle';
      const button = this.slice(OPT.x, y, OPT.w, OPT.h, frame);
      button.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.typing = null;
        this.column = 'options';
        this.index = i;
        option.activate();
        this.dirty = true;
      });
      const onGold = frame === 'button_selected';
      this.text(OPT.x + 10, y + 7, option.label, onGold ? UI.navy : focused ? UI.gold : option.frame === 'disabled' ? UI.dim : UI.white);
      const rightText = option.right || (option.chosen ? '+' : '');
      if (rightText) {
        const right = fontText(rightText);
        this.text(OPT.x + OPT.w - 10 - right.length * 12, y + 7, right, onGold ? UI.navy : option.chosen ? GREEN : UI.ice);
      }
    });
    if (!this.options.length && !this.typing) wrap(this.step === 6 ? 'No players yet. Confirm one and they are kept here.' : 'Nothing matches.', 22).forEach((line, i) => this.text(236, 104 + i * 20, line, UI.dim));

    // Card for the highlighted option
    const focusedOption = this.column === 'options' ? this.options[this.index] : undefined;
    const card = focusedOption?.card && this.picker ? focusedOption.card : (this.mode === 'reveal' || this.mode === 'delete' || this.mode === 'look') && this.shown ? (this.mode === 'delete' ? { ...this.playerCard(this.shown), body: 'Deleting removes this player from this browser for good. Their number is never used again.', footer: ['Cannot be undone'] } : this.playerCard(this.shown)) : this.mode === 'confirm' ? this.confirmCard() : (focusedOption?.card ?? this.stepCard());
    this.drawCard(this.column === 'attrs' ? (this.attributeCard(focusedOption?.preview) ?? card) : card);

    // Notes under the card
    this.slice(CARD.x, 292, CARD.w, 192, 'panel');
    this.notes().forEach((line, i) => this.text(CARD.x + 8, 302 + i * 10, line, line.startsWith('!') ? UI.red : UI.ice, 1));

    // Attributes
    this.slice(704, 60, 248, 424, 'panel');
    this.drawAttributes(focusedOption?.preview);

    // Footer
    this.slice(8, 492, W - 16, 40, 'panel');
    const hint = this.column === 'attrs' ? 'ARROWS / STICK: MOVE THROUGH ATTRIBUTES   LEFT / ESC / B: BACK   MOUSE: CLICK' : this.typing ? 'TYPE, OR MOVE AND PRESS ENTER / A   B / BACKSPACE: DELETE   ESC: DONE' : 'ARROWS / STICK: MOVE   ENTER / A: CHOOSE   ESC / B: BACK   MOUSE: CLICK';
    this.text(24, 505, this.warning ? clip(this.warning, 76) : hint, this.warning ? UI.red : UI.dim);
  }

  private drawKeyboard(): void {
    const field = this.typing;
    if (!field) return;
    this.slice(OPT.x, OPT.y, OPT.w, OPT.h, 'button_selected');
    this.text(OPT.x + 10, OPT.y + 7, `${this.typed(field)}_`, UI.navy);
    KEYS.forEach((label, i) => {
      const wide = label.length > 1;
      const x = OPT.x + (i % KEY_COLS) * 41;
      const y = OPT.y + 44 + Math.floor(i / KEY_COLS) * 40;
      const w = wide ? (label === 'SPACE' ? 80 : 39) : 39;
      // The last row holds the three wide keys: lay them out by hand.
      const lastRow = i >= 28;
      const lx = lastRow ? OPT.x + [0, 84, 146][i - 28]! : x;
      const lw = lastRow ? [80, 58, 80][i - 28]! : w;
      const focused = this.keyIndex === i;
      const button = this.slice(lx, y, lw, 34, focused ? 'button_selected' : label === 'DONE' ? 'button_confirm' : 'button_idle');
      button.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.keyIndex = i;
        this.pressKey(label);
      });
      const shown = label === 'SPACE' ? 'SPACE' : label;
      this.text(lx + Math.floor((lw - shown.length * 12) / 2) + 1, y + 10, shown, focused ? UI.navy : UI.white);
    });
    if (field === 'search') this.text(OPT.x, OPT.y + 44 + 5 * 40 + 8, `${Math.max(0, this.buildOptions().length - 2)} MATCHES`, UI.dim, 1);
    else wrap(`Letters, spaces, apostrophes and hyphens. Up to ${this.maxFor(field)}.`, 44).forEach((line, i) => this.text(OPT.x, OPT.y + 44 + 5 * 40 + 8 + i * 10, line, UI.dim, 1));
  }

  private stepDone(i: number): boolean {
    const d = this.draft;
    switch (STEPS[i]) {
      case 'Profile':
        return Boolean(d.firstName.trim() && d.lastName.trim());
      case 'Nationality':
        return d.appearance.nationality !== null;
      case 'Appearance':
      case 'Background':
        return true;
      case 'Influences':
        return d.primary !== null;
      case 'Play Style':
        return d.playStyle !== null;
      case 'Archetype':
        return d.archetype !== null;
      case 'Review':
        return draftProblems(d).length === 0;
      default:
        return false;
    }
  }

  private openNumberPicker(current: number | null, pick: (n: number | null) => void): void {
    this.openPicker({ title: 'Number', items: range(0, 99, 1).map((v) => ({ id: `${v}`, label: `Number ${v}` })), current: current === null ? null : `${current}`, none: true, note: 'Your jersey number. You can change it later.', search: false, pick: (id) => pick(id === null ? null : Number(id)) });
  }

  /** The appearance rows, for a draft or for a confirmed player: same choices, different place to save them. */
  private appearanceRows(a: AppearanceRecord, save: (next: AppearanceRecord) => void, card: CardInfo): Option[] {
    const labelOf = (options: CatalogOption[], id: string | null | undefined): string => (id ? clip(options.find((o) => o.id === id)?.label ?? '?', 9) : 'None');
    const lock = (field: string): string => (this.locks.has(field) ? '(L) ' : '');
    const rows: Option[] = [
      {
        label: 'Randomize look',
        right: this.locks.size ? `${this.locks.size} locked` : '',
        card,
        // The clock only seeds which look comes up. Locked fields are left alone, and nothing but appearance is touched.
        activate: () => save(randomizeAppearance(a, this.locks, new Rng((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0))),
      },
      {
        label: 'Locks',
        right: `${this.locks.size} of ${RANDOM_FIELDS.length}`,
        card,
        activate: () =>
          this.openPicker({
            title: 'Lock fields',
            items: RANDOM_FIELDS.map((f) => ({ id: f, label: `${this.locks.has(f) ? '(L) ' : ''}${FIELD_LABELS[f] ?? `Gear ${f.split('.')[1]}`}` })),
            current: null,
            none: false,
            note: 'A locked field (L) is kept when you randomize. Choose a field to lock or unlock it.',
            search: false,
            pick: (id) => {
              if (!id) return;
              if (this.locks.has(id)) this.locks.delete(id);
              else this.locks.add(id);
            },
          }),
      },
    ];
    for (const { part, label, none, note } of PARTS) {
      rows.push({
        label: `${lock(part)}${label}`,
        right: labelOf(optionsFor(part), a[part]),
        card,
        activate: () => this.openPicker({ title: label, items: optionsFor(part), current: a[part], none, note, search: false, swatch: part === 'skinTone', pick: (id) => save({ ...a, [part]: none ? id : (id ?? a[part]) }) }),
      });
    }
    for (const slot of EQUIPMENT_SLOTS) {
      const options = equipmentOptions(slot as EquipmentSlot);
      const name = slot[0]!.toUpperCase() + slot.slice(1);
      rows.push({
        label: `${lock(`equipment.${slot}`)}Gear: ${name}`,
        right: labelOf(options, a.equipment[slot]),
        card,
        activate: () =>
          this.openPicker({
            title: name,
            items: options,
            current: a.equipment[slot] ?? null,
            none: true,
            note: 'Reference thumbnail: stored, not drawn on the model. Branded items are left out.',
            search: false,
            pick: (id) => {
              const equipment = { ...a.equipment };
              if (id) equipment[slot] = id;
              else delete equipment[slot];
              save({ ...a, equipment });
            },
          }),
      });
    }
    return rows;
  }

  /** Save a change to the confirmed player being shown. Only the look or the number: the roll is never touched. */
  private updateShown(change: (store: CreatedPlayerStore, id: number) => CreatedPlayerStore): void {
    if (!this.shown) return;
    const id = this.shown.id;
    this.store = change(this.store, id);
    this.persist();
    this.shown = this.store.players.find((p) => p.id === id) ?? this.shown;
    this.dirty = true;
  }

  private setAppearance(change: Partial<AppearanceRecord>): void {
    this.setDraft({ appearance: { ...this.draft.appearance, ...change } });
  }

  private openPicker(picker: Picker): void {
    this.pickerReturn = this.index;
    this.picker = picker;
    this.query = '';
    const at = picker.items.findIndex((o) => o.id === picker.current);
    this.index = at >= 0 ? at + 1 + (picker.none ? 1 : 0) + (picker.search ? 1 : 0) : 0;
    this.scroll = Math.max(0, this.index - 5);
    this.dirty = true;
  }

  private pickerOptions(picker: Picker): Option[] {
    const close = (): void => {
      this.picker = null;
      this.query = '';
      this.index = this.pickerReturn;
      this.scroll = 0;
      this.dirty = true;
    };
    const q = this.query.trim().toLowerCase();
    const card = (o: CatalogOption): CardInfo => ({
      colour: 'panel',
      title: o.label,
      tag: picker.title.toUpperCase(),
      body: picker.note,
      images: o.frame && this.frames[o.frame] ? [{ frame: o.frame, x: o.frame.startsWith('flag:') ? 40 : 40, y: o.frame.startsWith('flag:') ? 16 : (96 - (this.frames[o.frame] as [string, number, number, number, number])[4]) / 2, scale: o.frame.startsWith('flag:') ? 2 : 1 }] : undefined,
      swatch: picker.swatch ? o.id : undefined,
    });
    const out: Option[] = [{ label: 'Back', activate: close }];
    if (picker.search) out.push({ label: 'Search', right: this.fieldText('search', this.query), activate: () => this.startTyping('search') });
    if (picker.none) out.push({ label: 'None', chosen: picker.current === null, activate: () => { picker.pick(null); close(); } });
    for (const o of picker.items) {
      if (q && !o.label.toLowerCase().includes(q)) continue;
      out.push({ label: clip(o.label, 20), chosen: picker.current === o.id, card: card(o), activate: () => { picker.pick(o.id); close(); } });
    }
    return out;
  }

  private lookCard(): CardInfo {
    const d = this.draft;
    const look = composeAppearance(d.appearance, d.position);
    const images = [
      { frame: look.portrait[0]?.frame ?? '', x: 4, y: 32 },
      { frame: look.body[0]?.frame ?? '', x: 76, y: 0 },
    ];
    if (look.flag) images.push({ frame: look.flag.frame, x: 20, y: 0 });
    return { colour: 'panel', title: `${d.firstName} ${d.lastName}`.trim() || 'New player', tag: nationalityByCode(d.appearance.nationality)?.name.toUpperCase().slice(0, 22) ?? 'NO NATIONALITY', badge: d.position === 'goalie' ? 'G' : d.position === 'defense' ? 'D' : 'F', body: 'Face and body are drawn. Hair, beard, skin tone, body type and gear are stored for when layer art arrives.', images, footer: [`${look.stored.length} choices stored`, 'Changes no ratings'] };
  }

  private stepCard(): CardInfo {
    const d = this.draft;
    switch (STEPS[this.step]) {
      case 'Influences': {
        const primary = d.primary ? influenceById(d.primary) : undefined;
        return primary ? this.influenceCard(primary) : { colour: 'gold', title: 'Who did you watch?', tag: 'HOCKEY INFLUENCE', body: 'One primary and up to two secondary. They move ability around. They never add any.' };
      }
      case 'Play Style': {
        const s = d.playStyle ? playStyleById(d.playStyle) : undefined;
        return { colour: 'blue', title: s?.name ?? 'How do you play?', tag: 'PLAY STYLE', art: s?.id, body: s ? `Develops faster: ${developmentFocus(s).map((k) => ATTRIBUTE_LABELS[k]).join(', ')}.` : 'Pick one. It can be changed between seasons.' };
      }
      case 'Archetype': {
        const a = d.archetype ? startingArchetypeById(d.archetype) : undefined;
        return { colour: 'green', title: a?.name ?? 'Who are you?', tag: 'ARCHETYPE', art: a?.id, body: a?.description ?? 'Your identity in the room. It changes over a career. It never changes a rating.' };
      }
      case 'Appearance':
      case 'Nationality':
        return this.lookCard();
      case 'Saved Players':
        return { colour: 'green', title: 'Saved players', tag: 'LOCKED IN', body: `${this.store.players.length} of ${CREATED_PLAYER_CONFIG.maxPlayers}. Kept in this browser. A confirmed player is never rolled again.` };
      default:
        return { colour: 'panel', title: `${d.firstName} ${d.lastName}`.trim() || 'New player', tag: `AGE ${CREATED_PLAYER_AGE}`, badge: d.position === 'goalie' ? 'G' : d.position === 'defense' ? 'D' : 'F', body: `${backgroundById(d.background)?.label ?? ''}. Every created player starts at ${CREATED_PLAYER_AGE}.` };
    }
  }

  private confirmCard(): CardInfo {
    return { colour: 'panel', title: 'No going back', tag: 'CONFIRM', body: 'Your player is rolled once, now, inside the ranges shown. The result is kept and can never be rolled again.' };
  }

  private drawCard(card: CardInfo): void {
    const frame = card.colour === 'panel' ? 'panel' : `card_${card.colour}`;
    this.slice(CARD.x, CARD.y, CARD.w, CARD.h, frame);
    const tint = card.colour === 'gold' ? UI.gold : card.colour === 'blue' ? UI.ice : card.colour === 'green' ? GREEN : UI.white;
    // Zones from CARD_ART_SPEC.md section 2.
    if (card.title.length <= 12) this.text(CARD.x + 10, CARD.y + 10, card.title, tint);
    else this.text(CARD.x + 10, CARD.y + 14, clip(card.title, 23), tint, 1);
    this.text(CARD.x + 10, CARD.y + 29, card.tag, UI.dim, 1);
    if (card.badge) this.text(CARD.x + CARD.w - 12 - card.badge.length * 6, CARD.y + 29, card.badge, UI.white, 1);
    const hasArt = card.art !== undefined && this.textures.get(CARD_ART.key).has(card.art);
    const images = (card.images ?? []).filter((im) => this.frames[im.frame]);
    if (images.length || card.swatch) {
      this.layer.add(this.add.rectangle(CARD.x + 8, CARD.y + 42, 144, 96, UI.navy, 0.85).setOrigin(0, 0).setStrokeStyle(1, UI.dim));
      for (const im of images) {
        const [atlas] = this.frames[im.frame] as [string, number, number, number, number];
        this.layer.add(this.add.image(CARD.x + 8 + im.x, CARD.y + 42 + im.y, `character-${atlas}`, im.frame).setOrigin(0, 0).setScale(im.scale ?? 1));
      }
      const tones = card.swatch ? skinToneColors(card.swatch) : undefined;
      if (tones) Object.values(tones).forEach((hex, k) => this.layer.add(this.add.rectangle(CARD.x + 20 + k * 20, CARD.y + 66, 20, 48, Number.parseInt(hex.slice(1), 16)).setOrigin(0, 0)));
    } else if (hasArt) {
      // Batch 16.10 illustration, shown at its native 144x96.
      this.layer.add(this.add.image(CARD.x + 8, CARD.y + 42, CARD_ART.key, card.art).setOrigin(0, 0));
    } else {
      const art = this.add.rectangle(CARD.x + 8, CARD.y + 42, 144, 96, UI.navy, 0.85).setOrigin(0, 0).setStrokeStyle(1, UI.dim);
      this.layer.add(art);
      this.text(CARD.x + 44, CARD.y + 80, 'ART PENDING', UI.dim, 1);
      this.text(CARD.x + 38, CARD.y + 92, '(PLACEHOLDER)', UI.dim, 1);
    }
    wrap(card.body, 23).slice(0, 4).forEach((line, i) => this.text(CARD.x + 10, CARD.y + 144 + i * 10, line, UI.white, 1));
    (card.footer ?? []).slice(0, 2).forEach((line, i) => this.text(CARD.x + 10, CARD.y + 190 + i * 13, line, tint, 1));
  }

  private notes(): string[] {
    const d = this.draft;
    if ((this.mode === 'reveal' || this.mode === 'delete' || this.mode === 'look') && this.shown) {
      const p = this.shown;
      const label = (k: AttributeKey): string => ATTRIBUTE_LABELS[k];
      return ['STRENGTHS', ...p.dna.strengths.map((k) => ` ${label(k)}`), '', 'WEAKNESSES', ...p.dna.weaknesses.map((k) => ` ${label(k)}`), '', ...wrap(`Tendencies: ${p.dna.tendencies.join(', ') || 'none'}`, 23)];
    }
    const names = [d.primary, ...d.secondaries].map((id, i) => `${['60', '25', '15'][i]}% ${id ? clip(influenceName(influenceById(id) as InfluenceRecord), 18) : ''}`);
    const lines = ['INFLUENCES', ...(d.primary ? names : [' none chosen']), '', `STYLE ${clip(playStyleById(d.playStyle ?? '')?.name ?? 'none', 17)}`, `TYPE  ${clip(startingArchetypeById(d.archetype ?? '')?.name ?? 'none', 17)}`, ''];
    const problems = draftProblems(d);
    lines.push(...(problems.length ? ['STILL NEEDED', ...problems.slice(0, 5).map((p) => ` ${clip(p, 21)}`)] : ['READY TO CONFIRM']));
    return lines;
  }

  /** Numbers for one attribute: a confirmed player's rating and potential, or the range the current choices lead to. */
  private attributeValues(key: AttributeKey, preview?: Partial<PlayerDraft>): { now?: number; potential?: number; start?: [number, number]; ceiling?: [number, number] } | null {
    if (this.mode !== 'edit' && this.mode !== 'confirm' && this.shown) {
      const attributes = startingAttributes(this.shown.dna);
      return { now: attributes.current[key] ?? 0, potential: attributes.potential[key] ?? 0 };
    }
    const draft = reconcileDraft({ ...this.draft, ...(preview ?? {}) });
    const input = draftInput(draft, 0);
    if (!input || !attributesFor(draft.position).includes(key)) return null;
    const bounds = attributeBounds(input, key);
    return { start: bounds.current, ceiling: bounds.potential };
  }

  private attributeCard(preview?: Partial<PlayerDraft>): CardInfo | null {
    const keys = this.attributeKeys();
    const key = keys[Math.min(this.attrIndex, keys.length - 1)];
    if (!key) return null;
    const v = this.attributeValues(key, preview);
    const icon = ATTRIBUTE_ICONS[key];
    const body = !v ? '' : v.now !== undefined ? `Now ${v.now}. Potential ${v.potential}. Locked in: this is who your player is.` : `Starts between ${v.start?.[0]} and ${v.start?.[1]}. Potential between ${v.ceiling?.[0]} and ${v.ceiling?.[1]}. Rolled once, when you confirm.`;
    return { colour: 'panel', title: ATTRIBUTE_LABELS[key], tag: 'ATTRIBUTE', body, images: icon ? [{ frame: `icon:${icon}`, x: 40, y: 16, scale: 2 }] : undefined, footer: icon ? undefined : ['No icon in batch 16.09'] };
  }

  /** The attribute panel: two columns of 32 px icons (batch 16.09), each with its name and a bar. Keyboard, gamepad and mouse can move through it. */
  private drawAttributes(preview?: Partial<PlayerDraft>): void {
    const g = this.add.graphics();
    this.layer.add(g);
    const keys = this.attributeKeys();
    const shown = this.mode !== 'edit' && this.mode !== 'confirm' && this.shown ? this.shown : null;
    this.text(712, 72, shown ? `OVERALL ${ovr(shown)}` : preview ? 'IF YOU PICK THIS' : 'WHERE YOU START', UI.gold);
    if (!keys.length) {
      wrap('Choose a primary influence to see how your player will be shaped.', 19).forEach((line, i) => this.text(712, 100 + i * 20, line, UI.dim));
      return;
    }
    if (this.attrIndex >= keys.length) this.attrIndex = keys.length - 1;
    const px = (rating: number): number => Math.round((rating / 99) * GRID.bar);
    keys.forEach((key, i) => {
      const x = GRID.x + Math.floor(i / GRID.rows) * GRID.colW;
      const y = GRID.y + (i % GRID.rows) * GRID.rowH;
      const focused = this.column === 'attrs' && this.attrIndex === i;
      if (focused) g.lineStyle(1, UI.gold).strokeRect(x - 2, y - 1, GRID.colW - 3, GRID.rowH - 1);
      const icon = ATTRIBUTE_ICONS[key];
      if (icon && this.frames[`icon:${icon}`]) this.layer.add(this.add.image(x, y, 'character-icons', `icon:${icon}`).setOrigin(0, 0));
      else {
        // No icon supplied for this attribute: an empty tile with its initials, so the gap is visible rather than hidden.
        g.lineStyle(1, UI.dim).strokeRect(x + 0.5, y + 0.5, 31, 31);
        this.text(x + 7, y + 12, ATTRIBUTE_LABELS[key].slice(0, 3), UI.dim, 1);
      }
      const tx = x + 36;
      this.text(tx, y + 2, clip(ATTRIBUTE_LABELS[key].replace('awareness', 'aware.').replace('accuracy', 'acc.'), 13), focused ? UI.gold : UI.white, 1);
      g.fillStyle(UI.navyLight).fillRect(tx, y + 13, GRID.bar, 7);
      const v = this.attributeValues(key, preview);
      if (v?.now !== undefined) {
        g.fillStyle(UI.dim).fillRect(tx, y + 13, px(v.potential ?? 0), 7);
        g.fillStyle(GREEN).fillRect(tx, y + 13, px(v.now), 7);
        this.text(tx, y + 23, `${v.now} / ${v.potential}`, UI.ice, 1);
      } else if (v?.start && v.ceiling) {
        g.fillStyle(UI.dim).fillRect(tx + px(v.ceiling[0]), y + 18, Math.max(1, px(v.ceiling[1]) - px(v.ceiling[0])), 2);
        g.fillStyle(UI.ice).fillRect(tx + px(v.start[0]), y + 13, Math.max(1, px(v.start[1]) - px(v.start[0])), 4);
        this.text(tx, y + 23, `${v.start[0]}-${v.start[1]}`, UI.ice, 1);
      }
      const hit = this.add.zone(x - 2, y - 1, GRID.colW - 3, GRID.rowH - 1).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.column = 'attrs';
        this.attrIndex = i;
        this.dirty = true;
      });
      this.layer.add(hit);
    });
    this.text(712, 470, shown ? 'GREEN: NOW   GREY: POTENTIAL' : 'BLUE: START   GREY: POTENTIAL', UI.dim, 1);
  }
}
