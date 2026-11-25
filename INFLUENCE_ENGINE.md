# Hockey DNA engine: expanding influences beyond the curated 64

Beer League Hockey - Tiny Mana Studios. Dataset review requested by the creative director (Decisions 41 and 47). Rewritten Nov 25 after the statistics files arrived.

**Status: audited, nothing activated.** The game still reads only the 64 curated profiles. Everything in sections 5 to 8 is a proposal for review. Reproduce every number here with `npm run data:audit`.

## 1. What was delivered

| File | Records | One row is | Columns |
| --- | --- | --- | --- |
| `data/reference/nhl_stats/SKATERS.csv` | 7,785 | A skater's whole career | name, first, last, position, games, goals, assists, time, active, hof |
| `data/reference/nhl_stats/GOALIES.csv` | 869 | A goalie's whole career | name, first, last, games, started, wins, losses, conceded, saves, minutes, goals, assists, active, hof |
| `data/reference/nhl_players.csv` (already held) | 8,662 | A person | NHL id, name, position (F, D, G), shoots or catches, birthday, nationality, height, weight, draft |

Both statistics files are kept byte for byte as delivered. Coverage is 1918 to 2025.

**What the statistics do not contain.** No player id. No birth date. No season-by-season rows, so no peak years and no career arc. No shots, shooting percentage, penalty minutes, hits, blocks, takeaways, faceoffs, plus-minus, power-play or shorthanded figures. No playoff split (the totals do not say whether playoffs are included). Nothing about how anyone skated, shot or hit.

## 2. Column audit

| Column | Filled | Finding |
| --- | --- | --- |
| Skater `first`, `last` | all | First and last calendar year of the career, 1918 to 2025. Not season labels |
| Skater `position` | all | 21 different values. D 2,511, C 1,831, LW 1,505, RW 1,457, F 123, W 35, and 323 mixtures such as C/LW, LW/D, D/RW. I treat a record as a defenceman only when D is listed first |
| Skater `games`, `goals`, `assists` | all | Career totals. One record has zero games (Dave Lucas, 1963) |
| Skater `time` | 4,219 of 7,785 | **Total minutes on the ice, and only for seasons from 1997-98 on.** See below |
| Goalie `started` | 344 of 869 | Recent careers only |
| Goalie `wins`, `losses` | 867 of 869 | |
| Goalie `saves` | 781 of 869 | Missing for 88 goalies, all before the mid-1950s, when shots against were not recorded |
| Goalie `conceded`, `minutes` | all | Median 56 minutes a game, as expected |
| `active` | all | 920 skaters and 103 goalies marked active |
| `hof` | all | 225 skaters and 38 goalies |

**Playing-time units (your instruction 5).** For careers that began in 1998 or later, `time` divided by games gives a median of 15.3 minutes (forwards about 13, defencemen about 17; 5th to 95th percentile 9.2 to 21.4). That is minutes of ice time. But a career that straddles 1997-98 has only its later seasons counted: Mark Messier shows 5.4 minutes a game over 1,756 games, Ron Francis 6.7. And 21 players from before 1943 have a small figure that looks like emergency minutes in goal (King Clancy: 3). **So a per-game ice-time figure is valid only for careers starting in 1998 or later (about 2,900 skaters), and is treated as unknown for everyone else.** I do not use it in any proposed profile.

Missing values stay unknown throughout: the script never turns a blank into a zero.

## 3. Matching against the biographical file

There is no shared id, so matching uses three pieces of evidence together: the name (accents and punctuation removed, so Lidström finds Lidstrom), the position group (forward, defence, goalie), and whether the career years fit the birthday (a first season between ages 16 and 33, a last season by 53). A record is merged only when exactly one person fits all three and no other statistics record claims the same person. A name on its own is never enough.

| Outcome | Skaters | Goalies | Total | Meaning |
| --- | --- | --- | --- | --- |
| Matched | 7,272 | 806 | 8,078 | One person with that name; position and years agree |
| Matched by evidence | 89 | 8 | 97 | The name is shared, but only one person fits the position and years |
| **Conflict** | 85 | 16 | 101 | One person has the name but the position or the years disagree. Not merged |
| **Ambiguous** | 27 | 2 | 29 | More than one person fits, or two records fit one person. Not merged |
| **Unmatched** | 312 | 37 | 349 | No biographical record under that name |
| | 7,785 | 869 | 8,654 | 94.5% merged |

On the other side, 8,175 of the 8,662 biographical people now have statistics and 487 do not (285 forwards, 146 defencemen, 56 goalies).

**Why records fail, from reading them:**

