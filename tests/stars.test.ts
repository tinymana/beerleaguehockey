import { describe, expect, it } from 'vitest';
import { REVEAL, pressOnStars, rankPlayers, starUp, starsShown, threeStars } from '../src/app/stars';
import { GOALIE_INDEX, fullLine, makePickupRoster } from '../src/dynasty/pickupRoster';
import { REFEREES, emptyStats } from '../src/match/sim/match';
import type { GoalRecord, MatchState } from '../src/match/sim/match';
import { SkatingSim } from '../src/match/sim/skatingSim';
import { cloneTuning } from '../src/match/sim/tuning';

const goal = (over: Partial<GoalRecord>): GoalRecord => ({ team: 0, scorer: 0, assists: [], period: 1, time: 10, powerPlay: false, ...over });
function final(goals: GoalRecord[], saves: [number, number], winner: 0 | 1): MatchState {
  const ref = REFEREES[0];
  if (!ref) throw new Error('no referee');
  const stats: MatchState['stats'] = [emptyStats(), emptyStats()];
  stats[0].saves = saves[0];
  stats[1].saves = saves[1];
  return {
    phase: 'final', period: 3, clock: 0, reason: 'goal', dot: { x: 0, y: 0 }, timer: 0, sinceDrop: 0, taker: [0, 5], aiPress: [0, 0], locked: [0, 0],
    penalties: [], pending: null, stats, goals, referee: ref, shootout: null, winner,
  };
}
const score = (goals: GoalRecord[]): [number, number] => [goals.filter((g) => g.team === 0).length, goals.filter((g) => g.team === 1).length];

describe('three stars (Decision 92)', () => {
  it('a hat trick is first star, the playmaker second, and the lines say what they did', () => {
    const goals = [goal({ assists: [1] }), goal({ assists: [1, 2] }), goal({ assists: [1] }), goal({ team: 1, scorer: 6 })];
    const stars = threeStars(final(goals, [8, 9], 0), score(goals));
    expect(stars.map((s) => s.index)).toEqual([0, 1, 6]);
    expect(stars.map((s) => s.line)).toEqual(['3 goals', '3 assists', '1 goal']);
    expect(stars.map((s) => s.team)).toEqual([0, 0, 1]);
  });

  it('a goalie who shuts the door in a 1-0 game is first star', () => {
    const goals = [goal({ scorer: 3 })];
    const stars = threeStars(final(goals, [21, 6], 0), score(goals));
    expect(stars[0]).toMatchObject({ index: GOALIE_INDEX[0], goalie: true, team: 0, line: '21 saves, shutout' });
    expect(stars[1]?.index).toBe(3);
    // The other goalie stopped six of seven: he is in the three ahead of skaters with nothing.
    expect(stars[2]).toMatchObject({ index: GOALIE_INDEX[1], line: '6 saves' });
  });

  it('a goalie who was beaten five times is not a star', () => {
    const goals = [0, 1, 2, 3, 4].map((scorer) => goal({ scorer }));
    const stars = threeStars(final(goals, [2, 10], 0), score(goals));
    expect(stars.some((s) => s.index === GOALIE_INDEX[1])).toBe(false);
  });

  it('ties go to the winning side, and there are always three different stars', () => {
    const goals = [goal({ team: 1, scorer: 7 }), goal({ scorer: 2 })];
    const even = threeStars(final(goals, [0, 0], 1), score(goals));
    expect(even[0]?.index).toBe(7);
    const none = threeStars(final([], [0, 0], 1), [0, 0]);
    expect(new Set(none.map((s) => s.index)).size).toBe(3);
    // Nothing happened: the two goalies with shutouts, the winner's first, then a winning skater.
    expect(none.map((s) => s.index)).toEqual([GOALIE_INDEX[1], GOALIE_INDEX[0], 5]);
    expect(rankPlayers(final([], [0, 0], 0), [0, 0]).length).toBe(12);
  });

  it('the stars come up one at a time, third star first; Shoot brings the next, then leaves', () => {
    expect([0, 1, 2].map((i) => starUp(i, starsShown(0)))).toEqual([false, false, true]);
    expect([0, 1, 2].map((i) => starUp(i, starsShown(REVEAL.every + 0.01)))).toEqual([false, true, true]);
    expect([0, 1, 2].map((i) => starUp(i, starsShown(REVEAL.every * 2 + 0.01)))).toEqual([true, true, true]);
    expect(starsShown(999)).toBe(3);
    // A press at the horn is ignored, so the panel is not skipped by a held button.
    expect(pressOnStars(0.1)).toBe(0.1);
    // A press brings up the second star, another the first, another leaves.
    const second = pressOnStars(0.8);
    expect(second).toBe(REVEAL.every);
    const first = pressOnStars(second as number);
    expect(starsShown(first as number)).toBe(3);
    expect(pressOnStars(first as number)).toBe(null);
  });

  it('after a whole game every star has a name, a face and a line that fits the panel', () => {
    const sim = new SkatingSim(cloneTuning());
    sim.demo = true;
    sim.setTeams(true, true, 5);
    const idle = { moveX: 0, moveY: 0, shoot: false };
    for (let i = 0; i < 60 * 60 * 14 && sim.match?.phase !== 'final'; i++) {
      sim.step(idle);
      if (sim.match?.phase === 'intermission') sim.advance();
    }
    const m = sim.match;
    if (!m || m.phase !== 'final') throw new Error('the game did not end');
    const roster = makePickupRoster(5);
    const stars = threeStars(m, [sim.score[0], sim.score[1]]);
    expect(stars.length).toBe(3);
    for (const s of stars) {
      const who = roster[s.index];
      if (!who) throw new Error(`no player ${s.index}`);
      expect(fullLine(who).length * 6).toBeLessThanOrEqual(230);
      expect(s.line.length * 6).toBeLessThanOrEqual(230);
    }
    expect(stars[0]!.points).toBeGreaterThanOrEqual(stars[2]!.points);
  });
});
