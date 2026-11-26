# Create a Player: batch 16 audit and plan

Beer League Hockey - Tiny Mana Studios. Answers the *Batch 16 Asset Integration & Character Creator* brief of Nov 25 (verbatim in `docs/briefs/`). This is the required response before any substantial change. **Nothing from batch 16 is integrated, and nothing here is built.** The packages are kept as delivered in `art/character_packages/`.

## 1. Current character creator: what exists (v0.3.1)

| Piece | State |
| --- | --- |
| Create a Player screen | A foundation: position, hockey background, one primary and up to two secondary influences, re-roll, every attribute shown as now against potential. Keyboard and gamepad. 480x320, temporary 5x7 font, no art |
| Player DNA | Built and tested: seeded, deterministic, versioned for saves |
| Attributes | Built: 21 skater attributes, 17 goalie attributes (the goalie set is my proposal) |
| Hockey Influences | Built: 64 curated profiles, neutral ids, swappable names |
| Hockey backgrounds | Built: 10, six of them available to an 18-year-old |
| Name, nickname, number, hometown, height, weight, handedness | Not built |
| Nationality | Not built |
| Appearance, equipment, portraits, character preview | Not built |
| Play styles, archetypes, personality traits | Not built (see `REGISTRIES.md`) |
| Presets, randomize with locks, summary, confirm | Not built |
| Saving a created player | Not built: there is no save system. The player lasts until the page closes |

## 2. Batch 16 asset audit

Fidelity first, since I said I would report on it: batch 16 is richer in colour and detail than batches 09 to 15 (one to two thousand colours per sprite against a few dozen), at small pixel sizes: bodies 64x96, portraits 64x64, icons 64x64 and 32x32, flags 32x32. Nothing forces a change to the rink or camera. What does not fit the current 480x320 screen is the interface design (section 3, and question 1).

The packages' own notes are candid, and my measurements agree with them.

| Batch | What it is | Count | Class | Usable now for |
| --- | --- | --- | --- | --- |
| 16.01 Final | Grey-uniform skater and goalie, 64x96: helmeted in four directions, helmetless front and rear | 12 | **Production-ready sprites, flattened** | A character preview with a plain uniform. Not a layer stack: head, hair and beard are painted into the helmetless models, helmets into the others |
| 16.02 Revised | Finished front-facing portraits, 64x64 plus 32x32 thumbnails | 24 | **Finished portrait presets** | Preset faces in the creator and league |
| 16.02B | Bald portraits, 64x64 plus thumbnails | 32 | **Finished portrait presets** (named "foundations", but backgrounds, jerseys and some beards are painted in) | Preset faces. Not a base for hair or beards |
| 16.03 | 60 hair designs: reference crops on a grey mannequin, and automatic cut-outs | 47 hair, 13 hats and headbands | **Experimental, needs cleanup** | Reference only. The cut-outs have holes, leftover mannequin outline and missing dark or grey hair |
| 16.04 | Lower-face crops showing beard styles | 35 | **Reference artwork** | Reference only. Skin, mouth and collar are in every image |
| 16.05 | Skin tone ramps, six shades each | 24 | **Production-ready data** | Ready, but there is nothing to apply it to: no skin masks exist |
| 16.06 | Body type concepts, 64x96 | 12 | **Reference artwork** | Reference only. Backgrounds, heads, number tags and a "BLH" jersey are painted in |
| 16.07 | Equipment thumbnails, 64x64 | 56 (8 each: helmets, face protection, gloves, sticks, skates, socks, accessories) | **Reference artwork** | Reference only. Opaque backgrounds, and real brand names on helmets and gloves |
| 16.08 | Flags, 32x32 | 249 | **Production-ready sprites** | Nationality picker, as it is |
| 16.09 V2 | Attribute icon cards, 64x64 and 32x32 | 32 | **Production-ready, with caveats** | Icons beside attribute names, for the 17 that match an attribute |
| 16.10 | Influence, play style and archetype cards | - | **On hold** | Waiting on `REGISTRIES.md` |
| 16.11 | Interface reference screen, and 12 newly drawn nine-slice components | 12 + reference | **Reference, plus production-ready components** | Panels, buttons, card frames, bars and arrows |

Against the brief's targets:

