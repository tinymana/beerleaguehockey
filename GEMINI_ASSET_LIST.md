# Beer League Hockey: art needed from Gemini

One list, in the order the game needs it. Sizes are final game pixels. Full detail for any item is in `ART_BRIEF.md` (sections 11 to 13) and `COMPOSITOR_ART_SPEC.md`.

## Paste these rules into every Gemini request

1. Pixel art on a strict grid. Every art pixel is a perfect square block. No anti-aliasing, no blur, no gradients, no glow, no painted shadows.
2. **Generate at exactly 4 times the game size** (one art pixel = a 4x4 block), unless the item says otherwise. The canvas size is given for each item.
3. **Sprites on an even grid of cells.** Every cell the same size, nothing crossing a cell edge, the figure the same size in every cell, feet on the same line.
4. Background: one flat colour, `#FF00FF`, and nothing else in the picture that colour. Save as **PNG, not JPEG**.
5. Dark outline `#141A3A` around every character and object.
6. No letters, labels, numbers, watermarks, logos or real brands in the picture, unless the item is lettering.
7. One item per image. No mock-up scenes, no extra samples around it.

What went wrong before, so Gemini can avoid it: sprites drawn several times too big, JPEG smearing, labels painted in, sprites not on a grid.

## Priority 1: on the ice (needed now)

| # | Asset | Game size | Canvas to generate (4x) | What it shows |
| --- | --- | --- | --- | --- |
| 1 | **Skater sheet** | 32x32 cells, 10 columns x 5 rows | 1280x640 | Rows: facing S, SE, E, NE, N. Columns: skate 1 to 4, glide, hockey stop, shot wind-up, shot follow-through, pass, shoulder lowered. Adult rec player, about 27 px tall, feet at cell point (16, 27). Jersey, trim and helmet in three flat colour zones so teams can be recoloured |
| 2 | **Skater extras** | 32x32 cells, 6 in a row | 768x128 | Falling, flat on the ice, getting up, arms-up celebration, fist pump, bent over tired |
| 3 | **Goalie sheet** | 32x32 cells, 10 columns x 2 rows | 1280x256 | Rows: facing S, facing N. Columns: ready, shuffle left, shuffle right, butterfly, glove save, blocker save, kick left, kick right, poke check, down. Same three colour zones |
| 4 | **Seated fans** (a stopgap is in the game, shrunk from the Nov 28 sheet; still wanted at true size, with the same fan sitting and cheering) | 16x24 cells, 8 columns x 12 rows | 512x1152 | One fan per row, 12 different fans (coats, hats, hair varied). Columns: sitting 1, sitting 2, cheering 1, cheering 2, clapping 1, clapping 2, back view 1, back view 2. Facing right, three-quarter view, as on the Nov 27 concept sheet |
| 5 | **Side seating module** (items 5 to 7: every piece from the same camera, straight on from the front; no isometric or angled views) | 32 wide x 48 deep (three rows of 16) | 128x192 | Empty navy seats seen from the ice side, must tile top to bottom. No people |
| 6 | **Stairs module** | 32x48 | 128x192 | Concrete steps with a rail, same view, tiles with item 5 |
| 7 | **End and corner seating** | End: 32x48. Corner: 48x48 | 128x192 and 192x192 | Seats behind each net, seen from above and in front; a corner piece that joins side to end |
| 8 | **Faceoff circle** | 120x89 | 480x356 | Red circle as a wide ellipse, 2 px line, centre dot, hash marks. Nothing else |
| 9 | **Centre circle** | 120x89 | 480x356 | Blue, 2 px line, empty inside (a logo goes there) |
| 10 | **Goal creases** | 48x32, north and south | 192x128 each | Half-oval, light blue fill, 2 px red line on the curved side only |
| 11 | **Players on the bench** | 16x24 cells, 6 in a row, two rows | 384x192 | Row 1: seated players seen from behind (west bench). Row 2: seen from the front (east bench). Helmets on, sticks up. Same three colour zones |
| 12 | **Player in the penalty box** | 16x24 cells, 2 frames | 128x96 | Seated, slumped, stick across knees |

## Priority 2: teams (after you settle names and colours)

| # | Asset | Game size | Canvas (4x) | Notes |
| --- | --- | --- | --- | --- |
| 13 | **Team crest**, one per team | 64x64 | 256x256 | Sports-crest style, reads at small size. Lettering allowed here |
| 14 | **Centre-ice logo**, one per team | 64x48 (drawn as if lying on the ice) | 256x192 | The crest flattened for the centre circle |
| 15 | **Small crest for the scorebug** | 16x16 | 64x64 | Simplified crest |

Uniforms need no art if items 1 to 3 keep the three flat colour zones: the game recolours them.

## Priority 3: broadcast graphics at game size

The screen is 480x320. Leave every text area blank: the game writes names and numbers.

| # | Asset | Game size | Canvas (4x) | Notes |
| --- | --- | --- | --- | --- |
| 16 | **Scorebug bar** | 480x12 | 1920x48 | Two crest slots, two scores, period, clock |
| 17 | **Goal card frame** | 348x62 | 1392x248 | Portrait window 32x32 at the left, three text lines |
| 18 | **Penalty card frame** | 348x62 | 1392x248 | Same layout, penalty colours |
| 19 | **Summary panel frame** | 312x222 | 1248x888 | Used for the period break, final summary and three stars |
| 20 | **Three stars pieces** | Star badge 16x16 (gold, silver, bronze); portrait frame 34x34 | 64x64 each; 136x136 | Sit on the summary panel |
| 21 | **GOAL! lettering** | 240x80 | 960x320 | Red and gold with a dark outline |
| 22 | **Small tags** | 64x16 each | 256x64 each | Blank plates: faceoff, power play, penalty, overtime, shootout, icing, offside |
| 23 | **Name plate** | 80x9 | 320x36 | Dark plate under the controlled skater; and a 16x9 number plate |
| 24 | **Controlled-player marker** | 24x12 ring, 8x8 arrow | 96x48, 32x32 | Gold ring and arrow; white ring for the pass target |
| 25 | **Touch buttons** | Stick base 96x96, stick knob 48x48, buttons 56x56 (Shoot, Pass, Check, Menu) | 4x each | Retro arcade look, readable with a thumb over them |

## Priority 4: menus and Create a Player

| # | Asset | Game size | Notes |
| --- | --- | --- | --- |
| 26 | **Options screen** | 960x540 backdrop, row plate 420x24 | Generate at 2x. Locker-room chalkboard feel |
| 27 | **Card portraits at 32x32** | 32x32, 24 faces, 6 columns x 4 rows (canvas 768x512 at 4x) | Same 24 people as the preset faces, drawn at this size, not shrunk |
| 28 | **Character layers** | 64x96 bodies, 64x64 portraits | Hair, facial hair, skin tones, body types, gear. Exact list and anchors in `COMPOSITOR_ART_SPEC.md`: send that file to Gemini with the request |
| 29 | **Player card pictures** | Per `CARD_ART_SPEC.md` | Pixel-art standard, not painted |

## Not needed yet

Puck Falls locations, league and tournament logos, trophies, cinematics, Create a Team art (batch 17). They wait for design decisions.

## Not from Gemini

Sound: skate cuts, stick on puck, shot, post, boards, whistle, goal horn, crowd, menu clicks. The game has none.

## Already in the game and fine for now

Goals at 40x32 with net ripple, referee at 32 px, side boards and glass, ice tiles, puck and shadow.

## How to send it back

One PNG per item, named by its number and name (`04_fans.png`). I check each against its size and grid and report what fits before anything goes in the game.
