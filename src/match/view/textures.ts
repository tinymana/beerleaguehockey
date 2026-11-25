/**
 * TEMPORARY ART: code-drawn rink and skater for the style test.
 *
 * Everything here is a stand-in, drawn pixel by pixel on the gameplay grid,
 * so the creative director can judge readability and palette. It is replaced
 * by approved artwork; nothing here is a final asset.
 */
import Phaser from 'phaser';
import { Rng } from '../../core/rng';
import { goalLineY, netBox } from '../sim/rink';
import type { RinkGeometry } from '../sim/rink';

export const TEX = {
  rink: 'tmp-rink',
  skater: 'tmp-skater',
  puck: 'tmp-puck',
  shadow: 'tmp-shadow',
} as const;

export const SKATER_CELL = 36;
/** Sprite scale relative to the base drawing; keeps the blade at FEEL.stickReach. */
const K = 1.3;
export const SKATER_FRAMES = 2;

const PAL = {
  outside: '#0b1030',
  crowd: ['#141b44', '#1b2450', '#232d63', '#2a1f4d', '#33203f'],
  boardShadow: '#060a1e',
  boardCap: '#1c3fa0',
  boardFace: '#e8edf7',
  kickplate: '#f2c230',
  ice: '#eaf2fb',
  iceDark: '#d7e5f6',
  iceLight: '#f8fcff',
  red: '#d8263c',
  blue: '#2b5fd9',
  crease: '#a9d4fb',
  netMesh: '#c9d2e0',
  netMeshDark: '#9aa6ba',
  outline: '#141a3a',
  jersey: '#f4f6fb',
  jerseyShade: '#cfd7ea',
  trim: '#d8263c',
  pants: '#2038a8',
  helmet: '#2a4fd0',
  helmetShine: '#7fa0ff',
  glove: '#2a4fd0',
  skate: '#1a1a22',
  stick: '#c9944a',
  blade: '#20202a',
  puck: '#14141c',
  puckShine: '#4a4a5c',
};

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Crisp scanline rounded rectangle (no anti-aliasing). */
function fillRoundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  for (let row = 0; row < h; row++) {
    let inset = 0;
    const fromTop = row + 0.5;
    const fromBottom = h - row - 0.5;
    const d = Math.min(fromTop, fromBottom);
    if (d < r) inset = r - Math.sqrt(Math.max(0, r * r - (r - d) * (r - d)));
    const x0 = Math.round(x + inset);
    const x1 = Math.round(x + w - inset);
    ctx.fillRect(x0, Math.round(y + row), x1 - x0, 1);
  }
}

function disc(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** One-pixel ring; `half` limits it to the upper or lower semicircle. */
function ring(ctx: Ctx, cx: number, cy: number, r: number, color: string, half?: 'upper' | 'lower'): void {
  ctx.fillStyle = color;
  const steps = Math.ceil(r * 8);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const sy = Math.sin(a);
    if (half === 'upper' && sy > 0) continue;
    if (half === 'lower' && sy < 0) continue;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r - 0.5), Math.round(cy + sy * r - 0.5), 1, 1);
  }
}

function makeCanvas(scene: Phaser.Scene, key: string, w: number, h: number): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) throw new Error(`Could not create texture ${key}`);
  return tex;
}

