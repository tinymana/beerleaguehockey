# Changelog

Newest first. Player-facing notes for the website live in `site/devnotes.json`.

## 0.2.5 - 2026-11-25 - Arena equipment (Lab tests)

Eight more packages (batches 14.01 to 14.08) ingested: 12,436 assets from 70 packages, 0 errors. Nothing in this release changes what you see in play: every piece in batch 14 waits on a system that does not exist yet, or on room the world does not have. No gameplay physics changed.

### Added (Arena Asset Lab only)
- Run resurfacer: the supplied ice resurfacer drives the sheet in lanes, lays its trail, and cleans the ice wear under it.
- Debris test: one of each debris piece on the ice, above the markings and below the skaters.
- Light pools test: the supplied soft glow under two rows of lights.
- Scoreboard test: all four states, pinned to the screen, with sample numbers in the manifest's score, clock and period fields.
- Ingest: tile lists under any manifest key.

### Known issues
- The resurfacer garage does not fit: it is 96 px deep and there are 55 px beside the boards. The resurfacer is 28 px wide and the doors open 24 px. `ARENA.md` A24.
- Banners, retired jerseys, arena signs and light fixtures are registered but not placed: there are no walls, rafters or beams outside the ice, and banners and jerseys must come from real dynasty records. `ARENA.md` A25, A27.
- The scoreboard's penalty timers need a 3x5 font the game does not have; those two fields are left empty. `ARENA.md` A26.
- The resurfacer does not reach into the rounded corners: about a tenth of the sheet keeps its wear after a pass.
- The scoreboard and one sponsor panel name the arena "The Ice Barn". No arena name has been approved. `ARENA.md` A26.

## 0.2.4 - 2026-11-25 - Stands, crowd and goal lamps

Fifteen more packages (batches 13.01 to 13.15) ingested: 9,610 assets from 62 packages, 0 errors. No gameplay physics changed.

### Added
- Seating down the west and east sides, outside the glass and in step with the board modules, with stairs every fifth module and a gap wherever a bench, penalty box or the timekeeper stands.
- A seated crowd: 68 fans in 120 visible seats (55% house). Who sits where comes from a seeded stream, so the crowd is the same every time and a fuller house only adds people.
- In play: a fan somewhere takes a sip every few seconds, and on a goal the lamp behind that net flashes for three seconds while the crowd plays the goal celebration.
- Arena Asset Lab: sit, stand, fans cheer, goal, bang glass (front row only), drink, heckle, goal lamps, and a readout of seats on screen, seats taken and seats that fall outside the world.
- Ingest: manifests that list animations under `sequences`; the registry is written compactly and single tiles no longer carry a hash. The game loads 184 files for 9,610 assets.

### Known issues
- Only three of the four seating tiers fit. The world is 480 px wide, the same as the screen, and the outer tier of each side falls outside it. `ARENA.md` A20.
- No seating art exists for the ends or corners, so the stand-in backdrop still shows there. `ARENA.md` A20.
- With no teams yet the whole building celebrates every goal. `ARENA.md` A21.
- The goal lamps are squeezed against the top and bottom edge of the world: there is no room beyond the end glass. `ARENA.md` A21.
- Registered but not placed: railings, aisles, tunnels, departing fans, columns and beams, sign holders, the beacon and siren fixtures. `ARENA.md` A22.
- One supplied sign reads "USA", a real place. `ARENA.md` A23.
- The registry is 2.5 MB of JSON (about 200 KB compressed), read once at start.

## 0.2.3 - 2026-11-25 - Benches, penalty boxes and doors

Ten more packages (batches 12.01 to 12.10) ingested: 4,327 assets from 47 packages, 0 errors. No gameplay physics changed.

### Added
- Home bench (west) and away bench (east) at centre ice, a penalty box south of each, and the timekeeper booth beside the east penalty box, all standing against the outside edge of the side boards and drawn behind the boards and glass.
- Six seated players on each bench, drawn between the bench's seating and enclosure layers.
- Animated doors (12.09) at every bench and penalty-box door, closed in play. They replace the static 10.12 gates at the same anchor; the free-standing gates proposed in v0.2.1 are gone.
- Arena Asset Lab: bench buttons (empty, seated, standing, cheer, groan), open and close doors, and a footprint report (off the ice, on screen, no overlaps, every door on a whole board module).
- Ingest: any file a manifest gives an atlas rectangle for is now served from the batch atlas rather than loaded on its own. The game loads 133 files for 4,327 assets.

