import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_TEAMS, SEASON, champion, inSeason, makeSchedule, newSeason, nextUserGame, parseSeason, recordResult, regularRounds, resultProblems, scorers, seasonStage, serializeSeason, settle, simulateGame, standings, teamRating } from '../src/dynasty/season';
import type { GameResult, SeasonState } from '../src/dynasty/season';

/** A result for the player's next game: he wins or loses by one in regulation. */
function userResult(state: SeasonState, win: boolean): { id: number; result: GameResult } {
  const g = nextUserGame(state);
  if (!g) throw new Error('no game for the player');
  const mine: 'home' | 'away' = g.home === state.userTeam ? 'home' : 'away';
  const theirs: 'home' | 'away' = mine === 'home' ? 'away' : 'home';
  const goals = [
    { team: win ? mine : theirs, scorer: 0, assists: [1, 2] },
    { team: win ? mine : theirs, scorer: 1, assists: [] },
    { team: win ? theirs : mine, scorer: 3, assists: [4] },
  ];
  const result: GameResult = { home: 0, away: 0, decided: 'regulation', goals, played: true };
  result[win ? mine : theirs] = 2;
  result[win ? theirs : mine] = 1;
  return { id: g.id, result };
}

function playOut(state: SeasonState, win: (round: number) => boolean): SeasonState {
  let s = state;
  for (let i = 0; i < 40 && nextUserGame(s); i++) {
    const { id, result } = userResult(s, win(i));
    const r = recordResult(s, id, result);
    expect(r.problems).toEqual([]);
    s = r.state;
  }
  return s;
}

