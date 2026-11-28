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

/** The stars are revealed one at a time, third star first. Seconds between them, and how long the panel ignores Shoot at the horn. */
export const REVEAL = { every: 1.6, deaf: 0.5 };

/** How many stars are up after this many seconds on the panel: one straight away, then one more each beat. */
export function starsShown(seconds: number): number {
  return Math.max(1, Math.min(3, 1 + Math.floor(seconds / REVEAL.every)));
}

/** Is this star (0 first star, 2 third) up yet? The third star comes first. */
export function starUp(star: number, shown: number): boolean {
  return star >= 3 - shown;
}

/** What a press of Shoot does to the panel's clock: nothing at the horn, else on to the next star; null when all three are up (leave the panel). */
export function pressOnStars(seconds: number): number | null {
  if (seconds < REVEAL.deaf) return seconds;
  const shown = starsShown(seconds);
  return shown >= 3 ? null : shown * REVEAL.every;
}

/** The three stars, first star first. */
export function threeStars(m: MatchState, score: readonly [number, number]): Star[] {
  return rankPlayers(m, score).slice(0, 3);
}
