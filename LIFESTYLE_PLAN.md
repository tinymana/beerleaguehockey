# Equipment maintenance and adventure-style locations: proposal and art specifications

Beer League Hockey - Tiny Mana Studios. Answers the *Equipment Maintenance & Adventure Interactions* direction of Nov 25. It contains the two things that direction asks for before work starts: proposed equipment numbers for approval, and technical specifications for batch 18 art. **Nothing here is built or authorized to build.** Every number is a proposal.

## 1. Equipment lifecycle

### Model

- Equipment belongs to the **person**, never to a team. It goes with them across seasons, tournaments, teams and saves.
- Each item has a **condition** from 100 (new) to 0 (broken). Skates also have a separate **sharpness** from 100 to 0.
- Penalties are **temporary attribute modifiers**: the layer that already exists in `src/dynasty/attributes.ts`, kept apart from a player's real ratings. Fixing the item removes the modifier; nothing permanent changes.
- Before every game the player sees meters and, if anything is in the warning band, a warning.
- Repairs, sharpening and purchases happen at **Top Shelf Hockey**, the pro shop. Money is integer cents.

### Slots (proposed)

| Slot | Wears from | When low, it affects |
| --- | --- | --- |
| Skates (boot and holder) | Games, age | Skating speed, agility; injury risk |
| Skate sharpness | Every game; faster outdoors and on bad ice | Agility, acceleration, balance |
| Stick | Shots, slashes, faceoffs; can break outright | Shot power and accuracy, passing |
| Gloves | Games, fights, blocked shots | Puck control, faceoffs |
| Helmet and cage or visor | Hits, pucks, age | Injury risk only |
| Pads (shoulders, elbows, shins, pants) | Hits, blocked shots | Durability, injury risk |
| Goalie pads, glove and blocker (goalies) | Shots faced | Pad saves, glove, blocker, rebound control |

### Proposed numbers

| Setting | Proposal |
| --- | --- |
| Sharpness lost per game | 12 to 18 (a sharpening lasts about 6 games) |
| Condition lost per game | Skates 1, gloves 1.5, pads 1, helmet 0.5, stick 4 plus a 2% chance per game of breaking |
| Extra wear | A heavy check given or taken: 0.5 to pads; a blocked shot: 1 to pads; a fight: 3 to gloves and helmet |
| Warning band | Below 40: yellow meter and a pre-game warning |
| Penalty band | Below 25: minus 2 to the affected attributes |
| Failure band | Below 10: minus 5, and for skates, helmet and pads the injury modifier below |
| Dull skates | Sharpness below 25: minus 3 agility and acceleration; below 10: minus 6 and minus 3 balance |
| Injury modifier | Failure band on helmet, pads or skates: injury chance in a game multiplied by 1.5. Never above that |
| Broken stick in a game | Happens on the ice (already in the cinematic and debris lists); the player needs a spare or plays without until the next whistle. A Track A rule, to design then |

