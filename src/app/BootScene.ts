import Phaser from 'phaser';
import { ArenaRenderer } from '../match/view/arena/ArenaRenderer';
import { REGISTRY_KEY, REGISTRY_URL } from '../match/view/arena/registry';
import type { ArenaRegistry } from '../match/view/arena/registry';
import { GOALIE_SHEET } from '../match/view/goalieSprite';
import { REFEREE_FRAMES } from '../match/sim/referee';
import { SKATER_SHEET } from '../match/view/skaterSprite';
import { SCENES } from './config';
import { registerPixelFont } from './pixelFont';

/** Loads supplied art through the arena registry, builds the font, then opens the title screen. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    this.load.spritesheet(SKATER_SHEET.key, SKATER_SHEET.url, { frameWidth: SKATER_SHEET.cell, frameHeight: SKATER_SHEET.cell });
    this.load.spritesheet(GOALIE_SHEET.key, GOALIE_SHEET.url, { frameWidth: GOALIE_SHEET.cell, frameHeight: GOALIE_SHEET.cell });
    // Broadcast graphics: three of the supplied batch 01 overlays reduced to game size (temporary, until the re-issue).
    for (const name of ['goal_splash', 'tag_power_play', 'tag_faceoff']) this.load.image(`ui/${name}`, `assets/ui/broadcast/${name}.png`);
    // Portraits for the goal and penalty cards: the preset faces at half size.
    this.load.spritesheet('face32', 'assets/character/face32.png', { frameWidth: 32, frameHeight: 32 });
    // The referee, drawn at the 32 px scale: one file a frame, shown unchanged.
    for (const frame of REFEREE_FRAMES) this.load.image(`ref/${frame}`, `assets/referee/32/${frame}.png`);
    // The registry lists every arena asset; queue them as soon as it arrives.
    this.load.json(REGISTRY_KEY, REGISTRY_URL);
    this.load.once(`filecomplete-json-${REGISTRY_KEY}`, () => {
      ArenaRenderer.queueAssets(this.load, this.cache.json.get(REGISTRY_KEY) as ArenaRegistry);
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error(`[assets] failed to load ${file.key} (${String(file.url)})`);
    });
  }

  create(): void {
    registerPixelFont(this);
    // A dedicated development route: open the page with #arena-lab to land in the Arena Asset Lab.
    const hash = window.location.hash;
    this.scene.start(hash === '#arena-lab' ? SCENES.arenaLab : hash === '#creator' ? SCENES.creator : hash === '#locker-room' ? SCENES.lockerRoom : SCENES.title);
  }
}
