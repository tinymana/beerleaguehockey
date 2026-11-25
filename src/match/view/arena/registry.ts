/**
 * The arena asset registry: one JSON file, written by
 * `scripts/art/ingest_arena.py`, that lists every supplied arena asset, what
 * it is, and what is still missing. The game and the Arena Asset Lab load
 * art only through this registry. Types and helpers only: no Phaser here.
 */
export const ARENA_BASE_URL = 'assets/arena/';
export const REGISTRY_URL = `${ARENA_BASE_URL}manifests/registry.json`;
export const REGISTRY_KEY = 'arena-registry';
export const TILE = 8;

/** `frame`: one animation frame supplied as its own file; the same pixels sit in a strip named by `atlas`. */
export type AssetRole = 'atlas' | 'tile' | 'frame' | 'composite' | 'module';

export interface ArenaAsset {
  id: string;
  batch: string;
  name: string;
  /** Path under ARENA_BASE_URL. */
  file: string;
  width: number;
  height: number;
  role: AssetRole;
  alpha: 'opaque' | 'binary' | 'soft';
  /** Bounds of the visible pixels: [left, top, right, bottom], inclusive. Null when empty. */
  bbox: [number, number, number, number] | null;
  /** Pixel hash. Left out for single tiles. */
  hash?: string;
  tileIndex?: number;
  /** Registry id of the strip an animation frame is drawn from. */
  atlas?: string;
  /** Pixel position of a single tile or frame inside its atlas, when it was found there. */
  atlasX?: number;
  atlasY?: number;
  columns?: number;
  rows?: number;
  duplicateOf?: string;
}

/** `unfit`: art arrived but cannot be used as drawn (for example, the wrong size for the rink). */
export type SlotStatus = 'supplied' | 'provisional' | 'unfit' | 'missing';

export interface ArenaSlot {
  id: string;
  layer: string;
  label: string;
  expectedBatch: string;
  assets: string[];
  status: SlotStatus;
  note?: string;
  unfit?: string;
}

export interface ArenaIssue {
  level: 'error' | 'warn' | 'info';
  batch: string | null;
  asset: string | null;
  message: string;
}

export interface ArenaBatch {
  package: string;
  category: string;
  notes: string | null;
  manifest: string;
  name: string | null;
  assetCount: number;
}

export interface ArenaRegistry {
  generatedBy: string;
  tileSize: number;
  batches: Record<string, ArenaBatch>;
  assets: ArenaAsset[];
  slots: ArenaSlot[];
  issues: ArenaIssue[];
}

const INDEX = new WeakMap<ArenaRegistry, Map<string, ArenaAsset>>();

export function assetById(registry: ArenaRegistry, id: string): ArenaAsset | undefined {
  let index = INDEX.get(registry);
  if (!index) {
    index = new Map(registry.assets.map((a) => [a.id, a]));
    INDEX.set(registry, index);
  }
  return index.get(id);
}

export function assetUrl(asset: ArenaAsset): string {
  return ARENA_BASE_URL + asset.file;
}

/**
 * Assets the renderer loads as textures. Single 8x8 tile files and single
 * animation frames are skipped: the same pixels are already inside an atlas.
 */
export function loadableAssets(registry: ArenaRegistry): ArenaAsset[] {
  return registry.assets.filter((a) => a.role !== 'tile' && a.role !== 'frame' && !a.duplicateOf);
}

/**
 * Texture key for an asset. Files with identical pixels share one texture:
 * a module that duplicates its batch atlas is drawn from the atlas.
 */
export function textureKey(registry: ArenaRegistry, id: string): string {
  return assetById(registry, id)?.duplicateOf ?? id;
}

export interface TextureSource {
  /** Key of the loaded texture that holds the pixels. */
  key: string;
  /** The part of that texture to draw. Absent means the whole image. */
  cell?: { x: number; y: number; width: number; height: number };
}

/**
 * Where an asset's pixels are actually loaded from: its own file, the file it
 * duplicates, or its cell of an atlas (single frames are never loaded on their own).
 */
export function textureSource(registry: ArenaRegistry, id: string): TextureSource {
  const asset = assetById(registry, id);
  if (!asset) return { key: id };
  if (asset.role === 'frame' && asset.atlas && asset.atlasX !== undefined && asset.atlasY !== undefined) {
    return { key: textureKey(registry, asset.atlas), cell: { x: asset.atlasX, y: asset.atlasY, width: asset.width, height: asset.height } };
  }
  if (asset.duplicateOf && asset.duplicateOf !== id) return textureSource(registry, asset.duplicateOf);
  return { key: id };
}

/** Centre of an asset's visible pixels, in its own pixel coordinates. */
export function visibleCentre(asset: ArenaAsset): { x: number; y: number } {
  if (!asset.bbox) return { x: asset.width / 2, y: asset.height / 2 };
  const [l, t, r, b] = asset.bbox;
  return { x: (l + r + 1) / 2, y: (t + b + 1) / 2 };
}
