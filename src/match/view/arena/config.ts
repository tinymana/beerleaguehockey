/**
 * Arena configurations. An arena is described by data: which supplied assets
 * fill which role, at what whole-number scale, and with which options. The
 * renderer hardcodes no artwork.
 *
 * Fields under "extension points" are placeholders for later customization
 * (ads, banners, crowd, prestige). They are carried in the config but not
 * drawn yet, and they do not authorize any career mechanics.
 */
export type BoardSide = 'north' | 'south' | 'west' | 'east';
export type GlassState = 'intact' | 'cracked' | 'shattered' | 'missing';
export type GoalEnd = 'north' | 'south';
/** `rest` is the normal goal. The others are supplied visual states; none of them changes scoring or collision. */
export type GoalState = 'rest' | 'scored' | 'ripple' | 'knockoff' | 'dislodged';

/** A one-shot animation supplied as a horizontal strip of equal frames. */
export interface GoalStrip {
  atlas: string;
  frameWidth: number;
  frameHeight: number;
  /** Where the 48x32 goal module sits inside each frame (from the batch manifest). */
  offset: readonly [number, number];
  /** Milliseconds per frame. The strip has as many frames as this has entries. */
  durations: readonly number[];
  /** True when the animation stays on its last frame instead of returning to rest. */
  hold: boolean;
}

export type BenchSide = 'west' | 'east';
export type BenchTeam = 'home' | 'away';
/** What the bench players are doing. `cheer` and `groan` are supplied loops; nothing in the game triggers them yet. */
export type BenchMood = 'empty' | 'seated' | 'standing' | 'cheer' | 'groan';

/** A bench, penalty box or timekeeper booth standing outside the side boards. */
export interface SideStructure {
  kind: 'bench' | 'penaltyBox' | 'timekeeper';
  side: BenchSide;
  /** Gameplay y the structure is centred near. It then snaps so each door lands on a whole board module. */
  at: number;
  /** True to butt against the structure before it on the same side instead of using `at`. */
  follows?: boolean;
  /** Layer images, back to front (from the batch manifest). */
  layers: readonly string[];
  /** Players are drawn after this many layers: over floor and seating, under the enclosure. */
  playersAfter: number;
  /** Local x that sits on the outside edge of the boards (boardContactLocalX in the manifest). */
  contact: number;
  height: number;
  /** Local y of the top of each 32 px door. The doors replace the board modules at those spots. */
  doors: readonly number[];
  team?: BenchTeam;
  seats?: readonly (readonly [number, number])[];
  standing?: readonly (readonly [number, number])[];
}

/** Sheets of 16x16 bench players: one column per variant; home in the top half, away in the bottom half. */
export interface BenchPlayers {
  seated: string;
  standing: string;
  cheer: { atlas: string; durations: readonly number[] };
  groan: { atlas: string; durations: readonly number[] };
  frame: number;
  variants: number;
  /** Local pixel of a player frame that sits on a seat or standing anchor. */
  anchor: readonly [number, number];
}

export interface BenchArea {
  structures: readonly SideStructure[];
  /** Animated doors (batch 12.09): one row per side, closed at frame 0 and open at the last frame. */
  doors: { atlas: string; frameWidth: number; frameHeight: number; durations: readonly number[]; rows: Record<BenchSide, number> };
  players: BenchPlayers;
  mood: BenchMood;
}

