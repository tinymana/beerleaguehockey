import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI } from './config';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { PLAY_SCALE } from '../match/sim/rink';
import { arenaChoice, matchMode, tuning, tuningPanel } from './session';
import { setTitleArtVisible } from './stage';
import { directionIndex8, lerp } from '../core/math';
import { quantize8 } from '../match/sim/input';
import type { SimInput } from '../match/sim/input';
import { SIM_DT, SkatingSim } from '../match/sim/skatingSim';
import { clockText, periodText } from '../match/sim/match';
import { refereeFrame } from '../match/sim/referee';
import type { MatchState } from '../match/sim/match';
import type { SimEvent, Skater } from '../match/sim/skatingSim';
import { cameraTargetY, stepCamera } from '../match/view/cameraModel';
import { GOALIE_SHEET, goalieFrame } from '../match/view/goalieSprite';
import type { GoaliePose } from '../match/view/goalieSprite';
import { projectY } from '../match/view/projection';
import { SKATER_SHEET, choosePose, skaterFrame } from '../match/view/skaterSprite';
import { ArenaRenderer } from '../match/view/arena/ArenaRenderer';
import { arenaConfig } from '../match/view/arena/config';
import { layerDepth } from '../match/view/arena/layout';
import { REGISTRY_KEY } from '../match/view/arena/registry';
import type { ArenaRegistry } from '../match/view/arena/registry';
import { TEX } from '../match/view/textures';

const STRIDE_LENGTH = 11;
const DEPTH_FRONT_BOARDS = layerDepth('frontBoards');
const DEPTH_HUD = layerDepth('ui');
/** Skating this many pixels over a tile takes it from fresh to fully worn. */
const WEAR_DISTANCE = 900;
/** Temporary team colours for the 5-on-5 test: the away side is the same art shown through a gold tint. Not uniforms. */
const AWAY_TINT = 0xffc94d;
/** Seconds a goalie holds a save pose. */
const SAVE_POSE_TIME = 0.45;

/**
 * Skating prototype view. Reads input, steps the simulation at a fixed
 * 60 Hz, and draws the interpolated result. No game rules live here.
 */
export class SkatingScene extends Phaser.Scene {
  private sim!: SkatingSim;
  private accumulator = 0;
  private prev = { sx: 0, sy: 0, px: 0, py: 0 };
  private prevSkaters: { x: number; y: number }[] = [];
  private camY = 0;
  private tilt = 1;
  private arena!: ArenaRenderer;
  private wearTimer = 0;
  private worldHeight = 0;

  private skaterSprites: Phaser.GameObjects.Image[] = [];
  private marker!: Phaser.GameObjects.Ellipse;
  private arrow!: Phaser.GameObjects.Image;
  private passRing!: Phaser.GameObjects.Ellipse;
  private refSprite!: Phaser.GameObjects.Image;
  private lastInput: SimInput = { moveX: 0, moveY: 0, shoot: false };
  private goaliePoses: { pose: GoaliePose; time: number }[] = [];
  private puck!: Phaser.GameObjects.Image;
  private puckShadow!: Phaser.GameObjects.Ellipse;
  private goalieSprites: Phaser.GameObjects.Image[] = [];
  private hudLast!: Phaser.GameObjects.BitmapText;
  private hudSpeed!: Phaser.GameObjects.BitmapText;
  private hudGoals!: Phaser.GameObjects.BitmapText;
  private banner!: Phaser.GameObjects.BitmapText;
  private chargeBar!: Phaser.GameObjects.Graphics;
  private bannerTimer = 0;
  private panel!: Phaser.GameObjects.Graphics;
  private panelLines: Phaser.GameObjects.BitmapText[] = [];
  private readonly padGo = new Edge();
  private drawNote = { text: '', time: 0 };

  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space' | 'j' | 'x' | 'z' | 'k' | 'shift' | 'c' | 'v', Phaser.Input.Keyboard.Key>;
  private readonly padSelect = new Edge();
  private readonly padStart = new Edge();
  private readonly padAlt = new Edge();
  private readonly padMode = new Edge();

