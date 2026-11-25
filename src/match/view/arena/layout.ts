/**
 * Where every piece of the arena goes. Pure maths from the gameplay rink
 * geometry (the source of truth), the camera tilt and an arena config.
 * The renderer only draws what this module returns. No Phaser here.
 */
import { goalLineY } from '../../sim/rink';
import type { RinkGeometry } from '../../sim/rink';
import { projectY } from '../projection';
import { Rng, hashString } from '../../../core/rng';
import { worldScreenHeight } from '../projection';
import type { ArenaConfig, BenchSide, BenchTeam, BoardSide, GoalArt, GoalEnd, SideStructure } from './config';
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
  { id: 'stadium', label: 'Background stadium, seating and benches', depth: -70 },
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

/** A module repeated along a straight stretch of boards. */
export interface StripRun {
  role: string;
  layer: ArenaLayerId;
  /** Order within the layer: boards, then ads, then glass, then posts. */
  z: number;
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One image beside the ice: a corner, gate, ad or post. */
export interface BoardImage {
  role: string;
  layer: ArenaLayerId;
  z: number;
  asset: string;
  x: number;
  y: number;
  /** Show only the top-left part of the image, in pixels. */
  cropW?: number;
  cropH?: number;
  /** Draw this part of the asset (an atlas) instead of the whole image. */
  cell?: { x: number; y: number; width: number; height: number };
  /** Set on animated doors: `${side}:${board module index}`, the same id as the glass pane above it. */
  doorId?: string;
}

/** A bench player's spot. `x`,`y` is the top-left of the 16x16 frame. */
export interface BenchSpot {
  x: number;
  y: number;
  team: BenchTeam;
  variant: number;
  pose: 'seated' | 'standing';
}

/** A bench, penalty box or timekeeper booth, placed outside the side boards. */
export interface StructurePlacement {
  structure: SideStructure;
  x: number;
  y: number;
  /** Board module index of each door, counted from the north end of the straight run. */
  doorModules: number[];
  spots: BenchSpot[];
}

/** One pane of glass. Each has an id so its state (intact, cracked...) can be swapped. */
export interface GlassPanel extends BoardImage {
  id: string;
  side: BoardSide;
}

/** Where straight boards end and corners begin, on screen. */
export interface StraightExtents {
  /** North and south boards run between these x positions. */
  x0: number;
  x1: number;
  /** West and east boards run between these y positions. */
  y0: number;
  y1: number;
}

export interface ArenaLayout {
  grid: TileGrid;
  lines: LineRow[];
  images: ImagePlacement[];
  strips: StripRun[];
  boardImages: BoardImage[];
  glass: GlassPanel[];
  extents: StraightExtents;
  structures: StructurePlacement[];
  /** Structures the config asked for that do not fit on the straight boards at this tilt. */
  structuresSkipped: string[];
  stadium: StadiumLayout;
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

