# Changelog

Newest first. Player-facing notes for the website live in `site/devnotes.json`.

## 0.8.0 - 2026-11-25 - Milestone 1: shooting and a basic goalie

182 tests. In Pick-Up.

### Added
- **Wrist and slap shots:** a quick release is a wrist shot that climbs; holding past half the wind-up is a slap shot, harder and lower. The puck now has height, with a shadow under it.
- **Posts and crossbar:** a puck on the iron comes back out; one above the bar sails over the net. Shots are judged at the exact point they cross the goal line.
- **A basic goalie in each net:** he stands on the line between the puck and the middle of the net, slides at a fixed speed, and reacts to where the puck was a moment ago. Pads stop low shots and kick out rebounds; the body and glove hold the puck and drop it; the blocker steers it wide. A low shot through the middle gets by only while he is sliding (five-hole). The north and south goalies catch with the same hand, so their glove sides are mirrored on screen.
- **Readout:** shots, saves, iron and goals, and what the last shot did. G removes or restores the goalies.
- Pixel templates for the north and south goal art (`art/templates/goal_*_template_*.png`).

### Changed
- The body model in Create a Player uses the wedge-corrected frames.

### Known issues
- **Starting values, not balance.** Nothing was tuned to make the bigger net harder; shot lift, goalie speed, reach and reaction are settings for you to judge.
- The goalie is a labelled code-drawn stand-in. He does not come out, drop, poke-check, cover loose pucks or play the puck, and the skater can pass through him.
- Shot direction is the stick direction or the held direction; there is no separate aim for high or low.
- No opponents, passing or teammates.
- Attribute panel redesign and name pool expansion are still not done.

## 0.7.0 - 2026-11-25 - The 48-pixel goal

171 tests (2 need the private authoring file and are skipped without it).

### Changed
- **Goal mouth widened from 24 to 48 px (Decision 76).** 2 px posts, 52 px outside, deeper and taller in proportion, with the goal line moved out so the ice behind the net is unchanged. The stand-in net, the collision box and the scoring test all come from one setting; 40 px is kept as a test value. A goal now needs the whole puck between the posts.
- The supplied creases are shown at twice their size to match, until redrawn.
- Master art packages moved out of the repository; ingest scripts read them from a configurable folder (`BLH_ART_DIR`).
- The curated authoring file moved to private storage. The game and its tests run without it.

### Added
- `ART_BRIEF.md` section 11: exact goal, crease, bottle, ripple, knock-off and dislodged-net specification; section 12: the updated request for the art tool.
- `COMPOSITOR_ART_SPEC.md`: clarifications, approved counts, 12 casual outfits, fit classes, and the proof-of-concept package.

### Known issues
- **Not locked:** the goal dimensions wait on shooting and goaltending tests.
- Faceoff circles are still thick and the ice still blue: both are supplied art, which the game never recolours or redraws. New art is specified.
- Shooting feel was tuned for the old net and has not been retuned. There is no goalie yet.
- Switching between 40 and 48 is a one-number change in code, not an in-game switch.
- The attribute panel redesign and the name pool expansion are not done.
- The batch 11 goal art is now smaller than the net (37 px against 52) and remains fit-test only.

## 0.6.0 - 2026-11-25 - A fictional hockey universe; profile details; randomize with locks; edit a saved player's look

166 tests.

### Added
- **Profile details:** hometown, jersey number, shoots left or right, height and weight. None changes a rating.
- **Randomize look** with **field locks**: locked fields are kept; nationality is never randomized.
- **Edit a saved player:** change their look or jersey number from Saved Players. The roll, influences and ratings are never touched (tested).
- `COMPOSITOR_ART_SPEC.md` and `docs/compositor_template.png`: the exact layer specification and alignment template for the art team.

### Changed
- **Fictional names everywhere (Decision 74):** the 64 curated influences appear under their fictional identities, and no real name is built into the game. Ids are unchanged, so saved players load as before.
- Fictional professionals are confirmed at full strength: no influence is mechanically better than another.
- Batch 19 master package moved out of the repository to external art storage (Decision 75).

