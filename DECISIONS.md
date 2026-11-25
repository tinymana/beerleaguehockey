# Decisions register

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization: **Milestone 0 and the skating prototype only.**

Eleven of the first twelve decisions are settled by your Nov 25 response; resolution stays open until you see the prototype. Work is authorized for Milestone 0 and the skating prototype only. Everything marked Proposed or Open below waits for your approval.

| # | Decision | Status | Direction |
| --- | --- | --- | --- |
| 1 | Rink view | Approved | Vertical scrolling, NHL '94-inspired perspective |
| 2 | Player control | Approved | Whole-team control first; captain-lock mode later |
| 3 | Skaters | Approved | 5-on-5 plus goalies, with configurable league rules |
| 4 | Checking | Approved | Physical arcade hockey with division-specific enforcement |
| 5 | Fighting | Approved, expanded | A playable retro fighting minigame with real disciplinary consequences. Design proposal due before Milestone 7 |
| 6 | Division ladder | Approved, revised | Five divisions: Gold, Silver, Bronze, Tin, Puck. Eight teams each, 40 franchises, about 600 players |
| 7 | Season shape | Approved as default | 14-game seasons. Playoff and promotion rules stay configurable; top-four playoffs and two-up, two-down remain proposals |
| 8 | Calendar | Approved | Two seasons per year |
| 9 | Resolution | Open | Prototype first. The prototype runs a 480x320 gameplay grid on a 960x640 canvas, matching the 3:2 shape of your art. Target: 32-bit-era visuals, 16-bit responsiveness |
| 10 | Alcohol | Approved, expanded | A character-driven social and lifestyle system. Design proposal due before Milestone 7 |
| 11 | Saves | Approved | Local-first saves; architecture must not block future multiplayer and cloud persistence |
| 12 | Simulation | Approved | Independent statistical simulation engine |

Puck Falls is the working town name, pending your final approval. Still open: whether "Beer League HC" (on the jersey in the title art) is a team in the game or the brand only.

### Character and franchise decisions (added Nov 25)

These calls come from the create-a-player, franchise, career, tournament and prestige direction. All are proposals; none blocks the skating prototype, and all need your approval before Milestone 4 generates the league.

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| 13 | Created-player ratings | A point budget, sized and capped by the hockey background you pick | Keeps the creator fast and stops a 99-everything captain in Tin |
| 14 | Who is in the league | Your call: men's league only, or co-ed. The data supports either | It changes name pools, face presets and dialogue, so it must be set before art starts |
| 15 | Nationality mix | Mostly local (Canada and United States), with the other 15 nationalities weighted in a data file you can edit | A believable rec league with regular international characters, tunable without code |
| 16 | Creator and portrait style | Late-1990s 32-bit menus and 64x64 portraits; on-ice sprites stay on the 16-bit grid | Matches the NBA Live '98 reference without changing the arcade look |
| 17 | Imperfect English | Four fluency levels handled by authored, light grammar and idiom variations. No phonetic spellings | Readable, individual, and never a caricature |
| 18 | Inaugural franchises | 40 league teams plus about 8 tournament-only teams, chosen by you from a longlist of roughly 70 names I draft | You approve every name, crest and uniform; nothing is locked or drawn before that |
| 19 | Team cultures | Six to start: Old Guard, Ringer Hunters, Party Team, Bruisers, Deadbeats, Just Here for the Exercise | Covers your five examples plus a neutral baseline |
| 20 | Your team | The first career we ship is Player-Manager: you create a player and found a custom franchise that enters Puck League. Player-only and Manager-only careers follow on the same data | It exercises every system once; the other two paths are subsets of it, not separate modes |

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| 21 | Prestige ranks and values | Keep your six ranks (Unknown to Legendary); XP values and thresholds live in a config file and are set during Milestone 9 balancing | Names are yours; numbers need real simulated seasons behind them |
| 22 | Tournament circuit | Start with three formats (round robin, single elimination, groups then knockout) and four fictional events; names and rules come to you as a proposal | Covers weekend, charity and invitational play; double elimination and travel events build on the same parts |
| 23 | Where tournaments sit in the roadmap | After Milestone 8, as their own milestone, with the data model ready from Milestone 4 | Protects the gameplay-first order while keeping saves compatible |
| 24 | Group chat timing | A working availability-and-fees chat in Milestone 5; full character voice in Milestone 7 | It is a management screen first, so it should arrive with the systems it manages |
| 25 | Engine version | Phaser 3 (final 3.x release) for the prototype; evaluate Phaser 4 before Milestone 1 closes | Proven and stable now; moving later is cheap because match logic does not touch Phaser |

Two of the example names lean on outside properties: Puck Norris (a real person's name) and The Mighty Drunks (a film franchise). Both are your call; I have marked them for a second look on the longlist rather than dropping them.

## Decisions raised by the Milestone 0 / skating prototype checkpoint

All **Open**: they need the creative director's review of the playable build.

| # | Question | What the prototype does | Notes |
| --- | --- | --- | --- |
| P1 | Gameplay resolution and aspect (decision 9) | 480x320 grid (3:2, matching the supplied art), scaled by whole numbers only; key art shown at full resolution behind the canvas | Alternative: 16:9 (480x270), which crops the 3:2 art |
| P2 | Skater size on screen | About 20 px across on the 480x320 grid | Larger sprites read better but shrink the visible ice |
| P3 | Default skating feel | See `src/match/sim/tuning.ts` defaults | Tune live in the panel, then send back the values with COPY VALUES |
| P4 | Eight-way analog quantization | Stick input snaps to eight directions | True to the reference; could be loosened |
| P5 | Shot control | Hold to wind up, release to shoot; tap is a quick wrist shot | Pass button and one-timers come in Milestones 1 and 2 |
| P6 | Nets and goal counter in the prototype | Included as a shooting target | Small addition beyond the listed scope; easy to remove |
| P7 | Menu placement and temporary pixel font | Menu panel sits in the open area of the title art | Final type and frame art need approval |
| P8 | Engine version (decision 25) | Phaser 3.90.0, the final 3.x release. Phaser 4 is now the current major version | Evaluate Phaser 4 before Milestone 1 closes |
