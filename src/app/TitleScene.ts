import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI, VERSION } from './config';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { DEFAULT_RULES, RULE_ROWS, cycleRule, isDefault, ruleText, saveRules } from './gameRules';
import { gameRules, tuningPanel } from './session';
import { setTitleArtVisible } from './stage';

interface MenuItem {
  label: string;
  /** Scene or overlay to open; absent means the mode is not built yet. */
  action?: 'skating' | 'creator' | 'options';
  note: string;
}

const MENU: readonly MenuItem[] = [
  { label: 'Pick-Up', action: 'skating', note: '5 on 5 test game' },
  { label: 'League Dynasty', note: 'Coming soon' },
  { label: 'Create', action: 'creator', note: 'Create a player' },
  { label: 'Leaderboard', note: 'Coming soon' },
  { label: 'Options', action: 'options', note: 'Rules and credits' },
];

/** Under the rules on the Options screen. */
const OPTION_COMMANDS = ['Back to the standard rules', 'Credits', 'Back'] as const;
const OPTION_COUNT = RULE_ROWS.length + OPTION_COMMANDS.length;

const MENU_X = 242;
const MENU_Y = 177;
const LINE = 13;
const PANEL = { x: 180, y: 169, w: 124, h: 91 };

/**
 * Main menu: an interactive layer drawn over the supplied title art, which
 * sits behind the transparent canvas at full resolution.
 */
export class TitleScene extends Phaser.Scene {
  private labels: Phaser.GameObjects.BitmapText[] = [];
  private cursorLeft!: Phaser.GameObjects.BitmapText;
  private cursorRight!: Phaser.GameObjects.BitmapText;
  private status!: Phaser.GameObjects.BitmapText;
  private credits: Phaser.GameObjects.Container | null = null;
  /** The Options screen: the Pick-Up rules, then Defaults, Credits and Back. */
  private options: Phaser.GameObjects.Container | null = null;
  private optionRows: Array<{ label: Phaser.GameObjects.BitmapText; value: Phaser.GameObjects.BitmapText }> = [];
  private optionAt = 0;
  private readonly padLeft = new Edge();
  private readonly padRight = new Edge();
  private selected = 0;
  private readonly padUp = new Edge();
  private readonly padDown = new Edge();
  private readonly padAction = new Edge();
  private readonly padBack = new Edge();

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    setTitleArtVisible(true);
    tuningPanel().hide();
    this.labels = [];
    this.credits = null;
    this.options = null;

    const g = this.add.graphics();
    g.fillStyle(UI.navy, 0.78);
    g.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    g.lineStyle(1, UI.ice, 1);
    g.strokeRect(PANEL.x + 0.5, PANEL.y + 0.5, PANEL.w - 1, PANEL.h - 1);
    g.lineStyle(1, UI.blue, 1);
    g.strokeRect(PANEL.x + 2.5, PANEL.y + 2.5, PANEL.w - 5, PANEL.h - 5);

    MENU.forEach((item, i) => {
      const label = addText(this, MENU_X, MENU_Y + i * LINE, item.label).setOrigin(0.5, 0);
      label.setInteractive({ useHandCursor: true });
      label.on('pointerover', () => this.select(i));
      label.on('pointerdown', () => {
        this.select(i);
        this.activate();
      });
      this.labels.push(label);
    });

    this.cursorLeft = addText(this, 0, 0, '>', UI.gold);
    this.cursorRight = addText(this, 0, 0, '<', UI.gold);
    g.lineStyle(1, UI.blue, 1);
    g.lineBetween(PANEL.x + 6, PANEL.y + PANEL.h - 16.5, PANEL.x + PANEL.w - 6, PANEL.y + PANEL.h - 16.5);
    this.status = addText(this, MENU_X, PANEL.y + PANEL.h - 12, '', UI.ice).setOrigin(0.5, 0);

