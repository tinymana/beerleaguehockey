/**
 * Player attributes: what they are, who has which, and the four layers a rating is built from.
 * Pure data and arithmetic. No Phaser, no DOM, no clock.
 */
export type Position = 'forward' | 'defense' | 'goalie';

export const SKATER_ATTRIBUTES = [
  'skatingSpeed',
  'acceleration',
  'agility',
  'balance',
  'endurance',
  'wristShotPower',
  'wristShotAccuracy',
  'slapShotPower',
  'slapShotAccuracy',
  'passing',
  'puckControl',
  'offensiveAwareness',
  'defensiveAwareness',
  'checking',
  'strength',
  'discipline',
  'faceoffs',
  'durability',
  'leadership',
  'composure',
  'hockeyIQ',
] as const;

/** Proposed goaltending set (the brief asks for one without listing it). */
export const GOALIE_ONLY_ATTRIBUTES = ['reflexes', 'positioning', 'gloveHand', 'blocker', 'padSaves', 'reboundControl', 'recovery', 'puckHandling'] as const;

/** Attributes a goalie shares with skaters. */
export const GOALIE_SHARED_ATTRIBUTES = ['agility', 'balance', 'endurance', 'strength', 'durability', 'discipline', 'leadership', 'composure', 'hockeyIQ'] as const;

export const GOALIE_ATTRIBUTES = [...GOALIE_ONLY_ATTRIBUTES, ...GOALIE_SHARED_ATTRIBUTES] as const;

export type SkaterAttribute = (typeof SKATER_ATTRIBUTES)[number];
export type GoalieAttribute = (typeof GOALIE_ATTRIBUTES)[number];
export type AttributeKey = SkaterAttribute | GoalieAttribute;

export const ATTRIBUTE_LABELS: Readonly<Record<AttributeKey, string>> = {
  skatingSpeed: 'Skating speed',
  acceleration: 'Acceleration',
  agility: 'Agility',
  balance: 'Balance',
  endurance: 'Endurance',
  wristShotPower: 'Wrist shot power',
  wristShotAccuracy: 'Wrist shot accuracy',
  slapShotPower: 'Slap shot power',
  slapShotAccuracy: 'Slap shot accuracy',
  passing: 'Passing',
  puckControl: 'Puck control',
  offensiveAwareness: 'Offensive awareness',
  defensiveAwareness: 'Defensive awareness',
  checking: 'Checking',
  strength: 'Strength',
  discipline: 'Discipline',
  faceoffs: 'Faceoffs',
  durability: 'Durability',
  leadership: 'Leadership',
  composure: 'Composure',
  hockeyIQ: 'Hockey IQ',
  reflexes: 'Reflexes',
  positioning: 'Positioning',
  gloveHand: 'Glove hand',
  blocker: 'Blocker',
  padSaves: 'Pad saves',
  reboundControl: 'Rebound control',
  recovery: 'Recovery',
  puckHandling: 'Puck handling',
};

/** Attributes that come from time around the game rather than from the body. Hockey background moves these. */
export const EXPERIENCE_ATTRIBUTES: readonly AttributeKey[] = ['offensiveAwareness', 'defensiveAwareness', 'discipline', 'leadership', 'composure', 'hockeyIQ', 'positioning', 'reboundControl'];

export const RATING_MIN = 1;
export const RATING_MAX = 99;

export type Ratings = Partial<Record<AttributeKey, number>>;

export function attributesFor(position: Position): readonly AttributeKey[] {
  return position === 'goalie' ? GOALIE_ATTRIBUTES : SKATER_ATTRIBUTES;
}

export function clampRating(value: number): number {
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

/** Mean of a set of ratings, to one decimal. */
export function overall(ratings: Ratings, keys: readonly AttributeKey[]): number {
  const sum = keys.reduce((total, key) => total + (ratings[key] ?? 0), 0);
  return Math.round((sum / Math.max(1, keys.length)) * 10) / 10;
}

/** A modifier that wears off: fatigue, a hot streak, playing hurt. It never changes the stored ratings. */
export interface TemporaryModifier {
  id: string;
  attribute: AttributeKey;
  amount: number;
  reason: string;
}

/** A change that stays: a lasting injury, decline with age. Recorded, never erased. */
export interface PermanentChange {
  id: string;
  attribute: AttributeKey;
  /** Applied to current ability. */
  current: number;
  /** Applied to natural potential. */
  potential: number;
  reason: string;
}

/**
 * The four things the design keeps apart: current ability, natural potential,
 * temporary modifiers, and the log of permanent career changes.
 */
export interface PlayerAttributes {
  position: Position;
  current: Ratings;
  potential: Ratings;
  temporary: readonly TemporaryModifier[];
  permanent: readonly PermanentChange[];
}

/** The rating in effect right now: current ability plus whatever is temporarily in play. */
export function effectiveRating(attributes: PlayerAttributes, key: AttributeKey): number {
  const base = attributes.current[key];
  if (base === undefined) return 0;
  const temporary = attributes.temporary.filter((m) => m.attribute === key).reduce((sum, m) => sum + m.amount, 0);
  return clampRating(base + temporary);
}

/** Record a permanent change. Returns a new object; the change is appended to the log and applied once. */
export function applyPermanentChange(attributes: PlayerAttributes, change: PermanentChange): PlayerAttributes {
  if (attributes.permanent.some((c) => c.id === change.id)) return attributes;
  const current = attributes.current[change.attribute];
  const potential = attributes.potential[change.attribute];
  if (current === undefined || potential === undefined) throw new Error(`A ${attributes.position} has no ${change.attribute}`);
  const nextPotential = clampRating(potential + change.potential);
  return {
    ...attributes,
    current: { ...attributes.current, [change.attribute]: clampRating(current + change.current) },
    potential: { ...attributes.potential, [change.attribute]: nextPotential },
    permanent: [...attributes.permanent, change],
  };
}

export function withTemporary(attributes: PlayerAttributes, modifier: TemporaryModifier): PlayerAttributes {
  return { ...attributes, temporary: [...attributes.temporary.filter((m) => m.id !== modifier.id), modifier] };
}

export function withoutTemporary(attributes: PlayerAttributes, id: string): PlayerAttributes {
  return { ...attributes, temporary: attributes.temporary.filter((m) => m.id !== id) };
}
