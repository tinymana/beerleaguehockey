import Phaser from 'phaser';
import { Rng } from '../core/rng';
import { ATTRIBUTE_LABELS, attributesFor, overall } from '../dynasty/attributes';
import type { AttributeKey, Position } from '../dynasty/attributes';
import { startingArchetypeById, startingArchetypesFor } from '../dynasty/archetypes';
import { CREATED_PLAYER_AGE, backgroundById, backgroundsForAge } from '../dynasty/backgrounds';
import type { CreatedPlayer, CreatedPlayerStore, PlayerDraft } from '../dynasty/createdPlayer';
import { MAX_CREATED_PLAYERS, NAME_MAX, cleanName, confirmDraft, draftInput, draftProblems, emptyDraft, reconcileDraft } from '../dynasty/createdPlayer';
import { attributeBounds, startingAttributes } from '../dynasty/dna';
import { influenceById, influenceName, influenceSource, searchInfluences } from '../dynasty/influences';
import type { InfluenceRecord } from '../dynasty/influences';
import { playStyleById, playStylesFor } from '../dynasty/playStyles';
import { SCENES, UI, VERSION } from './config';
import { loadCreatedPlayers, saveCreatedPlayers } from './createdPlayerStore';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { createdPlayer } from './session';
import { PROFILES, setProfile, setTitleArtVisible } from './stage';

export const UI_KIT = { key: 'ui-16-11', url: './assets/ui/16_11/ui_atlas.png', manifestKey: 'ui-16-11-manifest', manifestUrl: './assets/ui/16_11/manifest.json' };

const W = PROFILES.offIce.width;
const STEPS = ['Profile', 'Background', 'Influences', 'Play Style', 'Archetype', 'Review', 'Saved Players'] as const;
const POSITIONS: readonly { id: Position; label: string }[] = [
  { id: 'forward', label: 'Forward' },
  { id: 'defense', label: 'Defense' },
  { id: 'goalie', label: 'Goalie' },
];
const SLOTS = ['Primary 60%', '2nd 25%', '3rd 15%'] as const;
const NAV = { x: 16, y: 72, w: 192, h: 32, gap: 38 };
const OPT = { x: 232, y: 100, w: 288, h: 28, gap: 30, rows: 12 };
const CARD = { x: 536, y: 60, w: 160, h: 224 };
const ATTR = { x: 712, y: 92, row: 14, bar: 84 };
const GREEN = 0x5fd16b;
const RESULT_LIMIT = 200;

