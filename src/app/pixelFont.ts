/**
 * Original 5x7 pixel font, drawn from data at boot.
 *
 * TEMPORARY ASSET: stands in until the creative director approves final
 * retro sports typography. Uppercase only; text is upper-cased on the way in.
 */
import Phaser from 'phaser';

export const FONT_KEY = 'blh-pixel';
export const GLYPH_W = 5;
export const GLYPH_H = 7;
export const CELL_W = 6;
export const CELL_H = 9;
const PER_ROW = 16;

/** Each glyph is seven rows of five cells, '#' = ink. */
export const GLYPHS: Readonly<Record<string, string>> = {
  ' ': '...../...../...../...../...../...../.....',
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.###./#...#/#..../#..../#..../#...#/.###.',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '#####/..#../..#../..#../..#../..#../#####',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',
  '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  '1': '..#../.##../..#../..#../..#../..#../.###.',
  '2': '.###./#...#/....#/...#./..#../.#.../#####',
  '3': '####./....#/....#/.###./....#/....#/####.',
  '4': '...#./..##./.#.#./#..#./#####/...#./...#.',
  '5': '#####/#..../####./....#/....#/#...#/.###.',
  '6': '.###./#..../#..../####./#...#/#...#/.###.',
  '7': '#####/....#/...#./..#../..#../..#../..#..',
  '8': '.###./#...#/#...#/.###./#...#/#...#/.###.',
  '9': '.###./#...#/#...#/.####/....#/....#/.###.',
  '.': '...../...../...../...../...../.##../.##..',
  ',': '...../...../...../...../..#../..#../.#...',
  ':': '...../..#../..#../...../..#../..#../.....',
  '!': '..#../..#../..#../..#../..#../...../..#..',
  '?': '.###./#...#/....#/...#./..#../...../..#..',
  "'": '..#../..#../...../...../...../...../.....',
  '-': '...../...../...../#####/...../...../.....',
  '/': '....#/....#/...#./..#../.#.../#..../#....',
  '+': '...../..#../..#../#####/..#../..#../.....',
  '%': '##..#/##..#/...#./..#../.#.../#..##/#..##',
  '(': '...#./..#../.#.../.#.../.#.../..#../...#.',
  ')': '.#.../..#../...#./...#./...#./..#../.#...',
  '>': '#..../.#.../..#../...#./..#../.#.../#....',
  '<': '....#/...#./..#../.#.../..#../...#./....#',
  '`': '.#.../..#../...../...../...../...../.....',
  '$': '..#../.####/#.#../.###./..#.#/####./..#..',
  '=': '...../...../#####/...../#####/...../.....',
  '#': '.#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.',
  _: '...../...../...../...../...../...../#####',
};

export const FONT_CHARS = Object.keys(GLYPHS).join('');

/** Upper-case and replace unsupported characters so text never renders blank cells. */
export function fontText(text: string): string {
  let out = '';
  for (const ch of text.toUpperCase()) {
    out += ch === '\n' || GLYPHS[ch] !== undefined ? ch : '?';
  }
  return out;
}

/** Build the font texture and register it as a bitmap font. Call once at boot. */
export function registerPixelFont(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.exists(FONT_KEY)) return;
  const rows = Math.ceil(FONT_CHARS.length / PER_ROW);
  const texture = scene.textures.createCanvas(`${FONT_KEY}-tex`, PER_ROW * CELL_W, rows * CELL_H);
  if (!texture) throw new Error('Could not create font texture');
  const ctx = texture.getContext();
  ctx.fillStyle = '#ffffff';
  [...FONT_CHARS].forEach((ch, i) => {
    const ox = (i % PER_ROW) * CELL_W;
    const oy = Math.floor(i / PER_ROW) * CELL_H;
    const lines = (GLYPHS[ch] as string).split('/');
    lines.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        if (line[x] === '#') ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    });
  });
  texture.refresh();

  const config = {
    image: `${FONT_KEY}-tex`,
    width: CELL_W,
    height: CELL_H,
    chars: FONT_CHARS,
    charsPerRow: PER_ROW,
    offset: { x: 0, y: 0 },
    spacing: { x: 0, y: 0 },
    lineSpacing: 0,
  } as unknown as Phaser.Types.GameObjects.BitmapText.RetroFontConfig;
  scene.cache.bitmapFont.add(FONT_KEY, Phaser.GameObjects.RetroFont.Parse(scene, config));
}

/** Convenience: add pixel text. */
export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  tint = 0xffffff,
  scale = 1,
): Phaser.GameObjects.BitmapText {
  const obj = scene.add.bitmapText(x, y, FONT_KEY, fontText(text));
  obj.setScale(scale);
  obj.setTint(tint);
  return obj;
}
