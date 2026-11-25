/**
 * Seeded random number generation.
 *
 * Rule: no Math.random() anywhere in match logic or the dynasty. Every random
 * roll comes from an Rng, and each subsystem forks its own named stream so
 * that adding a roll in one system never changes outcomes in another.
 */

/** FNV-1a 32-bit hash, used to derive stream seeds from names. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform float in [0, 1). mulberry32. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list');
    return items[this.int(items.length)] as T;
  }

  /** Independent child stream. Does not advance this stream. */
  fork(name: string): Rng {
    return new Rng((this.state ^ hashString(name)) >>> 0);
  }

  /** Serializable state, for saves. */
  getState(): number {
    return this.state;
  }

  setState(state: number): void {
    this.state = state >>> 0;
  }
}
