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

## Hockey Influences data

`data/influences/curated.tsv` holds the 64 hand-written influence profiles; `data/reference/nhl_players.csv` is the supplied reference file they take their facts from. Neither is art, and the reference file is never shipped. Still needed: 64 fictional aliases, and a card or icon per influence if the creator is to show one.

## Arena and locker room art (batches 09 to 15)

**Status of all of it: base graphics (Decision 35, Nov 25).** The creative director will raise the fidelity from batch 16 forward and re-issue batches 09 to 15. Open fit issues to fold into the re-issue: goals at gameplay size (`ART_BRIEF.md` section 10), corner boards at the rink's corner radius (`ARENA.md` A8), a south-east locker room wall corner (A29), and anything else listed as unfit or missing in the registry.

**All of this is base art (Decision 35).** The creative director will re-supply the same assets at higher fidelity. Keeping file names, pixel sizes and anchors the same makes the swap a re-ingest with no code change.

Modular rink tiles arrive as `BLH_Batch_*.zip` packages in `art/packages/` and are ingested into `public/assets/arena/`. The full inventory, validation notes and missing slots live in the generated registry (`public/assets/arena/manifests/registry.json`) and are browsable in the Arena Asset Lab. See `ARENA.md`.

As of v0.3.1: 16,577 assets from 80 packages, 0 errors; batch 15 (locker room) adds 7 slots, all supplied and used in the fit test only. As of v0.2.5: 12,436 assets from 70 packages, 0 errors; 42 slots supplied (batch 14 as Lab tests or registered only), 2 unfit (corner boards; resurfacer garage), 1 missing (curved corner glass). Earlier count, v0.2.4: 9,610 assets from 62 packages; 35 slots supplied, 9 provisional (goals larger than the gameplay net; bench area placement and colours; side seating that only partly fits the world; crowd; goal lamps), 1 unfit (corner boards: wrong radius for the rink), 2 missing (curved corner glass, arena equipment). Still wanted and not in any batch: seating for the ends and corners.

## Art batch 01 (received Nov 25): review

21 unique files in `art/source/generated-batch-01/` (11 duplicate uploads were dropped). None of the files is on a true pixel grid: they are high-resolution images with soft edges, so each needs the downscale-and-clean pass that the skater got.

| Asset | Verdict | Notes |
| --- | --- | --- |
| Skater sheet, 10 poses x 5 directions (`Retro_Hockey_Player_Sprite_Sheet`) | **In the game (v0.1.2)** | Baked shadows and stop spray; pass frames have a baked puck; north row and check have no stick; south and north stride frames barely move; red sleeve stripes sit inside the white jersey zone, which makes recoloring harder |
| Skater sheet with labels (`Pixel_Hockey_Player_Sprite_Sheet`) | Reference only | Same art with a grid and text baked in |
| Skater sheet with a sixth row (`Retro_Hockey_Player_Animation_Sprite_Sheet`) | Usable later | Adds hit, down, dazed and helped-up frames |
| Skater extras, 6 frames | Usable later | Two celebrations, gassed, down, ready, faceoff |
| Goalie, 10 poses x 2 directions (`Blue_and_Red_Hockey_Goalie_Sprite_Sheet`) | **In the game (v0.10.0)** | `public/assets/goalie_base.png`, 10 x 2 cells of 48 px, by `scripts/art/process_goalie.py` (the skater's pass; scaled so a standing goalie is the skater's height). Shown at two-thirds like the skater. To be redrawn at the 32 px scale |
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

## Artwork storage and production manifest (Decision 75)

**Where things live.**

| Category | Where | In the repository |
| --- | --- | --- |
| Original artwork | Art team; a copy in external art storage `original_artwork/` | No |
| Master asset packages (full delivery zips) | External art storage `master_packages/` | No. Batch 19 was moved out in v0.6.0. Batches 09 to 16 are still under `art/packages/` and `art/character_packages/` from before the ruling, because the ingest scripts read them there |
| Production-ready assets | `public/assets/` | Yes: only what the game loads |
| Reference mockups | External art storage `reference_mockups/` | No |
| Deprecated artwork | External art storage `deprecated/` | No |

