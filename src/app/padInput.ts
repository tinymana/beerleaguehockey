/** Small gamepad helper shared by scenes. Standard-mapping pads. */
import type Phaser from 'phaser';

export interface PadState {
  x: number;
  y: number;
  /** A / Cross, or X / Square. */
  action: boolean;
  /** B / Circle. */
  back: boolean;
  /** Select / Back / Share. */
  select: boolean;
  /** Start / Options. */
  start: boolean;
  /** Y / Triangle. */
  alt: boolean;
}

const EMPTY: PadState = { x: 0, y: 0, action: false, back: false, select: false, start: false, alt: false };

export function readPad(scene: Phaser.Scene): PadState {
  const pad = scene.input.gamepad?.gamepads.find((p) => p && p.connected);
  if (!pad) return EMPTY;
  const pressed = (i: number): boolean => pad.buttons[i]?.pressed ?? false;
  let x = pad.axes[0]?.getValue() ?? 0;
  let y = pad.axes[1]?.getValue() ?? 0;
  if (pressed(14)) x = -1;
  if (pressed(15)) x = 1;
  if (pressed(12)) y = -1;
  if (pressed(13)) y = 1;
  return {
    x,
    y,
    action: pressed(0) || pressed(2),
    back: pressed(1),
    select: pressed(8),
    start: pressed(9),
    alt: pressed(3),
  };
}

/** Turns a held boolean into a single press. */
export class Edge {
  private held = false;
  pressed(now: boolean): boolean {
    const fired = now && !this.held;
    this.held = now;
    return fired;
  }
}
