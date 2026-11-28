/** Input for one simulation step. `moveX`/`moveY` form a unit vector or zero. */
export interface SimInput {
  moveX: number;
  moveY: number;
  shoot: boolean;
  /** Pass to a teammate; without the puck, take control of the teammate nearest it. 5-on-5 only. */
  pass?: boolean;
  /** The contact button, in a full game: tap to stick check, hold to bump, hold too long and it is a check. */
  check?: boolean;
  /**
   * Shot aim help for this input. Left out, it is on. The game switches it off when the direction comes from
   * a stick (gamepad or touch): the help is for keyboards (Decision 98).
   */
  aimHelp?: boolean;
}

export const NO_INPUT: Readonly<SimInput> = Object.freeze({ moveX: 0, moveY: 0, shoot: false });

const DIAGONAL = Math.SQRT1_2;

/**
 * Snap any stick or key vector to one of eight directions (or none).
 * Arcade hockey skating is eight-way: analog sticks are quantized on purpose.
 */
export function quantize8(x: number, y: number, deadzone = 0.35): { x: number; y: number } {
  if (Math.hypot(x, y) < deadzone) return { x: 0, y: 0 };
  const index = ((Math.round(Math.atan2(y, x) / (Math.PI / 4)) % 8) + 8) % 8;
  switch (index) {
    case 0:
      return { x: 1, y: 0 };
    case 1:
      return { x: DIAGONAL, y: DIAGONAL };
    case 2:
      return { x: 0, y: 1 };
    case 3:
      return { x: -DIAGONAL, y: DIAGONAL };
    case 4:
      return { x: -1, y: 0 };
    case 5:
      return { x: -DIAGONAL, y: -DIAGONAL };
    case 6:
      return { x: 0, y: -1 };
    default:
      return { x: DIAGONAL, y: -DIAGONAL };
  }
}
