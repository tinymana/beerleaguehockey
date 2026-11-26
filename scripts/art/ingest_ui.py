#!/usr/bin/env python3
"""Copy the batch 16.11 interface atlas and its manifest into public/assets/ui/16_11/, unchanged.
Run: python3 -I scripts/art/ingest_ui.py   (reads art/character_packages/BLH_Batch_16_11.zip; runs nothing from it)"""
import json, os, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def art_dir():
    """Where the master art packages are kept: outside the repository (Decision 77).
    Set BLH_ART_DIR to that folder; it must contain packages/ and character_packages/.
    With nothing set, an untracked art/ folder beside the code is used, so the scripts still run on a machine that keeps them there."""
    import os as _os
    return _os.environ.get('BLH_ART_DIR') or _os.path.join(ROOT, 'art')

SRC = os.path.join(art_dir(), 'character_packages', 'BLH_Batch_16_11.zip')
OUT = os.path.join(ROOT, 'public', 'assets', 'ui', '16_11')
os.makedirs(OUT, exist_ok=True)
with zipfile.ZipFile(SRC) as z:
    manifest = json.loads(z.read('manifest.json'))
    with open(os.path.join(OUT, manifest['atlas']), 'wb') as f:
        f.write(z.read(manifest['atlas']))
    keep = {'batch': manifest['batch'], 'atlas': manifest['atlas'], 'nineSliceInsets': manifest['nineSliceInsets'],
            'frames': {a['id']: a['atlasRect'] for a in manifest['assets']}}
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(keep, f, indent=1); f.write('\n')
print('interface kit:', len(keep['frames']), 'frames ->', OUT)
