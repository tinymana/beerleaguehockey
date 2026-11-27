/**
 * Names and numbers for a pick-up game, so a goal can say who scored. Drawn from the fictional name pools
 * with a seeded stream: the same seed gives the same two teams. These are throwaway pick-up players, not
 * league rosters; they have no attributes and are not saved.
 */
import { Rng } from '../core/rng';
import { randomName } from './names';

export interface RosterPlayer {
  number: number;
  first: string;
  last: string;
  /** Which of the preset faces is his portrait. */
  face: number;
}

export const PICKUP_ROSTER = {
  /** Skaters a side. */
  size: 5,
  /** Sweater numbers are drawn from this range; no two on a team share one. */
  numbers: [2, 98] as const,
  /** Preset faces to draw portraits from (batch 16.02). */
  faces: 24,
  /** The numbers a goalie wears, in order of preference. */
  goalieNumbers: [1, 30, 31, 35, 33] as const,
};

/** Where the two goalies sit in the roster, after the ten skaters. */
export const GOALIE_INDEX: readonly [number, number] = [10, 11];

/** Two teams, in the order the game holds them: home's five skaters, away's five, then home's goalie and away's goalie. */
export function makePickupRoster(seed: number): RosterPlayer[] {
  const rng = new Rng(seed).fork('pickup-roster');
  const players: RosterPlayer[] = [];
  const names = new Set<string>();
  const faces = new Set<number>();
  const numbers = [new Set<number>(), new Set<number>()];
  for (let team = 0; team < 2; team++) {
    const taken = numbers[team] as Set<number>;
    for (let i = 0; i < PICKUP_ROSTER.size; i++) {
      let number = 0;
      do number = PICKUP_ROSTER.numbers[0] + rng.int(PICKUP_ROSTER.numbers[1] - PICKUP_ROSTER.numbers[0] + 1);
      while (taken.has(number));
      taken.add(number);
      let name = randomName(rng);
      while (names.has(`${name.first} ${name.last}`)) name = randomName(rng);
      names.add(`${name.first} ${name.last}`);
      // No two players share a face.
      let face = rng.int(PICKUP_ROSTER.faces);
      while (faces.has(face)) face = rng.int(PICKUP_ROSTER.faces);
      faces.add(face);
      players.push({ number, first: name.first, last: name.last, face });
    }
  }
  // The goalies come last, so adding them did not change who the skaters are. Goalie numbers, if free.
  for (let team = 0; team < 2; team++) {
    const taken = numbers[team] as Set<number>;
    const number = PICKUP_ROSTER.goalieNumbers.find((n) => !taken.has(n)) ?? 1;
    let name = randomName(rng);
    while (names.has(`${name.first} ${name.last}`)) name = randomName(rng);
    names.add(`${name.first} ${name.last}`);
    let face = rng.int(PICKUP_ROSTER.faces);
    while (faces.has(face)) face = rng.int(PICKUP_ROSTER.faces);
    faces.add(face);
    players.push({ number, first: name.first, last: name.last, face });
  }
  return players;
}

/** "#19 Marty Kowalski" */
export function fullLine(p: RosterPlayer): string {
  return `#${p.number} ${p.first} ${p.last}`;
}

/** "#19 M. Kowalski" */
export function shortLine(p: RosterPlayer): string {
  return `#${p.number} ${p.first.charAt(0)}. ${p.last}`;
}
