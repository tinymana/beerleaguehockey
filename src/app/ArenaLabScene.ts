import Phaser from 'phaser';
import { clamp } from '../core/math';
import { RINK, goalLineY } from '../match/sim/rink';
import { ArenaRenderer } from '../match/view/arena/ArenaRenderer';
import { arenaConfig } from '../match/view/arena/config';
import { ARENA_LAYERS, benchReport, goalAlignment, goalFit } from '../match/view/arena/layout';
import type { ArenaLayerId } from '../match/view/arena/layout';
import { REGISTRY_KEY, assetById } from '../match/view/arena/registry';
import type { ArenaRegistry } from '../match/view/arena/registry';
import { projectY } from '../match/view/projection';
import { ArenaLabPanel } from './arenaLabPanel';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI } from './config';
import { addText } from './pixelFont';
import { arenaChoice, tuning, tuningPanel } from './session';
import { setTitleArtVisible } from './stage';

const SCROLL_SPEED = 240;
const AUTO_SPEED = 90;

/**
 * Arena Asset Lab: a developer-only screen for approving arena art before it
 * goes into the game. Shows the assembled rink with every layer switchable,
 * plus overlays, alignment tests and the asset browser (in the side panel).
 */
export class ArenaLabScene extends Phaser.Scene {
  private arenaRegistry!: ArenaRegistry;
  private arena!: ArenaRenderer;
  private panel!: ArenaLabPanel;
  private configId = arenaChoice.id;
  private camY = 0;
  private auto = false;
  private autoDir = 1;
  private guides: Phaser.GameObjects.Graphics | null = null;
  private guidesOn = false;
  private gridOn = false;
  private collisionOn = false;
  private wearLevel = 0;
  private glassDamage = false;
  private debrisOn = false;
  private poolsOn = false;
  private scoreboard: Phaser.GameObjects.GameObject[] = [];
  private keys!: Record<'up' | 'down' | 'pageUp' | 'pageDown' | 'w' | 's', Phaser.Input.Keyboard.Key>;

  constructor() {
    super(SCENES.arenaLab);
  }

