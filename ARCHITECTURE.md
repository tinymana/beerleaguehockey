# Architecture and data model

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization: **Milestone 0 and the skating prototype only.**

The five-module architecture is **approved**. Data shapes for systems beyond the skating prototype are **proposed** sketches and are not implemented.

## What exists in code today

| Path | Contents |
| --- | --- |
| `src/core` | Seeded RNG with named streams, math helpers |
| `src/match/sim` | Skating prototype simulation: skater, puck, rink collision, tuning data. Pure TypeScript, fixed 60 Hz step |
| `src/match/view` | Phaser-side helpers for the match: temporary code-drawn textures, camera maths |
| `src/app` | Phaser boot, title screen and menu, skating scene, pixel font, gamepad helper, developer tuning panel, integer-scaled stage |
| `src/dynasty`, `src/lifestyle` | Placeholders with module rules. Not started |
| `tests` | Vitest suites, including a module-boundary test |
| `site` | Marketing website; `npm run build:site` assembles it with the game under `/play/` |

## Architecture

The game is three independent TypeScript packages in one Vite project: a match engine that knows nothing about leagues, a dynasty simulation that knows nothing about Phaser, and a thin app shell that connects them through one contract.

```
+--------------------------------------------------------------------+
| app: Phaser scenes, menus, save/load; passes setups and results    |
+--------------------------------------------------------------------+
        |                                              |
+------------------+   MatchSetup (rosters, rules, seed)  +----------------------+
| match engines    | <----------------------------------- | dynasty simulation   |
|  ArcadeMatch     |                                      |  league, rosters,    |
|  QuickSim        | -----------------------------------> |  money, history      |
+------------------+   MatchResult (score, events, stats) +----------------------+
                                                                  ^ commands
                                                          +----------------------+
                                                          | lifestyle            |
                                                          +----------------------+
+--------------------------------------------------------------------+
| core: shared types, stable IDs, seeded RNG, league rules           |
+--------------------------------------------------------------------+
```

The dynasty sends a setup to whichever engine runs the game and gets back a result in the same shape, so playing and simulating are interchangeable.

### Packages

| Package | Owns | Depends on |
| --- | --- | --- |
| `core` | Shared types, IDs, seeded RNG, the `MatchSetup` and `MatchResult` contract, league rules | Nothing |
| `match` | Arcade hockey: fixed-timestep simulation of skaters, puck, goalies, AI, rules and stat tracking. Rendering, input and audio are a Phaser layer on top | `core`, Phaser (view layer only) |
| `dynasty` | League state, schedule, standings, playoffs, rosters, availability, finances, aging, recruitment, history, and the quick-sim engine | `core` only. No Phaser, no DOM |
| `lifestyle` | Locations, dialogue runner, story event templates and their effects | `core`, and `dynasty` through commands |
| `app` | Phaser scenes, menus, save and load, and the orchestration between the others | Everything |

### Rules that keep the two halves independent

- **One-way contract.** The dynasty builds a `MatchSetup`; an engine returns a `MatchResult`. Neither engine can read or write league state.
- **Two engines, one interface.** `ArcadeMatch` (played) and `QuickSim` (simulated) both implement `MatchEngine`. The dynasty cannot tell which produced a result except by the `source` field.
- **Match logic is separate from Phaser.** The hockey simulation runs at a fixed 60 Hz step in plain TypeScript; Phaser only draws state and reads input. That lets tests run thousands of headless AI-versus-AI games to calibrate the quick sim.
- **Commands in, events out.** All dynasty changes go through named commands such as `applyResult`, `signPlayer`, `collectFee` and `advanceDay`. Each either fully applies or throws and changes nothing.
- **Seeded everything.** One master seed per save. Each subsystem draws from its own named RNG stream, so adding a random roll in recruiting never changes injury outcomes. No `Math.random` and no wall-clock time inside `match` logic or `dynasty`.
- **Abandoned games are safe.** A played game writes nothing until the final horn. Quitting mid-game leaves the fixture as scheduled.

### Tooling

- TypeScript in strict mode, Vite for dev and build, Phaser 3 for rendering, input and audio. I will confirm the current stable Phaser release when scaffolding.
- Vitest for unit and simulation tests; an automated boundary test enforces the package rules above.
- GitHub Actions runs type-check, tests and a build on every push.
- Content (names, occupations, dialogue, event templates, team identities) lives in JSON data files, not code.

