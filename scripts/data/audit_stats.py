#!/usr/bin/env python3
"""Development-time audit of the NHL career statistics files against the biographical file.

The raw statistics are kept out of the repository (licence pending): data/private/ is git-ignored.
Reads   data/private/nhl_stats/SKATERS.csv, GOALIES.csv   (raw, private)
        data/reference/nhl_players.csv, data/influences/curated.tsv
        data/influences/reconciliation_decisions.tsv      (a person's rulings on doubtful matches, optional)
Writes  data/private/derived/stat_matches.tsv      every statistics record with its match status (private: restates the raw data)
        data/private/derived/stat_review.tsv       conflicts and ambiguities with their candidates (private)
        data/private/derived/reconciliation.tsv    the worklist: every unmerged record with suggested people (private)
        data/influences/derived_tendencies.tsv     NHL id and tendency only: the one derived fact the game uses
        data/derived/sample_profiles.json, curated_comparison.tsv   small review samples
Run: python3 -I scripts/data/audit_stats.py
"""
import csv, json, os, sys, unicodedata, collections, bisect

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(ROOT, *a)

def norm(name):
    s = unicodedata.normalize('NFKD', name)
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = s.replace('ø', 'o').replace('æ', 'ae').replace('ß', 'ss').replace('ł', 'l').replace('đ', 'd')
    return ''.join(c for c in s if c.isalnum())

def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))

def num(v):
    v = (v or '').strip()
    return float(v) if v != '' else None  # missing stays unknown, never zero

ERAS = [(1917, 1942, 'early (1918-42)'), (1943, 1967, 'original six (1943-67)'), (1968, 1979, 'expansion (1968-79)'),
        (1980, 1993, 'high scoring (1980-93)'), (1994, 2005, 'dead puck (1994-2005)'), (2006, 2100, 'modern (2006-25)')]
def era(first, last):
    mid = (first + last) / 2
    return next(label for lo, hi, label in ERAS if lo <= mid < hi + 1)

def group(pos):
    """Statistics positions are free text (C, LW, RW, D, W, F and mixtures). D only if D is the first listed."""
    p = pos.replace(' ', '').upper()
    return 'D' if p.split('/')[0].split('-')[0] == 'D' else 'F'

bio = read(P('data/private/reference/nhl_players.csv'))
by_name = collections.defaultdict(list)
for b in bio:
    by_name[norm(b['Player'])].append(b)

skaters = read(P('data/private/nhl_stats/SKATERS.csv'))
goalies = read(P('data/private/nhl_stats/GOALIES.csv'))
records = []
for kind, rows in (('skater', skaters), ('goalie', goalies)):
    for i, r in enumerate(rows):
        records.append({'kind': kind, 'row': i + 2, 'name': r['name'], 'first': int(r['first']), 'last': int(r['last']),
                        'group': 'G' if kind == 'goalie' else group(r['position']), 'pos': r.get('position', 'G'), 'raw': r})
name_count = collections.Counter((norm(r['name'])) for r in records)

def plausible(rec, b):
    """Does a career starting and ending in these years fit this birthday? Returns None when the birthday is missing."""
    y = (b['Birthday'] or '')[:4]
    if not y.isdigit(): return None
    y = int(y)
    return 16 <= rec['first'] - y <= 33 and rec['last'] - y <= 53

def position_ok(rec, b):
    return b['Position'] == rec['group']

