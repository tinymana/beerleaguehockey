/**
 * TEMPORARY STAND-INS: code-drawn boards, stands, nets, puck and shadow.
 *
 * The ice surface, its markings and the west boards now come from supplied
 * arena art (see ./arena). These stand-ins fill only the slots whose art has
 * not arrived yet, so the game stays playable, and are switched off in the
 * "supplied art only" arena configuration.
 *
 * Everything here is a stand-in, drawn pixel by pixel on the gameplay grid,
 * so the creative director can judge camera angle, readability and palette.
 * It is replaced by approved artwork; nothing here is a final asset.
 *
 * All of it is drawn through the angled overhead projection in
 * `projection.ts`: the ice is foreshortened, and boards, nets and players
 * stand up off it.
 */
import Phaser from 'phaser';
import { Rng } from '../../core/rng';
import { goalLineY, netBox } from '../sim/rink';
import type { RinkGeometry } from '../sim/rink';
import { HEIGHTS, projectY, riseOf, worldScreenHeight } from './projection';

export const TEX = {
  surround: 'tmp-surround',
  rink: 'tmp-rink',
  rinkFront: 'tmp-rink-front',
  netTop: 'tmp-net-top',
  netBottom: 'tmp-net-bottom',
  puck: 'tmp-puck',
  shadow: 'tmp-shadow',
} as const;

const PAL = {
  outside: '#0b1030',
  crowd: ['#141b44', '#1b2450', '#232d63', '#2a1f4d', '#33203f'],
  boardBase: '#060a1e',
  boardCap: '#1c3fa0',
  boardFace: '#cfd8ee',
  boardFaceShade: '#b4c0de',
  boardOutside: '#7d8bb8',
  kickplate: '#f2c230',
  ice: '#eaf2fb',
  iceDark: '#d7e5f6',
  iceLight: '#f8fcff',
  red: '#d8263c',
  redDark: '#9c1626',
  blue: '#2b5fd9',
  crease: '#a9d4fb',
  netMesh: '#e6ebf5',
  netMeshDark: '#aab4cc',
  outline: '#141a3a',
  jersey: '#f4f6fb',
  jerseyShade: '#cfd7ea',
  trim: '#d8263c',
  pants: '#2038a8',
  helmet: '#2b5fd9',
  helmetShine: '#7fa0ff',
  glove: '#2038a8',
  skin: '#f2c9a0',
  skate: '#14141c',
  stick: '#c9944a',
  blade: '#20202a',
  puck: '#14141c',
  puckShine: '#4a4a5c',
};

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeCanvas(scene: Phaser.Scene, key: string, w: number, h: number): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) throw new Error(`Could not create texture ${key}`);
  return tex;
}

/** Raw pixel buffer with hard-edged plotting. */
class Buffer {
  readonly image: ImageData;
  constructor(
    ctx: CanvasRenderingContext2D,
    readonly w: number,
    readonly h: number,
  ) {
    this.image = ctx.createImageData(w, h);
  }
  set(x: number, y: number, color: Rgb): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.image.data[i] = color[0];
    this.image.data[i + 1] = color[1];
    this.image.data[i + 2] = color[2];
    this.image.data[i + 3] = 255;
  }
}

