import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI } from './config';
import { Edge, readPad } from './padInput';
import { addText, fontText } from './pixelFont';
import { arenaChoice, tuning, tuningPanel } from './session';
import { setTitleArtVisible } from './stage';
import { directionIndex8, lerp } from '../core/math';
import { quantize8 } from '../match/sim/input';
import type { SimInput } from '../match/sim/input';
import { SIM_DT, SkatingSim } from '../match/sim/skatingSim';
import type { SimEvent } from '../match/sim/skatingSim';
import { cameraTargetY, stepCamera } from '../match/view/cameraModel';
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

/**
 * Skating prototype view. Reads input, steps the simulation at a fixed
 * 60 Hz, and draws the interpolated result. No game rules live here.
 */
export class SkatingScene extends Phaser.Scene {
  private sim!: SkatingSim;
  private accumulator = 0;
  private prev = { sx: 0, sy: 0, px: 0, py: 0 };
  private camY = 0;
  private tilt = 1;
  private arena!: ArenaRenderer;
  private wearTimer = 0;
  private worldHeight = 0;

  private skater!: Phaser.GameObjects.Image;
  private puck!: Phaser.GameObjects.Image;
  private hudSpeed!: Phaser.GameObjects.BitmapText;
  private hudGoals!: Phaser.GameObjects.BitmapText;
  private banner!: Phaser.GameObjects.BitmapText;
  private chargeBar!: Phaser.GameObjects.Graphics;
  private bannerTimer = 0;
  private sinceShot = 10;
  private lastInput: SimInput = { moveX: 0, moveY: 0, shoot: false };

  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space' | 'j' | 'x', Phaser.Input.Keyboard.Key>;
  private readonly padSelect = new Edge();
  private readonly padStart = new Edge();
  private readonly padAlt = new Edge();

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

    this.puck = this.add.image(0, 0, TEX.puck);
    this.skater = this.add
      .image(0, 0, SKATER_SHEET.key, 0)
      .setOrigin(SKATER_SHEET.feet.x / SKATER_SHEET.cell, SKATER_SHEET.feet.y / SKATER_SHEET.cell);

    this.cameras.main.setBounds(0, 0, rink.worldWidth, this.worldHeight);
    this.camY = projectY(this.sim.skater.y, this.tilt);
    this.capturePrev();