describe('season mode (Decision 102)', () => {
  it('the schedule: every team plays once a round, meets every other team home and away, ten games each for six teams', () => {
    const games = makeSchedule(6);
    expect(regularRounds(6)).toBe(10);
    expect(games.length).toBe(30);
    for (let round = 1; round <= 10; round++) {
      const teams = games.filter((g) => g.round === round).flatMap((g) => [g.home, g.away]);
      expect(teams.sort()).toEqual([0, 1, 2, 3, 4, 5]);
    }
    for (let a = 0; a < 6; a++) {
      expect(games.filter((g) => g.home === a).length).toBe(5);
      for (let b = 0; b < 6; b++) if (a !== b) expect(games.filter((g) => g.home === a && g.away === b).length).toBe(1);
    }
  });

  it('a new season: six placeholder teams of five skaters and a goalie, different names, the same for the same seed', () => {
    const s = newSeason(42, null);
    expect(newSeason(42, null)).toEqual(s);
    expect(newSeason(43, null).teams[0]?.players[0]).not.toEqual(s.teams[0]?.players[0]);
    expect(s.teams.map((t) => t.name)).toEqual(PLACEHOLDER_TEAMS.map((t) => t.name));
    const names = s.teams.flatMap((t) => t.players.map((p) => `${p.first} ${p.last}`));
    expect(new Set(names).size).toBe(36);
    for (const t of s.teams) {
      expect(t.players.length).toBe(6);
      expect(new Set(t.players.map((p) => p.number)).size).toBe(6);
      expect(t.players[5]?.ratings).toEqual({});
      expect(teamRating(t)).toBeGreaterThan(SEASON.teamLevels[0] - SEASON.ratingSpread);
      expect(teamRating(t)).toBeLessThan(SEASON.teamLevels[1] + SEASON.ratingSpread);
    }
    expect(seasonStage(s)).toBe('regular');
    expect(nextUserGame(s)?.round).toBe(1);
    expect(standings(s).every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it('a simulated game always has a winner, its goals add up, and it is the same every time', () => {
    const s = newSeason(7, null);
    const decided = new Set<string>();
    for (const g of s.games) {
      const r = simulateGame(s, g);
      expect(simulateGame(s, g)).toEqual(r);
      expect(resultProblems(r)).toEqual([]);
      expect(r.played).toBe(false);
      decided.add(r.decided);
    }
    // Over 30 games some go past regulation.
    expect(decided.size).toBeGreaterThan(1);
  });

  it("recording the player's game plays the rest of the round, and recording it again changes nothing", () => {
    const s = newSeason(42, null);
    const { id, result } = userResult(s, true);
    const once = recordResult(s, id, result).state;
    expect(once.games.filter((g) => g.round === 1).every((g) => g.result)).toBe(true);
    expect(once.games.filter((g) => g.round === 2).some((g) => g.result)).toBe(false);
    const twice = recordResult(once, id, { ...result, home: 9, away: 0, goals: [] });
    expect(twice.state).toBe(once);
    expect(standings(once).reduce((n, r) => n + r.played, 0)).toBe(6);
    const mine = standings(once).find((r) => r.team === s.userTeam);
    expect(mine).toMatchObject({ played: 1, wins: 1, points: 2, goalsFor: 2, goalsAgainst: 1 });
    // The player's line: a goal and an assist for his first two skaters.
    const top = scorers(once).filter((r) => r.team === s.userTeam);
    expect(top.find((r) => r.player === 0)).toMatchObject({ goals: 1, assists: 0, played: 1 });
    expect(top.find((r) => r.player === 1)).toMatchObject({ goals: 1, assists: 1, points: 2 });
  });

  it('refuses a result that does not add up or ends tied, and an unknown game', () => {
    const s = newSeason(42, null);
    const { id, result } = userResult(s, true);
    expect(recordResult(s, id, { ...result, home: result.home + 1 }).problems.length).toBeGreaterThan(0);
    expect(recordResult(s, id, { ...result, home: 1, away: 1, goals: [] }).problems).toContain('a game cannot end tied');
    expect(recordResult(s, 9999, result).problems).toEqual(['no game 9999']);
    expect(recordResult(s, id, { ...result, home: result.home + 1 }).state).toBe(s);
    // A shootout win: one more on the score than goals listed for the winner.
    const g = nextUserGame(s);
    const mine: 'home' | 'away' = g?.home === s.userTeam ? 'home' : 'away';
    const so: GameResult = { home: 2, away: 2, decided: 'shootout', goals: [{ team: 'home', scorer: 0, assists: [] }, { team: 'home', scorer: 1, assists: [] }, { team: 'away', scorer: 0, assists: [] }, { team: 'away', scorer: 2, assists: [] }], played: true };
    so[mine]++;
    expect(recordResult(s, id, so).problems).toEqual([]);
  });

  it('a whole season: ten rounds, standings that add up, an overtime loss worth a point, then semifinals, a final and a champion', () => {
    const s = playOut(newSeason(42, null), () => true);
    expect(seasonStage(s)).toBe('complete');
    const table = standings(s);
    expect(table.every((r) => r.played === 10)).toBe(true);
    expect(table[0]?.team).toBe(s.userTeam);
    expect(table.reduce((n, r) => n + r.wins, 0)).toBe(30);
    expect(table.reduce((n, r) => n + r.goalsFor, 0)).toBe(table.reduce((n, r) => n + r.goalsAgainst, 0));
    for (const r of table) expect(r.points).toBe(r.wins * 2 + r.overtimeLosses);
    for (let i = 1; i < table.length; i++) expect((table[i - 1]?.points ?? 0) >= (table[i]?.points ?? 0)).toBe(true);
    const semis = s.games.filter((g) => g.stage === 'semifinal');
    expect(semis.map((g) => [g.home, g.away])).toEqual([[table[0]?.team, table[3]?.team], [table[1]?.team, table[2]?.team]]);
    expect(s.games.filter((g) => g.stage === 'final').length).toBe(1);
    // He won every game he played, so he is champion.
    expect(champion(s)).toBe(s.userTeam);
    expect(nextUserGame(s)).toBe(null);
    // Playoff games do not count in the standings.
    expect(standings(s)).toEqual(table);
  });

  it('a team that misses the playoffs watches them: the rest is simulated to a champion', () => {
    const s = playOut(newSeason(42, null), () => false);
    expect(seasonStage(s)).toBe('complete');
    expect(standings(s).findIndex((r) => r.team === s.userTeam)).toBeGreaterThanOrEqual(4);
    expect(champion(s)).not.toBe(s.userTeam);
    expect(champion(s)).not.toBe(null);
    expect(settle(s)).toBe(s);
  });

  it('saves and loads whole, and refuses a damaged or foreign save', () => {
    const s = playOut(newSeason(42, null), (i) => i % 2 === 0);
    expect(parseSeason(serializeSeason(s))).toEqual(s);
    const fresh = newSeason(5, null);
    expect(parseSeason(serializeSeason(fresh))).toEqual(fresh);
    expect(() => parseSeason('{"version":99}')).toThrow(/version/);
    expect(() => parseSeason('not json')).toThrow();
    expect(() => parseSeason('null')).toThrow();
    const cut = JSON.parse(serializeSeason(s)) as SeasonState;
    cut.teams[2]?.players.pop();
    expect(() => parseSeason(JSON.stringify(cut))).toThrow(/team 2/);
    const fixed = JSON.parse(serializeSeason(s)) as SeasonState;
    const first = fixed.games[0];
    if (first?.result) first.result.home += 3;
    expect(() => parseSeason(JSON.stringify(fixed))).toThrow(/result of game 1/);
  });

  it('a created player is in the season until it is over', () => {
    const s = newSeason(42, null);
    expect(inSeason({ ...s, createdId: 3 }, 3)).toBe(true);
    expect(inSeason({ ...s, createdId: 3 }, 4)).toBe(false);
    expect(inSeason(null, 3)).toBe(false);
    expect(inSeason({ ...playOut(s, () => true), createdId: 3 }, 3)).toBe(false);
  });
});