/** Signed distance from a point on the ice to the boards (negative = on the ice). */
function boardDistance(x: number, y: number, rink: RinkGeometry): number {
  const hw = (rink.right - rink.left) / 2;
  const hh = (rink.bottom - rink.top) / 2;
  const qx = Math.abs(x - rink.centerX) - (hw - rink.cornerRadius);
  const qy = Math.abs(y - rink.centerY) - (hh - rink.cornerRadius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rink.cornerRadius;
}

const BOARD_THICKNESS = 3;

/**
 * Stand-in surroundings, in three layers: the dark stands outside the rink,
 * the boards behind the players, and the near boards in front of them.
 * The ice itself is left transparent: supplied arena tiles draw it.
 */
export interface StandInOptions {
  /** Sides whose straight boards are covered by supplied art: no stand-in is drawn there. */
  suppliedSides?: Partial<Record<'north' | 'south' | 'west' | 'east', boolean>>;
  /** Draw no stand-in boards at all (corners included). */
  noBoards?: boolean;
}

function drawStandInBoards(scene: Phaser.Scene, rink: RinkGeometry, tilt: number, options: StandInOptions): void {
  const w = rink.worldWidth;
  const h = worldScreenHeight(rink.worldHeight, tilt);
  const surroundTex = makeCanvas(scene, TEX.surround, w, h);
  const backTex = makeCanvas(scene, TEX.rink, w, h);
  const frontTex = makeCanvas(scene, TEX.rinkFront, w, h);
  const surround = new Buffer(surroundTex.getContext(), w, h);
  const back = new Buffer(backTex.getContext(), w, h);
  const front = new Buffer(frontTex.getContext(), w, h);
  const rng = new Rng(1994).fork('rink-art');

  const C = {
    outside: rgb(PAL.outside),
    crowd: PAL.crowd.map(rgb),
    boardBase: rgb(PAL.boardBase),
    boardCap: rgb(PAL.boardCap),
    boardFace: rgb(PAL.boardFace),
    boardFaceShade: rgb(PAL.boardFaceShade),
    boardOutside: rgb(PAL.boardOutside),
    kickplate: rgb(PAL.kickplate),
  };

  // Pass 1: the ground outside the ice. Remember where the boards stand.
  const footprint: Array<{ x: number; sy: number; d: number; ny: number }> = [];
  const crowdCols = Math.ceil(w / 4);
  const crowd: Array<Rgb | null> = [];
  for (let i = 0; i < crowdCols * Math.ceil(h / 4); i++) crowd.push(rng.next() < 0.55 ? rng.pick(C.crowd) : null);

  for (let sy = 0; sy < h; sy++) {
    const y = (sy + 0.5) / tilt;
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const d = boardDistance(px, y, rink);
      if (d <= 0) continue;
      if (d <= BOARD_THICKNESS) {
        if (options.noBoards) continue;
        // Straight stretches with supplied boards need no stand-in; corners still do.
        const inStraightX = px >= rink.left + rink.cornerRadius && px <= rink.right - rink.cornerRadius;
        const inStraightY = y >= rink.top + rink.cornerRadius && y <= rink.bottom - rink.cornerRadius;
        const side = inStraightX ? (y < rink.centerY ? 'north' : 'south') : inStraightY ? (px < rink.centerX ? 'west' : 'east') : null;
        if (side && options.suppliedSides?.[side]) continue;
        back.set(x, sy, C.boardBase);
        const ny = boardDistance(px, y + 0.5, rink) - boardDistance(px, y - 0.5, rink);
        footprint.push({ x, sy, d, ny });
      } else {
        const tile = x % 4 < 3 && sy % 4 < 3 ? crowd[Math.floor(sy / 4) * crowdCols + Math.floor(x / 4)] : null;
        surround.set(x, sy, tile ?? C.outside);
      }
    }
  }

  // Pass 2: stand the boards up. Painted far-to-near so nearer walls cover farther ones.
  const wall = Math.round(riseOf(HEIGHTS.boards, tilt));
  for (const p of footprint) {
    const near = p.ny > 0.35;
    const far = p.ny < -0.35;
    const layer = near ? front : back;
    for (let r = 0; r <= wall; r++) {
      const sy = p.sy - r;
      let color: Rgb;
      if (r >= wall - 1 && wall > 1) color = C.boardCap;
      else if (near) color = C.boardOutside;
      else if (far && r <= 1) color = C.kickplate;
      else color = far ? C.boardFace : C.boardFaceShade;
      layer.set(p.x, sy, color);
    }
    if (wall <= 1) layer.set(p.x, p.sy, p.d <= 1 ? C.kickplate : C.boardCap);
  }

  surroundTex.getContext().putImageData(surround.image, 0, 0);
  backTex.getContext().putImageData(back.image, 0, 0);
  frontTex.getContext().putImageData(front.image, 0, 0);
  surroundTex.refresh();
  backTex.refresh();
  frontTex.refresh();
}

export interface NetLayout {
  /** Texture size. */
  width: number;
  height: number;
  /** Row inside the texture that sits on the goal line. */
  goalLineRow: number;
}

/** Sizes of the standing net sprites for a given tilt. */
export function netLayout(rink: RinkGeometry, end: 'top' | 'bottom', tilt: number): NetLayout {
  const depth = Math.round(rink.netDepth * tilt);
  const front = Math.round(riseOf(rink.netFrontHeight, tilt));
  const backRise = Math.round(riseOf(rink.netBackHeight, tilt));
  const width = rink.netHalfWidth * 2;
  if (end === 'top') {
    // Mouth faces the camera. Rows: back bar, top netting, crossbar, open mouth, goal line.
    const above = Math.max(front, depth + backRise);
    return { width, height: above + 1, goalLineRow: above };
  }
  // Mouth faces away. Rows: crossbar, top netting, back netting, back base.
  return { width, height: front + depth + 1, goalLineRow: front };
}

