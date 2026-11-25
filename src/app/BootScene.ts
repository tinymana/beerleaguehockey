import Phaser from 'phaser';
import { SKATER_SHEET } from '../match/view/skaterSprite';
import { SCENES } from './config';
import { registerPixelFont } from './pixelFont';

/** Builds the font, then hands over to the title screen. Gameplay textures are built by the scene that needs them. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    this.load.spritesheet(SKATER_SHEET.key, SKATER_SHEET.url, { frameWidth: SKATER_SHEET.cell, frameHeight: SKATER_SHEET.cell });
  }

  create(): void {
    registerPixelFont(this);
    this.scene.start(SCENES.title);
  }
}
