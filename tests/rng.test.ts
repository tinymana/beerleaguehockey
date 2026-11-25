import { describe, expect, it } from 'vitest';
import { Rng, hashString } from '../src/core/rng';

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const same = Array.from({ length: 20 }, () => a.next() === b.next()).filter(Boolean).length;
    expect(same).toBeLessThan(3);
  });

  it('stays in [0, 1) and is roughly uniform', () => {
    const rng = new Rng(7);
    let sum = 0;
    for (let i = 0; i < 20000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 20000).toBeGreaterThan(0.48);
    expect(sum / 20000).toBeLessThan(0.52);
  });

  it('forks independent named streams without advancing the parent', () => {
    const parent = new Rng(99);
    const before = parent.getState();
    const injuries = parent.fork('injuries');
    const recruiting = parent.fork('recruiting');
    expect(parent.getState()).toBe(before);
    expect(injuries.next()).not.toBe(recruiting.next());
    expect(new Rng(99).fork('injuries').next()).toBe(new Rng(99).fork('injuries').next());
  });

  it('restores from saved state', () => {
    const rng = new Rng(5);
    rng.next();
    const saved = rng.getState();
    const expected = [rng.next(), rng.next()];
    const restored = new Rng(0);
    restored.setState(saved);
    expect([restored.next(), restored.next()]).toEqual(expected);
  });

  it('hashes strings stably', () => {
    expect(hashString('injuries')).toBe(hashString('injuries'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});
