#!/usr/bin/env python3
"""Build src/dynasty/data/curatedInfluences.ts from the curated registry.

Reads data/influences/curated.tsv (hand-written style profiles) and, for the facts a
profile does not carry (position, shooting side, birthday, country, height, weight),
data/reference/nhl_players.csv. The CSV is reference data: it is read here, at
development time, and is never shipped or read by the game.

Fails loudly on anything it cannot resolve. Run: npm run data:influences
"""
import csv
import json
import os
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CURATED = os.path.join(ROOT, 'data', 'private', 'authoring', 'curated.tsv')  # private authoring file (Decision 77)
ALIASES = os.path.join(ROOT, 'data', 'influences', 'aliases.json')
REFERENCE = os.path.join(ROOT, 'data', 'private', 'reference', 'nhl_players.csv')  # private, optional
OUT = os.path.join(ROOT, 'src', 'dynasty', 'data', 'curatedInfluences.ts')

SKATER = {'spd': 'skatingSpeed', 'acc': 'acceleration', 'agi': 'agility', 'bal': 'balance', 'end': 'endurance',
          'wsp': 'wristShotPower', 'wsa': 'wristShotAccuracy', 'ssp': 'slapShotPower', 'ssa': 'slapShotAccuracy',
          'pas': 'passing', 'puc': 'puckControl', 'ofa': 'offensiveAwareness', 'dfa': 'defensiveAwareness',
          'chk': 'checking', 'str': 'strength', 'dis': 'discipline', 'fo': 'faceoffs', 'dur': 'durability',
          'ldr': 'leadership', 'com': 'composure', 'iq': 'hockeyIQ'}
GOALIE = {'ref': 'reflexes', 'pos': 'positioning', 'glv': 'gloveHand', 'blk': 'blocker', 'pad': 'padSaves',
          'reb': 'reboundControl', 'rec': 'recovery', 'han': 'puckHandling',
          'agi': 'agility', 'bal': 'balance', 'end': 'endurance', 'str': 'strength', 'dur': 'durability',
          'dis': 'discipline', 'ldr': 'leadership', 'com': 'composure', 'iq': 'hockeyIQ'}
POSITION = {'F': 'forward', 'D': 'defense', 'G': 'goalie'}


