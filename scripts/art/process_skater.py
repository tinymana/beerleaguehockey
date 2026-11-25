"""Turn the supplied high-resolution skater sheet into a game-resolution sprite sheet.

Input : art/source/generated-batch-01/Retro_Hockey_Player_Sprite_Sheet.png
        (10 poses x 5 directions, uneven rows, anti-aliased, baked shadows)
Output: public/assets/skater_base.png  (10 x 5 cells of CELL x CELL, feet at FEET)

Each figure is cut out, scaled by one shared factor, aligned so its skates sit on
the same point in every cell, hard-edged, and reduced to a small shared palette.
Run from the repository root:  python3 scripts/art/process_skater.py
"""
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = 'art/source/generated-batch-01/Retro_Hockey_Player_Sprite_Sheet.png'
OUT = 'public/assets/skater_base.png'
COLS, CELL, FEET = 10, 48, (24, 40)
SPILL = 24              # source pixels a stick may reach into the next column
SCALE = 0.2255          # source pixels -> game pixels
COLORS = 28

src = Image.open(SRC).convert('RGBA')
a = np.array(src)
opaque = a[..., 3] > 128

# Rows are uneven in the source: find them from the empty bands between figures.
filled = opaque.sum(1) > 0
bands, start = [], None
for y, on in enumerate(filled):
    if on and start is None:
        start = y
    if not on and start is not None:
        if y - start > 40:
            bands.append((start, y))
        start = None
if start is not None:
    bands.append((start, len(filled)))
assert len(bands) == 5, bands
col_w = src.width / COLS

sheet = Image.new('RGBA', (COLS * CELL, len(bands) * CELL), (0, 0, 0, 0))
for r, (y0, y1) in enumerate(bands):
    for c in range(COLS):
        x0 = max(0, round(c * col_w) - SPILL)
        x1 = min(src.width, round((c + 1) * col_w) + SPILL)
        cell = a[y0:y1, x0:x1].copy()
        # Keep only this cell's figure: the largest connected shape. Drops bits of neighbours.
        labels, count = ndimage.label(cell[..., 3] > 128, structure=np.ones((3, 3)))
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, count + 1))
        cell[labels != (int(np.argmax(sizes)) + 1)] = 0
        op = cell[..., 3] > 128
        ys, xs = np.nonzero(op)
        top, bottom, left, right = ys.min(), ys.max(), xs.min(), xs.max()
        # Feet: dark skate and outline pixels near the bottom (ignores pale shadow and spray).
        lum = cell[..., :3].mean(2)
        band = op & (lum < 70)
        band[: bottom - int((bottom - top) * 0.14)] = False
        fx = np.nonzero(band)[1].mean() if band.any() else (left + right) / 2
        fy = bottom - 5
        crop = Image.fromarray(cell[top:bottom + 1, left:right + 1])
        w, h = max(1, round(crop.width * SCALE)), max(1, round(crop.height * SCALE))
        small = crop.resize((w, h), Image.LANCZOS)
        px = FEET[0] - round((fx - left) * SCALE)
        py = FEET[1] - round((fy - top) * SCALE)
        tile = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
        tile.alpha_composite(small, (max(0, px), max(0, py)), (max(0, -px), max(0, -py)))
        sheet.alpha_composite(tile, (c * CELL, r * CELL))

# Hard edges and a small shared palette, so it reads as pixel art at game size.
arr = np.array(sheet)
solid = arr[..., 3] >= 110
rgb = Image.fromarray(arr[..., :3]).quantize(COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
out = np.dstack([np.array(rgb), np.where(solid, 255, 0).astype(np.uint8)])
out[~solid] = 0
Image.fromarray(out, 'RGBA').save(OUT)
print('wrote', OUT, sheet.size, 'rows', bands)
