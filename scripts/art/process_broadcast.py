#!/usr/bin/env python3
"""
Stopgap: bring three of the supplied broadcast graphics (art batch 01, Retro_Hockey_HUD_Sprite_Sheet)
down to game size, the same way the skater and goalie sheets were: cut out, reduce, hard alpha, a small palette.

    art/source/generated-batch-01/Retro_Hockey_HUD_Sprite_Sheet.png  ->  public/assets/ui/broadcast/*.png

These are temporary. The creative director ruled that the presentation graphics are re-issued at game sizes
(Decision 86); these three stand in until then so that goals, faceoffs and power plays have a graphic. They are the
ones with no sample text painted in. The scorebug, penalty tags, panels and player lines need the re-issue.

Usage: python3 scripts/art/process_broadcast.py   (needs numpy, scipy, pillow)
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/source/generated-batch-01/Retro_Hockey_HUD_Sprite_Sheet.png'
OUT = ROOT / 'public/assets/ui/broadcast'
# Reading order on the sheet (rows top to bottom, left to right) -> output name and width in game pixels.
WANTED = {4: ('goal_splash', 150), 10: ('tag_power_play', 84), 11: ('tag_faceoff', 84)}
COLOURS = 28

im = Image.open(SRC).convert('RGBA')
a = np.array(im)
labels, _ = ndimage.label(ndimage.binary_dilation(a[..., 3] > 60, iterations=6))
parts = []
for sl in ndimage.find_objects(labels):
    y, x = sl
    if (y.stop - y.start) * (x.stop - x.start) < 8000:
        continue
    parts.append((x.start, y.start, x.stop, y.stop))
parts.sort(key=lambda b: (round(b[1] / 150), b[0]))
print(len(parts), 'graphics on the sheet')
OUT.mkdir(parents=True, exist_ok=True)
for index, (name, width) in WANTED.items():
    part = im.crop(parts[index])
    height = round(part.height * width / part.width)
    small = part.resize((width, height), Image.LANCZOS)
    px = np.array(small)
    solid = px[..., 3] >= 128
    rgb = Image.fromarray(px[..., :3]).quantize(COLOURS, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    out = np.dstack([np.array(rgb), np.where(solid, 255, 0).astype(np.uint8)])
    out[~solid] = 0
    Image.fromarray(out, 'RGBA').save(OUT / f'{name}.png')
    print(name, (width, height), 'from', part.size)
