# Beer League Hockey - Art Brief for Image Generation

Tiny Mana Studios. Hand this whole file to the image model (GPT) at the start of an art session, then ask for one asset at a time using the prompts in section 6.

**Status:** this is a request list, not approved art. Sizes are provisional until the creative director rules on resolution and skater size (`DECISIONS.md` P1 and P2). Every delivered image is reviewed and approved by the creative director before it goes in the game.

---

## 1. What the game is

A browser hockey game with late-1990s 32-bit pixel art (Sega Saturn / PlayStation-era 2D) and the on-ice readability of 16-bit console hockey. Adult rec-league hockey: beer leaguers, snowy nights, warm locker rooms, neon sports bars. Funny, never mean, never explicit.

The existing title art sets the look: red, white and royal blue; chunky outlines; rich but clean pixel clusters.

## 2. Hard rules for every image

1. **Pixel art on a strict grid.** No anti-aliasing, no blur, no soft gradients, no glow, no drop shadows painted into sprites. Shading is done with flat color steps.
2. **One pixel size per image.** Every "art pixel" is a perfect square block of the stated scale (for example 4x4 screen pixels). No mixed resolutions.
3. **Dark outline** (`#141A3A`) around every character and object that sits on the ice, so it reads against white.
4. **Limited palette.** Use the palette in section 3. At most 16 colors per sprite sheet.
5. **Background:** transparent PNG. If transparency is not possible, a flat `#00FF00` background with nothing else that color.
6. **No text baked in** unless the asset is lettering. No watermarks, no signatures.
7. **Original and fictional only.** No real team logos, league marks, brand names, beer brands, sponsor logos or real people's likenesses.
8. **Consistency beats detail.** Across a sprite sheet, the character must keep the same size, proportions, colors and outline weight in every frame. Feet stay on the same baseline; the body stays centered in its cell.
9. **Exact canvas size** as stated per asset. Do not add margins or a frame.

## 3. Palette

| Role | Hex |
| --- | --- |
| Outline / darkest | `#141A3A` |
| Night navy | `#0B1030` |
| Royal blue | `#2B5FD9` |
| Deep blue (pants, shade) | `#2038A8` |
| Light blue highlight | `#7FA0FF` |
| Ice white | `#EAF2FB` |
| Ice shade | `#D7E5F6` |
| Jersey white | `#F4F6FB` |
| Jersey shade | `#CFD7EA` |
| Red | `#D8263C` |
| Dark red (shade) | `#9C1626` |
| Gold / lager | `#FFC83A` |
| Board yellow (kick plate) | `#F2C230` |
| Stick tan | `#C9944A` |
| Skin tones (pick one per character) | `#F2C9A0`, `#D9A070`, `#A8703E`, `#6E4526` |
| Neon pink (bar signs only) | `#FF5FB8` |
| Black tape / puck | `#14141C` |

**Team recoloring matters.** The game will recolor one set of sprites for 40 teams. So on player sprites, keep three zones strictly separate and flat:

- **Primary** (jersey body): `#F4F6FB` with shade `#CFD7EA`
- **Secondary** (shoulders/sleeves stripe, helmet, gloves, pants): `#2B5FD9` with shade `#2038A8`
- **Trim** (hem stripe, sock stripe, number): `#D8263C` with shade `#9C1626`

Do not blend these zones into each other or into skin, stick or skate colors.

## 4. Camera and scale

- **Gameplay grid:** 480 x 320 pixels, 3:2. The rink is vertical: goals at the top and bottom of the screen, play scrolls up and down.
- **Scale:** 4 art pixels = 1 foot of ice. The ice sheet is 340 wide x 800 tall inside a 480 x 880 world.
- **Camera:** high three-quarter overhead, like 16-bit console hockey. We look down on the players from above and slightly behind: we see the top of the helmet, shoulders and a foreshortened body, legs and skates. Not a flat side view, and not a pure top-down dot.
- **Directions:** "N" means skating up the screen, "S" down the screen. Draw five directions (S, SE, E, NE, N); the game mirrors them for SW, W and NW.
- **Skater size:** about 22 to 26 art pixels tall standing, inside a 32 x 32 cell.

## 5. Templates supplied with this brief

Upload these with the request so the model paints to the right layout. They are in `art/templates/` in the repository.

| File | Use |
| --- | --- |
| `rink-endzone-template-3x-1440x1020.png` | Exact layout of one end of the rink (boards, corner curve, goal line, net, crease, faceoff circles) at 3x |
| `rink-neutral-template-3x-1440x600.png` | Exact layout of centre ice (blue lines, red line, centre circle) at 3x |
| `rink-template-480x880.png` | Whole rink at native size, for reference |
| `skater-sheet-grid-4x-1280x640.png` | Labeled 10 x 5 grid for the skater sheet at 4x |
| `goalie-sheet-grid-4x-1440x288.png` | Labeled 10 x 2 grid for the goalie sheet at 4x |
| `skater-temp-reference-8x.png` | The current temporary skater, only to show facing and stick side. Do not copy its style |