  const boards = layoutBoards(rink, tilt, config, lookup);
  return { grid, lines, images, ...boards, stadium: layoutStadium(rink, tilt, config, boards) };
}

/** Reach of the supplied corner modules, from their manifests: 37 px along the ends, 21 px along the sides. */
export const ART_CORNER = Object.freeze({ reachX: 37, reachY: 21, west: 19, east: 45, north: 19, south: 29 });
const MODULE = 32;
const Z = { board: 1, ad: 2, glass: 3, post: 4 };

/** Boards, corners, gates, ads, glass and posts around the ice. */
export function layoutBoards(
  rink: RinkGeometry,
  tilt: number,
  config: ArenaConfig,
  lookup: Lookup,
): Pick<ArenaLayout, 'strips' | 'boardImages' | 'glass' | 'extents' | 'structures' | 'structuresSkipped'> {
  const sy = (y: number): number => screenY(rink, tilt, y);
  const topS = sy(rink.top);
  const bottomS = sy(rink.bottom);
  const artCorners = config.corners.mode === 'art';
  const extents: StraightExtents = artCorners
    ? { x0: rink.left + ART_CORNER.reachX, x1: rink.right - ART_CORNER.reachX, y0: topS + ART_CORNER.reachY, y1: bottomS - ART_CORNER.reachY }
    : { x0: rink.left + rink.cornerRadius, x1: rink.right - rink.cornerRadius, y0: sy(rink.top + rink.cornerRadius), y1: sy(rink.bottom - rink.cornerRadius) };

  const strips: StripRun[] = [];
  const boardImages: BoardImage[] = [];
  const glass: GlassPanel[] = [];
  const layerOf = (side: BoardSide): ArenaLayerId => (side === 'south' ? 'frontBoards' : 'backBoards');

  // Top-left corner of each side's board module, from the boundary pixel its manifest names.
  const origin: Partial<Record<BoardSide, { x: number; y: number; asset: ArenaAsset }>> = {};
  for (const side of ['north', 'south', 'west', 'east'] as const) {
    const b = config.boards[side];
    if (!b) continue;
    const asset = need(lookup, b.asset);
    if (side === 'west') origin.west = { x: rink.left - b.boundary, y: extents.y0, asset };
    if (side === 'east') origin.east = { x: rink.right - 1 - b.boundary, y: extents.y0, asset };
    if (side === 'north') origin.north = { x: extents.x0, y: topS - b.boundary, asset };
    if (side === 'south') origin.south = { x: extents.x0, y: bottomS - b.boundary, asset };
  }

  // End boards: one strip each.
  for (const side of ['north', 'south'] as const) {
    const o = origin[side];
    if (!o) continue;
    strips.push({ role: `${side}Boards`, layer: layerOf(side), z: Z.board, asset: o.asset.id, x: o.x, y: o.y, width: extents.x1 - extents.x0, height: o.asset.height });
  }

  // Side boards: strips broken wherever a gate replaces a module.
  const gateRows: Record<'west' | 'east', Map<number, 'closed' | 'open'>> = { west: new Map(), east: new Map() };
  const sideLength = extents.y1 - extents.y0;

  // Benches, penalty boxes and the timekeeper stand against the outside edge of the side boards.
  // Each snaps along the boards so its doors replace whole board modules, and none may overlap.
  const structures: StructurePlacement[] = [];
  const structuresSkipped: string[] = [];
  const doorIds = new Set<string>();
  const area = config.benchArea;
  if (area) {
    const nextFree: Record<BenchSide, number> = { west: 0, east: 0 };
    for (const s of area.structures) {
      const o = origin[s.side];
      if (!o) continue;
      const ink = o.asset.bbox ?? [0, 0, o.asset.width - 1, o.asset.height - 1];
      const outside = s.side === 'west' ? o.x + ink[0] : o.x + ink[2];
      const door = s.doors[0] ?? 0;
      let top: number;
      if (s.follows) {
        top = nextFree[s.side];
      } else {
        top = Math.round((sy(s.at) - extents.y0 - s.height / 2 + door) / MODULE) * MODULE - door;
        while (top < nextFree[s.side]) top += MODULE;
      }
      if (top < 0 || top + s.height > sideLength) {
        structuresSkipped.push(`${s.kind}:${s.side}`);
        continue;
      }
      nextFree[s.side] = top + s.height;
      const x = outside - s.contact;
      const y = extents.y0 + top;
      const doorModules = s.doors.map((d) => (top + d) / MODULE);
      for (const k of doorModules) {
        gateRows[s.side].set(k, 'closed');
        doorIds.add(`${s.side}:${k}`);
      }
      const spots: BenchSpot[] = [];
      const [ax, ay] = area.players.anchor;
      for (const pose of ['seated', 'standing'] as const) {
        (pose === 'seated' ? s.seats : s.standing)?.forEach(([px, py], i) => {
          spots.push({ x: x + px - ax, y: y + py - ay, team: s.team ?? 'home', variant: i % area.players.variants, pose });
        });
      }
      structures.push({ structure: s, x, y, doorModules, spots });
    }
  }
  for (const gate of config.gates) {
    const k = Math.floor((sy(gate.at) - extents.y0) / MODULE);
    if (k >= 0 && (k + 1) * MODULE <= sideLength && !doorIds.has(`${gate.side}:${k}`)) gateRows[gate.side].set(k, gate.state);
  }
  for (const side of ['west', 'east'] as const) {
    const o = origin[side];
    if (!o) continue;
    let start = 0;
    const flush = (end: number): void => {
      if (end > start) {
        strips.push({ role: `${side}Boards`, layer: 'backBoards', z: Z.board, asset: o.asset.id, x: o.x, y: extents.y0 + start, width: o.asset.width, height: end - start });
      }
    };
    for (const k of [...gateRows[side].keys()].sort((a, b) => a - b)) {
      flush(k * MODULE);
      const state = gateRows[side].get(k) as 'closed' | 'open';
      const doorId = `${side}:${k}`;
      if (area && doorIds.has(doorId)) {
        // An animated door (batch 12.09) stands in for the static gate: same anchor, never both.
        const d = area.doors;
        boardImages.push({ role: `door:${side}`, layer: 'backBoards', z: Z.board, asset: d.atlas, x: o.x, y: extents.y0 + k * MODULE, doorId, cell: { x: 0, y: d.rows[side] * d.frameHeight, width: d.frameWidth, height: d.frameHeight } });
      } else {
        boardImages.push({ role: `gate:${side}:${state}`, layer: 'backBoards', z: Z.board, asset: `10.12/gate_${side}_${state}`, x: o.x, y: extents.y0 + k * MODULE });
      }
      start = (k + 1) * MODULE;
    }
    flush(sideLength);
  }

  // Supplied corners, only in the fit test: they do not follow the rink's real corner radius.
  if (artCorners) {
    const c = config.corners;
    boardImages.push({ role: 'corner:nw', layer: 'backBoards', z: Z.board, asset: c.nw, x: rink.left - ART_CORNER.west, y: topS - ART_CORNER.north });
    boardImages.push({ role: 'corner:ne', layer: 'backBoards', z: Z.board, asset: c.ne, x: rink.right - ART_CORNER.east, y: topS - ART_CORNER.north });
    boardImages.push({ role: 'corner:sw', layer: 'frontBoards', z: Z.board, asset: c.sw, x: rink.left - ART_CORNER.west, y: bottomS - ART_CORNER.south });
    boardImages.push({ role: 'corner:se', layer: 'frontBoards', z: Z.board, asset: c.se, x: rink.right - ART_CORNER.east, y: bottomS - ART_CORNER.south });
  }

  // Sponsor panels sit on the flat face of the end boards, clipped to it.
  for (const ad of config.boardAds) {
    const o = origin[ad.side];
    if (!o) continue;
    const art = need(lookup, ad.asset);
    const faceTop = ad.side === 'north' ? o.y + (o.asset.bbox?.[1] ?? 0) : o.y + (o.asset.bbox?.[3] ?? o.asset.height) + 1 - BOARD_FACE;
    const x = Math.round(Math.min(Math.max(ad.x - art.width / 2, extents.x0), extents.x1 - art.width));
    boardImages.push({ role: `ad:${ad.side}`, layer: layerOf(ad.side), z: Z.ad, asset: ad.asset, x, y: faceTop, cropW: art.width, cropH: Math.min(art.height, BOARD_FACE) });
  }

  // Glass panels and posts stand on the board cap along each straight run.
  if (config.glass) {
    for (const side of ['north', 'south', 'west', 'east'] as const) {
      const o = origin[side];
      if (!o) continue;
      const pane = need(lookup, config.glass.panels[side]);
      const post = need(lookup, config.glass.posts[side]);
      const ink = o.asset.bbox ?? [0, 0, o.asset.width - 1, o.asset.height - 1];
      const horizontal = side === 'north' || side === 'south';
      const length = horizontal ? extents.x1 - extents.x0 : sideLength;
      // The cap is the board's outer edge: its top row on the ends, its outermost column on the sides.
      const contact = GLASS_CONTACT[side];
      const postAnchor = POST_ANCHOR[side];
      const cap = side === 'north' || side === 'south' ? o.y + ink[1] : side === 'west' ? o.x + ink[0] : o.x + ink[2];
      const count = Math.ceil(length / MODULE);
      for (let k = 0; k < count; k++) {
        const along = k * MODULE;
        const remaining = Math.min(MODULE, length - along);
        const isOpenGate = !horizontal && gateRows[side as 'west' | 'east'].get(k) === 'open';
        if (!isOpenGate) {
          glass.push({
            id: `${side}:${k}`,
            side,
            role: 'glass',
            layer: layerOf(side),
            z: Z.glass,
            asset: pane.id,
            x: horizontal ? extents.x0 + along : cap - contact.x,
            y: horizontal ? cap - contact.y : extents.y0 + along,
            cropW: horizontal ? remaining : pane.width,
            cropH: horizontal ? pane.height : remaining,
          });
        }
        if (k > 0) {
          boardImages.push({
            role: `post:${side}`,
            layer: layerOf(side),
            z: Z.post,
            asset: post.id,
            x: horizontal ? extents.x0 + along - postAnchor.x : cap - postAnchor.x,
            y: horizontal ? cap - postAnchor.y : extents.y0 + along - postAnchor.y,
          });
        }
      }
    }
  }

  return { strips, boardImages, glass, extents, structures, structuresSkipped };
}

/** Height of the flat face of an end board, between its cap and its kickplate. */
const BOARD_FACE = 15;
/** Local pixel of each glass module that sits on the board cap (batch 10.09 manifest). */
const GLASS_CONTACT: Record<BoardSide, { x: number; y: number }> = { north: { x: 0, y: 14 }, south: { x: 0, y: 2 }, west: { x: 7, y: 0 }, east: { x: 1, y: 0 } };
/** Local pixel of each post that sits on the board cap at a panel seam (batch 10.10 manifest). */
const POST_ANCHOR: Record<BoardSide, { x: number; y: number }> = { north: { x: 4, y: 14 }, south: { x: 4, y: 1 }, west: { x: 7, y: 8 }, east: { x: 0, y: 8 } };

/** One 64x32 piece of the stands: seats or a flight of stairs. */
export interface StandModule {
  side: BenchSide;
  kind: 'seating' | 'stairs';
  asset: string;
  x: number;
  y: number;
}

/** One spectator. `x`,`y` is the seat anchor on screen; frames are centred on it. */
export interface Fan {
  side: BenchSide;
  x: number;
  y: number;
  /** 1-based art variant, kept for the fan's whole life so reactions match the still pose. */
  variant: number;
  frontRow: boolean;
}

export interface LampPlacement {
  end: GoalEnd;
  /** Top-left of the 16x16 lamp frame. */
  x: number;
  y: number;
}

export interface StadiumLayout {
  modules: StandModule[];
  fans: Fan[];
  /** Seats that are on screen, and seats the art has that fall outside the world. */
  seatsVisible: number;
  seatsOffWorld: number;
  lamps: LampPlacement[];
}

const STAND = { width: 64, height: 32 };

/**
 * Seating down both sides, outside the glass, in step with the board modules; a gap wherever a
 * bench, penalty box or the timekeeper stands. Who sits where comes from a seeded stream, so the
 * same arena always has the same crowd, and a fuller house only ever adds people.
 */
export function layoutStadium(rink: RinkGeometry, tilt: number, config: ArenaConfig, boards: Pick<ArenaLayout, 'strips' | 'glass' | 'extents' | 'structures'>): StadiumLayout {
  const result: StadiumLayout = { modules: [], fans: [], seatsVisible: 0, seatsOffWorld: 0, lamps: [] };
  const art = config.stadium;
  if (!art) return result;
  const worldH = worldScreenHeight(rink.worldHeight, tilt);
  const rng = new Rng(hashString(`crowd:${config.id}`));
  for (const side of ['west', 'east'] as const) {
    const run = boards.strips.find((s) => s.role === `${side}Boards`);
    if (!run) continue;
    const panes = boards.glass.filter((g) => g.side === side);
    // The stands start at the outside face of the glass, or of the boards where there is no glass.
    const x =
      side === 'west'
        ? Math.min(run.x, ...panes.map((p) => p.x)) - STAND.width
        : Math.max(run.x + run.width, ...panes.map((p) => p.x + (p.cropW ?? 0)));
    const taken = boards.structures.filter((p) => p.structure.side === side).map((p) => [p.y, p.y + p.structure.height] as const);
    const seats = rng.fork(side);
    let placed = 0;
    for (let k = Math.ceil(-boards.extents.y0 / MODULE); ; k++) {
      const y = boards.extents.y0 + k * MODULE;
      if (y + STAND.height > worldH) break;
      if (taken.some(([top, bottom]) => y < bottom && y + STAND.height > top)) continue;
      const stairs = placed % art.stairsEvery === Math.floor(art.stairsEvery / 2);
      placed++;
      result.modules.push({ side, kind: stairs ? 'stairs' : 'seating', asset: stairs ? art.stairs[side] : art.seating[side], x, y });
      if (stairs) continue;
      for (const [sx, sy] of art.seats[side]) {
        // Every seat draws from the stream, seen or not, so the crowd does not reshuffle if the world is widened.
        const roll = seats.next();
        const variant = seats.int(art.crowd.variants) + 1;
        const fx = x + sx;
        if (fx - 8 < 0 || fx + 8 > rink.worldWidth) {
          result.seatsOffWorld++;
          continue;
        }
        result.seatsVisible++;
        if (roll < config.crowdDensity) result.fans.push({ side, x: fx, y: y + sy, variant, frontRow: sx === art.frontRow[side] });
      }
    }
  }
  // Goal lamps: behind each net, against the outside of the end boards, as far out as the world allows.
  const north = boards.strips.find((s) => s.role === 'northBoards');
  const south = boards.strips.find((s) => s.role === 'southBoards');
  const [ax, ay] = art.lamp.anchor;
  if (north) result.lamps.push({ end: 'north', x: rink.centerX - ax, y: Math.max(north.y + 1, ay - 3) - ay });
  if (south) result.lamps.push({ end: 'south', x: rink.centerX - ax, y: Math.min(Math.floor(worldH), south.y + south.height + 10) - ay });
  return result;
}

/** Frame of a one-shot or repeated sequence at time `t` ms, or null once it has finished (or not begun). */
export function sequenceFrame(durations: readonly number[], loops: number, t: number): number | null {
  const total = durations.reduce((a, b) => a + b, 0);
  if (t < 0 || total <= 0 || t >= total * loops) return null;
  let rest = t % total;
  let frame = 0;
  while (frame < durations.length - 1 && rest >= (durations[frame] ?? 0)) rest -= durations[frame++] ?? 0;
  return frame;
}

export interface BenchReport {
  rows: { kind: string; side: BenchSide; top: number; bottom: number; doors: number; gapToNext: number | null }[];
  skipped: string[];
  ok: boolean;
}

/** Footprint check for the bench-side structures: on screen, off the ice, apart from each other, doors on board modules. */
export function benchReport(rink: RinkGeometry, layout: ArenaLayout): BenchReport {
  const rows: BenchReport['rows'] = [];
  let ok = layout.structuresSkipped.length === 0;
  for (const side of ['west', 'east'] as const) {
    const placed = layout.structures.filter((p) => p.structure.side === side).sort((a, b) => a.y - b.y);
    placed.forEach((p, i) => {
      const next = placed[i + 1];
      const bottom = p.y + p.structure.height;
      const gap = next ? next.y - bottom : null;
      const width = 48;
      const offIce = side === 'west' ? p.x + width <= rink.left : p.x >= rink.right;
      const inWorld = p.x >= 0 && p.x + width <= rink.worldWidth;
      const onRun = p.y >= layout.extents.y0 && bottom <= layout.extents.y1;
      const doorsOk = p.doorModules.every((k) => Number.isInteger(k));
      if (!offIce || !inWorld || !onRun || !doorsOk || (gap !== null && gap < 0)) ok = false;
      rows.push({ kind: p.structure.kind, side, top: p.y, bottom, doors: p.doorModules.length, gapToNext: gap });
    });
  }
  return { rows, skipped: [...layout.structuresSkipped], ok };
}

export interface GoalPlacement {
  end: GoalEnd;
  art: GoalArt;
  /** Top-left of the 48x32 goal module on screen. */
  x: number;
  y: number;
  /** Depth for y-sorting against skaters and the puck. */
  depth: number;
}

/**
 * Where the supplied goals go: the manifest's mouth anchor on the centre of the goal line.
 * The far (north) goal sorts at its goal line, so anyone in front of the line draws over it;
 * the near (south) goal sorts at its back edge, so it covers players behind it.
 */
export function layoutGoals(rink: RinkGeometry, tilt: number, config: ArenaConfig, lookup: Lookup): GoalPlacement[] {
  if (!config.goals) return [];
  const result: GoalPlacement[] = [];
  for (const end of ['north', 'south'] as const) {
    const art = config.goals[end];
    const asset = lookup(art.rest);
    if (!asset) continue;
    const lineY = screenY(rink, tilt, goalLineY(rink, end === 'north' ? 'top' : 'bottom'));
    const y = lineY - art.mouth[1];
    const back = asset.bbox ? y + asset.bbox[3] + 1 : y + asset.height;
    result.push({ end, art, x: rink.centerX - art.mouth[0], y, depth: end === 'north' ? lineY : back });
  }
  return result;
}

export interface GoalFit {
  end: GoalEnd;
  /** Opening between the drawn posts, and the net the puck actually collides with, in pixels. */
  artMouth: number;
  physicsMouth: number;
  /** How far the drawn goal and the physics net reach behind the goal line, on screen. */
  artDepth: number;
  physicsDepth: number;
  /** Clear ice left between the back of the drawn goal and the end of the playing surface, on screen. */
  clearBehind: number;
}

/** Size of the supplied goal art against the gameplay net. Reported, never corrected: physics is the source of truth. */
export function goalFit(rink: RinkGeometry, tilt: number, config: ArenaConfig, lookup: Lookup): GoalFit[] {
  return layoutGoals(rink, tilt, config, lookup).map((goal) => {
    const asset = need(lookup, goal.art.rest);
    const [, top, , bottom] = asset.bbox ?? [0, 0, asset.width - 1, asset.height - 1];
    const artDepth = goal.end === 'north' ? goal.art.mouth[1] - top : bottom - goal.art.mouth[1];
    const physicsDepth = Math.round(rink.netDepth * tilt);
    const toBoards = Math.round(rink.goalLineInset * tilt);
    return {
      end: goal.end,
      artMouth: goal.art.posts[1] - goal.art.posts[0],
      physicsMouth: rink.netHalfWidth * 2,
      artDepth,
      physicsDepth,
      clearBehind: toBoards - artDepth,
    };
  });
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
