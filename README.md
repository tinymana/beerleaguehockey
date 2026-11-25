# Beer League Hockey

A recreational hockey universe by Tiny Mana Studios: 16-bit arcade hockey feel, a deep persistent rec-league dynasty, and beer league culture.

**Status: Milestone 0, the skating prototype and the modular arena (v0.2.3).** One skater, one puck, one rink, and a live tuning panel, so the feel of skating can be judged before a hockey game is built on it. Dynasty, lifestyle, economy and multiplayer are not started.

## Run it

Requires Node 22 or newer.

```bash
npm install
npm run dev          # play at the printed local address
npm test             # automated tests
npm run typecheck    # TypeScript, strict
npm run build        # game only, into dist/
npm run build:site   # website with the game under /play/, into dist-site/
npm run assets:ingest # rebuild public/assets/arena/ from art/packages/
npm run preview:site # serve the assembled website locally
```

## Controls

| Action | Keyboard | Controller |
| --- | --- | --- |
| Menu | Arrow keys, Enter | D-pad or stick, A |
| Skate (eight directions) | Arrow keys or W A S D | Left stick or D-pad |
| Shoot: hold to wind up, release to fire | Space, J or X | A or X |
| Puck back to centre ice | R | Y |
| Developer tuning panel | ` (backquote) | Select |
| Back to menu | Esc | Start |

On the main menu choose **Exhibition** for the skating prototype. Other modes are marked Coming Soon.

## Arena art and the Arena Asset Lab

The rink is assembled from supplied tile art. To add a new art package: drop the `BLH_Batch_*.zip` into `art/packages/` and run `npm run assets:ingest` (needs Python 3 with Pillow and NumPy). Review it in the **Arena Asset Lab**: press **L** on the title screen, or open the game with `#arena-lab` at the end of the address. Details in `ARENA.md`.

## Tuning the feel

Press backquote in the prototype. Every slider changes the game live and is remembered in that browser. COPY VALUES puts the current numbers on the clipboard as JSON; paste them into `src/match/sim/tuning.ts` (`DEFAULT_TUNING`) to make them the defaults.

## Project layout

```
src/core        seeded RNG, math helpers (depends on nothing)
src/match/sim   skating simulation, pure TypeScript, fixed 60 Hz step
src/match/view  Phaser-side match helpers: projection, camera maths, skater sheet, stand-ins
src/match/view/arena  modular arena renderer, layout maths, ice wear, asset registry
src/app         Phaser boot, title menu, skating scene, tuning panel
src/dynasty     not started
src/lifestyle   not started
tests           Vitest suites
site            marketing website (static)
art/source      artwork supplied by the creative director
```

## Website

`site/` is a static landing page in the style of the Ryan's Road site: hero art, Play now / Play here, feature cards, controls and dev notes read from `site/devnotes.json`. `npm run build:site` produces `dist-site/`, ready for any static host (it includes a `_headers` file for Cloudflare Pages or Netlify). Add a new entry at the top of `devnotes.json` with each release. Once a domain is chosen, add `og:url` and an absolute `og:image` to `site/index.html`.

## Knowledge base

`GAME_DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `BACKLOG.md`, `ASSET_MANIFEST.md`, `CHANGELOG.md` and `CLAUDE.md` hold the design, the approved and open decisions, and the working rules. Start with `CLAUDE.md`.

## Art

Title art, skater sprites and rink tiles are supplied by Tiny Mana Studios. The puck, the pixel font and the stand-ins for missing arena pieces (end boards, nets, stands) are temporary and code-drawn. See `ASSET_MANIFEST.md`.
