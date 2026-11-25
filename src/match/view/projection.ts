/**
 * Angled overhead ("three-quarter") projection, in the style of 16-bit
 * console hockey. The simulation stays a flat top-down sheet in real units;
 * only drawing changes:
 *
 *   - distances up and down the ice are foreshortened by `tilt`
 *   - anything with height (boards, nets, players) rises up the screen
 *
 * tilt = 1 is a camera looking straight down. Lower values flatten the angle.
 */

/** Screen y of a point on the ice. */
export function projectY(simY: number, tilt: number): number {
  return simY * tilt;
}

/** Screen pixels a vertical height (in sim units, 4 per foot) rises by. */
export function riseOf(height: number, tilt: number): number {
  const t = Math.min(1, Math.max(0, tilt));
  return height * Math.sqrt(1 - t * t);
}

/** Heights of things that stand up off the ice, in sim units (4 per foot). */
export const HEIGHTS = Object.freeze({
  boards: 17,
  netFront: 16,
  netBack: 10,
});

export function worldScreenHeight(worldHeight: number, tilt: number): number {
  return Math.ceil(worldHeight * tilt);
}
