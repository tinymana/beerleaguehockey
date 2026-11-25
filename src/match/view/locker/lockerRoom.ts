/**
 * Locker room fit test: where the batch 15 art goes when it is assembled into one room.
 * Pure layout data, no Phaser. This is a developer check that the pieces fit together
 * and animate; it is not the locker room location of the lifestyle game, which is not
 * designed in detail or authorized yet.
 */
import { Rng, hashString } from '../../../core/rng';

export type LockerTeam = 'blue' | 'red';
export type LockerMode = 'dressing' | 'beer' | 'win' | 'loss' | 'talk';

export const LOCKER_MODES: readonly { id: LockerMode; label: string }[] = [
  { id: 'dressing', label: 'Getting dressed' },
  { id: 'beer', label: 'Beers' },
  { id: 'win', label: 'After a win' },
  { id: 'loss', label: 'After a loss' },
  { id: 'talk', label: 'Team talk' },
];

/** One supplied animation: frames are `${batch}/${team}_${action}_${frame}` with two-digit frames. */
export interface LockerSequence {
  batch: string;
  action: string;
  durations: readonly number[];
  /** Feet position inside the 32x32 frame. */
  anchor: readonly [number, number];
}

const seq = (batch: string, action: string, durations: readonly number[], anchor: readonly [number, number]): LockerSequence => ({ batch, action, durations, anchor });
const DRESS = [160, 160, 160, 160];
const BEER = [250, 180, 650, 180, 250];
const CHEER = [100, 120, 240, 180, 100];
const GLUM = [120, 140, 240, 140, 120];
const LEAD = [180, 160, 240, 180];

export const LOCKER_SEQUENCES = {
  tie_skates: seq('15.04', 'tie_skates', DRESS, [16, 29]),
  put_on_jersey: seq('15.04', 'put_on_jersey', DRESS, [16, 29]),
  adjust_gloves: seq('15.04', 'adjust_gloves', DRESS, [16, 29]),
  fit_helmet: seq('15.04', 'fit_helmet', DRESS, [16, 29]),
  adjust_pads: seq('15.04', 'adjust_pads', DRESS, [16, 29]),
  ready: seq('15.04', 'ready', DRESS, [16, 29]),
  standing_beer: seq('15.05', 'standing_beer', BEER, [16, 30]),
  seated_beer: seq('15.05', 'seated_beer', BEER, [16, 30]),
  fist_pump: seq('15.06', 'fist_pump', CHEER, [16, 30]),
  arms_raised: seq('15.06', 'arms_raised', CHEER, [16, 30]),
  high_five: seq('15.06', 'high_five', CHEER, [16, 30]),
  victory_pose: seq('15.06', 'victory_pose', CHEER, [16, 30]),
  head_shake: seq('15.07', 'head_shake', GLUM, [16, 29]),
  slump: seq('15.07', 'slump', GLUM, [16, 29]),
  hands_on_head: seq('15.07', 'hands_on_head', GLUM, [16, 29]),
  angry_gesture: seq('15.07', 'angry_gesture', GLUM, [16, 29]),
  coach_talk: seq('15.08', 'coach_talk', LEAD, [16, 30]),
  coach_point: seq('15.08', 'coach_point', LEAD, [16, 30]),
  captain_talk: seq('15.08', 'captain_talk', LEAD, [16, 30]),
  captain_point: seq('15.08', 'captain_point', LEAD, [16, 30]),
} as const;

export type LockerAction = keyof typeof LOCKER_SEQUENCES;

export function sequenceFrameId(sequence: LockerSequence, team: LockerTeam, frame: number): string {
  return `${sequence.batch}/${team}_${sequence.action}_${String(frame).padStart(2, '0')}`;
}

/** A still piece of the room. `x`,`y` is its top-left on screen. */
export interface LockerPiece {
  asset: string;
  x: number;
  y: number;
  /** Draw order: floor, then walls, then everything else by where it stands. */
  depth: number;
  flipX?: boolean;
}

export type ActorRole = 'bench' | 'floor' | 'coach' | 'captain';

/** Someone in the room. `x`,`y` is where their feet are. */
export interface LockerActor {
  role: ActorRole;
  x: number;
  y: number;
  /** What this person does in each mode, in turn. The first frame of the first action is their idle pose. */
  actions: Record<LockerMode, readonly LockerAction[]>;
  /** Milliseconds before their first action, so the room does not move as one. */
  delay: number;
}

