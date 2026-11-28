/**
 * Season mode (Decision 102): a short league season with a schedule, standings, player statistics and playoffs.
 * Pure data and arithmetic: no Phaser, no DOM, no clock. Everything random comes from seeded named streams.
 *
 * The save holds the teams, the schedule and each game's result, and nothing else. Standings and player statistics
 * are worked out from the results every time they are asked for, so a result recorded twice cannot be counted twice.
 * Team names and colours are labelled placeholders, and every number here is a starting value, not approved balance.
 */
import { Rng } from '../core/rng';
import type { Ratings } from './attributes';
import type { CreatedPlayer } from './createdPlayer';
import { startingAttributes } from './dna';
import { randomName } from './names';
import { PICKUP_ROSTER, portraitOf } from './pickupRoster';

export const SEASON_VERSION = 1;

export const SEASON = {
  /** Each team plays every other team home and away. */
  meetings: 2,
  playoffTeams: 4,
  points: { win: 2, overtimeLoss: 1, loss: 0 },
  /** Skaters a side, then one goalie: C, LW, RW, LD, RD, G. */
  skaters: 5,
  /** Where a created player goes on his team. */
  place: { forward: 0, defense: 3, goalie: 5 } as const,
  /** A team's skaters are rated around its own level; levels are spread evenly over this range, in a seeded order. */
  teamLevels: [25, 35] as const,
  /** Each rating is the team's level plus or minus this. */
  ratingSpread: 7,
  /** A simulated game: goals a team scores on average, and how much a rating point of difference moves that. */
  simGoals: 4,
  simPerPoint: 0.035,
  /** The most assists counted on one simulated goal, and the chance of each. */
  simAssist: [0.75, 0.45] as const,
};

/** Placeholder teams (not approved): plain colour names until the creative director supplies identities. */
export const PLACEHOLDER_TEAMS: readonly { name: string; abbr: string; colour: number }[] = [
  { name: 'Reds', abbr: 'RED', colour: 0xd8343c },
  { name: 'Blues', abbr: 'BLU', colour: 0x2f6fe0 },
  { name: 'Greens', abbr: 'GRN', colour: 0x2e9a57 },
  { name: 'Golds', abbr: 'GLD', colour: 0xffc83a },
  { name: 'Blacks', abbr: 'BLK', colour: 0x30343f },
  { name: 'Whites', abbr: 'WHT', colour: 0xe8eef6 },
];

export interface SeasonPlayer {
  number: number;
  first: string;
  last: string;
  /** A place on the 24-face portrait sheet. */
  face: number;
  /** Empty for a goalie: goalie ratings are not used on the ice yet. */
  ratings: Ratings;
  createdId?: number;
}

export interface SeasonTeam {
  id: number;
  name: string;
  abbr: string;
  colour: number;
  /** C, LW, RW, LD, RD, G. */
  players: SeasonPlayer[];
}

/** A goal in a result: who scored and who helped, as places on that team's player list. */
export interface ResultGoal {
  team: 'home' | 'away';
  scorer: number;
  assists: number[];
}

export interface GameResult {
  /** Goals in regulation and overtime. A shootout adds one to the winner here, as hockey scores it. */
  home: number;
  away: number;
  /** How it was decided. */
  decided: 'regulation' | 'overtime' | 'shootout';
  goals: ResultGoal[];
  /** Whether the player played it or it was simulated. */
  played: boolean;
}

export type GameStage = 'regular' | 'semifinal' | 'final';

export interface SeasonGame {
  id: number;
  stage: GameStage;
  /** 1 to rounds for the regular season; 1 for semifinals, 2 for the final. */
  round: number;
  home: number;
  away: number;
  result: GameResult | null;
}

export interface SeasonState {
  version: number;
  seed: number;
  teams: SeasonTeam[];
  games: SeasonGame[];
  /** The team the player plays for. */
  userTeam: number;
  /** The created player on that team, if there is one. */
  createdId: number | null;
}

