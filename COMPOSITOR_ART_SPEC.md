# Character compositor layer package: exact artwork specification

Beer League Hockey - Tiny Mana Studios. Requested by the creative director (Decision 75) before the art team begins. Alignment template: `docs/compositor_template.png`. This does not ask for batch 16 to be regenerated: every layer is drawn onto the existing batch 16.01 body, which stays the reference base character.

## 1. Rules for every file

| Rule | Value |
| --- | --- |
| Reference base character | Batch 16.01 Final: `skater_<view>` and `goalie_<view>`, 64x96. Draw every layer over these, in place |
| Body canvas | **64 x 96 px** for every body layer, whatever the layer covers. Never cropped to its contents |
| Portrait canvas | **64 x 64 px** for every head-and-shoulders layer |
| Anchor (body) | `[32, 95]`: the point between the skates on the ice, the same in every body file. Measured from the top-left, x right, y down |
| Anchor (portrait) | `[32, 63]`: bottom centre. The chin sits at row 44, the eye line at row 28 |
| Head region on the body | `[16, 0, 32, 28]` (x, y, width, height). Head, hair, helmet and facial hair layers stay inside it, except long hair, which may reach row 36 |
| Jersey region on the body | `[8, 25, 48, 34]` |
| Views | `front`, `right`, `rear`, `left`. `left` may be omitted where it is an exact mirror of `right`: say so in the manifest (`"mirrorOf": "right"`). Anything with a handed detail (a stick, a number, a crest) is drawn for both |
| Transparency | PNG, transparent background. Every pixel fully opaque (alpha 255) or fully clear (alpha 0). No soft edges, glows or shadows |
| Style | Batch 18 standard: 32-bit era pixel art, bold dark outlines, consistent pixel density with batch 16.01, 1:1 pixel grid, no painterly blending |
| Content | No text, numbers, logos, brand names, real teams or real people |
| Files | One layer per file, plus an atlas per group and a `manifest.json` (section 6) |

**Reference base files.** The twelve native 64x96 PNGs are supplied to the art team as `compositor_reference.zip`: `original/` as delivered in batch 16.01, and `corrected/` with the near-white wedge between the legs made transparent (front and rear views; nothing else changed). Draw over `corrected/`. Two small faults remain for the art team: transparent holes in the goalie blocker and catcher on the goalie front views.

**No runtime correction.** The game never resizes, shifts or re-anchors a layer to make up for misaligned art. A layer that fails the checks in section 5 is returned, not adjusted.

## 2. Layer order, back to front

| # | Layer group | Canvas | Draws over |
| --- | --- | --- | --- |
| 1 | `body` (bare body for a body type, in base layers, no head) | 64x96 | - |
| 2 | `body_mask_skin` | 64x96 | body |
| 3 | `head` (bare head: no hair, beard, helmet or collar) | 64x96 and 64x64 | body |
| 4 | `head_mask_skin` | as head | head |
| 5 | `facial_hair` | as head | head |
| 6 | `hair` | as head | head, facial hair |
| 7 | `clothing` (casual clothes, championship T-shirts) or `uniform` (jersey, pants, socks) | 64x96 | body |
| 8 | `equipment`: skates, shin and sock, pants shell, gloves, stick | 64x96 | uniform |
| 9 | `helmet`, then `face_protection` (cage, visor) | 64x96 and 64x64 | hair (the helmet hides hair inside its outline: supply `helmet_<id>_hairmask`, opaque where hair must be hidden) |
| 10 | `accessory` (tape, neck guard, mouthguard, hat off the ice) | 64x96 or 64x64 | everything |

### 2a. Clarifications (Decision 77)

**Long hair, collars and neck guards.** Hair that falls below the jaw is split into two files: `hair_<nn>_back_<view>` (the part behind the neck and shoulders) and `hair_<nn>_<view>` (the part on the head). Order around the neck, back to front: `hair_back`, body, head, facial hair, uniform or clothing (its collar covers the neck and the ends of `hair_back`), neck guard (an accessory, drawn over the collar), hair on the head, helmet, face protection. In the rear view `hair_back` is drawn **over** the collar instead: the manifest marks this with `"overCollarInRear": true`. Short hair needs no `_back` file.