export interface LockerRoomLayout {
  room: { x: number; y: number; width: number; height: number };
  pieces: LockerPiece[];
  actors: LockerActor[];
  cabinet: { x: number; y: number; slots: readonly (readonly [number, number])[] };
  /** Pieces the room needs that the batch does not contain. */
  missing: string[];
}

const TILE_W = 16;
const TILE_H = 32;
/** From the 15.10 manifest: top-left of each trophy slot inside the 64x64 cabinet. */
export const CABINET_SLOTS: readonly (readonly [number, number])[] = [[12, 8], [36, 8], [12, 23], [36, 23], [12, 38], [36, 38]];
export const SAMPLE_TROPHIES = ['cup_gold', 'cup_silver', 'cup_bronze', 'star_award', 'medallion_award', 'column_award'].map((n) => `15.10/${n}`);

const DEPTH = { floor: 0, mat: 1, wall: 2, standing: 10 };

/** Assemble the room for a 480x320 screen. Deterministic: the same team always gets the same room. */
export function layoutLockerRoom(team: LockerTeam, width = 480, height = 320): LockerRoomLayout {
  const room = { x: 0, y: 16, width, height: height - 32 };
  const pieces: LockerPiece[] = [];
  const rng = new Rng(hashString('locker-room-fit-test'));
  const left = room.x + TILE_W;
  const right = room.x + room.width - TILE_W;
  const top = room.y + TILE_H;
  const bottom = room.y + room.height - TILE_H;
  const doorX = right - 4 * TILE_W;
  const standing = (asset: string, anchorX: number, anchorY: number, ax: number, ay: number, flipX = false): void => {
    pieces.push({ asset, x: anchorX - ax, y: anchorY - ay, depth: DEPTH.standing + anchorY, flipX });
  };

  // Floor: clean, with a few worn and wet tiles, one drain, and a threshold inside the door.
  const drain = { col: Math.floor((right - left) / TILE_W / 2), row: Math.floor((bottom - top) / TILE_H / 2) };
  for (let y = top, row = 0; y < bottom; y += TILE_H, row++) {
    for (let x = left, col = 0; x < right; x += TILE_W, col++) {
      const roll = rng.next();
      let tile = roll < 0.12 ? 'floor_worn' : roll < 0.16 ? 'floor_wet' : 'floor_clean';
      if (col === drain.col && row === drain.row) tile = 'floor_drain';
      if (x === doorX && row === 0) tile = 'threshold';
      pieces.push({ asset: `15.01/${tile}`, x, y, depth: DEPTH.floor });
    }
  }
  // A rubber runner from the door side across the room, for skate blades.
  const matY = top + 3 * TILE_H;
  for (let x = left + 2 * TILE_W; x < right - 2 * TILE_W; x += TILE_W) {
    const end = x === left + 2 * TILE_W || x + TILE_W >= right - 2 * TILE_W;
    pieces.push({ asset: `15.01/${end ? 'rubber_mat_edge' : 'rubber_mat'}`, x, y: matY, depth: DEPTH.mat, flipX: end && x !== left + 2 * TILE_W });
  }

  // Walls. There is no south-east corner in the batch: the south-west one is mirrored (mirroring is allowed; redrawing is not).
  for (let x = left; x < right; x += TILE_W) {
    pieces.push({ asset: `15.01/${x === doorX ? 'doorway' : 'wall_north'}`, x, y: room.y, depth: DEPTH.wall });
    pieces.push({ asset: '15.01/wall_south', x, y: bottom, depth: DEPTH.wall });
  }
  for (let y = top; y < bottom; y += TILE_H) {
    pieces.push({ asset: '15.01/wall_west', x: room.x, y, depth: DEPTH.wall });
    pieces.push({ asset: '15.01/wall_east', x: right, y, depth: DEPTH.wall });
  }
  pieces.push({ asset: '15.01/wall_corner_nw', x: room.x, y: room.y, depth: DEPTH.wall });
  pieces.push({ asset: '15.01/wall_corner_ne', x: right, y: room.y, depth: DEPTH.wall });
  pieces.push({ asset: '15.01/wall_corner_sw', x: room.x, y: bottom, depth: DEPTH.wall });
  pieces.push({ asset: '15.01/wall_corner_sw', x: right, y: bottom, depth: DEPTH.wall, flipX: true });

  // Lockers along the north wall, up to the door, in the team's colour, cycling through their three states.
  const lockerY = top + 30;
  const states = ['closed', 'jersey', 'open'];
  let n = 0;
  for (let x = left + 24; x + 16 <= doorX - 8; x += 32) standing(`15.02/${team}_${states[n++ % states.length]}`, x, lockerY, 16, 30);

  // Benches in front of the lockers.
  const benchY = lockerY + 34;
  const benchXs = [72, 136, 200, 264, 328].map((x) => left + x - 16);
  for (const x of benchXs) standing(`15.03/bench_${team}`, x, benchY, 16, 27);

  // Gear lying about.
  const gear: [string, number, number][] = [
    ['gear_bag', left + 24, benchY + 8],
    ['helmet', benchXs[1] ?? 0, benchY + 18],
    ['gloves', (benchXs[2] ?? 0) + 30, benchY + 20],
    ['skates', (benchXs[3] ?? 0) + 34, benchY + 16],
    ['stick_rack', right - 22, top + 64],
    ['towels', right - 70, benchY + 14],
    ['bottles', left + 196, bottom - 6],
    ['equipment_crate', left + 250, bottom - 4],
    ['loose_sticks', left + 290, bottom - 8],
  ];
  for (const [name, x, y] of gear) standing(`15.03/${name}`, x, y, 16, 27);

  // Whiteboard and trophy cabinet against the south side.
  const boardX = left + 64;
  const boardY = bottom - 2;
  standing('15.09/whiteboard_offensive', boardX, boardY, 32, 45);
  const cabinetAnchor = { x: right - 56, y: bottom - 2 };
  standing('15.10/cabinet_empty', cabinetAnchor.x, cabinetAnchor.y, 32, 63);

  // People.
  const delay = (): number => Math.round(rng.range(0, 900));
  const actors: LockerActor[] = [];
  const cheers: LockerAction[] = ['fist_pump', 'arms_raised', 'high_five', 'victory_pose'];
  const glum: LockerAction[] = ['head_shake', 'slump', 'hands_on_head', 'angry_gesture'];
  const dress: LockerAction[] = ['put_on_jersey', 'adjust_gloves', 'fit_helmet', 'adjust_pads'];
  benchXs.forEach((x, i) => {
    if (i % 2 === 1) return; // leave some bench free
    // Feet just in front of the bench, so the sitter draws over it.
    actors.push({ role: 'bench', x, y: benchY + 3, delay: delay(), actions: { dressing: ['tie_skates'], beer: ['seated_beer'], win: [cheers[i % 4] ?? 'fist_pump'], loss: [glum[(i + 1) % 4] ?? 'slump'], talk: ['ready'] } });
  });
  [96, 168, 232, 300, 368].forEach((offset, i) => {
    const order = <T>(list: readonly T[]): T[] => list.map((_, k) => list[(k + i) % list.length] as T);
    actors.push({ role: 'floor', x: left + offset, y: matY + 44 + (i % 2) * 14, delay: delay(), actions: { dressing: i === 4 ? ['ready'] : order(dress), beer: ['standing_beer'], win: order(cheers), loss: order(glum), talk: ['ready'] } });
  });
  const lead = (role: 'coach' | 'captain', x: number, y: number): void => {
    const talk: LockerAction[] = role === 'coach' ? ['coach_talk', 'coach_point'] : ['captain_talk', 'captain_point'];
    const idle: LockerAction[] = [talk[0] ?? 'coach_talk'];
    actors.push({ role, x, y, delay: delay(), actions: { dressing: idle, beer: idle, win: idle, loss: idle, talk } });
  };
  lead('coach', boardX + 46, boardY - 4);
  lead('captain', boardX + 74, boardY - 2);

  return {
    room,
    pieces,
    actors,
    cabinet: { x: cabinetAnchor.x - 32, y: cabinetAnchor.y - 63, slots: CABINET_SLOTS },
    missing: ['15.01 south-east wall corner (the south-west corner is mirrored)'],
  };
}

/** Which of an actor's poses never animate: in a mode where they only hold their idle pose. */
export function actorIsIdle(actor: LockerActor, mode: LockerMode): boolean {
  if (actor.role === 'coach' || actor.role === 'captain') return mode !== 'talk';
  return mode === 'talk';
}
