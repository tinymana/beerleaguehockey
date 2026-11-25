import Phaser from 'phaser';
import { SCENES } from './config';
import { registerPixelFont } from './pixelFont';

/** Builds the font, then hands over to the title screen. Gameplay textures are built by the scene that needs them. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    registerPixelFont(this);
    this.scene.start(SCENES.title);
  }
}
