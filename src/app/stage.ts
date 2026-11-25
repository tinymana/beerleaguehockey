/**
 * The page stage: a full-resolution key-art layer behind a transparent,
 * integer-scaled game canvas. Key art keeps its detail; gameplay pixels stay
 * perfectly square at any window size.
 */
import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

export function setTitleArtVisible(visible: boolean): void {
  const art = document.getElementById('title-art');
  if (art) art.style.visibility = visible ? 'visible' : 'hidden';
}

/** Largest whole-number zoom that fits the window (never below 1). */
export function integerZoom(windowWidth: number, windowHeight: number): number {
  return Math.max(1, Math.floor(Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT)));
}

export function fitStage(game: Phaser.Game): void {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const apply = (): void => {
    const zoom = integerZoom(window.innerWidth, window.innerHeight);
    stage.style.width = `${GAME_WIDTH * zoom}px`;
    stage.style.height = `${GAME_HEIGHT * zoom}px`;
    game.scale.setZoom(zoom);
  };
  apply();
  window.addEventListener('resize', apply);
}