### Requirements added by the director's response

The five-module architecture is approved. These rules now apply to all future work.

- **Money is integer cents.** No floating-point currency anywhere.
- **Results are idempotent.** Applying the same `MatchResult` twice changes nothing the second time.
- **History is snapshotted.** A game record keeps the team identity and player ratings as they were that night, so old box scores survive renames and aging.
- **Tuning is data.** Gameplay values live in config objects with a live developer panel, never as constants buried in logic.
- **No duplicate accounting.** Each stat is stored once at game level; season and career totals are derived.
- **No silent corruption.** Saves validate on load and after every season; a failed check stops and reports instead of continuing.
- **Headless always works.** Match logic and the dynasty run without rendering for tests and balancing.
- **Minimal dependencies.** Runtime dependency list today: Phaser only.

### How the new systems fit

- **Competition context.** `MatchSetup` carries a small `competition` field naming the competition, its kind (exhibition, league season, league playoff, tournament) and stage. Engines ignore its meaning; the dynasty uses it to route stats and standings. Tournaments reuse the same contract.
- **Competitions as plug-ins.** League seasons and tournament editions both implement one `Competition` interface (entrants, fixtures, apply result, standings or bracket, finished). Formats such as round robin and single elimination are reusable runners.
- **Identity, authority and control are separate.** A person, a franchise, who manages that franchise, and what the user controls on the ice are four different records, so career transitions are role changes, not mode switches.
- **Characters.** Appearance is a small serializable config; one renderer in the app layer composes layered sprites at three sizes (portrait, avatar, on-ice). The dynasty stores only the config.
- **Dialogue.** A template-and-rules engine in `lifestyle`, fed by game state from `dynasty`. No network calls.
- **Prestige.** Append-only award events in `dynasty`, each with a unique key so it cannot be granted twice; rank and rankings are derived.
- **Multiplayer readiness.** Every dynasty change is a serializable command stamped with who issued it, the simulation is deterministic, and storage sits behind an interface. That is enough to add shared leagues later without adding any networking now.

## Dynasty module: what exists (v0.3.0)

`src/dynasty` is pure TypeScript and imports only `src/core`. A test enforces that it never touches Phaser, `app`, the match internals or the clock.

| File | Holds |
| --- | --- |
| `attributes.ts` | Attribute keys and labels for skaters and goalies; `PlayerAttributes` with four separate layers (current, potential, temporary modifiers, log of permanent changes); `effectiveRating`, `applyPermanentChange` (applied once, by id) |
| `influences.ts` | The Hockey Influences registry API: lookup, which influences suit a position, display name by name set (`real` or `fictional`), registry checks |
| `data/influences.ts` | Generated by `scripts/data/build_influences.py` from `data/influences/curated.tsv` and the reference CSV. Never edited by hand |
| `backgrounds.ts` | Hockey backgrounds: starting level, spread, experience, youngest believable age |
| `dna.ts` | `generateDNA` (seeded, named streams: level, talent, current, potential), `influenceBias` (zero-sum blend of up to three influences), `attributeBounds` (the range any seed can roll), `serializeDNA` and `parseDNA` (versioned; refuses what it does not understand), `DNA_CONFIG` (all balancing values) |

How a player is rolled: background gives a starting level; each attribute is that level, plus the blended influence weight times a scale, plus an experience shift for the mental attributes, plus bounded noise. Potential is built the same way around a separately rolled talent, with a larger influence scale, and is never less than a few points above the start. Influence weights are centred on zero, so choosing a hero changes the shape of a player and never the size.

Saves do not exist yet. DNA is the first record designed to go into one: it carries a version, neutral influence ids and the seed.

## Data model

Every person, team and game has a permanent ID that is never reused, and history is stored as append-only records that reference those IDs. That is what keeps a 30-season save consistent.

### Core entities