| Customization | Target | Usable as a modular layer today |
| --- | --- | --- |
| Bald head foundations | 32+ | 0 (32 finished portraits) |
| Hairstyles | 60+ | 0 (47 references) |
| Hair colours | 20 | 20 colours listed; no tintable hair to use them on |
| Facial hairstyles | 40+ | 0 (35 references) |
| Facial hair colours | 20 | 0 |
| Skin tones | 24 | 24 ramps; 0 masks |
| Eye colours | 12 | 0 |
| Body types | 12 | 0 (12 references) |
| Eyebrow variations | 16 | 0 |
| Facial imperfections | 24 | 0 (some are painted into portraits) |
| Age overlays | 10 | 0 |
| Equipment variations | 40+ | 0 (56 references) |
| Nationalities | 249 | **249** |

## 3. Missing or incompatible artwork (deficiency report)

**Defects in what was supplied**

- **Not fully opaque where it should be.** The 16.02B portraits, the 16.04 crops and the 16.09 icons have an alpha of about 245 to 251 across the whole image instead of 255, so whatever is behind them shows through faintly. Needs re-export at full opacity.
- **Real brands.** 16.07 shows JOFA, CCM, Bauer and Warrior marks. Rule 9 does not allow real brands; these need invented ones.
- **Painted-in branding.** "BLH" on the 16.06 bodies and the "Beer League" jersey with a number 27 and a captain's C on the 16.11 reference. The brief itself says none of these may be baked in.
- **Icon labels.** Every 16.09 icon has its name painted in, too small to read at 32x32, and one is misspelled ("EXPERIENCC"). Icons without text would let the game draw the label.
- **Icons do not match the attributes.** 17 of the 32 map to an existing attribute. 15 have no attribute behind them (shooting, stickhandling, deking, physicality, chemistry, potential, training, experience, consistency, clutch, work ethic, intangibles, goaltending, and shot power and shot accuracy, which each cover two attributes). 8 attributes have no icon of their own: balance, faceoffs, offensive awareness, reflexes, blocker, pad saves, recovery and puck handling; and wrist and slap shots share one power icon and one accuracy icon. Per the brief I have not created attributes to match icons.
- **Base models are flattened.** The helmetless skater has brown hair and a beard painted in; there are no helmetless side views; a few dozen stray coloured pixels sit in the grey uniforms.
- **Flags** come from Noto Color Emoji (Apache 2.0): fine to use, needs an attribution notice shipped with the game, and the package asks for a review before release.
- **A likeness.** The reference screen's gold card is a recognisable portrait of a real player. Names are approved for development (Decision 34); likenesses were not part of that ruling.
- **One portrait** (16.02B) carries a facial tattoo in the style of a real cultural tradition. Worth a deliberate look rather than an accident.

**What needs to be commissioned for a modular creator**

All at the same alignment, on transparent backgrounds, fully opaque or fully clear pixels, no text, no brands.

| Layer | Needed | Notes |
| --- | --- | --- |
| Head foundations | 32+, front view 64x64, same eye line and chin position in every one | Skin drawn in the six ramp shades of 16.05 only, so a skin tone is a palette swap. No hair, beard, brows, collar or background |
| Eyes | One eye shape set, iris as its own region | 12 colours by tint |
| Eyebrows | 16, grey for tinting | |
| Hair | 60+, grey for tinting, each fitted to the shared head position | Helmet-on variants (what shows under a helmet) for the body views |
| Facial hair | 40+, grey for tinting | |
| Imperfections | 24: scars, freckles, missing teeth, broken nose and so on | Overlays |
| Age overlays | 10: wrinkles, greying, thinning | Overlays |
| Bodies | 12 builds x skater and goalie x front, right, rear, left (and helmetless) at 64x96 | Uniform in separate grey regions (section 8), skin in ramp shades |
| Equipment | 40+ items as overlays per body view, each with an anchor | Invented brands only |
| Icons | Text-free; one per attribute, including the 8 missing | |
| Typography | The "bold retro sports" type on the reference does not exist as a font | A bitmap font in two or three sizes; today the game has only a temporary 5x7 font |
| Interface | Nav icons, text fields, sliders, tab and scroll pieces, dice, lock, save and load icons | 16.11 covers panels, buttons, cards, bars, arrows |

## 4. Proposed modular rendering architecture

