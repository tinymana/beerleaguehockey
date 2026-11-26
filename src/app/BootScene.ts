import Phaser from 'phaser';
import { ArenaRenderer } from '../match/view/arena/ArenaRenderer';
import { REGISTRY_KEY, REGISTRY_URL } from '../match/view/arena/registry';
import type { ArenaRegistry } from '../match/view/arena/registry';
import { GOALIE_SHEET } from '../match/view/goalieSprite';
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