for rec in records:
    cands = by_name.get(norm(rec['name']), [])
    fits = [b for b in cands if plausible(rec, b) is not False and position_ok(rec, b)]
    strong = [b for b in cands if plausible(rec, b) is True and position_ok(rec, b)]
    same_name_stats = name_count[norm(rec['name'])]
    if not cands:
        rec['status'], rec['why'] = 'unmatched', 'no biographical record with this name'
    elif same_name_stats == 1 and len(cands) == 1 and strong:
        rec['status'], rec['why'], rec['bio'] = 'matched', 'unique name, position and career years agree', strong[0]
    elif len(strong) == 1 and same_name_stats == 1:
        rec['status'], rec['why'], rec['bio'] = 'matched-by-evidence', f'{len(cands)} people share the name; only one fits position and years', strong[0]
    elif len(strong) == 1 and same_name_stats > 1:
        rec['status'], rec['why'], rec['bio'] = 'matched-by-evidence', f'name appears {same_name_stats} times in the statistics; this record is the only one fitting this person', strong[0]
    elif len(cands) == 1 and not strong:
        b = cands[0]
        bits = []
        if not position_ok(rec, b): bits.append(f"position {rec['pos']} vs {b['Position']}")
        pl = plausible(rec, b)
        if pl is False: bits.append(f"career {rec['first']}-{rec['last']} vs born {b['Birthday'][:4]}")
        if pl is None: bits.append('no birthday on file')
        rec['status'], rec['why'] = 'conflict', '; '.join(bits)
    else:
        rec['status'], rec['why'] = 'ambiguous', f'{len(cands)} biographical candidates, {len(strong)} fit; {same_name_stats} statistics records share the name'