- **Appearance is data.** One versioned record of stable ids, stored with the person and nowhere else: head, skin tone, eye colour, brows, hair style and colour, facial hair style and colour, imperfections, age overlay, body type, height, weight, and equipment by slot. It lives in `src/dynasty` beside Player DNA, with a version number and migrations, exactly as DNA has.
- **Uniform is not appearance.** Team colours, crest, number, name and captain's letter come from the team membership at draw time. A transfer or a second team changes nothing in the appearance record.
- **A pure compositor.** A function takes appearance, uniform and a rendering profile and returns an ordered list of draw steps (asset id, tint, offset). The screen layer only draws the list. This is testable without a browser, like the arena layout.
- **Layer order** as in the brief: body, skin, head, features, age and imperfections, brows, hair, facial hair, jersey and pants, team branding, number and name, equipment, accessories.
- **Five profiles, five art sets.** Creator (64x96, four directions), portrait (64x64), locker room (32x32), cinematics, on ice (48x48 today). A profile is a separate set of art for the same ids, not a rescale. On-ice sprites and gameplay are untouched.
- **Safe fallbacks.** Every id resolves through a chain: the exact asset, then that category's default, then the base model. A save that names art the game no longer has still loads and draws.
- **Presets beside layers, not instead of them.** The 56 finished portraits can be offered as "preset faces" (an id in the portrait slot). The record keeps every modular field, so nothing is flattened to fit today's art.
- **Recolouring** uses grey layers per colour region, tinted at draw time (section 8). No whole-sprite tinting.
- **Randomize** draws from a named seeded stream of its own, honours per-feature locks, and never touches DNA or attributes.
- **The art pipeline** gains a character category with the same rules as the arena: manifests, stable ids, validation, a registry, and a Character Asset Lab (previews, layer toggles, rotation, anchors, alpha inspection, palette swaps, random generation, missing-art warnings, portrait against sprite).

## 5. Hockey Influence registry

Implemented: 64 entries. Full table in `REGISTRIES.md` section 1. Two points from the brief:

- **"The NHL database as the searchable registry."** The supplied file has names, positions, birthdays, countries and sizes but no performance data, so it can list 8,662 players but cannot say how any of them played. Today 64 have hand-written profiles. Options are in question 4.
- **Cards.** One reusable gold template with dynamic name, flag, position, era and tendencies is exactly how the registry is shaped. Portraits are the open part (likeness, question 3).

## 6. Play Style registry

Proposed: 18 styles, `REGISTRIES.md` section 2. Not implemented as a choice; today tendencies come from influences.

## 7. Beer League Archetype registry

Proposed: 12 archetypes from the brief's examples, `REGISTRIES.md` section 3, with backgrounds (implemented, 10) and personality traits (designed, 5) in sections 4 and 5 and the overlaps in section 6.

## 8. Batch 17 technical specifications (Create a Team)

These assume the character models stay at the 16.01 size (64x96). At the approved 960x540 the model is shown at five times size (480 px tall), so these pixel sizes stand.

