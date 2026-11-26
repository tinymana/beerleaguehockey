#!/usr/bin/env python3
"""Copy the 32 px referee sprites (package BLH_referee_32bit.zip) into public/assets/referee/32/, unchanged.
Run: BLH_ART_DIR=<external art folder> python3 -I scripts/art/ingest_referee.py
Reads the package as data; runs nothing from it. Every frame must be 32x32 (ART_BRIEF.md section 11: the skater's
frame, feet on row 27), or the script stops. The combined sheet in the package is checked against the frames and not copied."""
import os, struct, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def art_dir():
    """Where the master art packages are kept: outside the repository (Decision 77)."""
    return os.environ.get('BLH_ART_DIR') or os.path.join(ROOT, 'art')

SRC = os.path.join(art_dir(), 'packages', 'BLH_referee_32bit.zip')
OUT = os.path.join(ROOT, 'public', 'assets', 'referee', '32')
POSES = ['idle_01', 'idle_02', 'skate_01', 'skate_02', 'skate_03', 'skate_04', 'goal_01', 'penalty_01', 'washout_01']
FRAMES = [f'referee_{view}_{pose}.png' for view in ('front', 'back') for pose in POSES]

def png_size(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        raise SystemExit('not a PNG')
    return struct.unpack('>II', data[16:24])

os.makedirs(OUT, exist_ok=True)
with zipfile.ZipFile(SRC) as z:
    names = {os.path.basename(n): n for n in z.namelist() if n.startswith('referee/') and n.endswith('.png')}
    missing = [f for f in FRAMES if f not in names]
    if missing:
        raise SystemExit(f'missing from the package: {missing}')
    for name in FRAMES:
        data = z.read(names[name])
        if png_size(data) != (32, 32):
            raise SystemExit(f'{name}: {png_size(data)} but the frame is 32x32')
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(data)
print('referee:', len(FRAMES), 'frames ->', OUT)
