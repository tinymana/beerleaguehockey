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

  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space' | 'j' | 'x' | 'z' | 'k' | 'shift', Phaser.Input.Keyboard.Key>;
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
    this.sim.setTeams(matchMode.teams);
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
    // Temporary marker under the skater the player controls.
    this.marker = this.add.ellipse(0, 0, 18, 9).setStrokeStyle(1, UI.gold, 1).setVisible(matchMode.teams);

    this.cameras.main.setBounds(0, 0, rink.worldWidth, this.worldHeight);
    this.camY = projectY(this.sim.skater.y, this.tilt);
    this.capturePrev();

    // HUD: fixed to the screen.
    const hud = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_HUD);
    hud.fillStyle(UI.navy, 0.8);
    hud.fillRect(0, 0, GAME_WIDTH, 12);
    hud.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12);
    this.fixed(addText(this, 4, 3, matchMode.teams ? '5 on 5 test' : 'Shooting practice', UI.gold));
    this.hudGoals = this.fixed(addText(this, GAME_WIDTH - 4, 3, 'Goals 0', UI.white).setOrigin(1, 0));
    this.hudSpeed = this.fixed(addText(this, 4, GAME_HEIGHT - 9, '', UI.ice));
    this.hudLast = this.fixed(addText(this, GAME_WIDTH / 2, 14, '', UI.gold).setOrigin(0.5, 0));
    this.fixed(
      addText(this, GAME_WIDTH - 4, GAME_HEIGHT - 9, matchMode.teams ? 'Space:shoot  Z:pass/switch  R:faceoff  T:practice  Esc:menu' : 'Tap:wrist  Hold:slap  G:goalie  R:puck  T:5 on 5  Esc:menu', UI.ice).setOrigin(1, 0),
    );
    this.banner = this.fixed(addText(this, GAME_WIDTH / 2, 120, '', UI.gold, 3).setOrigin(0.5, 0.5)).setVisible(false);
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
    if (this.padAlt.pressed(pad.alt)) this.sim.resetPuck();
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
        const who = matchMode.teams ? (e.end === 'top' ? 'Home scores!' : 'Away scores!') : 'Goal!';
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
      } else if (e.type === 'shot') {
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
    this.marker.setPosition(skaterX, skaterY).setDepth(skaterY - 0.7);
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
    if (matchMode.teams) {
      const seconds = Math.floor(this.sim.tick * SIM_DT);
      this.hudGoals.setText(fontText(`Home ${this.sim.score[0]}  Away ${this.sim.score[1]}   ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`));
    } else {
      this.hudGoals.setText(fontText(`Shots ${st.shots}  Saves ${st.saves}  Iron ${st.posts + st.crossbars}  Goals ${this.sim.goals}`));
    }
    this.hudLast.setText(fontText(st.last));

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
    sprite.setFrame(look.frame).setFlipX(look.flip).setPosition(x, y).setDepth(y);
  }

  private exitToMenu(): void {
    this.scene.start(SCENES.title);
  }
}