**Fitting across the 12 body types.** Wearable layers are not drawn twelve times. Each body type declares a **fit class**: `slim`, `regular` or `large` (four body types each; `average` is `regular`). Every uniform, clothing and body-worn equipment layer is drawn once per fit class and named `<asset id>_<fit>_<view>`, for example `casual_01_large_front`. Head, hair, facial hair, helmet and face protection are the same for every body type: all twelve bodies must place the head in the same head region. Hand-held and foot-worn items (sticks, skates) are drawn once and the twelve bodies must keep hands and feet on the same pixels as `average`. If a body type cannot honour that, it is a new fit class, not a runtime adjustment.

**Catalog growth.** Ids are never renumbered or reused. New items take the next number. A save that names an id the game no longer has falls back to the default for that part and keeps everything else (already built and tested).

**Approved minimum counts:** 12 bare heads, 12 body types, 47 hairstyles, 35 facial hair styles, the 24 existing skin ramps, 8 unbranded helmets, 8 glove designs per role, 8 face protection, 8 sticks, 8 skates, 8 socks, 8 accessories, 12 casual outfits. Championship T-shirts are separate collectible overlays.

### 2b. Proof of concept first (Decision 77)

Before the full catalog, one small package, validated in the actual creator:

| Asset | Files |
| --- | --- |
| Average skater body, average goalie body | `body_average_skater_<view>`, `body_average_goalie_<view>` (4 views each) with their skin greyscale |
| One bare head | `head_01_<view>` (4), `head_01_portrait`, each with `_fixed` for eyes, brows and mouth |
| One hairstyle | `hair_05_<view>` (4), `hair_05_portrait` (a style long enough to need `hair_05_back_<view>` is the better test) |
| One facial hair style | `beard_03_<view>` (front, right, left), `beard_03_portrait` |
| One helmet | `helmet_01_<view>` (4), `helmet_01_portrait`, `helmet_01_hairmask_<view>`, with `_c1`, `_c2` |
| One uniform | `uniform_jersey_skater_regular_<view>`, `uniform_pants_skater_regular_<view>`, and the goalie pair, with `_c1` to `_c3` |
| One casual outfit | `casual_01_regular_<view>` (4) |
| One championship T-shirt | `tee_01_regular_<view>` (4) plus its `_fixed` print |
| Thumbnails | `_thumb` for each pickable item |

About 75 files. **The reference composite** (the expected final result) will be assembled by the game from these files and returned to you with the validation report: one cannot be made honestly from the flattened art that exists today. Final production dimensions are locked only after that report.

## 3. Colour replacement

Anything the game recolours is supplied as a **greyscale layer plus nothing else**: the game maps **six** grey levels to a six-colour ramp.

| Grey value (R=G=B) | Becomes |
| --- | --- |
| 32 | Outline |
| 80 | Deep shadow |
| 128 | Shadow |
| 176 | Midtone |
| 224 | Highlight |
| 255 | Brightest highlight |

Only these six values, no others, in a recolourable layer. Parts of the same picture that must keep their own colour (eyes, teeth, a metal cage, stick tape) go in a separate file with the suffix `_fixed`, drawn in final colours, layered directly above.

| Group | Recoloured by |
| --- | --- |
| `body_mask_skin`, `head_mask_skin` | The 24 skin ramps of batch 16.05 (their six named colours map to the six grey values in order) |
| `hair`, `facial_hair` | A hair colour ramp (the game supplies: black, dark brown, brown, auburn, red, blond, grey, white) |
| `uniform`, `clothing`, `helmet`, gloves | Up to three team or garment colours: supply `_c1`, `_c2`, `_c3` greyscale files for the primary, secondary and trim areas, which do not overlap |
| `equipment` other than gloves, `face_protection`, `accessory` | Not recoloured: final colours |

Masks are the greyscale layers themselves: where a mask is clear, nothing is recoloured.

## 4. Assets

`<view>` is front, right, rear, left. Counts are the minimum useful set; more is welcome if ids continue the numbering.

