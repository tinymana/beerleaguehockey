#!/usr/bin/env python3
"""Pack the batch 16.10 card illustrations (the 144x96 "_art" crops, Large size) into one atlas, pixels unchanged.
Package ids AR08..AR18 are the evolved archetypes in registry order; they are filed under the stable registry ids AR20..AR30.
Run: python3 -I scripts/art/ingest_cards.py   (reads art/character_packages/BLH_Batch_16_10.zip; runs nothing from it)"""
import io, json, os, zipfile
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art', 'character_packages', 'BLH_Batch_16_10.zip')
OUT = os.path.join(ROOT, 'public', 'assets', 'cards', '16_10')
W, H, COLS = 144, 96, 8
def stable(name):
    if name.startswith('archetype_AR'):
        n = int(name[12:])
        return f'AR{n:02d}' if n <= 7 else f'AR{n + 12:02d}'
    if name.startswith('style_PS'): return name[6:]
    return {'card_silhouette_f': 'silhouette_forward', 'card_silhouette_d': 'silhouette_defense', 'card_silhouette_g': 'silhouette_goalie'}.get(name)
os.makedirs(OUT, exist_ok=True)
frames, images = {}, []
with zipfile.ZipFile(SRC) as z:
    for entry in sorted(z.namelist()):
        if not entry.startswith('L/') or not entry.endswith('.png'): continue
        base = entry[2:-4]
        ident = stable(base[:-4]) if base.endswith('_art') else stable(base) if base.startswith('card_silhouette') else None
        if not ident: continue
        im = Image.open(io.BytesIO(z.read(entry))).convert('RGBA')
        if im.size != (W, H): raise SystemExit(f'{entry}: expected {W}x{H}, found {im.size}')
        images.append((ident, im))
rows = (len(images) + COLS - 1) // COLS
atlas = Image.new('RGBA', (COLS * W, rows * H), (0, 0, 0, 0))
for k, (ident, im) in enumerate(images):
    x, y = (k % COLS) * W, (k // COLS) * H
    atlas.paste(im, (x, y))
    frames[ident] = [x, y, W, H]
atlas.save(os.path.join(OUT, 'card_art.png'))
with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump({'batch': '16.10', 'atlas': 'card_art.png', 'frames': frames}, f, indent=1); f.write('\n')
print('card art:', len(frames), 'frames ->', OUT, sorted(frames)[:4], '...')