function drawRink(scene: Phaser.Scene, rink: RinkGeometry): void {
  const tex = makeCanvas(scene, TEX.rink, rink.worldWidth, rink.worldHeight);
  const ctx = tex.getContext();
  const rng = new Rng(1994).fork('rink-art');
  const { left, top, right, bottom, cornerRadius: cr, centerX: cx, centerY: cy } = rink;
  const w = right - left;
  const h = bottom - top;

  // Dark stands: a dim mosaic so the ice reads as the brightest thing on screen.
  rect(ctx, 0, 0, rink.worldWidth, rink.worldHeight, PAL.outside);
  for (let y = 0; y < rink.worldHeight; y += 4) {
    for (let x = 0; x < rink.worldWidth; x += 4) {
      if (rng.next() < 0.55) rect(ctx, x, y, 3, 3, rng.pick(PAL.crowd));
    }
  }

  // Boards, outside in.
  fillRoundRect(ctx, left - 8, top - 8, w + 16, h + 16, cr + 8, PAL.boardShadow);
  fillRoundRect(ctx, left - 6, top - 6, w + 12, h + 12, cr + 6, PAL.boardCap);
  fillRoundRect(ctx, left - 4, top - 4, w + 8, h + 8, cr + 4, PAL.boardFace);
  fillRoundRect(ctx, left - 1, top - 1, w + 2, h + 2, cr + 1, PAL.kickplate);
  fillRoundRect(ctx, left, top, w, h, cr, PAL.ice);

  // Everything below is clipped to the ice surface.
  const onIce = (x: number, y: number): boolean => {
    if (x < left || x >= right || y < top || y >= bottom) return false;
    const cornerX = x < left + cr ? left + cr : x >= right - cr ? right - cr : null;
    const cornerY = y < top + cr ? top + cr : y >= bottom - cr ? bottom - cr : null;
    if (cornerX === null || cornerY === null) return true;
    return (x + 0.5 - cornerX) ** 2 + (y + 0.5 - cornerY) ** 2 <= cr * cr;
  };
  const icePx = (x: number, y: number, color: string): void => {
    if (onIce(x, y)) rect(ctx, x, y, 1, 1, color);
  };
  const hLine = (y: number, thickness: number, color: string): void => {
    for (let t = 0; t < thickness; t++) for (let x = left; x < right; x++) icePx(x, y + t, color);
  };

  // Ice texture: speckle and a few skate scratches.
  for (let i = 0; i < 5200; i++) {
    icePx(left + rng.int(w), top + rng.int(h), rng.next() < 0.75 ? PAL.iceDark : PAL.iceLight);
  }
  for (let i = 0; i < 90; i++) {
    let x = left + rng.int(w);
    let y = top + rng.int(h);
    const dx = rng.range(-1, 1);
    const dy = rng.range(-1, 1);
    const len = 6 + rng.int(18);
    for (let s = 0; s < len; s++) {
      icePx(Math.round(x), Math.round(y), PAL.iceDark);
      x += dx;
      y += dy;
    }
  }

  // Lines.
  const topGoal = goalLineY(rink, 'top');
  const bottomGoal = goalLineY(rink, 'bottom');
  hLine(topGoal, 1, PAL.red);
  hLine(bottomGoal, 1, PAL.red);
  hLine(cy - rink.blueLineOffset - 1, 3, PAL.blue);
  hLine(cy + rink.blueLineOffset - 1, 3, PAL.blue);
  hLine(cy - 1, 3, PAL.red);

  // Centre circle and dot.
  ring(ctx, cx, cy, 60, PAL.blue);
  disc(ctx, cx, cy, 2.5, PAL.blue);

  // End-zone faceoff circles and neutral-zone dots.
  for (const gy of [topGoal + 80, bottomGoal - 80]) {
    for (const fx of [cx - 88, cx + 88]) {
      ring(ctx, fx, gy, 60, PAL.red);
      disc(ctx, fx, gy, 2.5, PAL.red);
    }
  }
  for (const ny of [cy - rink.blueLineOffset + 20, cy + rink.blueLineOffset - 20]) {
    for (const fx of [cx - 88, cx + 88]) disc(ctx, fx, ny, 2.5, PAL.red);
  }

  // Creases and nets.
  for (const end of ['top', 'bottom'] as const) {
    const line = goalLineY(rink, end);
    const dir = end === 'top' ? 1 : -1;
    for (let dy = 1; dy <= 24; dy++) {
      const halfWidth = Math.floor(Math.sqrt(24 * 24 - dy * dy));
      const y = end === 'top' ? line + dy : line - dy;
      for (let x = cx - halfWidth; x < cx + halfWidth; x++) icePx(x, y, PAL.crease);
    }
    ring(ctx, cx, line + dir * 0.5, 24, PAL.red, end === 'top' ? 'lower' : 'upper');

    const box = netBox(rink, end);
    const bw = box.right - box.left;
    const bh = box.bottom - box.top;
    rect(ctx, box.left, box.top, bw, bh, PAL.netMesh);
    for (let y = box.top; y < box.bottom; y++) {
      for (let x = box.left; x < box.right; x++) {
        if ((x + y) % 2 === 0) rect(ctx, x, y, 1, 1, PAL.netMeshDark);
      }
    }
    // Red frame on the back and sides; the mouth on the goal line stays open.
    rect(ctx, box.left - 1, box.top - (end === 'top' ? 1 : 0), 1, bh + 1, PAL.red);
    rect(ctx, box.right, box.top - (end === 'top' ? 1 : 0), 1, bh + 1, PAL.red);
    rect(ctx, box.left - 1, end === 'top' ? box.top - 1 : box.bottom, bw + 2, 1, PAL.red);
  }

  tex.refresh();
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
  disc(cx: number, cy: number, r: number, color: string): void {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, color);
      }
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) * 2 + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.set(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, color);
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
  blit(ctx: Ctx, ox: number, oy: number): void {
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
 * Skater seen from above, facing one of eight directions, right-handed shot.
 * White jersey with red hem trim, blue helmet, gloves and pants: the title
 * art's palette, readable against white ice thanks to the dark outline.
 */
function drawSkaterFrame(direction: number, frame: number): Sprite {
  const s = new Sprite(SKATER_CELL);
  const c = SKATER_CELL / 2;
  const a = direction * (Math.PI / 4);
  const fx = Math.cos(a);
  const fy = Math.sin(a);
  const rx = -fy;
  const ry = fx;
  const at = (forward: number, side: number): [number, number] => [
    c + (fx * forward + rx * side) * K,
    c + (fy * forward + ry * side) * K,
  ];

  // Stick: from the hands to the blade in front.
  const [hx, hy] = at(2.5, 3);
  const [bx, by] = at(10, 0.5);
  s.line(hx, hy, bx, by, PAL.stick);
  const [b2x, b2y] = at(10, -1.5);
  s.line(bx, by, b2x, b2y, PAL.blade);

  // Skates alternate with the stride.
  const stride = frame === 0 ? 2 : -2;
  const [lsx, lsy] = at(stride - 1, -2.5);
  const [rsx, rsy] = at(-stride - 1, 2.5);
  s.disc(lsx, lsy, 1.3 * K, PAL.skate);
  s.disc(rsx, rsy, 1.3 * K, PAL.skate);

  // Pants, then jersey across the shoulders.
  const [px, py] = at(-1.2, 0);
  s.disc(px, py, 3.3 * K, PAL.pants);
  for (let t = -4; t <= 4; t += 0.25) {
    const [jx, jy] = at(0.6, t);
    s.disc(jx, jy, 2.7 * K, Math.abs(t) > 3 ? PAL.jerseyShade : PAL.jersey);
  }
  for (let t = -4.5; t <= 4.5; t += 0.25) {
    const [tx, ty] = at(-2.2, t);
    s.set(tx, ty, PAL.trim);
  }

  // Gloves and helmet.
  const [g1x, g1y] = at(2.2, -4.6);
  const [g2x, g2y] = at(2.2, 4.6);
  s.disc(g1x, g1y, 1.4 * K, PAL.glove);
  s.disc(g2x, g2y, 1.4 * K, PAL.glove);
  const [hdx, hdy] = at(1.4, 0);
  s.disc(hdx, hdy, 2.5 * K, PAL.helmet);
  const [shx, shy] = at(0.8, -0.9);
  s.set(shx, shy, PAL.helmetShine);

  s.outline(PAL.outline);
  return s;
}

function drawSkater(scene: Phaser.Scene): void {
  const tex = makeCanvas(scene, TEX.skater, SKATER_CELL * 8, SKATER_CELL * SKATER_FRAMES);
  const ctx = tex.getContext();
  for (let d = 0; d < 8; d++) {
    for (let f = 0; f < SKATER_FRAMES; f++) {
      drawSkaterFrame(d, f).blit(ctx, d * SKATER_CELL, f * SKATER_CELL);
      tex.add(d + f * 8, 0, d * SKATER_CELL, f * SKATER_CELL, SKATER_CELL, SKATER_CELL);
    }
  }
  tex.refresh();
}

function drawPuckAndShadow(scene: Phaser.Scene): void {
  const puck = makeCanvas(scene, TEX.puck, 6, 5);
  const pctx = puck.getContext();
  rect(pctx, 1, 0, 4, 1, PAL.outline);
  rect(pctx, 0, 1, 6, 3, PAL.puck);
  rect(pctx, 1, 4, 4, 1, PAL.puck);
  rect(pctx, 1, 1, 3, 1, PAL.puckShine);
  puck.refresh();

  const shadow = makeCanvas(scene, TEX.shadow, 16, 8);
  const sctx = shadow.getContext();
  sctx.fillStyle = '#1b2a5a';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 16; x++) {
      if (((x + 0.5 - 8) / 8) ** 2 + ((y + 0.5 - 4) / 4) ** 2 <= 1) sctx.fillRect(x, y, 1, 1);
    }
  }
  shadow.refresh();
}

/** Build every temporary gameplay texture. Safe to call more than once. */
export function buildTemporaryTextures(scene: Phaser.Scene, rink: RinkGeometry): void {
  drawRink(scene, rink);
  drawSkater(scene);
  drawPuckAndShadow(scene);
}
