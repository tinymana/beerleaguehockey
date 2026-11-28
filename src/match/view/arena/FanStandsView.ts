/**
 * The side stands with the stopgap fan sheet (Decision 100): seat rows and aisles drawn in code
 * (temporary, until seating art arrives at game size) and one image per fan from the 16x24 sheet.
 * Pictures only. Who sits where is decided by layout.ts; this class shows it and keeps time.
 */
import Phaser from 'phaser';
import { Rng, hashString } from '../../../core/rng';
import { FAN_SHEET } from './config';
import type { CrowdPose, CrowdReaction } from './config';
import type { FanStandsLayout, SheetFan } from './layout';

const COLOUR = { floor: 0x262c3c, seat: 0x1f2a55, seatTop: 0x2c3a72, gap: 0x161b2e, step: 0x565c68, stepEdge: 0x3c414c, stepLight: 0x6c7280 };

interface Member {
  fan: SheetFan;
  image: Phaser.GameObjects.Image;
  /** When his cheer starts (scene time, ms); null when he is sitting. */
  cheerAt: number | null;
}

export class FanStandsView {
  /** Everything drawn, back to front: the seating first, then the fans from the top of the screen down. */
  readonly objects: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Image)[] = [];
  private readonly members: Member[] = [];
  private readonly timer: Phaser.Time.TimerEvent;
  private readonly rng: Rng;

  constructor(
    private readonly scene: Phaser.Scene,
    layout: FanStandsLayout,
    seed: string,
  ) {
    // Cosmetic timing only (who jumps up a beat late): its own named stream.
    this.rng = new Rng(hashString(seed)).fork('fan-reactions');
    const g = scene.add.graphics();
    const [seatW] = FAN_SHEET.cell;
    for (const band of layout.bands) {
      if (band.kind === 'stairs') {
        g.fillStyle(COLOUR.step, 1).fillRect(band.x, band.y, band.width, band.height);
        for (let y = band.y; y < band.y + band.height; y += 4) {
          g.fillStyle(COLOUR.stepLight, 1).fillRect(band.x, y, band.width, 1);
          g.fillStyle(COLOUR.stepEdge, 1).fillRect(band.x, y + 3, band.width, 1);
        }
        continue;
      }
      g.fillStyle(COLOUR.floor, 1).fillRect(band.x, band.y, band.width, band.height);
      for (let y = band.y; y < band.y + band.height; y += FAN_SHEET.rowDepth) {
        // A row of seat backs along the bottom of each seat row, a seat wide each.
        for (let i = 0; i < band.seats; i++) {
          const x = band.seatX + i * seatW;
          g.fillStyle(COLOUR.seat, 1).fillRect(x, y + 6, seatW, FAN_SHEET.rowDepth - 6);
          g.fillStyle(COLOUR.seatTop, 1).fillRect(x, y + 6, seatW, 2);
          g.fillStyle(COLOUR.gap, 1).fillRect(x + seatW - 1, y + 6, 1, FAN_SHEET.rowDepth - 6);
          g.fillStyle(COLOUR.gap, 1).fillRect(x, y + 6, 1, FAN_SHEET.rowDepth - 6);
        }
      }
    }
    this.objects.push(g);
    for (const fan of [...layout.fans].sort((a, b) => a.y - b.y)) {
      const image = scene.add.image(fan.x, fan.y, FAN_SHEET.key, fan.frame).setOrigin(0.5, 1);
      this.objects.push(image);
      this.members.push({ fan, image, cheerAt: null });
    }
    this.timer = scene.time.addEvent({ delay: 30, loop: true, callback: () => this.tick() });
  }

  get size(): number {
    return this.members.length;
  }

  /** How many fans are up, or about to be. */
  get reacting(): number {
    return this.members.filter((m) => m.cheerAt !== null).length;
  }

  /** These fans only sit: the sheet has no standing crowd. */
  currentPose(): CrowdPose {
    return 'seated';
  }

  setPose(_pose: CrowdPose): void {
    for (const m of this.members) this.sit(m);
  }

  /** A goal or a cheer brings everyone up for a moment, each a beat apart. The sheet has nothing for the other reactions. */
  react(kind: CrowdReaction): number {
    if (kind !== 'goal' && kind !== 'cheer') return 0;
    const now = this.scene.time.now;
    for (const m of this.members) m.cheerAt = now + this.rng.range(0, FAN_SHEET.stagger);
    return this.members.length;
  }

  destroy(): void {
    this.timer.remove();
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.members.length = 0;
  }

  private sit(m: Member): void {
    m.cheerAt = null;
    m.image.setFrame(m.fan.frame).setY(m.fan.y);
  }

  private tick(): void {
    const now = this.scene.time.now;
    for (const m of this.members) {
      if (m.cheerAt === null || now < m.cheerAt) continue;
      const t = now - m.cheerAt;
      if (t >= FAN_SHEET.hold) {
        this.sit(m);
        continue;
      }
      // Arms up, bouncing a pixel.
      m.image.setFrame(m.fan.cheer).setY(m.fan.y - (Math.floor(t / FAN_SHEET.bob) % 2));
    }
  }
}
