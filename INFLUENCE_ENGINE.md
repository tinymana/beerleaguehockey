# Hockey DNA engine: expanding influences beyond the curated 64

Beer League Hockey - Tiny Mana Studios. Answers sections 4 to 6 of the creative director's decisions of Nov 25 (Decision 41). **Status: the dataset has not been inspected yet, so nothing here is merged or generated.** The algorithm below is a proposal that will be adjusted to the real columns.

## 1. Database inspection: blocked, and what I need

- **The Kaggle dataset `flynn28/nhl-player-database` could not be reached from the development workspace.** Downloads from kaggle.com are refused by the workspace's network rules, and reading the dataset page needed an approval that was not answered. I have therefore not seen its files, columns, licence, coverage or record shape, and I am not going to describe them from guesswork.
- **To unblock it, either:** attach the dataset's CSV files here (skaters.csv, goalies.csv and anything else in it) along with what its Kaggle page says about licence; or approve the page fetch when asked.
- **What I will report as soon as I have the files** (your list): actual file names and column schemas; licence and redistribution terms; the unique id column; years covered; duplicate records; missing values per column; whether rows are career totals or seasons; regular season against playoffs; position classifications; and the match rate against the file we already have.

## 2. What we already have

`data/reference/nhl_players.csv`: 8,662 players, one row each. `PlayerID` is the NHL's own numeric id (for example 8447400), which is the best possible join key. Columns: name, position (F, D, G only), shooting or catching side, birthday, nationality, height, weight, draft position and year. No statistics. 58 names appear more than once, so names alone are not a safe key.

## 3. Merge rules (proposed)

1. **Join on NHL player id** where the new dataset has it. Report the count matched, unmatched on each side, and any id that appears twice.
2. **If it has no id:** match on normalised full name plus birth date. A name-only match is never accepted automatically: those go to a review list with both rows shown, and stay unmerged until someone decides.
3. **Conflicts** between the two files (position, birthday, country) are listed, not resolved silently. The biographical file wins by default.
4. **Nothing is overwritten.** The merge produces a new derived file with a column saying where each value came from.

## 4. Influence profile classes

| Class | Meaning | Source of the style profile |
| --- | --- | --- |
| **Curated** | High confidence. The 64 in the game today | Written by hand; statistics may inform a later review but never replace it automatically |
| **Data-derived** | Enough games and enough recorded statistics | The algorithm below |
| **Limited-data** | Some statistics, but a small sample or an era in which key numbers were not kept | The algorithm, pulled strongly toward neutral, with fewer and weaker leanings |
| **Generic fallback** | Biography only | A neutral profile for the position: selectable as "who I grew up watching", shapes nothing |

Every profile carries, internally: its class, the source files and columns used, the sample size, a confidence figure, and whether a person has overridden it. A manual override always wins and is kept in its own file, so regenerating the data never erases it.

## 5. Proposed algorithm (to be fitted to the real columns)

**Principles from your decisions:** only measures the data actually contains; compare a player with others at his position and in his era; account for games played and ice time where recorded; small samples count for less; a missing number is unknown, never zero; nothing about personality, durability, skating speed or hockey IQ is inferred from unrelated numbers; the output is a set of leanings, not a rating of the real player.

1. **Rates, not totals.** Each measure becomes a per-game rate (per 60 minutes where ice time exists): goals, assists, shots, penalty minutes, and hits, blocks, takeaways and faceoffs for the seasons that have them. Shooting percentage needs shots.
2. **Era and position adjustment.** Each rate is expressed as a position within players of the same position in the same era (a rolling window of seasons, or by birth decade if only career totals exist). This is what stops 1980s scoring from flattening everyone else.
3. **Shrink small samples.** Each adjusted value is pulled toward the average in proportion to how few games support it, so 40 games of brilliance do not make a legend.
4. **Map measures to leanings**, and only where the link is direct:

| Measure, if present | Leans toward |
| --- | --- |
| Goal rate, shooting percentage | Wrist shot accuracy, offensive awareness |
| Shot rate | Wrist and slap shot power |
| Assist rate | Passing |
| Penalty minutes | Checking up, discipline down |
| Hits | Checking, strength |
| Blocks, takeaways, shorthanded time | Defensive awareness |
| Faceoff percentage | Faceoffs |
| Goalie save percentage and goals against, era-adjusted | Positioning and reflexes together (the numbers cannot tell them apart) |
| Goalie assists or puck touches, if recorded | Puck handling |

5. **Never derived:** skating speed, acceleration, agility, balance, endurance, durability, leadership, composure, hockey IQ, and goalie style. A data-derived profile leaves these at neutral. That is the honest cost of generated profiles, and the reason curated ones stay the featured set.
6. **Convert to the game's format.** The strongest two or three leanings become signature strengths, the next few strong, the lowest two or three weak: the same plus-two, plus-one, minus-one weights the curated profiles use, so every class runs through the one generator that exists and is tested. Limited-data profiles get at most one signature and one weakness.
7. **Tendency tags** come from the same leanings (sniper, playmaker, physical and so on) where they clear a threshold; otherwise none.
8. **Confidence** is a figure from 0 to 1 built from games played and how many measures were available. It decides the class and is stored with the profile.

## 6. Sample profiles

I cannot show data-derived samples until the data is in hand. Once it is, I will return, for your review before anything is switched on: ten players across eras and positions, each with the raw measures, the adjusted values, the resulting leanings and tags, the confidence and class, and the curated profile beside it where one exists. Where the two disagree is the useful part.

## 7. Selection and weighting (built)

- One primary and up to two secondary influences: built in v0.3.0.
- **Weights 60 / 25 / 15**, your suggested starting point: built now. With one secondary, the 60 and 25 are scaled up in the same ratio (about 71 and 29). The first secondary now counts for more than the second, so the order you pick them in matters.
- Influences move ability around without adding any, so no choice can produce a professional-level beginner: built and tested.
- Seeded and stored: built. **Locking a confirmed player against re-rolls** is part of Creator V1: there is nowhere to store a confirmed player yet.

## 8. Questions

1. **The files.** Attach them, or approve the page read?
2. **Licence.** If the dataset's terms do not allow redistribution, derived profiles can still ship (they are our own numbers) but the raw file must stay out of the repository. I will confirm once I can read the terms.
3. **How generic is generic?** Should a biography-only player be selectable at all, given he shapes nothing? It is honest and it lets people pick their childhood hero; the card would say "no playing record on file".
