# Procedural player and rookie generation: architecture and integration points

Beer League Hockey - Tiny Mana Studios. Requested by the creative director (Decision 70). **Documentation only: nothing here is built, and no progression, retirement or generation threshold is proposed as approved.** Creator V1 remains the priority.

## 1. What it is for

A league that runs for 50 years needs people to arrive as others age, retire, get hurt, move or drift away. This system makes recreational players: the population the user plays with and against. It is separate from the fictional professional registry (Decision 68), whose 240 entries are only the heroes players grew up watching and never take the ice.

## 2. What already exists and is reused

| Need | Already built | Where |
| --- | --- | --- |
| Seeded, reproducible rolls with named streams | Yes | `src/core/rng.ts` |
| Attributes: current, potential, temporary, permanent | Yes | `src/dynasty/attributes.ts` |
| Player DNA from seed, position, background, influences, play style | Yes, versioned | `src/dynasty/dna.ts` |
| Backgrounds, including adult ones (college, returning veteran, former pro) | Yes: ten, with minimum ages | `src/dynasty/backgrounds.ts` |
| Hockey Influences, play styles, starting archetypes | Yes | `influences.ts`, `playStyles.ts`, `archetypes.ts` |
| Fictional name pools by nationality, reusable | Yes: twelve nationalities | `src/dynasty/names.ts` |
| Appearance record and compositor | Yes (v0.5.0) | `src/dynasty/appearance.ts` |
| Personality traits | Designed, not built | `REGISTRIES.md` section 5 |

A generated player is therefore mostly an automated run of Create a Player: the same record, made by rule instead of by hand. That is the main design decision: **one person record for created and generated players.**

## 3. The person record (proposed)

| Field | Source | Persists |
| --- | --- | --- |
| Person id | A counter in the league save; never reused | For ever |
| Generation seed | Derived from the league seed and the person id | For ever: everything natural about the person can be regenerated from it |
| Name, nationality | Name generator (section 4) | For ever |
| Birth date (so age follows the calendar) | Rolled from the entrant age distribution | For ever |
| Height, weight, shooting hand | Rolled; distributions are settings | For ever |
| Position | Rolled against league need | Changes only by a designed rule |
| Appearance record | Rolled from the catalog; ages by a designed rule later | Editable only by game rules |
| Background, influences, play style, starting archetype | Rolled; background from the entrant kinds in section 5 | Background and influences for ever; play style may change between seasons (Decision 57) |
| Personality traits | Rolled from the trait registry when it is approved | Rarely, through events |
| Player DNA: starting attributes, natural potential | `generateDNA`, unchanged | For ever |
| Development characteristics | **Not designed.** A place is reserved: growth rate, peak age, decline shape | For ever |
| Durability and injury susceptibility | Durability is already an attribute. A separate susceptibility figure is **not designed** | For ever |
| Current attributes, memberships, history | The career simulation | Changes all the time |

Identity and natural characteristics live in the top of the table and are never rewritten by team changes or season rollover. Only the last row moves.

## 4. Name generation

- **Pools:** original, fictional pools per nationality (first names and surnames), as now. The NHL biographical file is not used: its licence is unverified (section 8).
- **Accents and conventions:** the pools are stored as plain letters today because the temporary font has no accented glyphs. The generator's interface takes and returns full Unicode, so pools can carry accents as soon as the font can draw them. Conventions that differ by country (patronymics, family name first, double surnames) become per-pool rules rather than special cases in code.
- **Duplicates:** the league keeps a set of active identities; a draw that collides with an active player, a fictional professional, a curated influence or its alias is re-rolled, within a bounded number of tries. Twelve pools of 16 by 16 give about 3,000 combinations today; a 50-year league needs the pools grown (section 7).
- **Reuse:** one function, `randomName(rng, nationality)`, already serves Create a Player and the fictional registry and will serve this.

## 5. Entrants

"Rookie" means new to this league, not young. Entrant kinds map onto the existing backgrounds:

| Entrant kind | Background | Typical age (setting, not approved) |
| --- | --- | --- |
| Young adult entering beer league | Youth hockey, High school | 18 to 24 |
| Former junior player | Junior | 20 to 30 |
| Former collegiate player | College | 22 to 32 |
| Former competitive amateur | Former minor-league pro, Former pro | 26 to 40 |
| Adult discovering hockey late | Complete beginner | 25 to 55 |
| Former roller hockey player | Roller hockey convert | 18 to 40 |
| Pond hockey player | Pond hockey | 18 to 45 |
| Returning recreational player | Returning rec veteran | 30 to 55 |

The user's created player still starts at 18 with the six backgrounds available at 18. Nothing here changes that.

## 6. Population management: integration points

| Event | Hook | Depends on (not designed yet) |
| --- | --- | --- |
| New seasonal entrants | At season rollover: count needed = openings plus a churn allowance | Season calendar, roster sizes |
| Retirement, career-ending injury, leaving hockey | Marks a person inactive; the record and history are kept | Aging, injuries, the thresholds you have not approved |
| Free agents | Active people with no team: a pool the recruitment screen reads | Recruitment |
| Emergency substitutes | A query over free agents and players on other teams, by position and availability | Scheduling |
| Expansion teams | A batch request: a full roster at a division's level | Division ratings |
| Moving between divisions | A membership change; the person record is untouched | Promotion and relegation |
| Multiple teams | Memberships are a list on the person, not a field | Scheduling conflicts |
| Long-term stability | A yearly audit: population by age band, position and division against targets, which sets next season's entrant mix | The targets, which are settings |

Everything is driven from the league seed and the season number, so the same league replays the same people.

## 7. Scale check for 50 years

Four seasons a year for 50 years is 200 seasons. With, for illustration, 40 teams of 15 and a tenth of players replaced each season, that is about 12,000 people over a dynasty. So: ids must be a plain counter (no ceiling); retired people are compacted to a summary but never deleted (history rule 7); and the name pools must grow from about 3,000 combinations to well over 12,000 per league, or allow repeats across eras with duplicates prevented only among active players, as you specified.

## 8. The NHL biographical file as a name source

Its redistribution licence is unverified (Decisions 61, 67), and I could not find terms for it. Extracting first names and surnames separately and recombining them would not reproduce the database or any real player, and given names and surnames as such are common words. That is a legal question I cannot settle; the safe course, which you have set, is to use original pools until the licence is known. If it turns out to permit this, the file could seed larger pools by nationality without being shipped.

## 9. Settings (all data, none approved)

Entrants per season; entrant kind mix; age distribution per kind; nationality distribution; position mix; handedness share; height and weight distributions; attribute budgets (already the background levels); duplicate-name policy; retired-record compaction.

## 10. Decisions this will need before any build

1. Development characteristics: what they are and how they shape growth and decline.
2. Injury susceptibility: its own figure, or the durability attribute alone.
3. Retirement and leaving rules and their thresholds.
4. Nationality mix for the league, and whether a league has a home country.
5. Whether generated players' appearance ages.
6. Personality registry approval (it is still "designed").
7. Roster sizes and the number of teams per division, which set every rate above.
