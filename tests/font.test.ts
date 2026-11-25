import { describe, expect, it } from 'vitest';
import { integerZoom } from '../src/app/stage';

// pixelFont.ts imports Phaser, which needs a browser; check the glyph data from source instead.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(__dirname, '..', 'src', 'app', 'pixelFont.ts'), 'utf8');
const glyphs = [...source.matchAll(/^\s+(?:'(.)'|"(.)"|(\w)): '([.#/]+)',$/gm)].map((m) => ({
  ch: m[1] ?? m[2] ?? m[3],
  rows: (m[4] as string).split('/'),
}));

describe('pixel font data', () => {
  it('defines letters, digits and menu punctuation', () => {
    const have = new Set(glyphs.map((g) => g.ch));
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:!?-/+`') expect(have.has(ch), `glyph ${ch}`).toBe(true);
  });

  it('draws every glyph on a 5 by 7 grid', () => {
    expect(glyphs.length).toBeGreaterThan(50);
    for (const g of glyphs) {
      expect(g.rows, `glyph ${g.ch}`).toHaveLength(7);
      for (const row of g.rows) expect(row, `glyph ${g.ch}`).toHaveLength(5);
    }
  });

  it('has no duplicate glyph shapes among letters and digits', () => {
    const shapes = glyphs.filter((g) => /[A-Z0-9]/.test(g.ch ?? '')).map((g) => g.rows.join('/'));
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});

describe('integer scaling', () => {
  it('picks the largest whole zoom that fits and never goes below 1', () => {
    expect(integerZoom(1920, 1080)).toBe(3);
    expect(integerZoom(1440, 900)).toBe(2);
    expect(integerZoom(960, 640)).toBe(2);
    expect(integerZoom(959, 640)).toBe(1);
    expect(integerZoom(300, 200)).toBe(1);
  });
});