type CardColour = 'gold' | 'blue' | 'green' | 'panel';
interface CardInfo {
  colour: CardColour;
  title: string;
  tag: string;
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
type TextField = 'firstName' | 'lastName' | 'search';
type Mode = 'edit' | 'confirm' | 'reveal';

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
  private column: 'nav' | 'options' = 'nav';
  private index = 0;
  private scroll = 0;
  private typing: TextField | null = null;
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
    const footer = source === 'limited' ? ['Limited data', 'Shapes nothing'] : [clip(i.tags.join(', '), 24), source === 'derived' ? 'Career record: mild' : 'Curated profile'];
    return { colour: 'gold', title: influenceName(i), tag: 'HOCKEY INFLUENCE', badge: where, body: `${i.blurb} Born ${i.born || '?'}${i.country ? `, ${i.country}` : ''}.`, footer };
  }

  private buildOptions(): Option[] {
    const d = this.draft;
    if (this.mode === 'reveal') return [{ label: 'Done', activate: () => this.leaveReveal() }];
    if (this.mode === 'confirm') {
      return [
        { label: 'No, keep editing', activate: () => this.setMode('edit') },
        { label: 'Yes, lock this player in', frame: 'confirm', activate: () => this.confirm() },
      ];
    }
    switch (STEPS[this.step]) {
      case 'Profile':
        return [
          { label: 'First name', right: this.fieldText('firstName', d.firstName), activate: () => this.startTyping('firstName') },
          { label: 'Last name', right: this.fieldText('lastName', d.lastName), activate: () => this.startTyping('lastName') },
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
          card: { colour: 'blue' as const, title: s.name, tag: 'PLAY STYLE', badge: s.positions.map((p) => (p === 'goalie' ? 'G' : p === 'defense' ? 'D' : 'F')).join(''), body: `A quarter of how your starting ability is spread. Develops faster: ${s.toward.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}.`, footer: [clip(`+ ${s.toward.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}`, 24), clip(`- ${s.away.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}`, 24)] },
          activate: () => this.setDraft({ playStyle: s.id }),
        }));
      case 'Archetype':
        return startingArchetypesFor(d.position, d.background).map((a) => ({
          label: a.name,
          chosen: d.archetype === a.id,
          card: { colour: 'green' as const, title: a.name, tag: 'ARCHETYPE', body: a.description, footer: ['Who you are in the room', 'Changes no ratings'] },
          activate: () => this.setDraft({ archetype: a.id }),
        }));
      case 'Review': {
        const problems = draftProblems(d);
        const full = this.store.players.length >= MAX_CREATED_PLAYERS;
        if (full) return [{ label: `${MAX_CREATED_PLAYERS} players saved: full`, frame: 'disabled', activate: () => undefined }];
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
    return { colour: 'green', title: `${p.firstName} ${p.lastName}`, tag: a?.name.toUpperCase() ?? 'PLAYER', badge: p.dna.position === 'goalie' ? 'G' : p.dna.position === 'defense' ? 'D' : 'F', body: `Age ${p.age}. ${backgroundById(p.dna.background)?.label ?? ''}. Grew up watching ${primary ? influenceName(primary) : '?'}. ${style ? style.name : 'No style'}.`, footer: [`Overall ${ovr(p)}`, 'Locked in'] };
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
    const step = problem.includes('name') ? 0 : problem.includes('influence') ? 2 : problem.includes('style') ? 3 : problem.includes('Archetype') ? 4 : this.step;
    this.goToStep(step);
    this.column = 'options';
  }

  private goToStep(step: number): void {
    this.step = (step + STEPS.length) % STEPS.length;
    this.index = 0;
    this.scroll = 0;
    this.typing = null;
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

  private reveal(player: CreatedPlayer): void {
    this.shown = player;
    this.step = 6;
    this.setMode('reveal');
  }

  private leaveReveal(): void {
    this.shown = null;
    this.mode = 'edit';
    this.column = 'nav';
    this.goToStep(6);
  }

  // ---------- input ----------

  private startTyping(field: TextField): void {
    this.typing = field;
    this.dirty = true;
  }

  private typed(field: TextField): string {
    return field === 'search' ? this.query : this.draft[field];
  }

  private setTyped(field: TextField, value: string): void {
    if (field === 'search') {
      this.query = cleanName(value);
      this.dirty = true;
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
      if (key === 'Enter' || key === 'Escape' || key === 'Tab') {
        this.typing = null;
        this.dirty = true;
      } else if (key === 'Backspace') {
        this.setTyped(field, this.typed(field).slice(0, -1));
      } else if (key === 'ArrowUp' || key === 'ArrowDown') {
        this.typing = null;
        this.move(key === 'ArrowUp' ? -1 : 1);
      } else if (key.length === 1 && this.typed(field).length < NAME_MAX) {
        this.setTyped(field, this.typed(field) + key);
      }
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
    if (this.column === 'nav' && this.mode === 'edit') {
      this.goToStep(this.step + delta);
    } else if (this.options.length) {
      this.index = (this.index + delta + this.options.length) % this.options.length;
      if (this.index < this.scroll) this.scroll = this.index;
      if (this.index >= this.scroll + OPT.rows) this.scroll = this.index - OPT.rows + 1;
    }
    this.dirty = true;
  }

  private side(delta: number): void {
    if (this.mode !== 'edit') return;
    if (delta > 0 && this.options.length) this.column = 'options';
    if (delta < 0) this.column = 'nav';
    this.dirty = true;
  }

  private activate(): void {
    if (this.column === 'nav' && this.mode === 'edit') {
      if (this.options.length) this.column = 'options';
      this.dirty = true;
      return;
    }
    this.options[this.index]?.activate();
    this.dirty = true;
  }

  private back(): void {
    if (this.mode === 'confirm') this.setMode('edit');
    else if (this.mode === 'reveal') this.leaveReveal();
    else if (this.column === 'options') {
      this.column = 'nav';
      this.dirty = true;
    } else this.scene.start(SCENES.title);
  }

  update(): void {
    const pad = readPad(this);
    if (!this.typing) {
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
    this.text(400, 23, this.mode === 'reveal' && this.shown ? `${this.shown.firstName} ${this.shown.lastName}` : name || 'New player', UI.ice);
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
      this.text(NAV.x + 10, y + 9, i === 6 ? `7 Saved: ${this.store.players.length}` : `${i + 1} ${label}`, focused ? UI.navy : UI.white);
      if (done) this.text(NAV.x + NAV.w - 20, y + 9, '+', GREEN);
    });
    this.text(20, 348, 'TEMPORARY IN V1:', UI.dim, 1);
    ['Font and card pictures.', 'Appearance, gear and', 'nationality come next.', '', 'CUR = curated profile'].forEach((line, i) => this.text(20, 360 + i * 10, line, UI.dim, 1));

    // Options
    this.slice(224, 60, 304, 424, 'panel');
    const heading = this.mode === 'confirm' ? 'LOCK IN?' : this.mode === 'reveal' ? 'YOUR PLAYER' : (STEPS[this.step] ?? '').toUpperCase();
    this.text(236, 72, heading, UI.gold);
    if (this.options.length > OPT.rows) this.text(440, 76, `${this.index + 1} / ${this.options.length}${this.options.length >= RESULT_LIMIT ? '+' : ''}`, UI.dim, 1);
    this.options.slice(this.scroll, this.scroll + OPT.rows).forEach((option, row) => {
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
    if (!this.options.length) wrap(this.step === 6 ? 'No players yet. Confirm one and they are kept here.' : 'Nothing matches.', 22).forEach((line, i) => this.text(236, 104 + i * 20, line, UI.dim));

    // Card for the highlighted option
    const focusedOption = this.column === 'options' ? this.options[this.index] : undefined;
    const card = this.mode === 'reveal' && this.shown ? this.playerCard(this.shown) : this.mode === 'confirm' ? this.confirmCard() : (focusedOption?.card ?? this.stepCard());
    this.drawCard(card);

    // Notes under the card
    this.slice(CARD.x, 292, CARD.w, 192, 'panel');
    this.notes().forEach((line, i) => this.text(CARD.x + 8, 302 + i * 10, line, line.startsWith('!') ? UI.red : UI.ice, 1));

    // Attributes
    this.slice(704, 60, 248, 424, 'panel');
    this.drawAttributes(focusedOption?.preview);

    // Footer
    this.slice(8, 492, W - 16, 40, 'panel');
    const hint = this.typing ? 'TYPE   ENTER: DONE   BACKSPACE: DELETE' : 'ARROWS / STICK: MOVE   ENTER / A: CHOOSE   ESC / B: BACK   MOUSE: CLICK';
    this.text(24, 505, this.warning ? clip(this.warning, 76) : hint, this.warning ? UI.red : UI.dim);
  }

  private stepDone(i: number): boolean {
    const d = this.draft;
    if (i === 0) return Boolean(d.firstName.trim() && d.lastName.trim());
    if (i === 1) return true;
    if (i === 2) return d.primary !== null;
    if (i === 3) return d.playStyle !== null;
    if (i === 4) return d.archetype !== null;
    if (i === 5) return draftProblems(d).length === 0;
    return false;
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
        return { colour: 'blue', title: s?.name ?? 'How do you play?', tag: 'PLAY STYLE', body: s ? `Develops faster: ${s.toward.map((k) => ATTRIBUTE_LABELS[k]).join(', ')}.` : 'Pick one. It can be changed between seasons.' };
      }
      case 'Archetype': {
        const a = d.archetype ? startingArchetypeById(d.archetype) : undefined;
        return { colour: 'green', title: a?.name ?? 'Who are you?', tag: 'ARCHETYPE', body: a?.description ?? 'Your identity in the room. It changes over a career. It never changes a rating.' };
      }
      case 'Saved Players':
        return { colour: 'green', title: 'Saved players', tag: 'LOCKED IN', body: `${this.store.players.length} of ${MAX_CREATED_PLAYERS}. Kept in this browser. A confirmed player is never rolled again.` };
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
    const art = this.add.rectangle(CARD.x + 8, CARD.y + 42, 144, 96, UI.navy, 0.85).setOrigin(0, 0).setStrokeStyle(1, UI.dim);
    this.layer.add(art);
    this.text(CARD.x + 44, CARD.y + 80, 'ART PENDING', UI.dim, 1);
    this.text(CARD.x + 38, CARD.y + 92, '(PLACEHOLDER)', UI.dim, 1);
    wrap(card.body, 23).slice(0, 4).forEach((line, i) => this.text(CARD.x + 10, CARD.y + 144 + i * 10, line, UI.white, 1));
    (card.footer ?? []).slice(0, 2).forEach((line, i) => this.text(CARD.x + 10, CARD.y + 190 + i * 13, line, tint, 1));
  }

  private notes(): string[] {
    const d = this.draft;
    if (this.mode === 'reveal' && this.shown) {
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

  private drawAttributes(preview?: Partial<PlayerDraft>): void {
    const g = this.add.graphics();
    this.layer.add(g);
    const barX = ATTR.x + 146;
    const px = (rating: number): number => Math.round((rating / 99) * ATTR.bar);
    if (this.mode === 'reveal' && this.shown) {
      const attributes = startingAttributes(this.shown.dna);
      this.text(ATTR.x, 72, `OVERALL ${ovr(this.shown)}`, UI.gold);
      for (const [row, key] of attributesFor(this.shown.dna.position).entries()) {
        const y = ATTR.y + 10 + row * ATTR.row;
        const now = attributes.current[key] ?? 0;
        const potential = attributes.potential[key] ?? 0;
        this.text(ATTR.x, y, ATTRIBUTE_LABELS[key], UI.white, 1);
        g.fillStyle(UI.navyLight).fillRect(barX, y, ATTR.bar, 7);
        g.fillStyle(UI.dim).fillRect(barX, y, px(potential), 7);
        g.fillStyle(GREEN).fillRect(barX, y, px(now), 7);
        this.text(barX - 18, y, `${now}`, UI.ice, 1);
      }
      this.text(ATTR.x, 462, 'GREEN: NOW   GREY: POTENTIAL', UI.dim, 1);
      return;
    }
    const draft = reconcileDraft({ ...this.draft, ...(preview ?? {}) });
    const input = draftInput(draft, 0);
    this.text(ATTR.x, 72, preview ? 'IF YOU PICK THIS' : 'WHERE YOU START', UI.gold);
    if (!input) {
      wrap('Choose a primary influence to see how your player will be shaped.', 19).forEach((line, i) => this.text(ATTR.x, 100 + i * 20, line, UI.dim));
      return;
    }
    for (const [row, key] of attributesFor(draft.position).entries()) {
      const y = ATTR.y + 10 + row * ATTR.row;
      const bounds = attributeBounds(input, key);
      this.text(ATTR.x, y, ATTRIBUTE_LABELS[key], UI.white, 1);
      g.fillStyle(UI.navyLight).fillRect(barX, y, ATTR.bar, 7);
      g.fillStyle(UI.dim).fillRect(barX + px(bounds.potential[0]), y + 5, Math.max(1, px(bounds.potential[1]) - px(bounds.potential[0])), 2);
      g.fillStyle(UI.ice).fillRect(barX + px(bounds.current[0]), y, Math.max(1, px(bounds.current[1]) - px(bounds.current[0])), 4);
    }
    this.text(ATTR.x, 440, 'BLUE: STARTING RANGE', UI.dim, 1);
    this.text(ATTR.x, 451, 'GREY: POTENTIAL RANGE', UI.dim, 1);
    this.text(ATTR.x, 462, 'ROLLED ONCE, WHEN YOU CONFIRM', UI.dim, 1);
  }
}
