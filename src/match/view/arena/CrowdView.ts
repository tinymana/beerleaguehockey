/**
 * The crowd in the stands: one image per spectator, switched between the
 * supplied still poses and reaction frames. Pictures only. Who sits where is
 * decided by layout.ts; this class only shows it and keeps time.
 */
import Phaser from 'phaser';
import { Rng, hashString } from '../../../core/rng';
import type { CrowdPose, CrowdReaction, CrowdReactionArt, StadiumArt } from './config';
import { sequenceFrame } from './layout';
import type { Fan } from './layout';

/** Texture key and frame for a registry asset id (supplied by the renderer). */
type TextureOf = (id: string) => [string, string];

interface Member {
  fan: Fan;
  image: Phaser.GameObjects.Image;
  reaction: { art: CrowdReactionArt; start: number } | null;
}

const two = (n: number): string => String(n).padStart(2, '0');

export class CrowdView {
  readonly images: Phaser.GameObjects.Image[] = [];
  private readonly members: Member[] = [];
  private readonly timer: Phaser.Time.TimerEvent;
  private readonly rng: Rng;
  private pose: CrowdPose = 'seated';
  private nextSip = Number.POSITIVE_INFINITY;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly art: StadiumArt,
    fans: readonly Fan[],
    private readonly textureOf: TextureOf,
    seed: string,
  ) {
    // Cosmetic timing only (who sips next, who starts a beat late): its own named stream.
    this.rng = new Rng(hashString(seed)).fork('crowd-reactions');
    for (const fan of fans) {
      const image = scene.add.image(fan.x, fan.y, ...this.still(fan));
      this.images.push(image);
      this.members.push({ fan, image, reaction: null });
    }
    this.scheduleSip();
    this.timer = scene.time.addEvent({ delay: 30, loop: true, callback: () => this.tick() });
  }

  get size(): number {
    return this.members.length;
  }

  /** How many fans are in the middle of a reaction. */
  get reacting(): number {
    return this.members.filter((m) => m.reaction).length;
  }

  currentPose(): CrowdPose {
    return this.pose;
  }

  /** Sit everyone down or stand everyone up, ending any reaction. */
  setPose(pose: CrowdPose): void {
    this.pose = pose;
    for (const m of this.members) {
      m.reaction = null;
      m.image.setTexture(...this.still(m.fan));
    }
  }

  /** Start a reaction across the crowd (front row only for some), each fan a moment apart. */
  react(kind: CrowdReaction): number {
    const art = this.art.crowd.reactions[kind];
    const now = this.scene.time.now;
    let count = 0;
    for (const m of this.members) {
      if (art.frontRowOnly && !m.fan.frontRow) continue;
      m.reaction = { art, start: now + this.rng.range(0, art.stagger) };
      count++;
    }
    return count;
  }

  destroy(): void {
    this.timer.remove();
    for (const image of this.images) image.destroy();
    this.images.length = 0;
    this.members.length = 0;
  }

  private still(fan: Fan): [string, string] {
    return this.textureOf(`${this.art.crowd[this.pose]}_${fan.side}_${two(fan.variant)}`);
  }

  private scheduleSip(): void {
    const [min, max] = this.art.crowd.sipEvery;
    this.nextSip = max > 0 && this.members.length > 0 ? this.scene.time.now + this.rng.range(min, max) * 1000 : Number.POSITIVE_INFINITY;
  }

  private tick(): void {
    const now = this.scene.time.now;
    if (now >= this.nextSip) {
      // One idle fan somewhere has a drink.
      const idle = this.members.filter((m) => !m.reaction);
      const pick = idle[this.rng.int(Math.max(1, idle.length))];
      if (pick) pick.reaction = { art: this.art.crowd.reactions.drink, start: now };
      this.scheduleSip();
    }
    for (const m of this.members) {
      if (!m.reaction) continue;
      const { art, start } = m.reaction;
      if (now < start) continue;
      const frame = sequenceFrame(art.durations, art.loops, now - start);
      if (frame === null) {
        m.reaction = null;
        m.image.setTexture(...this.still(m.fan));
      } else {
        m.image.setTexture(...this.textureOf(`${art.batch}/${art.name}_${m.fan.side}_${two(m.fan.variant)}_${two(frame)}`));
      }
    }
  }
}
