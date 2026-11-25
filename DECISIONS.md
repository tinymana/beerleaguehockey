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
| P2 | Skater size on screen | Supplied sprite, about 34 px tall in a 48x48 cell (v0.1.2) | Larger sprites read better but shrink the visible ice |
| P3 | Default skating feel | See `src/match/sim/tuning.ts` defaults | Tune live in the panel, then send back the values with COPY VALUES |
| P4 | Eight-way analog quantization | Stick input snaps to eight directions | True to the reference; could be loosened |
| P5 | Shot control | Hold to wind up, release to shoot; tap is a quick wrist shot | Pass button and one-timers come in Milestones 1 and 2 |
| P6 | Nets and goal counter in the prototype | Included as a shooting target | Small addition beyond the listed scope; easy to remove |
| P7 | Menu placement and temporary pixel font | Menu panel sits in the open area of the title art | Final type and frame art need approval |
| P8 | Engine version (decision 25) | Phaser 3.90.0, the final 3.x release. Phaser 4 is now the current major version | Evaluate Phaser 4 before Milestone 1 closes |
| P9 | Camera angle | **Direction approved:** angled overhead view in the style of NHL '94 (creative director, Nov 25). **Open:** the exact tilt. v0.1.1 defaulted to 0.78; v0.2.0 defaults to 0.74 to match the supplied arena art. Live slider | Rink art depends on this number, so settle it before commissioning rink art |
| 26 | Referee knock-out | **Direction approved** (creative director, Nov 25): Arch Rivals-style, the referee can be hurt for about 10 seconds and cannot make calls. **Proposed details:** triggers, the grudge rule, one referee in lower divisions and two in Gold, dynasty consequences. See `GAME_DESIGN.md` | Lands with penalties in Milestone 2. Not implemented |
| P10 | League crests in art batch 01 | The supplied crests show Gold, Silver, Bronze, a "Rec League" and four geographic divisions; the approved ladder is Gold, Silver, Bronze, Tin, Puck | Open: redraw to the ladder, or change the ladder |
| P11 | Pro-league badges in art batch 01 | Draft, Trade Deadline, Free Agency and All-Star Game badges were supplied, but none of these exist in the design | Open: add them to the design or drop the badges |
| P12 | Trophy art | The supplied cup closely resembles a real, famous hockey trophy | Proposed: redraw as an original trophy, in line with the all-original rule |
| P16 | Bench area layout and bench players | Batch 12 placed as a proposal: benches facing across centre ice, a penalty box south of each, timekeeper on the east; six seated players a side in placeholder blue and red | Open: `ARENA.md` A16 to A19 |
| P14 | Goal size | Supplied goals (batch 11) are 37 px between the posts; the gameplay net is 24 px. v0.2.2 draws the art at native size and leaves the physics alone | Open: widen the gameplay net to match (recommended, needs approval as a physics change) or redraw the art. `ARENA.md` A13 |
| P15 | Bottle on the net, dislodged goals | Batch 11 supplies bottle knock-off and dislodged-goal animations. Neither is a designed mechanic | Open: `ARENA.md` A14, A15. Recorded in `BACKLOG.md`; not built |
| P13 | Arena art scale and tilt | Supplied circles are 32 px wide against a 120 px gameplay circle, and imply a tilt near 0.73. v0.2.0 shows them at 4x and defaults the tilt to 0.74 | Open: see `ARENA.md` A1 to A12 for all arena questions. The largest is A8: the supplied corner boards turn in 37 px against the rink's 112 px |
