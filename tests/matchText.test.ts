import { describe, expect, it } from 'vitest';
import { goalCardLines, penaltyCardLines, penaltyClockLine, scoringLine, scoringLines } from '../src/app/matchText';
import { makePickupRoster } from '../src/dynasty/pickupRoster';
import type { RosterPlayer } from '../src/dynasty/pickupRoster';
import { REFEREES, emptyStats } from '../src/match/sim/match';
import type { GoalRecord, MatchState } from '../src/match/sim/match';

const ROSTER: RosterPlayer[] = [
  { number: 19, first: 'Marty', last: 'Kowalski', face: 0 },
  { number: 7, first: 'Dale', last: 'Brandt', face: 1 },
  { number: 22, first: 'Olli', last: 'Virtanen', face: 2 },
  { number: 4, first: 'Sam', last: 'Hurst', face: 3 },
  { number: 55, first: 'Pavel', last: 'Novy', face: 4 },
  { number: 9, first: 'Lars', last: 'Holm', face: 5 },
];
const goal = (over: Partial<GoalRecord>): GoalRecord => ({ team: 0, scorer: 0, assists: [], period: 1, time: 101, powerPlay: false, ...over });
function state(goals: GoalRecord[]): MatchState {
  const ref = REFEREES[0];
  if (!ref) throw new Error('no referee');
  return {
    phase: 'whistle', period: 2, clock: 75, reason: 'goal', dot: { x: 0, y: 0 }, timer: 1, sinceDrop: 0, taker: [0, 5], aiPress: [0, 0], locked: [0, 0],
    penalties: [], pending: null, stats: [emptyStats(), emptyStats()], goals, referee: ref, shootout: null, winner: null,
  };
}

describe('the words on the cards and the summary (Decision 91)', () => {
  it('goal card: side, scorer with his tally, assists in passing order, time and score', () => {
    const second = goal({ assists: [1, 2], period: 2, time: 42, powerPlay: true });
    const m = state([goal({}), goal({ team: 1, scorer: 5 }), second]);
    expect(goalCardLines(m, second, ROSTER, [2, 1])).toEqual([
      'Home goal  -  power play',
      '#19 Marty Kowalski (2)',
      'Assists: #7 Brandt, #22 Virtanen',
      '2nd 0:42     Home 2  Away 1',
    ]);
    const solo = goal({ team: 1, scorer: 5 });
    expect(goalCardLines(state([solo]), solo, ROSTER, [0, 1]).slice(0, 3)).toEqual(['Away goal', '#9 Lars Holm (1)', 'Unassisted']);
    const own = goal({ scorer: -1 });
    expect(goalCardLines(state([own]), own, ROSTER, [1, 0]).slice(1, 3)).toEqual(['Off a defender', '']);
  });

  it('penalty card and the penalty clock name the player', () => {
    const m = state([]);
    m.penalties = [{ skater: 3, team: 0, foul: 'tripping', left: 14.2 }, { skater: 5, team: 1, foul: 'roughing', left: 3 }];
    expect(penaltyCardLines(m, m.penalties[0]!, ROSTER)).toEqual(['Home penalty', '#4 Sam Hurst', 'Tripping', '2 minutes     2nd 1:15']);
    expect(penaltyClockLine(m, ROSTER)).toBe('#4 Hurst tripping 0:15   #9 Holm roughing 0:03');
  });

  it('scoring summary: one line a goal, older goals folded into a count when there are too many', () => {
    expect(scoringLine(goal({ assists: [1, 2], powerPlay: true }), ROSTER)).toBe('1st 1:41 Home #19 M. Kowalski (#7, #22) PP');
    expect(scoringLines(state([]), ROSTER, 5)).toEqual(['No scoring']);
    const seven = [1, 2, 3, 4, 5, 6, 7].map((i) => goal({ time: 100 - i }));
    const lines = scoringLines(state(seven), ROSTER, 5);
    expect(lines.length).toBe(5);
    expect(lines[0]).toBe('3 earlier goals');
    expect(lines[4]).toBe(scoringLine(seven[6]!, ROSTER));
    expect(scoringLines(state(seven.slice(0, 5)), ROSTER, 5).length).toBe(5);
  });

  it('every line fits the card and the panel in the game font (6 px a letter)', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const roster = makePickupRoster(seed);
      const g = goal({ assists: [1, 2], powerPlay: true, period: 3, time: 179 });
      for (const line of goalCardLines(state([g]), g, roster, [10, 10])) expect(line.length * 6, line).toBeLessThanOrEqual(260);
      expect(scoringLine(g, roster).length * 6).toBeLessThanOrEqual(300);
      // Ten players, ten faces.
      expect(new Set(roster.map((p) => p.face)).size).toBe(10);
      for (const p of roster) expect(p.face >= 0 && p.face < 24).toBe(true);
    }
  });
});
