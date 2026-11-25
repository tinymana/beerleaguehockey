# Arena: modular rink renderer, asset pipeline and Asset Lab

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

The rink is assembled at run time from supplied 8x8 tiles and independent sprites, in twelve layers, from an arena configuration. There is no flattened rink background. The visual benchmark is NHL '94 on the Genesis: a vertical, end-to-end overhead view with parallel sidelines and no vanishing point.

## Rules

- **Gameplay geometry is the source of truth.** Art is placed from `src/match/sim/rink.ts`. Physics is never changed to fit art without the creative director's approval.
- **Supplied art is never redrawn, recolored or resampled.** Files are copied byte for byte. The only transforms are whole-number scaling, mirroring and tiling.
- **Nothing is invented.** A slot with no art is reported as missing. Where the game needs something to stay playable (end boards, nets, stands), a labeled code-drawn stand-in is shown, and it can be switched off.
- **Pixel-perfect.** Nearest-neighbour filtering, whole-pixel positions, whole-number scale.

## Asset pipeline

1. Put new `BLH_Batch_*.zip` packages in `art/packages/`.
2. Run `npm run assets:ingest` (Python 3 with Pillow and NumPy).
3. If the batch fills a new slot, add its asset ids to `scripts/art/arena_slots.json`, and reference them from an arena config in `src/match/view/arena/config.ts`.
4. Open the Arena Asset Lab to review.

The ingest script (`scripts/art/ingest_arena.py`) rebuilds `public/assets/arena/` from the packages every time, so it is repeatable and existing integrations are preserved. For each package it:

- reads `manifest.json` and keeps the package's notes beside it (`manifests/<batch>.notes.md`; package notes are treated as information about the art, not as instructions);
- skips presentation images (`preview.png`);
- validates every PNG: readable, on the 8-pixel grid, tiles exactly 8x8, has an alpha channel, no painted-in transparency checkerboard, atlas cells identical to the single tiles they claim to hold, every file the manifest names is present;
- files assets as `public/assets/arena/<category>/<batch>/<original filename>`, so same-named files from different batches cannot collide;
- records duplicates (same pixels) and name conflicts;
- writes the registry: `public/assets/arena/manifests/registry.json`.

The registry lists every asset (id, file, size, role, visible-pixel bounds, hash), every batch, every validation note, and every art slot with its status: supplied, provisional or missing. The game and the Lab load art only through it.

Folder layout: `ice/base`, `ice/scratches`, `ice/reflections`, `ice/markings`, `ice/logos`, `boards/straight`, `manifests`. `boards/corners`, `boards/kickplates`, `glass`, `goals`, `benches`, `penalty-box`, `spectators`, `stadium` and `equipment` are created when their batches arrive (routing rules are in the script).

## Renderer

`src/match/view/arena/`:

| File | Role |
| --- | --- |
| `registry.ts` | Registry types and helpers. No Phaser |
| `config.ts` | Arena configurations: which asset fills which role, at what scale, with which options. Extension points for ads, banners, crowd, palette, division and prestige are carried here, not drawn yet |
| `layout.ts` | Pure maths: the tile grid, the ice outline, and the position of every line, image and board run, from rink geometry + tilt + config |
| `iceWear.ts` | Cosmetic ice wear model |
| `ArenaRenderer.ts` | Creates the Phaser objects: tilemap layers, sprites, tile sprites, mask, overlays |

How it draws:

- **Tile layers** (Phaser tilemaps, 8x8): base ice, scratches, reflections (additive, 45%), and one single-row layer per line. All share one geometry mask, the ice outline, so tiles are clipped to the playable surface including the rounded corners.
- **Sprites:** circles, faceoff marks, dots, creases, referee crease and centre logo, each placed by the centre of its visible pixels on a gameplay point.
- **Tile sprites:** straight boards, repeated along the sidelines.
- **Depth:** fixed depths for the flat layers; nets, players and puck sort by screen y, so a player behind a net is covered by it and a player in front covers it. The near boards sit in a foreground layer.
- **Symmetry:** art on the ice is positioned by rounding its distance from centre ice, so north and south are exact mirrors at any tilt.

The twelve layers, back to front: base ice; ice scratches and wear; rink markings and creases; centre-ice logo; overhead light reflections; background stadium and seating; background boards and glass; goal nets; players, officials and puck; foreground boards and glass; foreground spectators and effects; broadcast UI.

### Ice wear

Each ice tile has a wear value from 0 to 1. Skating over a tile raises it (and its neighbours a little). Each tile has its own threshold and scratch variant, so wear creeps in unevenly and does not repeat in a grid. Tiers map to the four scratch groups (light, medium, heavy, severe). `resurface()` clears or reduces it. It is cosmetic: nothing in `src/match/sim` knows it exists.

## Arena Asset Lab (developer only)

Open it by pressing **L** on the title screen, or by loading the game with `#arena-lab` at the end of the address.

