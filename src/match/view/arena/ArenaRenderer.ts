/**
 * Modular arena renderer. Assembles the rink from supplied 8x8 tiles and
 * independent sprites, in twelve switchable layers, from an ArenaConfig.
 * Nothing is flattened into a background image.
 *
 * Geometry comes from the gameplay rink (the source of truth) through
 * layout.ts. This class only creates Phaser objects for what layout returns.
 */
import Phaser from 'phaser';
import type { RinkGeometry } from '../../sim/rink';
import { goalLineY, netBox } from '../../sim/rink';
import { projectY, worldScreenHeight } from '../projection';
import { TEX, buildTemporaryTextures, netLayout, netScreenAnchor } from '../textures';
import type { ArenaConfig, BenchMood, BoardSide, CrowdPose, CrowdReaction, GlassState, GoalEnd, GoalState, GoalStrip } from './config';
import { ARENA_CONFIGS, scaleGoalFiles } from './config';
import { CrowdView } from './CrowdView';
import { IceWear, trafficPrior } from './iceWear';
import { assetFrame, cellFrame } from './phaserTextures';
import { Rng, hashString } from '../../../core/rng';
import { ARENA_LAYERS, faceoffSpots, iceOutline, layerDepth, layoutArena, layoutGoals, layoutScaleGoals, resurfacerLanes } from './layout';
import type { ArenaLayerId, ArenaLayout, BenchSpot, GoalPlacement, ScaleGoalPlacement } from './layout';
import { TILE, assetById, assetUrl, loadableAssets, textureKey, textureSource } from './registry';
import type { ArenaRegistry } from './registry';

type Drawable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible & Phaser.GameObjects.Components.Depth;

interface Item {
  object: Drawable;
  layer: ArenaLayerId;
  standIn: boolean;
}

const TEST_LOGO_KEY = 'arena-lab-test-logo';
/**
 * The whole-image frame. Identical files share a texture, and that texture may be an atlas cut
 * into 8x8 frames, so whole images always ask for the full frame by name.
 */
const WHOLE = '__BASE';

/** Texture key of one scale goal frame. */
function scaleGoalKey(folder: string, file: string): string {
  return `${folder}${file}`;
}

export class ArenaRenderer {
  readonly layout: ArenaLayout;
  readonly worldHeight: number;
  readonly wear: IceWear;
  /** Asset ids the config asked for that the registry does not have. */
  readonly missing: string[] = [];

  private readonly items: Item[] = [];
  private readonly layerVisible = new Map<ArenaLayerId, boolean>();
  private standIns: boolean;
  private scratchLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private wearIntensity: number;
  private logo: Phaser.GameObjects.Image | null = null;
  private centerDot: Phaser.GameObjects.Image | null = null;
  private grid: Phaser.GameObjects.Graphics | null = null;
  private collision: Phaser.GameObjects.Graphics | null = null;
  private readonly iceMask: Phaser.Display.Masks.GeometryMask;
  private readonly maskShape: Phaser.GameObjects.Graphics;
  private readonly maps: Phaser.Tilemaps.Tilemap[] = [];
  private readonly scaleGoals = new Map<GoalEnd, { image: Phaser.GameObjects.Image; place: ScaleGoalPlacement; state: GoalState; timer: Phaser.Time.TimerEvent | null }>();
  private readonly goals = new Map<GoalEnd, { image: Phaser.GameObjects.Image; place: GoalPlacement; state: GoalState; timer: Phaser.Time.TimerEvent | null }>();
  private readonly doors = new Map<string, { image: Phaser.GameObjects.Image; row: number; frame: number }>();
  private doorTimer: Phaser.Time.TimerEvent | null = null;
  private readonly benchPlayers: { image: Phaser.GameObjects.Image; spot: BenchSpot; index: number }[] = [];
  private benchTimer: Phaser.Time.TimerEvent | null = null;
  private mood: BenchMood = 'empty';
  private crowd: CrowdView | null = null;
  private readonly testObjects = new Map<'debris' | 'pools', Phaser.GameObjects.Image[]>();
  private resurfacer: { objects: Phaser.GameObjects.GameObject[]; timer: Phaser.Time.TimerEvent } | null = null;
  private readonly lamps = new Map<GoalEnd, { image: Phaser.GameObjects.Image; timer: Phaser.Time.TimerEvent | null }>();
  /** Objects switched off by a state (an empty bench seat), whatever their layer says. */
  private readonly hidden = new Set<Phaser.GameObjects.GameObject>();
  private readonly glassPanels = new Map<string, { image: Phaser.GameObjects.Image; side: BoardSide; cropW: number; cropH: number }>();

