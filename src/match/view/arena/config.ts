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

/** What the crowd can be asked to do. All of it is supplied animation; none of it affects play. */
export type CrowdReaction = 'cheer' | 'goal' | 'bang' | 'drink' | 'heckle';
export type CrowdPose = 'seated' | 'standing';

/**
 * One crowd animation. Frames are separate registry assets named
 * `${batch}/${name}_${side}_${variant}_${frame}` (two digits each), drawn from the batch atlas.
 */
export interface CrowdReactionArt {
  batch: string;
  name: string;
  /** Frame size in pixels; the frame's centre sits on the seat anchor. */
  size: number;
  durations: readonly number[];
  /** Times the sequence plays before the fan settles again. */
  loops: number;
  /** Largest start delay, so the crowd does not move as one. */
  stagger: number;
  /** Only fans in the row against the glass take part. */
  frontRowOnly?: boolean;
}

/** Side seating, the crowd in it, and the goal lamps. */
export interface StadiumArt {
  /** One 64x32 module per side, repeated down the outside of the glass. */
  seating: Record<BenchSide, string>;
  /** Replaces every `stairsEvery`-th seating module. */
  stairs: Record<BenchSide, string>;
  stairsEvery: number;
  /** Seat anchors inside a seating module, from the manifest. */
  seats: Record<BenchSide, readonly (readonly [number, number])[]>;
  /** Local x of the seats in the row against the glass. */
  frontRow: Record<BenchSide, number>;
  crowd: {
    /** `${seated}_${side}_${variant}` and `${standing}_${side}_${variant}` are the still poses. */
    seated: string;
    standing: string;
    variants: number;
    reactions: Record<CrowdReaction, CrowdReactionArt>;
    /** Seconds between one fan somewhere taking a sip, chosen at random in this range. 0 turns it off. */
    sipEvery: readonly [number, number];
  };
  /** Goal lamp behind each net: `${frames}_${frame}`. Frame 0 is idle; the rest loop for `flashMs` on a goal. */
  lamp: { frames: string; count: number; frameMs: number; flashMs: number; anchor: readonly [number, number] };
}

/**
 * Batch 14 equipment. Nothing here is drawn in play yet: each piece waits on a system
 * (intermissions, stick breaks, a match clock) or on room in the world. The Lab tests use it.
 */