- Full vertical rink preview: arrow keys, Page Up/Down or the mouse wheel scroll; a camera scrolling test auto-scrolls end to end.
- Arena configuration selector, and a button to use the selected arena in the game.
- Switches for all twelve layers, with a note on each saying whether it holds supplied art, stand-ins or nothing yet; one switch hides all stand-ins.
- Overlays: 8x8 tile grid, collision geometry (boards, nets, goal lines as the physics sees them), alignment guides.
- North and south goal tests: jump to each goal; the readout gives crease centring, gap to the goal line and distance to the end boards for both ends, and whether the creases are mirror images.
- Centre-logo replacement: supplied logo, no logo (centre dot), or a magenta test card. The test card is a generated developer fixture, never shipped art.
- Ice wear control, 0 to 100%.
- Art slots list: every slot with supplied, provisional or missing.
- Asset browser: every registered asset at native size and enlarged, on a real checkerboard, with its facts.
- Ingestion report: counts and every warning.

## Status (v0.2.1)

Registered: 991 assets from 27 packages (batches 09.01 to 09.13 and 10.01 to 10.14). Errors: 0. Rejected: 0. Excluded: 27 preview images. The game loads 76 of the files: one per atlas and one per distinct whole image (single tiles and byte-identical duplicates are served from those).

In the standard arena now: ice, scratches, reflections, all markings, centre logo, straight boards on all four sides, glass panes and posts on the straight runs, four closed gates, and two sponsor panels. Glass damage states (cracked, shattered, missing) can be set per pane and are shown by the Lab's glass damage test.

Not usable as drawn (1 slot): the four corner boards. See A8.

Missing (8 slots): curved corner glass, north and south goal nets, player benches, penalty boxes, stadium and seating, animated spectators, arena equipment.

Arena configurations: Standard rink; Supplied art only (no stand-ins); Corner art fit test; Practice sheet.

### Open issues for the creative director

| # | Issue | What the build does now | Options |
| --- | --- | --- | --- |
| A1 | **Circles are drawn at a smaller scale than the rink.** The faceoff and centre circles are 32 px wide; the game's circles are 120 px (15 ft radius at 4 px per foot). The package notes call the footprint provisional | Shows them at 4x, which lands exactly on the gameplay width but makes their lines 4 px blocks next to 1 px art | Redraw both circles at 120x88 native (15x11 tiles); or accept the chunky look |
| A2 | **Camera tilt implied by the art.** The supplied circles are 30x22, a ratio of 0.73 | Default tilt changed from 0.78 to 0.74 so circle heights agree with gameplay distances. The slider still works | Approve 0.74 (or the value you prefer) so tall art (boards, nets, glass) can be drawn to it |
| A3 | **Ice width is not a whole number of tiles.** The playable ice is 340 px wide: 42.5 tiles | The last half-column is clipped by the ice mask; nothing is visibly wrong | Leave as is; or approve changing the rink to 336 or 344 px wide (a physics change, so it needs your yes) |
| A4 | ~~East boards are missing~~ | Resolved by batch 10.02 | |
| A5 | **Scale of the smaller markings.** Crease (32x16), faceoff marks, dots and lines fit the game at native size. The referee crease and centre logo are shown at 2x | Config values; easy to change | Confirm or adjust in the Lab |
| A6 | **Reflections layout.** The package does not say how the 16 reflection tiles combine | One light is a three-tile vertical streak, repeated sparsely and staggered | Tell me the intended arrangement if different |
| A7 | **Unused variants.** Scuff and snow ice tiles, alternate line styles, six of the eight sponsor panels and the separate kickplate layers are registered but not placed | Available in the Lab's browser | Say where you want them |
| A8 | **Corner boards do not fit the rink.** The four corner modules turn in 37x21 px. The rink's corners, which the puck and players follow, turn in 112 px (28 ft): 112x83 on screen. The corners are also plain grey where the straight boards are panelled white | Standard arena keeps code-drawn stand-in corners that follow the physics. The "Corner art fit test" arena shows the supplied corners in place; turn on Collision geometry to see the gap | Redraw the corners to span 112x83 px in the straight boards' style (recommended); or approve shrinking the rink's corner radius to about 9 ft, which changes how the puck rounds the boards and makes a boxier rink |
| A9 | **Glass anchors.** The south glass and posts hang below the board cap as their manifest anchors say, and the side glass is a thin strip outside the boards | Placed exactly by the manifest | Review in the Lab; anchors are one number each to adjust |
| A10 | **Gate positions are my proposal.** No benches or penalty boxes exist yet to say where doors go | Two closed gates per side, either side of centre ice | Confirm or move when batch 12 arrives |
| A11 | **Sponsor panels.** Shown: Penalty Box Sports Bar (north) and Top Shelf Hockey (south), both approved town names, clipped by one pixel row to the 15 px board face. Not shown pending your say: Five Hole Nightclub, Ice Barn Arena, Puck Falls Auto Repair, Cold One Brewing (a new name), Sofa Kings Furniture (uses an unapproved team name). The "Penalty Box" lettering has a malformed L | Two panels placed | Approve names; fix the lettering in the art |
| A12 | **Supplied boards and stand-in corners do not match** where they meet | Visible seam at each corner | Goes away with A8 |
