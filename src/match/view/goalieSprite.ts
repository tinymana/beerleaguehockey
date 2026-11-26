/**
 * Layout of the goalie sprite sheet (`public/assets/goalie_base.png`), built from the creative director's
 * supplied art (art batch 01) by `scripts/art/process_goalie.py`. Pure data and maths: no Phaser here.
 *
 * 10 poses across, 2 rows: facing the camera (the far goalie) and from behind (the near goalie).
 */
export const GOALIE_SHEET = Object.freeze({
  key: 'goalie-base',
  url: 'assets/goalie_base.png',
  cell: 48,
  columns: 10,
  /** Where the skates touch the ice inside a cell. */
  feet: { x: 24, y: 40 },
});

export type GoaliePose = 'ready' | 'shuffle' | 'glove' | 'blocker' | 'pad' | 'cover';

export interface GoalieFrame {
  frame: number;
  flip: boolean;
}

/**
 * Sheet frame for a goalie. `facingCamera` is true for the far (top) goalie.
 * In the sheet the arm reaches to the viewer's right in column 5 and to the viewer's left in column 7 of the
 * back row; the far goalie's glove is on the viewer's right and the near goalie's on the viewer's left.
 */
export function goalieFrame(facingCamera: boolean, pose: GoaliePose, step = 0): GoalieFrame {
  const row = facingCamera ? 0 : 1;
  const at = (column: number, flip = false): GoalieFrame => ({ frame: row * GOALIE_SHEET.columns + column, flip });
  switch (pose) {
    case 'shuffle':
      return at(Math.floor(step) % 2);
    case 'glove':
      return facingCamera ? at(5) : at(7);
    case 'blocker':
      return facingCamera ? at(5, true) : at(5);
    case 'pad':
      return at(6);
    case 'cover':
      return at(8);
    default:
      return at(0);
  }
}
