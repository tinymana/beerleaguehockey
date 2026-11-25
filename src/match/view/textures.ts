/**
 * TEMPORARY ART: code-drawn rink, nets and skater for the style test.
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
import { FEEL } from '../sim/tuning';
import { HEIGHTS, projectY, riseOf, worldScreenHeight } from './projection';

export const TEX = {
  rink: 'tmp-rink',
  rinkFront: 'tmp-rink-front',
  netTop: 'tmp-net-top',
  netBottom: 'tmp-net-bottom',
  skater: 'tmp-skater',
  puck: 'tmp-puck',
  shadow: 'tmp-shadow',
} as const;

export const SKATER_CELL = 48;
export const SKATER_FRAMES = 2;
/** Where the skates touch the ice inside a skater cell. */
export const SKATER_FEET = { x: 24, y: 34 };

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
 * Paints the rink in two layers: everything behind the players, and the near
 * boards, which stand between the camera and the ice and are drawn in front.
 */
function drawRink(scene: Phaser.Scene, rink: RinkGeometry, tilt: number): void {
  const w = rink.worldWidth;
  const h = worldScreenHeight(rink.worldHeight, tilt);
  const backTex = makeCanvas(scene, TEX.rink, w, h);
  const frontTex = makeCanvas(scene, TEX.rinkFront, w, h);
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
    ice: rgb(PAL.ice),
    iceDark: rgb(PAL.iceDark),
    iceLight: rgb(PAL.iceLight),
    red: rgb(PAL.red),
    blue: rgb(PAL.blue),
    crease: rgb(PAL.crease),
  };

  const { centerX: cx, centerY: cy } = rink;
  const topGoal = goalLineY(rink, 'top');
  const bottomGoal = goalLineY(rink, 'bottom');
  // Lines are specified by their thickness on screen, so they stay crisp at any tilt.
  const thin = 0.5 / tilt;
  const thick = 1.5 / tilt;
  const ringHalf = Math.max(0.75, 0.7 / tilt);
  const circles: Array<[number, number, Rgb]> = [[cx, cy, C.blue]];
  const dots: Array<[number, number, Rgb]> = [[cx, cy, C.blue]];
  for (const gy of [topGoal + 80, bottomGoal - 80]) {
    for (const fx of [cx - 88, cx + 88]) {
      circles.push([fx, gy, C.red]);
      dots.push([fx, gy, C.red]);
    }
  }
  for (const ny of [cy - rink.blueLineOffset + 20, cy + rink.blueLineOffset - 20]) {
    for (const fx of [cx - 88, cx + 88]) dots.push([fx, ny, C.red]);
  }

  const iceColor = (x: number, y: number): Rgb => {
    for (const [dx, dy, color] of dots) {
      if (Math.hypot(x - dx, y - dy) <= 2.6) return color;
    }
    if (Math.abs(y - cy) <= thick) return C.red;
    if (Math.abs(y - (cy - rink.blueLineOffset)) <= thick || Math.abs(y - (cy + rink.blueLineOffset)) <= thick) return C.blue;
    for (const [ox, oy, color] of circles) {
      if (Math.abs(Math.hypot(x - ox, y - oy) - 60) <= ringHalf) return color;
    }
    for (const line of [topGoal, bottomGoal]) {
      const inFront = line === topGoal ? y - line : line - y;
      const r = Math.hypot(x - cx, y - line);
      if (inFront > 0 && Math.abs(r - 24) <= ringHalf) return C.red;
      if (Math.abs(y - line) <= thin) return C.red;
      if (inFront > 0 && r < 24) return C.crease;
    }
    const roll = rng.next();
    return roll < 0.035 ? C.iceDark : roll < 0.045 ? C.iceLight : C.ice;
  };

  // Pass 1: the flat ground. Remember where the boards stand.
  const footprint: Array<{ x: number; sy: number; d: number; ny: number }> = [];
  const crowdCols = Math.ceil(w / 4);
  const crowd: Array<Rgb | null> = [];
  for (let i = 0; i < crowdCols * Math.ceil(h / 4); i++) crowd.push(rng.next() < 0.55 ? rng.pick(C.crowd) : null);

  for (let sy = 0; sy < h; sy++) {
    const y = (sy + 0.5) / tilt;
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const d = boardDistance(px, y, rink);
      if (d <= 0) {
        back.set(x, sy, iceColor(px, y));
      } else if (d <= BOARD_THICKNESS) {
        back.set(x, sy, C.boardBase);
        const ny = boardDistance(px, y + 0.5, rink) - boardDistance(px, y - 0.5, rink);
        footprint.push({ x, sy, d, ny });
      } else {
        const tile = x % 4 < 3 && sy % 4 < 3 ? crowd[Math.floor(sy / 4) * crowdCols + Math.floor(x / 4)] : null;
        back.set(x, sy, tile ?? C.outside);
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

  backTex.getContext().putImageData(back.image, 0, 0);
  frontTex.getContext().putImageData(front.image, 0, 0);
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
  const front = Math.round(riseOf(HEIGHTS.netFront, tilt));
  const backRise = Math.round(riseOf(HEIGHTS.netBack, tilt));
  const width = rink.netHalfWidth * 2 + 2;
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
  const frontRise = Math.round(riseOf(HEIGHTS.netFront, tilt));
  const backRise = Math.round(riseOf(HEIGHTS.netBack, tilt));
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
        for (let x = 1; x < last; x++) if ((x + y) % 2 === 0) buf.set(x, y, color);
      }
    };
    const bar = (y: number, color: Rgb): void => {
      for (let x = 0; x <= last; x++) buf.set(x, y, color);
    };
    const posts = (row0: number, row1: number, color: Rgb): void => {
      for (let y = row0; y <= row1; y++) {
        buf.set(0, y, color);
        buf.set(last, y, color);
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

/** Tiny pixel grid with an outline pass, used to build each skater frame. */
class Sprite {
  readonly cells: (string | null)[];
  constructor(readonly size: number) {
    this.cells = new Array<string | null>(size * size).fill(null);
  }
  set(x: number, y: number, color: string): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.size || py >= this.size) return;
    this.cells[py * this.size + px] = color;
  }
  box(x0: number, y0: number, x1: number, y1: number, color: string): void {
    for (let y = Math.round(Math.min(y0, y1)); y <= Math.round(Math.max(y0, y1)); y++) {
      for (let x = Math.round(Math.min(x0, x1)); x <= Math.round(Math.max(x0, x1)); x++) this.set(x, y, color);
    }
  }
  disc(cx: number, cy: number, r: number, color: string): void {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, color);
      }
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, color: string, thick = false): void {
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) * 2 + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.set(x, y, color);
      if (thick) this.set(x + 1, y, color);
    }
  }
  outline(color: string): void {
    const src = this.cells.slice();
    const at = (x: number, y: number): string | null =>
      x < 0 || y < 0 || x >= this.size || y >= this.size ? null : (src[y * this.size + x] ?? null);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (at(x, y) !== null) continue;
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.cells[y * this.size + x] = color;
      }
    }
  }
  blit(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const c = this.cells[y * this.size + x];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(ox + x, oy + y, 1, 1);
        }
      }
    }
  }
}