### Known issues
- Every placement is my proposal: the packages call positions, anchors and spacing provisional. `ARENA.md` A16.
- Bench players wear placeholder blue and red. No team colours are approved. `ARENA.md` A17.
- Cheer and groan play only in the Lab: there are no teams to cheer for yet. Bench equipment (12.10) is registered but not placed, because the package gives no positions. `ARENA.md` A18.
- An open door shows the dark backdrop through the board opening: no threshold or floor art covers that strip. Doors stay closed in play.
- The west timekeeper booth is not used.

## 0.2.2 - 2026-11-25 - Goal nets

Ten more packages (batches 11.01 to 11.10) ingested: 3,157 assets from 37 packages, 0 errors. No gameplay physics changed: the net the puck collides with and the scoring test are exactly as before.

### Added
- Supplied north and south goals replace the stand-in nets, placed by their manifest mouth anchors on the goal lines and depth-sorted against the skater.
- Net ripple plays once on the scored net when the sim reports a goal. Visual only.
- Arena Asset Lab: goal state buttons (rest, scored, net ripple, bottle off, dislodged) and a goal fit readout comparing the drawn goal with the physics net.
- Ingest: animation batches. Single frame files are checked against their strip and filed as `frame` (not loaded separately); per-tile notes are summarised per batch; a `previewOnly` entry may be a single name.

### Changed
- The practice sheet arena keeps the stand-in nets, which are drawn at the size of the physics net, for comparison.

### Known issues
- The supplied goals are larger than the gameplay net: 37 px between the posts against a 24 px physics mouth, and about 25 px deep against 10 px. A puck can pass through the drawn posts' outer edges and net. Needs a ruling: `ARENA.md` A13.
- Scored, bottle knock-off and dislodged goal art is shown only in the Lab. No bottle or dislodged-net mechanic exists or is authorized.
- The registry is now 1.2 MB of JSON (3,157 entries), loaded once at start.
- Curved corner glass, benches, penalty boxes, stands, spectators and equipment are still missing.

## 0.2.1 - 2026-11-25 - Boards, glass, gates and sponsor panels

Thirteen more packages (batches 10.02 to 10.14) dropped into `art/packages/` and ingested with the same pipeline: 991 assets from 27 packages, 0 errors.

### Added
- Supplied straight boards on all four sides (east, north and south join west); the south boards are a foreground layer.
- Glass panes and support posts along every straight run, each pane with its own damage state (intact, cracked, shattered, missing). Visual only.
- Player gates that replace whole side-board modules, closed or open; glass is removed over an open gate.
- Sponsor panels on the end boards, clipped to the board face.
- "Corner art fit test" arena and a glass damage test in the Arena Asset Lab.
- Ingest: new folders (`boards/corners`, `boards/gates`, `boards/ads`, `boards/kickplates`, `glass`), multi-asset manifests, and an "unfit" slot status for art that arrived but cannot be used as drawn.
- Identical files now share one texture; the game loads 76 files for 991 assets.

### Changed
- Stand-in boards are drawn only in the corners, where no supplied art fits.
- The east boards are the supplied module, no longer a mirrored west module.

### Known issues
- The supplied corner boards do not fit the rink's corner radius and are not used outside the fit test. See `ARENA.md` A8.
- Curved corner glass, nets, benches, penalty boxes, stands, spectators and equipment are still missing.

## 0.2.0 - 2026-11-25 - Modular arena and Arena Asset Lab

Scope: integration of supplied arena art only. No gameplay physics changed; the simulation and its tests are untouched.

### Added
- **Asset pipeline:** `npm run assets:ingest` reads `art/packages/BLH_Batch_*.zip`, validates every PNG, files it under `public/assets/arena/` with its original name and bytes, and writes a central registry with a list of missing art slots. 201 assets from 14 packages registered, 0 errors.
- **Modular arena renderer** (`src/match/view/arena/`): the rink is assembled from 8x8 tile layers and independent sprites in twelve switchable layers, clipped to the ice outline, driven by an arena configuration. Three configurations: standard, supplied art only, practice sheet.
- **Supplied art in the game:** ice surface, scratches, light reflections, centre line, blue lines, goal lines, faceoff circles, dots and hash marks, centre circle, both creases, referee crease, centre-ice logo and west boards.
- **Cosmetic ice wear** that follows the skater and clears on resurfacing.
- **Arena Asset Lab** (press L on the title screen, or load with `#arena-lab`): rink preview, configuration selector, layer switches, tile grid, collision overlay, alignment guides, goal alignment tests, logo replacement test, wear control, art slots, asset browser, ingestion report.
- `ARENA.md`, screenshots in `docs/arena/`, 24 new tests (76 total).

### Changed
- Default camera tilt 0.78 to 0.74, to agree with the proportions of the supplied circles (open decision; slider unchanged).
- Code-drawn ice and markings removed. Code-drawn boards, stands and nets remain only as labeled stand-ins for art not yet supplied.

