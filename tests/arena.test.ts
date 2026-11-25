import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RINK, goalLineY } from '../src/match/sim/rink';
import { ARENA_CONFIGS, arenaConfig } from '../src/match/view/arena/config';
import { IceWear, trafficPrior } from '../src/match/view/arena/iceWear';
import { ARENA_LAYERS, benchReport, faceoffSpots, goalAlignment, goalFit, iceGrid, iceOutline, layoutArena, layoutGoals, screenY } from '../src/match/view/arena/layout';
import { TILE, assetById, loadableAssets, textureSource } from '../src/match/view/arena/registry';
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
    const expected = [
      ...Array.from({ length: 13 }, (_, i) => `09.${String(i + 1).padStart(2, '0')}`),
      ...Array.from({ length: 14 }, (_, i) => `10.${String(i + 1).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `11.${String(i + 1).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `12.${String(i + 1).padStart(2, '0')}`),
    ];
    expect(Object.keys(registry.batches).sort()).toEqual(expected);
    expect(registry.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(registry.assets.length).toBe(4327);
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
    for (const id of ['ice.base', 'ice.scratches', 'markings.creaseNorth', 'logo.center', 'boards.west', 'boards.east', 'boards.north', 'boards.south', 'glass', 'glass.posts', 'glass.damage', 'boards.gates', 'boards.ads', 'goals.scored', 'goals.ripple', 'goals.knockoff', 'goals.dislodged', 'benches.reactions', 'benches.doors', 'benches.equipment']) {
      expect(status[id], id).toBe('supplied');
    }
    expect(status['boards.corners']).toBe('unfit');
    // Goal art has arrived but is larger than the physics net, so it stays provisional until that is ruled on.
    expect(status['goals.north']).toBe('provisional');
    expect(status['goals.south']).toBe('provisional');
    // Benches and boxes are placed as a proposal: the packages call every placement provisional.
    for (const id of ['benches', 'penaltyBox', 'benches.timekeeper', 'benches.players']) expect(status[id], id).toBe('provisional');
    for (const id of ['glass.corners', 'stadium', 'spectators', 'equipment']) {
      expect(status[id], id).toBe('missing');
    }
  });

  it('loads atlases and whole images once each, not single tiles, single animation frames or duplicate files', () => {
    const load = loadableAssets(registry);
    expect(load.some((a) => a.role === 'tile' || a.role === 'frame')).toBe(false);
    expect(load.some((a) => a.duplicateOf)).toBe(false);
    expect(load.length).toBeLessThan(140);
    // Every duplicate points at a file that is loaded.
    // Everything that is not a single tile resolves to a texture that is loaded, and to a cell inside it.
    const loaded = new Map(load.map((l) => [l.id, l]));
    for (const a of registry.assets.filter((x) => x.role !== 'tile')) {
      const source = textureSource(registry, a.id);
      const texture = loaded.get(source.key);
      expect(texture, a.id).toBeDefined();
      if (source.cell && texture) {
        expect(source.cell.x + source.cell.width, a.id).toBeLessThanOrEqual(texture.width);
        expect(source.cell.y + source.cell.height, a.id).toBeLessThanOrEqual(texture.height);
      }
    }
  });

  it('every arena configuration asks only for assets that exist', () => {
    for (const config of ARENA_CONFIGS) {
      expect(() => layoutArena(RINK, TILT, config, lookup), config.id).not.toThrow();
      for (const art of Object.values(config.goals ?? {})) {
        for (const id of [art.rest, art.scored, art.ripple.atlas, art.knockoff.atlas, art.dislodged.atlas]) expect(lookup(id), id).toBeDefined();
      }
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

  it('butts all four straight boards against the ice edge', () => {
    const edge = (role: string) => layout.strips.find((b) => b.role === role);
    const ink = (id: string) => lookup(id)?.bbox as [number, number, number, number];
    const west = edge('westBoards');
    const east = edge('eastBoards');
    const north = edge('northBoards');
    const south = edge('southBoards');
    const top = screenY(RINK, TILT, RINK.top);
    const bottom = screenY(RINK, TILT, RINK.bottom);
    expect((west?.x ?? 0) + ink('10.01/west_board_module')[2] + 1).toBe(RINK.left); // last board pixel is the one before the ice
    expect((east?.x ?? 0) + ink('10.02/east_board_module')[0]).toBe(RINK.right); // first board pixel is the one after the ice
    expect((north?.y ?? 0) + ink('10.03/north_board_module')[3] + 1).toBe(top);
    expect((south?.y ?? 0) + ink('10.04/south_board_module')[1]).toBe(bottom);
    expect(south?.layer).toBe('frontBoards');
    expect(north?.layer).toBe('backBoards');
  });

  it('runs straight boards exactly between the corners the physics uses', () => {
    expect(layout.extents.x0).toBe(RINK.left + RINK.cornerRadius);
    expect(layout.extents.x1).toBe(RINK.right - RINK.cornerRadius);
    expect(layout.extents.y0).toBe(screenY(RINK, TILT, RINK.top + RINK.cornerRadius));
    expect(layout.extents.y1).toBe(screenY(RINK, TILT, RINK.bottom - RINK.cornerRadius));
    expect(layout.boardImages.some((i) => i.role.startsWith('corner:'))).toBe(false);
  });

  it('replaces whole board modules with gates, leaving no overlap and no gap', () => {
    for (const side of ['west', 'east'] as const) {
      const strips = layout.strips.filter((s) => s.role === `${side}Boards`).map((s) => [s.y, s.y + s.height] as const);
      const gates = layout.boardImages.filter((i) => i.role.startsWith(`gate:${side}`) || i.role === `door:${side}`).map((g) => [g.y, g.y + 32] as const);
      expect(gates).toHaveLength(3);
      const spans = [...strips, ...gates].sort((a, b) => a[0] - b[0]);
      expect(spans[0]?.[0]).toBe(layout.extents.y0);
      expect(spans[spans.length - 1]?.[1]).toBe(layout.extents.y1);
      for (let i = 1; i < spans.length; i++) expect(spans[i]?.[0]).toBe(spans[i - 1]?.[1]);
      for (const [y] of gates) expect((y - layout.extents.y0) % 32).toBe(0);
    }
  });

  it('stands glass and posts along every straight run, with a post at each seam', () => {
    for (const side of ['north', 'south', 'west', 'east'] as const) {
      const panes = layout.glass.filter((g) => g.side === side);
      const posts = layout.boardImages.filter((i) => i.role === `post:${side}`);
      expect(panes.length, side).toBeGreaterThan(0);
      expect(posts.length, side).toBe(panes.length - 1);
    }
    expect(new Set(layout.glass.map((g) => g.id)).size).toBe(layout.glass.length);
    const north = layout.glass.filter((g) => g.side === 'north');
    const covered = north.reduce((sum, g) => sum + (g.cropW ?? 0), 0);
    expect(covered).toBe(layout.extents.x1 - layout.extents.x0);
  });

  it('clips sponsor panels to the board face and keeps them on the straight run', () => {
    const ads = layout.boardImages.filter((i) => i.role.startsWith('ad:'));
    expect(ads).toHaveLength(2);
    for (const ad of ads) {
      expect(ad.cropH).toBe(15);
      expect(ad.x).toBeGreaterThanOrEqual(layout.extents.x0);
      expect(ad.x + 64).toBeLessThanOrEqual(layout.extents.x1);
    }
  });

  it('removes glass over an open gate but keeps it over a closed one', () => {
    const test = layoutArena(RINK, TILT, arenaConfig('corner-fit-test'), lookup);
    const gate = test.boardImages.find((i) => i.role === 'gate:west:open');
    expect(gate).toBeDefined();
    expect(test.glass.some((g) => g.side === 'west' && g.y === gate?.y)).toBe(false);
    const closed = layout.boardImages.find((i) => i.role === 'door:west');
    expect(closed).toBeDefined();
    expect(layout.glass.some((g) => g.side === 'west' && g.y === closed?.y)).toBe(true);
  });

  it('places supplied corners only in the fit test, mirrored left to right and top to bottom', () => {
    const test = layoutArena(RINK, TILT, arenaConfig('corner-fit-test'), lookup);
    const c = (name: string) => test.boardImages.find((i) => i.role === `corner:${name}`);
    const top = screenY(RINK, TILT, RINK.top);
    const bottom = screenY(RINK, TILT, RINK.bottom);
    const visible = (name: string, id: string) => {
      const img = c(name);
      const ink = lookup(id)?.bbox as [number, number, number, number];
      return { left: (img?.x ?? 0) + ink[0], right: (img?.x ?? 0) + ink[2], top: (img?.y ?? 0) + ink[1], bottom: (img?.y ?? 0) + ink[3] };
    };
    const nw = visible('nw', '10.05/nw_corner_module');
    const ne = visible('ne', '10.06/ne_corner_module');
    const sw = visible('sw', '10.07/sw_corner_module');
    expect(RINK.left - nw.left).toBe(ne.right - (RINK.right - 1));
    expect(top - nw.top).toBe(sw.bottom - (bottom - 1));
    // The supplied corner turns in 37 px; the rink's real corner needs 112.
    expect(test.extents.x0 - RINK.left).toBe(37);
    expect(RINK.cornerRadius).toBe(112);
  });
});

describe('goal nets', () => {
  const standard = arenaConfig('standard');
  const manifest = (batch: string) => JSON.parse(readFileSync(join(ARENA_DIR, 'manifests', `${batch}.manifest.json`), 'utf8')) as Record<string, unknown> & { frames?: { durationMs: number; atlasRect: number[] }[] };

  it('uses the anchors, frame sizes and timings written in the batch manifests', () => {
    const goals = standard.goals;
    if (!goals) throw new Error('standard arena has no goals');
    for (const [end, rest, ripple, knockoff, dislodged] of [
      ['north', '11.01', '11.07', '11.05', '11.09'],
      ['south', '11.02', '11.08', '11.06', '11.10'],
    ] as const) {
      const art = goals[end];
      const base = manifest(rest);
      expect(base.mouthAnchorLocal, end).toEqual([...art.mouth]);
      expect((base.postAnchorsLocal as number[][]).map((p) => p[0]), end).toEqual([...art.posts]);
      expect(art.rest.endsWith(String(base.composite).replace('.png', ''))).toBe(true);
      for (const [strip, batch, offsetKey] of [
        [art.ripple, ripple, null],
        [art.knockoff, knockoff, 'goalOffset'],
        [art.dislodged, dislodged, 'sourceOffset'],
      ] as const) {
        const m = manifest(batch);
        const frames = m.frames ?? [];
        expect(strip.atlas).toBe(`${batch}/goal_atlas`);
        expect(frames.map((f) => f.durationMs), batch).toEqual([...strip.durations]);
        frames.forEach((f, i) => expect(f.atlasRect, `${batch} frame ${i}`).toEqual([i * strip.frameWidth, 0, strip.frameWidth, strip.frameHeight]));
        expect(offsetKey ? m[offsetKey] : [0, 0], batch).toEqual([...strip.offset]);
        const atlas = lookup(strip.atlas);
        expect([atlas?.width, atlas?.height], batch).toEqual([strip.frameWidth * strip.durations.length, strip.frameHeight]);
      }
    }
  });

  it('puts each mouth anchor on the centre of its goal line, mirrored north to south', () => {
    for (const tilt of [0.6, 0.74, 0.9, 1]) {
      const [north, south] = layoutGoals(RINK, tilt, standard, lookup);
      if (!north || !south) throw new Error('goals not placed');
      const centre = screenY(RINK, tilt, RINK.centerY);
      expect(north.x + north.art.mouth[0]).toBe(RINK.centerX);
      expect(south.x + south.art.mouth[0]).toBe(RINK.centerX);
      expect(north.y + north.art.mouth[1]).toBe(screenY(RINK, tilt, goalLineY(RINK, 'top')));
      expect(south.y + south.art.mouth[1]).toBe(screenY(RINK, tilt, goalLineY(RINK, 'bottom')));
      expect(centre - (north.y + north.art.mouth[1])).toBe(south.y + south.art.mouth[1] - centre);
    }
  });

  it('sorts the far goal at its goal line and the near goal at its back edge', () => {
    const [north, south] = layoutGoals(RINK, TILT, standard, lookup);
    expect(north?.depth).toBe(screenY(RINK, TILT, goalLineY(RINK, 'top')));
    expect(south?.depth).toBeGreaterThan(screenY(RINK, TILT, goalLineY(RINK, 'bottom')) + 20);
  });

  it('reports that the supplied goals are larger than the physics net, and still sit on the ice', () => {
    const fit = goalFit(RINK, TILT, standard, lookup);
    expect(fit.length).toBe(2);
    for (const f of fit) {
      expect(f.physicsMouth).toBe(24);
      expect(f.artMouth).toBe(37);
      expect(f.artDepth).toBeGreaterThan(f.physicsDepth);
      expect(f.clearBehind).toBeGreaterThan(0);
    }
    // The gameplay net is untouched by the art.
    expect([RINK.netHalfWidth, RINK.netDepth, RINK.goalLineInset]).toEqual([12, 14, 44]);
  });

  it('keeps stand-in nets on the practice sheet, where no goal art is asked for', () => {
    expect(layoutGoals(RINK, TILT, arenaConfig('practice-sheet'), lookup)).toEqual([]);
  });

  it('files every single animation frame against a strip that holds the same pixels', () => {
    const frames = registry.assets.filter((a) => a.role === 'frame');
    expect(frames.length).toBe(282);
    for (const f of frames) {
      const strip = lookup(f.atlas ?? '');
      expect(strip, f.id).toBeDefined();
      expect(f.atlasX, f.id).toBeDefined();
    }
  });
});

describe('benches, penalty boxes and doors', () => {
  const standard = arenaConfig('standard');
  const area = standard.benchArea;
  if (!area) throw new Error('standard arena has no bench area');
  const manifest = (batch: string) => JSON.parse(readFileSync(join(ARENA_DIR, 'manifests', `${batch}.manifest.json`), 'utf8')) as Record<string, unknown>;
  type Rect = { atlasRect: number[]; durationMs?: number };

  it('uses the contact edges, anchors and layer order written in the batch manifests', () => {
    for (const [batch, side] of [['12.01', 'west'], ['12.02', 'east']] as const) {
      const m = manifest(batch);
      const bench = area.structures.find((s) => s.kind === 'bench' && s.side === side);
      expect(bench?.contact).toBe(m.boardContactLocalX);
      expect(bench?.seats).toEqual(m.seatAnchorsLocal);
      expect(bench?.standing).toEqual(m.standingAnchorsLocal);
      const layers = m.layers as Record<string, string>;
      expect(bench?.layers).toEqual([layers.floor, layers.seating, layers.enclosure].map((f) => `${batch}/${String(f).replace('.png', '')}`));
      expect(bench?.height).toBe((m.moduleSize as number[])[1]);
    }
    for (const [batch, kind] of [['12.07', 'penaltyBox'], ['12.08', 'timekeeper']] as const) {
      const assets = manifest(batch).assets as { file: string; boardContactLocalX: number }[];
      for (const s of area.structures.filter((x) => x.kind === kind)) {
        const entry = assets.find((a) => `${batch}/${a.file.replace('.png', '')}` === s.layers[0]);
        expect(entry?.boardContactLocalX, s.layers[0]).toBe(s.contact);
      }
    }
  });

  it('cuts bench players, reactions and doors from the atlas cells the manifests name', () => {
    const p = area.players;
    for (const [batch, atlas, prefix] of [['12.03', p.seated, 'seated'], ['12.04', p.standing, 'standing']] as const) {
      const assets = manifest(batch).assets as (Rect & { file: string; side: string; anchorLocal: number[] })[];
      expect(atlas).toBe(`${batch}/${prefix}_atlas`);
      for (const a of assets) {
        const variant = Number(a.file.match(/_(\d+)\.png$/)?.[1]) - 1;
        expect(a.atlasRect, a.file).toEqual([variant * p.frame, (a.side === 'home' ? 0 : 1) * p.frame, p.frame, p.frame]);
        expect(a.anchorLocal).toEqual([...p.anchor]);
      }
      expect(assets.length).toBe(p.variants * 2);
    }
    for (const [batch, strip] of [['12.05', p.cheer], ['12.06', p.groan]] as const) {
      const assets = manifest(batch).assets as { side: string; variant: number; frames: Rect[] }[];
      for (const a of assets) {
        expect(a.frames.map((f) => f.durationMs), batch).toEqual([...strip.durations]);
        a.frames.forEach((f, i) => expect(f.atlasRect).toEqual([(a.variant - 1) * p.frame, ((a.side === 'home' ? 0 : 1) * strip.durations.length + i) * p.frame, p.frame, p.frame]));
      }
    }
    const doors = manifest('12.09').assets as { orientation: 'west' | 'east'; frames: Rect[] }[];
    for (const d of doors) {
      expect(d.frames.map((f) => f.durationMs)).toEqual([...area.doors.durations]);
      d.frames.forEach((f, i) => expect(f.atlasRect).toEqual([i * area.doors.frameWidth, area.doors.rows[d.orientation] * area.doors.frameHeight, area.doors.frameWidth, area.doors.frameHeight]));
    }
  });

  it('keeps every structure off the ice, on screen, apart, and with each door on a whole board module, at every tilt', () => {
    for (const tilt of [0.6, 0.66, 0.7, 0.74, 0.8, 0.9, 1]) {
      const l = layoutArena(RINK, tilt, standard, lookup);
      const report = benchReport(RINK, l);
      expect(report.ok, `tilt ${tilt}: ${JSON.stringify(report)}`).toBe(true);
      expect(l.structures.length, `tilt ${tilt}`).toBe(area.structures.length);
    }
  });

  it('butts each structure against the outside edge of the boards', () => {
    const l = layoutArena(RINK, TILT, standard, lookup);
    const west = lookup('10.01/west_board_module');
    const east = lookup('10.02/east_board_module');
    const westEdge = RINK.left - 19 + (west?.bbox?.[0] ?? 0);
    const eastEdge = RINK.right - 1 - 4 + (east?.bbox?.[2] ?? 0);
    for (const p of l.structures) {
      expect(p.x + p.structure.contact, p.structure.kind).toBe(p.structure.side === 'west' ? westEdge : eastEdge);
    }
  });

  it('puts a closed animated door, not a static gate, at every bench and penalty-box door, with glass above it', () => {
    const l = layoutArena(RINK, TILT, standard, lookup);
    const doors = l.boardImages.filter((i) => i.role.startsWith('door:'));
    expect(doors.length).toBe(6);
    expect(l.boardImages.some((i) => i.role.startsWith('gate:'))).toBe(false);
    for (const d of doors) {
      expect(d.cell?.x).toBe(0);
      expect(l.glass.some((g) => g.id === d.doorId)).toBe(true);
    }
    // Frame 0 and the last frame are the very pixels of the static closed and open gates.
    expect(lookup('12.09/door_west_00')?.duplicateOf).toBe('10.12/gate_west_closed');
    expect(lookup('12.09/door_east_04')?.duplicateOf).toBe('10.12/gate_east_open');
  });

  it('seats six players a side on the manifest anchors, and stands six more', () => {
    const l = layoutArena(RINK, TILT, standard, lookup);
    for (const p of l.structures.filter((x) => x.structure.kind === 'bench')) {
      expect(p.spots.filter((s) => s.pose === 'seated').length).toBe(6);
      expect(p.spots.filter((s) => s.pose === 'standing').length).toBe(6);
      const first = p.spots[0];
      const seat = p.structure.seats?.[0];
      expect([first?.x, first?.y]).toEqual([p.x + (seat?.[0] ?? 0) - 8, p.y + (seat?.[1] ?? 0) - 8]);
      expect(new Set(p.spots.map((s) => s.team)).size).toBe(1);
    }
    expect(l.structures.filter((x) => x.structure.kind !== 'bench').every((x) => x.spots.length === 0)).toBe(true);
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
