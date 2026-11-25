# Roadmap

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization (Decision 34, Nov 25): **two tracks.** Track B (career, dynasty, player creation, statistical simulation) is under way with the menu, Hockey Influences, Player DNA, attribute generation and the creator foundation. Track A (the milestones below, from Milestone 1) stays gated on the hands-on skating checkpoint. The Track B phases are in `EXPANSION_PLAN.md` section 4.

The roadmap follows your nine milestones in order, with a short setup step in front, and each milestone ends at a playable build you approve before the next begins. No dates are set yet; I will estimate after Milestone 1 shows our real pace.

| # | Milestone | In scope | Done when | Deliberately not yet |
| --- | --- | --- | --- | --- |
| 0 | Project setup | Repo scaffold, Vite, TypeScript, Phaser, tests, CI, README, changelog, project knowledge base, title screen using the attached art, interactive main menu | The title screen runs in a browser from a clean clone and CI is green | Any gameplay |
| 1 | Arcade exhibition match | Rink, skating, puck, pass, shoot, basic goalie, goals, clock, two placeholder teams | You can play a full exhibition game and want to play another | Penalties, line changes, real rosters |
| 2 | Skating, physics, shooting, AI | Momentum tuning, one-timers, checking, rebounds, teammate and opponent AI, goalie AI, fatigue, lines, penalties, difficulty levels | AI-versus-AI games look like hockey and score in a believable range; one-timers feel right to you | League, stats screens |
| 3 | Game statistics and results | Full event log, box score, three stars, post-game screens, the `MatchResult` contract, replays | Every played game produces a validated result whose stats add up | Persistence across games |
| 4 | Persistent league | Five divisions, generated teams and players, schedule, standings, playoffs, quick sim, save and load v1 | You can play or simulate a full season to a champion and reload it intact | Roster changes, money |
| 5 | Rosters, recruitment, availability | Line management, free agents, recruiting, occupations, game-night availability, injuries, chemistry | Short benches happen, recruiting changes outcomes, and no player is ever on two teams | Finances, aging |
| 6 | Finances, aging, retirement, promotion | Fees and ledger, sponsors, development and decline, retirement, rookies, poaching, promotion and relegation | Ten simulated seasons pass every integrity check | Story content |
| 7 | Lifestyle locations and events | Town hub, six locations, dialogue runner, story events, morale effects, fighting minigame and disciplinary hearings | Each location has a purpose in the weekly loop and at least ten events | Records screens |
| 8 | History and dynasty progression | Records, trophies, banners, retired jerseys, Hall of Fame, season recaps | A 20-season save shows a coherent, browsable history | New systems |
| 9 | Balance and long-run testing | 50-season soak tests, economy and rating balance, difficulty tuning, save migration tests, polish | Soak runs show stable rating distributions, solvent leagues and no integrity failures | Scope additions |

**Track A is still gated:** Milestone 1 does not start until the skating checkpoint is explicitly approved.

**Nov 25 expansion briefs.** A proposed re-phasing that adds a career track (menu, Hockey Influences, attributes, four-season calendar, aging, recruitment, collectibles, Pick-Up, leaderboards, cinematics, fighting) beside Milestones 1 to 3 is in `EXPANSION_PLAN.md` section 4. Approved as the order of work by Decision 34; each Track B phase beyond the first still needs its own go-ahead.

See `BACKLOG.md` for where later systems are proposed to land.
