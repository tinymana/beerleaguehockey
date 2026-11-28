# Beer League Hockey - Art Brief for Image Generation

Tiny Mana Studios. Hand this whole file to the image model (GPT) at the start of an art session, then ask for one asset at a time using the prompts in section 6.

**Status:** this is a request list, not approved art. Sizes match game version 0.1.1 and are provisional until the creative director rules on resolution, skater size and camera tilt (`DECISIONS.md` P1, P2, P9). **Do not commission the rink until the tilt is settled**; sprites are safe to start. Every delivered image is reviewed and approved by the creative director before it goes in the game.

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
- **Camera:** angled overhead (three-quarter, oblique) view in the style of 16-bit console hockey. The camera sits high behind the bottom goal looking up the ice.
  - The ice is foreshortened: circles are drawn as wide ellipses. Up-and-down distances are 78% of side-to-side distances.
  - Things with height stand up the screen. The far (top) boards show their inside face; the near (bottom) boards show their outside face and cover the ice just behind them; nets are 3D frames.
  - Players are **upright figures**, drawn as you would see a person from a high seat behind the goal: full body, head above shoulders, skates on the ice. Not a top-down dot and not a flat side view.
- **Scale:** 4 art pixels = 1 foot across the rink. The ice is 340 wide; on screen the whole rink image is 480 x 687.
- **Directions:** "N" means skating up the screen (we see the player's back), "S" down the screen (we see the face). Draw five directions (S, SE, E, NE, N); the game mirrors them for SW, W and NW.
- **Skater size:** about 26 to 28 art pixels tall, in a 48 x 48 cell. **The skates must touch the ice at the same point in every cell: 24 pixels from the left, 34 from the top.** The cell leaves room around the body for the stick, which reaches about 13 pixels from the feet along the ice.

## 5. Templates supplied with this brief

Upload these with the request so the model paints to the right layout. They are in `art/templates/` in the repository.

| File | Use |
| --- | --- |
| `rink-top-end-template-3x-1440x798.png` | Exact layout of the far end of the rink at 3x: boards with visible inside face, corner curves, goal line, net, crease, faceoff circles |
| `rink-centre-template-3x-1440x465.png` | Exact layout of centre ice at 3x: blue lines, red line, centre circle |
| `rink-bottom-end-template-3x-1440x798.png` | Exact layout of the near end at 3x. Not a mirror of the far end: the near boards and net are seen from behind |
| `rink-template-480x687.png` | Whole rink at native size, for reference |
| `skater-sheet-grid-3x-1440x720.png` | Labeled 10 x 5 grid for the skater sheet at 3x, with the feet point marked in each cell |
| `goalie-sheet-grid-3x-1440x288.png` | Labeled 10 x 2 grid for the goalie sheet at 3x |
| `skater-temp-reference-4x.png` | The current temporary skater, only to show size, facing and stick. Do not copy its style |

---

## 6. Asset list

### Priority 1: needed to make the on-ice game feel right (Milestones 1 and 2)

#### 1.1 Skater sprite sheet (most important asset)

- **Canvas:** 1440 x 720. Grid of 10 columns x 5 rows. Each cell is 144 x 144 = a 48 x 48 sprite at 3x.
- **Rows (direction):** S, SE, E, NE, N.
- **Columns (pose):** skate 1, skate 2, skate 3, skate 4 (a full stride loop), glide (both feet down, coasting), brake (hockey stop, skates sideways), shot wind-up (stick drawn back), shot follow-through, pass (short push), body check (shoulder lowered).
- **Character:** adult rec player, helmet, gloves, right-handed stick held low on the ice in front. Colors per section 3 zones.
- **Must hold:** same body size in all 50 cells, with the skates on the marked feet point. Stick blade stays on the ice and clearly visible.

Prompt:

> Pixel art sprite sheet for a 16-bit style hockey game, strict pixel grid, each art pixel is exactly 3x3 screen pixels, canvas exactly 1440x720, transparent background. 10 columns by 5 rows of 144x144 cells following the attached grid template. One adult recreational hockey player, an upright full-body figure about 27 art pixels tall, seen from a high angled camera behind him, as in classic 16-bit console hockey, with his skates on the marked point in each cell. Rows are facing directions: south, south-east, east, north-east, north. Columns are poses: four-frame skating stride, glide, hockey stop, shot wind-up, shot follow-through, pass, body check. White jersey (#F4F6FB), royal blue helmet, gloves, shoulder stripe and pants (#2B5FD9, #2038A8), red hem and sock trim (#D8263C), tan stick, dark navy outline (#141A3A). Flat color steps only, no anti-aliasing, no gradients, no shadows, no text. Identical character size, proportions and palette in every cell, centered, feet on the same baseline.

#### 1.2 Skater extras sheet

- **Canvas:** 864 x 144. 6 cells of 144 x 144 (48 x 48 at 3x). Direction-independent poses.
- **Cells:** knocked down 1 (falling), knocked down 2 (flat on ice), getting up, goal celebration 1 (arms up), goal celebration 2 (fist pump), gassed (bent over, stick across knees).

#### 1.3 Goalie sprite sheet

- **Canvas:** 1440 x 288. 10 columns x 2 rows of 144 x 144 cells = 48 x 48 sprites at 3x. Same feet point as the skater.
- **Rows:** facing south (defending the top net), facing north (defending the bottom net).
- **Columns:** ready stance, shuffle left, shuffle right, butterfly, glove save, blocker save, kick save left, kick save right, poke check, down on the ice.
- Bulky pads, blocker, trapper, cage mask. Same three color zones as the skater.

#### 1.4 Rink (superseded: now delivered as modular 8x8 tile batches 09 to 14; see `ARENA.md`)

The text below describes the earlier painted-rink approach and is kept for reference only.

The game stacks three images: far end, centre ice, near end. **Paint over the attached templates and keep every line, ellipse, net position and board edge exactly where the template has it.**

- **Far end:** 1440 x 798 (480 x 266 at 3x). Ice, rounded corner boards showing their inside face with a yellow kick plate, glass above, goal line, crease, two faceoff circles (drawn as ellipses), and beyond the boards a few rows of mostly empty stands with beer-league touches (a cooler, a few bundled-up spectators). Leave the net out; it is a separate sprite.
- **Centre ice:** 1440 x 465 (480 x 155 at 3x). Blue lines, red line, centre circle, player benches on one side and penalty boxes on the other, outside the boards. Leave the centre circle interior clean for a team logo.
- **Near end:** 1440 x 798. Same markings, but the near boards are seen from outside and from above: their outer face and top rail curve across the bottom of the image. Deliver the near boards as a **separate transparent layer** (`rink_near_boards_3x.png`, same canvas) as well, because players skate behind them.
- **Ice surface:** nearly flat `#EAF2FB` with light scuffs and skate marks in `#D7E5F6`. It must stay the brightest, calmest thing on screen so players read clearly.
- **Outside the boards:** dark and low-contrast (navy range), so it never competes with the ice.

Prompt (far end; attach the template):

> Pixel art hockey rink end zone for a 16-bit style game, seen from a high angled overhead camera so circles appear as wide ellipses. Strict pixel grid, each art pixel exactly 3x3 screen pixels, canvas exactly 1440x798. Paint over the attached template and keep the boards, rounded corners, goal line, crease and faceoff circles in exactly the same positions. Clean pale ice (#EAF2FB) with subtle scuffs, white boards whose inside face is visible with a yellow kick plate and blue top rail, glass above, red lines. Beyond the boards: a dim small-town community arena at night, a few rows of mostly empty stands, a cooler, two or three bundled-up spectators, all in dark navy tones so the ice stays the brightest area. No net, no players, no text, no logos, no anti-aliasing, no gradients.

#### 1.5 Net, puck and shadows

- **Net:** 2 images, standing 3D frames seen from the angled camera, both 26 art pixels wide. Far goal (we look into the mouth): 312 x 216 (26 x 18 at 12x). Near goal (we see the back and top netting): 312 x 264 (26 x 22 at 12x). Red posts and crossbar, white mesh with see-through gaps so a puck inside still shows.
- **Puck:** 96 x 64 (6 x 4 at 16x). Black disc seen at an angle, with one highlight step.
- **Shadow:** one flat, hard-edged ellipse, 288 x 128 (18 x 8 at 16x), single color `#1B2A5A`. No soft edge; the game sets its transparency.

#### 1.6 On-ice effects

One sheet, 1024 x 256, 8 cells of 128 x 128 (32 x 32 at 4x) per row, 2 rows, all drawn for the same angled camera:

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
- **Referee and linesman sheet:** same cell size and feet point as the skater sheet, rows S, E, N only (10 x 3 cells, 1440 x 432), black-and-white stripes, no stick; poses: skate x4, glide, stop, arm up (penalty), point, drop puck, whistle.
- **Two placeholder team crests** for exhibition play, 256 x 256 (64 x 64 at 4x). Names are not approved yet, so make them wordless: for example a moose head and a frothy mug, professional sports-crest style.

### Priority 3: do not make yet

These need creative decisions first (`DECISIONS.md`). Listed only so the art session knows what is coming: character portrait layers for create-a-player, 40 franchise crests and uniforms, Puck Falls locations (The Ice Barn, Locker Room, The Penalty Box, Top Shelf Hockey, The Five Hole, Player Home), group chat and newspaper UI, trophies, banners and rings, tournament logos.

---

## 7. How to deliver

- PNG, exact canvas size, one asset per file.
- File names: `skater_base_3x.png`, `skater_extras_3x.png`, `goalie_base_3x.png`, `rink_far_end_3x.png`, `rink_centre_3x.png`, `rink_near_end_3x.png`, `rink_near_boards_3x.png`, `net_top_12x.png`, `net_bottom_12x.png`, `puck_16x.png`, `shadow_16x.png`, `fx_ice_4x.png`, `hud_scorebug_2x.png`, `ui_panel_4x.png`, `ui_cursor_4x.png`, `ui_meter_4x.png`, `font_small_4x.png`, `font_headline_4x.png`.
- Send them in any order. Section 1.1 (skater) changes the game the most and can start now; 1.4 (rink) waits for the tilt decision.

## 8. What to expect

Image models drift between frames and rarely land on a perfect pixel grid. That is workable: each sheet gets snapped to the grid, re-palettized to section 3 and aligned in code before it goes in the game, and anything that cannot be rescued is sent back with a specific note. The two things that cannot be fixed afterwards are a character that changes size or design between cells, and painterly, blurred or gradient-shaded output. If a result has either, regenerate rather than deliver.

---

## 9. Round 2 requests (after reviewing batch 01)

Batch 01 worked: the skater sheet is in the game. These are the gaps and fixes, most important first.

1. **Rink:** now handled by the modular tile batches (09 to 14), not a painted image. For those batches the open art questions are in `ARENA.md`, chiefly: draw the faceoff and centre circles at 120x88 pixels, not 32x32. The rest of this item is the old request, kept for reference: The batch 01 rinks were drawn in converging perspective, like a photo. The game needs a **parallel projection**: the left and right boards are vertical and parallel, never converging, and the rink is much taller than the screen. Paint over the three templates exactly. Deliver real transparency, not a painted checkerboard.
2. **Nets, puck, shadow** as separate sprites (section 1.5).
3. **Controlled-player marker, two meters, menu panel frame, menu cursor** (sections 1.6 and 1.7).
4. **Referee back view:** one more row of the referee sheet, facing north (seen from behind): skate x4, glide, stop, arm up, point.
5. **Skater sheet corrections**, same layout and character:
   - North row and the check pose hold a stick.
   - Pass frames show no puck.
   - No shadows painted under the figure, and no ice spray in the stop frame (both are separate effects).
   - Keep the jersey body plain white; put red only on the hem, socks and number, so teams can be recolored.
   - Make the four skating frames in the south and north rows clearly different: left leg forward, both together, right leg forward, both together.
6. **Small UI font as solid letters** (not outlines), white on transparent.
7. **League crests for Tin League and Puck League** in the same style as Gold, Silver and Bronze. An **original championship trophy** that does not resemble any real trophy.

One rule to restate for every request: hard pixel edges, no blur, no soft shading, and a truly transparent background.

## 10. Goal nets at 24 px (Decision 34, Nov 25): SUPERSEDED by section 11 (48 px, Decision 76)

The batch 11 goals are larger than the net the puck hits. The ruling is to redraw the art; the gameplay net does not change. These are the exact numbers.

**The gameplay net, on screen**

| | Value |
| --- | --- |
| Outside width, post to post | **24 px** (6 ft at 4 px per foot) |
| Depth behind the goal line | **11 px** (3.5 ft of depth, drawn at the camera tilt of 0.74) |
| North goal, on the 480-wide rink | x 228 to 251; goal line at screen y 63; net back at y 52 |
| South goal | x 228 to 251; goal line at screen y 589; net back at y 600 |

**Resting goal sprite: 32 x 24 px, transparent background**

| | North goal (mouth faces down the screen) | South goal (mouth faces up the screen) |
| --- | --- | --- |
| Canvas | 32 x 24 | 32 x 24 |
| Goal mouth anchor (sits on the centre of the goal line) | `[16, 21]` | `[16, 2]` |
| Post anchors (outside edge of each post, on the goal line) | `[4, 21]` and `[27, 21]` | `[4, 2]` and `[27, 2]` |
| Posts | 2 px wide: columns 4-5 and 26-27 | columns 4-5 and 26-27 |
| Opening between the posts | 20 px: columns 6 to 25 | columns 6 to 25 |
| Net and frame | rows 10 to 21 (back bar at row 10) | rows 2 to 13 (back bar at row 13) |
| Free rows for the bottle | rows 0 to 9, above the back bar | rows 14 to 23, below the back bar |
| Nothing but the bottle may fall outside | columns 4 to 27 | columns 4 to 27 |

**Variants, same anchors**

- Empty goal with bottle; net alone; bottle layer alone (as batch 11.01 and 11.02).
- Scored: puck layer inside the net (11.03, 11.04).
- Net ripple: 8 frames of 32 x 24 in one strip, 256 x 24 (11.07, 11.08).
- Bottle knock-off and dislodged goal: 8 frames of 48 x 40 in one strip, 384 x 40, with the 32 x 24 goal at offset `[8, 8]` in every frame (11.05, 11.06, 11.09, 11.10). A dislodged goal should move no more than 8 px in any direction.

Package format as before: named PNGs, the strip as the atlas, `manifest.json` carrying these anchors, a preview image, one ZIP per batch. If the camera tilt changes (decision P13), the 11 px depth changes with it and I will reissue this table.

## 11. Player, goal, crease and ice at the 32 px scale: production specification (Decision 80, Nov 26)

**This supersedes every earlier goal size (24, 40 and 48 px) and the earlier 48 px player.** After seeing the sizes side by side, the creative director chose a **32 px player and a 32 px goal mouth**: the same proportion that was approved at 48, with more ice around the play. Not locked until play-tested. Every number comes from one setting in the game (`GOAL_CONFIG.mouthWidth` in `src/match/sim/rink.ts`), and art is checked against it on delivery.

### 11.1 The player

| | Value |
| --- | --- |
| Frame | **32 x 32 px** per cell (was 48 x 48) |
| Standing height | about 27 px |
| Feet anchor (where the skates touch the ice) | **`[16, 27]`** in every cell |
| Sheet | The same layout as the current skater sheet (10 columns, same rows and poses), every cell 32 x 32 |
| Until it is redrawn | The game shows the 48 px art shrunk to two-thirds. That is temporary and rough |

### 11.2 The goal in the game (what the art must match)

Screen pixels at the 0.74 camera tilt; 1 art pixel is 1 screen pixel.

| | Value |
| --- | --- |
| Goal mouth: clear opening between the posts | **32 px** |
| Posts | **2 px wide** each |
| Outside width, post to post | **36 px** |
| Depth behind the goal line, on screen | **14 px** |
| Crossbar height above the goal line, on screen | **14 px** |
| Back bar height above the ice at the back of the net, on screen | **9 px** |

**Collision boundaries (for information).** Skaters and the puck collide with a box 36 px wide and 14 px deep on screen, from the goal line back. A goal counts when the whole puck crosses the goal line between the posts and under the bar. The posts in the picture must sit exactly on the columns below.

### 11.3 North goal (top of the rink, mouth faces down the screen)

| | Value |
| --- | --- |
| Canvas | **40 x 32 px**, transparent |
| Rendering anchor (centre of the mouth, on the goal line) | **`[20, 30]`** |
| Posts | columns 2-3 and 36-37, from the crossbar (row 16) down to row 30 |
| Goal mouth | columns 4 to 35 (32 px), rows 17 to 30: open, see-through mesh behind it |
| Crossbar | row 16, columns 2 to 37, red |
| Top netting | rows 8 to 15 |
| Back bar | row 7, columns 4 to 35 |
| Free rows | 0 to 6 (water bottle, ripple overshoot), 31 |

### 11.4 South goal (bottom of the rink, mouth faces up the screen toward open ice, seen from behind)

| | Value |
| --- | --- |
| Canvas | **40 x 32 px**, transparent |
| Rendering anchor | **`[20, 16]`** |
| Crossbar | row 2, columns 2 to 37 |
| Posts | columns 2-3 and 36-37, rows 2 to 16 (seen through the mesh) |
| Top netting | rows 3 to 20 |
| Back bar | row 21 |
| Back netting | rows 22 to 29 |
| Back base on the ice | row 30, columns 2 to 37 |
| Free rows | 0 to 1, 31 |

Both goals need a visible crossbar, posts on these columns and see-through mesh (clear pixels in it), so a puck in the net shows. **Pixel templates** at true size, with enlarged guides, are in `art/templates/`: `goal_north_template_40x32.png`, `goal_south_template_40x32.png`. Give the art tool the template and ask it to paint over it without moving a post, bar or edge.

### 11.5 Files

| File | Canvas | Anchor | Notes |
| --- | --- | --- | --- |
| `goal_north.png`, `goal_south.png` | 40x32 | as above | Resting goal, no bottle |
| `goal_north_ripple_01` to `_04`, `goal_south_ripple_01` to `_04` | 40x32 | same | Only the mesh bulges away from the mouth (up to 3 px) and settles. Posts and bars do not move |
| `bottle.png` | 8x8 | `[4, 7]` (centre of the base) | Standing water bottle. Placed on top of the net at `[20, 11]` on the north canvas and `[20, 10]` on the south canvas |
| `bottle_knock_01` to `_06`, `bottle_knock_south_01` to `_06` | 24x24 | `[12, 16]` | Knocked off, tumbling away from the mouth (up the screen for north, down for south), ending on its side |
| `goal_north_dislodged_left`, `_right`, `_off` and the same for `goal_south` | **56x40** | north `[28, 34]`, south `[28, 20]` | Swung about 15 degrees around one post (left, right), or pushed fully off and skewed |
| `peg_marks.png` | 40x8 | `[20, 4]` | The two post holes, at columns 2-3 and 36-37 |

Dislodged nets and the bottle are art for mechanics not designed yet (`BACKLOG.md`).

### 11.6 Goal crease

| | Value |
| --- | --- |
| Shape | Half-oval in front of the mouth, flat side on the goal line |
| Width on the goal line | **44 px** (4 px beyond the outside of each post) |
| Depth in front of the goal line, on screen | **24 px** |
| Canvas | **48 x 32 px**, transparent |
| Anchor | north `[24, 0]` (flat edge on row 0, opens down); south `[24, 31]` (flat edge on row 31, opens up) |
| Look | Light blue fill, 2 px red outline on the curved side only |
| Files | `crease_north.png`, `crease_south.png` |

Until redrawn, the game shows the supplied batch 09 creases at twice their size, which is larger than this.

### 11.7 Ice, markings and crowd

- **Ice colour:** frosty off-white, not saturated blue. Base about `#EEF3F6`, variation no darker than `#DDE6EC`, coolest shadow `#C9D6E0`.
- **Faceoff and centre circles:** redrawn at the size they appear, **120 x 89 px with a thin 2 px line** (the supplied 32 px circles are shown four times larger, which makes every line 4 px thick). At the 32 px player these circles are close to true scale.
- **Crowd:** in proportion to the 32 px player: seated fans about 16 x 24. The temporary spectators stay until the crowd integration milestone.

## 12. Correction request for the art tool: player, goals, ice and crowd at the 32 px scale

Paste the block below as one message, and attach the two goal template PNGs from `art/templates/`.

```text
You are producing corrected game sprites for "Beer League Hockey", a retro hockey game: Tape to Tape style combined with NHL '94 arcade play, in modernized 32-bit era pixel art. Fix scale and technical problems only. Keep the existing characters and palette. Do not redesign anything.

STYLE (all assets)
- Detailed 32-bit era pixel art, bold dark outlines, warm arena lighting, saturated colours for objects. Same look as the game's Batch 18 art.
- True pixel art on a 1:1 pixel grid. No painterly blending, no soft gradients, no anti-aliased edges, no blur, no glow.
- Seen from a high overhead camera tilted toward the top of the screen: vertical distances on the ice are drawn at 74% of horizontal ones. The rink runs top to bottom.
- No text, numbers, logos, brand names, real teams or real people anywhere.

TECHNICAL RULES (all assets)
- PNG with a transparent background. Every pixel is either fully opaque or fully transparent. No semi-transparent pixels.
- Exact canvas sizes below, in pixels. Do not upscale, pad or crop differently.
- No frame, border, drop shadow, label or checkerboard.
- One sprite per file, named exactly as listed. Animation frames are separate files numbered _01, _02...

SCALE REFERENCE
- A skater is drawn inside a 32 x 32 frame and stands about 27 px tall, skates touching the ice at column 16, row 27.
- The goal mouth is exactly 32 px wide between the posts.

A. SKATER
- Redraw the existing skater sprite sheet at 32 x 32 per cell: the same poses, the same order, the same character, each one redrawn cleanly at the smaller size (not a shrunken copy). Skates touch the ice at column 16, row 27 of every cell.

B. GOALS (two template images are attached: paint over them without moving any post, bar or edge)
- goal_north.png, 40 x 32. Goal at the top of the rink, mouth facing down the screen. Red posts 2 px wide at columns 2-3 and 36-37, standing on row 30 (the goal line). Red crossbar on row 16 from column 2 to 37. The mouth (columns 4-35, rows 17-30) is open, with white see-through mesh behind it. Top netting on rows 8-15. Back bar on row 7. Rows 0-6 and 31 empty.
- goal_south.png, 40 x 32. Goal at the bottom of the rink, mouth facing up the screen, seen from behind through white see-through mesh. Crossbar on row 2. Posts at columns 2-3 and 36-37, rows 2-16. Top netting rows 3-20, back bar row 21, back netting rows 22-29, back base on row 30. Rows 0-1 and 31 empty.
- goal_north_ripple_01 to _04.png and goal_south_ripple_01 to _04.png, 40 x 32, same position: only the mesh bulges away from the mouth (up to 3 px), then settles.
- bottle.png, 8 x 8: a plastic water bottle standing upright, base centred at column 4, row 7.
- bottle_knock_01 to _06.png, 24 x 24: the bottle knocked off the net, tumbling up the screen and landing on its side. bottle_knock_south_01 to _06.png: the same, tumbling down the screen.
- goal_north_dislodged_left.png, goal_north_dislodged_right.png, goal_north_dislodged_off.png and the same three for goal_south, each 56 x 40: the goal knocked off its pegs, swung about 15 degrees around one post (left, right), or pushed fully off and skewed (off).
- peg_marks.png, 40 x 8: two small dark post holes at columns 2-3 and 36-37.

C. ICE (frosty off-white, NOT blue)
- ice_base_01 to _04.png, 32 x 32, fully opaque, seamless on all four edges: frosty off-white ice, base colour #EEF3F6, subtle variation no darker than #DDE6EC.
- ice_scratch_01 to _08.png, 32 x 32, transparent: thin skate cuts in #C9D6E0 only.
- circle_centre.png, 120 x 89: blue centre circle drawn with a thin 2 px line, with a small blue centre dot.
- circle_faceoff.png, 120 x 89: red faceoff circle drawn with a thin 2 px line, hash marks and a small red dot.
- crease_north.png and crease_south.png, 48 x 32: light blue half-oval goal crease, 44 px wide on its flat side and 24 px deep, 2 px red outline on the curved side only. North: flat side on row 0. South: flat side on row 31.
- line_red.png 32 x 6 and line_blue.png 32 x 8, fully opaque, tile seamlessly left to right.

D. CROWD (fans in proportion to the 32 px skaters)
- seats_row.png, 32 x 24, tiles seamlessly left to right: one row of two empty arena seats, seen from the same camera.
- fan_a to fan_f, six different everyday adult fans, each 16 x 24, seated, cut off at the seat:
  fan_a_sit_01 to _02, fan_a_cheer_01 to _04, fan_a_stand_01 to _02 (and the same nine frames for fan_b to fan_f).
  Mixed ages, builds and plain clothing in varied colours. No jerseys with markings.

Deliver a zip with one folder per section (skater, goals, ice, crowd) and a manifest.json listing each file name and its pixel size.
```

## 13. Stands and crowd at game size (after the Nov 27 concept sheet)

A concept sheet for better stands was supplied on Nov 27 (image-generator JPEG, 2400x1792, magenta background: A an empty seating module, B sixteen seated fans in sitting, cheering, clapping and back-view poses, C three filled stand mock-ups). It is the style target for the crowd. It cannot go in the game as it is:

- **Size.** One art pixel is about 4 image pixels, so a fan is about 45x70 art pixels. A seat row in the game is 16 px deep and the player on the ice is 32 px: the fans would be more than twice the height of the players. Bringing them down needs a redraw, not a reduction.
- **Format.** JPEG, so edges are smeared and the magenta bleeds into the outlines; the letters A, B, C and the mock-up backgrounds are painted in.
- **Layout.** The fans are not on a grid and each is a single picture, not a set of frames.

**What to ask the art tool for, at game size (PNG, transparent, hard pixels, no anti-aliasing):**

| Piece | Size | Notes |
| --- | --- | --- |
| Seating module, side stands | 16 px a row; module 32 px along the boards, three rows (48 px) deep | Viewed from the ice side as in sheet part A; west and east are mirrors; must tile along the boards |
| Stairs module | Same size as a seating module | Replaces every few modules |
| End and corner seating | 16 px a row, three rows | Not supplied in any batch yet |
| Fan, seated | 16x24 frame, seat anchor at the frame's bottom centre | Poses from sheet part B: sitting (2 frames), cheering arms up (2), clapping (2), back view for the near side (2). At least 12 different fans (coat, hat and hair varied) |
| Empty seat | Part of the seating module | The house is not full |

Team colours on fans wait for the team identities.

**Fan size approved at 16x24 (Decision 99).** A mock-up made from the concept sheet by rough reduction showed the size beside the ice; it is not production art. The creative director approved the size from that mock-up ("looks good", Nov 27): the table above is the request.
