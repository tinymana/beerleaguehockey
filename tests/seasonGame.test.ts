import { describe, expect, it } from 'vitest';
import { STANDINGS_HEAD, gameSeed, gameSides, lastResults, nextLine, resultFromMatch, resultLine, scorerLines, stageTitle, standingsLines } from '../src/app/seasonGame';
import { GOALIE_INDEX } from '../src/dynasty/pickupRoster';
import { newSeason, nextUserGame, recordResult, resultProblems, seasonStage, simulateGame } from '../src/dynasty/season';
import type { SeasonState } from '../src/dynasty/season';
import { modsFromRatings } from '../src/match/sim/skaterMods';
import { SkatingSim } from '../src/match/sim/skatingSim';
import { cloneTuning } from '../src/match/sim/tuning';

const IDLE = { moveX: 0, moveY: 0, shoot: false };

/** Play the player's next game on the ice with the computer on both sides, and return what the season would record. */
function playOnIce(state: SeasonState): { id: number; result: ReturnType<typeof resultFromMatch>; score: [number, number] } {
  const game = nextUserGame(state);
  if (!game) throw new Error('no game');
  const sides = gameSides(state, game);
  const sim = new SkatingSim(cloneTuning());
  sim.demo = true;
  sim.setTeams(true, true, gameSeed(state, game));
  sides.roster.slice(0, 10).forEach((p, i) => sim.setSkaterMods(i, modsFromRatings(p.ratings)));
  const m = sim.match;
  if (!m) throw new Error('no match');
  for (let i = 0; i < 60 * 60 * 20 && m.phase !== 'final'; i++) {
    sim.step(IDLE);
    if (m.phase === 'intermission') sim.advance();
  }
  expect(m.phase).toBe('final');
  return { id: game.id, result: resultFromMatch(sides.userSide, [sim.score[0], sim.score[1]], m), score: [sim.score[0], sim.score[1]] };
}

describe('season games on the ice (Decision 102)', () => {
  it("the player's team is always the side he controls, with its goalie and theirs after the ten skaters", () => {
    const s = newSeason(42, null);
    for (const game of s.games.filter((g) => g.home === s.userTeam || g.away === s.userTeam).slice(0, 4)) {
      const sides = gameSides(s, game);
      expect(sides.roster.length).toBe(12);
      expect(sides.teams[0].id).toBe(s.userTeam);
      expect(sides.userSide).toBe(game.home === s.userTeam ? 'home' : 'away');
      expect(sides.roster.slice(0, 5)).toEqual(s.teams[s.userTeam]?.players.slice(0, 5));
      expect(sides.roster[GOALIE_INDEX[0]]).toEqual(s.teams[s.userTeam]?.players[5]);
      expect(sides.roster[GOALIE_INDEX[1]]).toEqual(sides.teams[1].players[5]);
    }
    const [a, b] = [s.games[0], s.games[1]];
    if (a && b) expect(gameSeed(s, a)).not.toBe(gameSeed(s, b));
  });

  it('three real games in a row: each result is well formed, is accepted by the season, and moves it on a round', () => {
    let s = newSeason(42, null);
    for (let round = 1; round <= 3; round++) {
      const { id, result, score } = playOnIce(s);
      expect(resultProblems(result)).toEqual([]);
      expect(result.played).toBe(true);
      // The score on the ice is the score recorded, plus one for a shootout winner.
      const mine = nextUserGame(s)?.home === s.userTeam ? result.home : result.away;
      expect(mine - score[0]).toBe(result.decided === 'shootout' && mine > (nextUserGame(s)?.home === s.userTeam ? result.away : result.home) ? 1 : 0);
      const out = recordResult(s, id, result);
      expect(out.problems).toEqual([]);
      s = out.state;
      expect(s.games.filter((g) => g.round === round).every((g) => g.result)).toBe(true);
      expect(nextUserGame(s)?.round).toBe(round + 1);
    }
  });

  it('the words on the season screen fit their columns (6 px a letter)', () => {
    let s = newSeason(42, null);
    expect(stageTitle(s)).toBe('Round 1 of 10');
    expect(lastResults(s)).toEqual({ title: '', lines: [] });
    expect(nextLine(s)).toMatch(/^Next game: \w+ at \w+$/);
    for (let i = 0; i < 30 && nextUserGame(s); i++) {
      const game = nextUserGame(s);
      if (!game) break;
      s = recordResult(s, game.id, simulateGame(s, game)).state;
      // Left column is 240 px, the right one 200 px.
      for (const row of standingsLines(s)) expect(row.text.length).toBe(STANDINGS_HEAD.length);
      for (const row of scorerLines(s, 6)) expect(row.text.length * 6).toBeLessThanOrEqual(240);
      for (const text of lastResults(s).lines) expect(text.length * 6).toBeLessThanOrEqual(200);
      expect(nextLine(s).length * 6).toBeLessThanOrEqual(440);
    }
    expect(seasonStage(s)).toBe('complete');
    expect(stageTitle(s)).toBe('Season over');
    expect(nextLine(s)).toMatch(/^Champions: /);
    expect(lastResults(s).title).toBe('Playoffs');
    expect(lastResults(s).lines.length).toBe(3);
    const first = s.games[0];
    if (first) expect(resultLine(s, first)).toMatch(/^[A-Z]{3} \d+  [A-Z]{3} \d+/);
    expect(standingsLines(s).length).toBe(6);
  });
});
