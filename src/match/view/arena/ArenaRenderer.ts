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
import type { ArenaConfig } from './config';
import { IceWear, trafficPrior } from './iceWear';
import { ARENA_LAYERS, faceoffSpots, iceOutline, layerDepth, layoutArena } from './layout';
import type { ArenaLayerId, ArenaLayout } from './layout';
import { TILE, assetById, assetUrl, loadableAssets } from './registry';
import type { ArenaRegistry } from './registry';

type Drawable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible & Phaser.GameObjects.Components.Depth;

interface Item {
  object: Drawable;
  layer: ArenaLayerId;
  standIn: boolean;
}

const TEST_LOGO_KEY = 'arena-lab-test-logo';

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

  /** Queue every registry texture on a scene's loader. Call from preload. */
  static queueAssets(loader: Phaser.Loader.LoaderPlugin, registry: ArenaRegistry): void {
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

    buildTemporaryTextures(scene, rink, tilt);
    this.buildIce();
    this.buildMarkings();
    this.buildSurroundings();
    this.buildNets();
    this.apply();
  }

  // ---- construction -------------------------------------------------------

  private has(id: string): boolean {
    const ok = this.scene.textures.exists(id);
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
      const image = this.scene.add.image(p.x, p.y, p.asset, p.frame).setOrigin(p.originX, p.originY).setScale(p.scale);
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

    // Supplied straight boards, repeated along the side.
    for (const run of this.layout.boards) {
      const asset = assetById(this.registry, run.asset);
      if (!asset || !this.has(run.asset)) continue;
      const strip = this.scene.add.tileSprite(run.x, run.y, asset.width, run.height, run.asset).setOrigin(0, 0);
      if (run.flipX) strip.setFlipX(true);
      this.add(strip, 'backBoards', false, layerDepth('backBoards') + 1);
    }
  }

  private buildNets(): void {
    for (const end of ['top', 'bottom'] as const) {
      const anchor = netScreenAnchor(this.rink, end, this.tilt);
      const layout = netLayout(this.rink, end, this.tilt);
      const top = anchor.y - layout.goalLineRow;
      const image = this.scene.add.image(anchor.x, top, end === 'top' ? TEX.netTop : TEX.netBottom).setOrigin(0, 0);
      // The far net sorts at its goal line; the near net at its back edge, so it covers players behind it.
      this.add(image, 'nets', true, end === 'top' ? anchor.y : top + layout.height);
    }
  }

  // ---- runtime controls ---------------------------------------------------

  private apply(): void {
    for (const item of this.items) {
      const visible = (this.layerVisible.get(item.layer) ?? true) && (!item.standIn || this.standIns);
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
        this.centerDot = this.scene.add.image(cx, cy, this.config.centerDot.asset).setMask(this.iceMask);
        this.add(this.centerDot, 'markings', false, layerDepth('markings') + 0.5);
      }
      this.centerDot?.setVisible(this.isLayerVisible('markings'));
      return;
    }
    const texture = key === 'test' ? this.testLogoTexture() : key;
    if (!this.scene.textures.exists(texture)) return;
    if (!this.logo) {
      this.logo = this.scene.add.image(cx, cy, texture).setMask(this.iceMask);
      this.add(this.logo, 'centerLogo', false, layerDepth('centerLogo') + 0.5);
    }
    this.logo.setTexture(texture).setOrigin(0.5, 0.5).setPosition(cx, cy);
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
  }
}
