/**
 * Where created players are kept: this browser's local storage, for now. This is the first thing the
 * game saves. It is not a career save. If the stored text cannot be read it is left where it is and a
 * copy is set aside, never overwritten silently.
 */
import type { CreatedPlayerStore } from '../dynasty/createdPlayer';
import { emptyStore, parseStore, serializeStore } from '../dynasty/createdPlayer';

const KEY = 'blh.createdPlayers';
const DAMAGED_KEY = 'blh.createdPlayers.damaged';

export interface LoadResult {
  store: CreatedPlayerStore;
  /** Set when stored players could not be read. Saving is refused until the damaged copy has been set aside. */
  warning: string | null;
}

export function loadCreatedPlayers(): LoadResult {
  let text: string | null = null;
  try {
    text = window.localStorage.getItem(KEY);
  } catch {
    return { store: emptyStore(), warning: 'This browser will not let the game save. Players made now will be lost when the page closes.' };
  }
  if (!text) return { store: emptyStore(), warning: null };
  try {
    return { store: parseStore(text), warning: null };
  } catch (error) {
    try {
      window.localStorage.setItem(DAMAGED_KEY, text);
    } catch {
      // Nothing more can be done here; the original is still under KEY until a new player is confirmed.
    }
    return { store: emptyStore(), warning: `Saved players could not be read (${error instanceof Error ? error.message : 'unknown'}). A copy was set aside.` };
  }
}

export function saveCreatedPlayers(store: CreatedPlayerStore): boolean {
  try {
    window.localStorage.setItem(KEY, serializeStore(store));
    return true;
  } catch {
    return false;
  }
}
