/**
 * Player DNA: the permanent record of how a player was made.
 *
 * Hockey background sets the starting level. Hockey Influences set how that level is
 * spread across attributes, where it can grow, and how the player tends to play.
 * Everything is rolled from one seed through named streams, so the same choices and
 * the same seed always produce the same player.
 */
import { Rng } from '../core/rng';
import type { AttributeKey, PlayerAttributes, Position, Ratings } from './attributes';
import { EXPERIENCE_ATTRIBUTES, RATING_MAX, RATING_MIN, attributesFor, clampRating } from './attributes';
import { backgroundById } from './backgrounds';
import { influenceById, influenceWeight } from './influences';

export const DNA_VERSION = 1;

/** Generation settings. Proposed balancing values: data, not rules. */
export interface DnaConfig {
  /** How much each influence counts: primary first, then the secondaries in the order chosen. Indexed by number of secondaries (0, 1, 2). */
  shares: readonly (readonly number[])[];
  /** Rating points per unit of influence weight at the start of a career. */
  currentScale: number;
  /** Random variation in each starting attribute, either side. */
  currentNoise: number;
  /** Rating points a background's experience moves the experience attributes, at +1 or -1. */
  experienceScale: number;
  /** Centre and spread of natural talent: the level potential is built around. */
  talentMean: number;
  talentSpread: number;
  /** Rating points per unit of influence weight in potential. Larger than currentScale: influences show more as a player grows. */
  potentialScale: number;
  potentialNoise: number;
  /** Potential is always at least this far above the starting rating. */
  minimumGrowth: number;
  /** How many strengths and weaknesses are named. */
  highlights: number;
  maxTendencies: number;
}

export const DNA_CONFIG: DnaConfig = {
  // Decision 41: primary 60%, first secondary 25%, second secondary 15%, for review.
  // With one secondary the 60 and 25 are scaled up to fill the whole: 60/85 and 25/85.
  shares: [[1], [60 / 85, 25 / 85], [0.6, 0.25, 0.15]],
  currentScale: 4,
  currentNoise: 4,
  experienceScale: 4,
  talentMean: 60,
  talentSpread: 16,
  potentialScale: 9,
  potentialNoise: 6,
  minimumGrowth: 4,
  highlights: 3,
  maxTendencies: 4,
};

export const MAX_SECONDARY_INFLUENCES = 2;

export interface DnaInput {
  seed: number;
  position: Position;
  background: string;
  primary: string;
  /** Zero, one or two. */
  secondaries: readonly string[];
}

export interface PlayerDNA extends DnaInput {
  version: number;
  /** Natural talent rolled for this player: the level potential is built around. */
  talent: number;
  /** Ratings on the day the player was created. Never changes. */
  start: Ratings;
  /** Natural ceiling for each attribute. */
  potential: Ratings;
  strengths: AttributeKey[];
  weaknesses: AttributeKey[];
  tendencies: string[];
}

export function dnaInputProblems(input: DnaInput): string[] {
  const problems: string[] = [];
  if (!Number.isInteger(input.seed)) problems.push('seed must be an integer');
  if (!backgroundById(input.background)) problems.push(`unknown background ${input.background}`);
  if (input.secondaries.length > MAX_SECONDARY_INFLUENCES) problems.push(`at most ${MAX_SECONDARY_INFLUENCES} secondary influences`);
  const all = [input.primary, ...input.secondaries];
  if (new Set(all).size !== all.length) problems.push('the same influence is chosen twice');
  for (const id of all) {
    const influence = influenceById(id);
    if (!influence) problems.push(`unknown influence ${id}`);
    else if ((influence.position === 'goalie') !== (input.position === 'goalie')) problems.push(`${id} is not an influence for a ${input.position}`);
  }
  return problems;
}

/** Blended influence weight per attribute, shifted so the average is zero: influences move ability around, they do not add any. */
export function influenceBias(input: DnaInput, config: DnaConfig = DNA_CONFIG): Record<string, number> {
  const keys = attributesFor(input.position);
  const shares = config.shares[input.secondaries.length] ?? [1];
  const picks = [input.primary, ...input.secondaries].map((id) => influenceById(id));
  const raw = keys.map((key) => picks.reduce((sum, influence, i) => sum + (influence ? influenceWeight(influence, key) * (shares[i] ?? 0) : 0), 0));
  const mean = raw.reduce((a, b) => a + b, 0) / keys.length;
  return Object.fromEntries(keys.map((key, i) => [key, (raw[i] ?? 0) - mean]));
}

function experienceShift(key: AttributeKey, experience: number, config: DnaConfig): number {
  return EXPERIENCE_ATTRIBUTES.includes(key) ? experience * config.experienceScale : 0;
}

/** A roll between -spread and +spread, most often near the middle. */
function vary(rng: Rng, spread: number): number {
  return (rng.next() + rng.next() - 1) * spread;
}

