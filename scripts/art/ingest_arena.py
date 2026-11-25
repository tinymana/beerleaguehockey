"""Ingest Beer League Hockey arena asset packages into the game.

Reads every art/packages/BLH_Batch_*.zip, validates the production PNGs,
copies them (original filenames, untouched pixels) under public/assets/arena/
and writes the central registry the game and the Arena Asset Lab load:

    public/assets/arena/manifests/registry.json

Repeatable: drop new packages into art/packages/ and run

    npm run assets:ingest          (python3 scripts/art/ingest_arena.py)

Nothing is drawn, recolored, resized or invented here. Problems are reported
in the registry's `issues` list and on the console, never silently fixed.
Requires Python 3 with Pillow and NumPy (developer machine only).
"""
import hashlib
import json
import os
import re
import shutil
import sys
import zipfile

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
PACKAGES = os.path.join(ROOT, 'art', 'packages')
OUT = os.path.join(ROOT, 'public', 'assets', 'arena')
SLOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'arena_slots.json')
TILE = 8

# Where each batch lives under public/assets/arena/. Later batches are routed by number.
CATEGORY = {
    '09.01': 'ice/base',
    '09.02': 'ice/scratches',
    '09.03': 'ice/reflections',
    '09.13': 'ice/logos',
    '09': 'ice/markings',
    '10.05': 'boards/corners',
    '10.06': 'boards/corners',
    '10.07': 'boards/corners',
    '10.08': 'boards/corners',
    '10.09': 'glass',
    '10.10': 'glass',
    '10.11': 'boards/kickplates',
    '10.12': 'boards/gates',
    '10.13': 'boards/ads',
    '10.14': 'glass',
    '10': 'boards/straight',
    '11': 'goals',
    '12': 'benches',
    '13': 'stadium',
    '14': 'equipment',
}
PRESENTATION = re.compile(r'(preview|presentation|sheet|contact)', re.I)


def category_for(batch):
    return CATEGORY.get(batch) or CATEGORY.get(batch.split('.')[0]) or 'unsorted'


def pixel_hash(arr):
    return hashlib.sha1(arr.tobytes() + str(arr.shape).encode()).hexdigest()[:16]


