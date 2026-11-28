/**
 * Between the season and the ice: who is on the ice for a season game, what its result is when it ends, and the
 * words on the season screen. Pure: no Phaser, no browser, so it can be tested.
 */
import type { RosterPlayer } from '../dynasty/pickupRoster';
import { SEASON, champion, nextUserGame, regularRounds, scorers, seasonStage, standings } from '../dynasty/season';
import type { GameResult, ResultGoal, SeasonGame, SeasonState, SeasonTeam } from '../dynasty/season';
import type { GoalRecord, MatchState } from '../match/sim/match';

export interface GameSides {
  /** The twelve on the ice, in the order the game holds them: the player's five, the other five, his goalie, theirs. */
  roster: RosterPlayer[];
  /** The player's team first: it is always the side he controls. */
  teams: [SeasonTeam, SeasonTeam];
  /** Which side of the schedule the player's team is on in this game. */
  userSide: 'home' | 'away';
}

/** The line-ups for a season game. The player's team is always on-ice team 0, at home or away. */
export function gameSides(state: SeasonState, game: SeasonGame): GameSides {
  const userSide = game.home === state.userTeam ? 'home' : 'away';
  const mine = state.teams[state.userTeam] as SeasonTeam;
  const theirs = state.teams[userSide === 'home' ? game.away : game.home] as SeasonTeam;
  const skaters = (t: SeasonTeam): RosterPlayer[] => t.players.slice(0, SEASON.skaters).map((p) => ({ ...p }));
  const goalie = (t: SeasonTeam): RosterPlayer => ({ ...(t.players[SEASON.skaters] as RosterPlayer) });
  return { roster: [...skaters(mine), ...skaters(theirs), goalie(mine), goalie(theirs)], teams: [mine, theirs], userSide };
}

/** A seed for the on-ice game, so each season game has its own bounces and referee. */
export const gameSeed = (state: SeasonState, game: SeasonGame): number => ((state.seed * 31 + game.id * 7919) >>> 0) % 2147483647;

/**
 * The result of a game played on the ice. On-ice team 0 is the player's team. Goals off a defender (no scorer) go to
 * the centre of the team that was credited, so the goals listed still add up to the score.
 */
export function resultFromMatch(userSide: 'home' | 'away', score: readonly [number, number], m: MatchState): GameResult {
  const other = userSide === 'home' ? 'away' : 'home';
  const sideOf = (team: 0 | 1): 'home' | 'away' => (team === 0 ? userSide : other);
  const place = (index: number): number => (index >= SEASON.skaters ? index - SEASON.skaters : index);
  // Only the scoring team's own skaters are credited: a goal that went in off the other side goes to its centre.
  const own = (team: 0 | 1, index: number): boolean => index >= team * SEASON.skaters && index < (team + 1) * SEASON.skaters;
  const goals: ResultGoal[] = m.goals.map((g: GoalRecord) => {
    const scorer = own(g.team, g.scorer) ? place(g.scorer) : 0;
    const assists = [...new Set(g.assists.filter((a) => own(g.team, a)).map(place))].filter((a) => a !== scorer);
    return { team: sideOf(g.team), scorer, assists };
  });
  const tally: Record<'home' | 'away', number> = { home: 0, away: 0 };
  tally[sideOf(0)] = score[0];
  tally[sideOf(1)] = score[1];
  let decided: GameResult['decided'] = 'regulation';
  if (m.shootout && m.winner !== null) {
    decided = 'shootout';
    tally[sideOf(m.winner)]++;
  } else if (m.goals.some((g) => g.period > 3)) {
    decided = 'overtime';
  }
  return { home: tally.home, away: tally.away, decided, goals, played: true };
}

const pad = (v: string | number, n: number): string => String(v).padStart(n);