| Item | Specification |
| --- | --- |
| Colour regions | Up to **four per uniform**: primary, secondary, accent, trim. Each region is its own PNG in **neutral grey** (shading only), tinted by the game. A fifth, untinted "fixed" layer carries anything that never changes colour (laces, skin, black) |
| Why layers, not one coloured image | The game can tint a grey layer to any team colour with no custom shader. A single painted jersey cannot be recoloured cleanly |
| Grey ramp | At most 8 greys per region, mid-grey (#808080) as the base shade, so every team colour lands where expected |
| Jersey, pants, socks, helmet templates | One set per body type, per view (front, right, rear, left), 64x96, registered to the 16.01 body: same anchor `[32, 95]`. Home, away and alternate are **patterns** (stripe layouts), not colours |
| Crest | Master **64x64**, plus hand-drawn 32x32 and 16x16 versions (not automatic reductions). Up to four grey regions plus a fixed layer, same scheme. Transparent outside the shape |
| Crest placement | A rectangle per body view in the jersey manifest: chest front, and shoulders where wanted. The manifest carries the box; art never contains a crest |
| Number and name | Never drawn into art. Manifest boxes per view: rear number, front or sleeve numbers, rear name bar. Supplied as bitmap digit sets 0 to 9 and A to Z in each size needed (rear number about 12 px tall on the 64x96 body), one grey fill layer and one outline layer |
| Captain's letters | C and A as separate small sprites with a placement box |
| Team typography | Bitmap fonts as sprite sheets: fixed cell, A to Z, 0 to 9, basic punctuation, in each display size. Grey fill plus separate outline, so wordmarks can take team colours |
| Mascots | 64x64 head for badges and 128x128 full figure; coloured art is fine (a mascot is not recoloured), or the four-region scheme if it should follow team colours |
| Transparency | Pixels fully opaque or fully clear. No semi-transparent edges, no painted backgrounds, no checkerboards |
| Sizes | Multiples of 8 px |
| Packaging | As before: named PNGs, an atlas, `manifest.json` with stable ids, atlas rectangles, anchors and placement boxes, a preview image, one ZIP per batch. A re-issue keeps the same file name |
| Never in the art | Team names, logos, numbers, surnames, captain's letters, sponsor marks, real brands |
| Where a team identity is applied | Uniforms in every profile, scoreboard, standings, broadcast overlays, arena signage, championship shirts. Each needs the crest sizes above; the on-ice sprite needs its own small jersey template once Track A allows |

## 9. Recommended sequence

1. **Your rulings on section 10**, above all the presentation resolution.
2. **Registries approved** so batch 16.10 cards can be drawn.
3. **Appearance record and compositor**, headless and tested, with the fallback chain. No art needed.
4. **Character Asset Lab** and a character category in the pipeline, so re-issued and new art can be judged as it arrives.
5. **Creator v1 with what is usable now:** the 16.11 components, flags, preset portraits, the grey base model, profile fields (name, nickname, number, hometown, height, weight, handedness), nationality picker, influence picker with search, summary, presets. Appearance tab offers preset faces and says plainly that the modular parts are coming.
6. **Modular appearance**, feature by feature, as clean layers arrive.
7. **Create a Team** on batch 17.
8. Saving, when the league and save format arrive.

Steps 3 to 5 are creator work beyond the "foundation" you authorized, so they need your go-ahead.

## 9a. Rulings received Nov 25, and the Creator V1 plan

**Rulings (Decisions 38 to 45):** off-ice screens use a **960x540**, 16:9 design space, with the on-ice resolution and engine untouched; **Create a Player V1 and Create a Team V1 are approved**, with preset faces and equipment references as temporary stand-ins and the modular architecture preserved; influence cards are **illustrated, not photographic**, with generic illustrations or silhouettes for the wider database and a fictional fallback registry; influences expand beyond 64 with data-derived profiles (`INFLUENCE_ENGINE.md`); weights **60 / 25 / 15** (built); **play style is chosen**; **archetypes evolve**; **personality is separate**.

**Creator V1 plan**

| Step | What | Temporary in V1 |
| --- | --- | --- |
| 1 | **Off-ice rendering profile.** One game, two profiles: ice at 480x320, off-ice at 960x540. The canvas switches profile when a scene starts; each profile scales by whole numbers where the window allows, letterboxes the rest, and keeps pixel-art filtering. The on-ice engine is not touched | The title screen and its 3:2 art stay 3:2, shown with side bars inside the 16:9 frame until widescreen versions exist. Nothing is stretched or cropped |
| 2 | **Interface kit** from batch 16.11: nine-slice panels, buttons, card frames, bars, arrows; focus handling for keyboard, mouse and gamepad; text fields; a scrolling list with search | Text uses the temporary 5x7 font at double size until a real font is supplied |
| 3 | **Appearance record v1 and compositor**, with the fallback chain, in `src/dynasty`; headless tests | - |
| 4 | **Character art category** in the pipeline and a **Character Asset Lab** | - |
| 5 | **Profile tab:** first and last name, nickname, number, hometown, height, weight, handedness, position. Age fixed at 18 | Name filtering is not built (question 11) |
| 6 | **Appearance tab:** the 56 preset portraits; the grey base model, rotatable through the four supplied views; body type and skin tone stored but not yet drawn | Preset faces instead of layered heads, hair and beards; labelled as such on screen |
| 7 | **Equipment tab:** choose by slot from the reference thumbnails | Thumbnails only: nothing is drawn on the model. Items showing real brand marks are left out (question 12) |
| 8 | **Nationality tab:** 249 flags, searchable, plus "unspecified" | - |
| 9 | **Influence tab:** searchable list; one primary, two secondary, 60 / 25 / 15; gold card frame with name, flag, position, era and tendencies | No portrait: a silhouette panel. 64 curated entries until the database work lands |
| 10 | **Play Style and Archetype tabs:** pick from the proposed registries, position- and background-appropriate | Play style is stored and shown but moves no numbers until you approve its strength |
| 11 | **Attributes tab:** all attributes with icons where one matches, now against potential | 12 attributes have no matching icon and show a plain marker |
| 12 | **Summary and confirm.** Confirming locks the DNA: the seed and choices are stored and can never be re-rolled by reopening the creator. Appearance stays editable | - |
| 13 | **Created-player store:** a small versioned record in the browser, with a migration test. This is the first thing the game saves | Local to one browser, with export and import. Not a career save |
| 14 | **Randomize** (whole appearance or one feature, with locks) and **appearance presets** (save, load, reset) | - |
| 15 | **Create a Team V1** | Waits for batch 17. The team identity record (name, place, four colours, crest, patterns, lettering) can be built and tested first |

Steps 1 and 2 come first because everything else is drawn with them.

## 10. Questions for the creative director

1. **Presentation resolution.** *Answered (Decision 38):* 960x540, 16:9, for all off-ice scenes and interfaces; the ice keeps its resolution.
2. **Go-ahead for creator v1** *Answered (Decision 39):* approved, for Create a Player V1 and Create a Team V1.
3. **Likenesses.** *Answered (Decision 40):* illustrated cards; individual illustrations for featured influences subject to rights review; generic illustrations or silhouettes for the rest; a fictional fallback registry.
4. **How many influences.** *Answered (Decision 41):* not limited to 64; expand with data-derived profiles. See `INFLUENCE_ENGINE.md`; the dataset has not been reachable yet.
5. **Play style:** *Answered (Decision 43):* chosen by the player, inside the existing attribute budget, able to evolve.
6. **Archetypes at 18:** *Answered (Decisions 44 and 45):* a starting archetype is chosen and then evolves, with history kept; personality is a separate system.
7. **Attribute display.** The reference shows 12 summary rows; the game has 21 attributes. Show all 21 with icons, or 12 grouped rows that expand?
8. **Body type names.** The art uses rookie, slim, average, athletic, stocky, power, wide, dad bod, beer belly, heavyweight, tall, large; the brief lists nine others. Which set?
9. **Height and weight:** cosmetic only, as body type is, or allowed to matter?
10. **Hometown:** free text, or a list?
11. **Nicknames and names:** free text needs a profanity position, especially once online play exists.
12. **Branded equipment thumbnails.** Several 16.07 helmets and gloves carry real brand names. Decision 39 allows the references as a temporary stand-in; rule 9 does not allow real brands. I plan to leave the branded items out of V1 and show the rest. Confirm, or say to include them for development only.
13. **Play style strength.** Proposed: a quarter of the attribute spread, and 20% faster development in the style's attributes (`REGISTRIES.md` section 2).
14. **Archetype thresholds and the starting list** in `REGISTRIES.md` section 3: approve or amend.

## 10. Rulings of Nov 25 (second set)

- **Branded equipment (Decision 49):** equipment thumbnails that carry real manufacturer branding are excluded from Creator V1 and stay out of the production asset registry; the originals remain in `art/character_packages/`. Creator V1 does not wait for replacements: affected slots show the unbranded items only.
- **Play Style (Decision 48):** the Play Style tab reads `src/dynasty/playStyles.ts`; the engine side is built (25% of the starting spread).
- **Cards (batch 16.10):** specification in `CARD_ART_SPEC.md`. Archetype cards on hold until the registry review.
- **Branding (Decision 50):** the official Beer League Hockey crest on every creator screen that carries game branding.

## 11. Creator V1, first build (v0.4.0, Decision 58)

Built: plan steps 1 (rendering profile), 2 (interface kit: panels, buttons, card frames; focus for keyboard, mouse and gamepad; text fields; scrolling searchable list), 9 (influences, now across 8,662 people), 10 (play style and archetype), 12 (review and confirm) and 13 (stored players). Step 5 is partly built: first and last name and position; nickname, number, hometown, height, weight and handedness are not.

How re-roll exploitation is prevented: nothing is rolled before confirmation. The attribute panel shows the published range for the current choices (and for whichever choice is highlighted), so choices can be compared honestly without revealing a roll. Confirmation rolls once and stores the result. The draft that survives a reload contains choices only.

Not built: steps 3, 4, 6, 7, 8, 11 (icons), 14, 15. Bars are drawn in code; the kit's bar tiles are not used yet. The export and import of stored players in step 13 is not built.

Questions: 1. Is 8 stored players the right limit, and should deleting one be allowed? 2. Which created player may enter a career, and how many careers, is what finally closes "make several and keep the best". 3. Gamepad name entry: an on-screen keyboard, or a random-name button?