---

## 6. Asset list

### Priority 1: needed to make the on-ice game feel right (Milestones 1 and 2)

#### 1.1 Skater sprite sheet (most important asset)

- **Canvas:** 1280 x 640. Grid of 10 columns x 5 rows. Each cell is 128 x 128 = a 32 x 32 sprite at 4x.
- **Rows (direction):** S, SE, E, NE, N.
- **Columns (pose):** skate 1, skate 2, skate 3, skate 4 (a full stride loop), glide (both feet down, coasting), brake (hockey stop, skates sideways), shot wind-up (stick drawn back), shot follow-through, pass (short push), body check (shoulder lowered).
- **Character:** adult rec player, helmet, gloves, right-handed stick held low on the ice in front. Colors per section 3 zones.
- **Must hold:** same body size and baseline in all 50 cells. Stick blade stays on the ice and clearly visible.

Prompt:

> Pixel art sprite sheet for a 16-bit style hockey game, strict pixel grid, each art pixel is exactly 4x4 screen pixels, canvas exactly 1280x640, transparent background. 10 columns by 5 rows of 128x128 cells following the attached grid template. One adult recreational hockey player seen from a high three-quarter overhead camera. Rows are facing directions: south, south-east, east, north-east, north. Columns are poses: four-frame skating stride, glide, hockey stop, shot wind-up, shot follow-through, pass, body check. White jersey (#F4F6FB), royal blue helmet, gloves, shoulder stripe and pants (#2B5FD9, #2038A8), red hem and sock trim (#D8263C), tan stick, dark navy outline (#141A3A). Flat color steps only, no anti-aliasing, no gradients, no shadows, no text. Identical character size, proportions and palette in every cell, centered, feet on the same baseline.

#### 1.2 Skater extras sheet

- **Canvas:** 768 x 128. 6 cells of 128 x 128 (32 x 32 at 4x). Direction-independent poses.
- **Cells:** knocked down 1 (falling), knocked down 2 (flat on ice), getting up, goal celebration 1 (arms up), goal celebration 2 (fist pump), gassed (bent over, stick across knees).

#### 1.3 Goalie sprite sheet

- **Canvas:** 1440 x 288. 10 columns x 2 rows of 144 x 144 cells = 36 x 36 sprites at 4x.
- **Rows:** facing south (defending the top net), facing north (defending the bottom net).
- **Columns:** ready stance, shuffle left, shuffle right, butterfly, glove save, blocker save, kick save left, kick save right, poke check, down on the ice.
- Bulky pads, blocker, trapper, cage mask. Same three color zones as the skater.

#### 1.4 Rink, in three pieces

The game assembles the rink from an end-zone image (used twice, flipped) and a centre-ice image. **Paint over the attached templates and keep every line, circle, net and board edge exactly where the template has it.**

- **End zone:** 1440 x 1020 (480 x 340 at 3x). Ice, rounded corner boards with yellow kick plate, glass, goal line, crease, two faceoff circles, and the area outside the boards: a few rows of mostly empty stands, a scorer's bench, beer-league touches (a cooler, a few bundled-up spectators). Leave the net out; it is a separate sprite.
- **Centre ice:** 1440 x 600 (480 x 200 at 3x). Blue lines, red line, centre circle, player benches on one side and penalty boxes on the other, outside the boards. Leave the centre circle interior clean for a team logo.
- **Ice surface:** nearly flat `#EAF2FB` with light scuffs and skate marks in `#D7E5F6`. It must stay the brightest, calmest thing on screen so players read clearly.
- **Outside the boards:** dark and low-contrast (navy range), so it never competes with the ice.

Prompt (end zone; attach the template):

> Pixel art top-down hockey rink end zone for a 16-bit style game, strict pixel grid, each art pixel exactly 3x3 screen pixels, canvas exactly 1440x1020. Paint over the attached template and keep the boards, rounded corners, goal line, crease and faceoff circles in exactly the same positions. Clean pale ice (#EAF2FB) with subtle scuffs, white boards with a yellow kick plate and blue cap, glass, red lines. Outside the boards: a dim small-town community arena at night, a few rows of mostly empty stands, a scorer's table, a cooler, two or three bundled-up spectators, all in dark navy tones so the ice stays the brightest area. No net, no players, no text, no logos, no anti-aliasing, no gradients.

#### 1.5 Net, puck and shadows

- **Net:** 2 images, each 288 x 192 (24 x 16 at 12x). One for the top goal (mouth facing down the screen), one for the bottom goal (mouth facing up). Red posts and crossbar, white mesh, seen from the same overhead camera.
- **Puck:** 96 x 80 (6 x 5 at 16x). Black disc with one highlight step.
- **Shadow:** one flat, hard-edged ellipse, 256 x 128 (16 x 8 at 16x), single color `#1B2A5A`. No soft edge; the game sets its transparency.

#### 1.6 On-ice effects

One sheet, 1024 x 256, 8 cells of 128 x 128 (32 x 32 at 4x) per row, 2 rows:

- Row 1: ice spray from a hockey stop, 4 frames; skate-mark dash, 1 frame; puck speed streak, 3 frames.
- Row 2: body-check impact star, 3 frames; board-hit dust puff, 3 frames; controlled-player marker (a ring or arrow that sits under the active skater), 2 frames in gold `#FFC83A`.

#### 1.7 HUD and scorebug kit

Flat, hard-edged, retro sports broadcast style. No rounded web-app cards, no glass effects.

- **Scorebug:** 960 x 96 (480 x 48 at 2x). Slots for two team abbreviations (3 letters), two scores, period, clock. Leave slots empty; the game draws the text.
- **Panel frame (9-slice):** 192 x 192 (48 x 48 at 4x). A menu/dialogue box frame with square corners, navy fill, ice-blue and royal-blue border lines. Corners 16 art pixels.
- **Menu cursor:** 64 x 64 (16 x 16 at 4x), a puck or stick blade pointing right.
- **Meters:** 256 x 32 (64 x 8 at 4x) empty bar and matching fill, for shot power and fatigue.
- **Penalty and power-play tags:** 256 x 64 each (64 x 16 at 4x), blank plates in red and gold.

#### 1.8 Pixel fonts (two sheets)

- **Small UI font:** 5 x 7 pixel glyphs in a 6 x 9 cell. Characters in this order, 16 per row: space, A-Z, 0-9, then `. , : ! ? ' - / + % ( ) > < $ = # _`. Canvas 384 x 144 (4 rows; 96 x 36 at 4x). White on transparent.
- **Headline font:** bold italic retro sports lettering in the spirit of the game logo, 16 x 16 cell, A-Z, 0-9 and `! ? . -`. Canvas 1024 x 192 at 4x (16 columns x 3 rows of 64 x 64). White with a one-pixel dark outline.

Fonts are hard for image models. If the result is uneven, send it anyway; it can be cleaned up by hand, or we keep the code-drawn font.

### Priority 2: broadcast presentation (Milestone 3)

- **"GOAL!" splash lettering:** 960 x 320 (240 x 80 at 4x), bold italic, red and gold with dark outline, transparent.
- **Three stars card, period summary card, final score card:** 960 x 640 each (480 x 320 at 2x), empty framed layouts with clear blank areas for names and numbers.
- **Face-off and penalty banners:** 960 x 96 each, blank.
- **Referee and linesman sheet:** same layout as the skater sheet rows S, E, N only (10 x 3 cells), black-and-white stripes, no stick; poses: skate x4, glide, stop, arm up (penalty), point, drop puck, whistle.
- **Two placeholder team crests** for exhibition play, 256 x 256 (64 x 64 at 4x). Names are not approved yet, so make them wordless: for example a moose head and a frothy mug, professional sports-crest style.

### Priority 3: do not make yet

These need creative decisions first (`DECISIONS.md`). Listed only so the art session knows what is coming: character portrait layers for create-a-player, 40 franchise crests and uniforms, Puck Falls locations (The Ice Barn, Locker Room, The Penalty Box, Top Shelf Hockey, The Five Hole, Player Home), group chat and newspaper UI, trophies, banners and rings, tournament logos.

---

## 7. How to deliver

- PNG, exact canvas size, one asset per file.
- File names: `skater_base_4x.png`, `skater_extras_4x.png`, `goalie_base_4x.png`, `rink_endzone_3x.png`, `rink_centre_3x.png`, `net_top_12x.png`, `net_bottom_12x.png`, `puck_16x.png`, `shadow_16x.png`, `fx_ice_4x.png`, `hud_scorebug_2x.png`, `ui_panel_4x.png`, `ui_cursor_4x.png`, `ui_meter_4x.png`, `font_small_4x.png`, `font_headline_4x.png`.
- Send them in any order. Section 1.1 (skater) and 1.4 (rink) change the game the most.

## 8. What to expect

Image models drift between frames and rarely land on a perfect pixel grid. That is workable: each sheet gets snapped to the grid, re-palettized to section 3 and aligned in code before it goes in the game, and anything that cannot be rescued is sent back with a specific note. The two things that cannot be fixed afterwards are a character that changes size or design between cells, and painterly, blurred or gradient-shaded output. If a result has either, regenerate rather than deliver.