/** "Round 3 of 10", "Semifinals", "Final", "Season over". */
export function stageTitle(state: SeasonState): string {
  const stage = seasonStage(state);
  if (stage === 'complete') return 'Season over';
  if (stage === 'final') return 'The final';
  if (stage === 'semifinal') return 'Semifinals';
  const next = state.games.find((g) => g.stage === 'regular' && !g.result);
  return `Round ${next ? next.round : regularRounds(state.teams.length)} of ${regularRounds(state.teams.length)}`;
}

export const STANDINGS_HEAD = '   Team     GP  W  L OTL PTS  GF  GA';

/** One line a team, best first; the top four make the playoffs. */
export function standingsLines(state: SeasonState): { text: string; team: number }[] {
  return standings(state).map((r, i) => {
    const t = state.teams[r.team] as SeasonTeam;
    return { team: r.team, text: `${pad(i + 1, 1)}. ${t.name.padEnd(8)}${pad(r.played, 3)}${pad(r.wins, 3)}${pad(r.losses, 3)}${pad(r.overtimeLosses, 4)}${pad(r.points, 4)}${pad(r.goalsFor, 4)}${pad(r.goalsAgainst, 4)}` };
  });
}

/** The scoring leaders: "1. #19 D. Rhodes    RED  6 G  4 A 10 P". */
export function scorerLines(state: SeasonState, count: number): { text: string; team: number; mine: boolean }[] {
  const stages = seasonStage(state) === 'regular' ? (['regular'] as const) : (['regular', 'semifinal', 'final'] as const);
  return scorers(state, stages)
    .filter((r) => r.points > 0)
    .slice(0, count)
    .map((r, i) => {
      const t = state.teams[r.team] as SeasonTeam;
      const p = t.players[r.player];
      const name = p ? `#${p.number} ${p.first.charAt(0)}. ${p.last}` : '';
      return { team: r.team, mine: p?.createdId !== undefined, text: `${i + 1}. ${name.padEnd(18).slice(0, 18)} ${t.abbr} ${pad(r.goals, 2)} G ${pad(r.assists, 2)} A ${pad(r.points, 2)} P` };
    });
}

/** "RED 3  BLU 2 (OT)" for a finished game. */
export function resultLine(state: SeasonState, game: SeasonGame): string {
  const r = game.result;
  const [home, away] = [state.teams[game.home] as SeasonTeam, state.teams[game.away] as SeasonTeam];
  if (!r) return `${away.abbr} at ${home.abbr}`;
  return `${away.abbr} ${r.away}  ${home.abbr} ${r.home}${r.decided === 'overtime' ? ' (OT)' : r.decided === 'shootout' ? ' (SO)' : ''}`;
}

/** The games most recently finished: the last round played, or the playoff games so far. */
export function lastResults(state: SeasonState): { title: string; lines: string[] } {
  const playoffs = state.games.filter((g) => g.stage !== 'regular' && g.result);
  if (playoffs.length) return { title: 'Playoffs', lines: playoffs.map((g) => `${g.stage === 'final' ? 'Final: ' : 'Semi:  '}${resultLine(state, g)}`) };
  const finished = state.games.filter((g) => g.stage === 'regular' && g.result);
  const round = Math.max(0, ...finished.map((g) => g.round));
  return { title: round ? `Round ${round} results` : '', lines: finished.filter((g) => g.round === round).map((g) => resultLine(state, g)) };
}

/** What comes next for the player: his game, or how the season ended. */
export function nextLine(state: SeasonState): string {
  const game = nextUserGame(state);
  if (game) {
    const [home, away] = [state.teams[game.home] as SeasonTeam, state.teams[game.away] as SeasonTeam];
    const what = game.stage === 'final' ? 'The final' : game.stage === 'semifinal' ? 'Semifinal' : 'Next game';
    return `${what}: ${away.name} at ${home.name}`;
  }
  const champ = champion(state);
  if (champ !== null) return `Champions: ${(state.teams[champ] as SeasonTeam).name}${champ === state.userTeam ? '. That is you!' : ''}`;
  return 'Your season is over';
}