| Quality tier | New price | Wears | Bonus |
| --- | --- | --- | --- |
| Secondhand (bin by the door) | 25% of standard | 1.5x as fast, starts at 60 | None |
| Clearance (last year's colours) | 60% | Normal | None |
| Standard | 100% | Normal | None |
| Premium | 250% | 0.7x as fast | None: it lasts longer and looks better. No attribute bonus, so money cannot buy ratings |

| Service | Price (proposed) |
| --- | --- |
| Skate sharpening | $8 |
| Repair (restores up to 70; not possible below 10 or on sticks and helmets) | 30% of the item's standard price |
| Standard stick / gloves / skates / helmet / pad set | $90 / $80 / $250 / $120 / $200 |

Possible extensions, as the direction lists them: secondhand and clearance stock that changes week to week, repairs that take a day, and premium lines.

### Questions

1. Should premium gear ever give a rating bonus? I have proposed no.
2. Does an **Equipment Guy** archetype change any of this (cheaper, or obsessive warnings)?
3. Goalie gear is expensive in real life. Reflect that, or keep goalies affordable so teams can find one?

## 2. Point-and-click locations

### What it is

Every major off-ice location is an illustrated scene you explore with a cursor, in the manner of early-1990s adventure games: hotspots on people and objects, animated characters, dialogue trees, things to inspect, jokes hidden in corners, and location errands that feed the career. Top Shelf Hockey is the first, because the equipment system gives it a job. All art and writing original.

### Framework (proposed)

- **A scene is a data file**, with a stable location id. No scene needs code of its own.
- **Contents of a scene definition:** background layers; foreground layers that draw over characters; animated objects; NPC placements; hotspots; exits to other locations; the transaction screens it can open; and the conditions under which each thing is present.
- **Hotspots** are rectangles or polygons in scene pixels, each with a name, a cursor type (look, talk, use, buy, exit), a priority where they overlap, and a list of interactions. Each interaction has a condition and a result: say a line, start a dialogue tree, play an animation, open a transaction, raise a career decision, or start an errand.
- **Conditions and results go through the career**, never around it. A scene asks questions of the career state and sends named commands to it, the same commands anything else would send. Scenes hold no game state except "has the player seen this".
- **Dialogue** is a tree of lines and choices in data, with conditions per line, so what an NPC says depends on the career (your team, your last game, your skates, whether your membership has lapsed).
- **No walking.** The player character is not steered around the room and there is no pathfinding. NPCs stand, sit and animate in place. This is the direction's own constraint.
- **Controls:** mouse; keyboard and gamepad move focus between hotspots in a fixed order, with a button for the default action and one to cycle verbs.
- **Separate from the ice.** The framework lives in the lifestyle module and its screen layer; it never touches the match simulation.

### Questions

4. **Verbs:** one smart cursor that does the obvious thing (simplest, friendliest on a gamepad), or explicit verbs (look, talk, use)? I recommend a smart cursor with "look" as a second button.
5. **The first locations**, after Top Shelf Hockey: the rink front desk (membership nagging), the locker room, The Penalty Box?
6. **Does time pass** while you click around, or only when you choose to leave?

## 3. Batch 18 art specifications

Written for the approved off-ice design space, **960x540** (Decision 38).

| Item | Specification |
| --- | --- |
| Scene size | **960x540 px**, one screen, no scrolling. Wider rooms can be two screens joined by an exit |
| Background | One opaque PNG, 960x540. Nothing in it that should animate, be picked up, or change with the career |
| Midground objects | Separate transparent PNGs for anything that changes, moves or can be clicked: doors, the sharpening machine, stock on shelves, a till. Each with its position in scene pixels |
| Foreground | Separate transparent PNGs for whatever stands in front of characters (a counter, a rack, a railing) |
| Layer order | Background, back objects, characters, front objects, foreground, then interface. The manifest gives each piece a layer and an order number |
| NPC sprites | Frame **96x160 px** (a standing adult is about 140 px tall, about a quarter of the screen). Seated or behind-the-counter characters use the same frame, cropped by a foreground piece. Anchor at the feet, bottom centre |
| NPC animations | One horizontal strip per animation, equal frames, listed in the manifest with a duration per frame: idle (4 to 8 frames, loops), talk (4 frames, loops), one or two gestures, and any location-specific action (sharpening a skate, ringing a sale) |
| Object animations | Same strip format; state pairs (door open and closed, light on and off) as separate frames |
| Hotspots | Not painted. Supplied in the manifest as rectangles `[x, y, width, height]` or polygons in scene pixels, with a suggested name; I can also derive them from each object's outline |
| Cursors | 32x32 px each, with a hot point in the manifest: default, look, talk, use, buy, exit (four directions), busy |
| Dialogue panel | Nine-slice pieces with 16 px insets: panel, name plate, choice row idle and selected, a "more" arrow. A portrait box of 128x128 for the speaker |
| Speaker portraits | 128x128, two or three expressions per recurring character |
| Transaction screens | Shelf or counter panels as nine-slice pieces; item icons 64x64; condition meter pieces (empty, fill, warning, danger) |
| Transparency | Pixels fully opaque or fully clear |
| Text | None painted in, including shop signs that could change. Fixed signage that is part of the room (the Top Shelf Hockey sign) is fine |
| Colour | No limit, in keeping with the batch 16 direction |
| Packaging | One ZIP per location: named PNGs, `manifest.json` with stable ids, positions, layers, anchors, animation strips with durations, hotspot shapes; a preview image. Real brands never |

For Top Shelf Hockey specifically, the scene needs: the counter and till, a skate sharpening machine (idle and running), stick racks, a glove wall, a helmet shelf, a secondhand bin, a clearance rack, a notice board, the door, and at least the shopkeeper and one loiterer.