def looks_like_baked_checkerboard(arr):
    """A 'transparent' image exported with the grey editor checkerboard painted in."""
    if arr.shape[0] < 32 or arr.shape[1] < 32 or (arr[..., 3] < 255).any():
        return False
    rgb = arr[..., :3].astype(int)
    grey = (abs(rgb[..., 0] - rgb[..., 1]) < 6) & (abs(rgb[..., 1] - rgb[..., 2]) < 6) & (rgb[..., 0] > 170)
    if grey.mean() < 0.25:
        return False
    values = np.unique(rgb[..., 0][grey] // 8)
    return 2 <= len(values) <= 4


def main():
    issues = []
    assets = []
    batches = {}
    seen_hash = {}
    seen_name = {}

    def issue(level, message, batch=None, asset=None):
        issues.append({'level': level, 'batch': batch, 'asset': asset, 'message': message})

    packages = sorted(f for f in os.listdir(PACKAGES) if re.match(r'BLH_Batch_.*\.zip$', f))
    if not packages:
        print('No packages found in art/packages/')
        return 1

    # Rebuild generated folders from scratch so removed packages do not linger.
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'manifests'))

    for package in packages:
        with zipfile.ZipFile(os.path.join(PACKAGES, package)) as zf:
            names = [i.filename for i in zf.infolist() if not i.is_dir()]
            unsafe = [n for n in names if n.startswith('/') or '..' in n.split('/')]
            if unsafe:
                issue('error', f'{package}: unsafe paths, package skipped: {unsafe}')
                continue
            if 'manifest.json' not in names:
                issue('error', f'{package}: no manifest.json, package skipped')
                continue
            manifest = json.loads(zf.read('manifest.json'))
            batch = str(manifest.get('batch') or package[len('BLH_Batch_'):-4].replace('_', '.'))
            category = category_for(batch)
            if category == 'unsorted':
                issue('warn', f'No folder rule for batch {batch}; filed under unsorted/', batch)
            if batch in batches:
                issue('error', f'{package}: batch {batch} already supplied by {batches[batch]["package"]}; skipped', batch)
                continue

            notes_file = None
            for doc in ('CLAUDE.md', 'README.md'):
                if doc in names:
                    notes_file = f'manifests/{batch}.notes.md'
                    with open(os.path.join(OUT, notes_file), 'wb') as fh:
                        fh.write(zf.read(doc))
                    break
            with open(os.path.join(OUT, 'manifests', f'{batch}.manifest.json'), 'w') as fh:
                json.dump(manifest, fh, indent=2)

            tile_entries = {}
            for i, t in enumerate(manifest.get('tiles', [])):
                if isinstance(t, dict) and 'file' in t:
                    tile_entries[os.path.basename(t['file'])] = t.get('index', i)
                elif isinstance(t, list):  # rows of file names
                    for j, f in enumerate(t):
                        tile_entries[os.path.basename(f)] = i * len(t) + j
            # Multi-asset manifests list tiles per asset, with no atlas-wide index.
            loose_tiles = set()

            def collect(node, inside_tiles=False):
                if isinstance(node, str):
                    if inside_tiles and node.endswith('.png'):
                        loose_tiles.add(os.path.basename(node))
                elif isinstance(node, list):
                    for item in node:
                        collect(item, inside_tiles)
                elif isinstance(node, dict):
                    for key, value in node.items():
                        collect(value, inside_tiles or key == 'tiles')

            for key in ('assets', 'entries', 'frames'):
                collect(manifest.get(key))
            # Animation frames: whole-frame files that are also cells of one of the batch's strips.
            # 'file' sits in the goal atlas; 'net' and 'bottle' layers sit in their own strips.
            frame_entries = {}
            strip_for = {'file': manifest.get('atlas'), 'net': manifest.get('netAtlas'),
                         'bottle': manifest.get('bottleAtlas'), 'bottleLayer': manifest.get('bottleAtlas')}
            for frame in manifest.get('frames') or []:
                if not isinstance(frame, dict) or not isinstance(frame.get('atlasRect'), list):
                    continue
                for key, strip in strip_for.items():
                    if strip and isinstance(frame.get(key), str):
                        frame_entries[os.path.basename(frame[key])] = (os.path.basename(strip), frame['atlasRect'][0], frame['atlasRect'][1])
            loose_tiles -= set(tile_entries)
            atlas_name = os.path.basename(manifest['atlas']) if manifest.get('atlas') else None
            composites = set()
            for key in ('composite', 'dot'):
                if manifest.get(key):
                    composites.add(os.path.basename(manifest[key]))
            for value in (manifest.get('layers') or {}).values():
                if isinstance(value, str) and value.endswith('.png'):
                    composites.add(os.path.basename(value))
            declared = set(tile_entries) | loose_tiles | composites | set(frame_entries) | ({atlas_name} if atlas_name else set())
            listed_previews = manifest.get('previewOnly') or []
            preview_only = {os.path.basename(p) for p in ([listed_previews] if isinstance(listed_previews, str) else listed_previews)}

            batch_assets = []
            empty_pieces = repeated_pieces = 0
            pngs = [n for n in names if n.lower().endswith('.png')]
            present = {os.path.basename(n) for n in pngs}
            for missing in sorted(declared - present):
                issue('error', f'Manifest names {missing} but the package does not contain it', batch)

            for name in sorted(pngs):
                base = os.path.basename(name)
                if base in preview_only or PRESENTATION.search(base):
                    issue('info', f'{base}: presentation image, excluded from the game', batch)
                    continue
                try:
                    with zf.open(name) as fh:
                        image = Image.open(fh)
                        image.load()
                except Exception as error:  # noqa: BLE001
                    issue('error', f'{base}: not a readable PNG ({error})', batch)
                    continue
                arr = np.array(image.convert('RGBA'))
                height, width = arr.shape[:2]
                asset_id = f'{batch}/{base[:-4]}'
                role = ('atlas' if base == atlas_name else 'tile' if base in tile_entries or base in loose_tiles
                        else 'frame' if base in frame_entries else 'composite' if base in composites else 'module')
                ok = True
                if width % TILE or height % TILE:
                    issue('error', f'{base}: {width}x{height} is not a multiple of {TILE}; rejected', batch, asset_id)
                    ok = False
                if role == 'tile' and (width, height) != (TILE, TILE):
                    issue('error', f'{base}: tile is {width}x{height}, expected {TILE}x{TILE}; rejected', batch, asset_id)
                    ok = False
                if image.mode not in ('RGBA', 'LA', 'PA') and 'transparency' not in image.info:
                    issue('warn', f'{base}: no alpha channel ({image.mode})', batch, asset_id)
                if looks_like_baked_checkerboard(arr):
                    issue('error', f'{base}: transparency checkerboard is painted into the image; rejected', batch, asset_id)
                    ok = False
                if not ok:
                    continue

                alpha = arr[..., 3]
                ys, xs = np.nonzero(alpha > 0)
                bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None
                piece = role in ('tile', 'frame')  # pieces of a larger image: summarised per batch, not one note each
                if bbox is None:
                    if piece:
                        empty_pieces += 1
                    else:
                        issue('info', f'{base}: fully transparent (an intentionally empty tile)', batch, asset_id)
                digest = pixel_hash(arr)
                rel = f'{category}/{batch}/{base}'
                os.makedirs(os.path.dirname(os.path.join(OUT, rel)), exist_ok=True)
                with open(os.path.join(OUT, rel), 'wb') as fh:
                    fh.write(zf.read(name))  # original bytes, untouched

                entry = {
                    'id': asset_id,
                    'batch': batch,
                    'name': base,
                    'file': rel,
                    'width': width,
                    'height': height,
                    'role': role,
                    'alpha': 'opaque' if (alpha == 255).all() else 'binary' if ((alpha == 0) | (alpha == 255)).all() else 'soft',
                    'bbox': bbox,
                    'hash': digest,
                }
                if role == 'tile' and base in tile_entries:
                    entry['tileIndex'] = int(tile_entries[base])
                if role == 'atlas':
                    entry['columns'] = width // TILE
                    entry['rows'] = height // TILE
                if digest in seen_hash and bbox is not None:
                    entry['duplicateOf'] = seen_hash[digest]
                    if piece:
                        repeated_pieces += 1
                    else:
                        issue('info', f'{base}: identical pixels to {seen_hash[digest]}', batch, asset_id)
                else:
                    seen_hash.setdefault(digest, asset_id)
                if base in seen_name and seen_name[base][1] != digest:
                    issue('info', f'{base}: same filename as {seen_name[base][0]} with different pixels; kept apart by batch folder', batch, asset_id)
                seen_name.setdefault(base, (asset_id, digest))
                batch_assets.append((entry, arr))
                assets.append(entry)

            # The atlas must agree with the individual tiles it claims to hold.
            atlas = next(((e, a) for e, a in batch_assets if e['role'] == 'atlas'), None)
            if atlas:
                entry, arr = atlas
                cols = entry['columns']
                for tile, tile_arr in ((e, a) for e, a in batch_assets if e['role'] == 'tile' and 'tileIndex' in e):
                    idx = tile['tileIndex']
                    cx, cy = (idx % cols) * TILE, (idx // cols) * TILE
                    if cy + TILE > arr.shape[0] or not (arr[cy:cy + TILE, cx:cx + TILE] == tile_arr).all():
                        issue('warn', f'{tile["name"]}: differs from atlas cell {idx}', batch, tile['id'])
                    else:
                        tile['atlasX'], tile['atlasY'] = cx, cy
                # Tiles listed without an index: find where each sits in the atlas, so tools can show it from there.
                for tile, tile_arr in ((e, a) for e, a in batch_assets if e['role'] == 'tile' and 'tileIndex' not in e):
                    for cy in range(0, arr.shape[0] - TILE + 1, TILE):
                        hit = next((cx for cx in range(0, arr.shape[1] - TILE + 1, TILE)
                                    if (arr[cy:cy + TILE, cx:cx + TILE] == tile_arr).all()), None)
                        if hit is not None:
                            tile['atlasX'], tile['atlasY'] = hit, cy
                            break
            elif tile_entries:
                issue('warn', 'Tiles supplied without an atlas', batch)

            # Each animation frame must match its cell in the strip it is drawn from.
            by_name = {e['name']: (e, a) for e, a in batch_assets}
            for frame, frame_arr in ((e, a) for e, a in batch_assets if e['role'] == 'frame'):
                strip_name, fx, fy = frame_entries[frame['name']]
                strip = by_name.get(strip_name)
                h, w = frame_arr.shape[:2]
                if not strip:
                    issue('error', f'{frame["name"]}: its strip {strip_name} is missing', batch, frame['id'])
                elif fy + h > strip[1].shape[0] or fx + w > strip[1].shape[1] or not (strip[1][fy:fy + h, fx:fx + w] == frame_arr).all():
                    issue('warn', f'{frame["name"]}: differs from {strip_name} at {fx},{fy}', batch, frame['id'])
                else:
                    frame['atlas'] = strip[0]['id']
                    frame['atlasX'], frame['atlasY'] = fx, fy

            if empty_pieces or repeated_pieces:
                issue('info', f'{repeated_pieces} tile or frame files repeat pixels found elsewhere and {empty_pieces} are intentionally empty; '
                              'each is marked in its registry entry', batch)

            batches[batch] = {
                'package': package,
                'category': category,
                'notes': notes_file,
                'manifest': f'manifests/{batch}.manifest.json',
                'name': manifest.get('name'),
                'assetCount': len(batch_assets),
            }

    # Cross-batch checks the art direction calls for.
    by_id = {a['id']: a for a in assets}

    def pixels(asset_id):
        return np.array(Image.open(os.path.join(OUT, by_id[asset_id]['file'])).convert('RGBA'))

    if '09.10/crease_north' in by_id and '09.11/crease_south' in by_id:
        mirrored = (pixels('09.10/crease_north')[::-1] == pixels('09.11/crease_south')).all()
        issue('info' if mirrored else 'warn',
              'North and south creases are exact vertical mirrors' if mirrored else 'North and south creases are NOT mirror images',
              '09.11')
    if '10.01/west_board_module' in by_id:
        module = pixels('10.01/west_board_module')
        half = module.shape[0] // 2
        if (module[:half] == module[half:]).all():
            issue('info', f'West board module repeats cleanly every {half} px (its two halves are identical)', '10.01')

    # Slots the arena needs, and whether art has arrived for each.
    with open(SLOTS) as fh:
        slots = json.load(fh)['slots']
    for slot in slots:
        wanted = slot.get('assets', [])
        have = [a for a in wanted if a in by_id]
        slot['status'] = 'supplied' if wanted and len(have) == len(wanted) else 'missing'
        if slot['status'] == 'supplied' and slot.get('provisional'):
            slot['status'] = 'provisional'
        if slot['status'] == 'supplied' and slot.get('unfit'):
            slot['status'] = 'unfit'
            issue('warn', f'Art does not fit: {slot["label"]}. {slot["unfit"]}')
        if slot['status'] == 'missing':
            issue('warn', f'Missing art: {slot["label"]} (expected in batch {slot.get("expectedBatch", "?")})')

    registry = {
        'generatedBy': 'scripts/art/ingest_arena.py',
        'tileSize': TILE,
        'batches': dict(sorted(batches.items())),
        'assets': sorted(assets, key=lambda a: a['id']),
        'slots': slots,
        'issues': issues,
    }
    with open(os.path.join(OUT, 'manifests', 'registry.json'), 'w') as fh:
        json.dump(registry, fh, indent=1)

    levels = {level: sum(1 for i in issues if i['level'] == level) for level in ('error', 'warn', 'info')}
    print(f'Packages: {len(batches)}   Assets registered: {len(assets)}   '
          f'Errors: {levels["error"]}   Warnings: {levels["warn"]}   Notes: {levels["info"]}')
    for i in issues:
        if i['level'] != 'info':
            print(f'  [{i["level"]}] {i["message"]}')
    print('Slots:', ', '.join(f'{s["id"]}={s["status"]}' for s in slots))
    return 1 if levels['error'] else 0


if __name__ == '__main__':
    sys.exit(main())
