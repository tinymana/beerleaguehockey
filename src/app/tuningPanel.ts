/**
 * Developer tuning panel. A DOM overlay, toggled with the backquote key,
 * that edits the live Tuning object. Development tool, not game UI.
 */
import { DEFAULT_TUNING, TUNING_SPECS } from '../match/sim/tuning';
import type { Tuning } from '../match/sim/tuning';

const STORAGE_KEY = 'blh.tuning.v1';

export function loadSavedTuning(target: Tuning): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<Record<keyof Tuning, unknown>>;
    for (const spec of TUNING_SPECS) {
      const value = saved[spec.key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        target[spec.key] = Math.min(spec.max, Math.max(spec.min, value));
      }
    }
  } catch {
    // Storage can be unavailable; defaults are fine.
  }
}

function saveTuning(tuning: Tuning): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tuning));
  } catch {
    // Ignore: tuning still applies for this session.
  }
}

function format(value: number, step: number): string {
  return step < 1 ? value.toFixed(2) : String(Math.round(value));
}

export class TuningPanel {
  private readonly root: HTMLDivElement;
  private readonly rows = new Map<keyof Tuning, { slider: HTMLInputElement; readout: HTMLSpanElement }>();

  constructor(private readonly tuning: Tuning) {
    this.root = document.createElement('div');
    this.root.id = 'tuning-panel';
    this.root.hidden = true;

    const title = document.createElement('div');
    title.className = 'tp-title';
    title.textContent = 'DEV TUNING  [`] TO CLOSE';
    this.root.appendChild(title);

    for (const spec of TUNING_SPECS) {
      const row = document.createElement('label');
      row.className = 'tp-row';
      row.title = spec.help;

      const name = document.createElement('span');
      name.className = 'tp-name';
      name.textContent = `${spec.label.toUpperCase()} (${spec.unit})`;

      const readout = document.createElement('span');
      readout.className = 'tp-value';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(spec.min);
      slider.max = String(spec.max);
      slider.step = String(spec.step);
      slider.addEventListener('input', () => {
        this.tuning[spec.key] = Number(slider.value);
        readout.textContent = format(this.tuning[spec.key], spec.step);
        saveTuning(this.tuning);
      });
      // Hand the keyboard back to the game after each adjustment.
      slider.addEventListener('change', () => slider.blur());
      slider.addEventListener('keydown', (e) => e.preventDefault());

      row.append(name, readout, slider);
      this.root.appendChild(row);
      this.rows.set(spec.key, { slider, readout });
    }

    const buttons = document.createElement('div');
    buttons.className = 'tp-buttons';
    const reset = document.createElement('button');
    reset.textContent = 'RESET DEFAULTS';
    reset.addEventListener('click', () => {
      Object.assign(this.tuning, DEFAULT_TUNING);
      saveTuning(this.tuning);
      this.refresh();
      reset.blur();
    });
    const copy = document.createElement('button');
    copy.textContent = 'COPY VALUES';
    copy.addEventListener('click', () => {
      const text = JSON.stringify(this.tuning, null, 2);
      void navigator.clipboard?.writeText(text).catch(() => undefined);
      copy.textContent = 'COPIED';
      window.setTimeout(() => (copy.textContent = 'COPY VALUES'), 900);
      copy.blur();
    });
    buttons.append(reset, copy);
    this.root.appendChild(buttons);

    const hint = document.createElement('div');
    hint.className = 'tp-hint';
    hint.textContent = 'CHANGES APPLY LIVE AND ARE REMEMBERED IN THIS BROWSER.';
    this.root.appendChild(hint);

    document.body.appendChild(this.root);
    this.refresh();
  }

  refresh(): void {
    for (const spec of TUNING_SPECS) {
      const row = this.rows.get(spec.key);
      if (!row) continue;
      row.slider.value = String(this.tuning[spec.key]);
      row.readout.textContent = format(this.tuning[spec.key], spec.step);
    }
  }

  get visible(): boolean {
    return !this.root.hidden;
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
  }

  hide(): void {
    this.root.hidden = true;
  }

  destroy(): void {
    this.root.remove();
  }
}
