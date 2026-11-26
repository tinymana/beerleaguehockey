#!/usr/bin/env python3
"""Copy the batch 16 character atlases into public/assets/character/, pixels unchanged, and write
src/dynasty/data/appearanceCatalog.ts (ids and data only) plus one frame manifest for the game.
Run: python3 -I scripts/art/ingest_character.py   (reads art/character_packages/*.zip; runs nothing from them)

Excluded on purpose (Decision 49): equipment categories whose thumbnails carry real manufacturer branding."""
import json, os, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def art_dir():
    """Where the master art packages are kept: outside the repository (Decision 77).
    Set BLH_ART_DIR to that folder; it must contain packages/ and character_packages/.
    With nothing set, an untracked art/ folder beside the code is used, so the scripts still run on a machine that keeps them there."""
    import os as _os
    return _os.environ.get('BLH_ART_DIR') or _os.path.join(ROOT, 'art')

SRC = os.path.join(art_dir(), 'character_packages')
OUT = os.path.join(ROOT, 'public', 'assets', 'character')
BRANDED_CATEGORIES = {'helmet', 'glove', 'gloves', 'helmets'}
PACKAGES = [  # zip, key, class
    ('BLH_Batch_16_01_Final.zip', 'model', 'production'),
    ('BLH_Batch_16_02_Revised.zip', 'face', 'preset'),
    ('BLH_Batch_16_02B.zip', 'bald', 'preset'),
    ('BLH_Batch_16_03.zip', 'hair', 'reference'),
    ('BLH_Batch_16_04.zip', 'beard', 'reference'),
    ('BLH_Batch_16_06.zip', 'body', 'reference'),
    ('BLH_Batch_16_07.zip', 'equipment', 'reference'),
    ('BLH_Batch_16_08.zip', 'flag', 'production'),
]
def clear_wedge(sheet, rect):
    """Clear the near-white region that touches the ice between the feet of one 64x96 frame, if there is a real one."""
    x0, y0, w, h = rect
    px = sheet.load()
    white = lambda p: p[3] == 255 and min(p[:3]) >= 232
    opaque_rows = [y for y in range(h) for x in range(w) if px[x0 + x, y0 + y][3] == 255]
    if not opaque_rows: return 0
    bottom = max(opaque_rows)
    stack = [(x, y) for y in range(bottom - 6, bottom + 1) for x in range(24, 40) if white(px[x0 + x, y0 + y])]
    seen, region = set(), []
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y))
        if not white(px[x0 + x, y0 + y]): continue
        region.append((x, y)); stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    ys = [y for _, y in region]
    if len(region) < 60 or max(ys) - min(ys) < 12: return 0
    for x, y in region: px[x0 + x, y0 + y] = (0, 0, 0, 0)
    return len(region)


os.makedirs(OUT, exist_ok=True)
frames, catalog = {}, {}
for name, key, cls in PACKAGES:
    with zipfile.ZipFile(os.path.join(SRC, name)) as z:
        m = json.loads(z.read('manifest.json'))
        atlas = m['atlas'] if isinstance(m['atlas'], str) else m['atlas'].get('file')
        if key == 'model':
            # Decision 78: the wedge-corrected frames are the alignment baseline. The supplied front and rear frames
            # have a near-white leftover between the legs; that one region is made transparent, nothing else.
            import io
            from PIL import Image
            sheet = Image.open(io.BytesIO(z.read(atlas))).convert('RGBA')
            for a in m['assets']:
                clear_wedge(sheet, a['atlasRect'])
            sheet.save(os.path.join(OUT, f'{key}.png'))
        else:
            with open(os.path.join(OUT, f'{key}.png'), 'wb') as f:
                f.write(z.read(atlas))
        items = []
        for a in m['assets']:
            ident = a.get('id') or a.get('alpha3') or os.path.splitext(a['file'])[0]
            category = a.get('category', key)
            if key == 'equipment' and category in BRANDED_CATEGORIES:
                continue
            frames[f'{key}:{ident}'] = [key] + list(a['atlasRect'])
            item = {'id': ident}
            if key == 'flag': item.update(name=a['name'], code=a['code'])
            if key in ('equipment', 'hair'): item['category'] = category
            items.append(item)
        catalog[key] = {'class': cls, 'batch': m.get('batch', ''), 'items': items}
# Attribute icons (batch 16.09 V2): the 32 px atlas, unchanged.
with zipfile.ZipFile(os.path.join(SRC, 'BLH_Batch_16_09_V2.zip')) as z:
    m = json.loads(z.read('manifest.json'))
    with open(os.path.join(OUT, 'icons.png'), 'wb') as f:
        f.write(z.read(m['atlas32']))
    for a in m['assets']:
        frames[f"icon:{a['id']}"] = ['icons'] + list(a['rect32'])
    catalog['icon'] = {'class': 'production', 'batch': m.get('batch', ''), 'items': [{'id': a['id']} for a in m['assets']]}
with zipfile.ZipFile(os.path.join(SRC, 'BLH_Batch_16_05.zip')) as z:
    m = json.loads(z.read('manifest.json'))
    catalog['skin'] = {'class': 'data', 'batch': m.get('batch', ''), 'items': [{'id': a['id'], 'colors': a['colors']} for a in m['assets']]}
with open(os.path.join(OUT, 'frames.json'), 'w', encoding='utf-8') as f:
    json.dump({'frames': frames}, f, separators=(',', ':')); f.write('\n')
with open(os.path.join(ROOT, 'src', 'dynasty', 'data', 'appearanceCatalog.ts'), 'w', encoding='utf-8') as f:
    f.write('// GENERATED by scripts/art/ingest_character.py from the batch 16 package manifests. Do not edit by hand.\n')
    f.write('// Ids and data only. "class" says how far the art goes: production, preset, reference (not drawn on the player), data.\n')
    f.write('export const APPEARANCE_CATALOG = ' + json.dumps(catalog, ensure_ascii=False, indent=1) + ' as const;\n')
for k, v in catalog.items(): print(k, v['class'], len(v['items']), [i['id'] for i in v['items'][:3]])
print('equipment categories kept:', sorted({i['category'] for i in catalog['equipment']['items']}), '| hair categories:', sorted({i['category'] for i in catalog['hair']['items']}))