/** One goal: every number here is copied from the batch manifests, and a test checks they still agree. */
export interface GoalArt {
  rest: string;
  /** The module's local pixel that sits on the centre of the goal line. */
  mouth: readonly [number, number];
  /** Local x of the two post anchors. */
  posts: readonly [number, number];
  scored: string;
  ripple: GoalStrip;
  knockoff: GoalStrip;
  dislodged: GoalStrip;
}

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
  /** Straight board modules. `boundary` is the module's local pixel that sits on the ice boundary (from its manifest). */
  boards: Record<BoardSide, { asset: string; boundary: number } | null>;
  /**
   * Corner boards. 'stand-in' keeps code-drawn corners that follow the physics.
   * 'art' places the supplied corner modules at their own (smaller) radius: a fit test, not a playable arena.
   */
  corners: { mode: 'stand-in' | 'art'; nw: string; ne: string; sw: string; se: string };
  glass: { panels: Record<BoardSide, string>; posts: Record<BoardSide, string>; damageBatch: string } | null;
  /** Gates replace one side-board module each. `at` is a gameplay y position along the boards. */
  gates: { side: 'west' | 'east'; at: number; state: 'closed' | 'open' }[];
  /** Benches, penalty boxes and the timekeeper booth outside the side boards. Their doors are added to `gates`. */
  benchArea: BenchArea | null;
  /** Supplied goal nets. Null keeps the code-drawn stand-in nets, which are the size of the physics net. */
  goals: Record<GoalEnd, GoalArt> | null;
  /** Sponsor panels on the end boards. `x` is a gameplay x position for the panel's centre. */
  boardAds: { asset: string; side: 'north' | 'south'; x: number }[];
  // Extension points: carried, not yet drawn.
  banners: { kind: 'championship' | 'retired-jersey' | 'tournament'; label: string }[];
  crowdDensity: number;
  palette: string | null;
  divisionTier: number | null;
  prestigeTier: number | null;
}

const RIPPLE_MS = [65, 65, 65, 65, 65, 65, 65, 65];
const KNOCKOFF_MS = [80, 80, 80, 80, 80, 80, 80, 160];
const DISLODGED_MS = [60, 60, 60, 70, 80, 90, 100, 100];

const GOALS: Record<GoalEnd, GoalArt> = {
  north: {
    rest: '11.01/goal_north_empty_bottle',
    mouth: [24, 28],
    posts: [5, 42],
    scored: '11.03/goal_north_scored_bottle',
    ripple: { atlas: '11.07/goal_atlas', frameWidth: 48, frameHeight: 32, offset: [0, 0], durations: RIPPLE_MS, hold: false },
    knockoff: { atlas: '11.05/goal_atlas', frameWidth: 64, frameHeight: 48, offset: [8, 16], durations: KNOCKOFF_MS, hold: true },
    dislodged: { atlas: '11.09/goal_atlas', frameWidth: 64, frameHeight: 48, offset: [8, 8], durations: DISLODGED_MS, hold: true },
  },
  south: {
    rest: '11.02/goal_south_empty_bottle',
    mouth: [24, 3],
    posts: [5, 42],
    scored: '11.04/goal_south_scored_bottle',
    ripple: { atlas: '11.08/goal_atlas', frameWidth: 48, frameHeight: 32, offset: [0, 0], durations: RIPPLE_MS, hold: false },
    knockoff: { atlas: '11.06/goal_atlas', frameWidth: 64, frameHeight: 48, offset: [8, 0], durations: KNOCKOFF_MS, hold: true },
    dislodged: { atlas: '11.10/goal_atlas', frameWidth: 64, frameHeight: 48, offset: [8, 8], durations: DISLODGED_MS, hold: true },
  },
};

const SIX = [14, 26, 38, 50, 62, 74] as const;
const at = (x: number, ys: readonly number[]): [number, number][] => ys.map((y) => [x, y]);

/**
 * Proposal (ARENA.md A16): a bench each side at centre ice, a penalty box south of each bench,
 * and the timekeeper beside the east penalty box. The packages call every placement provisional.
 */