- **Unmatched (349):** almost all are spelling differences between the two sources, not missing people. Nicknames and short forms: Tiger Williams, Pete Mahovlich, Pat Maroon, Mike Cammalleri, Joe Kocur. Transliteration: Sandis Ozoliņš, Mikkel Bødker, Václav Prospal. 120 of them played fewer than 10 games; 32 played more than 400. These pair off against the 487 people without statistics and can be resolved by hand from a list.
- **Conflict (101):** 64 on career years, 41 on position (four on both). The year conflicts are mostly a father and son, or two unrelated players, with one name where the biographical file holds only one of them: the Syl Apps who played 1971 to 1980 against a birthday of 1915; Ace Bailey 1969 to 1978 against 1903. The position conflicts are mostly forwards who also played defence.
- **Ambiguous (29):** shared names where both people plausibly fit: Greg Adams, Ron Anderson, Peter Andersson, Mike Brown, Mikko Lehtonen (three records).

**Files for review:** `data/derived/stat_matches.tsv` lists every statistics record with its outcome, matched id and reason. `data/derived/stat_review.tsv` lists the 130 conflicts and ambiguities with every candidate beside them. Nothing on the review list is merged until a person decides; decisions will be kept in their own file so re-running the audit never loses them.

**The 64 curated influences:** all 64 were found and matched cleanly. None is on a review list.

## 4. What the statistics can and cannot say

The game's influences do not make a player better or worse. They move ability around inside a fixed budget (the leanings average zero). So "how good was he" is the one question a profile does not need answered, and it is the main thing career totals measure.

What is left is shape, and career goals and assists carry exactly one shape: **does this player's production lean toward scoring goals or toward setting them up, compared with others at his position in his era.** Everything else in a curated profile (speed, shot, strength, checking, defence, composure, goalie style) has no measurement behind it in these files.

Following your rule that statistical proxies must not be presented as measured physical abilities:

| Not inferred | Why |
| --- | --- |
| Skating speed, acceleration, agility, balance | Nothing measures them |
| Wrist or slap shot power | No shot data at all; and shot frequency would not establish power |
| Checking, strength, physical play | No hits or penalty minutes; and penalty minutes would not establish checking |
| Defensive awareness | Low scoring is not evidence of good defence |
| Durability, endurance | A long career is also a matter of era, role and luck |
| Discipline, leadership, composure, hockey IQ, personality | Nothing measures them |
| Goalie style (reflexes, positioning, glove, pads) | Save percentage says how well, never how |

## 5. Proposed method (for review, not implemented in the game)

1. **Pools.** Each skater is compared only with skaters of the same group (forward or defence) whose career midpoint falls in the same era: 1918-42, 1943-67, 1968-79, 1980-93, 1994-2005, 2006-25. This is the era and position adjustment: a 1980s total is judged against the 1980s.
2. **Rates with shrinkage.** Goals and assists per game, each mixed with 82 games of that pool's average, so 40 good games do not make a legend.
3. **Two measures.** Where the player's production ranks in the pool, and where his share of goals in that production ranks (pool members with 100 or more games set the scale).
4. **Tendency.** Only for players at or above the 60th percentile of production, since a share of very little means nothing:

| Tendency | Rule | Proposed leaning |
| --- | --- | --- |
| Finisher | Goal share in the top quarter of the pool | Offensive awareness, then wrist shot accuracy |
| Playmaker | Goal share in the bottom quarter | Passing, then offensive awareness |
| Scorer | Neither, but production in the top 15% | Offensive awareness, then passing |
| None | Everyone else | Neutral |

5. **Goalies.** I tested the only directional measure available, assists per game, as a sign of puck handling. **It fails** (section 7) and I recommend goalies stay neutral unless curated.

Wrist shot accuracy for a finisher is the one place this proposal reaches past what is measured: goals show that the puck went in, not how. I have left it in so you can rule on it; removing it leaves finishers leaning on offensive awareness alone.

## 6. Confidence classification

| Class | Rule | Count | Proposed treatment |
| --- | --- | --- | --- |
| **Curated** | Hand-written | 64 | Unchanged. Never overwritten. Featured |
| **A. Data-derived** | Merged, 400+ games (goalies 200+), a tendency found | 940 | One signature and one strong leaning, nothing weak |
| **B. Limited data** | Merged, 100 to 399 games (goalies 60 to 199), a tendency found | 247 | One mild leaning only |
| **C. Neutral** | Merged, but too few games or no measurable tendency | 6,988 | Selectable, shapes nothing, labelled "limited data" (as you proposed) |
| **D. Unmerged** | Conflict, ambiguous or unmatched | 479 | Not selectable until a person resolves the match |

Counts include the curated 64, who would keep their curated profile whatever class the numbers give them. Tendencies found: 476 finishers, 409 playmakers, 270 scorers. Four in five merged players come out neutral. That is the honest result of having only goals and assists.

## 7. Ten sample profiles, and the curated set beside the generated one

Full figures are in `data/derived/sample_profiles.json`.

