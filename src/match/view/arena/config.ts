/**
 * Arena configurations. An arena is described by data: which supplied assets
 * fill which role, at what whole-number scale, and with which options. The
 * renderer hardcodes no artwork.
 *
 * Fields under "extension points" are placeholders for later customization
 * (ads, banners, crowd, prestige). They are carried in the config but not
 * drawn yet, and they do not authorize any career mechanics.
 */
export interface ScaledAsset {
  asset: string;
  /** Whole-number scale. 1 is the art's native size. */
  scale: number;
}

export interface ArenaConfig {
  id: string;
  name: string;
  description: string;
  /** Draw labeled temporary stand-ins where art has not been supplied (boards ends, nets, stands). */
  standIns: boolean;
  baseIce: { atlas: string; tile: number };
  scratches: { atlas: string; intensity: number };
  /** `tiles` is the vertical run of atlas indices that makes one light, top to bottom. */
  reflections: { atlas: string; enabled: boolean; alpha: number; everyCols: number; everyRows: number; tiles: number[] };
  centerLine: { atlas: string; pattern: number[] };
  blueLine: { atlas: string; tile: number };
  goalLine: { atlas: string; tile: number };
  faceoffCircle: ScaledAsset;
  centerCircle: ScaledAsset;
  faceoffMark: ScaledAsset;
  neutralDot: { atlas: string; frame: number };
  creaseNorth: ScaledAsset;
  creaseSouth: ScaledAsset;
  refereeCrease: ScaledAsset | null;
  /** Null shows the plain centre dot instead of a logo. */
  centerLogo: ScaledAsset | null;
  centerDot: ScaledAsset;
  boards: {
    west: { asset: string; iceBoundaryLocalX: number };
    /** Mirrored west module until east boards are supplied. */
    east: { asset: string; iceBoundaryLocalX: number; mirrored: true } | null;
  };
  // Extension points: carried, not yet drawn.
  boardAds: string[];
  banners: { kind: 'championship' | 'retired-jersey' | 'tournament'; label: string }[];
  crowdDensity: number;
  palette: string | null;
  divisionTier: number | null;
  prestigeTier: number | null;
}

const STANDARD: ArenaConfig = {
  id: 'standard',
  name: 'Standard rink',
  description: 'All supplied art, with labeled stand-ins where art is still missing.',
  standIns: true,
  baseIce: { atlas: '09.01/ice_tileset_4x4', tile: 0 },
  scratches: { atlas: '09.02/ice_scratch_atlas', intensity: 1 },
  // One light: a streak of three 'centre' tiles fading down the ice (atlas indices 2, 1, 0).
  reflections: { atlas: '09.03/light_reflections_atlas', enabled: true, alpha: 0.45, everyCols: 10, everyRows: 9, tiles: [2, 1, 0] },
  centerLine: { atlas: '09.04/center_line_atlas', pattern: [1, 2] },
  blueLine: { atlas: '09.05/blue_line_atlas', tile: 0 },
  goalLine: { atlas: '09.06/goal_line_atlas', tile: 0 },
  // The supplied circles are 32 px wide; the game's circles are 120 px (15 ft radius at 4 px per foot).
  // 4x lands exactly on the gameplay width. See the open issue in ASSET_MANIFEST.md.
  faceoffCircle: { asset: '09.07/faceoff_circle', scale: 4 },
  centerCircle: { asset: '09.09/center_circle', scale: 4 },
  faceoffMark: { asset: '09.08/faceoff_mark', scale: 1 },
  neutralDot: { atlas: '09.08/faceoff_hash_atlas', frame: 0 },
  creaseNorth: { asset: '09.10/crease_north', scale: 1 },
  creaseSouth: { asset: '09.11/crease_south', scale: 1 },
  refereeCrease: { asset: '09.12/referee_crease_east', scale: 2 },
  centerLogo: { asset: '09.13/center_logo', scale: 2 },
  centerDot: { asset: '09.09/center_dot', scale: 1 },
  boards: {
    west: { asset: '10.01/west_board_module', iceBoundaryLocalX: 19 },
    east: { asset: '10.01/west_board_module', iceBoundaryLocalX: 19, mirrored: true },
  },
  boardAds: [],
  banners: [],
  crowdDensity: 0,
  palette: null,
  divisionTier: null,
  prestigeTier: null,
};

export const ARENA_CONFIGS: readonly ArenaConfig[] = [
  STANDARD,
  {
    ...STANDARD,
    id: 'supplied-only',
    name: 'Supplied art only',
    description: 'Exactly what has been delivered. No stand-ins and no mirrored east boards, so gaps show.',
    standIns: false,
    boards: { ...STANDARD.boards, east: null },
  },
  {
    ...STANDARD,
    id: 'practice-sheet',
    name: 'Practice sheet',
    description: 'A plainer rink from the same parts: no logo, no light pools, faded blue lines, worn goal lines.',
    reflections: { ...STANDARD.reflections, enabled: false },
    blueLine: { ...STANDARD.blueLine, tile: 3 },
    goalLine: { ...STANDARD.goalLine, tile: 2 },
    centerLine: { ...STANDARD.centerLine, pattern: [0] },
    centerLogo: null,
  },
];

export function arenaConfig(id: string): ArenaConfig {
  return ARENA_CONFIGS.find((c) => c.id === id) ?? STANDARD;
}

export const DEFAULT_ARENA_ID = STANDARD.id;