| Entity | Key fields | Notes |
| --- | --- | --- |
| Player | id, name, birth year, position, handedness, attributes, potential, archetype, occupation id, personality traits, availability profile, fee reliability, loyalty, ambition, status | Status is active, free agent, retired or moved away. Retired players stay in the database forever |
| Team | id, name, colors, crest, division id, roster (player ids plus jersey numbers), lines, budget ledger, chemistry map, rival ids | The roster is a list of contracts-by-handshake: player id, joined season, fee share, amount paid |
| Division | id, tier, name, rules id, team ids | Tier 1 is Gold |
| Season | id, year, term, schedule, standings, playoff bracket, awards, promotions and relegations, status | Closed seasons are immutable |
| Game | id, season id, date, home and away team ids, status, result id | Status is scheduled, played, simulated or forfeited |
| Game result | game id, score by period, box score per player, goal and penalty events, three stars, source, RNG seed | The single contract between the match engines and the dynasty |
| Career stat line | player id, season id, team id, division tier, GP, G, A, PIM, shots, plus goalie stats | One row per player per team per season; totals are derived, never stored twice |
| Transaction | id, date, type, player id, from team, to team, detail | Joins, departures, retirements, promotions, suspensions |
| Ledger entry | id, team id, date, type, amount, player id | Fees, sponsor income, bar tabs, fines |
| Story event | id, date, template id, participants, choices made, effects applied | Makes lifestyle outcomes replayable and auditable |
| Record and honor | type, holder id, value, season id | Records, trophies, retired numbers, Hall of Fame inductions |

### People, franchises, roles and competitions

The Nov 25 direction splits "Team" and "Player" above into finer records. These shapes are proposals and none is implemented in the prototype.

```ts
interface Person {
  id: PersonId;                       // permanent, never reused
  name: { first: string; last: string; nickname?: string };
  nationalityId: string;              // selects name and hometown pools only
  hometown: string; birthYear: number;
  appearance: AppearanceConfig;       // base look; aged look is derived
  agingSeed: number;                  // when hair grays or thins, weight drift
  hockeyBackground: HockeyBackground; // beginner ... former pro
  archetype: string; personality: string[]; speakingStyle: string;
  language: { native: string; englishFluency: 1 | 2 | 3 | 4 };
  occupationId: string;
  attributes: Attributes; potential: number;
  wallet: Cents;                      // personal money, separate from any team
  status: 'active' | 'free-agent' | 'retired' | 'moved-away';
}

interface Franchise {
  id: FranchiseId; name: string; abbreviation: string;
  colors: { primary: string; secondary: string; accent: string };
  crestId: string; uniforms: { home: UniformId; away: UniformId };
  foundedYear: number; backstory: string;
  culture: CultureId;                 // weights for the AI manager
  kind: 'league' | 'custom' | 'tournament-only';
  divisionId?: DivisionId;            // changes with promotion; identity does not
  ledger: LedgerEntry[];              // team money, integer cents
}

interface RosterSpot {                // membership, not ownership
  personId: PersonId; teamEntryId: string;
  kind: 'regular' | 'guest' | 'emergency-sub';
  from: GameDate; to?: GameDate;
}

interface ManagementRole {            // authority over a franchise
  personId: PersonId; franchiseId: FranchiseId;
  role: 'owner' | 'manager' | 'captain';
  from: GameDate; to?: GameDate;
}

interface UserSeat {                  // what a human controls
  userId: UserId; personId?: PersonId;
  onIceControl: 'whole-team' | 'captain-lock' | 'none';
}

interface CompetitionContext {
  competitionId: CompetitionId;
  kind: 'exhibition' | 'league-season' | 'league-playoff' | 'tournament';
  stage?: string;                     // 'group A', 'semifinal', ...
}

interface PrestigeAward {             // append-only, auditable
  awardKey: string;                   // unique: franchise + competition + type
  franchiseId: FranchiseId; competitionId: CompetitionId;
  seasonId?: SeasonId; type: string; xp: number; date: GameDate;
}
```

- **Tournaments** are a `Tournament` (permanent identity, reputation, host, eligibility) with yearly `TournamentEdition` records (entrants, fee, prize pool, format, rules, results, awards, MVP).
- **Stat buckets:** every stat line is tagged regular season, league playoff or tournament through the game's competition. Combined career totals are computed, never stored.
- **Reputation** for franchises and people is a derived, moving value; prestige rank is derived from the sum of awards against configurable thresholds.
- **Nationality, name pools, occupations, cultures, speaking styles and dialogue templates** are data files with their own version numbers.

