import Phaser from 'phaser';
import { Rng } from '../core/rng';
import { ATTRIBUTE_LABELS, attributesFor, overall } from '../dynasty/attributes';
import type { Position } from '../dynasty/attributes';
import { CREATED_PLAYER_AGE, backgroundsForAge } from '../dynasty/backgrounds';
import { MAX_SECONDARY_INFLUENCES, generateDNA } from '../dynasty/dna';
import type { PlayerDNA } from '../dynasty/dna';
import { influenceById, influenceName, influencesFor } from '../dynasty/influences';
import type { InfluenceRecord } from '../dynasty/influences';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI } from './config';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { createdPlayer, tuningPanel } from './session';
import { setTitleArtVisible } from './stage';

const POSITIONS: readonly { id: Position; label: string }[] = [
  { id: 'forward', label: 'Forward' },
  { id: 'defense', label: 'Defense' },
  { id: 'goalie', label: 'Goalie' },
];

type FieldId = 'position' | 'background' | 'primary' | 'secondary1' | 'secondary2' | 'reroll' | 'back';
const FIELDS: readonly { id: FieldId; label: string }[] = [
  { id: 'position', label: 'Position' },
  { id: 'background', label: 'Hockey background' },
  { id: 'primary', label: 'Primary influence' },
  { id: 'secondary1', label: 'Secondary influence 1' },
  { id: 'secondary2', label: 'Secondary influence 2' },
  { id: 'reroll', label: 'Re-roll player DNA' },
  { id: 'back', label: 'Back to menu' },
];

const LEFT = 8;
const RIGHT = 204;
const ROW = 10;
const BAR = { x: 322, w: 99 };
const GREEN = 0x5fd16b;

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

/**
 * Create a Player: the foundation. Pick a position, a hockey background and up to three
 * Hockey Influences, and see the player DNA those choices roll. Nothing is saved yet:
 * saves arrive with the league. Appearance, name and gear screens are not built.
 */
export class CreatorScene extends Phaser.Scene {
  private field = 0;
  private position: Position = 'forward';
  private background = 'youth';
  private primary = 'F01';
  private secondaries: (string | null)[] = [null, null];
  private seed = 1;
  private rng = new Rng(1);
  private dna!: PlayerDNA;
  private drawn: Phaser.GameObjects.GameObject[] = [];
  private readonly padUp = new Edge();
  private readonly padDown = new Edge();
  private readonly padLeft = new Edge();
  private readonly padRight = new Edge();
  private readonly padAction = new Edge();
  private readonly padBack = new Edge();

  constructor() {
    super(SCENES.creator);
  }

  create(): void {
    setTitleArtVisible(false);
    tuningPanel().hide();
    this.drawn = [];
    // The app layer may use the clock to pick a starting seed; everything after that is seeded.
    this.rng = new Rng(Date.now() >>> 0).fork('creator');
    const previous = createdPlayer.dna;
    if (previous) {
      this.position = previous.position;
      this.background = previous.background;
      this.primary = previous.primary;
      this.secondaries = [previous.secondaries[0] ?? null, previous.secondaries[1] ?? null];
      this.seed = previous.seed;
    } else {
      this.seed = this.rng.int(2147483647);
    }

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', () => this.move(-1));
      kb.on('keydown-DOWN', () => this.move(1));
      kb.on('keydown-LEFT', () => this.change(-1));
      kb.on('keydown-RIGHT', () => this.change(1));
      kb.on('keydown-ENTER', () => this.confirm());
      kb.on('keydown-SPACE', () => this.confirm());
      kb.on('keydown-ESC', () => this.leave());
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.roll();
  }

  update(): void {
    const pad = readPad(this);
    if (this.padUp.pressed(pad.y < -0.5)) this.move(-1);
    if (this.padDown.pressed(pad.y > 0.5)) this.move(1);
    if (this.padLeft.pressed(pad.x < -0.5)) this.change(-1);
    if (this.padRight.pressed(pad.x > 0.5)) this.change(1);
    if (this.padAction.pressed(pad.action || pad.start)) this.confirm();
    if (this.padBack.pressed(pad.back)) this.leave();
  }