/**
 * Upright skater seen from the angled camera, facing one of eight directions.
 * Feet are at SKATER_FEET; the body rises up the screen from there.
 * White jersey, red hem, blue helmet, yoke, gloves and pants.
 */
function drawSkaterFrame(direction: number, frame: number, tilt: number): Sprite {
  const s = new Sprite(SKATER_CELL);
  const a = direction * (Math.PI / 4);
  const fx = Math.cos(a);
  const fy = Math.sin(a);
  const ox = SKATER_FEET.x;
  const oy = SKATER_FEET.y;
  // A point on or above the ice: `forward`/`side` along the ice, `up` off it.
  const at = (forward: number, side: number, up: number): [number, number] => [
    ox + fx * forward - fy * side,
    oy + (fy * forward + fx * side) * tilt - up,
  ];
  const away = fy < -0.3;
  const sideOn = Math.abs(fx) > 0.9;
  const stride = frame === 0 ? 2.5 : -2.5;
  const lean = 2;

  // Stick first, so the body covers the shaft where they overlap.
  const hands = at(4, 1.5, 9);
  const blade = at(FEEL.stickReach, 0, 0);
  const heel = at(FEEL.stickReach - 0.5, -3, 0);
  s.line(hands[0], hands[1], blade[0], blade[1], PAL.stick);
  s.line(blade[0], blade[1], heel[0], heel[1], PAL.blade);

  // Legs: skate, sock with trim, pants. The far leg is drawn first.
  const legs: Array<[number, number]> = [
    [stride, -2.5],
    [-stride, 2.5],
  ];
  legs.sort((l, r) => at(l[0], l[1], 0)[1] - at(r[0], r[1], 0)[1]);
  for (const [forward, side] of legs) {
    const foot = at(forward, side, 0);
    const toe = at(forward + 2, side, 0);
    const knee = at(forward * 0.5, side, 5);
    const hip = at(0, side * 0.8, 10);
    s.line(foot[0], foot[1], toe[0], toe[1], PAL.skate, true);
    s.line(foot[0], foot[1] - 1, knee[0], knee[1], PAL.jersey, true);
    s.set(foot[0], foot[1] - 3, PAL.trim);
    s.set(foot[0] + 1, foot[1] - 3, PAL.trim);
    s.line(knee[0], knee[1], hip[0], hip[1], PAL.pants, true);
  }

  // Torso, leaning into the stride. Narrower when seen side-on.
  const half = sideOn ? 3 : 4.5;
  const hipC = at(0, 0, 10);
  const chest = at(lean, 0, 19);
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const cxr = hipC[0] + (chest[0] - hipC[0]) * t;
    const cyr = hipC[1] + (chest[1] - hipC[1]) * t;
    const color = i === 0 ? PAL.trim : i >= 7 ? PAL.helmet : PAL.jersey;
    s.box(cxr - half, cyr, cxr + half, cyr, color);
    if (i > 0 && i < 7) s.set(cxr + (fx >= 0 ? -half : half), cyr, PAL.jerseyShade);
  }
  if (away && !sideOn) {
    // A blank number patch on the back.
    s.box(chest[0] - 1, chest[1] + 4, chest[0] + 1, chest[1] + 6, PAL.trim);
  }

  // Arms reach from the shoulders to the stick.
  for (const side of [-1, 1]) {
    const shoulder: [number, number] = [chest[0] + side * half, chest[1] + 2];
    s.line(shoulder[0], shoulder[1], hands[0] + side, hands[1], PAL.jerseyShade, true);
  }
  s.disc(hands[0], hands[1], 1.6, PAL.glove);

  // Head: helmet, with a face when not skating away from the camera.
  const head = at(lean + 1, 0, 23);
  s.disc(head[0], head[1], 3.2, PAL.helmet);
  s.set(head[0] - 1, head[1] - 2, PAL.helmetShine);
  if (!away) {
    const faceX = head[0] + fx * 1.6;
    s.box(faceX - 1, head[1] + 1, faceX + 1, head[1] + 2, PAL.skin);
  }

  s.outline(PAL.outline);
  return s;
}

