/**
 * Texture key and frame for a registry asset in Phaser: its own file, the file it
 * duplicates, or its cell of an atlas (cut as a named frame on first use).
 */
import type Phaser from 'phaser';
import { textureSource } from './registry';
import type { ArenaRegistry } from './registry';

/** The whole-image frame. A shared texture may be an atlas cut into 8x8 frames, so whole images ask for the full frame by name. */
export const WHOLE_FRAME = '__BASE';

export function cellFrame(scene: Phaser.Scene, key: string, x: number, y: number, width: number, height: number): string {
  const texture = scene.textures.get(key);
  const name = `cell-${x}-${y}-${width}x${height}`;
  if (!texture.has(name)) texture.add(name, 0, x, y, width, height);
  return name;
}

export function assetFrame(scene: Phaser.Scene, registry: ArenaRegistry, id: string): [string, string] {
  const source = textureSource(registry, id);
  const c = source.cell;
  return [source.key, c ? cellFrame(scene, source.key, c.x, c.y, c.width, c.height) : WHOLE_FRAME];
}
