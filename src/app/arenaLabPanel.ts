/**
 * Control panel for the Arena Asset Lab. A DOM overlay (developer tool, not
 * game UI) with layer switches, overlays, tests, the asset browser and the
 * list of missing art.
 */
import { ARENA_CONFIGS } from '../match/view/arena/config';
import { ARENA_LAYERS } from '../match/view/arena/layout';
import type { BenchMood, CrowdPose, CrowdReaction, GoalState } from '../match/view/arena/config';
import type { ArenaLayerId, BenchReport, GoalAlignment, GoalFit, StadiumLayout } from '../match/view/arena/layout';
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
  setGoalState(state: GoalState): void;
  setBenchMood(mood: BenchMood): void;
  setCrowdPose(pose: CrowdPose): void;
  crowdReact(kind: CrowdReaction): void;
  flashLamps(): void;
  runResurfacer(): void;
  setDebris(on: boolean): void;
  setLightPools(on: boolean): void;
  setScoreboard(state: string | null): void;
  openLockerRoom(): void;
  setDoorsOpen(open: boolean): void;
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
  private readonly goalFit: HTMLElement;
  private readonly benchReport: HTMLElement;
  private readonly stadiumReport: HTMLElement;
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
    const tests = section('Centre logo, ice wear, glass and goals');
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
    const goalRow = el('div', 'lab-buttons');
    for (const [label, state] of [
      ['GOAL: REST', 'rest'],
      ['SCORED', 'scored'],
      ['NET RIPPLE', 'ripple'],
      ['BOTTLE OFF', 'knockoff'],
      ['DISLODGED', 'dislodged'],
    ] as const) {
      goalRow.append(button(label, () => actions.setGoalState(state)));
    }
    this.goalFit = el('div', 'lab-readout');
    tests.append(
      goalRow,
      el('p', 'lab-note', 'The standard arena shows the goals delivered at the 32 px scale, which have a rest frame and a net ripple; the other states need the Goal art fit test arena (batch 11 goals). Goal states play on both nets. They are pictures only: none of them changes scoring or collision, and bottle knock-off and dislodged goals are not game mechanics yet.'),
      this.goalFit,
    );
    this.root.append(tests);

    // Benches
    const benches = section('Benches, penalty boxes and doors');
    const moodRow = el('div', 'lab-buttons');
    for (const [label, mood] of [
      ['EMPTY', 'empty'],
      ['SEATED', 'seated'],
      ['STANDING', 'standing'],
      ['CHEER', 'cheer'],
      ['GROAN', 'groan'],
    ] as const) {
      moodRow.append(button(label, () => actions.setBenchMood(mood)));
    }
    const doorRow = el('div', 'lab-buttons');
    doorRow.append(
      button('OPEN DOORS', () => actions.setDoorsOpen(true)),
      button('CLOSE DOORS', () => actions.setDoorsOpen(false)),
    );
    this.benchReport = el('div', 'lab-readout');
    benches.append(
      moodRow,
      doorRow,
      el('p', 'lab-note', 'Bench players and doors are pictures only. Nothing in the game cheers, serves a penalty or opens a door yet, and the boards the puck hits do not change.'),
      this.benchReport,
    );
    this.root.append(benches);

    // Stands and crowd
    const stands = section('Stands, crowd and goal lamps');
    const poseRow = el('div', 'lab-buttons');
    poseRow.append(
      button('SIT', () => actions.setCrowdPose('seated')),
      button('STAND', () => actions.setCrowdPose('standing')),
      button('GOAL LAMPS', () => actions.flashLamps()),
    );
    const reactRow = el('div', 'lab-buttons');
    for (const [label, kind] of [
      ['FANS CHEER', 'cheer'],
      ['GOAL!', 'goal'],
      ['BANG GLASS', 'bang'],
      ['DRINK', 'drink'],
      ['HECKLE', 'heckle'],
    ] as const) {
      reactRow.append(button(label, () => actions.crowdReact(kind)));
    }
    this.stadiumReport = el('div', 'lab-readout');
    stands.append(
      poseRow,
      reactRow,
      el('p', 'lab-note', 'Crowd reactions are pictures only. In play the crowd sips now and then, and celebrates with the goal lamp when the sim reports a goal.'),
      this.stadiumReport,
    );
    this.root.append(stands);

    // Equipment
    const gear = section('Equipment tests (batch 14)');
    const iceRow = el('div', 'lab-buttons');
    iceRow.append(button('RUN RESURFACER', () => actions.runResurfacer()));
    const boardRow = el('div', 'lab-buttons');
    boardRow.append(button('BOARD OFF', () => actions.setScoreboard(null)));
    for (const state of ['normal', 'goal', 'intermission', 'final']) boardRow.append(button(state.toUpperCase(), () => actions.setScoreboard(state)));
    gear.append(
      iceRow,
      el('p', 'lab-note', 'Set some ice wear first, then run the resurfacer: it cleans the sheet lane by lane. It is a Lab drive only; there are no intermissions yet.'),
      check('Debris test (one of each piece, on the ice)', false, (on) => actions.setDebris(on)),
      check('Light pools test (soft glow under the light banks)', false, (on) => actions.setLightPools(on)),
      boardRow,
      el('p', 'lab-note', 'Scoreboard states with sample numbers, pinned to the screen: the arena has no wall or rafters to hang it on yet. Banners, retired jerseys, signs, light fixtures and the garage are in the asset browser only.'),
    );
    this.root.append(gear);

    // Locker room
    const locker = section('Locker room (batch 15)');
    const lockerRow = el('div', 'lab-buttons');
    lockerRow.append(button('OPEN LOCKER ROOM TEST', () => actions.openLockerRoom()));
    locker.append(lockerRow, el('p', 'lab-note', 'One assembled room with five moods: getting dressed, beers, after a win, after a loss, team talk. A fit test for the art only. The locker room is not a place in the game yet.'));
    this.root.append(locker);

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
    const atlas =
      asset.role === 'tile'
        ? this.registry.assets.find((a) => a.batch === asset.batch && a.role === 'atlas')
        : asset.role === 'frame'
          ? this.registry.assets.find((a) => a.id === asset.atlas)
          : undefined;
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

  /** What the stands hold, and how much of the supplied seating falls outside the world. */
  setStadiumReport(stadium: StadiumLayout | null, density: number): void {
    if (!stadium || stadium.modules.length === 0) {
      this.stadiumReport.textContent = 'This arena has no stands.';
      this.stadiumReport.className = 'lab-readout';
      return;
    }
    const seating = stadium.modules.filter((m) => m.kind === 'seating').length;
    const lines = [
      `${seating} seating modules and ${stadium.modules.length - seating} stairs, west and east sides only`,
      `${stadium.seatsVisible} seats on screen, ${stadium.fans.length} taken (${Math.round(density * 100)}% house)`,
      `Three tiers a side show (approved); the art's fourth tier, ${stadium.seatsOffWorld} seats, is off screen`,
      `Goal lamps: ${stadium.lamps.length}`,
    ];
    this.stadiumReport.textContent = lines.join('\n');
    this.stadiumReport.className = 'lab-readout good';
  }

  /** Where each bench-side structure landed, and whether its doors and footprint check out. */
  setBenchReport(report: BenchReport | null): void {
    if (!report) {
      this.benchReport.textContent = 'This arena has no benches or boxes.';
      this.benchReport.className = 'lab-readout';
      return;
    }
    const lines = report.rows.map((r) => `${r.side.toUpperCase()} ${r.kind}: y ${r.top}-${r.bottom}, ${r.doors} door${r.doors === 1 ? '' : 's'}, ${r.gapToNext === null ? 'last on its side' : `${r.gapToNext}px to the next`}`);
    if (report.skipped.length) lines.push(`Did not fit on the straight boards: ${report.skipped.join(', ')}`);
    lines.push(`Inside the world, off the ice, no overlaps, every door on a whole board module: ${report.ok ? 'YES' : 'NO'}`);
    this.benchReport.textContent = lines.join('\n');
    this.benchReport.className = `lab-readout ${report.ok ? 'good' : 'bad'}`;
  }

  /** Supplied goal art against the physics net. An empty list means the stand-in nets are showing. */
  setGoalFit(results: GoalFit[]): void {
    if (results.length === 0) {
      this.goalFit.textContent = 'Stand-in nets showing: drawn at the size of the physics net.';
      this.goalFit.className = 'lab-readout';
      return;
    }
    const lines = results.map(
      (r) =>
        `${r.end.toUpperCase()}: drawn mouth ${r.artMouth}px vs physics ${r.physicsMouth}px, drawn depth ${r.artDepth}px vs physics ${r.physicsDepth}px, ${r.clearBehind}px clear behind`,
    );
    const fits = results.every((r) => r.artMouth === r.physicsMouth && r.artDepth === r.physicsDepth);
    lines.push(`Goal art matches the physics net: ${fits ? 'YES' : 'NO - turn on Collision geometry to compare'}`);
    this.goalFit.textContent = lines.join('\n');
    this.goalFit.className = `lab-readout ${fits ? 'good' : 'bad'}`;
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