  /** The player DNA currently on screen (also read by automated checks). */
  current(): PlayerDNA {
    return this.dna;
  }

  private pool(): InfluenceRecord[] {
    return influencesFor(this.position);
  }

  private chosenSecondaries(): string[] {
    return this.secondaries.filter((id): id is string => id !== null).slice(0, MAX_SECONDARY_INFLUENCES);
  }

  private move(delta: number): void {
    this.field = (this.field + delta + FIELDS.length) % FIELDS.length;
    this.draw();
  }

  private confirm(): void {
    const id = FIELDS[this.field]?.id;
    if (id === 'back') this.leave();
    else if (id === 'reroll') this.reroll();
    else this.change(1);
  }

  private leave(): void {
    this.scene.start(SCENES.title);
  }

  private reroll(): void {
    this.seed = this.rng.int(2147483647);
    this.roll();
  }

  private change(delta: number): void {
    const id = FIELDS[this.field]?.id;
    const step = <T>(list: readonly T[], at: number): T => list[(at + delta + list.length) % list.length] as T;
    if (id === 'position') {
      const before = this.position;
      this.position = step(POSITIONS, POSITIONS.findIndex((p) => p.id === this.position)).id;
      // Goalies and skaters have different heroes: start again from the top of the new list.
      if ((before === 'goalie') !== (this.position === 'goalie')) {
        this.primary = this.pool()[0]?.id ?? this.primary;
        this.secondaries = [null, null];
      }
    } else if (id === 'background') {
      const list = backgroundsForAge(CREATED_PLAYER_AGE);
      this.background = step(list, list.findIndex((b) => b.id === this.background)).id;
    } else if (id === 'primary') {
      const list = this.pool().filter((i) => !this.secondaries.includes(i.id));
      this.primary = step(list, list.findIndex((i) => i.id === this.primary)).id;
    } else if (id === 'secondary1' || id === 'secondary2') {
      const slot = id === 'secondary1' ? 0 : 1;
      const other = this.secondaries[1 - slot];
      const list: (string | null)[] = [null, ...this.pool().filter((i) => i.id !== this.primary && i.id !== other).map((i) => i.id)];
      this.secondaries[slot] = step(list, list.indexOf(this.secondaries[slot] ?? null));
    } else if (id === 'reroll') {
      this.reroll();
      return;
    } else {
      return;
    }
    this.roll();
  }

  private roll(): void {
    this.dna = generateDNA({ seed: this.seed, position: this.position, background: this.background, primary: this.primary, secondaries: this.chosenSecondaries() });
    createdPlayer.dna = this.dna;
    this.draw();
  }

  private text(x: number, y: number, value: string, tint: number = UI.white, originX = 0): Phaser.GameObjects.BitmapText {
    const t = addText(this, x, y, value, tint).setOrigin(originX, 0);
    this.drawn.push(t);
    return t;
  }

  private valueOf(id: FieldId): string {
    if (id === 'position') return POSITIONS.find((p) => p.id === this.position)?.label ?? '';
    if (id === 'background') return backgroundsForAge(CREATED_PLAYER_AGE).find((b) => b.id === this.background)?.label ?? '';
    const name = (key: string | null): string => {
      const influence = key ? influenceById(key) : undefined;
      return influence ? influenceName(influence) : 'None';
    };
    if (id === 'primary') return name(this.primary);
    if (id === 'secondary1') return name(this.secondaries[0] ?? null);
    if (id === 'secondary2') return name(this.secondaries[1] ?? null);
    if (id === 'reroll') return `Seed ${this.seed}`;
    return '';
  }