export interface StandingRow {
  team: number;
  played: number;
  wins: number;
  losses: number;
  overtimeLosses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ScorerRow {
  team: number;
  player: number;
  played: number;
  goals: number;
  assists: number;
  points: number;
}

/** Rounds in a regular season of `teams` teams. */
export const regularRounds = (teams: number): number => (teams - 1) * SEASON.meetings;

/** A round robin by the circle method: every team plays once a round; the second half swaps home and away. */
export function makeSchedule(teams: number): { round: number; home: number; away: number }[] {
  const ring = Array.from({ length: teams }, (_, i) => i);
  const out: { round: number; home: number; away: number }[] = [];
  const half = teams - 1;
  for (let r = 0; r < half; r++) {
    for (let i = 0; i < teams / 2; i++) {
      const a = ring[i] as number;
      const b = ring[teams - 1 - i] as number;
      // Alternate who is at home so nobody has a long run either way.
      const [home, away] = (r + i) % 2 === 0 ? [a, b] : [b, a];
      for (let m = 0; m < SEASON.meetings; m++) out.push({ round: r + 1 + m * half, home: m % 2 === 0 ? home : away, away: m % 2 === 0 ? away : home });
    }
    // Hold the first team, turn the rest.
    ring.splice(1, 0, ring.pop() as number);
  }
  return out.sort((x, y) => x.round - y.round);
}

function makeTeam(id: number, level: number, rng: Rng, names: Set<string>): SeasonTeam {
  const look = PLACEHOLDER_TEAMS[id] ?? { name: `Team ${id + 1}`, abbr: `T${id + 1}`, colour: 0x888888 };
  const players: SeasonPlayer[] = [];
  const numbers = new Set<number>();
  const faces = new Set<number>();
  for (let i = 0; i <= SEASON.skaters; i++) {
    const goalie = i === SEASON.skaters;
    let number = goalie ? (PICKUP_ROSTER.goalieNumbers.find((n) => !numbers.has(n)) ?? 1) : 0;
    while (!goalie && (number === 0 || numbers.has(number))) number = PICKUP_ROSTER.numbers[0] + rng.int(PICKUP_ROSTER.numbers[1] - PICKUP_ROSTER.numbers[0] + 1);
    numbers.add(number);
    let name = randomName(rng);
    while (names.has(`${name.first} ${name.last}`)) name = randomName(rng);
    names.add(`${name.first} ${name.last}`);
    // No two on a team share a face.
    let face = rng.int(PICKUP_ROSTER.faces);
    while (faces.has(face)) face = rng.int(PICKUP_ROSTER.faces);
    faces.add(face);
    const ratings: Ratings = goalie ? {} : Object.fromEntries(PICKUP_ROSTER.rated.map((key) => [key, Math.round(level - SEASON.ratingSpread + rng.range(0, SEASON.ratingSpread * 2))]));
    players.push({ number, first: name.first, last: name.last, face, ratings });
  }
  return { id, ...look, players };
}

/** Put a created player on a team in place of whoever held his position. A teammate wearing his number takes the old one. */
export function joinTeam(team: SeasonTeam, player: CreatedPlayer): SeasonTeam {
  const place = SEASON.place[player.dna.position];
  const old = team.players[place];
  if (!old) return team;
  const number = player.profile.number ?? old.number;
  const face = portraitOf(player);
  const players = team.players.map((p, i) => {
    if (i === place) {
      return { number, first: player.firstName, last: player.lastName, face: face ?? old.face, ratings: player.dna.position === 'goalie' ? {} : { ...startingAttributes(player.dna).current }, createdId: player.id };
    }
    return { ...p, number: p.number === number ? old.number : p.number, face: face !== null && p.face === face ? old.face : p.face };
  });
  return { ...team, players };
}

/** A new season: the teams, the whole regular schedule, nothing played. The player's team is the first one. */
export function newSeason(seed: number, created: CreatedPlayer | null, teamCount: number = PLACEHOLDER_TEAMS.length): SeasonState {
  const rng = new Rng(seed).fork('season-teams');
  const names = new Set<string>();
  // Levels evenly spread, handed out in a seeded order: a different pecking order each season.
  const [lo, hi] = SEASON.teamLevels;
  const levels = Array.from({ length: teamCount }, (_, i) => lo + ((hi - lo) * i) / Math.max(1, teamCount - 1));
  for (let i = levels.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [levels[i], levels[j]] = [levels[j] as number, levels[i] as number];
  }
  const teams = levels.map((level, id) => makeTeam(id, level, rng.fork(`team-${id}`), names));
  if (created) teams[0] = joinTeam(teams[0] as SeasonTeam, created);
  const games: SeasonGame[] = makeSchedule(teamCount).map((g, i) => ({ id: i + 1, stage: 'regular', round: g.round, home: g.home, away: g.away, result: null }));
  return { version: SEASON_VERSION, seed, teams, games, userTeam: 0, createdId: created?.id ?? null };
}

/** How good a team is: the mean of its skaters' ratings. */
export function teamRating(team: SeasonTeam): number {
  const values = team.players.flatMap((p) => Object.values(p.ratings).filter((v): v is number => typeof v === 'number'));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function poisson(rng: Rng, mean: number): number {
  const limit = Math.exp(-mean);
  let k = 0;
  let p = rng.next();
  while (p > limit && k < 20) {
    k++;
    p *= rng.next();
  }
  return k;
}

/** A game nobody watched: goals from the two teams' ratings, a tie settled in overtime or a shootout. Seeded by the game. */
export function simulateGame(state: SeasonState, game: SeasonGame): GameResult {
  const rng = new Rng(state.seed).fork(`sim-game-${game.id}`);
  const home = state.teams[game.home] as SeasonTeam;
  const away = state.teams[game.away] as SeasonTeam;
  const edge = (teamRating(home) - teamRating(away)) * SEASON.simPerPoint;
  const scored: Record<'home' | 'away', number> = { home: poisson(rng, Math.max(0.5, SEASON.simGoals * (1 + edge))), away: poisson(rng, Math.max(0.5, SEASON.simGoals * (1 - edge))) };
  const goals: ResultGoal[] = [];
  const one = (side: 'home' | 'away'): void => {
    const skaters = Array.from({ length: SEASON.skaters }, (_, i) => i);
    const scorer = rng.int(SEASON.skaters);
    const assists: number[] = [];
    for (const chance of SEASON.simAssist) {
      if (rng.next() >= chance) break;
      const others = skaters.filter((i) => i !== scorer && !assists.includes(i));
      assists.push(others[rng.int(others.length)] as number);
    }
    goals.push({ team: side, scorer, assists });
  };
  for (const side of ['home', 'away'] as const) for (let i = 0; i < scored[side]; i++) one(side);
  let decided: GameResult['decided'] = 'regulation';
  if (scored.home === scored.away) {
    // Overtime half the time, with a goal that counts; otherwise a shootout, which adds one to the winner's score.
    const winner = rng.next() < 0.5 + edge ? 'home' : 'away';
    decided = rng.next() < 0.5 ? 'overtime' : 'shootout';
    if (decided === 'overtime') one(winner);
    scored[winner]++;
  }
  return { home: scored.home, away: scored.away, decided, goals, played: false };
}

const done = (g: SeasonGame): boolean => g.result !== null;

/** The stage the season is in, from what has been played. */
export function seasonStage(state: SeasonState): GameStage | 'complete' {
  const of = (stage: GameStage): SeasonGame[] => state.games.filter((g) => g.stage === stage);
  if (!of('regular').every(done)) return 'regular';
  const semis = of('semifinal');
  if (semis.length === 0 || !semis.every(done)) return 'semifinal';
  const final = of('final');
  return final.length > 0 && final.every(done) ? 'complete' : 'final';
}

const winnerOf = (g: SeasonGame): number | null => (g.result ? (g.result.home > g.result.away ? g.home : g.away) : null);

/** Standings from the regular-season results: points, then wins, goal difference, goals for, then team order. */
export function standings(state: SeasonState): StandingRow[] {
  const rows: StandingRow[] = state.teams.map((t) => ({ team: t.id, played: 0, wins: 0, losses: 0, overtimeLosses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }));
  for (const g of state.games) {
    if (g.stage !== 'regular' || !g.result) continue;
    const sides: [number, number, number][] = [
      [g.home, g.result.home, g.result.away],
      [g.away, g.result.away, g.result.home],
    ];
    for (const [team, scored, allowed] of sides) {
      const row = rows[team] as StandingRow;
      row.played++;
      row.goalsFor += scored;
      row.goalsAgainst += allowed;
      if (scored > allowed) row.wins++;
      else if (g.result.decided === 'regulation') row.losses++;
      else row.overtimeLosses++;
    }
  }
  for (const row of rows) row.points = row.wins * SEASON.points.win + row.overtimeLosses * SEASON.points.overtimeLoss + row.losses * SEASON.points.loss;
  return rows.sort((a, b) => b.points - a.points || b.wins - a.wins || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.team - b.team);
}

/** Scoring leaders from every result of the given stages: points, then goals, then fewer games, then team and place. */
export function scorers(state: SeasonState, stages: readonly GameStage[] = ['regular']): ScorerRow[] {
  const rows = new Map<string, ScorerRow>();
  const row = (team: number, player: number): ScorerRow => {
    const key = `${team}:${player}`;
    let r = rows.get(key);
    if (!r) rows.set(key, (r = { team, player, played: 0, goals: 0, assists: 0, points: 0 }));
    return r;
  };
  for (const g of state.games) {
    if (!g.result || !stages.includes(g.stage)) continue;
    for (const team of [g.home, g.away]) for (let p = 0; p < SEASON.skaters; p++) row(team, p).played++;
    for (const goal of g.result.goals) {
      const team = goal.team === 'home' ? g.home : g.away;
      row(team, goal.scorer).goals++;
      for (const a of goal.assists) row(team, a).assists++;
    }
  }
  const out = [...rows.values()];
  for (const r of out) r.points = r.goals + r.assists;
  return out.sort((a, b) => b.points - a.points || b.goals - a.goals || a.played - b.played || a.team - b.team || a.player - b.player);
}

/** The next game the player's team has to play, or null when it has none left at this point. */
export function nextUserGame(state: SeasonState): SeasonGame | null {
  return state.games.find((g) => !g.result && (g.home === state.userTeam || g.away === state.userTeam)) ?? null;
}

/** A result is well formed for its game: a winner, and the goals listed add up (a shootout adds one that nobody scored). */
export function resultProblems(result: GameResult): string[] {
  const problems: string[] = [];
  if (!Number.isInteger(result.home) || !Number.isInteger(result.away) || result.home < 0 || result.away < 0) problems.push('scores must be whole numbers');
  if (result.home === result.away) problems.push('a game cannot end tied');
  const listed = { home: result.goals.filter((g) => g.team === 'home').length, away: result.goals.filter((g) => g.team === 'away').length };
  const extra = result.decided === 'shootout' ? 1 : 0;
  const winner = result.home > result.away ? 'home' : 'away';
  for (const side of ['home', 'away'] as const) {
    if (listed[side] + (side === winner ? extra : 0) !== result[side]) problems.push(`${side} goals listed do not add up to the score`);
  }
  for (const g of result.goals) {
    if (g.scorer < 0 || g.scorer >= SEASON.skaters || g.assists.some((a) => a < 0 || a > SEASON.skaters || a === g.scorer)) problems.push('a goal names a player who is not on the team');
  }
  return problems;
}

/**
 * Record a result. A game that already has one is left exactly as it is (recording twice changes nothing), and a
 * malformed result is refused. Then the season moves on: the rest of the round is simulated once the player's game
 * is in, and the playoff games are drawn up when the stage before them is finished.
 */
export function recordResult(state: SeasonState, gameId: number, result: GameResult): { state: SeasonState; problems: string[] } {
  const game = state.games.find((g) => g.id === gameId);
  if (!game) return { state, problems: [`no game ${gameId}`] };
  if (game.result) return { state, problems: [] };
  const problems = resultProblems(result);
  if (problems.length) return { state, problems };
  const games = state.games.map((g) => (g.id === gameId ? { ...g, result } : g));
  return { state: settle({ ...state, games }), problems: [] };
}

/** Simulate every game the player's team is not waiting on, and draw up the playoffs when they are due. */
export function settle(state: SeasonState): SeasonState {
  let next = state;
  for (let guard = 0; guard < 8; guard++) {
    const stage = seasonStage(next);
    if (stage === 'complete') return next;
    const open = next.games.filter((g) => g.stage === stage && !g.result);
    if (open.length === 0) {
      // The stage is finished (or not drawn up yet): make the next one's games.
      const made = drawPlayoffs(next, stage);
      if (made === next) return next;
      next = made;
      continue;
    }
    // His own next game waits for him; everything in earlier rounds is played without him. With no game of his
    // left in this stage, everything is.
    const mine = open.find((g) => g.home === next.userTeam || g.away === next.userTeam);
    const toPlay = mine ? open.filter((g) => g.round < mine.round) : open;
    if (toPlay.length === 0) return next;
    const ids = new Set(toPlay.map((g) => g.id));
    const base = next;
    next = { ...next, games: next.games.map((g) => (ids.has(g.id) ? { ...g, result: simulateGame(base, g) } : g)) };
  }
  return next;
}

function drawPlayoffs(state: SeasonState, stage: GameStage | 'complete'): SeasonState {
  const lastId = Math.max(0, ...state.games.map((g) => g.id));
  if (stage === 'semifinal' && !state.games.some((g) => g.stage === 'semifinal')) {
    const seeds = standings(state).slice(0, SEASON.playoffTeams).map((r) => r.team);
    if (seeds.length < 4) return state;
    // First against fourth, second against third; the higher seed is at home.
    const pairs: [number, number][] = [
      [seeds[0] as number, seeds[3] as number],
      [seeds[1] as number, seeds[2] as number],
    ];
    return { ...state, games: [...state.games, ...pairs.map(([home, away], i): SeasonGame => ({ id: lastId + 1 + i, stage: 'semifinal', round: 1, home, away, result: null }))] };
  }
  if (stage === 'final' && !state.games.some((g) => g.stage === 'final')) {
    const winners = state.games.filter((g) => g.stage === 'semifinal').map(winnerOf);
    if (winners.length !== 2 || winners.some((w) => w === null)) return state;
    const order = standings(state).map((r) => r.team);
    const [home, away] = (winners as number[]).sort((a, b) => order.indexOf(a) - order.indexOf(b)) as [number, number];
    return { ...state, games: [...state.games, { id: lastId + 1, stage: 'final', round: 2, home, away, result: null }] };
  }
  return state;
}

/** The champions, once the final has been played. */
export function champion(state: SeasonState): number | null {
  const final = state.games.find((g) => g.stage === 'final');
  return final ? winnerOf(final) : null;
}

/** Is this created player on a team in this season? (He must not be deleted while he is.) */
export function inSeason(state: SeasonState | null, createdId: number): boolean {
  return state !== null && state.createdId === createdId && seasonStage(state) !== 'complete';
}

export function serializeSeason(state: SeasonState): string {
  return JSON.stringify(state);
}

/** Read a saved season. Anything that is not a whole, consistent season of this version throws: nothing is guessed. */
export function parseSeason(text: string): SeasonState {
  const raw = JSON.parse(text) as Partial<SeasonState> | null;
  if (typeof raw !== 'object' || raw === null) throw new Error('not a season');
  if (raw.version !== SEASON_VERSION) throw new Error(`season version ${String(raw.version)} is not ${SEASON_VERSION}`);
  if (!Number.isInteger(raw.seed)) throw new Error('no seed');
  if (!Array.isArray(raw.teams) || raw.teams.length < 4 || raw.teams.length % 2 !== 0) throw new Error('teams are missing');
  const teams = raw.teams;
  for (const [i, t] of teams.entries()) {
    if (typeof t !== 'object' || t === null || t.id !== i || typeof t.name !== 'string' || typeof t.abbr !== 'string' || !Array.isArray(t.players) || t.players.length !== SEASON.skaters + 1) throw new Error(`team ${i} is damaged`);
    for (const p of t.players) {
      if (typeof p !== 'object' || p === null || typeof p.first !== 'string' || typeof p.last !== 'string' || !Number.isInteger(p.number) || !Number.isInteger(p.face) || typeof p.ratings !== 'object' || p.ratings === null) throw new Error(`a player on team ${i} is damaged`);
    }
  }
  if (!Array.isArray(raw.games) || raw.games.length < regularRounds(teams.length) * (teams.length / 2)) throw new Error('the schedule is missing');
  const ids = new Set<number>();
  for (const g of raw.games) {
    const ok = typeof g === 'object' && g !== null && Number.isInteger(g.id) && !ids.has(g.id) && ['regular', 'semifinal', 'final'].includes(g.stage) && Number.isInteger(g.round) && g.home !== g.away && [g.home, g.away].every((t) => Number.isInteger(t) && t >= 0 && t < teams.length);
    if (!ok) throw new Error('a game is damaged');
    ids.add(g.id);
    if (g.result !== null) {
      const r = g.result;
      if (typeof r !== 'object' || !Array.isArray(r.goals) || !['regulation', 'overtime', 'shootout'].includes(r.decided) || typeof r.played !== 'boolean') throw new Error(`the result of game ${g.id} is damaged`);
      const problems = resultProblems(r);
      if (problems.length) throw new Error(`the result of game ${g.id} is damaged: ${problems[0]}`);
    }
  }
  if (!Number.isInteger(raw.userTeam) || (raw.userTeam as number) < 0 || (raw.userTeam as number) >= teams.length) throw new Error('no team for the player');
  const createdId = typeof raw.createdId === 'number' ? raw.createdId : null;
  return { version: SEASON_VERSION, seed: raw.seed as number, teams, games: raw.games, userTeam: raw.userTeam as number, createdId };
}
