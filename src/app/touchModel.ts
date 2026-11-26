/**
 * Touch controls: the pure parts. No DOM here, so they can be tested.
 * Layout and feel are starting values (creative director, Nov 26: touch controls for mobile, landscape and portrait).
 */

export const TOUCH = {
  /** How far the thumb travels from the centre of the stick for full tilt, in CSS px, and the dead zone as a share of that. */
  stickRadius: 44,
  deadZone: 0.28,
  /** Portrait: the share of the screen height kept for the controls under the game. */
  portraitControls: 0.44,
  /** Portrait controls are never shorter than this, in CSS px. */
  portraitMin: 210,
};

/** The stick's tilt from a thumb offset: each axis from -1 to 1, zero inside the dead zone. */
export function stickVector(dx: number, dy: number, radius = TOUCH.stickRadius, deadZone = TOUCH.deadZone): { x: number; y: number } {
  const len = Math.hypot(dx, dy);
  if (len < radius * deadZone) return { x: 0, y: 0 };
  const scale = Math.min(1, len / radius) / len;
  return { x: dx * scale, y: dy * scale };
}

/**
 * The room the game may use. On a touch screen held upright the controls sit under the game, so the game
 * gets the top of the screen; held sideways the controls lie over the letterbox at either side and the game keeps the lot.
 */
export function gameArea(width: number, height: number, touch: boolean): { width: number; height: number; portrait: boolean } {
  const portrait = touch && height > width;
  if (!portrait) return { width, height, portrait: false };
  const controls = Math.max(TOUCH.portraitMin, Math.round(height * TOUCH.portraitControls));
  return { width, height: Math.max(120, height - controls), portrait: true };
}
