/**
 * Control panel for the Arena Asset Lab. A DOM overlay (developer tool, not
 * game UI) with layer switches, overlays, tests, the asset browser and the
 * list of missing art.
 */
import { ARENA_CONFIGS } from '../match/view/arena/config';
import { ARENA_LAYERS } from '../match/view/arena/layout';
import type { ArenaLayerId, GoalAlignment } from '../match/view/arena/layout';
import { assetUrl } from '../match/view/arena/registry';
import type { ArenaAsset, ArenaRegistry } from '../match/view/arena/registry';

export interface LabActions {
  setConfig(id: string): void;
  setLayer(id: ArenaLayerId, on: boolean): void;
  setStandIns(on: boolean): void;
  setGrid(on: boolean): void;
  setCollision(on: boolean): void;
  setAutoScroll(on: boolean): void;
  goTo(where: 'north' | 'centre' | 'south'): void;
  setGuides(on: boolean): void;
  setLogo(choice: 'supplied' | 'none' | 'test'): void;
  setWear(level: number): void;
  setGlassDamage(on: boolean): void;
  useInGame(id: string): void;
  exit(): void;
}

export interface LayerStatus {
  id: ArenaLayerId;
  supplied: number;
  standIns: number;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function check(label: string, checked: boolean, onChange: (on: boolean) => void, note?: string): HTMLLabelElement {
  const row = el('label', 'lab-check');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = checked;
  box.addEventListener('change', () => {
    onChange(box.checked);
    box.blur();
  });
  row.append(box, el('span', undefined, label));
  if (note) row.append(el('em', undefined, note));
  return row;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', undefined, label);
  b.type = 'button';
  b.addEventListener('click', () => {
    onClick();
    b.blur();
  });
  return b;
}

function section(title: string): HTMLElement {
  const s = el('section', 'lab-section');
  s.append(el('h3', undefined, title));
  return s;
}

export class ArenaLabPanel {
  private readonly root: HTMLDivElement;
  private readonly layerBox: HTMLElement;
  private readonly alignment: HTMLElement;
  private readonly status: HTMLElement;
  private readonly configNote: HTMLElement;

