/**
 * Where every piece of the arena goes. Pure maths from the gameplay rink
 * geometry (the source of truth), the camera tilt and an arena config.
 * The renderer only draws what this module returns. No Phaser here.
 */
import { goalLineY } from '../../sim/rink';
import type { RinkGeometry } from '../../sim/rink';
import { projectY } from '../projection';
import type { ArenaConfig } from './config';
import { TILE, visibleCentre } from './registry';
import type { ArenaAsset } from './registry';

export type ArenaLayerId =
  | 'baseIce'
  | 'scratches'
  | 'markings'
  | 'centerLogo'
  | 'reflections'
  | 'stadium'
  | 'backBoards'
  | 'nets'
  | 'actors'
  | 'frontBoards'
  | 'frontSpectators'
  | 'ui';

export interface ArenaLayerInfo {
  id: ArenaLayerId;
  label: string;
  /** Draw depth. Nets and actors sort by their screen y instead. */
  depth: number;
  ySorted?: boolean;
}

/** The twelve rendering layers, back to front. */
export const ARENA_LAYERS: readonly ArenaLayerInfo[] = [
  { id: 'baseIce', label: 'Base ice', depth: -100 },
  { id: 'scratches', label: 'Ice scratches and wear', depth: -95 },
  { id: 'markings', label: 'Rink markings and creases', depth: -90 },
  { id: 'centerLogo', label: 'Centre-ice logo', depth: -85 },
  { id: 'reflections', label: 'Overhead light reflections', depth: -80 },
  { id: 'stadium', label: 'Background stadium and seating', depth: -70 },
  { id: 'backBoards', label: 'Background boards and glass', depth: -60 },
  { id: 'nets', label: 'Goal nets', depth: 0, ySorted: true },
  { id: 'actors', label: 'Players, officials and puck', depth: 0, ySorted: true },
  { id: 'frontBoards', label: 'Foreground boards and glass', depth: 5000 },
  { id: 'frontSpectators', label: 'Foreground spectators and effects', depth: 5100 },
  { id: 'ui', label: 'Broadcast UI', depth: 9000 },
];

export function layerDepth(id: ArenaLayerId): number {
  return (ARENA_LAYERS.find((l) => l.id === id) as ArenaLayerInfo).depth;
}

export interface TileGrid {
  /** Screen position of the grid's top-left tile. */
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/**
 * Whole-pixel screen y for art placed on the ice. Rounds the distance from
 * centre ice rather than the position, so the north and south halves of the
 * rink come out as exact mirror images at any tilt.
 */
export function screenY(rink: RinkGeometry, tilt: number, simY: number): number {
  const centre = Math.round(projectY(rink.centerY, tilt));
  const offset = Math.round(Math.abs(simY - rink.centerY) * tilt);
  return simY < rink.centerY ? centre - offset : centre + offset;
}

/** The 8x8 tile grid that covers the ice, anchored at the ice's top-left corner. */
export function iceGrid(rink: RinkGeometry, tilt: number): TileGrid {
  const y = Math.floor(projectY(rink.top, tilt));
  const bottom = Math.ceil(projectY(rink.bottom, tilt));
  return {
    x: rink.left,
    y,
    cols: Math.ceil((rink.right - rink.left) / TILE),
    rows: Math.ceil((bottom - y) / TILE),
  };
}

/** Outline of the playable ice on screen, used to clip ice layers and to draw the collision overlay. */
export function iceOutline(rink: RinkGeometry, tilt: number, stepsPerCorner = 24): { x: number; y: number }[] {
  const cr = rink.cornerRadius;
  const corners: Array<[number, number, number]> = [
    [rink.right - cr, rink.top + cr, -Math.PI / 2],
    [rink.right - cr, rink.bottom - cr, 0],
    [rink.left + cr, rink.bottom - cr, Math.PI / 2],
    [rink.left + cr, rink.top + cr, Math.PI],
  ];
  const points: { x: number; y: number }[] = [];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= stepsPerCorner; i++) {
      const a = start + (i / stepsPerCorner) * (Math.PI / 2);
      points.push({ x: cx + Math.cos(a) * cr, y: projectY(cy + Math.sin(a) * cr, tilt) });
    }
  }
  return points;
}

