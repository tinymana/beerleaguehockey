/**
 * Layout of the skater sprite sheet (`public/assets/skater_base.png`), built
 * from the creative director's supplied art by `scripts/art/process_skater.py`.
 *
 * 10 poses across, 5 facing directions down. West-side directions reuse the
 * east-side rows mirrored. Pure data and maths: no Phaser here.
 */
export const SKATER_SHEET = Object.freeze({
  key: 'skater-base',
  url: 'assets/skater_base.png',
  cell: 48,
  columns: 10,
  /** Where the skates touch the ice inside a cell. */
  feet: { x: 24, y: 40 },
});

export type SkaterPose = 'skate' | 'glide' | 'brake' | 'windup' | 'shoot' | 'pass' | 'check';

const POSE_COLUMN: Record<Exclude<SkaterPose, 'skate'>, number> = {
  glide: 4,
  brake: 5,
  windup: 6,
  shoot: 7,
  pass: 8,
  check: 9,
};

/** Sheet row and mirroring for each of eight directions (0 = east, clockwise on screen). */
const DIRECTION_ROW: ReadonlyArray<{ row: number; flip: boolean }> = [
  { row: 2, flip: false }, // E
  { row: 1, flip: false }, // SE
  { row: 0, flip: false }, // S
  { row: 1, flip: true }, // SW
  { row: 2, flip: true }, // W
  { row: 3, flip: true }, // NW
  { row: 4, flip: false }, // N
  { row: 3, flip: false }, // NE
];

export interface SkaterFrame {
  frame: number;
  flip: boolean;
}

/** Sheet frame for a facing direction and pose. `stride` picks the step of the skating cycle. */
export function skaterFrame(direction: number, pose: SkaterPose, stride = 0): SkaterFrame {
  const dir = DIRECTION_ROW[((direction % 8) + 8) % 8] as { row: number; flip: boolean };
  const column = pose === 'skate' ? ((Math.floor(stride) % 4) + 4) % 4 : POSE_COLUMN[pose];
  return { frame: dir.row * SKATER_SHEET.columns + column, flip: dir.flip };
}

export interface PoseInput {
  speed: number;
  /** Is a direction held? */
  pushing: boolean;
  /** Is the held direction against the direction of travel? */
  againstTravel: boolean;
  charging: boolean;
  /** Seconds since the last shot was released. */
  sinceShot: number;
}

/** Chooses the pose to show from what the skater is doing. */
export function choosePose(s: PoseInput): SkaterPose {
  if (s.sinceShot < 0.22) return 'shoot';
  if (s.charging) return 'windup';
  if (s.pushing && s.againstTravel && s.speed > 35) return 'brake';
  if (s.pushing) return 'skate';
  return 'glide';
}
