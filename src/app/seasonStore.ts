/**
 * The saved season, kept in the browser. A save that cannot be read is set aside, never overwritten in silence.
 */
import { parseSeason, serializeSeason } from '../dynasty/season';
import type { SeasonState } from '../dynasty/season';

const KEY = 'blh.season';
const DAMAGED_KEY = 'blh.season.damaged';

export interface SeasonLoad {
  state: SeasonState | null;
  warning: string | null;
}

export function loadSeason(): SeasonLoad {
  let text: string | null = null;
  try {
    text = window.localStorage.getItem(KEY);
  } catch {
    return { state: null, warning: 'This browser will not let the game save: a season will be lost when the page closes.' };
  }
  if (!text) return { state: null, warning: null };
  try {
    return { state: parseSeason(text), warning: null };
  } catch (error) {
    try {
      window.localStorage.setItem(DAMAGED_KEY, text);
    } catch {
      // Nothing more can be done; the original stays under KEY until a new season is started.
    }
    return { state: null, warning: `The saved season could not be read (${error instanceof Error ? error.message : 'unknown'}). A copy was set aside.` };
  }
}

export function saveSeason(state: SeasonState): boolean {
  try {
    window.localStorage.setItem(KEY, serializeSeason(state));
    return true;
  } catch {
    return false;
  }
}
