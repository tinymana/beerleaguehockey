#!/usr/bin/env python3
"""
Make 32x32 portraits for the ice from the 64x64 preset faces (creative director, Nov 26: "64 can be 32").

    public/assets/character/face.png (6 x 4 faces of 64 px, batch 16.02)  ->  public/assets/character/face32.png

Each face is halved exactly (2 source pixels to 1) and brought to a small palette, so it sits beside the pixel font.
The grey studio background is kept: it frames the head inside the card's portrait window.

Usage: python3 -I scripts/art/process_faces32.py   (needs pillow)
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/character/face.png'
OUT = ROOT / 'public/assets/character/face32.png'
CELL, HALF, COLOURS = 64, 32, 40

sheet = Image.open(SRC).convert('RGB')
cols, rows = sheet.width // CELL, sheet.height // CELL
out = Image.new('RGB', (cols * HALF, rows * HALF))
for r in range(rows):
    for c in range(cols):
        face = sheet.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
        small = face.resize((HALF, HALF), Image.BOX).quantize(COLOURS, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
        out.paste(small, (c * HALF, r * HALF))
out.save(OUT)
print(cols * rows, 'faces ->', OUT, out.size)
