/**
 * The page stage: a full-resolution key-art layer behind a transparent,
 * integer-scaled game canvas. Key art keeps its detail; gameplay pixels stay
 * perfectly square at any window size.
 */
import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { onTouchChange } from './touchControls';
import { gameArea } from './touchModel';

export function setTitleArtVisible(visible: boolean): void {
  const art = document.getElementById('title-art');
  if (art) art.style.visibility = visible ? 'visible' : 'hidden';
}

/** Largest whole-number zoom that fits the window (never below 1). */
export function integerZoom(windowWidth: number, windowHeight: number): number {
  return Math.max(1, Math.floor(Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT)));
}

/**
 * Rendering profiles (Decision 38). One game, two design spaces: the ice at 480x320 and every
 * off-ice screen at 960x540. A scene picks its profile when it starts; the on-ice engine is untouched.
 */
export const PROFILES = {
  ice: { width: GAME_WIDTH, height: GAME_HEIGHT },
  offIce: { width: 960, height: 540 },
} as const;
export type ProfileName = keyof typeof PROFILES;

/**
 * How a profile fits a window: the largest whole-number zoom, never below 1, so pixels stay square.
 * A window smaller than the design space cannot be served by whole numbers: `shrink` scales the
 * whole stage down to fit instead (1 when it is not needed). The rest of the window is letterbox.
 */
export function profileFit(profile: ProfileName, windowWidth: number, windowHeight: number): { zoom: number; shrink: number } {
  const { width, height } = PROFILES[profile];
  const ratio = Math.min(windowWidth / width, windowHeight / height);
  return { zoom: Math.max(1, Math.floor(ratio)), shrink: Math.min(1, ratio) };
}

let current: ProfileName = 'ice';
let refit: (() => void) | null = null;

export function currentProfile(): ProfileName {
  return current;
}

/** Switch design space. Safe to call when already there. */
export function setProfile(game: Phaser.Game, profile: ProfileName): void {
  if (current === profile) return;
  current = profile;
  const { width, height } = PROFILES[profile];
  game.scale.resize(width, height);
  refit?.();
}

export function fitStage(game: Phaser.Game): void {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const apply = (): void => {
    const { width, height } = PROFILES[current];
    // On a touch screen held upright, a game on the ice leaves the bottom of the screen to the controls.
    const playing = document.body.classList.contains('touch-playing');
    const area = gameArea(window.innerWidth, window.innerHeight, playing);
    document.body.classList.toggle('portrait', window.innerHeight > window.innerWidth);
    const fit = profileFit(current, area.width, area.height);
    const zoom = fit.zoom;
    // A phone needs the size more than it needs whole-number pixels: while a game is on the ice on a touch screen the
    // stage is stretched to fill the room it has. Everywhere else pixels stay square.
    const fill = Math.min(area.width / (width * zoom), area.height / (height * zoom));
    const shrink = playing ? fill : fit.shrink;
    stage.style.width = `${width * zoom}px`;
    stage.style.height = `${height * zoom}px`;
    stage.style.flexShrink = '0';
    stage.style.transform = shrink !== 1 ? `scale(${shrink})` : '';
    game.scale.setZoom(zoom);
    game.scale.refresh();
  };
  refit = apply;
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  onTouchChange(apply);
}