### Known issues
- **Attribute icons are not in yet.** The batch 16.09 icons are 32x32 at their smallest and the attribute rows are 14 px tall; art is never resampled, so the attribute panel needs a new layout first.
- **Name pools are not expanded yet** (about 3,000 combinations against the 100,000 target).
- The batch 19 zip is still in the branch's history (50 MB) until a second history clean-up, which needs approval.
- The deployed equipment atlas still contains the excluded branded items as unused pixels.
- Batches 09 to 16 master packages are still in the repository.
- Skating checkpoint approved (Decision 73), but on-ice work has not started: the net-size ruling is open.

## 0.5.0 - 2026-11-25 - Appearance and nationality; fictional professionals and aliases; history rewritten

162 tests.

### Added
- **Nationality step:** 249 flags, searchable. Random names use the nationality when there is a name pool for it.
- **Appearance step (Decisions 66, 72):** 56 preset faces, hair, facial hair, 24 skin tones, 12 body types and five unbranded gear slots, each chosen in a picker with its picture. The face and the body model are drawn; the rest are stored picks shown as reference art until layer art exists.
- **Appearance record and compositor:** versioned, stored with the draft and the confirmed player, repaired on load, changeable after confirmation without touching the roll.
- **Fictional professional registry (Decision 68):** the 240 invented professionals now have a handedness (25% right, a setting), a career accomplishment (flavour) and a balanced style profile from one of the 18 play styles.
- **64 fictional aliases** for the curated influences, as distinct identities.
- `POPULATION_PLAN.md`: architecture for procedural player generation. Not built.
- `.github/workflows/pages.yml`: prepared, manual-only, with a guard that refuses private or dataset-derived files.
- Batch 19 (career rewards and collectibles) filed as reference art. Not integrated: collectibles are not authorized, and the package describes itself as reference crops.

### Changed
- **Repository history rewritten (Decision 67):** licence-unverified data removed from every commit; all commit ids changed. See `REPO_HISTORY_REWRITE.md`.
- `src/dynasty/data/influences.ts` is now `curatedInfluences.ts`.
- 172 high-confidence reconciliation matches accepted (private).

### Known issues
- Hair, facial hair, skin tone, body type and gear are not drawn on the player: no layer art exists. Exact missing assets: `CREATOR_PLAN.md` section 12.
- Helmets and gloves cannot be chosen (branded art excluded).
- A confirmed player's look cannot be edited on screen yet.
- Fictional professionals now shape a player as strongly as curated ones. See the checkpoint question on this.
- GitHub still serves the pre-rewrite commits by id until GitHub Support purges them.
- The real names of the 64 curated influences are still shown; the fictional switch is one setting.

## 0.4.1 - 2026-11-25 - Data precautions; Hybrid Goalie; delete, Pick-Up choice, name entry; card pictures

155 tests.

### Added
- **PS18 Hybrid Goalie (Decision 62):** flat starting allocation; 7% faster development on six technique attributes; nothing slowed.
- **Stored players (Decision 63):** delete a created player, with an explicit confirmation; choose one for Pick-Up; ids are never reused; the limit of eight is a setting.
- **Name entry (Decision 64):** an on-screen keyboard for gamepad and mouse, a random-name button drawing on fictional name pools for twelve nationalities, and physical keyboard typing as before. Random names can be edited.
- **Card pictures (batch 16.10):** play style and starting archetype cards show their illustrations; influences show a silhouette.
- **Fictional fallback registry (Decision 61):** 240 invented professionals so the wider influence list works with no outside data.
- **Reconciliation, classified (Decision 65):** 208 high confidence, 224 for manual review, 6 rejected, 41 unresolved. Nothing is accepted until reviewed.
- `REPO_HISTORY_REWRITE.md`: backup, affected references and proposed commands. Not executed.

### Changed
- **The biographical file and everything generated from licence-unverified data are out of the repository tree** and git-ignored. The curated registry is built from its own file alone and no longer carries country, handedness, height, weight or outside ids.
- The real wider registry is loaded only by the development server from private data. Builds use the fictional fallback.