  constructor(
    private readonly registry: ArenaRegistry,
    private readonly actions: LabActions,
    configId: string,
  ) {
    this.root = el('div');
    this.root.id = 'arena-lab-panel';

    const head = el('div', 'lab-title', 'ARENA ASSET LAB');
    head.append(button('EXIT', () => actions.exit()));
    this.root.append(head);
    this.status = el('div', 'lab-status');
    this.root.append(this.status);

    // Arena configuration
    const config = section('Arena configuration');
    const select = el('select');
    for (const c of ARENA_CONFIGS) {
      const option = el('option', undefined, c.name);
      option.value = c.id;
      select.append(option);
    }
    select.value = configId;
    this.configNote = el('p', 'lab-note');
    select.addEventListener('change', () => {
      actions.setConfig(select.value);
      select.blur();
    });
    config.append(select, this.configNote, button('USE THIS ARENA IN THE GAME', () => actions.useInGame(select.value)));
    this.root.append(config);

    // Layers
    const layers = section('Layers (back to front)');
    this.layerBox = el('div');
    layers.append(this.layerBox);
    this.root.append(layers);

    // Overlays and camera
    const view = section('Overlays and camera');
    view.append(
      check('8x8 tile grid', false, (on) => actions.setGrid(on)),
      check('Collision geometry', false, (on) => actions.setCollision(on)),
      check('Alignment guides', false, (on) => actions.setGuides(on)),
      check('Camera scrolling test (auto)', false, (on) => actions.setAutoScroll(on)),
    );
    const jump = el('div', 'lab-buttons');
    jump.append(
      button('NORTH GOAL', () => actions.goTo('north')),
      button('CENTRE', () => actions.goTo('centre')),
      button('SOUTH GOAL', () => actions.goTo('south')),
    );
    view.append(jump, el('p', 'lab-note', 'Arrow keys, Page Up/Down or the mouse wheel scroll the rink.'));
    this.alignment = el('div', 'lab-readout');
    view.append(this.alignment);
    this.root.append(view);

    // Tests
    const tests = section('Centre logo, ice wear and glass');
    const logo = el('div', 'lab-buttons');
    logo.append(
      button('SUPPLIED LOGO', () => actions.setLogo('supplied')),
      button('NO LOGO', () => actions.setLogo('none')),
      button('TEST CARD', () => actions.setLogo('test')),
    );
    const wearRow = el('label', 'lab-slider');
    const wearValue = el('span', undefined, '0%');
    const wear = el('input');
    wear.type = 'range';
    wear.min = '0';
    wear.max = '100';
    wear.value = '0';
    wear.addEventListener('input', () => {
      wearValue.textContent = `${wear.value}%`;
      actions.setWear(Number(wear.value) / 100);
    });
    wear.addEventListener('change', () => wear.blur());
    wear.addEventListener('keydown', (e) => e.preventDefault());
    wearRow.append(el('span', undefined, 'Ice wear'), wearValue, wear);
    tests.append(
      logo,
      wearRow,
      el('p', 'lab-note', '0% is a fresh sheet; 100% is the end of a hard period. Wear is cosmetic only.'),
      check('Glass damage test (cracked, shattered, missing panes)', false, (on) => actions.setGlassDamage(on)),
    );
    this.root.append(tests);

    // Missing art
    const slots = section('Art slots');
    const list = el('ul', 'lab-slots');
    for (const slot of registry.slots) {
      const item = el('li', `slot-${slot.status}`);
      item.append(el('b', undefined, slot.status.toUpperCase()), el('span', undefined, ` ${slot.label}`));
      if (slot.status === 'missing') item.append(el('em', undefined, ` batch ${slot.expectedBatch}`));
      if (slot.status === 'unfit' && slot.unfit) item.append(el('em', undefined, ` ${slot.unfit}`));
      list.append(item);
    }
    slots.append(list);
    this.root.append(slots);

    // Asset browser
    const browser = section('Asset browser');
    const pick = el('select');
    const batches = Object.keys(registry.batches).sort();
    for (const batch of batches) {
      const group = el('optgroup');
      group.label = `Batch ${batch}`;
      for (const asset of registry.assets.filter((a) => a.batch === batch)) {
        const option = el('option', undefined, `${asset.name}  (${asset.width}x${asset.height}, ${asset.role})`);
        option.value = asset.id;
        group.append(option);
      }
      pick.append(group);
    }
    const preview = el('div', 'lab-preview');
    const show = (): void => {
      const asset = registry.assets.find((a) => a.id === pick.value);
      if (asset) this.renderPreview(preview, asset);
    };
    pick.addEventListener('change', () => {
      show();
      pick.blur();
    });
    browser.append(pick, preview);
    this.root.append(browser);
    show();

    // Validation notes from ingestion
    const issues = section('Ingestion report');
    const problems = registry.issues.filter((i) => i.level !== 'info');
    issues.append(
      el('p', 'lab-note', `${registry.assets.length} assets from ${batches.length} packages. ${registry.issues.filter((i) => i.level === 'error').length} errors, ${problems.length} warnings.`),
    );
    const issueList = el('ul', 'lab-issues');
    for (const i of problems) issueList.append(el('li', `issue-${i.level}`, i.message));
    issues.append(issueList);
    this.root.append(issues);

    document.body.append(this.root);
    this.setConfigNote(configId);
  }

