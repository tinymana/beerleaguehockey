# Asset manifest

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization: **Milestone 0 and the skating prototype only.**

Three pieces of approved art exist today; everything else is either a code-drawn temporary stand-in or not started, and no final art is produced without your approval. Counts are proposals.

| Asset group | Contents | Needed by | Status |
| --- | --- | --- | --- |
| Title screen (locker room) | 1536x1024 key art | Milestone 0 | Supplied, in use |
| Sunset rink splash | 1536x1024 key art | Loading and season start | Supplied |
| Crest logo | Transparent logo | Menus, favicon | Supplied |
| Menu and UI type | Pixel font, menu frames, cursor | Milestone 0 | Temporary code-drawn font; final type needs approval |
| Rink | Ice, lines, boards, nets, benches | Skating prototype | Temporary style test for your review |
| Skater sprite | 8 directions, skate cycle, shoot | Skating prototype | Temporary style test for your review |
| Goalie, referee, crowd, scorebug | Sprites and broadcast overlays | Milestones 1 to 3 | Not started |
| Character layers | About 4 body types, 8 skin tones, 12 face presets, 5 eye colors, 16 hair styles with thinning stages, 8 hair colors plus gray, 10 facial hair styles, 4 helmets, visor and cage, gear trims | Milestone 5 | Not started; presets need approval |
| Character output sizes | 64x64 portrait, 24x24 chat avatar, on-ice sprite | Milestone 5 | Sizes proposed |
| Franchise crests | 40 league teams plus tournament-only teams, three sizes each | Milestone 4 onward | Blocked on your approved roster |
| Uniforms | Home and away per franchise, built from shared stripe templates and three colors | Milestone 4 onward | Blocked on your approved roster |
| Puck Falls locations | The Ice Barn, Locker Room, The Penalty Box, Top Shelf Hockey, The Five Hole, Player Home | Milestone 7 | Not started |
| Group chat, newspaper, trophy and banner art | UI frames, mastheads, trophies, rings, banners | Milestones 5 to 8 | Not started |
| Tournament identities | Logos and trophies per event | Tournament milestone | Not started |
| Audio | Skate, puck, boards, horn, crowd, music | Milestone 1 onward | Not started |

## Files in the repository

| File | What it is | Status |
| --- | --- | --- |
| `art/source/title-locker-room.png` | Supplied title key art, 1536x1024 | Supplied by creative director |
| `art/source/splash-sunset-rink.png` | Supplied sunset rink splash, 1536x1024 | Supplied by creative director |
| `art/source/crest-logo.png` | Supplied crest logo, transparent | Supplied by creative director |
| `public/assets/title-locker-room.png` | Copy of the title art served to the game | In use on the title screen |
| `public/favicon.png` | 64x64 reduction of the crest | Derived from supplied art |
| `site/assets/*` | Web-sized copies and crops of the supplied art, plus real prototype screenshots | Derived; for the website |
| `site/fonts/*` | Tiny5 and Jersey 15 web fonts (SIL Open Font License), carried over from the Ryan's Road site | Third-party, open license |

## Arena art (batches 09 and 10)

Modular rink tiles arrive as `BLH_Batch_*.zip` packages in `art/packages/` and are ingested into `public/assets/arena/`. The full inventory, validation notes and missing slots live in the generated registry (`public/assets/arena/manifests/registry.json`) and are browsable in the Arena Asset Lab. See `ARENA.md`.

As of v0.2.0: 201 assets from 14 packages, 0 errors; 14 slots supplied, 12 missing (east, end and corner boards, glass, nets, benches, penalty boxes, stadium, spectators, equipment).

## Art batch 01 (received Nov 25): review

21 unique files in `art/source/generated-batch-01/` (11 duplicate uploads were dropped). None of the files is on a true pixel grid: they are high-resolution images with soft edges, so each needs the downscale-and-clean pass that the skater got.

