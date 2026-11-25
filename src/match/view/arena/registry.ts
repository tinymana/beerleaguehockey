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

export type AssetRole = 'atlas' | 'tile' | 'composite' | 'module';

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
  hash: string;
  tileIndex?: number;
  columns?: number;
  rows?: number;
  duplicateOf?: string;
}

export type SlotStatus = 'supplied' | 'provisional' | 'missing';

export interface ArenaSlot {
  id: string;
  layer: string;
  label: string;
  expectedBatch: string;
  assets: string[];
  status: SlotStatus;
  note?: string;
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

export function assetById(registry: ArenaRegistry, id: string): ArenaAsset | undefined {
  return registry.assets.find((a) => a.id === id);
}

export function assetUrl(asset: ArenaAsset): string {
  return ARENA_BASE_URL + asset.file;
}

/**
 * Assets the renderer loads as textures. Single 8x8 tile files are skipped:
 * the same pixels are already inside their batch's atlas.
 */
export function loadableAssets(registry: ArenaRegistry): ArenaAsset[] {
  return registry.assets.filter((a) => a.role !== 'tile');
}

/** Centre of an asset's visible pixels, in its own pixel coordinates. */
export function visibleCentre(asset: ArenaAsset): { x: number; y: number } {
  if (!asset.bbox) return { x: asset.width / 2, y: asset.height / 2 };
  const [l, t, r, b] = asset.bbox;
  return { x: (l + r + 1) / 2, y: (t + b + 1) / 2 };
}