function drawSkater(scene: Phaser.Scene, tilt: number): void {
  const tex = makeCanvas(scene, TEX.skater, SKATER_CELL * 8, SKATER_CELL * SKATER_FRAMES);
  const ctx = tex.getContext();
  for (let d = 0; d < 8; d++) {
    for (let f = 0; f < SKATER_FRAMES; f++) {
      drawSkaterFrame(d, f, tilt).blit(ctx, d * SKATER_CELL, f * SKATER_CELL);
      tex.add(d + f * 8, 0, d * SKATER_CELL, f * SKATER_CELL, SKATER_CELL, SKATER_CELL);
    }
  }
  tex.refresh();
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
export function buildTemporaryTextures(scene: Phaser.Scene, rink: RinkGeometry, tilt: number): void {
  drawRink(scene, rink, tilt);
  drawNets(scene, rink, tilt);
  drawSkater(scene, tilt);
  drawPuckAndShadow(scene, tilt);
  builtTilt = tilt;
}

/** Screen-space box of a net's goal mouth, for placing its sprite. */
export function netScreenAnchor(rink: RinkGeometry, end: 'top' | 'bottom', tilt: number): { x: number; y: number } {
  const box = netBox(rink, end);
  return { x: box.left - 1, y: Math.round(projectY(goalLineY(rink, end), tilt)) };
}