| Player | Era, position | Games, G, A | Production / goal-share percentile | Generated | Curated (signature; weak) | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Howie Morenz | 1924-37, C | 550, 271, 205 | 96 / 78 | A: finisher | not curated | Plausible. His defining speed is invisible to the data |
| Eddie Shore | 1927-40, D | 551, 105, 179 | 94 / 31 | A: scorer | not curated | Half right. Known as much for ferocity, which the data cannot see |
| Maurice Richard | 1943-60, RW | 978, 544, 422 | 99 / 100 | A: finisher | F17: wrist accuracy, composure, acceleration; discipline, passing | Agrees |
| Bobby Orr | 1967-79, D | 657, 270, 645 | 100 / 94 | A: finisher | D01: speed, puck control, off. awareness; durability, discipline | Partly. "Finisher" is true among defencemen, but skating is the point of Orr |
| Wayne Gretzky | 1980-99, C | 1,487, 894, 1,963 | 100 / 2 | A: playmaker | F01: passing, off. awareness, hockey IQ; checking, strength, slap power | Agrees |
| Nicklas Lidström | 1992-2012, D | 1,564, 264, 878 | 100 / 52 | A: scorer | D02: def. awareness, hockey IQ, discipline; checking, strength | **Misleading.** The data sees points and misses the defender |
| Bob Probert | 1986-2002, LW | 935, 163, 221 | 53 / 56 | C: neutral | F33: strength, checking, durability; discipline, speed, agility | Correctly silent. The data has nothing on an enforcer |
| Connor McDavid | 2016-25, C | 712, 361, 721 | 100 / 4 | A: playmaker | F28: speed, acceleration, puck control; checking, strength | Partly. Passing is a curated strength; the speed is missing |
| Terry Sawchuk | 1950-70, G | 971 | assists 83rd | C: neutral | G06: reflexes, balance, composure; puck handling, discipline | Correctly silent |
| Martin Brodeur | 1992-2015, G | 1,266, 45 assists | assists 97th | A: puck handler | G03: puck handling, positioning, durability; pads, agility | Agrees, and is the only goalie case that does |

**All 64 curated profiles against their generated one** (`data/derived/curated_comparison.tsv`):

| Result | Count |
| --- | --- |
| Generated leaning matches a curated signature | 12 |
| Matches a curated strength | 21 |
| Generated leaning is not in the curated profile at all | 22 |
| Generated is neutral | 5 |
| **Generated contradicts a curated weakness** | 4 |

The four contradictions: Scott Stevens tagged a scorer (curated as a punishing defender), and Patrick Roy, Ken Dryden and Henrik Lundqvist tagged puck handlers when the curated profiles list puck handling as a weakness. Goalie assists track long careers on good teams, not handling the puck. Hence the recommendation to drop the goalie mapping.

**Reading:** the generated profile agrees with the hand-written one about half the time (33 of 64), is silent or beside the point for most of the rest, and is wrong outright for 4. Where it agrees it captures one or two of the seven or so leanings a curated profile holds.

## 8. Recommendation

1. **Do not activate generated attribute leanings as proposed.** The evidence supports one tendency for skaters and nothing for goalies.
2. **Use the dataset for what it measures well:** who is selectable (8,175 merged people), era, career span, games, goals, assists and Hall of Fame status as facts on the gold card, and the limited-data label.
3. **If you want generated profiles to shape players at all,** the defensible version is: skaters only; finisher or playmaker only (drop "scorer", which is the one that misdescribes Lidström and Stevens); one mild leaning at the limited-data strength for every class; no wrist shot accuracy. That affects 885 players and can do little harm.
4. **Grow the curated set by hand** where a name matters. The audit makes a good worklist: Hall of Fame members not yet curated.

Selection and weighting are unchanged and built: one primary and up to two secondaries at 60 / 25 / 15, with Play Style now taking a quarter of the starting spread (Decision 48), all inside the same budget.

## 9. Licensing and redistribution assessment

I am not a lawyer; this is what the evidence shows.

- **No licence travelled with the files.** The archive holds two CSVs and nothing else.
- **The Kaggle page could not be read for its licence.** The page returns only its title and the description "NHL Player Database 1918-Present" to an automated reader; the licence field is not in what came back. I did not find the terms stated anywhere else.
- **The underlying source is not stated.** Career totals of this kind originate with the league's own records or a statistics site, each with its own terms of use.
- **Assessment:** treat redistribution rights as **unknown**. Keep the raw files for internal development only. They are in the repository under `data/reference/`, which the website build does not publish; I checked that nothing under `data/` is copied into the game or the site. If the repository is ever made public, or the licence turns out to forbid redistribution, the raw files should come out of it.
- **Derived profiles** (our own leanings and labels) are a separate work from the raw table, and individual career totals are facts. Even so, the names are real people, and Decision 34 already requires real names to be replaceable before public release. The dataset does not change that.
- **What I need from you:** the licence line from the dataset's Kaggle page (it is shown under the description when signed in), and the source the uploader names, if any.

## 10. Questions

1. Which way on section 8: facts and eligibility only (my recommendation), or also the mild finisher and playmaker leaning for skaters?
2. Wrist shot accuracy for finishers: allowed, or out?
3. Should class C players be selectable now, shaping nothing, with the limited-data label? You proposed yes; it needs the Creator V1 influence list to show the label.
4. Shall I prepare the hand-resolution list for the 349 unmatched records (most are spelling differences), or leave them unselectable for now?
5. The licence line from the Kaggle page.
