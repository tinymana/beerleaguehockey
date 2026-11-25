/**
 * Cosmetic ice wear. Tracks how chewed-up each ice tile is and picks which
 * scratch overlay tile (if any) to show there. Wear builds where skaters go,
 * builds faster in busy areas, and clears on resurfacing.
 *
 * View-only: it never feeds back into puck or skating physics.
 */
import { hashString } from '../../../core/rng';

/** Scratch atlas layout: four variants each of light, medium, heavy, severe. */
const VARIANTS = 4;
const TIER_AT = [0.18, 0.42, 0.66, 0.88];

function cellNoise(col: number, row: number, salt: number): number {
  let h = (Math.imul(col + 1, 0x9e3779b1) ^ Math.imul(row + 1, 0x85ebca6b) ^ salt) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

export class IceWear {
  readonly values: Float32Array;
  private readonly salt: number;

  constructor(
    readonly cols: number,
    readonly rows: number,
    seed = 'ice-wear',
  ) {
    this.values = new Float32Array(cols * rows);
    this.salt = hashString(seed);
  }

  private index(col: number, row: number): number {
    return row * this.cols + col;
  }

  /** A skater (or anything) passed over this tile. Neighbours pick up a little too. */
  addTraffic(col: number, row: number, amount: number): void {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        const share = dc === 0 && dr === 0 ? 1 : 0.35;
        const i = this.index(c, r);
        this.values[i] = Math.min(1, (this.values[i] ?? 0) + amount * share);
      }
    }
  }

  /** Set wear everywhere from a traffic prior (0..1 per tile) times an overall level. For previews. */
  preview(level: number, prior: (col: number, row: number) => number): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.values[this.index(c, r)] = Math.min(1, Math.max(0, level * prior(c, r)));
      }
    }
  }

  /** The Zamboni. `fraction` 1 clears the sheet; less leaves some wear behind. */
  resurface(fraction = 1): void {
    const keep = 1 - Math.min(1, Math.max(0, fraction));
    for (let i = 0; i < this.values.length; i++) this.values[i] = (this.values[i] ?? 0) * keep;
  }

  wearAt(col: number, row: number): number {
    return this.values[this.index(col, row)] ?? 0;
  }

  /**
   * Scratch tile to show at a cell, or -1 for clean ice. Each cell has its own
   * threshold and variant, so wear creeps in unevenly and never repeats in a grid.
   */
  tileAt(col: number, row: number, intensity = 1): number {
    const v = this.wearAt(col, row) * intensity;
    if (v <= 0) return -1;
    const threshold = TIER_AT[0] as number;
    if (v < threshold * (0.6 + 0.8 * cellNoise(col, row, this.salt))) return -1;
    let tier = 0;
    for (let t = 1; t < TIER_AT.length; t++) if (v >= (TIER_AT[t] as number)) tier = t;
    const variant = Math.floor(cellNoise(col, row, this.salt ^ 0x5bd1e995) * VARIANTS);
    return tier * VARIANTS + variant;
  }
}

/**
 * Where a hockey game chews up the ice: in front of both nets, around the
 * faceoff dots, and down the middle lane. Returns 0..1 per tile.
 */
export function trafficPrior(
  cols: number,
  rows: number,
  hotspots: { col: number; row: number; radius: number; weight: number }[],
): (col: number, row: number) => number {
  return (col, row) => {
    const lane = 1 - Math.min(1, Math.abs(col - cols / 2) / (cols / 2));
    let v = 0.25 + 0.3 * lane;
    for (const h of hotspots) {
      const d = Math.hypot(col - h.col, row - h.row) / h.radius;
      v = Math.max(v, h.weight * Math.exp(-d * d));
    }
    return Math.min(1, v) * (row >= 0 && row < rows ? 1 : 0);
  };
}