### Known issues
- Faceoff and centre circles are supplied at about a quarter of the rink's scale and are shown at 4x, so they look blockier than the rest. See `ARENA.md` A1.
- East boards are the west module mirrored (provisional). End boards, corners, glass, nets, benches, stands and spectators are stand-ins or absent until batches 10 to 14 arrive.
- Supplied side boards and stand-in corner boards do not match where they meet.

## 0.1.2 - 2026-11-25 - Supplied skater art

### Added
- The skater uses the creative director's supplied sprite sheet (art batch 01), processed to game resolution by `scripts/art/process_skater.py` into `public/assets/skater_base.png` (10 poses x 5 directions, 48x48 cells, feet-aligned, hard-edged, 28 colors).
- Pose selection: stride cycle, glide, brake, wind-up, shot. West-side directions mirror the east-side rows.
- Art batch 01 filed under `art/source/generated-batch-01/` (21 unique files; 11 duplicate uploads dropped). Review and gap list in `ASSET_MANIFEST.md`.
- Design: referee knock-out mechanic recorded (`GAME_DESIGN.md`, `DECISIONS.md` #26). Not implemented; it belongs with penalties in Milestone 2.

### Removed
- Code-drawn temporary skater.

### Known issues
- The carried puck follows the simulated stick blade, which does not line up exactly with the drawn stick in every direction.
- Feet alignment between frames is automatic and wobbles by a pixel or two in places.
- Mirrored directions flip the stick hand.
- Rink, nets, puck and font are still temporary code-drawn art.

## 0.1.1 - 2026-11-25 - Angled overhead camera

Requested by the creative director after playing v0.1.0. View-only change: the skating simulation and its tests are untouched.

### Changed
- Camera is now an angled overhead (three-quarter) view. The ice is foreshortened vertically; boards and nets have height; the near boards and nets draw in front of the skater.
- Temporary skater is an upright figure (48x48 cell, feet-anchored) in eight directions, replacing the top-down marker.
- Depth sorting by screen position.

### Added
- `cameraTilt` tuning value and slider (0.6 to 1.0, default 0.78). 1.0 is the old straight-down view. Changing it redraws the rink and restarts the prototype scene.
- `src/match/view/projection.ts` and projection tests (47 tests total).
- Rink layout templates regenerated for the tilted view; `ART_BRIEF.md` updated to match.

### Known issues
- Moving the tilt slider resets the skater and puck to centre ice.
- The puck has no height yet, so shots stay on the ice.

## 0.1.0 - 2026-11-25 - Milestone 0 and skating prototype

Checkpoint: awaiting creative approval. Nothing beyond this is authorized.

### Added
- Repository scaffold: TypeScript (strict), Phaser 3.90.0, Vite, Vitest, GitHub Actions CI.
- Project knowledge base: `GAME_DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `BACKLOG.md`, `ASSET_MANIFEST.md`, `CLAUDE.md`, `README.md`.
- Title screen: the supplied menu-free title art at full resolution behind a transparent, integer-scaled game canvas.
- Interactive main menu (keyboard, mouse, controller): New Career, Continue Career, Exhibition, Multiplayer, Options, Credits. Unbuilt modes show Coming Soon. Credits screen works.
- Skating prototype (Exhibition): one skater, one puck, vertical NHL-proportioned rink, scrolling camera that always keeps the skater on screen.
- Skating model: eight-direction input, acceleration, momentum, braking against travel, gliding, carving turns, board collisions including rounded corners.
- Puck: pickup on the stick blade, wind-up shots, friction, board rebounds, two nets with a goal counter.
- Keyboard and standard-mapping gamepad support.
- Developer tuning panel (backquote): max speed, acceleration, deceleration, turning responsiveness, ice friction, puck friction, pickup radius, shot velocity, board restitution, camera follow, camera look-ahead. Live, persisted per browser, with reset and copy.
- Temporary code-drawn rink, skater, puck and 5x7 pixel font for the style test.
- Seeded RNG with named streams (`src/core/rng.ts`) for later simulation work.
- Static marketing website in `site/` with the game embedded under `/play/`.
- 43 automated tests: RNG determinism, skating physics, boards, possession and shooting, goals, sim determinism, camera, font data, integer scaling, module boundaries.

### Known issues
- Temporary skater sprite is rough: no stop, shot or skate-cycle animation beyond two frames.
- No sound.
- The puck can be carried into the net mouth on the blade without counting as a goal; only a loose puck scores.
- Gamepad support was verified by code path and tests only, not with a physical controller.
- Window smaller than 480x320 is not supported (desktop first).
