#!/usr/bin/env python3
"""Build src/dynasty/data/influences.ts from the curated registry.

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
CURATED = os.path.join(ROOT, 'data', 'influences', 'curated.tsv')
ALIASES = os.path.join(ROOT, 'data', 'influences', 'aliases.json')
REFERENCE = os.path.join(ROOT, 'data', 'reference', 'nhl_players.csv')
OUT = os.path.join(ROOT, 'src', 'dynasty', 'data', 'influences.ts')

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
    errors = []
    with open(REFERENCE, encoding='utf-8', errors='replace') as fh:
        people = list(csv.DictReader(fh))
    by_name = {}
    for person in people:
        by_name.setdefault(norm(person['Player']), []).append(person)
    aliases = json.load(open(ALIASES)) if os.path.exists(ALIASES) else {}

    out = []
    seen = set()
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
        matches = [p for p in by_name.get(norm(name), []) if p['Birthday'].startswith(born)]
        if len(matches) != 1:
            errors.append(f'{ident} {name} ({born}): {len(matches)} matches in the reference file')
            continue
        person = matches[0]
        position = POSITION[person['Position']]
        if POSITION.get(ident[0]) != position:
            errors.append(f'{ident} {name}: id says {ident[0]} but the reference file says {person["Position"]}')
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
        if norm(name.split()[-1]) in norm(blurb):
            errors.append(f'{ident}: the blurb names the player')
        out.append({
            'id': ident,
            'name': person['Player'],
            'alias': aliases.get(ident),
            'referenceId': person['PlayerID'],
            'position': position,
            'born': int(person['Birthday'][:4]),
            'country': person['Nationality'],
            'shoots': person['ShootsCatches'] or None,
            'heightIn': int(person['Height']) if person['Height'] else None,
            'weightLb': int(person['Weight']) if person['Weight'] else None,
            'tags': [t.strip() for t in tags.split(',') if t.strip()],
            'weights': weights,
            'blurb': blurb,
        })
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        sys.exit(1)

    body = ',\n'.join('  ' + json.dumps(entry, ensure_ascii=True) for entry in out)
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write('// GENERATED by scripts/data/build_influences.py from data/influences/curated.tsv. Do not edit by hand.\n')
        fh.write("import type { InfluenceRecord } from '../influences';\n\n")
        fh.write(f'export const INFLUENCE_DATA: readonly InfluenceRecord[] = [\n{body},\n];\n')
    # The wider registry (Decision 53): everyone in the reference file who is not curated.
    # One packed line each: NHL id | name | F, D or G | birth year | country | f (finisher), p (playmaker) or empty.
    # No statistics are written: the only fact taken from the statistics is the tendency letter.
    tendencies = {}
    tpath = os.path.join(ROOT, 'data', 'influences', 'derived_tendencies.tsv')
    if os.path.exists(tpath):
        for line in open(tpath, encoding='utf-8'):
            if line.strip() and not line.startswith('#'):
                pid, tag = line.split()
                tendencies[pid] = tag[0]
    curated_ids = {e['referenceId'] for e in out}
    packed = []
    for person in sorted(people, key=lambda q: (norm(q['Player'].split(' ')[-1]), norm(q['Player']), q['PlayerID'])):
        if person['PlayerID'] in curated_ids or '|' in person['Player']:
            continue
        letter = '' if person['Position'] == 'G' else tendencies.get(person['PlayerID'], '')
        packed.append('|'.join([person['PlayerID'], person['Player'], person['Position'], person['Birthday'][:4], person['Nationality'], letter]))
    with open(os.path.join(os.path.dirname(OUT), 'influencesExtended.ts'), 'w', encoding='utf-8') as fh:
        fh.write('// GENERATED by scripts/data/build_influences.py from data/reference/nhl_players.csv and data/influences/derived_tendencies.tsv. Do not edit by hand.\n')
        fh.write('// One line per person: NHL id | name | F, D or G | birth year | country | f, p or empty.\n')
        fh.write('export const EXTENDED_INFLUENCE_LINES: string = ' + json.dumps('\n'.join(packed), ensure_ascii=False) + ';\n')
    print(f'Extended influences: {len(packed)}  with a tendency: {sum(1 for l in packed if l[-1] in "fp" and l[-2] == "|")}')
    counts = {p: sum(1 for e in out if e['position'] == p) for p in ('forward', 'defense', 'goalie')}
    print(f'Influences: {len(out)}  {counts}  aliases: {sum(1 for e in out if e["alias"])}')


if __name__ == '__main__':
    main()