export interface EquipmentArt {
  /** Ice resurfacer: `${frames}_${palette}_${direction}`, 48x48, centred. */
  resurfacer: { frames: string; palette: number; trail: string; size: number; laneWidth: number; speed: number };
  /** Rink debris, 32x32 each, centred. */
  debris: readonly string[];
  /** Soft light pool for the ice, 64x64, centred. */
  lightGlow: string;
  /** Scoreboard states: `${frames}_${state}`. Fields are [x, y, width, height] inside the 128x64 board. */
  scoreboard: { frames: string; states: readonly string[]; fields: Record<'homeScore' | 'awayScore' | 'clock' | 'period', readonly [number, number, number, number]> };
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

/**
 * One goal drawn at the gameplay scale (`ART_BRIEF.md` section 11): a 40x32 sprite per frame,
 * placed by a fixed anchor. Not part of the batch registry: these files are loaded by name.
 */
export interface ScaleGoalArt {
  rest: string;
  /** The sprite's local pixel that sits on the centre of the goal line. */
  anchor: readonly [number, number];
  /** Local x of the first column of each red post. */
  posts: readonly [number, number];
  /** Last drawn row, for sorting the near goal over players behind it. */
  lastRow: number;
  /** Ripple frames in playing order; the goal returns to `rest` afterwards. */
  ripple: readonly string[];
}

export interface ScaleGoals {
  /** Folder under the public assets, with a trailing slash. */
  folder: string;
  /** Sprite size, checked at ingest. */
  size: readonly [number, number];
  rippleMs: number;
  north: ScaleGoalArt;
  south: ScaleGoalArt;
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
  /** Side seating, crowd and goal lamps. How full the seats are is `crowdDensity`. */
  stadium: StadiumArt | null;
  equipment: EquipmentArt | null;
  /** Supplied goal nets. Null keeps the code-drawn stand-in nets, which are the size of the physics net. */
  goals: Record<GoalEnd, GoalArt> | null;
  /** Goals drawn at the gameplay scale. Used wherever `goals` is null; null here too keeps the stand-in nets. */
  scaleGoals: ScaleGoals | null;
  /** Sponsor panels on the end boards. `x` is a gameplay x position for the panel's centre. */
  boardAds: { asset: string; side: 'north' | 'south'; x: number }[];
  // Extension points: carried, not yet drawn.
  banners: { kind: 'championship' | 'retired-jersey' | 'tournament'; label: string }[];
  /** Share of the visible seats that are taken, 0 to 1. Drawn when the arena has a `stadium`. */
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

/**
 * The first goals delivered at the 32 px scale (received Nov 26). Base art, in the game for evaluation:
 * a dark outline makes them read 38 px wide with a 30 px opening while the puck still scores across 32.
 */
export const SCALE_GOALS: ScaleGoals = {
  folder: 'goals/32/',
  size: [40, 32],
  rippleMs: 65,
  north: {
    rest: 'goal_north',
    anchor: [20, 30],
    posts: [2, 36],
    lastRow: 30,
    ripple: ['goal_north_ripple_01', 'goal_north_ripple_02', 'goal_north_ripple_03', 'goal_north_ripple_04'],
  },
  south: {
    rest: 'goal_south',
    anchor: [20, 16],
    posts: [2, 36],
    lastRow: 30,
    ripple: ['goal_south_ripple_01', 'goal_south_ripple_02', 'goal_south_ripple_03', 'goal_south_ripple_04'],
  },
};

/** Every file a set of scale goals needs, without the extension. */
export function scaleGoalFiles(goals: ScaleGoals): string[] {
  return [goals.north.rest, ...goals.north.ripple, goals.south.rest, ...goals.south.ripple];
}

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

const STADIUM: StadiumArt = {
  // Proposal (ARENA.md A20): blue seats on the home (west) side, red on the away (east) side, to match the benches.
  seating: { west: '13.01/seating_west_blue', east: '13.01/seating_east_red' },
  stairs: { west: '13.02/stairs_west', east: '13.02/stairs_east' },
  stairsEvery: 5,
  seats: {
    west: [[8, 8], [8, 24], [24, 8], [24, 24], [40, 8], [40, 24], [56, 8], [56, 24]],
    east: [[55, 8], [55, 24], [39, 8], [39, 24], [23, 8], [23, 24], [7, 8], [7, 24]],
  },
  frontRow: { west: 56, east: 7 },
  crowd: {
    seated: '13.04/seated',
    standing: '13.05/standing',
    variants: 12,
    reactions: {
      cheer: { batch: '13.06', name: 'cheer', size: 16, durations: [100, 120, 160, 120], loops: 3, stagger: 250 },
      goal: { batch: '13.11', name: 'goal_celebrate', size: 24, durations: [100, 90, 130, 100, 110, 170], loops: 3, stagger: 250 },
      bang: { batch: '13.07', name: 'bang', size: 16, durations: [120, 100, 80, 120], loops: 2, stagger: 300, frontRowOnly: true },
      drink: { batch: '13.08', name: 'drink', size: 16, durations: [400, 180, 650, 180, 400], loops: 1, stagger: 1500 },
      heckle: { batch: '13.09', name: 'heckle', size: 16, durations: [150, 100, 160, 100], loops: 2, stagger: 300 },
    },
    sipEvery: [1.5, 5],
  },
  lamp: { frames: '13.15/goal_lamp', count: 8, frameMs: 125, flashMs: 3000, anchor: [8, 14] },
};

const EQUIPMENT: EquipmentArt = {
  resurfacer: { frames: '14.01/zamboni', palette: 0, trail: '14.01/resurfacing_trail', size: 48, laneWidth: 26, speed: 260 },
  debris: ['broken_shaft', 'broken_blade', 'wood_splinters', 'composite_fragments', 'loose_tape', 'ice_shavings', 'discarded_glove', 'crushed_cup'].map((n) => `14.08/${n}`),
  lightGlow: '14.07/light_glow',
  scoreboard: {
    frames: '14.06/scoreboard',
    states: ['normal', 'goal', 'intermission', 'final'],
    fields: { homeScore: [11, 38, 24, 11], awayScore: [93, 38, 24, 11], clock: [43, 29, 42, 11], period: [50, 45, 28, 9] },
  },
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
  // The supplied creases were drawn for a 24 px net. At the 32 px net (Decision 80) neither whole-number size fits: twice
  // their size is the nearer one, and is used until the crease is redrawn.
  creaseNorth: { asset: '09.10/crease_north', scale: 2 },
  creaseSouth: { asset: '09.11/crease_south', scale: 2 },
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
  stadium: STADIUM,
  equipment: EQUIPMENT,
  // Decision 34: the gameplay net keeps its size and the goal art is being redrawn to fit it.
  // The batch 11 goals stay out; the goals delivered at the 32 px scale are drawn instead (stand-in nets if a file is missing).
  goals: null,
  scaleGoals: SCALE_GOALS,
  // Both names are approved Puck Falls locations.
  boardAds: [
    { asset: '10.13/ad_penalty_box', side: 'north', x: 240 },
    { asset: '10.13/ad_top_shelf', side: 'south', x: 240 },
  ],
  banners: [],
  // Proposal: a bit over half full, like a decent Tuesday night.
  crowdDensity: 0.55,
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
    description: 'Exactly what has been delivered and fits. No stand-ins, so the corners, nets and end stands show as gaps.',
    standIns: false,
  },
  {
    ...STANDARD,
    id: 'corner-fit-test',
    name: 'Corner art fit test',
    description: 'Places the supplied corner boards at their own radius. Turn on Collision geometry to see how far they sit from the corners the puck actually follows. Not a playable arena.',
    corners: { ...STANDARD.corners, mode: 'art' },
    benchArea: null,
    stadium: null,
    gates: [{ side: 'west', at: 440, state: 'open' }, { side: 'east', at: 440, state: 'open' }],
  },
  {
    ...STANDARD,
    id: 'goal-fit-test',
    name: 'Goal art fit test',
    description: 'Places the supplied batch 11 goals, which are larger than the gameplay net and are being redrawn. Turn on Collision geometry to compare. Goal state buttons work here. Not a playable arena.',
    goals: GOALS,
    scaleGoals: null,
  },
  {
    ...STANDARD,
    id: 'practice-sheet',
    name: 'Practice sheet',
    description: 'A plainer rink from the same parts: no logo, no light pools, faded blue lines, worn goal lines, no benches or stands.',
    reflections: { ...STANDARD.reflections, enabled: false },
    blueLine: { ...STANDARD.blueLine, tile: 3 },
    goalLine: { ...STANDARD.goalLine, tile: 2 },
    centerLine: { ...STANDARD.centerLine, pattern: [0] },
    centerLogo: null,
    glass: null,
    gates: [],
    benchArea: null,
    stadium: null,
    crowdDensity: 0,
    boardAds: [{ asset: '10.13/ad_blank', side: 'north', x: 240 }],
  },
];

export function arenaConfig(id: string): ArenaConfig {
  return ARENA_CONFIGS.find((c) => c.id === id) ?? STANDARD;
}

export const DEFAULT_ARENA_ID = STANDARD.id;
