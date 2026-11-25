import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RINK, goalLineY } from '../src/match/sim/rink';
import { ARENA_CONFIGS, arenaConfig } from '../src/match/view/arena/config';
import { IceWear, trafficPrior } from '../src/match/view/arena/iceWear';
import { ARENA_LAYERS, faceoffSpots, goalAlignment, iceGrid, iceOutline, layoutArena, screenY } from '../src/match/view/arena/layout';
import { TILE, assetById, loadableAssets } from '../src/match/view/arena/registry';
import type { ArenaRegistry } from '../src/match/view/arena/registry';
import { projectY } from '../src/match/view/projection';

const ARENA_DIR = join(__dirname, '..', 'public', 'assets', 'arena');
const registry = JSON.parse(readFileSync(join(ARENA_DIR, 'manifests', 'registry.json'), 'utf8')) as ArenaRegistry;
const lookup = (id: string) => assetById(registry, id);
const TILT = 0.74;

/** Width and height from a PNG header. */
function pngSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  expect(b.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

describe('arena asset registry', () => {
  it('ingested every supplied package with no errors', () => {
    expect(Object.keys(registry.batches).sort()).toEqual([
      '09.01', '09.02', '09.03', '09.04', '09.05', '09.06', '09.07', '09.08', '09.09', '09.10', '09.11', '09.12', '09.13', '10.01',
    ]);
    expect(registry.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(registry.assets.length).toBeGreaterThan(150);
  });

  it('points only at files that exist, with the recorded pixel size, on the 8-pixel grid', () => {
    for (const asset of registry.assets) {
      const file = join(ARENA_DIR, asset.file);
      expect(existsSync(file), asset.file).toBe(true);
      expect(pngSize(file), asset.id).toEqual({ width: asset.width, height: asset.height });
      expect(asset.width % TILE, asset.id).toBe(0);
      expect(asset.height % TILE, asset.id).toBe(0);
    }
  });

  it('keeps presentation images out of the game', () => {
    expect(registry.assets.filter((a) => /preview/i.test(a.name))).toEqual([]);
  });

  it('has unique ids, and keeps same-named files from different batches apart', () => {
    const ids = registry.assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const files = registry.assets.map((a) => a.file);
    expect(new Set(files).size).toBe(files.length);
    expect(lookup('09.07/circle_0_0')?.file).not.toBe(lookup('09.09/circle_0_0')?.file);
  });

  it('reports what has arrived and what is still missing', () => {
    const status = Object.fromEntries(registry.slots.map((s) => [s.id, s.status]));
    for (const id of ['ice.base', 'ice.scratches', 'ice.reflections', 'markings.creaseNorth', 'markings.creaseSouth', 'logo.center', 'boards.west']) {
      expect(status[id], id).toBe('supplied');
    }
    for (const id of ['boards.east', 'boards.north', 'boards.corners', 'glass', 'goals.north', 'goals.south', 'benches', 'stadium', 'spectators', 'equipment']) {
      expect(status[id], id).toBe('missing');
    }
  });

  it('loads atlases and whole images, not the 160 single tiles they already contain', () => {
    const load = loadableAssets(registry);
    expect(load.some((a) => a.role === 'tile')).toBe(false);
    expect(load.length).toBeLessThan(60);
  });

  it('every arena configuration asks only for assets that exist', () => {
    for (const config of ARENA_CONFIGS) {
      expect(() => layoutArena(RINK, TILT, config, lookup), config.id).not.toThrow();
    }
  });
});

describe('arena layout', () => {
  const layout = layoutArena(RINK, TILT, arenaConfig('standard'), lookup);

  it('defines the twelve layers in back-to-front order', () => {
    expect(ARENA_LAYERS).toHaveLength(12);
    const fixed = ARENA_LAYERS.filter((l) => !l.ySorted).map((l) => l.depth);
    expect([...fixed].sort((a, b) => a - b)).toEqual(fixed);
  });

  it('covers the whole ice with 8-pixel tiles', () => {
    const grid = iceGrid(RINK, TILT);
    expect(grid.x).toBe(RINK.left);
    expect(grid.x + grid.cols * TILE).toBeGreaterThanOrEqual(RINK.right);
    expect(grid.y).toBeLessThanOrEqual(projectY(RINK.top, TILT));
    expect(grid.y + grid.rows * TILE).toBeGreaterThanOrEqual(projectY(RINK.bottom, TILT));
  });

  it('keeps the sidelines parallel: the ice outline never leaves the rink width', () => {
    const outline = iceOutline(RINK, TILT);
    expect(Math.min(...outline.map((p) => p.x))).toBeCloseTo(RINK.left, 6);
    expect(Math.max(...outline.map((p) => p.x))).toBeCloseTo(RINK.right, 6);
  });

  it('centres each line on its gameplay position', () => {
    const centre = layout.lines.find((l) => l.role === 'centerLine');
    const atlas = lookup('09.04/center_line_atlas');
    const ink = atlas?.bbox as [number, number, number, number];
    const inkCentre = (centre?.y ?? 0) + (ink[1] + ink[3] + 1) / 2;
    expect(inkCentre).toBeCloseTo(screenY(RINK, TILT, RINK.centerY), 6);
    expect(layout.lines.filter((l) => l.role === 'blueLine')).toHaveLength(2);
    expect(layout.lines.filter((l) => l.role === 'goalLine')).toHaveLength(2);
  });

  it('places creases symmetrically, centred on the goal mouth and touching the goal line', () => {
    const [north, south] = goalAlignment(RINK, TILT, layout, lookup);
    expect(north?.offsetX).toBe(0);
    expect(south?.offsetX).toBe(0);
    expect(north?.gapToLine).toBe(0);
    expect(south?.gapToLine).toBe(0);
    expect(north?.lineToEndBoards).toBe(south?.lineToEndBoards);
  });

  it('mirrors north and south exactly at every tilt', () => {
    for (const tilt of [0.6, 0.7, 0.74, 0.78, 0.9, 1]) {
      const c = screenY(RINK, tilt, RINK.centerY);
      for (const d of [44, 100, 276, 356, 400]) {
        expect(c - screenY(RINK, tilt, RINK.centerY - d)).toBe(screenY(RINK, tilt, RINK.centerY + d) - c);
      }
    }
  });

  it('leaves playable ice behind both nets', () => {
    expect(projectY(goalLineY(RINK, 'top') - RINK.netDepth, TILT) - projectY(RINK.top, TILT)).toBeGreaterThan(15);
    expect(projectY(RINK.bottom, TILT) - projectY(goalLineY(RINK, 'bottom') + RINK.netDepth, TILT)).toBeGreaterThan(15);
  });

  it('puts a circle and a hash mark on each end-zone faceoff spot and a dot on each neutral spot', () => {
    const spots = faceoffSpots(RINK);
    for (const s of spots.endZone) {
      for (const role of ['faceoffCircle', 'faceoffMark']) {
        expect(layout.images.some((i) => i.role === role && i.x === s.x && i.y === screenY(RINK, TILT, s.y)), role).toBe(true);
      }
    }
    expect(layout.images.filter((i) => i.role === 'neutralDot')).toHaveLength(spots.neutral.length);
  });

  it('centres the logo on centre ice and scales the circle to the gameplay width', () => {
    const logo = layout.images.find((i) => i.role === 'centerLogo');
    expect(logo?.x).toBe(RINK.centerX);
    expect(logo?.y).toBe(screenY(RINK, TILT, RINK.centerY));
    const circle = layout.images.find((i) => i.role === 'faceoffCircle');
    const asset = lookup(circle?.asset ?? '');
    const ink = asset?.bbox as [number, number, number, number];
    expect((ink[2] - ink[0] + 1) * (circle?.scale ?? 0)).toBe(120); // 15 ft radius at 4 px per foot
    expect(Number.isInteger(circle?.scale)).toBe(true);
  });

  it('butts the boards against the ice edge and spans the straight section', () => {
    const west = layout.boards.find((b) => b.role === 'west');
    const east = layout.boards.find((b) => b.role === 'east');
    const module = lookup('10.01/west_board_module');
    const ink = module?.bbox as [number, number, number, number];
    expect((west?.x ?? 0) + ink[2] + 1).toBe(RINK.left); // last board pixel is the one before the ice
    expect((east?.x ?? 0) + ((module?.width ?? 0) - 1 - ink[2])).toBe(RINK.right); // mirrored: first board pixel is the one after the ice
    expect(east?.provisional).toBe(true);
    expect(west?.height).toBe(screenY(RINK, TILT, RINK.bottom - RINK.cornerRadius) - screenY(RINK, TILT, RINK.top + RINK.cornerRadius));
  });

  it('shows no east boards in the supplied-art-only arena', () => {
    const bare = layoutArena(RINK, TILT, arenaConfig('supplied-only'), lookup);
    expect(bare.boards.map((b) => b.role)).toEqual(['west']);
  });
});

describe('ice wear', () => {
  it('starts as a clean sheet', () => {
    const wear = new IceWear(10, 10);
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) expect(wear.tileAt(c, r)).toBe(-1);
  });

  it('builds up where there is traffic, and worsens with more of it', () => {
    const wear = new IceWear(20, 20);
    for (let i = 0; i < 10; i++) wear.addTraffic(5, 5, 0.05);
    const some = wear.wearAt(5, 5);
    expect(some).toBeGreaterThan(0);
    expect(wear.wearAt(15, 15)).toBe(0);
    expect(wear.tileAt(15, 15)).toBe(-1);
    for (let i = 0; i < 40; i++) wear.addTraffic(5, 5, 0.05);
    expect(wear.wearAt(5, 5)).toBeGreaterThan(some);
    expect(wear.tileAt(5, 5)).toBeGreaterThanOrEqual(12); // severe tiles are 12..15
    expect(wear.wearAt(5, 5)).toBeLessThanOrEqual(1);
  });

  it('only ever returns tiles that exist in the 16-tile scratch atlas', () => {
    const wear = new IceWear(30, 30);
    wear.preview(1, trafficPrior(30, 30, [{ col: 15, row: 5, radius: 6, weight: 1 }]));
    for (let r = 0; r < 30; r++) {
      for (let c = 0; c < 30; c++) {
        const t = wear.tileAt(c, r);
        expect(t).toBeGreaterThanOrEqual(-1);
        expect(t).toBeLessThan(16);
      }
    }
  });

  it('scales with intensity and clears on resurfacing', () => {
    const wear = new IceWear(30, 30);
    const prior = trafficPrior(30, 30, [{ col: 15, row: 5, radius: 6, weight: 1 }]);
    const count = (intensity: number): number => {
      let n = 0;
      for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) if (wear.tileAt(c, r, intensity) >= 0) n++;
      return n;
    };
    wear.preview(0.3, prior);
    const light = count(1);
    wear.preview(1, prior);
    const heavy = count(1);
    expect(heavy).toBeGreaterThan(light);
    expect(count(0)).toBe(0);
    expect(count(0.4)).toBeLessThan(heavy);
    wear.resurface();
    expect(count(1)).toBe(0);
  });

  it('wears the hotspot harder than open ice, and varies tiles so nothing repeats in a grid', () => {
    const wear = new IceWear(30, 30);
    wear.preview(0.8, trafficPrior(30, 30, [{ col: 15, row: 5, radius: 6, weight: 1 }]));
    expect(wear.wearAt(15, 5)).toBeGreaterThan(wear.wearAt(2, 25));
    const variants = new Set<number>();
    for (let c = 10; c < 20; c++) variants.add(wear.tileAt(c, 5) % 4);
    expect(variants.size).toBeGreaterThan(1);
  });

  it('is deterministic', () => {
    const a = new IceWear(12, 12);
    const b = new IceWear(12, 12);
    for (const w of [a, b]) for (let i = 0; i < 30; i++) w.addTraffic(i % 12, (i * 5) % 12, 0.2);
    const tiles = (w: IceWear): number[] => Array.from({ length: 144 }, (_, i) => w.tileAt(i % 12, Math.floor(i / 12)));
    expect(tiles(a)).toEqual(tiles(b));
  });
});
