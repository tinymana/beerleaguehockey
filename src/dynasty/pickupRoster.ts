/**
 * Names and numbers for a pick-up game, so a goal can say who scored. Drawn from the fictional name pools
 * with a seeded stream: the same seed gives the same two teams. These are throwaway pick-up players, not
 * league rosters and are not saved. Each skater gets a few throwaway ratings so no two play quite alike, and a
 * created player can take a place on the home side with his own name, number, face and ratings (Decision 101).
 */
import { Rng } from '../core/rng';
import type { Ratings } from './attributes';
import type { CreatedPlayer } from './createdPlayer';
import { startingAttributes } from './dna';
import { randomName } from './names';

export interface RosterPlayer {
  number: number;
  first: string;
  last: string;
  /** Which of the preset faces is his portrait. */
  face: number;
  /** What he plays by on the ice. Goalies have none yet. */
  ratings: Ratings;
  /** The created player's id, when this place is his. */
  createdId?: number;
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
  /** Throwaway ratings for pick-up skaters: each one drawn evenly from this range. Starting values. */
  ratings: [20, 40] as const,
  /** The ratings a pick-up skater is given: the ones the ice uses. */
  rated: ['skatingSpeed', 'acceleration', 'agility', 'wristShotPower', 'wristShotAccuracy', 'slapShotPower', 'slapShotAccuracy', 'passing', 'checking'] as const,
  /** Where a created player goes on the home side: a forward at centre (0), a defenseman at left defense (3), a goalie in goal. */
  createdPlace: { forward: 0, defense: 3, goalie: 10 } as const,
};

/** Where the two goalies sit in the roster, after the ten skaters. */
export const GOALIE_INDEX: readonly [number, number] = [10, 11];

/** Two teams, in the order the game holds them: home's five skaters, away's five, then home's goalie and away's goalie. */
export function makePickupRoster(seed: number): RosterPlayer[] {
  const rng = new Rng(seed).fork('pickup-roster');
  // Ratings come from their own stream, so the names, numbers and faces a seed gives are what they always were.
  const rate = new Rng(seed).fork('pickup-ratings');
  const rated = (): Ratings => Object.fromEntries(PICKUP_ROSTER.rated.map((key) => [key, PICKUP_ROSTER.ratings[0] + rate.int(PICKUP_ROSTER.ratings[1] - PICKUP_ROSTER.ratings[0] + 1)]));
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
      players.push({ number, first: name.first, last: name.last, face, ratings: rated() });
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
    players.push({ number, first: name.first, last: name.last, face, ratings: {} });
  }
  return players;
}

/** The preset face a created player chose, as a place on the portrait sheet; null when his face is not on it. */
export function portraitOf(player: CreatedPlayer): number | null {
  const match = /^face:face_(\d+)$/.exec(player.appearance.face);
  const n = match ? Number(match[1]) : 0;
  return n >= 1 && n <= PICKUP_ROSTER.faces ? n - 1 : null;
}

/**
 * Put a created player on the home side in place of a pick-up player: his name, his number, his face and the
 * ratings he was created with. A teammate already wearing his number takes the number of the player he replaced.
 * Returns a new roster; the place he took is `PICKUP_ROSTER.createdPlace[position]`.
 */
export function withCreatedPlayer(roster: readonly RosterPlayer[], player: CreatedPlayer): RosterPlayer[] {
  const place = PICKUP_ROSTER.createdPlace[player.dna.position];
  const old = roster[place];
  if (!old) return [...roster];
  const out = roster.map((p) => ({ ...p }));
  const number = player.profile.number ?? old.number;
  // Home side only: his four line-mates and his goalie.
  const home = (i: number): boolean => i < PICKUP_ROSTER.size || i === GOALIE_INDEX[0];
  out.forEach((p, i) => {
    if (i !== place && home(i) && p.number === number) p.number = old.number;
  });
  const face = portraitOf(player);
  // Nobody else may wear his face.
  if (face !== null) {
    out.forEach((p, i) => {
      if (i !== place && p.face === face) p.face = old.face;
    });
  }
  out[place] = {
    number,
    first: player.firstName,
    last: player.lastName,
    face: face ?? old.face,
    // A goalie's ratings are not used on the ice yet.
    ratings: player.dna.position === 'goalie' ? {} : { ...startingAttributes(player.dna).current },
    createdId: player.id,
  };
  return out;
}

/** "#19 Marty Kowalski" */
export function fullLine(p: RosterPlayer): string {
  return `#${p.number} ${p.first} ${p.last}`;
}

/** "#19 M. Kowalski" */
export function shortLine(p: RosterPlayer): string {
  return `#${p.number} ${p.first.charAt(0)}. ${p.last}`;
}