def norm(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower().strip()


def main():
    """The curated registry is built from data/influences/curated.tsv alone, so it never needs or carries outside data.
    When the private biographical file is present (development machines only) it is used to cross-check the curated
    names, and a wider registry is written to public/private/, which is git-ignored and left out of site builds."""
    if not os.path.exists(CURATED):
        print('The curated authoring file is kept in private storage (data/private/authoring/curated.tsv) and is not present.')
        print('Nothing to rebuild: the committed src/dynasty/data/curatedInfluences.ts is the registry the game uses.')
        return
    errors = []
    people = []
    if os.path.exists(REFERENCE):
        with open(REFERENCE, encoding='utf-8', errors='replace') as fh:
            people = list(csv.DictReader(fh))
    by_name = {}
    for person in people:
        by_name.setdefault(norm(person['Player']), []).append(person)
    aliases = json.load(open(ALIASES)) if os.path.exists(ALIASES) else {}

    out = []
    seen = set()
    curated_refs = set()
    for number, line in enumerate(open(CURATED, encoding='utf-8'), 1):
        if not line.strip() or line.startswith('#'):
            continue
        cols = line.rstrip('\n').split('\t')
        if len(cols) != 8:
            errors.append(f'line {number}: expected 8 tab-separated columns, found {len(cols)}')
            continue
        ident, name, born, tags, signature, strong, weak, blurb = (c.strip() for c in cols)
        if ident in seen:
            errors.append(f'{ident}: duplicate id')
        seen.add(ident)
        position = POSITION.get(ident[0])
        if position is None or not born.isdigit():
            errors.append(f'{ident}: the id must start with F, D or G and the birth year must be a number')
            continue
        if people:
            matches = [p for p in by_name.get(norm(name), []) if p['Birthday'].startswith(born)]
            if len(matches) != 1:
                errors.append(f'{ident} {name} ({born}): {len(matches)} matches in the private reference file')
            else:
                curated_refs.add(matches[0]['PlayerID'])
                if POSITION[matches[0]['Position']] != position:
                    errors.append(f'{ident} {name}: id says {ident[0]} but the reference file says {matches[0]["Position"]}')
        table = GOALIE if position == 'goalie' else SKATER
        weights = {}
        for codes, value in ((signature, 2), (strong, 1), (weak, -1)):
            for code in codes.split():
                if code not in table:
                    errors.append(f'{ident} {name}: unknown attribute code "{code}" for a {position}')
                elif table[code] in weights:
                    errors.append(f'{ident} {name}: "{code}" listed twice')
                else:
                    weights[table[code]] = value
        if not (2 <= len(signature.split()) <= 3 and 2 <= len(strong.split()) <= 5 and 2 <= len(weak.split()) <= 3):
            errors.append(f'{ident} {name}: needs 2-3 signature, 2-5 strong and 2-3 weak attributes')
        if ident not in aliases:
            errors.append(f'{ident}: no fictional alias in data/influences/aliases.json')
            continue
        if norm(name.split()[-1]) in norm(blurb):
            errors.append(f'{ident}: the blurb names the player')
        out.append({
            # Decision 74: the game shows the fictional identity everywhere. The real name stays in curated.tsv only.
            'id': ident, 'name': aliases[ident], 'alias': aliases[ident], 'referenceId': '', 'position': position, 'born': int(born),
            'country': '', 'shoots': None, 'heightIn': None, 'weightLb': None,
            'tags': [t.strip() for t in tags.split(',') if t.strip()], 'weights': weights, 'blurb': blurb,
        })
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        sys.exit(1)

    body = ',\n'.join('  ' + json.dumps(entry, ensure_ascii=False) for entry in out)
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write('// GENERATED by scripts/data/build_influences.py from data/influences/curated.tsv alone. Do not edit by hand.\n')
        fh.write("import type { InfluenceRecord } from '../influences';\n\n")
        fh.write(f'export const INFLUENCE_DATA: readonly InfluenceRecord[] = [\n{body},\n];\n')
    counts = {p: sum(1 for e in out if e['position'] == p) for p in ('forward', 'defense', 'goalie')}
    print(f'Curated influences: {len(out)}  {counts}  aliases: {sum(1 for e in out if e["alias"])}')

    if not people:
        print('Private reference data not present: the game uses its fictional fallback for the wider registry.')
        return
    tendencies = {}
    tpath = os.path.join(ROOT, 'data', 'private', 'derived_tendencies.tsv')
    if os.path.exists(tpath):
        for line in open(tpath, encoding='utf-8'):
            if line.strip() and not line.startswith('#'):
                pid, tag = line.split()
                tendencies[pid] = tag[0]
    packed = []
    for person in sorted(people, key=lambda q: (norm(q['Player'].split(' ')[-1]), norm(q['Player']), q['PlayerID'])):
        if person['PlayerID'] in curated_refs or '|' in person['Player']:
            continue
        letter = '' if person['Position'] == 'G' else tendencies.get(person['PlayerID'], '')
        packed.append('|'.join([person['PlayerID'], person['Player'], person['Position'], person['Birthday'][:4], person['Nationality'], letter]))
    private_out = os.path.join(ROOT, 'public', 'private')
    os.makedirs(private_out, exist_ok=True)
    with open(os.path.join(private_out, 'influences_wider.txt'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(packed) + '\n')
    print(f'Private wider registry: {len(packed)} people, {sum(1 for l in packed if l.endswith(("|f", "|p")))} with a tendency -> public/private/ (git-ignored, not in site builds)')


if __name__ == '__main__':
    main()
