/**
 * The season screen (Decision 102): standings, scoring leaders, the last results and the next game.
 * Plain text in boxes, code-drawn: there is no season art yet. The team names are labelled placeholders.
 */
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI } from './config';
import { loadCreatedPlayers } from './createdPlayerStore';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { STANDINGS_HEAD, lastResults, nextLine, scorerLines, stageTitle, standingsLines } from './seasonGame';
import { loadSeason, saveSeason } from './seasonStore';
import { seasonPlay, tuningPanel } from './session';
import { setTitleArtVisible } from './stage';
import type { CreatedPlayer } from '../dynasty/createdPlayer';
import { SEASON, newSeason, nextUserGame, recordResult, seasonStage, simulateGame } from '../dynasty/season';
import type { SeasonState } from '../dynasty/season';

type Command = 'play' | 'sim' | 'new' | 'confirm' | 'back';

const LEFT = 16;
const RIGHT = 262;

export class SeasonScene extends Phaser.Scene {
  private state: SeasonState | null = null;
  private warning: string | null = null;
  private created: CreatedPlayer | null = null;
  private commands: Command[] = [];
  private at = 0;
  /** "New season" asks once more before it throws a season in progress away. */
  private confirming = false;
  private texts: Phaser.GameObjects.BitmapText[] = [];
  private menu: Phaser.GameObjects.BitmapText[] = [];
  private readonly padUp = new Edge();
  private readonly padDown = new Edge();
  private readonly padAction = new Edge();
  private readonly padBack = new Edge();

  constructor() {
    super(SCENES.season);
  }

