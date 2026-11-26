#!/usr/bin/env python3
"""Copy the 32 px scale goal sprites (package BLH_goals_40x32.zip) into public/assets/goals/32/, unchanged.
Run: BLH_ART_DIR=<external art folder> python3 -I scripts/art/ingest_goals.py
Reads the package and its manifest as data; runs nothing from it. Checks every file's size against the specification
(ART_BRIEF.md section 11) and stops if one is wrong, because the game places these sprites by fixed anchors."""
import io, json, os, struct, sys, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def art_dir():
    """Where the master art packages are kept: outside the repository (Decision 77)."""
    return os.environ.get('BLH_ART_DIR') or os.path.join(ROOT, 'art')

SRC = os.path.join(art_dir(), 'packages', 'BLH_goals_40x32.zip')
OUT = os.path.join(ROOT, 'public', 'assets', 'goals', '32')
EXPECTED = {'goal_north.png': (40, 32), 'goal_south.png': (40, 32), 'peg_marks.png': (40, 8)}
# Checked but not copied: only art the game uses is committed (Decision 75). Dislodged goals are not a mechanic yet.
NOT_USED_YET = {'peg_marks.png'}
for end in ('north', 'south'):
    for i in range(1, 5):
        EXPECTED[f'goal_{end}_ripple_{i:02d}.png'] = (40, 32)

def png_size(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        raise SystemExit('not a PNG')
    return struct.unpack('>II', data[16:24])

os.makedirs(OUT, exist_ok=True)
with zipfile.ZipFile(SRC) as z:
    names = {os.path.basename(n): n for n in z.namelist() if n.startswith('goals/') and n.endswith('.png')}
    missing = sorted(set(EXPECTED) - set(names))
    if missing:
        raise SystemExit(f'missing from the package: {missing}')
    for name, size in sorted(EXPECTED.items()):
        data = z.read(names[name])
        if png_size(data) != size:
            raise SystemExit(f'{name}: {png_size(data)} but the specification says {size}')
        if name in NOT_USED_YET:
            continue
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(data)
print('goals:', len(EXPECTED) - len(NOT_USED_YET), 'files ->', OUT)