  create(): void {
    setTitleArtVisible(false);
    tuningPanel().hide();
    this.arenaRegistry = this.cache.json.get(REGISTRY_KEY) as ArenaRegistry;
    this.configId = arenaChoice.id;
    this.auto = false;
    this.guidesOn = false;
    this.gridOn = false;
    this.collisionOn = false;
    this.wearLevel = 0;
    this.glassDamage = false;

    const banner = this.add.graphics().setScrollFactor(0).setDepth(9000);
    banner.fillStyle(UI.navy, 0.85);
    banner.fillRect(0, 0, GAME_WIDTH, 12);
    addText(this, 4, 3, 'Arena asset lab - developer only', UI.gold).setScrollFactor(0).setDepth(9001);
    addText(this, GAME_WIDTH - 4, 3, 'Esc: menu', UI.ice).setOrigin(1, 0).setScrollFactor(0).setDepth(9001);

    this.panel = new ArenaLabPanel(
      this.arenaRegistry,
      {
        setConfig: (id) => this.rebuild(id),
        setLayer: (id, on) => this.arena.setLayerVisible(id, on),
        setStandIns: (on) => this.arena.setStandIns(on),
        setGrid: (on) => {
          this.gridOn = on;
          this.arena.setGridVisible(on);
        },
        setCollision: (on) => {
          this.collisionOn = on;
          this.arena.setCollisionVisible(on);
        },
        setAutoScroll: (on) => (this.auto = on),
        goTo: (where) => this.goTo(where),
        setGuides: (on) => {
          this.guidesOn = on;
          this.drawGuides();
        },
        setLogo: (choice) => {
          const supplied = arenaConfig(this.configId).centerLogo ?? arenaConfig('standard').centerLogo;
          if (choice === 'none') this.arena.setCenterLogo(null);
          else if (choice === 'test') this.arena.setCenterLogo('test', supplied?.scale);
          else if (supplied) this.arena.setCenterLogo(supplied.asset, supplied.scale);
        },
        setWear: (level) => {
          this.wearLevel = level;
          this.arena.previewWear(level);
        },
        setGlassDamage: (on) => {
          this.glassDamage = on;
          this.applyGlassDamage();
        },
        setGoalState: (state) => {
          this.arena.setGoalState('north', state);
          this.arena.setGoalState('south', state);
        },
        setBenchMood: (mood) => this.arena.setBenchMood(mood),
        setDoorsOpen: (open) => this.arena.setDoorsOpen(open),
        setCrowdPose: (pose) => this.arena.setCrowdPose(pose),
        crowdReact: (kind) => void this.arena.crowdReact(kind),
        runResurfacer: () => this.arena.runResurfacer(),
        setDebris: (on) => {
          this.debrisOn = on;
          this.arena.setDebrisTest(on);
        },
        setLightPools: (on) => {
          this.poolsOn = on;
          this.arena.setLightPoolsTest(on ? 0.5 : 0);
        },
        setScoreboard: (state) => this.showScoreboard(state),
        openLockerRoom: () => this.scene.start(SCENES.lockerRoom),
        flashLamps: () => {
          this.arena.flashLamp('north');
          this.arena.flashLamp('south');
        },
        useInGame: (id) => {
          arenaChoice.id = id;
        },
        exit: () => this.scene.start(SCENES.title),
      },
      this.configId,
    );

    const kb = this.input.keyboard;
    if (!kb) throw new Error('Keyboard input unavailable');
    this.keys = kb.addKeys({ up: 'UP', down: 'DOWN', pageUp: 'PAGE_UP', pageDown: 'PAGE_DOWN', w: 'W', s: 'S' }) as typeof this.keys;
    kb.on('keydown-ESC', () => this.scene.start(SCENES.title));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.camY += dy * 0.5;
    });

    this.build();
    this.camY = projectY(RINK.centerY, tuning.cameraTilt);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.removeAllListeners();
      this.input.removeAllListeners();
      this.panel.destroy();
      this.arena.destroy();
      this.guides?.destroy();
      this.guides = null;
    });
  }

  private build(): void {
    this.arena = new ArenaRenderer(this, this.arenaRegistry, arenaConfig(this.configId), RINK, tuning.cameraTilt);
    this.cameras.main.setBounds(0, 0, RINK.worldWidth, this.arena.worldHeight);
    this.arena.setGridVisible(this.gridOn);
    this.arena.setCollisionVisible(this.collisionOn);
    if (this.wearLevel > 0) this.arena.previewWear(this.wearLevel);
    this.applyGlassDamage();
    if (this.debrisOn) this.arena.setDebrisTest(true);
    if (this.poolsOn) this.arena.setLightPoolsTest(0.5);

    this.panel.setConfigNote(this.configId);
    this.panel.setLayers(
      ARENA_LAYERS.map((l) => ({ id: l.id as ArenaLayerId, ...this.arena.layerContents(l.id) })),
      this.arena.config.standIns,
      this.arena.missing,
    );
    const lookup = (id: string) => assetById(this.arenaRegistry, id);
    const mirrored = this.arenaRegistry.issues.some((i) => i.message === 'North and south creases are exact vertical mirrors');
    this.panel.setAlignment(goalAlignment(RINK, tuning.cameraTilt, this.arena.layout, lookup), mirrored);
    this.panel.setBenchReport(this.arena.config.benchArea ? benchReport(RINK, this.arena.layout) : null);
    this.panel.setStadiumReport(this.arena.config.stadium ? this.arena.layout.stadium : null, this.arena.config.crowdDensity);
    this.panel.setGoalFit(goalFit(RINK, tuning.cameraTilt, this.arena.config, lookup));
    this.drawGuides();
  }

  /**
   * Scoreboard test: one supplied state, pinned to the screen, with sample numbers in the
   * manifest's fields. The numbers are test values, not a score: the Lab has no match.
   */
  private showScoreboard(state: string | null): void {
    for (const o of this.scoreboard) o.destroy();
    this.scoreboard = [];
    const art = this.arena.config.equipment?.scoreboard;
    if (!state || !art) return;
    const texture = this.arena.textureFor(`${art.frames}_${state}`);
    if (!texture) return;
    const x = GAME_WIDTH / 2 - 64;
    const y = 22;
    this.scoreboard.push(this.add.image(x, y, ...texture).setOrigin(0, 0).setScrollFactor(0).setDepth(9002));
    const sample: Record<keyof typeof art.fields, string> = { homeScore: '3', awayScore: '2', clock: '12:34', period: '2' };
    for (const key of Object.keys(art.fields) as (keyof typeof art.fields)[]) {
      const [fx, fy, fw, fh] = art.fields[key];
      this.scoreboard.push(
        addText(this, x + fx + Math.round(fw / 2), y + fy + Math.floor((fh - 7) / 2), sample[key], UI.gold)
          .setOrigin(0.5, 0)
          .setScrollFactor(0)
          .setDepth(9003),
      );
    }
    this.scoreboard.push(addText(this, GAME_WIDTH / 2, y + 66, 'Sample numbers - scoreboard test', UI.ice).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9003));
  }

  /** A fixed pattern of damaged panes, so every damage texture can be checked in place. */
  private applyGlassDamage(): void {
    const states = ['cracked', 'shattered', 'missing'] as const;
    this.arena.glassPanelIds().forEach((id, i) => {
      const damaged = this.glassDamage && i % 3 === 1;
      this.arena.setGlassState(id, damaged ? (states[Math.floor(i / 3) % states.length] as (typeof states)[number]) : 'intact');
    });
  }

  private rebuild(id: string): void {
    this.arena.destroy();
    this.configId = id;
    this.build();
  }

  private goTo(where: 'north' | 'centre' | 'south'): void {
    const tilt = tuning.cameraTilt;
    const y = where === 'north' ? goalLineY(RINK, 'top') : where === 'south' ? goalLineY(RINK, 'bottom') : RINK.centerY;
    this.camY = projectY(y, tilt) + (where === 'north' ? 40 : where === 'south' ? -40 : 0);
    this.auto = false;
  }

  /** Centre line of the rink and both goal lines, to judge alignment by eye. */
  private drawGuides(): void {
    this.guides?.destroy();
    this.guides = null;
    if (!this.guidesOn) return;
    const tilt = tuning.cameraTilt;
    const g = this.add.graphics().setDepth(8002);
    g.lineStyle(1, 0xff2fd0, 0.9);
    g.lineBetween(RINK.centerX + 0.5, 0, RINK.centerX + 0.5, this.arena.worldHeight);
    for (const end of ['top', 'bottom'] as const) {
      const y = Math.round(projectY(goalLineY(RINK, end), tilt)) + 0.5;
      g.lineBetween(RINK.left, y, RINK.right, y);
      g.lineStyle(1, 0x00e5ff, 0.9);
      g.lineBetween(RINK.centerX - RINK.netHalfWidth + 0.5, y - 24, RINK.centerX - RINK.netHalfWidth + 0.5, y + 24);
      g.lineBetween(RINK.centerX + RINK.netHalfWidth + 0.5, y - 24, RINK.centerX + RINK.netHalfWidth + 0.5, y + 24);
      g.lineStyle(1, 0xff2fd0, 0.9);
    }
    const cy = Math.round(projectY(RINK.centerY, tilt)) + 0.5;
    g.lineBetween(RINK.left, cy, RINK.right, cy);
    this.guides = g;
  }

  update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const k = this.keys;
    const manual = (k.down.isDown || k.s.isDown || k.pageDown.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown || k.pageUp.isDown ? 1 : 0);
    const min = GAME_HEIGHT / 2;
    const max = this.arena.worldHeight - GAME_HEIGHT / 2;
    if (manual !== 0) {
      this.auto = false;
      this.camY += manual * SCROLL_SPEED * dt * (k.pageDown.isDown || k.pageUp.isDown ? 3 : 1);
    } else if (this.auto) {
      this.camY += this.autoDir * AUTO_SPEED * dt;
      if (this.camY >= max) this.autoDir = -1;
      if (this.camY <= min) this.autoDir = 1;
    }
    this.camY = clamp(this.camY, min, max);
    this.cameras.main.setScroll(0, Math.round(this.camY - GAME_HEIGHT / 2));
  }
}