  private renderPreview(target: HTMLElement, asset: ArenaAsset): void {
    target.replaceChildren();
    // A byte-identical duplicate is shown from the file it duplicates: same pixels, one file to load.
    const url = assetUrl(this.registry.assets.find((x) => x.id === asset.duplicateOf) ?? asset);
    const big = Math.max(1, Math.min(8, Math.floor(256 / Math.max(asset.width, asset.height))));
    const frames = el('div', 'lab-frames');
    // Single tiles are shown straight from their batch atlas: the same pixels, one file to load.
    const atlas = asset.role === 'tile' ? this.registry.assets.find((a) => a.batch === asset.batch && a.role === 'atlas') : undefined;
    for (const [label, scale] of [
      ['native', 1],
      [`${big}x`, big],
    ] as const) {
      const cell = el('figure');
      if (atlas && asset.atlasX !== undefined && asset.atlasY !== undefined) {
        const canvas = el('canvas');
        canvas.width = asset.width * scale;
        canvas.height = asset.height * scale;
        const sx = asset.atlasX;
        const sy = asset.atlasY;
        const source = new Image();
        source.addEventListener('load', () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(source, sx, sy, asset.width, asset.height, 0, 0, canvas.width, canvas.height);
        });
        source.src = assetUrl(atlas);
        cell.append(canvas, el('figcaption', undefined, label));
      } else {
        const img = el('img');
        img.src = url;
        img.alt = asset.name;
        img.width = asset.width * scale;
        img.height = asset.height * scale;
        cell.append(img, el('figcaption', undefined, label));
      }
      frames.append(cell);
    }
    const batch = this.registry.batches[asset.batch];
    const facts = [
      `id: ${asset.id}`,
      `file: ${asset.file}`,
      `size: ${asset.width}x${asset.height}  role: ${asset.role}  alpha: ${asset.alpha}`,
      asset.bbox ? `visible pixels: x ${asset.bbox[0]}-${asset.bbox[2]}, y ${asset.bbox[1]}-${asset.bbox[3]}` : 'visible pixels: none (empty tile)',
      asset.duplicateOf ? `same pixels as: ${asset.duplicateOf}` : '',
      batch ? `package: ${batch.package}` : '',
    ].filter(Boolean);
    target.append(frames, el('pre', undefined, facts.join('\n')));
  }

  setConfigNote(id: string): void {
    this.configNote.textContent = ARENA_CONFIGS.find((c) => c.id === id)?.description ?? '';
  }

  /** Rebuild the layer switches for the current arena. */
  setLayers(statuses: LayerStatus[], standInsOn: boolean, missingAssets: string[]): void {
    this.layerBox.replaceChildren();
    statuses.forEach((s, i) => {
      const info = ARENA_LAYERS.find((l) => l.id === s.id);
      if (!info) return;
      let note = '';
      if (s.id === 'actors' || s.id === 'ui') note = 'drawn by the game';
      else if (s.supplied === 0 && s.standIns > 0) note = 'stand-in only: art missing';
      else if (s.supplied === 0) note = 'no art supplied yet';
      else if (s.standIns > 0) note = 'supplied art + stand-ins';
      this.layerBox.append(check(`${i + 1}. ${info.label}`, true, (on) => this.actions.setLayer(s.id, on), note));
    });
    this.layerBox.append(check('Show stand-ins for missing art', standInsOn, (on) => this.actions.setStandIns(on)));
    this.status.textContent = missingAssets.length
      ? `MISSING TEXTURES: ${missingAssets.join(', ')}`
      : 'All assets this arena asks for are loaded.';
    this.status.className = `lab-status ${missingAssets.length ? 'bad' : 'good'}`;
  }

  setAlignment(results: GoalAlignment[], mirrored: boolean): void {
    const lines = results.map(
      (r) =>
        `${r.end.toUpperCase()}: crease off-centre ${r.offsetX}px, gap to goal line ${r.gapToLine}px, line to end boards ${r.lineToEndBoards}px`,
    );
    const [n, s] = results;
    const symmetric = !!n && !!s && n.offsetX === 0 && s.offsetX === 0 && n.gapToLine === s.gapToLine && n.lineToEndBoards === s.lineToEndBoards;
    lines.push(`Creases are mirror images: ${mirrored ? 'YES' : 'NO'}`);
    lines.push(`Goal alignment test: ${symmetric && mirrored ? 'PASS' : 'CHECK'}`);
    this.alignment.textContent = lines.join('\n');
    this.alignment.className = `lab-readout ${symmetric && mirrored ? 'good' : 'bad'}`;
  }

  destroy(): void {
    this.root.remove();
  }
}
