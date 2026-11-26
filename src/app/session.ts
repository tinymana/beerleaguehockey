/** App-wide singletons for the prototype: the live tuning values and their panel. */
import { cloneTuning } from '../match/sim/tuning';
import { TuningPanel, loadSavedTuning } from './tuningPanel';

export const tuning = cloneTuning();
loadSavedTuning(tuning);

/** Which arena configuration the game uses. Chosen in the Arena Asset Lab. */
export const arenaChoice = { id: 'standard' };

/** What Pick-Up opens: the 5-on-5 test game, or one skater for skating and shooting practice. T switches. */
export const matchMode = { teams: true };

let panel: TuningPanel | null = null;

export function tuningPanel(): TuningPanel {
  if (!panel) panel = new TuningPanel(tuning);
  return panel;
}

/**
 * The player made in Create a Player this session. Held in memory only:
 * there is no save system yet, so it is gone when the page closes.
 */
export const createdPlayer: { dna: import('../dynasty/dna').PlayerDNA | null } = { dna: null };