**Production assets added by the creator work.**

| Production file | Size | Source | Version | Used for |
| --- | --- | --- | --- | --- |
| `public/assets/goals/32/goal_north.png`, `goal_south.png`, `goal_*_ripple_01` to `_04.png` | 40x32 each | Package `BLH_goals_40x32.zip` (received Nov 26), unchanged. `peg_marks.png` (40x8) delivered, not used | 1 | Goals and net ripple on the ice. Base art, not final (Decision 82) |
| `public/assets/referee/32/referee_{front,back}_*.png` (18 frames) | 32x32 each | Package `BLH_referee_32bit.zip` (received Nov 26), unchanged. The 288x64 sheet in the package is not used | 1 | The referee on the ice. Base art (Decision 88) |
| `public/assets/ui/broadcast/goal_splash.png`, `tag_power_play.png`, `tag_faceoff.png` | 150x78, 84x25, 84x22 | Art batch 01 `Retro_Hockey_HUD_Sprite_Sheet`, reduced by `scripts/art/process_broadcast.py` | 1 | Goal, power play and faceoff graphics on the ice. **Stopgap** until the re-issue at game sizes (Decisions 86, 89) |
| `site/assets/art_puckfalls.webp`, `map_puckfalls.webp` | 960x540, 1670x941 | `Puck_Falls_Winter_Sunset_Townscape.png` (supplied Nov 26), converted to WebP for the website | 1 | Welcome to Puck Falls card and its full-size view. Website only |
| `public/assets/character/face32.png` | 192x128 (24 faces of 32x32) | `public/assets/character/face.png` (batch 16.02 preset faces, 64x64), halved by `scripts/art/process_faces32.py` | 1 | Portraits on the goal and penalty cards (Decision 91) |
| `public/assets/ui/16_11/ui_atlas.png` | 256x160 | Batch 16.11 `ui_atlas.png`, unchanged | 1 | Panels, buttons, card frames |
| `public/assets/cards/16_10/card_art.png` | 1152x480 | Batch 16.10 Large `_art` crops (38 at 144x96), packed unchanged | 1 | Play style and archetype card pictures, silhouettes |
| `public/assets/character/face.png`, `bald.png` | 384x256, 512x256 | Batches 16.02 Revised, 16.02B atlases, unchanged | 1 | Preset portraits (64x64) |
| `public/assets/character/model.png` | 384x192 | Batch 16.01 Final atlas, unchanged | 1 | Body preview (64x96) |
| `public/assets/character/flag.png` | 512x512 | Batch 16.08 atlas, unchanged | 1 | Flags (32x32) |
| `public/assets/character/hair.png`, `beard.png`, `body.png`, `equipment.png` | 640x576, 448x320, 384x192, 512x448 | Batches 16.03, 16.04, 16.06, 16.07 atlases, unchanged | 1 | Reference thumbnails in pickers. **Reference art, to be replaced by the layer package.** The equipment atlas still contains the excluded branded helmets and gloves as pixels, though the game never shows them: it should be re-cut without them |

Not deployed: any zip, any full-resolution reference sheet, anything under `art/`.

## Stopgap crowd (Decision 100, v0.19.0)

| Source | Production file | Size | Notes |
| --- | --- | --- | --- |
| Nov 28 fans sheet (image generator, `BLH_fans_sheet_nov28.jpg`, 2400x1792 JPEG, kept outside the repository) | `public/assets/crowd/fans_16x24.png` (8x8 cells of 16x24) | 128x192 | v0.19.0. **Stopgap:** 64 fans reduced from about 26x46 by `scripts/art/process_fans.py` (Decision 100). The sheet's stand pieces are not used |