# a person's rulings: file, name, first, last, player_id (or 'none' to say this record has no biographical row)
by_id = {b['PlayerID']: b for b in bio}
dpath = P('data/private/reconciliation_decisions.tsv')
decided = 0
if os.path.exists(dpath):
    with open(dpath, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip(): continue
            kind, name, first, last, pid = [c.strip() for c in line.rstrip('\n').split('\t')[:5]]
            for rec in records:
                if rec['kind'] == kind and rec['name'] == name and str(rec['first']) == first and str(rec['last']) == last:
                    rec.pop('bio', None)
                    if pid in by_id: rec['status'], rec['why'], rec['bio'] = 'matched-by-decision', 'ruled by a person', by_id[pid]
                    else: rec['status'], rec['why'] = 'unmatched', 'ruled by a person: no biographical record'
                    decided += 1
# two statistics records must never claim the same person
claims = collections.defaultdict(list)
for rec in records:
    if 'bio' in rec: claims[rec['bio']['PlayerID']].append(rec)
for pid, rs in claims.items():
    if len(rs) > 1:
        for rec in rs:
            if rec['status'] == 'matched-by-decision': continue
            rec['status'], rec['why'] = 'ambiguous', f'{len(rs)} statistics records fit the same person (id {pid})'
            del rec['bio']

os.makedirs(P('data/derived'), exist_ok=True); os.makedirs(P('data/private/derived'), exist_ok=True)
with open(P('data/private/derived/stat_matches.tsv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f, delimiter='\t', lineterminator='\n')
    w.writerow(['file', 'row', 'name', 'first', 'last', 'position', 'status', 'player_id', 'reason'])
    for rec in records:
        w.writerow([rec['kind'], rec['row'], rec['name'], rec['first'], rec['last'], rec['pos'], rec['status'], rec.get('bio', {}).get('PlayerID', ''), rec['why']])
with open(P('data/private/derived/stat_review.tsv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f, delimiter='\t', lineterminator='\n')
    w.writerow(['file', 'row', 'name', 'first', 'last', 'position', 'games', 'status', 'reason', 'candidates (id:position:born)'])
    for rec in records:
        if rec['status'] in ('ambiguous', 'conflict'):
            c = ' | '.join(f"{b['PlayerID']}:{b['Position']}:{b['Birthday']}" for b in by_name.get(norm(rec['name']), []))
            w.writerow([rec['kind'], rec['row'], rec['name'], rec['first'], rec['last'], rec['pos'], rec['raw']['games'], rec['status'], rec['why'], c])

# ---------- proposed leanings (review only) ----------
K = 82  # games of league-average play mixed in: small samples count for less
def pct(sorted_vals, v):
    return bisect.bisect_right(sorted_vals, v) / len(sorted_vals) if sorted_vals else 0.5

pools = collections.defaultdict(list)
for rec in records:
    if rec['kind'] != 'skater': continue
    g, a, gp = num(rec['raw']['goals']), num(rec['raw']['assists']), num(rec['raw']['games'])
    rec['gp'] = gp or 0
    rec['era'] = era(rec['first'], rec['last'])
    pools[(rec['group'], rec['era'])].append(rec)
for key, rs in pools.items():
    tg = sum(num(r['raw']['goals']) for r in rs); ta = sum(num(r['raw']['assists']) for r in rs); tgp = sum(r['gp'] for r in rs) or 1
    mg, ma = tg / tgp, ta / tgp
    for r in rs:
        r['g_rate'] = (num(r['raw']['goals']) + K * mg) / (r['gp'] + K)
        r['a_rate'] = (num(r['raw']['assists']) + K * ma) / (r['gp'] + K)
        r['share'] = r['g_rate'] / (r['g_rate'] + r['a_rate']) if r['g_rate'] + r['a_rate'] else 0.5
    regs = [r for r in rs if r['gp'] >= 100]
    sp = sorted(r['g_rate'] + r['a_rate'] for r in regs); ss = sorted(r['share'] for r in regs)
    for r in rs:
        r['points_pct'] = pct(sp, r['g_rate'] + r['a_rate']); r['share_pct'] = pct(ss, r['share'])
        r['raw_gpg'] = num(r['raw']['goals']) / r['gp'] if r['gp'] else None
        r['raw_apg'] = num(r['raw']['assists']) / r['gp'] if r['gp'] else None
        t, gpn = num(r['raw']['time']), r['gp']
        # 'time' is total minutes on the ice, recorded only from the 1997-98 season on: a per-game figure is valid only for careers that began after that
        r['toi'] = t / gpn if t is not None and gpn and r['first'] >= 1998 else None

gpools = collections.defaultdict(list)
for rec in records:
    if rec['kind'] != 'goalie': continue
    rec['gp'] = num(rec['raw']['games']) or 0; rec['era'] = era(rec['first'], rec['last'])
    gpools[rec['era']].append(rec)
for key, rs in gpools.items():
    ta = sum(num(r['raw']['assists']) for r in rs); tgp = sum(r['gp'] for r in rs) or 1
    for r in rs:
        r['a_rate'] = (num(r['raw']['assists']) + 200 * ta / tgp) / (r['gp'] + 200)
        sv, ga = num(r['raw']['saves']), num(r['raw']['conceded'])
        r['svpct'] = sv / (sv + ga) if sv is not None and ga is not None and sv + ga > 0 else None
        mins = num(r['raw']['minutes'])
        r['gaa'] = ga * 60 / mins if mins else None
    regs = sorted(r['a_rate'] for r in rs if r['gp'] >= 100)
    for r in rs: r['assist_pct'] = pct(regs, r['a_rate'])

def classify(rec):
    """Confidence class and proposed leanings. Leanings only where the record measures the thing directly."""
    merged = rec['status'] in ('matched', 'matched-by-evidence', 'matched-by-decision')
    if rec['kind'] == 'skater':
        enough, some = rec['gp'] >= 400, rec['gp'] >= 100
        lean, tag = {}, None
        if some and rec['points_pct'] >= 0.60:
            if rec['share_pct'] >= 0.75: lean, tag = {'offensiveAwareness': 2, 'wristShotAccuracy': 1}, 'finisher'
            elif rec['share_pct'] <= 0.25: lean, tag = {'passing': 2, 'offensiveAwareness': 1}, 'playmaker'
            elif rec['points_pct'] >= 0.85: lean, tag = {'offensiveAwareness': 2, 'passing': 1}, 'scorer'
    else:
        enough, some = rec['gp'] >= 200, rec['gp'] >= 60
        lean, tag = ({'puckHandling': 2}, 'puck handler') if some and rec['assist_pct'] >= 0.85 else ({}, None)
    if not merged: cls = 'D unmerged (not selectable until a person resolves the match)'
    elif enough and lean: cls = 'A data-derived'
    elif some and lean: cls, lean = 'B limited-data', {k: 1 for k in list(lean)[:1]}
    else: cls, lean, tag = 'C neutral (no measured tendency)', {}, None
    return cls, lean, tag

for rec in records: rec['class'], rec['lean'], rec['tag'] = classify(rec)

curated = {}
with open(P('data/influences/curated.tsv'), encoding='utf-8') as f:
    for line in f:
        if line.startswith('#') or not line.strip(): continue
        c = line.rstrip('\n').split('\t')
        curated[norm(c[1])] = {'id': c[0], 'tags': c[3], 'signature': c[4], 'strong': c[5], 'weak': c[6]}

def profile(rec):
    out = {'name': rec['name'], 'years': f"{rec['first']}-{rec['last']}", 'position': rec['pos'], 'era': rec['era'], 'games': int(rec['gp']),
           'match': rec['status'], 'class': rec['class'], 'tag': rec['tag'], 'leanings': rec['lean']}
    if rec['kind'] == 'skater':
        out.update(goals=int(num(rec['raw']['goals'])), assists=int(num(rec['raw']['assists'])),
                   points_percentile=round(rec['points_pct'] * 100), goal_share_percentile=round(rec['share_pct'] * 100),
                   minutes_per_game=round(rec['toi'], 1) if rec['toi'] else None)
    else:
        out.update(assists=int(num(rec['raw']['assists'])), assist_percentile=round(rec['assist_pct'] * 100),
                   save_pct=round(rec['svpct'], 3) if rec['svpct'] else None, goals_against_avg=round(rec['gaa'], 2) if rec['gaa'] else None)
    cu = curated.get(norm(rec['name']))
    if cu: out['curated'] = cu
    return out

SAMPLES = sys.argv[1:] or []
index = collections.defaultdict(list)
for rec in records: index[norm(rec['name'])].append(rec)
samples = [profile(r) for n in SAMPLES for r in index.get(norm(n), [])]
allp = {'note': 'Proposed leanings for review. Not read by the game.', 'samples': samples}
with open(P("data/private/derived/sample_profiles.json"), 'w', encoding='utf-8') as f:
    json.dump(allp, f, indent=1, ensure_ascii=False); f.write('\n')

# ---------- the one derived fact the game uses (Decision 53): finisher or playmaker, merged skaters only ----------
with open(P('data/private/derived_tendencies.tsv'), 'w', encoding='utf-8', newline='') as f:
    f.write('# GENERATED by scripts/data/audit_stats.py. NHL player id and tendency. finisher: one mild offensive awareness leaning; playmaker: one mild passing leaning.\n')
    rows_t = sorted((int(r['bio']['PlayerID']), r['tag']) for r in records if 'bio' in r and r['kind'] == 'skater' and r['tag'] in ('finisher', 'playmaker'))
    for pid, tag in rows_t: f.write(f'{pid}\t{tag}\n')
print('derived tendencies written', len(rows_t), dict(collections.Counter(t for _, t in rows_t)), '| decisions applied', decided)

# ---------- reconciliation worklist ----------
taken = {r['bio']['PlayerID'] for r in records if 'bio' in r}
free = [b for b in bio if b['PlayerID'] not in taken]
def surname(n): return norm(n.split(' ')[-1])
free_by_surname = collections.defaultdict(list)
for b in free: free_by_surname[surname(b['Player'])].append(b)
with open(P('data/private/derived/reconciliation.tsv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f, delimiter='\t', lineterminator='\n')
    w.writerow(['file', 'name', 'first', 'last', 'position', 'games', 'status', 'reason', 'suggested (id:name:position:born), best first', 'DECISION player_id or none'])
    todo = [r for r in records if r['status'] in ('unmatched', 'conflict', 'ambiguous')]
    with_suggestion = 0
    for rec in sorted(todo, key=lambda r: (-float(r['raw']['games']), r['name'])):
        if rec['status'] == 'unmatched':
            cands = [b for b in free_by_surname.get(surname(rec['name']), []) if position_ok(rec, b) and plausible(rec, b)]
        else:
            cands = [b for b in by_name.get(norm(rec['name']), [])]
        cands.sort(key=lambda b: abs((rec['first'] - int(b['Birthday'][:4])) - 21))
        with_suggestion += bool(cands)
        w.writerow([rec['kind'], rec['name'], rec['first'], rec['last'], rec['pos'], rec['raw']['games'], rec['status'], rec['why'],
                    ' | '.join(f"{b['PlayerID']}:{b['Player']}:{b['Position']}:{b['Birthday'][:4]}" for b in cands[:4]), ''])
print('reconciliation worklist', len(todo), 'records;', with_suggestion, 'have a suggested person;', sum(1 for r in todo if r['status'] == 'unmatched' and len([b for b in free_by_surname.get(surname(r['name']), []) if position_ok(r, b) and plausible(r, b)]) == 1), 'unmatched have exactly one')

# ---------- validated reconciliation (Decision 65): nothing here is applied; a person accepts or rejects ----------
ALIASES = [set(g.split()) for g in [
    'mike michael mikael', 'bill billy william will', 'bob bobby rob robbie robert', 'jim jimmy james', 'tony anthony', 'alex alexander alexandre alexei aleksander',
    'matt matthew mathew matty', 'max maxime maxim', 'dave david', 'steve steven stephen stephane', 'tom tommy thomas', 'joe joey joseph', 'chris christopher christian',
    'nick nicholas nicklas niklas nicolas nik', 'zach zack zachary', 'jake jacob jakob', 'ben benjamin', 'dan danny daniel', 'ed eddie edward edouard', 'fred freddie frederick fredrik frederic',
    'greg gregory', 'jeff jeffrey', 'ken kenny kenneth', 'larry lawrence', 'rick ricky richard dick', 'ron ronnie ronald', 'sam sammy samuel', 'tim timothy', 'andy andrew andrei',
    'pat patrick', 'pete peter', 'don donnie donald', 'cam cameron', 'josh joshua', 'jon jonathan john johnny', 'phil philip phillip', 'gerry gerald jerry', 'ted teddy theodore',
    'vinny vaclav', 'mitch mitchell', 'nate nathan', 'pj paul', 'tj timothy', 'jt john', 'gus gustav', 'hank henry', 'art arthur', 'al allan alan albert', 'charlie charles chuck', 'doug douglas',
    'marty martin', 'wally walter walt', 'lou louis', 'stan stanley', 'vic victor viktor', 'evgeni evgeny yevgeni', 'sergei sergey', 'dmitri dmitry', 'alexei alexey', 'nikolai nikolay']]
def given(n): return norm(n.split(' ')[0])
def given_related(a, b):
    a, b = given(a), given(b)
    if a == b: return 'same given name'
    if len(a) >= 3 and len(b) >= 3 and (a.startswith(b) or b.startswith(a)): return 'short form'
    if any(a in g and b in g for g in ALIASES): return 'known alias'
    return None
def lev1(a, b):
    if abs(len(a) - len(b)) > 1: return False
    if len(a) == len(b): return sum(x != y for x, y in zip(a, b)) <= 1
    if len(a) > len(b): a, b = b, a
    return any(a == b[:i] + b[i + 1:] for i in range(len(b)))
def debut_age(rec, b): return rec['first'] - int(b['Birthday'][:4])

results = []
claims2 = collections.defaultdict(list)
for rec in todo:
    cls, why, cand = 'unresolved', 'no candidate in the biographical file', None
    if rec['status'] == 'unmatched':
        same = [b for b in free_by_surname.get(surname(rec['name']), []) if position_ok(rec, b) and plausible(rec, b)]
        near = [] if same else [b for b in free if position_ok(rec, b) and plausible(rec, b) and given(b['Player']) == given(rec['name']) and lev1(surname(b['Player']), surname(rec['name']))]
        if len(same) == 1:
            cand = same[0]; rel = given_related(rec['name'], cand['Player']); age = debut_age(rec, cand)
            if rel and 17 <= age <= 30: cls, why = 'high', f'same surname, {rel}, position agrees, debut at {age}, the only candidate'
            elif rel: cls, why = 'review', f'same surname, {rel}, but debut at {age} is unusual'
            else: cls, why = 'review', f'same surname and plausible years, but the given names are unrelated ({rec["name"].split(" ")[0]} / {cand["Player"].split(" ")[0]})'
        elif len(same) > 1:
            rel = [b for b in same if given_related(rec['name'], b['Player'])]
            cand = rel[0] if len(rel) == 1 else None
            cls, why = 'review', f'{len(same)} people share the surname and fit; {len(rel)} with a related given name'
        elif len(near) == 1:
            cand = near[0]; cls, why = 'review', f'same given name, surname differs by one letter (transliteration?): {cand["Player"]}'
        elif len(near) > 1: cls, why = 'review', f'{len(near)} near-spelling candidates'
    elif rec['status'] == 'conflict':
        b = by_name[norm(rec['name'])][0]; cand = b
        if plausible(rec, b) is False:
            age = debut_age(rec, b)
            if age < 14 or age > 45: cls, why, cand = 'rejected', f'same name but born {b["Birthday"][:4]}: a different person (career {rec["first"]}-{rec["last"]}). The record stays unresolved', None
            else: cls, why = 'review', f'same name; debut at {debut_age(rec, b)} is outside the usual range'
        else: cls, why = 'review', f'same name and years; position differs ({rec["pos"]} against {b["Position"]})'
    else:
        cls, why = 'review', rec['why']
    results.append((rec, cls, why, cand))
    if cls == 'high': claims2[cand['PlayerID']].append(rec)
final = []
for rec, cls, why, cand in results:
    if cls == 'high' and len(claims2[cand['PlayerID']]) > 1:
        cls, why = 'review', f'{len(claims2[cand["PlayerID"]])} statistics records point at the same person (id {cand["PlayerID"]})'
    final.append((rec, cls, why, cand))
with open(P('data/private/derived/reconciliation_validated.tsv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f, delimiter='\t', lineterminator='\n')
    w.writerow(['class', 'file', 'name', 'first', 'last', 'position', 'games', 'candidate_id', 'candidate_name', 'candidate_position', 'candidate_born', 'reason'])
    order = {'high': 0, 'review': 1, 'rejected': 2, 'unresolved': 3}
    for rec, cls, why, cand in sorted(final, key=lambda t: (order[t[1]], -float(t[0]['raw']['games']))):
        w.writerow([cls, rec['kind'], rec['name'], rec['first'], rec['last'], rec['pos'], rec['raw']['games']] + ([cand['PlayerID'], cand['Player'], cand['Position'], cand['Birthday'][:4]] if cand else ['', '', '', '']) + [why])
counts = collections.Counter(c for _, c, _, _ in final)
print('validated reconciliation', dict(counts))
high = [(r, w, c) for r, cls, w, c in final if cls == 'high']
kinds = collections.Counter(('same given name' if 'same given name' in w else 'short form' if 'short form' in w else 'known alias') for _, w, _ in high)
print('high-confidence by evidence', dict(kinds))
step = max(1, len(high) // 14)
print('SPOT-CHECK (every %dth high-confidence match, by career length):' % step)
for r, w, c in sorted(high, key=lambda t: -float(t[0]['raw']['games']))[::step][:14]:
    print(f"  {r['name']} ({r['pos']}, {r['first']}-{r['last']}, {r['raw']['games']} GP) -> {c['Player']} ({c['Position']}, born {c['Birthday'][:4]}) | {w.split(', ')[1]}")
weak = [(r, w, c) for r, w, c in high if debut_age(r, c) in (17, 29, 30) or float(r['raw']['games']) < 3 or {given(r['name']), given(c['Player'])} == {'vinny', 'vaclav'}]
print('high-confidence but flagged for a second look:', len(weak))
for r, w, c in sorted(weak, key=lambda t: -float(t[0]['raw']['games']))[:12]:
    print(f"  ? {r['name']} ({r['first']}-{r['last']}, {r['raw']['games']} GP) -> {c['Player']} (born {c['Birthday'][:4]}) | {w.split(', ')[1]}, debut at {debut_age(r, c)}")
print('review examples:', [(r['name'], w[:70]) for r, cls, w, c in final if cls == 'review'][:5])
print('rejected examples:', [(r['name'], r['first']) for r, cls, w, c in final if cls == 'rejected'][:6])

# ---------- summary ----------
def tally(rs, key): return dict(collections.Counter(r[key] for r in rs).most_common())
print('records', len(records), 'skaters', len(skaters), 'goalies', len(goalies), '| biographical', len(bio))
for kind in ('skater', 'goalie'):
    print(kind, 'match status', tally([r for r in records if r['kind'] == kind], 'status'))
print('classes', tally(records, 'class'))
print('tags', tally([r for r in records if r['tag']], 'tag'))
used = {r['bio']['PlayerID'] for r in records if 'bio' in r}
print('biographical records with statistics', len(used), 'without', len(bio) - len(used))
nob = [b for b in bio if b['PlayerID'] not in used]
print('  without stats by position', dict(collections.Counter(b['Position'] for b in nob)), 'no birthday in bio', sum(1 for b in bio if not b['Birthday'][:4].isdigit()))
print('unmatched by era', tally([dict(e=era(r['first'], r['last'])) for r in records if r['status'] == 'unmatched'], 'e'))
print('unmatched games: under 10:', sum(1 for r in records if r['status'] == 'unmatched' and float(r['raw']['games']) < 10), ' 400+:', sum(1 for r in records if r['status'] == 'unmatched' and float(r['raw']['games']) >= 400))
cm = [(n, [r['status'] for r in index.get(n, [])]) for n in curated]
print('curated found in statistics', sum(1 for n, s in cm if s), 'of', len(curated), '| not cleanly matched:', [(curated[n]['id'], s) for n, s in cm if not s or any(x not in ('matched', 'matched-by-evidence') for x in s)])
# playing-time units
tt = [r for r in records if r['kind'] == 'skater' and r.get('toi')]
v = sorted(r['toi'] for r in tt if r['gp'] >= 100)
print('time/games for 100+ game skaters: n', len(v), 'p5 %.1f median %.1f p95 %.1f max %.1f' % (v[len(v)//20], v[len(v)//2], v[-len(v)//20], v[-1]))
for g in 'FD':
    w = sorted(r['toi'] for r in tt if r['gp'] >= 100 and r['group'] == g); print('  ', g, 'median %.1f' % w[len(w)//2])
print('time present by first season:', {lab: f"{sum(1 for r in rs if r.get('toi'))}/{len(rs)}" for lab in [e[2] for e in ERAS] for rs in [[r for r in records if r['kind']=='skater' and r['era']==lab]]})
part = [r for r in tt if r['first'] < 1997 and r['last'] >= 1998]
print('careers straddling 1997-98 with time:', len(part), 'e.g.', [(r['name'], r['first'], r['last'], int(r['gp']), round(r['toi'],1)) for r in sorted(part, key=lambda r: -r['gp'])[:4]])
print('earliest first-season with time filled:', min(r['first'] for r in tt), '| latest career-end without time:', max(r['last'] for r in records if r['kind']=='skater' and not r.get('toi')))
gm = [r for r in records if r['kind'] == 'goalie' and r['gp'] >= 100 and num(r['raw']['minutes'])]
w = sorted(num(r['raw']['minutes']) / r['gp'] for r in gm); print('goalie minutes/game median %.1f' % w[len(w)//2])
print('goalie saves missing by era', tally([r for r in records if r['kind']=='goalie' and num(r['raw']['saves']) is None], 'era'))
print('positions', dict(collections.Counter(r['pos'] for r in records if r['kind']=='skater').most_common(21)))
print('zero-game skaters', [(r['name'], r['first']) for r in records if r['kind']=='skater' and r['gp']==0])
for s in samples: print(json.dumps(s, ensure_ascii=False))

# ---------- every curated profile beside its generated one ----------
SHORT = {'offensiveAwareness': 'ofa', 'wristShotAccuracy': 'wsa', 'passing': 'pas', 'puckHandling': 'han'}
agree = collections.Counter(); rows_out = []
for n, cu in curated.items():
    rec = index[n][0]
    top = next(iter(rec['lean']), None)
    plus = (cu['signature'] + ' ' + cu['strong']).split()
    if top is None: verdict = 'generated is neutral'
    elif SHORT[top] in cu['weak'].split(): verdict = 'contradicts curated'
    elif SHORT[top] in cu['signature'].split(): verdict = 'matches a signature'
    elif SHORT[top] in plus: verdict = 'matches a strength'
    else: verdict = 'not in curated'
    agree[verdict] += 1
    rows_out.append((cu['id'], rec['name'], rec['tag'] or '-', verdict, cu['signature'], cu['weak']))
print('curated comparison', dict(agree))
print('contradictions/not in curated:', [(r[0], r[1], r[2], r[3]) for r in rows_out if r[3] in ('contradicts curated', 'not in curated')])
with open(P('data/private/derived/curated_comparison.tsv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f, delimiter='\t', lineterminator='\n')
    w.writerow(['id', 'player', 'generated tag', 'verdict', 'curated signature', 'curated weak']); w.writerows(sorted(rows_out))