/** Faceoff spots in gameplay coordinates. */
export function faceoffSpots(rink: RinkGeometry): { endZone: { x: number; y: number }[]; neutral: { x: number; y: number }[] } {
  const xs = [rink.centerX - 88, rink.centerX + 88];
  const endYs = [goalLineY(rink, 'top') + 80, goalLineY(rink, 'bottom') - 80];
  const neutralYs = [rink.centerY - rink.blueLineOffset + 20, rink.centerY + rink.blueLineOffset - 20];
  return {
    endZone: endYs.flatMap((y) => xs.map((x) => ({ x, y }))),
    neutral: neutralYs.flatMap((y) => xs.map((x) => ({ x, y }))),
  };
}

export interface LineRow {
  role: 'centerLine' | 'blueLine' | 'goalLine';
  atlas: string;
  /** Tile indices repeated across the ice. */
  pattern: number[];
  /** Screen position of the row's top-left tile. */
  x: number;
  y: number;
  cols: number;
}

export interface ImagePlacement {
  role: string;
  layer: ArenaLayerId;
  asset: string;
  frame?: number;
  /** Screen position of the anchor point. */
  x: number;
  y: number;
  /** Anchor inside the image, 0..1. */
  originX: number;
  originY: number;
  scale: number;
  flipX?: boolean;
}

export interface BoardRun {
  role: 'west' | 'east';
  asset: string;
  x: number;
  y: number;
  height: number;
  flipX: boolean;
  provisional: boolean;
}

export interface ArenaLayout {
  grid: TileGrid;
  lines: LineRow[];
  images: ImagePlacement[];
  boards: BoardRun[];
}

type Lookup = (id: string) => ArenaAsset | undefined;

function need(lookup: Lookup, id: string): ArenaAsset {
  const asset = lookup(id);
  if (!asset) throw new Error(`Arena asset not in registry: ${id}`);
  return asset;
}

/** Top y of an 8-px tile row so the line drawn inside the tile is centred on `screenY`. */
function rowTop(atlas: ArenaAsset, screenY: number): number {
  return Math.round(screenY - visibleCentre({ ...atlas, width: TILE, height: TILE }).y);
}

/** Screen thickness of a line tile's ink. */
function inkHeight(atlas: ArenaAsset): number {
  return atlas.bbox ? atlas.bbox[3] - atlas.bbox[1] + 1 : TILE;
}

