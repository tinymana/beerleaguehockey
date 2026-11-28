import Phaser from 'phaser';
import { ArenaLabScene } from './app/ArenaLabScene';
import { BootScene } from './app/BootScene';
import { CreatorScene } from './app/CreatorScene';
import { TitleScene } from './app/TitleScene';
import { GAME_HEIGHT, GAME_WIDTH } from './app/config';
import { LockerRoomTestScene } from './app/LockerRoomTestScene';
import { fitStage } from './app/stage';
import { installTouchControls } from './app/touchControls';
import { SeasonScene } from './app/SeasonScene';
import { SkatingScene } from './app/SkatingScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  transparent: true,
  pixelArt: true,
  roundPixels: true,
  banner: false,
  input: { gamepad: true },
  scale: { mode: Phaser.Scale.NONE, zoom: 1 },
  scene: [BootScene, TitleScene, SkatingScene, ArenaLabScene, CreatorScene, LockerRoomTestScene, SeasonScene],
});

installTouchControls();
fitStage(game);

// Debug handle for automated browser checks.
(window as unknown as { __blh: unknown }).__blh = { game };