| Asset | Verdict | Notes |
| --- | --- | --- |
| Skater sheet, 10 poses x 5 directions (`Retro_Hockey_Player_Sprite_Sheet`) | **In the game (v0.1.2)** | Baked shadows and stop spray; pass frames have a baked puck; north row and check have no stick; south and north stride frames barely move; red sleeve stripes sit inside the white jersey zone, which makes recoloring harder |
| Skater sheet with labels (`Pixel_Hockey_Player_Sprite_Sheet`) | Reference only | Same art with a grid and text baked in |
| Skater sheet with a sixth row (`Retro_Hockey_Player_Animation_Sprite_Sheet`) | Usable later | Adds hit, down, dazed and helped-up frames |
| Skater extras, 6 frames | Usable later | Two celebrations, gassed, down, ready, faceoff |
| Goalie, 10 poses x 2 directions (`Blue_and_Red_Hockey_Goalie_Sprite_Sheet`) | Usable for Milestone 1 | Good match to the brief |
| Goalie with injury row (`Retro_Hockey_Goalie_Sprite_Sheet_1`) | Usable later | Same plus hurt frames |
| Goalie, 18 poses (`Retro_Hockey_Goalie_Sprite_Sheet`) and labeled version | Reference only | South-facing only; labels baked in |
| Referee (`Retro_Hockey_Referee_Sprite_Sheet`) | Usable for Milestone 2 | Side and front views only: no back (north) row. Includes hit, down and dazed frames for the knock-out mechanic |
| Referee, earlier version on white | Superseded | |
| On-ice effects | Usable after cleanup | Soft edges. No controlled-player marker |
| Broadcast overlays, blank (`Retro_Arcade_Hockey_Broadcast_Overlays`) and filled sample | Usable for Milestone 3 | Lower third has a face baked in |
| Broadcast pack 07, blank template and filled sample | Usable for Milestone 3 | Sample player and team names are placeholders, not approved names |
| Typography, two sheets | Mostly usable | Headline font, scoreboard digits, LED digits and call-outs are good. The 8x8 UI font is an outline style that will not survive at 8x8 |
| Branding 08 | Partly usable | Numbers, C and A patches and icons are good. Crests, badges and trophy need decisions: see `DECISIONS.md` P10 to P12 |
| Rink: centre piece, full arena, end zone with crowd | **Not usable as the playing surface** | Drawn in converging perspective; the game uses a parallel projection so the puck moves truthfully. Proportions do not match the templates; nets and boards are baked in; two files have a fake transparency checkerboard painted into the image. The end-zone picture is a fine style target and could serve intro or replay screens |

### Still needed

1. ~~Rink painted over the three templates.~~ Superseded: the rink now arrives as modular tile batches 09 to 14 (see above).
2. **Nets** as two separate sprites, **puck**, and a flat **shadow**.
3. **Controlled-player marker**, **shot-power and fatigue meters**, a **menu panel frame** and **menu cursor**.
4. **Referee back view** (north row).
5. **Skater fixes:** north row and check holding a stick; pass frames without the puck; a version without baked shadows; sleeve stripes kept out of the jersey-body zone.
6. **A solid small UI font**, or keep the code-drawn one.
7. **League crests for Tin and Puck**, and an original trophy.

## Art request

`ART_BRIEF.md` is the brief to hand to an image model: rules, palette, camera, exact canvas sizes, prompts and file names. `art/templates/` holds the layout templates it refers to.

## Code-drawn temporary assets

These are generated at boot by code and are **not** final art. Each is labeled temporary in the source.

| Asset | Source file | Replace with |
| --- | --- | --- |
| 5x7 pixel font | `src/app/pixelFont.ts` | Approved retro sports typography |
| End and corner boards, stands, nets (stand-ins) | `src/match/view/textures.ts` | Arena batches 10, 11 and 13 |
| Puck and shadow | `src/match/view/textures.ts` | Approved sprites |
