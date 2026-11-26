// Assembles the public website: site/ at the root, the game build under /play/.
// Run with `npm run build:site` (which builds the game first).
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = join(root, 'dist');
const out = join(root, 'dist-site');

if (!existsSync(join(game, 'index.html'))) {
  console.error('Game build not found. Run `npm run build` first.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'site'), out, { recursive: true });
cpSync(game, join(out, 'play'), { recursive: true });
// Private development data (licence unverified) never goes into a site build.
rmSync(join(out, 'play', 'private'), { recursive: true, force: true });
rmSync(join(game, 'private'), { recursive: true, force: true });
console.log(`Website assembled in ${out}`);