const BENCH_AREA: BenchArea = {
  structures: [
    { kind: 'bench', side: 'west', team: 'home', at: 440, layers: ['12.01/home_bench_floor', '12.01/home_bench_seating', '12.01/home_bench_enclosure'], playersAfter: 2, contact: 44, height: 96, doors: [0, 64], seats: at(18, SIX), standing: at(32, SIX) },
    { kind: 'penaltyBox', side: 'west', at: 564, layers: ['12.07/penalty_west'], playersAfter: 1, contact: 44, height: 48, doors: [8] },
    { kind: 'bench', side: 'east', team: 'away', at: 440, layers: ['12.02/away_bench_floor', '12.02/away_bench_seating', '12.02/away_bench_enclosure'], playersAfter: 2, contact: 3, height: 96, doors: [0, 64], seats: at(29, SIX), standing: at(15, SIX) },
    { kind: 'penaltyBox', side: 'east', at: 564, layers: ['12.07/penalty_east'], playersAfter: 1, contact: 4, height: 48, doors: [8] },
    { kind: 'timekeeper', side: 'east', at: 0, follows: true, layers: ['12.08/timekeeper_east'], playersAfter: 1, contact: 3, height: 48, doors: [] },
  ],
  doors: { atlas: '12.09/door_atlas', frameWidth: 24, frameHeight: 32, durations: [80, 80, 80, 80, 80], rows: { west: 0, east: 1 } },
  players: {
    seated: '12.03/seated_atlas',
    standing: '12.04/standing_atlas',
    cheer: { atlas: '12.05/celebration_atlas', durations: [120, 100, 140, 100] },
    groan: { atlas: '12.06/disappointment_atlas', durations: [100, 140, 240, 140] },
    frame: 16,
    variants: 6,
    anchor: [8, 8],
  },
  mood: 'seated',
};

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
    west: { asset: '10.01/west_board_module', boundary: 19 },
    east: { asset: '10.02/east_board_module', boundary: 4 },
    north: { asset: '10.03/north_board_module', boundary: 19 },
    south: { asset: '10.04/south_board_module', boundary: 5 },
  },
  corners: { mode: 'stand-in', nw: '10.05/nw_corner_module', ne: '10.06/ne_corner_module', sw: '10.07/sw_corner_module', se: '10.08/se_corner_module' },
  glass: {
    panels: { north: '10.09/glass_north', south: '10.09/glass_south', west: '10.09/glass_west', east: '10.09/glass_east' },
    posts: { north: '10.10/glass_post_north', south: '10.10/glass_post_south', west: '10.10/glass_post_west', east: '10.10/glass_post_east' },
    damageBatch: '10.14',
  },
  // Doors now come from the benches and penalty boxes; no free-standing gates.
  gates: [],
  benchArea: BENCH_AREA,
  // Supplied goals at native size. They are larger than the physics net: see goalFit() and ARENA.md A13.
  goals: GOALS,
  // Both names are approved Puck Falls locations.
  boardAds: [
    { asset: '10.13/ad_penalty_box', side: 'north', x: 240 },
    { asset: '10.13/ad_top_shelf', side: 'south', x: 240 },
  ],
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
    description: 'Exactly what has been delivered and fits. No stand-ins, so the corners and stands show as gaps.',
    standIns: false,
  },
  {
    ...STANDARD,
    id: 'corner-fit-test',
    name: 'Corner art fit test',
    description: 'Places the supplied corner boards at their own radius. Turn on Collision geometry to see how far they sit from the corners the puck actually follows. Not a playable arena.',
    corners: { ...STANDARD.corners, mode: 'art' },
    benchArea: null,
    gates: [{ side: 'west', at: 440, state: 'open' }, { side: 'east', at: 440, state: 'open' }],
  },
  {
    ...STANDARD,
    id: 'practice-sheet',
    name: 'Practice sheet',
    description: 'A plainer rink from the same parts: no logo, no light pools, faded blue lines, worn goal lines, and the stand-in nets (the size of the physics net) for comparison.',
    goals: null,
    reflections: { ...STANDARD.reflections, enabled: false },
    blueLine: { ...STANDARD.blueLine, tile: 3 },
    goalLine: { ...STANDARD.goalLine, tile: 2 },
    centerLine: { ...STANDARD.centerLine, pattern: [0] },
    centerLogo: null,
    glass: null,
    gates: [],
    benchArea: null,
    boardAds: [{ asset: '10.13/ad_blank', side: 'north', x: 240 }],
  },
];

export function arenaConfig(id: string): ArenaConfig {
  return ARENA_CONFIGS.find((c) => c.id === id) ?? STANDARD;
}

export const DEFAULT_ARENA_ID = STANDARD.id;