export function layoutArena(rink: RinkGeometry, tilt: number, config: ArenaConfig, lookup: Lookup): ArenaLayout {
  const grid = iceGrid(rink, tilt);
  const sy = (y: number): number => screenY(rink, tilt, y);
  const lines: LineRow[] = [];
  const images: ImagePlacement[] = [];

  const line = (role: LineRow['role'], atlasId: string, pattern: number[], simY: number): void => {
    lines.push({ role, atlas: atlasId, pattern, x: grid.x, y: rowTop(need(lookup, atlasId), sy(simY)), cols: grid.cols });
  };
  line('centerLine', config.centerLine.atlas, config.centerLine.pattern, rink.centerY);
  line('blueLine', config.blueLine.atlas, [config.blueLine.tile], rink.centerY - rink.blueLineOffset);
  line('blueLine', config.blueLine.atlas, [config.blueLine.tile], rink.centerY + rink.blueLineOffset);
  const northLine = goalLineY(rink, 'top');
  const southLine = goalLineY(rink, 'bottom');
  line('goalLine', config.goalLine.atlas, [config.goalLine.tile], northLine);
  line('goalLine', config.goalLine.atlas, [config.goalLine.tile], southLine);

  /** Place an image so the centre of its visible pixels sits on a gameplay point. */
  const centred = (role: string, layer: ArenaLayerId, id: string, scale: number, simX: number, simY: number, frame?: number): void => {
    const asset = need(lookup, id);
    const frameSized = frame === undefined ? asset : { ...asset, width: TILE, height: TILE };
    const c = visibleCentre(frameSized);
    images.push({
      role,
      layer,
      asset: id,
      frame,
      x: Math.round(simX),
      y: sy(simY),
      originX: c.x / frameSized.width,
      originY: c.y / frameSized.height,
      scale,
    });
  };

  centred('centerCircle', 'markings', config.centerCircle.asset, config.centerCircle.scale, rink.centerX, rink.centerY);
  const spots = faceoffSpots(rink);
  for (const s of spots.endZone) {
    centred('faceoffCircle', 'markings', config.faceoffCircle.asset, config.faceoffCircle.scale, s.x, s.y);
    centred('faceoffMark', 'markings', config.faceoffMark.asset, config.faceoffMark.scale, s.x, s.y);
  }
  for (const s of spots.neutral) {
    centred('neutralDot', 'markings', config.neutralDot.atlas, 1, s.x, s.y, config.neutralDot.frame);
  }

  // Creases touch the centre-facing edge of their goal line and are centred on the goal mouth.
  const half = inkHeight(need(lookup, config.goalLine.atlas)) / 2;
  images.push({ role: 'creaseNorth', layer: 'markings', asset: config.creaseNorth.asset, x: rink.centerX, y: sy(northLine) + half, originX: 0.5, originY: 0, scale: config.creaseNorth.scale });
  images.push({ role: 'creaseSouth', layer: 'markings', asset: config.creaseSouth.asset, x: rink.centerX, y: sy(southLine) - half, originX: 0.5, originY: 1, scale: config.creaseSouth.scale });

  if (config.refereeCrease) {
    images.push({ role: 'refereeCrease', layer: 'markings', asset: config.refereeCrease.asset, x: rink.right, y: sy(rink.centerY), originX: 1, originY: 0.5, scale: config.refereeCrease.scale });
  }
  if (config.centerLogo) {
    centred('centerLogo', 'centerLogo', config.centerLogo.asset, config.centerLogo.scale, rink.centerX, rink.centerY);
  } else {
    centred('centerDot', 'markings', config.centerDot.asset, config.centerDot.scale, rink.centerX, rink.centerY);
  }

  // Straight boards run between the corner curves.
  const top = sy(rink.top + rink.cornerRadius);
  const bottom = sy(rink.bottom - rink.cornerRadius);
  const boards: BoardRun[] = [];
  const west = need(lookup, config.boards.west.asset);
  boards.push({ role: 'west', asset: west.id, x: rink.left - config.boards.west.iceBoundaryLocalX, y: top, height: bottom - top, flipX: false, provisional: false });
  if (config.boards.east) {
    const east = need(lookup, config.boards.east.asset);
    boards.push({
      role: 'east',
      asset: east.id,
      x: rink.right - (east.width - config.boards.east.iceBoundaryLocalX),
      y: top,
      height: bottom - top,
      flipX: true,
      provisional: true,
    });
  }

  return { grid, lines, images, boards };
}

export interface GoalAlignment {
  end: 'north' | 'south';
  /** Horizontal offset of the crease from the goal mouth centre, in pixels. 0 is centred. */
  offsetX: number;
  /** Gap between the crease and the goal line's ink, in pixels. 0 means they touch. */
  gapToLine: number;
  /** Distance from the goal line to the end of the ice, on screen. */
  lineToEndBoards: number;
}

/** Numbers behind the north and south goal alignment test. */
export function goalAlignment(rink: RinkGeometry, tilt: number, layout: ArenaLayout, lookup: Lookup): GoalAlignment[] {
  const result: GoalAlignment[] = [];
  const rows = layout.lines.filter((l) => l.role === 'goalLine');
  for (const end of ['north', 'south'] as const) {
    const crease = layout.images.find((i) => i.role === (end === 'north' ? 'creaseNorth' : 'creaseSouth'));
    const row = end === 'north' ? rows[0] : rows[1];
    if (!crease || !row) continue;
    const atlas = need(lookup, row.atlas);
    const inkTop = row.y + (atlas.bbox ? atlas.bbox[1] : 0);
    const inkBottom = row.y + (atlas.bbox ? atlas.bbox[3] + 1 : TILE);
    const lineY = screenY(rink, tilt, goalLineY(rink, end === 'north' ? 'top' : 'bottom'));
    result.push({
      end,
      offsetX: crease.x - rink.centerX,
      gapToLine: end === 'north' ? crease.y - inkBottom : inkTop - crease.y,
      lineToEndBoards: end === 'north' ? lineY - screenY(rink, tilt, rink.top) : screenY(rink, tilt, rink.bottom) - lineY,
    });
  }
  return result;
}