  /** Queue every registry texture on a scene's loader. Call from preload. */
  static queueAssets(loader: Phaser.Loader.LoaderPlugin, registry: ArenaRegistry): void {
    // Scale goals are loaded by name: they are not part of the batch registry.
    const queued = new Set<string>();
    for (const config of ARENA_CONFIGS) {
      if (!config.scaleGoals) continue;
      for (const file of scaleGoalFiles(config.scaleGoals)) {
        const key = scaleGoalKey(config.scaleGoals.folder, file);
        if (queued.has(key)) continue;
        queued.add(key);
        loader.image(key, `assets/${config.scaleGoals.folder}${file}.png`);
      }
    }
    for (const asset of loadableAssets(registry)) {
      if (asset.role === 'atlas') {
        loader.spritesheet(asset.id, assetUrl(asset), { frameWidth: TILE, frameHeight: TILE });
      } else {
        loader.image(asset.id, assetUrl(asset));
      }
    }
  }

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly registry: ArenaRegistry,
    readonly config: ArenaConfig,
    private readonly rink: RinkGeometry,
    readonly tilt: number,
  ) {
    for (const layer of ARENA_LAYERS) this.layerVisible.set(layer.id, true);
    this.standIns = config.standIns;
    this.wearIntensity = config.scratches.intensity;
    this.worldHeight = worldScreenHeight(rink.worldHeight, tilt);
    this.layout = layoutArena(rink, tilt, config, (id) => assetById(registry, id));
    this.wear = new IceWear(this.layout.grid.cols, this.layout.grid.rows);

    // One shape clips every ice layer to the playable surface, rounded corners included.
    this.maskShape = scene.make.graphics({}, false);
    this.maskShape.fillStyle(0xffffff, 1);
    this.maskShape.fillPoints(iceOutline(rink, tilt) as Phaser.Types.Math.Vector2Like[], true);
    this.iceMask = this.maskShape.createGeometryMask();

    // Stand-in boards are drawn only where no supplied board covers the stretch.
    buildTemporaryTextures(scene, rink, tilt, {
      noBoards: config.corners.mode === 'art',
      suppliedSides: { north: !!config.boards.north, south: !!config.boards.south, west: !!config.boards.west, east: !!config.boards.east },
    });
    this.buildIce();
    this.buildMarkings();
    this.buildSurroundings();
    this.buildNets();
    this.apply();
  }

  // ---- construction -------------------------------------------------------

  /** Texture key for an asset id (identical files share one texture). */
  private key(id: string): string {
    return textureKey(this.registry, id);
  }

  /** A named frame for one rectangle of a texture, cut on first use. */
  private cell(key: string, x: number, y: number, width: number, height: number): string {
    return cellFrame(this.scene, key, x, y, width, height);
  }

  /** Texture and frame that hold an asset's pixels: its own file, its duplicate, or its cell of an atlas. */
  private tex(id: string): [string, string] {
    return assetFrame(this.scene, this.registry, id);
  }

  private has(id: string): boolean {
    const ok = this.scene.textures.exists(textureSource(this.registry, id).key);
    if (!ok && !this.missing.includes(id)) this.missing.push(id);
    return ok;
  }

  private add(object: Drawable, layer: ArenaLayerId, standIn = false, depth = layerDepth(layer)): void {
    object.setDepth(depth);
    this.items.push({ object, layer, standIn });
  }

  /** A tile layer of `cols` x `rows` cells at a screen position, filled by a callback (-1 = empty). */
  private tileLayer(atlas: string, x: number, y: number, cols: number, rows: number, tileAt: (col: number, row: number) => number): Phaser.Tilemaps.TilemapLayer | null {
    if (!this.has(atlas)) return null;
    const map = this.scene.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: cols, height: rows });
    this.maps.push(map);
    const tileset = map.addTilesetImage(atlas, atlas, TILE, TILE, 0, 0);
    if (!tileset) return null;
    const layer = map.createBlankLayer(`${atlas}@${x},${y}`, tileset, x, y);
    if (!layer) return null;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = tileAt(col, row);
        if (index >= 0) layer.putTileAt(index, col, row);
      }
    }
    layer.setMask(this.iceMask);
    return layer;
  }

  private buildIce(): void {
    const { grid } = this.layout;
    const c = this.config;
    const base = this.tileLayer(c.baseIce.atlas, grid.x, grid.y, grid.cols, grid.rows, () => c.baseIce.tile);
    if (base) this.add(base, 'baseIce');

    this.scratchLayer = this.tileLayer(c.scratches.atlas, grid.x, grid.y, grid.cols, grid.rows, () => -1);
    if (this.scratchLayer) this.add(this.scratchLayer, 'scratches');

    if (c.reflections.enabled) {
      const r = c.reflections;
      // Sparse light streaks, fixed to the ice: a short vertical run of tiles every few columns,
      // offset on alternate bands so they do not line up in a grid.
      const lights = this.tileLayer(r.atlas, grid.x, grid.y, grid.cols, grid.rows, (col, row) => {
        const band = Math.floor(row / r.everyRows);
        const shift = band % 2 === 0 ? Math.floor(r.everyCols / 4) : Math.floor((r.everyCols * 3) / 4);
        if ((col + shift) % r.everyCols !== 0) return -1;
        return r.tiles[row % r.everyRows] ?? -1;
      });
      if (lights) {
        lights.setBlendMode(Phaser.BlendModes.ADD).setAlpha(r.alpha);
        this.add(lights, 'reflections');
      }
    }
  }

  private buildMarkings(): void {
    for (const row of this.layout.lines) {
      const layer = this.tileLayer(row.atlas, row.x, row.y, row.cols, 1, (col) => row.pattern[col % row.pattern.length] ?? -1);
      if (layer) this.add(layer, 'markings');
    }
    for (const p of this.layout.images) {
      if (!this.has(p.asset)) continue;
      const image = this.scene.add.image(p.x, p.y, this.key(p.asset), p.frame ?? WHOLE).setOrigin(p.originX, p.originY).setScale(p.scale);
      if (p.flipX) image.setFlipX(true);
      image.setMask(this.iceMask);
      // Lines sit under circles and creases; give images a hair more depth within their layer.
      this.add(image, p.layer, false, layerDepth(p.layer) + 0.5);
      if (p.role === 'centerLogo') this.logo = image;
      if (p.role === 'centerDot') this.centerDot = image;
    }
  }

  private buildSurroundings(): void {
    // Stand-ins for art that has not been supplied: stands, end and corner boards.
    this.add(this.scene.add.image(0, 0, TEX.surround).setOrigin(0, 0), 'stadium', true);
    this.add(this.scene.add.image(0, 0, TEX.rink).setOrigin(0, 0), 'backBoards', true);
    this.add(this.scene.add.image(0, 0, TEX.rinkFront).setOrigin(0, 0), 'frontBoards', true);

    // Supplied boards, repeated along each straight stretch.
    for (const run of this.layout.strips) {
      if (!this.has(run.asset)) continue;
      const strip = this.scene.add.tileSprite(run.x, run.y, run.width, run.height, this.key(run.asset), WHOLE).setOrigin(0, 0);
      this.add(strip, run.layer, false, layerDepth(run.layer) + run.z);
    }
    // Corners, gates, sponsor panels and posts.
    for (const p of this.layout.boardImages) {
      if (!this.has(p.asset)) continue;
      const [key, frame] = p.cell ? [this.key(p.asset), this.cell(this.key(p.asset), p.cell.x, p.cell.y, p.cell.width, p.cell.height)] : this.tex(p.asset);
      const image = this.scene.add.image(p.x, p.y, key, frame).setOrigin(0, 0);
      if (p.cropW !== undefined && p.cropH !== undefined) image.setCrop(0, 0, p.cropW, p.cropH);
      this.add(image, p.layer, false, layerDepth(p.layer) + p.z);
      if (p.doorId && p.cell) this.doors.set(p.doorId, { image, row: p.cell.y, frame: 0 });
    }
    this.buildBenchArea();
    this.buildStadium();
    // Glass, one pane at a time so each can crack on its own.
    for (const pane of this.layout.glass) {
      if (!this.has(pane.asset)) continue;
      const image = this.scene.add.image(pane.x, pane.y, this.key(pane.asset), WHOLE).setOrigin(0, 0);
      const cropW = pane.cropW ?? image.width;
      const cropH = pane.cropH ?? image.height;
      image.setCrop(0, 0, cropW, cropH);
      this.add(image, pane.layer, false, layerDepth(pane.layer) + pane.z);
      this.glassPanels.set(pane.id, { image, side: pane.side, cropW, cropH });
    }
  }

  /** Stands down both sides with the crowd in them, and a goal lamp behind each net. */
  private buildStadium(): void {
    const art = this.config.stadium;
    if (!art) return;
    const stadium = this.layout.stadium;
    const base = layerDepth('stadium') + 0.5;
    for (const m of stadium.modules) {
      if (!this.has(m.asset)) continue;
      this.add(this.scene.add.image(m.x, m.y, ...this.tex(m.asset)).setOrigin(0, 0), 'stadium', false, base);
    }
    const sample = stadium.fans[0];
    const crowdArt = [art.crowd.seated, art.crowd.standing].map((p) => `${p}_west_01`).concat(Object.values(art.crowd.reactions).map((r) => `${r.batch}/${r.name}_west_01_00`));
    if (sample && crowdArt.map((id) => this.has(id)).every(Boolean)) {
      this.crowd = new CrowdView(this.scene, art, stadium.fans, (id) => this.tex(id), `crowd:${this.config.id}`);
      for (const image of this.crowd.images) this.add(image, 'stadium', false, base + 0.1);
    }
    for (const lamp of stadium.lamps) {
      if (!this.has(`${art.lamp.frames}_00`)) continue;
      const image = this.scene.add.image(lamp.x, lamp.y, ...this.tex(`${art.lamp.frames}_00`)).setOrigin(0, 0);
      const layer = lamp.end === 'north' ? 'backBoards' : 'frontBoards';
      this.add(image, layer, false, layerDepth(layer) + 6);
      this.lamps.set(lamp.end, { image, timer: null });
    }
  }

  /** Benches, penalty boxes and the timekeeper booth: behind the boards, players between the layers. */
  private buildBenchArea(): void {
    const area = this.config.benchArea;
    if (!area) return;
    const base = layerDepth('stadium') + 1;
    const playersOk = [area.players.seated, area.players.standing, area.players.cheer.atlas, area.players.groan.atlas].map((id) => this.has(id)).every(Boolean);
    for (const placed of this.layout.structures) {
      const { structure } = placed;
      if (!structure.layers.map((id) => this.has(id)).every(Boolean)) continue;
      structure.layers.forEach((id, i) => {
        const image = this.scene.add.image(placed.x, placed.y, ...this.tex(id)).setOrigin(0, 0);
        this.add(image, 'stadium', false, base + (i < structure.playersAfter ? 0 : 2) + i * 0.01);
      });
      if (!playersOk) continue;
      for (const spot of placed.spots) {
        const image = this.scene.add.image(spot.x, spot.y, this.key(area.players[spot.pose])).setOrigin(0, 0);
        this.add(image, 'stadium', false, base + 1);
        this.benchPlayers.push({ image, spot, index: this.benchPlayers.length });
      }
    }
    this.setBenchMood(area.mood);
  }

  private buildNets(): void {
    const placed = layoutGoals(this.rink, this.tilt, this.config, (id) => assetById(this.registry, id));
    for (const place of placed) {
      const { art } = place;
      // A goal is drawn only when every one of its states is present, so a state change can never blank it.
      const ids = [art.rest, art.scored, art.ripple.atlas, art.knockoff.atlas, art.dislodged.atlas];
      if (!ids.map((id) => this.has(id)).every(Boolean)) continue;
      const image = this.scene.add.image(place.x, place.y, this.key(art.rest), WHOLE).setOrigin(0, 0);
      this.add(image, 'nets', false, place.depth);
      this.goals.set(place.end, { image, place, state: 'rest', timer: null });
    }
    // Goals drawn at the gameplay scale, when every frame of both is loaded.
    const scale = this.config.scaleGoals;
    if (scale && scaleGoalFiles(scale).every((file) => this.scene.textures.exists(scaleGoalKey(scale.folder, file)))) {
      for (const place of layoutScaleGoals(this.rink, this.tilt, this.config)) {
        const image = this.scene.add.image(place.x, place.y, scaleGoalKey(scale.folder, place.art.rest)).setOrigin(0, 0);
        this.add(image, 'nets', false, place.depth);
        this.scaleGoals.set(place.end, { image, place, state: 'rest', timer: null });
      }
    }
    // Stand-in nets, sized to the physics net, wherever a supplied goal is not drawn.
    for (const end of ['top', 'bottom'] as const) {
      if (this.hasGoalArt(end === 'top' ? 'north' : 'south')) continue;
      const anchor = netScreenAnchor(this.rink, end, this.tilt);
      const layout = netLayout(this.rink, end, this.tilt);
      const top = anchor.y - layout.goalLineRow;
      const image = this.scene.add.image(anchor.x, top, end === 'top' ? TEX.netTop : TEX.netBottom).setOrigin(0, 0);
      // The far net sorts at its goal line; the near net at its back edge, so it covers players behind it.
      this.add(image, 'nets', true, end === 'top' ? anchor.y : top + layout.height);
    }
  }

  /** Frame name for one cell of an animation strip, cut on first use. */
  private stripFrame(strip: GoalStrip, index: number): string {
    const texture = this.scene.textures.get(this.key(strip.atlas));
    const name = `strip-${strip.frameWidth}x${strip.frameHeight}-${index}`;
    if (!texture.has(name)) texture.add(name, 0, index * strip.frameWidth, 0, strip.frameWidth, strip.frameHeight);
    return name;
  }

  // ---- runtime controls ---------------------------------------------------

  /** Texture key and frame for any registry asset, for callers that draw their own test overlays. */
  textureFor(id: string): [string, string] | null {
    return this.has(id) ? this.tex(id) : null;
  }

  private clearTest(kind: 'debris' | 'pools'): void {
    for (const image of this.testObjects.get(kind) ?? []) image.destroy();
    this.testObjects.delete(kind);
  }

  /** Lab test: scatter one of each debris piece on the ice, above the markings and below the skaters. Seeded, so it never moves. */
  setDebrisTest(on: boolean): number {
    this.clearTest('debris');
    const art = this.config.equipment;
    if (!on || !art) return 0;
    const rng = new Rng(hashString(`debris:${this.config.id}`));
    const images: Phaser.GameObjects.Image[] = [];
    for (const id of art.debris) {
      if (!this.has(id)) continue;
      const x = Math.round(rng.range(this.rink.left + 60, this.rink.right - 60));
      const y = Math.round(projectY(rng.range(this.rink.top + 140, this.rink.bottom - 140), this.tilt));
      images.push(this.scene.add.image(x, y, ...this.tex(id)).setDepth(layerDepth('reflections') + 2));
    }
    this.testObjects.set('debris', images);
    return images.length;
  }

  /** Lab test: soft light pools on the ice in two columns, above the ice art and below the skaters. */
  setLightPoolsTest(alpha: number): number {
    this.clearTest('pools');
    const art = this.config.equipment;
    if (alpha <= 0 || !art || !this.has(art.lightGlow)) return 0;
    const images: Phaser.GameObjects.Image[] = [];
    for (let y = this.rink.top + 70; y <= this.rink.bottom - 70; y += 148) {
      for (const x of [this.rink.centerX - 85, this.rink.centerX + 85]) {
        images.push(
          this.scene.add
            .image(x, Math.round(projectY(y, this.tilt)), ...this.tex(art.lightGlow))
            .setAlpha(alpha)
            .setMask(this.iceMask)
            .setDepth(layerDepth('reflections') + 1),
        );
      }
    }
    this.testObjects.set('pools', images);
    return images.length;
  }

  resurfacerRunning(): boolean {
    return !!this.resurfacer;
  }

  stopResurfacer(): void {
    if (!this.resurfacer) return;
    this.resurfacer.timer.remove();
    this.scene.tweens.killTweensOf(this.resurfacer.objects);
    for (const o of this.resurfacer.objects) o.destroy();
    this.resurfacer = null;
  }

  /**
   * Lab test: drive the ice resurfacer over the sheet in lanes, cleaning the wear under it and
   * laying the supplied trail behind it. No collision and no game rule is involved.
   */
  runResurfacer(onDone?: () => void): void {
    this.stopResurfacer();
    const art = this.config.equipment?.resurfacer;
    if (!art) return;
    const sprite = (dir: string): [string, string] => this.tex(`${art.frames}_${art.palette}_${dir}`);
    if (!['north', 'east', 'south', 'west'].map((d) => this.has(`${art.frames}_${art.palette}_${d}`)).every(Boolean) || !this.has(art.trail)) return;
    const lanes = resurfacerLanes(this.rink, this.tilt, art.laneWidth, art.size / 2 - 4);
    const first = lanes[0];
    if (!first) return;
    const vehicle = this.scene.add.image(first.x, first.from, ...sprite('south'));
    const objects: Phaser.GameObjects.GameObject[] = [vehicle];
    const trailKey = this.tex(art.trail);
    const trailArt = assetById(this.registry, art.trail);
    const trailWidth = trailArt?.width ?? 32;
    let lane = 0;
    let y = first.from;
    let x = first.x;
    let trail: Phaser.GameObjects.TileSprite | null = null;
    const { grid } = this.layout;
    const clean = (): void => {
      const c0 = Math.floor((x - art.laneWidth / 2 - grid.x) / TILE);
      const c1 = Math.floor((x + art.laneWidth / 2 - 1 - grid.x) / TILE);
      const row = Math.floor((y - grid.y) / TILE);
      for (let c = c0; c <= c1; c++) for (let r = row - 3; r <= row + 3; r++) this.wear.clearCell(c, r);
    };
    let sinceRefresh = 0;
    const timer = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const current = lanes[lane];
        if (!current) return;
        let step = (art.speed * 16) / 1000;
        if (x !== current.x) {
          // Crossing to the next lane along the end of the ice.
          const dx = current.x - x;
          x += Math.sign(dx) * Math.min(Math.abs(dx), step);
          vehicle.setTexture(...sprite(dx > 0 ? 'east' : 'west'));
        } else {
          const dy = current.to - y;
          step = Math.min(Math.abs(dy), step);
          y += Math.sign(dy) * step;
          vehicle.setTexture(...sprite(dy >= 0 ? 'south' : 'north'));
          if (!trail) {
            trail = this.scene.add.tileSprite(current.x - trailWidth / 2, current.from, trailWidth, 1, ...trailKey).setOrigin(0, 0).setMask(this.iceMask).setDepth(layerDepth('scratches') + 1);
            objects.push(trail);
          }
          const top = Math.min(current.from, y);
          trail.setPosition(current.x - trailWidth / 2, top).setSize(trailWidth, Math.max(1, Math.abs(y - current.from)));
          clean();
          if (y === current.to) {
            // Lane done: let its trail dry off, and head for the next one.
            this.scene.tweens.add({ targets: trail, alpha: 0, duration: 2500 });
            trail = null;
            lane++;
            if (lane >= lanes.length) {
              this.refreshWear();
              this.scene.time.delayedCall(600, () => {
                this.stopResurfacer();
                onDone?.();
              });
              timer.paused = true;
              return;
            }
          }
        }
        vehicle.setPosition(Math.round(x), Math.round(y)).setDepth(Math.round(y) + art.size / 2);
        sinceRefresh += 16;
        if (sinceRefresh >= 150) {
          sinceRefresh = 0;
          this.refreshWear();
        }
      },
    });
    this.resurfacer = { objects, timer };
  }

  /** Number of spectators drawn, and how many are mid-reaction. */
  crowdStatus(): { fans: number; reacting: number; pose: CrowdPose } {
    return { fans: this.crowd?.size ?? 0, reacting: this.crowd?.reacting ?? 0, pose: this.crowd?.currentPose() ?? 'seated' };
  }

  setCrowdPose(pose: CrowdPose): void {
    this.crowd?.setPose(pose);
  }

  /** Play a supplied crowd reaction. Pictures only. Returns how many fans joined in. */
  crowdReact(kind: CrowdReaction): number {
    return this.crowd?.react(kind) ?? 0;
  }

  lampLit(end: GoalEnd): boolean {
    return !!this.lamps.get(end)?.timer;
  }

  /** Flash the goal lamp behind one net for the time its package asks for, then leave it dark. */
  flashLamp(end: GoalEnd): void {
    const lamp = this.lamps.get(end);
    const art = this.config.stadium?.lamp;
    if (!lamp || !art) return;
    lamp.timer?.remove();
    const frame = (i: number): void => void lamp.image.setTexture(...this.tex(`${art.frames}_${String(i).padStart(2, '0')}`));
    let i = 0;
    const steps = Math.round(art.flashMs / art.frameMs);
    lamp.timer = this.scene.time.addEvent({
      delay: art.frameMs,
      repeat: steps,
      callback: () => {
        i++;
        if (i > steps) {
          frame(0);
          lamp.timer = null;
        } else {
          // Frame 0 is the dark lamp: the flash loops frames 1 to count-1.
          frame(1 + ((i - 1) % (art.count - 1)));
        }
      },
    });
    frame(1);
  }

  benchMood(): BenchMood {
    return this.mood;
  }

  /**
   * What the bench players are doing. `cheer` loops and `groan` plays once then stands, each player
   * starting a beat after the last. Pictures only: nothing in the game triggers either yet.
   */
  setBenchMood(mood: BenchMood): void {
    const area = this.config.benchArea;
    if (!area) return;
    this.benchTimer?.remove();
    this.benchTimer = null;
    this.mood = mood;
    const p = area.players;
    const size = p.frame;
    const half = (team: string): number => (team === 'home' ? 0 : 1);
    const pose = mood === 'seated' ? 'seated' : 'standing';
    const stand = (image: Phaser.GameObjects.Image, spot: BenchSpot): void => {
      const key = this.key(p[spot.pose]);
      image.setTexture(key, this.cell(key, spot.variant * size, half(spot.team) * size, size, size));
    };
    for (const player of this.benchPlayers) {
      if (mood !== 'empty' && player.spot.pose === pose) this.hidden.delete(player.image);
      else this.hidden.add(player.image);
      stand(player.image, player.spot);
    }
    this.apply();
    if (mood !== 'cheer' && mood !== 'groan') return;
    const strip = p[mood];
    const key = this.key(strip.atlas);
    const total = strip.durations.reduce((a, b) => a + b, 0);
    const started = this.scene.time.now;
    const STAGGER = 70;
    this.benchTimer = this.scene.time.addEvent({
      delay: 20,
      loop: true,
      callback: () => {
        let running = false;
        for (const player of this.benchPlayers) {
          if (player.spot.pose !== 'standing') continue;
          let t = this.scene.time.now - started - (player.index % p.variants) * STAGGER;
          if (t < 0 || (mood === 'groan' && t >= total)) {
            stand(player.image, player.spot);
            running ||= t < 0;
            continue;
          }
          running = true;
          t %= total;
          let frame = 0;
          while (frame < strip.durations.length - 1 && t >= (strip.durations[frame] ?? 0)) t -= strip.durations[frame++] ?? 0;
          const rows = strip.durations.length;
          player.image.setTexture(key, this.cell(key, player.spot.variant * size, (half(player.spot.team) * rows + frame) * size, size, size));
        }
        if (!running) this.setBenchMood('standing');
      },
    });
  }

  doorIds(): string[] {
    return [...this.doors.keys()];
  }

  /**
   * Swing every bench and penalty-box door open or shut with the supplied frames. The pane of glass
   * over a door is lifted while it is open. Pictures only: the boards the puck hits do not change.
   */
  setDoorsOpen(open: boolean): void {
    const area = this.config.benchArea;
    if (!area || this.doors.size === 0) return;
    this.doorTimer?.remove();
    const d = area.doors;
    const last = d.durations.length - 1;
    const key = this.key(d.atlas);
    const step = (): void => {
      let moving = false;
      for (const [id, door] of this.doors) {
        const next = door.frame + (open ? 1 : -1);
        if (next < 0 || next > last) continue;
        door.frame = next;
        door.image.setTexture(key, this.cell(key, next * d.frameWidth, door.row, d.frameWidth, d.frameHeight));
        this.setGlassState(id, next === 0 ? 'intact' : 'missing');
        moving = true;
      }
      this.doorTimer = moving ? this.scene.time.delayedCall(d.durations[0] ?? 80, step) : null;
    };
    step();
  }

  /** True when the supplied goal art (not a stand-in) is drawn at this end. */
  hasGoalArt(end: GoalEnd): boolean {
    return this.goals.has(end) || this.scaleGoals.has(end);
  }

  goalState(end: GoalEnd): GoalState | null {
    return this.goals.get(end)?.state ?? this.scaleGoals.get(end)?.state ?? null;
  }

  /**
   * Show one of the supplied goal states. Purely visual: scoring and collision do not change.
   * `ripple` plays once and returns to rest; `knockoff` and `dislodged` play once and hold their last frame.
   */
  setGoalState(end: GoalEnd, state: GoalState): void {
    const sized = this.scaleGoals.get(end);
    if (sized && this.config.scaleGoals) {
      // The scale goals have a rest frame and a ripple so far; any other state shows rest.
      const { folder, rippleMs } = this.config.scaleGoals;
      const { art } = sized.place;
      sized.timer?.remove();
      sized.timer = null;
      sized.state = state === 'ripple' ? 'ripple' : 'rest';
      const show = (index: number): void => {
        const file = art.ripple[index];
        if (sized.state !== 'ripple' || file === undefined) {
          sized.state = 'rest';
          sized.image.setTexture(scaleGoalKey(folder, art.rest));
          return;
        }
        sized.image.setTexture(scaleGoalKey(folder, file));
        sized.timer = this.scene.time.delayedCall(rippleMs, () => show(index + 1));
      };
      show(0);
      return;
    }
    const goal = this.goals.get(end);
    if (!goal) return;
    goal.timer?.remove();
    goal.timer = null;
    goal.state = state;
    const { art, x, y } = goal.place;
    if (state === 'rest' || state === 'scored') {
      goal.image.setTexture(this.key(state === 'rest' ? art.rest : art.scored), WHOLE).setPosition(x, y);
      return;
    }
    const strip = art[state];
    const show = (index: number): void => {
      goal.image.setTexture(this.key(strip.atlas), this.stripFrame(strip, index)).setPosition(x - strip.offset[0], y - strip.offset[1]);
      const last = index === strip.durations.length - 1;
      if (last && strip.hold) return;
      goal.timer = this.scene.time.delayedCall(strip.durations[index] ?? 0, () => {
        if (last) this.setGoalState(end, 'rest');
        else show(index + 1);
      });
    };
    show(0);
  }

  private apply(): void {
    for (const item of this.items) {
      const visible = (this.layerVisible.get(item.layer) ?? true) && (!item.standIn || this.standIns) && !this.hidden.has(item.object);
      item.object.setVisible(visible);
    }
  }

  setLayerVisible(layer: ArenaLayerId, visible: boolean): void {
    this.layerVisible.set(layer, visible);
    this.apply();
  }

  isLayerVisible(layer: ArenaLayerId): boolean {
    return this.layerVisible.get(layer) ?? true;
  }

  /** How many objects a layer holds, split into supplied art and stand-ins. */
  layerContents(layer: ArenaLayerId): { supplied: number; standIns: number } {
    const mine = this.items.filter((i) => i.layer === layer);
    return { supplied: mine.filter((i) => !i.standIn).length, standIns: mine.filter((i) => i.standIn).length };
  }

  setStandIns(on: boolean): void {
    this.standIns = on;
    this.apply();
  }

  /** Record skating over a point on the ice (gameplay coordinates). Cosmetic only. */
  addTraffic(simX: number, simY: number, amount: number): void {
    const { grid } = this.layout;
    const col = Math.floor((simX - grid.x) / TILE);
    const row = Math.floor((projectY(simY, this.tilt) - grid.y) / TILE);
    if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return;
    this.wear.addTraffic(col, row, amount);
  }

  setWearIntensity(intensity: number): void {
    this.wearIntensity = intensity;
    this.refreshWear();
  }

  /** Show wear as a busy game would leave it, at a level from 0 (fresh sheet) to 1. */
  previewWear(level: number): void {
    const { grid } = this.layout;
    const toCell = (x: number, y: number): { col: number; row: number } => ({
      col: (x - grid.x) / TILE,
      row: (projectY(y, this.tilt) - grid.y) / TILE,
    });
    const spots = faceoffSpots(this.rink);
    const hot = [
      ...(['top', 'bottom'] as const).map((end) => ({
        ...toCell(this.rink.centerX, goalLineY(this.rink, end) + (end === 'top' ? 30 : -30)),
        radius: 7,
        weight: 1,
      })),
      ...[...spots.endZone, ...spots.neutral].map((s) => ({ ...toCell(s.x, s.y), radius: 3.5, weight: 0.85 })),
      { ...toCell(this.rink.centerX, this.rink.centerY), radius: 4, weight: 0.8 },
    ];
    this.wear.preview(level, trafficPrior(grid.cols, grid.rows, hot));
    this.refreshWear();
  }

  resurface(fraction = 1): void {
    this.wear.resurface(fraction);
    this.refreshWear();
  }

  /** Push the wear model into the scratch tile layer. Cheap enough to call a few times a second. */
  refreshWear(): void {
    const layer = this.scratchLayer;
    if (!layer) return;
    const { cols, rows } = this.layout.grid;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const want = this.wear.tileAt(col, row, this.wearIntensity);
        const have = layer.getTileAt(col, row)?.index ?? -1;
        if (want === have) continue;
        if (want < 0) layer.removeTileAt(col, row);
        else layer.putTileAt(want, col, row);
      }
    }
  }

  /**
   * Swap the centre-ice logo. Pass a texture key, 'test' for a generated test
   * card (a developer fixture, never shipped art), or null for the plain dot.
   */
  setCenterLogo(key: string | 'test' | null, scale?: number): void {
    const cx = this.rink.centerX;
    const cy = Math.round(projectY(this.rink.centerY, this.tilt));
    if (key === null) {
      this.logo?.setVisible(false);
      if (!this.centerDot && this.has(this.config.centerDot.asset)) {
        this.centerDot = this.scene.add.image(cx, cy, this.key(this.config.centerDot.asset), WHOLE).setMask(this.iceMask);
        this.add(this.centerDot, 'markings', false, layerDepth('markings') + 0.5);
      }
      this.centerDot?.setVisible(this.isLayerVisible('markings'));
      return;
    }
    const texture = key === 'test' ? this.testLogoTexture() : this.key(key);
    if (!this.scene.textures.exists(texture)) return;
    if (!this.logo) {
      this.logo = this.scene.add.image(cx, cy, texture, WHOLE).setMask(this.iceMask);
      this.add(this.logo, 'centerLogo', false, layerDepth('centerLogo') + 0.5);
    }
    this.logo.setTexture(texture, WHOLE).setOrigin(0.5, 0.5).setPosition(cx, cy);
    this.logo.setScale(scale ?? this.config.centerLogo?.scale ?? 2);
    this.logo.setVisible(this.isLayerVisible('centerLogo'));
    this.centerDot?.setVisible(false);
  }

  private testLogoTexture(): string {
    if (!this.scene.textures.exists(TEST_LOGO_KEY)) {
      const tex = this.scene.textures.createCanvas(TEST_LOGO_KEY, 32, 32);
      if (tex) {
        const ctx = tex.getContext();
        for (let y = 0; y < 24; y++) {
          for (let x = 0; x < 32; x++) {
            ctx.fillStyle = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0 ? '#ff2fd0' : '#141a3a';
            ctx.fillRect(x, y + 4, 1, 1);
          }
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(15, 4, 2, 24);
        ctx.fillRect(0, 15, 32, 2);
        tex.refresh();
      }
    }
    return TEST_LOGO_KEY;
  }

  /** Ids of every glass pane, such as 'north:2' or 'west:7'. */
  glassPanelIds(): string[] {
    return [...this.glassPanels.keys()];
  }

  /** Swap one pane between intact, cracked, shattered and missing. Visual only: no collision changes. */
  setGlassState(id: string, state: GlassState): void {
    const pane = this.glassPanels.get(id);
    const glass = this.config.glass;
    if (!pane || !glass) return;
    const asset = state === 'intact' ? glass.panels[pane.side] : `${glass.damageBatch}/glass_${pane.side}_${state}`;
    if (!this.has(asset)) return;
    pane.image.setTexture(this.key(asset), WHOLE).setCrop(0, 0, pane.cropW, pane.cropH);
  }

  setGridVisible(on: boolean): void {
    if (!this.grid) {
      const { grid } = this.layout;
      const g = this.scene.add.graphics().setDepth(8000);
      g.lineStyle(1, 0xff2fd0, 0.35);
      for (let c = 0; c <= grid.cols; c++) g.lineBetween(grid.x + c * TILE + 0.5, grid.y, grid.x + c * TILE + 0.5, grid.y + grid.rows * TILE);
      for (let r = 0; r <= grid.rows; r++) g.lineBetween(grid.x, grid.y + r * TILE + 0.5, grid.x + grid.cols * TILE, grid.y + r * TILE + 0.5);
      this.grid = g;
    }
    this.grid.setVisible(on);
  }

  /** Outline of what the physics actually collides with: boards, nets and goal lines. */
  setCollisionVisible(on: boolean): void {
    if (!this.collision) {
      const g = this.scene.add.graphics().setDepth(8001);
      g.lineStyle(1, 0x00ff66, 1);
      g.strokePoints(iceOutline(this.rink, this.tilt) as Phaser.Types.Math.Vector2Like[], true);
      for (const end of ['top', 'bottom'] as const) {
        const box = netBox(this.rink, end);
        const y0 = projectY(box.top, this.tilt);
        const y1 = projectY(box.bottom, this.tilt);
        g.lineStyle(1, 0xff3030, 1);
        g.strokeRect(box.left + 0.5, y0 + 0.5, box.right - box.left, y1 - y0);
        g.lineStyle(1, 0xffe14a, 1);
        const line = Math.round(projectY(goalLineY(this.rink, end), this.tilt)) + 0.5;
        g.lineBetween(box.left, line, box.right, line);
      }
      this.collision = g;
    }
    this.collision.setVisible(on);
  }

  destroy(): void {
    for (const item of this.items) item.object.destroy();
    this.items.length = 0;
    for (const map of this.maps) map.destroy();
    this.grid?.destroy();
    this.collision?.destroy();
    this.maskShape.destroy();
    this.logo = null;
    this.centerDot = null;
    this.scratchLayer = null;
    for (const goal of this.goals.values()) goal.timer?.remove();
    for (const goal of this.scaleGoals.values()) goal.timer?.remove();
    this.scaleGoals.clear();
    this.benchTimer?.remove();
    this.doorTimer?.remove();
    this.crowd?.destroy();
    this.crowd = null;
    this.stopResurfacer();
    this.clearTest('debris');
    this.clearTest('pools');
    for (const lamp of this.lamps.values()) lamp.timer?.remove();
    this.lamps.clear();
    this.doors.clear();
    this.benchPlayers.length = 0;
    this.hidden.clear();
    this.goals.clear();
    this.glassPanels.clear();
  }
}
