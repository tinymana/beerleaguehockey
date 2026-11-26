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

**Known fault to fix in the base, not to copy:** the 16.01 skater and goalie have an opaque grey wedge between the legs. Layers must not include it, and a corrected base with that area transparent is welcome (`skater_<view>` and `goalie_<view>`, same names, same size).

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

## 3. Colour replacement

Anything the game recolours is supplied as a **greyscale layer plus nothing else**: the game maps five grey levels to a colour ramp.

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
| `glove_<nn>_<role>_<view>` | 64x96 | 4 | 8, unbranded; skater and goalie (blocker and catcher) | `_c1`, `_c2` |
| `protection_<nn>_<view>` and `_portrait` | 64x96, 64x64 | 4 + portrait | The 8 of batch 16.07 (cages, visors) | Fits over every helmet |
| `stick_<nn>_<role>_<view>` | 64x96 | 4, both hands: `_L` and `_R` | The 8 of batch 16.07 | Left- and right-handed grips are different drawings |
| `skate_<nn>_<role>_<view>`, `sock_<nn>_<view>` | 64x96 | 4 | The 8 each of batch 16.07 | Socks: `_c1`, `_c2` |
| `accessory_<nn>_<view>` | 64x96 or 64x64 | as needed | The 8 of batch 16.07 | |
| `uniform_jersey_<view>`, `uniform_pants_<view>` | 64x96 | 4 | 1 cut each to start; skater and goalie | `_c1`, `_c2`, `_c3`. No crest, number or lettering: the game adds those |
| `casual_<nn>_<view>` | 64x96 | 4 | 6 outfits: hoodie and jeans, flannel, track suit, work clothes, shorts and sandals, winter coat | For off-ice scenes. `_c1`, `_c2` |
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