### Known issues
- **Older commits still contain the removed files** until the history rewrite is approved and run.
- The appearance work authorized in Decision 66 has not been started.
- Random names pick a nationality pool at random until the nationality step exists.
- Choosing a Pick-Up player records the choice; the skating prototype does not use a created player's ratings yet (on-ice work is gated).
- No dynasty careers exist, so career protection on delete is a tested hook with nothing to protect yet.
- Hybrid Goalie has no card picture in the package; batch 16.10 art has transparency and cropping issues (`CARD_ART_SPEC.md` section 9).
- A player made in v0.4.0 with a real wider-registry influence still loads, showing that influence as an unlisted professional.

## 0.4.0 - 2026-11-25 - Create a Player V1 (first build); the wider influence registry

145 tests. On the ice nothing changed.

### Added
- **Off-ice rendering profile (Decision 38):** off-ice screens draw at 960x540 and the ice stays 480x320, in one game. Whole-number scaling where the window allows; smaller windows shrink to fit with letterboxing.
- **Create a Player V1 (Decision 58)**, drawn with the batch 16.11 interface kit: Profile (name, position), Background, Influences (search across 8,662 people; one primary and two secondaries at 60 / 25 / 15), Play Style, Archetype, Review, Saved Players. Keyboard, mouse and gamepad. Open it from the menu or with `#creator`.
- **No re-roll.** Before confirmation the screen shows the range each attribute can start in and the range of its potential, updating as you browse choices. The player is rolled once, at confirmation, and kept. A draft stores choices only: no seed, no ratings.
- **Stored players:** up to 8 confirmed players kept in the browser, versioned, with tests. A save that cannot be read is set aside, not overwritten.
- **Starting archetypes** AR01 to AR07 in the game, offered by background and position (Decisions 54, 55).
- **Wider influence registry (Decision 53):** everyone in the biographical file is selectable. 830 skaters carry one mild leaning (finisher: offensive awareness; playmaker: passing); the rest are neutral and labelled limited data; goalies outside the curated ten are neutral. The 64 curated profiles are unchanged and listed first.
- **Reconciliation worklist** for the 479 unmerged statistics records, with suggested matches, and a decisions file the audit applies.

### Changed
- The earlier creator foundation screen is replaced by V1. Its re-roll button is gone on purpose.
- **Raw NHL statistics removed from the repository** and kept in a git-ignored folder (licence pending, Decision 53).

### Known issues
- Card pictures are labelled placeholders; the font is the temporary 5x7.
- Appearance, equipment, nationality, attribute icons and randomize are not built yet.
- Names accept letters, spaces, apostrophes and hyphens, 12 characters; there is no offensive-name filter. Gamepad cannot type a name.
- Stored players cannot be deleted in V1, and the limit of 8 is a proposed value.
- A determined player can still confirm several players and keep the best. Only a rule on which created player may enter a career can close that; it belongs to the career design.
- The bundle grew by about 300 kB for the wider registry.
- The title screen and menu are still in the 480x320 profile.
- PS18 Hybrid Goalie is proposed, not implemented.

## 0.3.2 - 2026-11-25 - Play style in the DNA engine; NHL statistics audit

Nothing visible in the game changed. 132 tests.

### Added
- **Play Style in player generation (Decision 48):** a chosen style takes 25% of the starting attribute spread, proportionally from the influences, inside the same budget. Natural ceilings are set from the influences alone and never move. A 20% faster-development setting is stored for progression. Both are settings in `DNA_CONFIG`.
- **Play style registry** (`src/dynasty/playStyles.ts`): the 17 proposed styles and their leanings as provisional data.
- **Player DNA version 2:** records the play style. Version 1 records are read as having none, with a tested migration; a player with no style generates exactly as before.
- **NHL statistics audit** (`npm run data:audit`): matches the delivered career statistics against the biographical file without ever merging on a name alone, and writes review files to `data/derived/`. Results in `INFLUENCE_ENGINE.md`.
- **Documents:** `CARD_ART_SPEC.md` (batch 16.10 card art), `REGISTRIES.md` section 3 rewritten for review, Decisions 47 to 52 and P28.

