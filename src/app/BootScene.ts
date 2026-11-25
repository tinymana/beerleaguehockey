import Phaser from 'phaser';
import { RINK } from '../match/sim/rink';
import { buildTemporaryTextures } from '../match/view/textures';
import { SCENES } from './config';
import { registerPixelFont } from './pixelFont';

/** Builds code-drawn assets, then hands over to the title screen. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    registerPixelFont(this);
    buildTemporaryTextures(this, RINK);
    this.scene.start(SCENES.title);
  }
}
