/**
 * Hockey background: how much hockey a player has behind them. It sets starting experience
 * and general starting ability, and nothing else. Distribution, tendencies and potential
 * come from Hockey Influences (Decision 34).
 *
 * Every number here is a proposed balancing value, not a final one.
 */
export interface HockeyBackground {
  id: string;
  label: string;
  /** Youngest age at which this background is believable. A created player starts at 18. */
  minAge: number;
  /** Centre of the starting overall rating. */
  level: number;
  /** Starting overall varies this much either side of `level`. */
  spread: number;
  /** -1 (new to the game) to +1 (a lifetime in it): shifts the attributes that come from experience. */
  experience: number;
}

export const CREATED_PLAYER_AGE = 18;

export const BACKGROUNDS: readonly HockeyBackground[] = [
  { id: 'beginner', label: 'Complete beginner', minAge: 16, level: 16, spread: 4, experience: -1 },
  { id: 'pond', label: 'Pond hockey', minAge: 16, level: 22, spread: 5, experience: -0.6 },
  { id: 'roller', label: 'Roller hockey convert', minAge: 16, level: 24, spread: 5, experience: -0.4 },
  { id: 'youth', label: 'Youth hockey', minAge: 16, level: 28, spread: 5, experience: -0.1 },
  { id: 'highSchool', label: 'High school', minAge: 17, level: 34, spread: 5, experience: 0.2 },
  { id: 'junior', label: 'Junior', minAge: 18, level: 44, spread: 6, experience: 0.5 },
  { id: 'college', label: 'College', minAge: 22, level: 55, spread: 6, experience: 0.7 },
  { id: 'recVeteran', label: 'Returning rec veteran', minAge: 30, level: 40, spread: 8, experience: 0.8 },
  { id: 'minorPro', label: 'Former minor-league pro', minAge: 24, level: 68, spread: 5, experience: 0.9 },
  { id: 'formerPro', label: 'Former pro', minAge: 26, level: 80, spread: 5, experience: 1 },
];

const BY_ID = new Map(BACKGROUNDS.map((b) => [b.id, b]));

export function backgroundById(id: string): HockeyBackground | undefined {
  return BY_ID.get(id);
}

/** Backgrounds a player of this age can have. An 18-year-old cannot be a former pro. */
export function backgroundsForAge(age: number): HockeyBackground[] {
  return BACKGROUNDS.filter((b) => b.minAge <= age);
}
