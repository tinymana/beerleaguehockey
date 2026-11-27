/**
 * The three stars of the game. Pure: no Phaser here, so it can be tested.
 * The scoring below is a starting formula for hands-on testing, not approved balance.
 */
import { GOALIE_INDEX } from '../dynasty/pickupRoster';
import type { MatchState } from '../match/sim/match';

export const STARS = {
  goal: 3,
  assist: 2,
  /** A goalie's night: points for each save, taken off for each goal against, and a bonus for a shutout. */
  save: 0.3,
  goalAgainst: 1.5,
  shutout: 4,
};

export interface Star {
  /** Place in the roster. */
  index: number;
  team: 0 | 1;
  goalie: boolean;
  points: number;
  goals: number;
  /** "2 goals, 1 assist" or "23 saves, shutout". */
  line: string;
}

const count = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Every player's night, best first. Ties go to the winning side, then to goals, then to roster order. */
export function rankPlayers(m: MatchState, score: readonly [number, number]): Star[] {
  const out: Star[] = [];
  for (let index = 0; index < 10; index++) {
    const team: 0 | 1 = index < 5 ? 0 : 1;
    const goals = m.goals.filter((g) => g.scorer === index).length;
    const assists = m.goals.filter((g) => g.assists.includes(index)).length;
    const parts = [goals ? count(goals, 'goal') : '', assists ? count(assists, 'assist') : ''].filter(Boolean);
    out.push({ index, team, goalie: false, goals, points: goals * STARS.goal + assists * STARS.assist, line: parts.join(', ') || 'Steady game' });
  }
  for (const team of [0, 1] as const) {
    const saves = m.stats[team].saves;
    const against = score[team === 0 ? 1 : 0];
    const shutout = against === 0;
    out.push({
      index: GOALIE_INDEX[team],
      team,
      goalie: true,
      goals: 0,
      points: saves * STARS.save - against * STARS.goalAgainst + (shutout ? STARS.shutout : 0),
      line: `${count(saves, 'save')}${shutout ? ', shutout' : ''}`,
    });
  }
  return out.sort((a, b) => b.points - a.points || Number(b.team === m.winner) - Number(a.team === m.winner) || b.goals - a.goals || a.index - b.index);
}

/** The three stars, first star first. */
export function threeStars(m: MatchState, score: readonly [number, number]): Star[] {
  return rankPlayers(m, score).slice(0, 3);
}
