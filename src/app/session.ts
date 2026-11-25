/** App-wide singletons for the prototype: the live tuning values and their panel. */
import { cloneTuning } from '../match/sim/tuning';
import { TuningPanel, loadSavedTuning } from './tuningPanel';

export const tuning = cloneTuning();
loadSavedTuning(tuning);

let panel: TuningPanel | null = null;

export function tuningPanel(): TuningPanel {
  if (!panel) panel = new TuningPanel(tuning);
  return panel;
}