    // HUD: fixed to the screen.
    const hud = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_HUD);
    hud.fillStyle(UI.navy, 0.8);
    hud.fillRect(0, 0, GAME_WIDTH, 12);
    hud.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12);
    this.fixed(addText(this, 4, 3, 'Skating prototype', UI.gold));
    this.fixed(addText(this, GAME_WIDTH / 2, 3, 'Temp art - style test', UI.dim).setOrigin(0.5, 0));
    this.hudGoals = this.fixed(addText(this, GAME_WIDTH - 4, 3, 'Goals 0', UI.white).setOrigin(1, 0));
    this.hudSpeed = this.fixed(addText(this, 4, GAME_HEIGHT - 9, '', UI.ice));
    this.fixed(
      addText(this, GAME_WIDTH - 4, GAME_HEIGHT - 9, 'Move:arrows  Shoot:space  R:puck  `:tuning  Esc:menu', UI.ice).setOrigin(1, 0),
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
    }) as typeof this.keys;
    kb.on('keydown-R', () => this.sim.resetPuck());
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

    const input = this.readInput(pad.x, pad.y, pad.action);
    this.lastInput = input;
    this.sinceShot += deltaMs / 1000;
    // Clamp long frames (tab switches) so the sim never spirals.
    this.accumulator += Math.min(deltaMs, 100) / 1000;
    while (this.accumulator >= SIM_DT) {
      this.capturePrev();
      this.handleEvents(this.sim.step(input));
      // Cosmetic ice wear follows the skater. It never feeds back into the simulation.
      const { skater } = this.sim;
      this.arena.addTraffic(skater.x, skater.y, Math.hypot(skater.x - this.prev.sx, skater.y - this.prev.sy) / WEAR_DISTANCE);
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

  private readInput(padX: number, padY: number, padShoot: boolean): SimInput {
    const k = this.keys;
    let x = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    let y = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    if (x === 0 && y === 0) {
      x = padX;
      y = padY;
    }
    const move = quantize8(x, y);
    return { moveX: move.x, moveY: move.y, shoot: k.space.isDown || k.j.isDown || k.x.isDown || padShoot };
  }

  private capturePrev(): void {
    this.prev.sx = this.sim.skater.x;
    this.prev.sy = this.sim.skater.y;
    this.prev.px = this.sim.puck.x;
    this.prev.py = this.sim.puck.y;
  }

  private handleEvents(events: SimEvent[]): void {
    for (const e of events) {
      if (e.type === 'goal') {
        this.banner.setText(fontText('Goal!')).setVisible(true);
        this.bannerTimer = 1.2;
        this.cameras.main.shake(180, 0.006);
        // Supplied net ripple: visual only, the goal itself was already decided by the sim.
        this.arena.setGoalState(e.end === 'top' ? 'north' : 'south', 'ripple');
      } else if (e.type === 'shot') {
        this.sinceShot = 0;
        if (e.power > 0.8) this.cameras.main.shake(60, 0.002);
      }
    }
  }

  private draw(alpha: number, dt: number): void {
    const { skater, puck } = this.sim;
    const sx = lerp(this.prev.sx, skater.x, alpha);
    const sy = lerp(this.prev.sy, skater.y, alpha);
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
    const { moveX, moveY } = this.lastInput;
    const pose = choosePose({
      speed,
      pushing: moveX !== 0 || moveY !== 0,
      againstTravel: moveX * skater.vx + moveY * skater.vy < 0,
      charging: skater.hasPuck && skater.charge > 0,
      sinceShot: this.sinceShot,
    });
    const look = skaterFrame(directionIndex8(skater.facing), pose, skater.stride / STRIDE_LENGTH);
    this.skater.setFrame(look.frame).setFlipX(look.flip);
    this.skater.setPosition(skaterX, skaterY).setDepth(skaterY);
    // A carried puck sits on the blade; draw it just in front of or behind the body as the stick points.
    this.puck.setPosition(puckX, puckY).setDepth(puck.state === 'carried' ? skaterY + (puckY >= skaterY ? 0.5 : -0.5) : puckY - 0.5);

    // Wind-up meter under the skater.
    this.chargeBar.clear();
    if (skater.hasPuck && skater.charge > 0) {
      const w = 20;
      const bx = skaterX - w / 2;
      const by = skaterY + 6;
      this.chargeBar.fillStyle(UI.navy, 1).fillRect(bx - 1, by - 1, w + 2, 4);
      this.chargeBar.fillStyle(this.sim.chargeLevel() >= 1 ? UI.red : UI.gold, 1).fillRect(bx, by, Math.round(w * this.sim.chargeLevel()), 2);
    }

    const target = cameraTargetY(
      {
        skaterY: projectY(skater.y, k),
        skaterVy: skater.vy * k,
        puckY: projectY(puck.y, k),
        puckVy: puck.vy * k,
        hasPuck: skater.hasPuck,
      },
      tuning.cameraLookahead,
      GAME_HEIGHT,
      this.worldHeight,
    );
    this.camY = stepCamera(this.camY, target, tuning.cameraFollow, dt);
    this.cameras.main.setScroll(0, Math.round(this.camY - GAME_HEIGHT / 2));

    const puckSpeed = Math.round(Math.hypot(puck.vx, puck.vy));
    this.hudSpeed.setText(fontText(`Skater ${Math.round(speed)}  Puck ${puckSpeed}`));
    this.hudGoals.setText(fontText(`Goals ${this.sim.goals}`));

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      this.banner.setVisible(Math.floor(this.bannerTimer * 8) % 2 === 0);
      if (this.bannerTimer <= 0) this.banner.setVisible(false);
    }
  }

  private exitToMenu(): void {
    this.scene.start(SCENES.title);
  }
}