| Asset id | Canvas | Views | Variants | Notes |
| --- | --- | --- | --- | --- |
| `body_<type>_<role>_<view>` | 64x96 | 4 | 12 types (the ids of batch 16.06: rookie, slim, average, ... large) x 2 roles (`skater`, `goalie`) | Bare body in base layers, greyscale skin on exposed parts. `average` must match the 16.01 silhouette exactly |
| `head_<nn>_<view>` and `head_<nn>_portrait` | 64x96, 64x64 | 4 + portrait | 12 heads (`01` to `12`): different face shapes and ages | Bare: no hair, beard, helmet, collar or background. Greyscale skin; eyes, brows and mouth in `_fixed` |
| `hair_<nn>_<view>` and `hair_<nn>_portrait` | 64x96, 64x64 | 4 + portrait | The 47 styles of batch 16.03, same numbers | Hair only, greyscale. No mannequin, no holes |
| `beard_<nn>_<view>` and `beard_<nn>_portrait` | 64x96, 64x64 | front, right, left + portrait (none from the rear) | The 35 styles of batch 16.04, same numbers | Hair only, greyscale. No skin, mouth or collar |
| `helmet_<nn>_<view>`, `_portrait`, `_hairmask` | 64x96, 64x64 | 4 + portrait | 8, unbranded | Replaces the excluded branded helmets. `_c1` shell, `_c2` trim |
| `glove_<nn>_skater_<view>` | 64x96 | 4 | 8, unbranded | `_c1`, `_c2`. Left may mirror right |
| `glove_<nn>_goalie_<hand>_<view>` | 64x96 | 4, **never mirrored** | 8, unbranded, each in two handednesses: `catchL` (catcher on the left hand, blocker on the right: the common way) and `catchR` (the reverse) | Catcher and blocker are different objects, so a full-right goalie is a separate drawing, not a flip. `_c1`, `_c2` |
| `protection_<nn>_<view>` and `_portrait` | 64x96, 64x64 | 4 + portrait | The 8 of batch 16.07 (cages, visors) | Fits over every helmet |
| `stick_<nn>_<role>_<view>` | 64x96 | 4, both hands: `_L` and `_R` | The 8 of batch 16.07 | Left- and right-handed grips are different drawings |
| `skate_<nn>_<role>_<view>`, `sock_<nn>_<view>` | 64x96 | 4 | The 8 each of batch 16.07 | Socks: `_c1`, `_c2` |
| `accessory_<nn>_<view>` | 64x96 or 64x64 | as needed | The 8 of batch 16.07 | |
| `uniform_jersey_<role>_<view>`, `uniform_pants_<role>_<view>` | 64x96 | 4 | 1 cut each to start. **Role is part of the file name**: `uniform_jersey_skater_front`, `uniform_jersey_goalie_front`. Goalie cuts are wider and are separate drawings | `_c1`, `_c2`, `_c3`. No crest, number or lettering: the game adds those |
| `casual_<nn>_<view>` | 64x96 | 4 | **12 outfits** (Decision 77): 01 hoodie and jeans, 02 flannel and jeans, 03 track suit, 04 work clothes, 05 shorts and sandals, 06 winter coat, 07 plain T-shirt and jeans, 08 polo shirt and chinos, 09 hockey warm-up suit, 10 denim jacket, 11 night-out clothing, 12 sweatshirt and sweatpants | For off-ice scenes. `_c1`, `_c2` |
| `tee_<nn>_<view>` | 64x96 | 4 | The championship T-shirts of batch 19 (winter, summer and the others), same numbers as their inventory art | A blank shirt shape per cut plus the printed design as a `_fixed` layer, so a year or division can be added by the game. No baked text |
| Thumbnails for every pickable item: `<asset id>_thumb` | 32x32 | - | one each | For lists. Final colours on transparent |

Not requested again because it exists and is usable: flags (16.08), skin tone ramps (16.05), preset portraits (16.02, 16.02B, kept as quick-pick presets), attribute icons (16.09), interface kit (16.11).

## 5. Acceptance checks the game will run on delivery

Every file is exactly its canvas size; alpha is only 0 or 255; recolourable layers contain only the six grey values; a layer stacked on the base at `[0, 0]` lines up with no offset; every asset has all its views, or declares a mirror; every id in the manifest has a file and every file an id; the `average` body composited with any head, hair and uniform stays inside the 16.01 silhouette by no more than 2 px.

## 6. Manifest

```json
{
  "batch": "<number>", "version": 1,
  "canvas": { "body": [64, 96], "portrait": [64, 64], "thumb": [32, 32] },
  "anchor": { "body": [32, 95], "portrait": [32, 63] },
  "assets": [
    { "id": "hair_05", "group": "hair", "source": "16.03 hair_05",
      "files": { "front": "hair_05_front.png", "right": "hair_05_right.png", "rear": "hair_05_rear.png", "left": { "mirrorOf": "right" }, "portrait": "hair_05_portrait.png", "thumb": "hair_05_thumb.png" },
      "recolor": "hair", "fixed": null }
  ]
}
```