### Known issues
- The creator screen does not offer a play style yet (Creator V1, Play Style tab).
- Generated influence profiles are not active, by ruling. The dataset supports one tendency for skaters and none for goalies; see the recommendation in `INFLUENCE_ENGINE.md` section 8.
- The dataset's licence is unknown. Raw files are for internal development only.
- 479 statistics records are unmerged pending a person's decision.
- Creator V1 (960x540 off-ice profile, interface kit, appearance) has not been started.

## 0.3.1 - 2026-11-25 - Locker room art (fit test)

Ten more packages (batches 15.01 to 15.10) ingested: 16,577 assets from 80 packages, 0 errors. Nothing in play changed.

### Added (developer only)
- **Locker room fit test**, opened from the Arena Asset Lab or with `#locker-room`: one room assembled from the supplied floor, walls, doorway, lockers, benches, gear, whiteboard and trophy cabinet, with ten people in it.
- Five moods that play every supplied animation: getting dressed, beers, after a win, after a loss, team talk (coach and captain). Blue and red colour sets. A labelled sample-trophy toggle to check the cabinet slots.
- Ingest: a `locker` category for batch 15.

### Known issues
- It is a fit test, not a place in the game: nothing reads or changes game state, and the lifestyle locations are not authorized.
- No south-east wall corner was supplied; the south-west corner is mirrored.
- The design has captains and managers but no coach. `ARENA.md` A28.
- Players are baked blue or red and do not reflect a created player's appearance. Green and neutral lockers have no matching players or benches.
- The trophy cabinet is empty by design: it will be filled from career history only.

## 0.3.0 - 2026-11-25 - Track B begins: menu, Hockey Influences, Player DNA, creator foundation

First career-side release, authorized by Decision 34. Track A (the hockey match) is still gated on the skating checkpoint; nothing on the ice changed except the nets (below).

### Added
- **Main menu:** Pick-Up, League Dynasty, Create, Leaderboard, Options. Pick-Up opens the skating prototype; Create opens the player creator; League Dynasty and Leaderboard say they are not built. Options holds the credits until there are settings.
- **Hockey Influences registry:** 64 curated professionals (40 forwards, 14 defencemen, 10 goalies) with hand-written style profiles in `data/influences/curated.tsv`. Position, birth year, country, shooting side, height and weight come from the supplied reference file at build time. Ids are neutral ("F07"); every display name can be replaced by a fictional alias.
- **Player attributes:** the 21 skater attributes from the brief and a proposed goalie set of 17; current ability, potential, temporary modifiers and permanent changes are separate.
- **Player DNA:** one seed, a position, a hockey background, one primary and up to two secondary influences produce starting ratings, natural potential, strengths, weaknesses and tendencies. Background sets level and experience; influences move ability around without adding any. The same choices and seed always give the same player. DNA serializes with a version number.
- **Create a Player (foundation):** choose position, background and influences, re-roll, and see every attribute as now-against-potential. Keyboard and gamepad.
- 18 new automated tests (124 in all): registry soundness, determinism, range and balance checks over thousands of generated players, save round trip, module boundaries.

### Changed
- **Goals (Decision 34):** the gameplay net keeps its size and the goal art is being redrawn to fit it (`ART_BRIEF.md` section 10). The standard arena shows stand-in nets again, at the size the puck hits; the batch 11 goals and their goal states are in the new "Goal art fit test" arena only. The net ripple on a goal is therefore off in play until redrawn art arrives; the goal lamp and crowd celebration still fire.
- **Stands (Decision 34):** three seating tiers a side is the approved look; no longer reported as a fit problem.

### Known issues
- The creator is a foundation: no name, appearance, gear, nationality or jersey number, and nothing is saved. The player you make lasts until the page closes.
- With 54 skater influences, choosing one by stepping left and right is slow. A proper picker comes with the full creator.
- Every balancing number (background levels, influence strength, talent spread) is a proposal awaiting your review.
- Four of the ten hockey backgrounds cannot apply to an 18-year-old and are not offered in the creator (`EXPANSION_PLAN.md` Q24).
- No fictional aliases are written yet: real names cannot be switched off until all 64 exist.

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
