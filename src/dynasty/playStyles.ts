/**
 * Play Styles: the gameplay identity a player chooses (Decision 43).
 *
 * A style leans a new player's starting ratings toward some attributes and away from
 * others, inside the same budget the influences use (Decision 48), and marks which
 * attributes will develop faster once progression exists. It never raises a ceiling.
 *
 * The styles and their leanings are approved as initial balancing values (Decisions 57, 62).
 */
import type { AttributeKey, Position } from './attributes';

export interface PlayStyle {
  id: string;
  name: string;
  positions: readonly Position[];
  /** Leans toward, most characteristic first. Empty for a balanced style. */
  toward: readonly AttributeKey[];
  away: readonly AttributeKey[];
  /** Attributes that develop faster, when they are not simply the ones leaned toward. */
  develops?: readonly AttributeKey[];
  /** How much faster, when it is not the standard rate in DNA_CONFIG.playStyleDevelopment. */
  developmentRate?: number;
}

const F: readonly Position[] = ['forward'];
const D: readonly Position[] = ['defense'];
const FD: readonly Position[] = ['forward', 'defense'];
const G: readonly Position[] = ['goalie'];

export const PLAY_STYLES: readonly PlayStyle[] = [
  { id: 'PS01', name: 'Sniper', positions: F, toward: ['wristShotAccuracy', 'wristShotPower', 'offensiveAwareness'], away: ['passing', 'defensiveAwareness'] },
  { id: 'PS02', name: 'Playmaker', positions: F, toward: ['passing', 'hockeyIQ', 'offensiveAwareness'], away: ['wristShotPower', 'checking'] },
  { id: 'PS03', name: 'Dangler', positions: F, toward: ['puckControl', 'agility', 'composure'], away: ['passing', 'defensiveAwareness'] },
  { id: 'PS04', name: 'Power Forward', positions: F, toward: ['strength', 'balance', 'checking', 'wristShotPower'], away: ['agility', 'discipline'] },
  { id: 'PS05', name: 'Two-Way Forward', positions: F, toward: ['defensiveAwareness', 'hockeyIQ', 'discipline', 'faceoffs'], away: ['wristShotAccuracy', 'slapShotPower'] },
  { id: 'PS06', name: 'Grinder', positions: F, toward: ['endurance', 'checking', 'durability'], away: ['puckControl', 'wristShotAccuracy'] },
  { id: 'PS07', name: 'Speedster', positions: FD, toward: ['skatingSpeed', 'acceleration'], away: ['strength', 'checking'] },
  { id: 'PS08', name: 'One-Timer Guy', positions: FD, toward: ['slapShotPower', 'slapShotAccuracy'], away: ['defensiveAwareness', 'endurance'] },
  { id: 'PS09', name: 'Enforcer', positions: FD, toward: ['strength', 'checking', 'durability'], away: ['discipline', 'puckControl'] },
  { id: 'PS10', name: 'Offensive Defenseman', positions: D, toward: ['skatingSpeed', 'passing', 'offensiveAwareness'], away: ['defensiveAwareness', 'checking'] },
  { id: 'PS11', name: 'Shutdown Defenseman', positions: D, toward: ['defensiveAwareness', 'strength', 'discipline'], away: ['offensiveAwareness', 'skatingSpeed'] },
  { id: 'PS12', name: 'Puck Mover', positions: D, toward: ['passing', 'hockeyIQ', 'composure'], away: ['checking', 'strength'] },
  { id: 'PS13', name: 'Bruiser', positions: D, toward: ['checking', 'strength', 'balance'], away: ['agility', 'discipline'] },
  { id: 'PS14', name: 'Butterfly Goalie', positions: G, toward: ['positioning', 'padSaves'], away: ['gloveHand', 'puckHandling'] },
  { id: 'PS15', name: 'Stand-Up Goalie', positions: G, toward: ['positioning', 'gloveHand', 'balance'], away: ['padSaves', 'recovery'] },
  { id: 'PS16', name: 'Acrobat', positions: G, toward: ['reflexes', 'recovery', 'agility'], away: ['positioning', 'reboundControl'] },
  { id: 'PS17', name: 'Puck-Handling Goalie', positions: G, toward: ['puckHandling', 'composure'], away: ['padSaves', 'discipline'] },
  // Decision 62: versatility rather than specialization. A flat allocation, and a small development edge spread over six technique attributes.
  { id: 'PS18', name: 'Hybrid Goalie', positions: G, toward: [], away: [], develops: ['reflexes', 'positioning', 'gloveHand', 'blocker', 'padSaves', 'recovery'], developmentRate: 0.07 },
];

const BY_ID = new Map(PLAY_STYLES.map((style) => [style.id, style]));

export function playStyleById(id: string): PlayStyle | undefined {
  return BY_ID.get(id);
}

export function playStylesFor(position: Position): PlayStyle[] {
  return PLAY_STYLES.filter((style) => style.positions.includes(position));
}

/** The same scale influences use: 2 for the most characteristic attribute, 1 for the others leaned toward, -1 for those leaned away from. */
export function playStyleWeight(style: PlayStyle, key: AttributeKey): number {
  const at = style.toward.indexOf(key);
  if (at === 0) return 2;
  if (at > 0) return 1;
  return style.away.includes(key) ? -1 : 0;
}

/** Whether this attribute is one the style develops faster (used by progression, when it exists). */
export function developsFaster(style: PlayStyle, key: AttributeKey): boolean {
  return (style.develops ?? style.toward).includes(key);
}

/** The attributes this style develops faster. */
export function developmentFocus(style: PlayStyle): readonly AttributeKey[] {
  return style.develops ?? style.toward;
}

/** How much faster this attribute develops under this style: 0 when it is not one of the style's. Nothing is ever slowed (Decision 57). */
export function developmentBonus(style: PlayStyle, key: AttributeKey, standardRate: number): number {
  return developsFaster(style, key) ? (style.developmentRate ?? standardRate) : 0;
}