    this.shadowText(4, GAME_HEIGHT - 10, `V${VERSION} PROTOTYPE   L: ARENA LAB (DEV)`, UI.ice);
    this.shadowText(GAME_WIDTH - 4, GAME_HEIGHT - 10, 'ARROWS + ENTER  /  D-PAD + A', UI.ice, 1);

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', () => this.move(-1));
      kb.on('keydown-W', () => this.move(-1));
      kb.on('keydown-DOWN', () => this.move(1));
      kb.on('keydown-S', () => this.move(1));
      kb.on('keydown-ENTER', () => this.activate());
      kb.on('keydown-SPACE', () => this.activate());
      kb.on('keydown-ESC', () => this.back());
      kb.on('keydown-LEFT', () => this.changeOption(-1));
      kb.on('keydown-A', () => this.changeOption(-1));
      kb.on('keydown-RIGHT', () => this.changeOption(1));
      kb.on('keydown-D', () => this.changeOption(1));
      // Developer shortcut: the Arena Asset Lab. Not part of the player menu.
      kb.on('keydown-L', () => {
        if (!this.credits && !this.options) this.scene.start(SCENES.arenaLab);
      });
    }

    this.select(this.selected);
  }

  update(): void {
    const pad = readPad(this);
    if (this.padUp.pressed(pad.y < -0.5)) this.move(-1);
    if (this.padDown.pressed(pad.y > 0.5)) this.move(1);
    if (this.padAction.pressed(pad.action || pad.start)) this.activate();
    if (this.padBack.pressed(pad.back)) this.back();
    if (this.padLeft.pressed(pad.x < -0.5)) this.changeOption(-1);
    if (this.padRight.pressed(pad.x > 0.5)) this.changeOption(1);
  }

  private shadowText(x: number, y: number, text: string, tint: number, originX = 0): void {
    addText(this, x + 1, y + 1, text, 0x000000).setOrigin(originX, 0);
    addText(this, x, y, text, tint).setOrigin(originX, 0);
  }

  private move(delta: number): void {
    if (this.credits) return;
    if (this.options) {
      this.selectOption((this.optionAt + delta + OPTION_COUNT) % OPTION_COUNT);
      return;
    }
    this.select((this.selected + delta + MENU.length) % MENU.length);
  }

  private select(index: number): void {
    if (this.credits || this.options) return;
    this.selected = index;
    MENU.forEach((item, i) => {
      const label = this.labels[i];
      if (!label) return;
      const active = i === index;
      label.setTint(active ? (item.action ? UI.gold : UI.white) : item.action ? UI.ice : UI.dim);
    });
    const item = MENU[index];
    const label = this.labels[index];
    if (!item || !label) return;
    const half = label.width / 2;
    this.cursorLeft.setPosition(MENU_X - half - 10, label.y);
    this.cursorRight.setPosition(MENU_X + half + 5, label.y);
    this.status.setText(fontText(item.note)).setTint(item.action ? UI.ice : UI.dim);
  }

  private activate(): void {
    if (this.credits) {
      this.closeCredits();
      return;
    }
    if (this.options) {
      this.activateOption();
      return;
    }
    const item = MENU[this.selected];
    const label = this.labels[this.selected];
    if (!item || !label) return;
    if (!item.action) {
      // Not built yet: say so, clearly.
      this.status.setText(fontText('Coming soon')).setTint(UI.red);
      this.tweens.add({ targets: label, x: MENU_X + 2, duration: 40, yoyo: true, repeat: 2, onComplete: () => label.setX(MENU_X) });
      return;
    }
    if (item.action === 'skating') {
      this.scene.start(SCENES.skating);
    } else if (item.action === 'creator') {
      this.scene.start(SCENES.creator);
    } else {
      this.openOptions();
    }
  }

  /** Esc or B: out of the credits to Options, out of Options to the menu. */
  private back(): void {
    if (this.credits) this.closeCredits();
    else if (this.options) this.closeOptions();
  }

  private openOptions(): void {
    const box = this.add.graphics();
    box.fillStyle(UI.navy, 0.94);
    box.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    box.lineStyle(1, UI.ice, 1);
    box.strokeRect(90.5, 40.5, GAME_WIDTH - 181, GAME_HEIGHT - 81);
    box.lineStyle(1, UI.blue, 1);
    box.strokeRect(92.5, 42.5, GAME_WIDTH - 185, GAME_HEIGHT - 85);
    // Swallows clicks so the menu underneath cannot be pressed through the screen.
    const shield = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setInteractive();
    const items: Phaser.GameObjects.GameObject[] = [box, shield];
    items.push(addText(this, GAME_WIDTH / 2, 52, 'Options', UI.gold, 2).setOrigin(0.5, 0));
    items.push(addText(this, GAME_WIDTH / 2, 76, 'Pick-Up rules', UI.ice).setOrigin(0.5, 0));
    this.optionRows = [];
    for (let i = 0; i < OPTION_COUNT; i++) {
      // A gap between the rules and the three commands under them.
      const y = 94 + i * 15 + (i >= RULE_ROWS.length ? 8 : 0);
      const label = addText(this, 126, y, '').setOrigin(0, 0);
      const value = addText(this, GAME_WIDTH - 126, y, '').setOrigin(1, 0);
      // The whole row can be clicked or tapped.
      const hit = this.add.zone(96, y - 4, GAME_WIDTH - 192, 15).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.selectOption(i));
      hit.on('pointerdown', () => {
        this.selectOption(i);
        this.activateOption();
      });
      this.optionRows.push({ label, value });
      items.push(label, value, hit);
    }
    items.push(addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 56, 'Arrows: choose and change   Esc: back', UI.dim).setOrigin(0.5, 0));
    this.options = this.add.container(0, 0, items).setDepth(9);
    this.cursorLeft.setVisible(false);
    this.cursorRight.setVisible(false);
    this.selectOption(0);
  }

  private closeOptions(): void {
    if (!this.options) return;
    this.options.destroy(true);
    this.options = null;
    this.optionRows = [];
    this.cursorLeft.setVisible(true);
    this.cursorRight.setVisible(true);
    this.select(this.selected);
  }

  private selectOption(index: number): void {
    if (!this.options || this.credits) return;
    this.optionAt = index;
    const rules = gameRules.current;
    this.optionRows.forEach((row, i) => {
      const active = i === index;
      const rule = RULE_ROWS[i];
      const [label, value] = rule ? ruleText(rules, rule) : [OPTION_COMMANDS[i - RULE_ROWS.length] ?? '', ''];
      const changed = rule ? rules[rule.key] !== DEFAULT_RULES[rule.key] : false;
      // The defaults command is dim when there is nothing to put back.
      const idle = !rule && i === RULE_ROWS.length && isDefault(rules);
      row.label.setText(fontText(`${active ? '> ' : '  '}${label}`)).setTint(active ? UI.gold : idle ? UI.dim : UI.ice);
      row.value.setText(fontText(rule ? `< ${value} >` : '')).setTint(active ? UI.gold : changed ? UI.white : UI.ice);
    });
  }

  /** Left and right change the selected rule. */
  private changeOption(step: 1 | -1): void {
    if (!this.options || this.credits) return;
    const rule = RULE_ROWS[this.optionAt];
    if (!rule) return;
    gameRules.current = cycleRule(gameRules.current, rule.key, step);
    saveRules(gameRules.current);
    this.selectOption(this.optionAt);
  }

  /** Enter, Space, A or a tap: the next choice for a rule, or run a command. */
  private activateOption(): void {
    const command = this.optionAt - RULE_ROWS.length;
    if (command < 0) {
      this.changeOption(1);
    } else if (command === 0) {
      gameRules.current = { ...DEFAULT_RULES };
      saveRules(gameRules.current);
      this.selectOption(this.optionAt);
    } else if (command === 1) {
      this.openCredits();
    } else {
      this.closeOptions();
    }
  }

  private openCredits(): void {
    const box = this.add.graphics();
    box.fillStyle(UI.navy, 0.92);
    box.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    box.lineStyle(1, UI.ice, 1);
    box.strokeRect(60.5, 60.5, GAME_WIDTH - 121, GAME_HEIGHT - 121);
    const lines: Array<[string, number, number]> = [
      ['Beer League Hockey', UI.gold, 2],
      ['', UI.white, 1],
      ['A Tiny Mana Studios game', UI.white, 1],
      ['', UI.white, 1],
      ['Creative direction and artwork', UI.ice, 1],
      ['Tiny Mana Studios', UI.white, 1],
      ['', UI.white, 1],
      ['Game development', UI.ice, 1],
      ['Built with Claude', UI.white, 1],
      ['', UI.white, 1],
      ['Rink, skater and font are temporary', UI.dim, 1],
      ['code-drawn stand-ins', UI.dim, 1],
      ['', UI.white, 1],
      ['Enter, Esc or a tap to return', UI.gold, 1],
    ];
    // A click or tap anywhere closes the credits.
    const shield = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setInteractive();
    shield.on('pointerdown', () => this.closeCredits());
    const items: Phaser.GameObjects.GameObject[] = [box, shield];
    let y = 78;
    for (const [text, tint, scale] of lines) {
      if (text) items.push(addText(this, GAME_WIDTH / 2, y, text, tint, scale).setOrigin(0.5, 0));
      y += scale === 2 ? 20 : 11;
    }
    this.credits = this.add.container(0, 0, items).setDepth(10);
  }

  private closeCredits(): void {
    if (!this.credits) return;
    this.credits.destroy(true);
    this.credits = null;
    if (this.options) this.selectOption(this.optionAt);
    else this.select(this.selected);
  }
}