  private draw(): void {
    for (const o of this.drawn) o.destroy();
    this.drawn = [];
    const g = this.add.graphics();
    this.drawn.push(g);
    g.fillStyle(UI.navy, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, UI.blue, 1);
    g.strokeRect(2.5, 16.5, 195, GAME_HEIGHT - 31);
    g.strokeRect(199.5, 16.5, GAME_WIDTH - 202, GAME_HEIGHT - 31);

    this.text(LEFT, 5, 'Create a player', UI.gold);
    this.text(GAME_WIDTH - 6, 5, `Age ${CREATED_PLAYER_AGE} - foundation, not saved yet`, UI.dim, 1);

    // Choices.
    let y = 22;
    FIELDS.forEach((f, i) => {
      const active = i === this.field;
      const value = this.valueOf(f.id);
      this.text(LEFT + 8, y, f.label, active ? UI.gold : UI.ice);
      if (active) this.text(LEFT, y, '>', UI.gold);
      if (value) this.text(LEFT + 8, y + ROW, active && f.id !== 'reroll' ? `< ${value} >` : value, active ? UI.white : UI.dim);
      y += value ? ROW * 2 + 3 : ROW + 3;
    });

    // The influence under the cursor, or the primary.
    const focusId = FIELDS[this.field]?.id;
    const focus = influenceById((focusId === 'secondary1' ? this.secondaries[0] : focusId === 'secondary2' ? this.secondaries[1] : null) ?? this.primary);
    y += 2;
    g.lineBetween(LEFT, y - 3.5, 194, y - 3.5);
    if (focus) {
      const feet = focus.heightIn ? `${Math.floor(focus.heightIn / 12)}-${focus.heightIn % 12}` : '?';
      this.text(LEFT, y, influenceName(focus), UI.gold);
      this.text(LEFT, y + ROW, `Born ${focus.born} ${focus.country}  ${focus.position}`, UI.ice);
      this.text(LEFT, y + ROW * 2, `${feet}  ${focus.weightLb ?? '?'} lb  shoots ${focus.shoots ?? '?'}`, UI.ice);
      this.text(LEFT, y + ROW * 3, focus.tags.join(', '), UI.white);
      wrap(focus.blurb, 31).slice(0, 4).forEach((line, i) => this.text(LEFT, y + ROW * 4 + 2 + i * ROW, line, UI.dim));
    }

    // The rolled player.
    const keys = attributesFor(this.dna.position);
    const dna = this.dna;
    this.text(RIGHT, 22, `Overall ${overall(dna.start, keys).toFixed(1)}`, UI.white);
    this.text(RIGHT + 96, 22, `Ceiling ${overall(dna.potential, keys).toFixed(1)}`, UI.ice);
    this.text(GAME_WIDTH - 6, 22, 'Now / potential', UI.dim, 1);
    const top = 36;
    const rowHeight = keys.length > 17 ? 10 : 11;
    keys.forEach((key, i) => {
      const ry = top + i * rowHeight;
      const now = dna.start[key] ?? 0;
      const ceiling = dna.potential[key] ?? 0;
      const tint = dna.strengths.includes(key) ? GREEN : dna.weaknesses.includes(key) ? UI.red : UI.ice;
      this.text(RIGHT, ry, ATTRIBUTE_LABELS[key], tint);
      g.fillStyle(UI.navyLight, 1);
      g.fillRect(BAR.x, ry + 1, BAR.w, 5);
      g.fillStyle(UI.blue, 1);
      g.fillRect(BAR.x, ry + 1, ceiling, 5);
      g.fillStyle(UI.gold, 1);
      g.fillRect(BAR.x, ry + 1, now, 5);
      this.text(GAME_WIDTH - 6, ry, `${now}/${ceiling}`, tint, 1);
    });
    const below = top + keys.length * rowHeight + 4;
    g.lineStyle(1, UI.blue, 1);
    g.lineBetween(RIGHT, below - 2.5, GAME_WIDTH - 6, below - 2.5);
    const short = (list: readonly string[]): string => list.map((k) => ATTRIBUTE_LABELS[k as keyof typeof ATTRIBUTE_LABELS]).join(', ');
    let line = below;
    for (const [value, tint] of [
      [`Strong: ${short(dna.strengths)}`, GREEN],
      [`Weak: ${short(dna.weaknesses)}`, UI.red],
      [`Plays like: ${dna.tendencies.join(', ')}`, UI.white],
    ] as const) {
      for (const part of wrap(value, 44).slice(0, 2)) {
        this.text(RIGHT, line, part, tint);
        line += ROW;
      }
    }

    this.drawn.push(addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 11, fontText('Up/down: field   Left/right: change   Enter: re-roll   Esc: menu'), UI.ice).setOrigin(0.5, 0));
  }
}