  create(): void {
    setTitleArtVisible(false);
    tuningPanel().hide();
    seasonPlay.gameId = null;
    const loaded = loadSeason();
    this.state = loaded.state;
    this.warning = loaded.warning;
    const store = loadCreatedPlayers().store;
    this.created = store.players.find((p) => p.id === store.pickUpId) ?? null;
    this.confirming = false;
    this.at = 0;
    this.texts = [];
    this.menu = [];

    const g = this.add.graphics();
    g.fillStyle(UI.navy, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, UI.ice, 1).strokeRect(4.5, 4.5, GAME_WIDTH - 9, GAME_HEIGHT - 9);
    g.lineStyle(1, UI.blue, 1).strokeRect(6.5, 6.5, GAME_WIDTH - 13, GAME_HEIGHT - 13);
    g.lineBetween(10, 24.5, GAME_WIDTH - 10, 24.5);

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', () => this.move(-1));
      kb.on('keydown-W', () => this.move(-1));
      kb.on('keydown-DOWN', () => this.move(1));
      kb.on('keydown-S', () => this.move(1));
      kb.on('keydown-ENTER', () => this.activate());
      kb.on('keydown-SPACE', () => this.activate());
      kb.on('keydown-ESC', () => this.leave());
    }
    this.draw();
  }

  update(): void {
    const pad = readPad(this);
    if (this.padUp.pressed(pad.y < -0.5)) this.move(-1);
    if (this.padDown.pressed(pad.y > 0.5)) this.move(1);
    if (this.padAction.pressed(pad.action || pad.start)) this.activate();
    if (this.padBack.pressed(pad.back)) this.leave();
  }

  private line(x: number, y: number, text: string, tint: number = UI.white, scale = 1): Phaser.GameObjects.BitmapText {
    const t = addText(this, x, y, text, tint, scale);
    this.texts.push(t);
    return t;
  }

  /** Throw the words away and write the screen again from the season as it stands. */
  private draw(): void {
    for (const t of [...this.texts, ...this.menu]) t.destroy();
    this.texts = [];
    this.menu = [];
    const s = this.state;
    this.line(LEFT, 11, 'Season', UI.gold);
    if (!s) {
      this.line(GAME_WIDTH - LEFT, 11, 'No season yet', UI.ice).setOrigin(1, 0);
      const teams = 6;
      const rounds = (teams - 1) * SEASON.meetings;
      [
        `${teams} teams, ${rounds} games each, then the top ${SEASON.playoffTeams} play off:`,
        'semifinals and a final, one game each.',
        '',
        "You play your team's games. The others are simulated.",
        'Standard rules: 3:00 periods, 2:00 overtime, shootout.',
        '',
        this.created ? `Your player: #${this.created.profile.number ?? '--'} ${this.created.firstName} ${this.created.lastName} (${this.created.dna.position})` : 'No created player chosen: you play a team of regulars.',
        this.created ? 'He joins the Reds.' : 'Choose one with "Use in Pick-Up" in Create, then start.',
        '',
        'Team names and colours are placeholders.',
      ].forEach((text, i) => this.line(LEFT, 40 + i * 12, text, i === 6 ? UI.gold : UI.ice));
      if (this.warning) this.line(LEFT, 176, this.warning.slice(0, 74), UI.red);
      this.commands = ['new', 'back'];
    } else {
      this.line(GAME_WIDTH - LEFT, 11, stageTitle(s), UI.ice).setOrigin(1, 0);
      // Standings, the player's team in gold, a rule under the last playoff place.
      this.line(LEFT, 32, STANDINGS_HEAD, UI.ice);
      standingsLines(s).forEach((row, i) => this.line(LEFT, 44 + i * 11 + (i >= SEASON.playoffTeams ? 6 : 0), row.text, row.team === s.userTeam ? UI.gold : UI.white));
      // The top four make the playoffs.
      this.line(LEFT, 44 + SEASON.playoffTeams * 11 - 1, '- - - - - - - - - - - - - - - - - -', UI.dim);
      this.line(RIGHT, 44 + SEASON.playoffTeams * 11 - 1, `Top ${SEASON.playoffTeams} make the playoffs`, UI.dim);
      // Scoring leaders.
      this.line(LEFT, 124, 'Scoring leaders', UI.ice);
      const leaders = scorerLines(s, 6);
      leaders.forEach((row, i) => this.line(LEFT, 136 + i * 11, row.text, row.mine ? UI.gold : UI.white));
      if (leaders.length === 0) this.line(LEFT, 136, 'Nobody has scored yet.', UI.dim);
      // The latest results, on the right.
      const last = lastResults(s);
      this.line(RIGHT, 32, last.title || 'No games played yet', UI.ice);
      last.lines.forEach((text, i) => this.line(RIGHT, 44 + i * 11, text));
      this.line(RIGHT, 104, 'Placeholder team names', UI.dim);
      // What is next.
      this.line(LEFT, 212, nextLine(s), UI.gold);
      const mine = nextUserGame(s);
      this.commands = mine ? ['play', 'sim', this.confirming ? 'confirm' : 'new', 'back'] : [this.confirming ? 'confirm' : 'new', 'back'];
    }
    const label = (c: Command): string =>
      c === 'play' ? 'Play the game' : c === 'sim' ? 'Simulate it' : c === 'confirm' ? 'Really start over? Press again' : c === 'new' ? (s ? 'Start a new season' : 'Start the season') : 'Back to the menu';
    this.at = Math.min(this.at, this.commands.length - 1);
    this.commands.forEach((c, i) => {
      const t = addText(this, LEFT, 232 + i * 13, '').setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', () => {
        this.select(i);
        this.activate();
      });
      t.setData('label', label(c));
      this.menu.push(t);
    });
    this.line(GAME_WIDTH - LEFT, GAME_HEIGHT - 20, 'Up Down: choose   Enter: go   Esc: menu', UI.dim).setOrigin(1, 0);
    this.select(this.at);
  }

  private select(index: number): void {
    this.at = index;
    this.menu.forEach((t, i) => t.setText(fontText(`${i === index ? '> ' : '  '}${String(t.getData('label'))}`)).setTint(i === index ? UI.gold : UI.ice));
  }

  private move(step: number): void {
    if (this.commands.length === 0) return;
    if (this.confirming) {
      // Moving off the question withdraws it.
      this.confirming = false;
      this.draw();
    }
    this.select((this.at + step + this.commands.length) % this.commands.length);
  }

  private activate(): void {
    const command = this.commands[this.at];
    const s = this.state;
    if (command === 'back') {
      this.leave();
    } else if (command === 'play' && s) {
      const game = nextUserGame(s);
      if (!game) return;
      seasonPlay.gameId = game.id;
      this.scene.start(SCENES.skating);
    } else if (command === 'sim' && s) {
      const game = nextUserGame(s);
      if (!game) return;
      const outcome = recordResult(s, game.id, simulateGame(s, game));
      if (outcome.problems.length === 0) {
        this.state = outcome.state;
        saveSeason(outcome.state);
      }
      this.draw();
    } else if (command === 'new' && s && seasonStage(s) !== 'complete') {
      // A season in progress is only thrown away on a second press.
      this.confirming = true;
      this.draw();
    } else if (command === 'new' || command === 'confirm') {
      this.confirming = false;
      // Each season has its own seed: the count of seasons started, mixed with who is playing.
      const seed = ((s ? s.seed : 2026) * 9973 + 101 + (this.created?.id ?? 0)) % 2147483647;
      this.state = newSeason(seed, this.created);
      saveSeason(this.state);
      this.at = 0;
      this.draw();
    }
  }

  private leave(): void {
    this.scene.start(SCENES.title);
  }
}