function drawNets(scene: Phaser.Scene, rink: RinkGeometry, tilt: number): void {
  const depth = Math.round(rink.netDepth * tilt);
  const frontRise = Math.round(riseOf(rink.netFrontHeight, tilt));
  const backRise = Math.round(riseOf(rink.netBackHeight, tilt));
  const red = rgb(PAL.red);
  const redDark = rgb(PAL.redDark);
  const mesh = rgb(PAL.netMesh);
  const meshDark = rgb(PAL.netMeshDark);

  for (const end of ['top', 'bottom'] as const) {
    const layout = netLayout(rink, end, tilt);
    const tex = makeCanvas(scene, end === 'top' ? TEX.netTop : TEX.netBottom, layout.width, layout.height);
    const buf = new Buffer(tex.getContext(), layout.width, layout.height);
    const line = layout.goalLineRow;
    const last = layout.width - 1;
    // Netting is a see-through checker so a puck in the net still shows.
    const netting = (row0: number, row1: number, color: Rgb): void => {
      for (let y = row0; y <= row1; y++) {
        for (let x = rink.postWidth; x <= last - rink.postWidth; x++) if ((x + y) % 2 === 0) buf.set(x, y, color);
      }
    };
    const bar = (y: number, color: Rgb): void => {
      for (let x = 0; x <= last; x++) buf.set(x, y, color);
    };
    const posts = (row0: number, row1: number, color: Rgb): void => {
      for (let y = row0; y <= row1; y++) {
        // Posts as wide as the collision geometry says, so the opening drawn is the opening that scores.
        for (let k = 0; k < rink.postWidth; k++) {
          buf.set(k, y, color);
          buf.set(last - k, y, color);
        }
      }
    };

    if (end === 'top') {
      const crossbar = line - frontRise;
      const backTop = line - depth - backRise;
      if (backTop < crossbar) {
        netting(backTop, crossbar, mesh);
        posts(backTop, crossbar, redDark);
        bar(backTop, redDark);
      }
      posts(crossbar, line, red);
      bar(crossbar, red);
    } else {
      const crossbar = line - frontRise;
      const backTop = line + depth - backRise;
      const base = line + depth;
      netting(crossbar, backTop, mesh);
      netting(backTop, base, meshDark);
      posts(crossbar, base, redDark);
      bar(backTop, redDark);
      bar(base, redDark);
      bar(crossbar, red);
    }
    tex.getContext().putImageData(buf.image, 0, 0);
    tex.refresh();
  }
}

function drawPuckAndShadow(scene: Phaser.Scene, tilt: number): void {
  const ph = tilt < 0.9 ? 4 : 5;
  const puck = makeCanvas(scene, TEX.puck, 6, ph);
  const pctx = puck.getContext();
  pctx.fillStyle = PAL.puck;
  pctx.fillRect(1, 0, 4, ph);
  pctx.fillRect(0, 1, 6, ph - 2);
  pctx.fillStyle = PAL.puckShine;
  pctx.fillRect(1, 1, 3, 1);
  puck.refresh();

  const sw = 18;
  const sh = Math.max(4, Math.round(10 * tilt));
  const shadow = makeCanvas(scene, TEX.shadow, sw, sh);
  const sctx = shadow.getContext();
  sctx.fillStyle = '#1b2a5a';
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (((x + 0.5 - sw / 2) / (sw / 2)) ** 2 + ((y + 0.5 - sh / 2) / (sh / 2)) ** 2 <= 1) sctx.fillRect(x, y, 1, 1);
    }
  }
  shadow.refresh();
}

let builtTilt: number | null = null;

/** The tilt the current textures were drawn for, or null before the first build. */
export function texturesTilt(): number | null {
  return builtTilt;
}

/** Build every temporary gameplay texture for a camera tilt. Safe to call again. */
export function buildTemporaryTextures(scene: Phaser.Scene, rink: RinkGeometry, tilt: number, options: StandInOptions = {}): void {
  drawStandInBoards(scene, rink, tilt, options);
  drawNets(scene, rink, tilt);
  drawPuckAndShadow(scene, tilt);
  builtTilt = tilt;
}

/** Screen-space box of a net's goal mouth, for placing its sprite. */
export function netScreenAnchor(rink: RinkGeometry, end: 'top' | 'bottom', tilt: number): { x: number; y: number } {
  const box = netBox(rink, end);
  return { x: box.left, y: Math.round(projectY(goalLineY(rink, end), tilt)) };
}