### The game result contract

Both the arcade engine and the simulator take the same input and return the same output.

```ts
interface MatchSetup {
  gameId: GameId;
  seed: number;
  rules: LeagueRules;          // period length, skaters, penalties, offsides
  home: MatchTeam;             // dressed players, lines, attributes snapshot
  away: MatchTeam;
}

interface MatchResult {
  gameId: GameId;
  source: 'played' | 'simulated';
  score: { home: number; away: number; byPeriod: [number, number][] };
  wentToOvertime: boolean;
  events: MatchEvent[];        // goals, assists, penalties, injuries, fights
  playerStats: Record<PlayerId, PlayerGameStats>;
  threeStars: PlayerId[];
}
```

The dynasty validates every result before applying it: goals must sum to the score, every player ID must be on a dressed roster, and a game can be applied once only.

### League rules as data

```ts
interface LeagueRules {
  periods: number; periodMinutes: number;
  skatersPerSide: 3 | 4 | 5;
  checking: 'off' | 'penalized' | 'on';
  offsides: boolean; icing: boolean;
  gamesPerSeason: number; playoffTeams: number;
  promoteCount: number; relegateCount: number;
  seasonFee: number; rosterMin: number; rosterMax: number;
}
```

### Saves

- One save is one JSON document with a `schemaVersion`, the master seed, the RNG state, and every table above.
- Each schema change ships a migration function from version N to N+1. Loading runs migrations in order; old saves are never rewritten in place until the migrated copy validates.
- Stored in IndexedDB with three rotating autosave slots, plus manual export and import as a file.
- Integrity checks run on load and after each season: no orphan IDs, no player on two teams, ledger totals match budgets, career totals match game logs.

## Risks and engineering practice

The biggest risk is arcade feel, which no document can settle, so it is tackled first and judged by you on a playable build.

| Risk | Mitigation |
| --- | --- |
| The skating and one-timers do not feel right | Prototype in week one; expose every tuning value in a live debug panel; you sign off before Milestone 2 closes |
| Played and simulated games produce different stat profiles | Calibrate the quick sim against thousands of headless arcade games; a test fails if scoring rates diverge beyond a set margin |
| Long saves drift or corrupt | Append-only history, atomic commands, integrity checks each season, 50-season soak tests in CI |
| Leagues go bankrupt or ratings inflate over decades | Soak tests track fee solvency, rating distributions and roster sizes per season against target bands |
| Scope creep from the lifestyle layer | Lifestyle only acts through dynasty commands and is content-driven; nothing in Milestones 1 to 6 depends on it |
| Art consistency between key art and sprites | Lock the palette from the attached pieces; build a sprite style test early in Milestone 1 for your approval |

### Working agreements

- **Git:** small commits on feature branches, a tagged checkpoint at each milestone, `main` always playable.
- **Changelog:** `CHANGELOG.md` updated with every merge, grouped by milestone.
- **Tests:** unit tests for rules and simulation logic, determinism tests (same seed, same result), contract tests for `MatchResult`, and multi-season soak tests.
- **Saves:** schema version bumped with every shape change, with a migration and a test fixture from the previous version.
- **Approval:** I bring you a short proposal before locking any major mechanic; design changes are recorded in this document.

## Rendering profiles and the created-player store (v0.4.0)

- **Profiles** (`src/app/stage.ts`): `ice` 480x320 and `offIce` 960x540. A scene calls `setProfile` when it starts and restores `ice` when it shuts down; the game is resized, never recreated, and `src/match` knows nothing about it. `profileFit` is a pure function with tests.
- **Interface kit:** the batch 16.11 atlas is copied unchanged by `scripts/art/ingest_ui.py`; frames and nine-slice insets come from its manifest.
- **Created players** (`src/dynasty/createdPlayer.ts`, pure): a draft (choices only) and confirmed players (DNA rolled once). Versioned; a damaged confirmed player makes the read fail rather than vanish. `src/app/createdPlayerStore.ts` keeps it in local storage and sets a damaged save aside.
- **Wider influence registry:** `src/dynasty/data/influencesExtended.ts` is one packed string, parsed on first use.