export function generateDNA(input: DnaInput, config: DnaConfig = DNA_CONFIG): PlayerDNA {
  const problems = dnaInputProblems(input);
  if (problems.length) throw new Error(`Cannot generate player DNA: ${problems.join('; ')}`);
  const background = backgroundById(input.background);
  if (!background) throw new Error('unreachable');
  const keys = attributesFor(input.position);
  const bias = influenceBias(input, config);
  const root = new Rng(input.seed);
  const level = background.level + vary(root.fork('level'), background.spread);
  const talent = config.talentMean + vary(root.fork('talent'), config.talentSpread);
  const currentRng = root.fork('current');
  const potentialRng = root.fork('potential');

  const start: Ratings = {};
  const potential: Ratings = {};
  for (const key of keys) {
    const b = bias[key] ?? 0;
    const current = clampRating(level + b * config.currentScale + experienceShift(key, background.experience, config) + vary(currentRng, config.currentNoise));
    const ceiling = talent + b * config.potentialScale + vary(potentialRng, config.potentialNoise);
    start[key] = current;
    potential[key] = clampRating(Math.max(current + config.minimumGrowth, ceiling));
  }

  // Natural strengths and weaknesses: where the ceiling is highest and lowest. Ties keep attribute order.
  const ranked = [...keys].sort((a, b) => (potential[b] ?? 0) - (potential[a] ?? 0) || keys.indexOf(a) - keys.indexOf(b));
  const tendencies: string[] = [];
  for (const id of [input.primary, ...input.secondaries]) {
    for (const tag of influenceById(id)?.tags ?? []) {
      if (!tendencies.includes(tag) && tendencies.length < config.maxTendencies) tendencies.push(tag);
    }
  }

  return {
    version: DNA_VERSION,
    seed: input.seed,
    position: input.position,
    background: input.background,
    primary: input.primary,
    secondaries: [...input.secondaries],
    talent: Math.round(talent * 10) / 10,
    start,
    potential,
    strengths: ranked.slice(0, config.highlights),
    weaknesses: ranked.slice(-config.highlights).reverse(),
    tendencies,
  };
}

export interface AttributeBounds {
  current: [number, number];
  potential: [number, number];
}

/** The range a given set of choices can roll for one attribute, whatever the seed. */
export function attributeBounds(input: DnaInput, key: AttributeKey, config: DnaConfig = DNA_CONFIG): AttributeBounds {
  const background = backgroundById(input.background);
  if (!background) throw new Error(`unknown background ${input.background}`);
  const b = influenceBias(input, config)[key] ?? 0;
  const centre = background.level + b * config.currentScale + experienceShift(key, background.experience, config);
  const reach = background.spread + config.currentNoise;
  const current: [number, number] = [clampRating(centre - reach), clampRating(centre + reach)];
  const talentCentre = config.talentMean + b * config.potentialScale;
  const talentReach = config.talentSpread + config.potentialNoise;
  return {
    current,
    potential: [clampRating(Math.max(current[0] + config.minimumGrowth, talentCentre - talentReach)), clampRating(Math.max(current[1] + config.minimumGrowth, talentCentre + talentReach))],
  };
}

/** The attribute record a new player starts their career with. */
export function startingAttributes(dna: PlayerDNA): PlayerAttributes {
  return { position: dna.position, current: { ...dna.start }, potential: { ...dna.potential }, temporary: [], permanent: [] };
}

/** DNA as it goes into a save. */
export function serializeDNA(dna: PlayerDNA): string {
  return JSON.stringify(dna);
}

/** Read DNA back from a save. Refuses anything it does not fully understand rather than guessing. */
export function parseDNA(text: string): PlayerDNA {
  const raw = JSON.parse(text) as Partial<PlayerDNA>;
  if (raw.version !== DNA_VERSION) throw new Error(`Player DNA version ${String(raw.version)} is not supported (expected ${DNA_VERSION})`);
  const input: DnaInput = {
    seed: raw.seed as number,
    position: raw.position as Position,
    background: raw.background as string,
    primary: raw.primary as string,
    secondaries: raw.secondaries ?? [],
  };
  if (input.position !== 'forward' && input.position !== 'defense' && input.position !== 'goalie') throw new Error('Player DNA has no valid position');
  const problems = dnaInputProblems(input);
  if (problems.length) throw new Error(`Player DNA is not valid: ${problems.join('; ')}`);
  const keys = attributesFor(input.position);
  for (const set of [raw.start, raw.potential]) {
    for (const key of keys) {
      const value = set?.[key];
      if (typeof value !== 'number' || value < RATING_MIN || value > RATING_MAX) throw new Error(`Player DNA is missing a valid ${key}`);
    }
  }
  return raw as PlayerDNA;
}
