import Phaser from 'phaser';
import { assetFrame } from '../match/view/arena/phaserTextures';
import { REGISTRY_KEY, assetById } from '../match/view/arena/registry';
import type { ArenaRegistry } from '../match/view/arena/registry';
import { sequenceFrame } from '../match/view/arena/layout';
import { LOCKER_MODES, LOCKER_SEQUENCES, SAMPLE_TROPHIES, actorIsIdle, layoutLockerRoom, sequenceFrameId } from '../match/view/locker/lockerRoom';
import type { LockerActor, LockerMode, LockerRoomLayout, LockerTeam } from '../match/view/locker/lockerRoom';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, UI } from './config';
import { addText, fontText } from './pixelFont';
import { tuningPanel } from './session';
import { setTitleArtVisible } from './stage';

interface Performer {
  actor: LockerActor;
  image: Phaser.GameObjects.Image;
  /** Which of the actor's actions is playing, and when it began. */
  step: number;
  started: number;
}

const PAUSE = 500;

/**
 * Developer-only fit test for the batch 15 locker room art: one assembled room, five moods.
 * It checks that the pieces line up and the animations play. It is not the locker room
 * location of the game; nothing here reads or changes any game state.
 */
export class LockerRoomTestScene extends Phaser.Scene {
  private registryData!: ArenaRegistry;
  private team: LockerTeam = 'blue';
  private mode: LockerMode = 'dressing';
  private trophies = false;
  private room!: LockerRoomLayout;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private performers: Performer[] = [];
  private status!: Phaser.GameObjects.BitmapText;
  /** Asset ids the room asked for that are not loaded. */
  readonly missing: string[] = [];

  constructor() {
    super(SCENES.lockerRoom);
  }

  create(): void {
    setTitleArtVisible(false);
    tuningPanel().hide();
    this.registryData = this.cache.json.get(REGISTRY_KEY) as ArenaRegistry;
    this.cameras.main.setBackgroundColor(UI.navy);
    addText(this, 4, 4, 'Locker room fit test - developer only', UI.gold).setDepth(9000);
    this.status = addText(this, GAME_WIDTH - 4, 4, '', UI.ice).setOrigin(1, 0).setDepth(9000);
    addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 11, fontText('1-5: mood   C: colour   T: sample trophies   Esc: back'), UI.ice).setOrigin(0.5, 0).setDepth(9000);

    const kb = this.input.keyboard;
    if (kb) {
      LOCKER_MODES.forEach((m, i) => kb.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][i]}`, () => this.setMode(m.id)));
      kb.on('keydown-C', () => this.setTeam(this.team === 'blue' ? 'red' : 'blue'));
      kb.on('keydown-T', () => this.setTrophies(!this.trophies));
      kb.on('keydown-ESC', () => this.scene.start(SCENES.arenaLab));
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb?.removeAllListeners());
    this.build();
  }

  /** For automated checks. */
  state(): { mode: LockerMode; team: LockerTeam; trophies: boolean; pieces: number; actors: number; missing: string[] } {
    return { mode: this.mode, team: this.team, trophies: this.trophies, pieces: this.room.pieces.length, actors: this.performers.length, missing: [...this.missing] };
  }

  setMode(mode: LockerMode): void {
    this.mode = mode;
    const now = this.time.now;
    for (const p of this.performers) {
      p.step = 0;
      p.started = now + p.actor.delay;
    }
    this.refreshStatus();
  }

  setTeam(team: LockerTeam): void {
    this.team = team;
    this.build();
  }

  setTrophies(on: boolean): void {
    this.trophies = on;
    this.build();
  }

  private frame(id: string): [string, string] | null {
    const asset = assetById(this.registryData, id);
    const [key, frame] = assetFrame(this, this.registryData, id);
    if (!asset || !this.textures.exists(key)) {
      if (!this.missing.includes(id)) this.missing.push(id);
      return null;
    }
    return [key, frame];
  }

  private build(): void {
    for (const o of this.objects) o.destroy();
    this.objects = [];
    this.performers = [];
    this.room = layoutLockerRoom(this.team, GAME_WIDTH, GAME_HEIGHT);
    for (const piece of this.room.pieces) {
      const tex = this.frame(piece.asset);
      if (!tex) continue;
      this.objects.push(this.add.image(piece.x, piece.y, ...tex).setOrigin(0, 0).setFlipX(!!piece.flipX).setDepth(piece.depth));
    }
    if (this.trophies) {
      // Sample trophies, to check the slots. A real cabinet is filled from career history only.
      this.room.cabinet.slots.forEach(([sx, sy], i) => {
        const tex = this.frame(SAMPLE_TROPHIES[i % SAMPLE_TROPHIES.length] ?? '');
        if (tex) this.objects.push(this.add.image(this.room.cabinet.x + sx, this.room.cabinet.y + sy, ...tex).setOrigin(0, 0).setDepth(2000));
      });
      this.objects.push(addText(this, this.room.cabinet.x + 64, this.room.cabinet.y - 10, 'Sample - test only', UI.red).setOrigin(1, 0).setDepth(2001));
    }
    const now = this.time.now;
    for (const actor of this.room.actors) {
      const image = this.add.image(actor.x, actor.y, '__DEFAULT').setOrigin(0, 0);
      this.objects.push(image);
      this.performers.push({ actor, image, step: 0, started: now + actor.delay });
    }
    this.refreshStatus();
    this.pose();
  }

  private refreshStatus(): void {
    const label = LOCKER_MODES.find((m) => m.id === this.mode)?.label ?? '';
    this.status.setText(fontText(`${label} - ${this.team}`));
  }

  update(): void {
    this.pose();
  }

  /** Put every person on the right frame for this instant. */
  private pose(): void {
    const now = this.time.now;
    for (const p of this.performers) {
      const actions = p.actor.actions[this.mode];
      const sequence = LOCKER_SEQUENCES[actions[p.step % actions.length] ?? 'ready'];
      let frame = 0;
      if (!actorIsIdle(p.actor, this.mode)) {
        const at = sequenceFrame(sequence.durations, 1, now - p.started);
        if (at === null) {
          // Finished (or not begun): hold the first frame, then move on to the next action after a pause.
          const total = sequence.durations.reduce((a, b) => a + b, 0);
          if (now - p.started >= total + PAUSE) {
            p.step++;
            p.started = now;
          }
        } else {
          frame = at;
        }
      }
      const tex = this.frame(sequenceFrameId(sequence, this.team, frame));
      if (!tex) continue;
      p.image
        .setTexture(...tex)
        .setPosition(p.actor.x - sequence.anchor[0], p.actor.y - sequence.anchor[1])
        .setDepth(10 + p.actor.y + 1);
    }
  }
}