  constructor() {
    super(SCENES.skating);
  }

  create(): void {
    setTitleArtVisible(false);
    this.sim = new SkatingSim(tuning);
    this.accumulator = 0;
    this.bannerTimer = 0;
    const rink = this.sim.rink;

    // The camera tilt is view-only: the simulation never knows about it.
    this.tilt = tuning.cameraTilt;
    this.arena = new ArenaRenderer(this, this.cache.json.get(REGISTRY_KEY) as ArenaRegistry, arenaConfig(arenaChoice.id), rink, this.tilt);
    this.worldHeight = this.arena.worldHeight;
    this.wearTimer = 0;

    // Milestone 1 shooting prototype (Decision 78): a basic goalie in each net. G takes them out or puts them back.
    this.sim.setGoalies(true);
    // The 5-on-5 test game: two teams of five, the computer playing everyone the player does not control.
    // Pick-Up is a full game: clock, whistles, the contact button, penalties (Decision 86). Each game draws its own referee.
    matchMode.games++;
    this.sim.setTeams(matchMode.teams, matchMode.teams, 11 + matchMode.games * 7919);
    this.goalieSprites = [];
    this.goaliePoses = [];
    for (const g of this.sim.goalies) {
      // Goalie art from the supplied sheet, shown at the play scale like the skater. The top goalie defends against team 0, so he is on the away side.
      const sprite = this.add.image(g.x, 0, GOALIE_SHEET.key, 0).setOrigin(GOALIE_SHEET.feet.x / GOALIE_SHEET.cell, GOALIE_SHEET.feet.y / GOALIE_SHEET.cell).setScale(PLAY_SCALE);
      if (matchMode.teams && g.end === 'top') sprite.setTint(AWAY_TINT);
      this.goalieSprites.push(sprite);
      this.goaliePoses.push({ pose: 'ready', time: 0 });
    }
    this.puckShadow = this.add.ellipse(0, 0, 5, 3, 0x1b2a5a, 0.45).setVisible(false);

    this.puck = this.add.image(0, 0, TEX.puck);
    this.skaterSprites = this.sim.skaters.map((s) => {
      const sprite = this.add
        .image(0, 0, SKATER_SHEET.key, 0)
        .setOrigin(SKATER_SHEET.feet.x / SKATER_SHEET.cell, SKATER_SHEET.feet.y / SKATER_SHEET.cell)
        // Decision 80: the player is 32 px. Until the skater is redrawn at that size, the 48 px art is shown shrunk by
        // the display (temporary and rough: this is the one place art is not shown at a whole-number scale).
        .setScale(PLAY_SCALE);
      if (s.team === 1) sprite.setTint(AWAY_TINT);
      return sprite;
    });
    // Who you control (temporary, code-drawn): a gold ring at his skates and a gold arrow bobbing over his head.
    this.marker = this.add.ellipse(0, 0, 22, 11).setStrokeStyle(2, UI.gold, 1).setVisible(matchMode.teams);
    if (!this.textures.exists('tmp-you')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(UI.navy, 1).fillTriangle(0, 0, 11, 0, 5.5, 8);
      g.fillStyle(UI.gold, 1).fillTriangle(2, 1, 9, 1, 5.5, 6);
      g.generateTexture('tmp-you', 11, 8);
      g.destroy();
    }
    this.arrow = this.add.image(0, 0, 'tmp-you').setOrigin(0.5, 1).setVisible(matchMode.teams);
    // The referee: supplied 32 px art, feet on row 27 of the frame.
    this.refSprite = this.add.image(0, 0, 'ref/referee_front_idle_01').setOrigin(0.5, 28 / 32).setVisible(false);
    // The teammate a pass would go to: a thin white ring at his skates.
    this.passRing = this.add.ellipse(0, 0, 18, 9).setStrokeStyle(1, UI.white, 0.9).setVisible(false);

    this.cameras.main.setBounds(0, 0, rink.worldWidth, this.worldHeight);
    this.camY = projectY(this.sim.skater.y, this.tilt);
    this.capturePrev();

    // HUD: fixed to the screen.
    const hud = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_HUD);
    hud.fillStyle(UI.navy, 0.8);
    hud.fillRect(0, 0, GAME_WIDTH, 12);
    hud.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12);
    this.fixed(addText(this, 4, 3, matchMode.teams ? 'Pick-up' : 'Shooting practice', UI.gold));
    this.hudGoals = this.fixed(addText(this, GAME_WIDTH - 4, 3, 'Goals 0', UI.white).setOrigin(1, 0));
    this.hudSpeed = this.fixed(addText(this, 4, GAME_HEIGHT - 9, '', UI.ice));
    this.hudLast = this.fixed(addText(this, GAME_WIDTH / 2, 14, '', UI.gold).setOrigin(0.5, 0));
    this.fixed(
      addText(this, GAME_WIDTH - 4, GAME_HEIGHT - 9, matchMode.teams ? 'Space:shoot  Z:pass/switch  C:check  T:practice' : 'Tap:wrist  Hold:slap  G:goalie  R:puck  T:5 on 5  Esc:menu', UI.ice).setOrigin(1, 0),
    );
    this.banner = this.fixed(addText(this, GAME_WIDTH / 2, 120, '', UI.gold, 3).setOrigin(0.5, 0.5)).setVisible(false);
    // Intermission and final panel: plain text in the game's font until the broadcast graphics are re-issued at game size.
    this.panel = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_HUD + 2).setVisible(false);
    this.panel.fillStyle(UI.navy, 0.94).fillRect(110, 70, 260, 176);
    this.panel.lineStyle(1, UI.gold, 1).strokeRect(110.5, 70.5, 259, 175);
    this.panelLines = [];
    for (let i = 0; i < 13; i++) {
      this.panelLines.push(addText(this, GAME_WIDTH / 2, 78 + i * 12, '', UI.white).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_HUD + 3).setVisible(false));
    }
    this.chargeBar = this.add.graphics().setDepth(DEPTH_FRONT_BOARDS + 1);

    const kb = this.input.keyboard;
    if (!kb) throw new Error('Keyboard input unavailable');
    this.keys = kb.addKeys({
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      w: 'W',
      a: 'A',
      s: 'S',
      d: 'D',
      space: 'SPACE',
      j: 'J',
      x: 'X',
      z: 'Z',
      k: 'K',
      shift: 'SHIFT',
      c: 'C',
      v: 'V',
    }) as typeof this.keys;
    kb.on('keydown-T', () => this.toggleMode());
    kb.on('keydown-R', () => this.sim.resetPuck());
    kb.on('keydown-G', () => {
      if (matchMode.teams) return;
      const on = this.sim.goalies.length === 0;
      this.sim.setGoalies(on);
      for (const sprite of this.goalieSprites) sprite.setVisible(on);
    });
    kb.on('keydown-BACKTICK', () => tuningPanel().toggle());
    kb.on('keydown-ESC', () => this.exitToMenu());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.removeAllListeners();
      tuningPanel().hide();
      this.arena.destroy();
    });
  }

  update(_time: number, deltaMs: number): void {
    const pad = readPad(this);
    if (this.padSelect.pressed(pad.select)) tuningPanel().toggle();
    if (!matchMode.teams && this.padAlt.pressed(pad.alt)) this.sim.resetPuck();
    if (this.padStart.pressed(pad.start)) {
      this.exitToMenu();
      return;
    }

    if (tuning.cameraTilt !== this.tilt) {
      // The tilt slider redraws the rink; restart the scene on the new projection.
      this.scene.restart();
      return;
    }

    if (this.padMode.pressed(pad.select && pad.alt)) {
      this.toggleMode();
      return;
    }
    const input = this.readInput(pad.x, pad.y, pad.action, pad.back);
    if (matchMode.teams) input.check = this.keys.c.isDown || this.keys.v.isDown || pad.alt;
    this.lastInput = input;
    // Between periods and after the final horn the shoot button carries on.
    const phase = this.sim.match?.phase;
    if (this.padGo.pressed(input.shoot) && (phase === 'intermission' || phase === 'final')) {
      if (phase === 'final') {
        this.scene.restart();
        return;
      }
      this.sim.advance();
    }
    // Clamp long frames (tab switches) so the sim never spirals.
    this.accumulator += Math.min(deltaMs, 100) / 1000;
    while (this.accumulator >= SIM_DT) {
      this.capturePrev();
      this.handleEvents(this.sim.step(input));
      // Cosmetic ice wear follows the skater. It never feeds back into the simulation.
      this.sim.skaters.forEach((sk, i) => {
        const was = this.prevSkaters[i] ?? sk;
        const moved = Math.hypot(sk.x - was.x, sk.y - was.y);
        if (moved < 10) this.arena.addTraffic(sk.x, sk.y, moved / WEAR_DISTANCE);
      });
      this.accumulator -= SIM_DT;
    }
    this.wearTimer += deltaMs;
    if (this.wearTimer > 400) {
      this.wearTimer = 0;
      this.arena.refreshWear();
    }
    this.draw(this.accumulator / SIM_DT, deltaMs / 1000);
  }

  private fixed<T extends Phaser.GameObjects.BitmapText>(obj: T): T {
    obj.setScrollFactor(0).setDepth(DEPTH_HUD + 1);
    return obj;
  }

  private toggleMode(): void {
    matchMode.teams = !matchMode.teams;
    this.scene.restart();
  }

  private readInput(padX: number, padY: number, padShoot: boolean, padPass: boolean): SimInput {
    const k = this.keys;
    let x = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    let y = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    if (x === 0 && y === 0) {
      x = padX;
      y = padY;
    }
    const move = quantize8(x, y);
    return { moveX: move.x, moveY: move.y, shoot: k.space.isDown || k.j.isDown || k.x.isDown || padShoot, pass: k.z.isDown || k.k.isDown || k.shift.isDown || padPass };
  }

  private capturePrev(): void {
    this.prev.sx = this.sim.skater.x;
    this.prev.sy = this.sim.skater.y;
    this.prev.px = this.sim.puck.x;
    this.prev.py = this.sim.puck.y;
    this.prevSkaters = this.sim.skaters.map((s) => ({ x: s.x, y: s.y }));
  }

  private handleEvents(events: SimEvent[]): void {
    for (const e of events) {
      if (e.type === 'goal') {
        const inShootout = this.sim.match?.phase === 'shootout';
        const who = inShootout ? 'Scores!' : matchMode.teams ? (e.end === 'top' ? 'Home scores!' : 'Away scores!') : 'Goal!';
        this.banner.setText(fontText(e.fiveHole && !matchMode.teams ? 'Five-hole!' : who)).setVisible(true);
        this.bannerTimer = 1.2;
        this.cameras.main.shake(180, 0.006);
        // Supplied net ripple: visual only, the goal itself was already decided by the sim.
        const end = e.end === 'top' ? 'north' : 'south';
        this.arena.setGoalState(end, 'ripple');
        // Goal lamp and crowd: also visual only. With no teams yet, the whole building celebrates.
        this.arena.flashLamp(end);
        this.arena.crowdReact('goal');
      } else if (e.type === 'save' || e.type === 'post' || e.type === 'crossbar' || e.type === 'over') {
        const text = e.type === 'save' ? `${e.kind} save` : e.type === 'post' ? 'Post!' : e.type === 'crossbar' ? 'Crossbar!' : 'Over the net';
        this.banner.setText(fontText(text)).setVisible(true);
        this.bannerTimer = 0.9;
        if (e.type === 'save') {
          const i = this.sim.goalies.findIndex((g) => g.end === e.end);
          const pose = this.goaliePoses[i];
          if (pose) [pose.pose, pose.time] = [e.kind === 'body' ? 'cover' : e.kind, SAVE_POSE_TIME];
        }
      } else if (e.type === 'whistle' && e.reason !== 'goal' && e.reason !== 'start') {
        const text = e.reason === 'icing' ? 'Icing' : e.reason === 'offside' ? 'Offside' : e.reason === 'freeze' ? 'Whistle' : '';
        if (text) this.flash(text, 1);
      } else if (e.type === 'penalty') {
        this.flash(`${e.team === 0 ? 'Home' : 'Away'} ${e.foul}`, 1.8);
      } else if (e.type === 'hit') {
        this.cameras.main.shake(90, 0.004);
      } else if (e.type === 'draw' && e.team !== -1 && this.sim.match?.reason !== 'start') {
        this.drawNote = { text: e.team === 0 ? 'Draw won' : 'Draw lost', time: 1.2 };
      } else if (e.type === 'period') {
        this.flash(e.period >= 3 ? 'Final horn' : `End of the ${periodText(e.period)}`, 1.2);
      } else if (e.type === 'attempt' && !e.goal) {
        this.flash('No goal', 0.9);
      } else if (e.type === 'shot') {
        if (e.oneTimer) this.drawNote = { text: 'One-timer!', time: 1.2 };
        if (e.power > 0.8) this.cameras.main.shake(60, 0.002);
      }
    }
  }

  private draw(alpha: number, dt: number): void {
    const { skater, puck } = this.sim;
    // Control can move to another skater between steps: interpolate from that skater's own last position.
    const was = this.prevSkaters[this.sim.controlled] ?? skater;
    const sx = lerp(was.x, skater.x, alpha);
    const sy = lerp(was.y, skater.y, alpha);
    // A puck that just teleported (reset) must not be interpolated.
    const jumped = Math.hypot(puck.x - this.prev.px, puck.y - this.prev.py) > 40;
    const px = jumped ? puck.x : lerp(this.prev.px, puck.x, alpha);
    const py = jumped ? puck.y : lerp(this.prev.py, puck.y, alpha);

    const k = this.tilt;
    const skaterX = Math.round(sx);
    const skaterY = Math.round(projectY(sy, k));
    const puckX = Math.round(px);
    const puckY = Math.round(projectY(py, k));

    const speed = Math.hypot(skater.vx, skater.vy);
    this.sim.skaters.forEach((sk, i) => this.drawSkater(sk, i, alpha));
    const ref = this.sim.referee;
    this.refSprite.setVisible(ref !== null);
    if (ref) {
      const ry = Math.round(projectY(ref.y, k));
      this.refSprite.setTexture(`ref/${refereeFrame(ref)}`).setPosition(Math.round(ref.x), ry).setDepth(ry);
    }
    const mine = matchMode.teams && !skater.out;
    this.marker.setPosition(skaterX, skaterY).setDepth(skaterY - 0.7).setVisible(mine);
    this.arrow.setPosition(skaterX, skaterY - 21 + Math.round(Math.sin(this.sim.tick / 9) * 1.5)).setDepth(skaterY + 400).setVisible(mine);
    const mate = mine && skater.hasPuck ? this.sim.passMate(skater, this.lastInput) : null;
    this.passRing.setVisible(mate !== null);
    if (mate) {
      const my = Math.round(projectY(mate.y, k));
      this.passRing.setPosition(Math.round(mate.x), my).setDepth(my - 0.7);
    }
    const carrier = this.sim.carrier();
    const carrierY = carrier ? Math.round(projectY(carrier.y, k)) : skaterY;
    // A carried puck sits on the blade; draw it just in front of or behind the body as the stick points.
    // A lifted puck is drawn above its shadow by its height, seen through the camera tilt.
    const lift = Math.round(puck.z * Math.sqrt(1 - k * k));
    this.puckShadow.setVisible(lift > 0).setPosition(puckX, puckY).setDepth(puckY - 0.6);
    this.sim.goalies.forEach((g, i) => {
      const gy = Math.round(projectY(g.y, k));
      const state = this.goaliePoses[i];
      if (state && state.time > 0) state.time -= dt;
      const pose: GoaliePose = g.holding > 0 ? 'cover' : state && state.time > 0 ? state.pose : Math.abs(g.vx) > 8 ? 'shuffle' : 'ready';
      const look = goalieFrame(g.end === 'top', pose, this.sim.tick / 10);
      this.goalieSprites[i]?.setFrame(look.frame).setFlipX(look.flip).setPosition(Math.round(g.x), gy + 2).setDepth(gy);
    });
    this.puck.setPosition(puckX, puckY - lift).setDepth(puck.state === 'carried' ? carrierY + (puckY >= carrierY ? 0.5 : -0.5) : puckY - 0.5);

    // Wind-up meter under the skater.
    this.chargeBar.clear();
    if (skater.hasPuck && skater.charge > 0) {
      const w = 20;
      const bx = skaterX - w / 2;
      const by = skaterY + 6;
      this.chargeBar.fillStyle(UI.navy, 1).fillRect(bx - 1, by - 1, w + 2, 4);
      this.chargeBar.fillStyle(this.sim.chargeLevel() >= 1 ? UI.red : UI.gold, 1).fillRect(bx, by, Math.round(w * this.sim.chargeLevel()), 2);
    }

    // With teams the camera stays on the puck; alone it keeps the skater in view.
    const follow = matchMode.teams ? puck : skater;
    const target = cameraTargetY(
      {
        skaterY: projectY(follow.y, k),
        skaterVy: follow.vy * k,
        puckY: projectY(puck.y, k),
        puckVy: puck.vy * k,
        hasPuck: matchMode.teams || skater.hasPuck,
      },
      tuning.cameraLookahead,
      GAME_HEIGHT,
      this.worldHeight,
    );
    this.camY = stepCamera(this.camY, target, tuning.cameraFollow, dt);
    this.cameras.main.setScroll(0, Math.round(this.camY - GAME_HEIGHT / 2));

    const puckSpeed = Math.round(Math.hypot(puck.vx, puck.vy));
    // The speed readout is for tuning the skating; the 5-on-5 controls need the room.
    this.hudSpeed.setText(fontText(matchMode.teams ? '' : `Skater ${Math.round(speed)}  Puck ${puckSpeed}`));
    const st = this.sim.stats;
    if (this.sim.match) {
      this.drawMatch(this.sim.match);
    } else {
      this.hudGoals.setText(fontText(`Shots ${st.shots}  Saves ${st.saves}  Iron ${st.posts + st.crossbars}  Goals ${this.sim.goals}`));
    }
    if (!this.sim.match) this.hudLast.setText(fontText(st.last));

    if (this.drawNote.time > 0) this.drawNote.time -= dt;
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      this.banner.setVisible(Math.floor(this.bannerTimer * 8) % 2 === 0);
      if (this.bannerTimer <= 0) this.banner.setVisible(false);
    }
  }

  private drawSkater(sk: Skater, i: number, alpha: number): void {
    const sprite = this.skaterSprites[i];
    const was = this.prevSkaters[i] ?? sk;
    if (!sprite) return;
    // A skater who was just moved to a faceoff spot must not be interpolated.
    const jumped = Math.hypot(sk.x - was.x, sk.y - was.y) > 40;
    const x = Math.round(jumped ? sk.x : lerp(was.x, sk.x, alpha));
    const y = Math.round(projectY(jumped ? sk.y : lerp(was.y, sk.y, alpha), this.tilt));
    const speed = Math.hypot(sk.vx, sk.vy);
    const pose = choosePose({
      speed,
      pushing: sk.pushing,
      againstTravel: sk.pushing && Math.cos(sk.facing) * sk.vx + Math.sin(sk.facing) * sk.vy < 0,
      charging: sk.hasPuck && sk.charge > 0,
      sinceShot: (this.sim.tick - sk.shotTick) * SIM_DT,
    });
    const look = skaterFrame(directionIndex8(sk.facing), pose, sk.stride / STRIDE_LENGTH);
    // Off the ice (penalty box, shootout) he is not drawn; knocked down, the same art is laid on its side (temporary: no fallen frame yet).
    sprite.setVisible(!sk.out).setAngle(sk.down > 0 ? 90 : 0);
    sprite.setFrame(look.frame).setFlipX(look.flip).setPosition(x, sk.down > 0 ? y - 5 : y).setDepth(y);
  }

  private flash(text: string, seconds: number): void {
    this.banner.setText(fontText(text)).setVisible(true);
    this.bannerTimer = seconds;
  }

  /** The scorebug line, the penalty clocks under it, and the intermission and final panel. Text only, for now. */
  private drawMatch(m: MatchState): void {
    const [home, away] = this.sim.score;
    const so = m.shootout;
    if (so && m.phase === 'shootout') {
      const marks = (r: boolean[]): string => r.map((g) => (g ? 'O' : 'X')).join('') || '-';
      this.hudGoals.setText(fontText(`Shootout  Home ${marks(so.results[0])}  Away ${marks(so.results[1])}`));
    } else {
      this.hudGoals.setText(fontText(`Home ${home}   ${periodText(m.period)} ${clockText(m.clock)}   Away ${away}`));
    }
    if (m.penalties.length) {
      this.hudLast.setText(fontText(m.penalties.map((p) => `${p.team === 0 ? 'Home' : 'Away'} ${p.foul} ${clockText(p.left)}`).join('   ')));
    } else if (m.phase === 'faceoff' || m.phase === 'draw') {
      this.hudLast.setText(fontText(m.reason === 'start' || m.reason === 'period' ? `Referee: ${m.referee.label}` : 'Faceoff'));
    } else {
      this.hudLast.setText(fontText(this.drawNote.time > 0 && m.phase === 'play' ? this.drawNote.text : ''));
    }
    const show = m.phase === 'intermission' || m.phase === 'final';
    this.panel.setVisible(show);
    for (const line of this.panelLines) line.setVisible(show);
    if (!show) return;
    const [a, b] = m.stats;
    const row = (label: string, x: number, y: number): string => `${String(x).padStart(3)}   ${label.padEnd(12)}${String(y).padStart(3)}`;
    const winner = m.winner === null ? '' : m.winner === 0 ? 'Home wins' : 'Away wins';
    const lines = [
      m.phase === 'final' ? `Final${so ? ' (shootout)' : ''}` : `End of the ${periodText(m.period)} period`,
      '',
      'Home               Away',
      row('Goals', home, away),
      row('Shots', a.shots, b.shots),
      row('Saves', a.saves, b.saves),
      row('Faceoffs', a.faceoffs, b.faceoffs),
      row('Takeaways', a.takeaways, b.takeaways),
      row('Penalty min', a.pim, b.pim),
      row('PP goals', a.powerPlayGoals, b.powerPlayGoals),
      m.phase === 'final' ? winner : '',
      `Referee: ${m.referee.label}`,
      m.phase === 'final' ? 'Space: play again   Esc: menu' : 'Space: next period',
    ];
    this.panelLines.forEach((line, i) => line.setText(fontText(lines[i] ?? '')).setTint(i === 0 || i === 10 ? UI.gold : i === 12 ? UI.ice : UI.white));
  }

  private exitToMenu(): void {
    this.scene.start(SCENES.title);
  }
}
