/**
 * Vertical scrolling camera maths, kept free of Phaser so it can be tested.
 * The camera only scrolls up and down the rink; the full width is always shown.
 */
import { clamp } from '../../core/math';

/** The skater is always kept at least this far inside the top and bottom of the view. */
export const SKATER_MARGIN = 56;

export interface CameraSubject {
  skaterY: number;
  skaterVy: number;
  puckY: number;
  puckVy: number;
  hasPuck: boolean;
}

/** Where the centre of the view wants to be, before smoothing. */
export function cameraTargetY(
  subject: CameraSubject,
  lookahead: number,
  viewHeight: number,
  worldHeight: number,
): number {
  // With the puck, lead the skater. Without it, favour the puck so a shot
  // or a loose puck stays on screen.
  const puckWeight = subject.hasPuck ? 0 : 0.6;
  const focusY = subject.skaterY + (subject.puckY - subject.skaterY) * puckWeight;
  const focusVy = subject.skaterVy + (subject.puckVy - subject.skaterVy) * puckWeight;
  const lead = clamp(focusVy * lookahead, -viewHeight * 0.3, viewHeight * 0.3);
  // The controlled skater must never leave the screen, however far the puck goes.
  const reach = viewHeight / 2 - SKATER_MARGIN;
  const framed = clamp(focusY + lead, subject.skaterY - reach, subject.skaterY + reach);
  return clamp(framed, viewHeight / 2, worldHeight - viewHeight / 2);
}

/** Exponential smoothing toward the target; frame-rate independent. */
export function stepCamera(current: number, target: number, follow: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-follow * dt));
}
