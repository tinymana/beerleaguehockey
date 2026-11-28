#!/usr/bin/env python3
"""Stopgap crowd: cut the 64 fans from the Nov 28 concept sheet and reduce them to 16x24 (Decision 100).

The sheet is an image-generator JPEG on magenta with the fans about 26x46 art pixels each, on an even
8x8 grid. The creative director approved reducing them as a stopgap until fans arrive at true size.
Output: public/assets/crowd/fans_16x24.png, 8 columns x 8 rows of 16x24 cells, bottom-centre anchored.

Run:  BLH_ART_DIR=<external art folder> python3 -I scripts/art/process_fans.py     (needs scipy)
The sheet is read as data only.
"""
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
ART = Path(os.environ.get('BLH_ART_DIR', ROOT / 'art'))
SHEET = ART / 'packages' / 'BLH_fans_sheet_nov28.jpg'
OUT = ROOT / 'public' / 'assets' / 'crowd' / 'fans_16x24.png'
CELL = (16, 24)
GRID = (8, 8)


def is_magenta(c: np.ndarray, loose: bool) -> np.ndarray:
    lo, hi = (140, 120) if loose else (170, 110)
    return (c[:, :, 0] > lo) & (c[:, :, 2] > lo) & (c[:, :, 1] < hi)


def main() -> int:
    if not SHEET.exists():
        print(f'missing {SHEET}: set BLH_ART_DIR to the external art folder', file=sys.stderr)
        return 1
    sheet = Image.open(SHEET).convert('RGB')
    a = np.asarray(sheet).astype(int)
    # Part A, the fans, is the left 41% of the sheet under its painted title.
    top, right = 90, int(sheet.width * 0.41)
    solid = ~is_magenta(a[top:, :right], loose=False)
    labels, _ = ndi.label(ndi.binary_closing(solid, iterations=2))
    boxes = []
    for s in ndi.find_objects(labels):
        w, h = s[1].stop - s[1].start, s[0].stop - s[0].start
        if w <= 60 or h <= 120:
            continue
        x, y = s[1].start, s[0].start + top
        # Two neighbours whose arms touch come out as one piece: split it down the middle.
        boxes += [(x, y, w // 2, h), (x + w // 2, y, w - w // 2, h)] if w > 180 else [(x, y, w, h)]
    boxes.sort(key=lambda b: b[1] + b[3] / 2)
    rows: list[list[tuple[int, int, int, int]]] = []
    for b in boxes:
        centre = b[1] + b[3] / 2
        if rows and abs(sum(r[1] + r[3] / 2 for r in rows[-1]) / len(rows[-1]) - centre) < 80:
            rows[-1].append(b)
        else:
            rows.append([b])
    if [len(r) for r in rows] != [GRID[0]] * GRID[1]:
        print(f'expected {GRID[1]} rows of {GRID[0]} fans, found {[len(r) for r in rows]}', file=sys.stderr)
        return 1
    atlas = Image.new('RGBA', (CELL[0] * GRID[0], CELL[1] * GRID[1]), (0, 0, 0, 0))
    for ry, row in enumerate(rows):
        for rx, (x, y, w, h) in enumerate(sorted(row)):
            c = np.asarray(sheet.crop((x, y, x + w, y + h)).convert('RGBA')).copy()
            c[is_magenta(c, loose=True), 3] = 0
            fan = Image.fromarray(c)
            k = min(CELL[0] / fan.width, CELL[1] / fan.height)
            small = fan.resize((max(1, round(fan.width * k)), max(1, round(fan.height * k))), Image.LANCZOS)
            s = np.asarray(small).copy()
            # Hard edges: every pixel fully there or fully clear.
            s[:, :, 3] = np.where(s[:, :, 3] > 110, 255, 0)
            s[s[:, :, 3] == 0] = 0
            piece = Image.fromarray(s)
            atlas.paste(piece, (rx * CELL[0] + (CELL[0] - piece.width) // 2, ry * CELL[1] + CELL[1] - piece.height), piece)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT, optimize=True)
    print(f'wrote {OUT.relative_to(ROOT)} {atlas.size[0]}x{atlas.size[1]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
