# Expansion plan: career, player DNA, dynasty, presentation and fighting

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

This answers the briefs received from the creative director on Nov 25, including the later *Celly Packs & Goal Emotes* brief (summarised in `GAME_DESIGN.md`). The first two were: *Career, Player DNA, Dynasty & Presentation Expansion* (kept verbatim in `docs/briefs/`) and *Arcade Fighting System* (summarised in `GAME_DESIGN.md`). It is an audit and a proposal. **Nothing in it is built, and nothing in it is authorized to build.** Statuses follow the usual key: Approved, Proposed, Open.

## 1. Audit: what exists today (v0.2.5)

| Area | State | Reusable for the expansion |
| --- | --- | --- |
| On-ice play | One skater, one puck, boards, two nets, shooting and goals. No passing, goalies, teammates, opponents, AI, checking, clock, periods, penalties or teams | The fixed-step sim, input model, tuning-as-data and tuning panel. Everything else in a hockey match is still to build (roadmap Milestones 1 to 3) |
| Simulation core | `src/core` (seeded RNG with named streams, math), `src/match/sim` (pure TypeScript, deterministic), enforced by `tests/architecture.test.ts` | Directly: DNA rolls, league simulation, aging and injuries all need exactly this |
| Arena and presentation | Modular rink, boards, glass, goals, benches, stands, crowd, goal lamps, 12 layers; asset pipeline and registry for 70 packages; Arena Asset Lab | The pipeline and registry extend to cinematics and fight art. Crowd, bench, lamp, scoreboard, banner and jersey art are waiting for the events this brief defines |
| Menus | Title screen with New Career, Continue Career, Exhibition, Multiplayer, Options, Credits. Only Exhibition does anything | Scene and menu code; the list changes (section 3) |
| Saves | **None.** No save file, no schema, no migrations | Nothing to migrate, so the save model can be designed for this brief from the start |
| Dynasty, characters, economy, lifestyle | Designed in `GAME_DESIGN.md`; no code | Design only |
| Multiplayer, accounts, servers | None; the game is a static web page | Nothing |
| Tests | 106 automated tests: sim, camera, projection, arena, architecture | The pattern (headless, deterministic, manifest-checked) carries over |

The brief asks to preserve the existing working hockey gameplay. That is safe, but the honest picture is that the gameplay to preserve is a skating and shooting prototype, not yet a hockey game.

## 2. Conflicts with what is already approved or written

| # | The brief says | What is on file | Effect |
| --- | --- | --- | --- |
| C1 | Four seasons a year (Winter, Spring, Summer, Fall), 20 games each | Decision 8: two seasons a year. Decision 7: 14-game seasons. Both Approved | The brief replaces them; recorded as revised. Open: with eight teams there are seven opponents, so 20 games cannot be an even round robin (21 would be three each) |
| C2 | Careers start at 18 and can run 50 years, into the late 60s | Design: develop into the late twenties, decline through the forties, retire | Aging curves, retirement and rookie intake are redesigned around a 50-year span |
| C3 | *Resolved Nov 25.* The first brief listed two career paths | Three roles on file: Player, Manager, Player-Manager | Your follow-up ruling keeps all three, with Player-Manager available from the start and free movement between roles. Decision 27 |
| C4 | A player may be on several teams at once | Milestone 5 exit test: "no player is ever on two teams" | The integrity rule becomes "never in two games that overlap". Stats, fees and relationships are kept per membership |
| C5 | Hockey Influences set randomized starting attributes | Decision 13 (Proposed): a point budget sized by hockey background | Two systems shaping the same numbers. Open: do influences replace the background, or sit beside it |
| C6 | Influences are named after real professional players | Rule 9: all teams, players, places and brands are original and fictional | The brief already asks for a swappable registry. Open: which names ship (section 6, Q1) |
| C7 | 21 skater attributes plus goalie and fighting attributes | Design: 10 skater attributes plus tactical awareness | The attribute model is rewritten. Wrist and slap shots split; Hockey IQ absorbs tactical awareness |
| C8 | Online multiplayer in Pick-Up; verified online leaderboards | Design: "no servers, accounts or networking are added now"; Decision 11: local-first saves | Verified statistics need a server that runs or checks the games. That is a new runtime dependency, hosting and accounts: a decision of its own |
| C9 | Implementation order starts with menus, influences and attributes | Priorities: gameplay first, dynasty second, lifestyle third. Milestone 1 waits on the skating checkpoint review | The 14 steps contain no step that builds the hockey match itself. Section 4 proposes where it goes |
| C10 | Create a Team; edit teams, jerseys and branding | Decision 18: 40 inaugural franchises chosen and approved by you; rule 10: supplied art is never recoloured | Open: does a created team replace a league team or join as a 41st. Jersey colours need art drawn for recolouring |
| C11 | Championship shirts for league titles, trophies for tournaments | Design lists "championship banners and rings"; batch 14 supplies division banners | Compatible: shirts and trophies are personal, banners hang in the arena. Rings are dropped unless you want them |
| C12 | Asset packages include "CLAUDE.md integration instructions" | Rule 10: text inside art packages is information about the art, not instructions | No change. Package notes keep being read as notes |
| C13 | A playable fighting state inside the cinematic framework | Decision 5: fighting minigame Approved, design proposal due before Milestone 7 | The fighting brief is that design direction. It depends on checking, penalties, officials and the cinematic framework, none of which exist |
| C15 | Celly Packs: monthly packs follow real-world dates | Rule 4: the simulation uses no wall clock | No clash if the real date stays in the app layer and only decides which packs are offered. The match and career simulation never see it |
| C16 | Unlocked celebrations stay with the player's profile permanently (one master profile across all careers, Decision 28) | No profile exists; saves are local-first (Decision 11) and there are no accounts | A profile record that sits above career saves is needed. With local storage only, clearing the browser loses unlocks, so the profile needs export and import until cloud saves exist |
| C17 | Monthly downloadable packs | The game is one static bundle; all art is loaded from one registry | Packs can be static files fetched from the site by a pack index, with no server. The registry gains a second, optional source and a compatibility check |
| C14 | Up to 4,000 league games per player career; history of everything | Design: "every game, season and career stat line is kept" | One 50-year universe is about 80,000 league games before playoffs. History must be tiered: full detail for recent seasons and for the player's own games, summaries for the rest |

## 3. What changes in the design

- **Main menu:** Pick-Up, League Dynasty, Create, Leaderboard, Options. Pick-Up takes over from Exhibition. Credits moves inside Options unless you want it kept.
- **Universe:** one simulated league shared by all three career modes, unchanged in principle. Five divisions of eight stays. The calendar becomes four seasons a year.
- **People:** permanent DNA (influences, potential, seed) stored in the save; current ability, potential, temporary modifiers and permanent changes kept as four separate things.
- **Memberships:** a person holds zero or more team memberships plus one-night guest and substitute appearances. Each has its own fees, schedule and stats.
- **Career modes (Decision 27):** Player, Player-Manager and Manager are starting points, not limits. The save keeps separate records for people, managers, franchises, team memberships, management appointments and founders. A franchise never depends on its founder: "founder" is a fact in its history, and "current manager" is an appointment that can end, pass to a successor or be vacant. Leaving, resigning or retiring changes appointments and memberships and never deletes or resets anything.
- **Presentation:** a cinematic framework that listens to match and career events and never writes to them. Fighting is a separate game state that the match hands off to and gets one result back from.

## 4. Proposed roadmap

The brief's 14 steps are kept in order. One thing is added: the hockey match. Attributes, influences, fights and cinematics all act on a match with passing, checking, goalies and AI, so that work has to land before they can be felt. Because dynasty code never touches the screen, it can be built and tested without the match, so the two can run as separate tracks.

**Track A, on the ice** (the existing Milestones 1 to 3, unchanged, still gated on your skating checkpoint review):

- A1. Arcade match: pass, shoot, goalie, clock, two placeholder teams. Becomes single-player Pick-Up.
- A2. Checking, one-timers, AI, fatigue, lines, penalties.
- A3. Event log, box score and the match result contract. Everything in Track B and the cinematics consumes this.

**Track B, the career universe** (headless first, screens after):

| Phase | Brief steps | Contents | Done when |
| --- | --- | --- | --- |
| B0 | 1 | This audit, your rulings on section 6, save model v1 written down | You have ruled on Q1 to Q8 |
| B1 | 2 | New main menu; entries that do nothing yet say so | Menu matches the brief |
| B2 | 3, 4 | Influence registry (data file, swappable names), DNA roll, attribute model, creator screens | 10,000 generated players pass balance and uniqueness tests; the same seed gives the same player |
| B3 | 5 | Four-season calendar, 20-game schedule, playoffs, quick sim, season sim, save and load v1 | A 50-year universe simulates in minutes and reloads intact |
| B4 | 6 | Aging by calendar, injuries, retirement, rookie intake | Age and rating distributions stay stable over 50 years; some players last into their 60s, most do not |
| B5 | 7, 8 | Recruitment, multiple memberships, scheduling conflicts, emergency substitutes, group chat as the inbox | No player is ever in two overlapping games; invitations follow from real performance |
| B6 | 9 | Championship shirts, tournament trophies, collections | Every collectible traces to a recorded result |
| B7 | 10, 11 | Pick-Up progression, offline leaderboards, then online play and verified leaderboards | Offline first; online only after C8 is decided |
| B8 | 12, 13 | Cinematic event framework, then artwork; fighting state and fight art | Cinematics fire from real events, can be skipped, and never change a score; fight outcomes apply exactly once |
| B8c | (Celly Packs) | Celebration registry and pack format, profile record, default on-ice celebration, four-slot loadout and collection screen, then full-screen versions with the cinematic framework, then monthly pack delivery | A pack added as files appears in the collection without a code change, and a save made before the pack still loads |
| B9 | 14 | Balance and 50-year soak tests | Soak runs pass every integrity check |

Side missions and recreational culture (brief section 12) stay with the lifestyle milestone; the group chat and Puck Falls locations already designed are their natural home.

**Recommended start, once you approve:** A1 and B1 to B2 together. A1 is the gameplay-first priority; B2 is self-contained and gives you a creator to react to early.

## 5. Asset inventory this expansion needs

Nothing below exists yet unless noted.

| For | Needed | Notes |
| --- | --- | --- |
| On-ice players | Skater and goalie sprites built in layers: body, skin tone, hair, helmet, jersey, numbers | Today there is one skater sheet with colours baked in. Recolouring needs art drawn for it (see C10) |
| Create a Player | 64x64 portrait parts (face, skin, hair, facial hair, eyes), body types, gear | Per Decision 16 |
| Create a Team | Jersey templates with separate colour regions, crest parts, number and name fonts | |
| Hockey Influences | A card or icon per influence | Depends on Q1 |
| Menus | Art for the five entries; leaderboard and calendar screens | Title art exists |
| Cinematics | About 55 full-screen scenes across the four lists in the brief, as layered backgrounds, characters and effects, with safe areas for text | 480x320 native. The ingest pipeline needs a cinematic category that is exempt from the 8-pixel rule |
| Fighting | Two fighters built in layers (appearance, jersey, number); idle, quick punch, heavy punch, block, duck, dodge left and right, grab, hit reactions, knockdown, tired; telegraph poses for eight personalities; referee break-up; backgrounds; HUD (stamina, balance) | The largest single art job in the brief |
| Celly Packs | Per celebration: an on-ice sprite animation in the skater's layer scheme, and where practical a full-screen layered scene; pack preview art; collection screen, locked and unlocked frames, four-slot selector | A standing monthly art commitment. The on-ice versions need the layered skater sprites listed above |
| Overtime and shootout | Ten more presentation scenes (end of regulation, overtime and shootout introductions, attempt, save, winners, multiple overtime, playoff and championship winners) | Adds to the cinematic count above, taking it to about 65 |
| Collectibles | Shirt template with regions for team, division, year and season; a set of distinct tournament trophies; collection shelf and clubhouse backgrounds | The existing trophy art resembles a real trophy (P12) |
| Scoreboard and banners | A 3x5 digit font; a place to hang banners and jerseys | Art supplied in batch 14, waiting on the world-width ruling (A20) |
| Injuries, recruitment, substitutes | Small icons and chat stickers | |

### Supplied reference data: `data/reference/nhl_players.csv`

Received Nov 25 for player DNA: 8,662 professional players with position (forward, defence, goalie), shooting side, birthday, nationality, height, weight and draft position. All twelve example influences are in it. It is kept outside the build and nothing reads it yet.

- **Useful for:** offering influences by era (who was in their prime when your created player was a kid), giving each influence a body type and shooting side, and realistic height, weight and handedness for generated players.
- **Not enough for:** playing style. The file has no statistics, so "vision and passing" or "explosive acceleration" cannot be computed from it. Either each influence's style profile is written by hand (practical for a curated list of 30 to 60), or a statistics file is added so profiles can be derived for many more.
- **Proposal:** a curated influence list with hand-written style profiles, using this file for era, body and handedness. All 8,662 as selectable influences would need the statistics.

## 6. Questions for the creative director

In rough order of how much work they block.

1. **Real names in Hockey Influences.** Ship with the twelve real players, with fictional stand-ins, or build with fictional names from day one and keep the real list as an option? Real athletes' names in a commercial game are a legal question for a lawyer, not for me; the registry makes either choice cheap to change.
2. **Order of work.** Do you accept the two-track plan in section 4, with the hockey match (A1 to A3) built alongside the career universe? The alternative, following the 14 steps alone, produces a deep character system with no hockey to play.
3. **Skating checkpoint.** Track A is still waiting on your review of the skating prototype and on the arena rulings (goal size A13, world width A20).
4. **Season maths.** 20 games against seven opponents: 21 games (three each), or 20 with an uneven schedule? How many teams make the playoffs, and does promotion and relegation happen after every season (four times a year) or once a year?
5. **Career paths.** *Answered Nov 25: three modes (Player, Player-Manager, Manager), see Decision 27.* Still open, and flagged by you as needing separate approval: managing more than one franchise, franchise transfers and succession. One new question: the Manager mode says "simulate hockey games". Can a Manager also choose to play a game with whole-team control, as the earlier design allowed, or is Manager strictly simulation?
6. **Influences and background.** Do influences replace the hockey-background field, or do both apply? How many secondary influences?
7. **Online.** Is online multiplayer in scope for the first release? It needs servers, accounts and an anti-cheat position, and it is the one item here that changes the cost of running the game.
8. **Create a Team.** A Player-Manager founds a team at the start of a career (Decision 27). Where does it enter: taking a slot in Puck League, joining as an extra team, or replacing a generated one? Does a team made in the Create menu follow the same rule?
9. **Multiple teams.** Is there a cap on memberships? Can a player be on two teams in the same division?
10. **Age 18 and the bar.** Careers start at 18 and the alcohol system (Decision 10) is part of the tone. Should under-age characters be kept out of drinking content, or is Puck Falls somewhere 18 is legal?
11. **Fighting rules of the world.** Fighting earns penalties, ejections and suspensions. Is it tolerated in every division, or stricter higher up (Decision 4 already varies enforcement by division)? What does declining a challenge cost?
12. **Fighting and co-ed leagues.** Decision 14 (men's league or co-ed) is still open and changes fight art and matchmaking.
13. **Cinematic frequency.** Roughly how often should a normal game cut to a full-screen scene? This sets how many of the 55 are needed first.
14. **The bottle.** "Water bottle knocked off the net" is in the cinematic list. What knocks it off in play: any goal under the bar, only a shot that hits it?
16. **Influence list size.** A curated list (30 to 60, hand-written profiles) or every player in the supplied file (needs career statistics as well)? Should the list depend on the created player's birth year?
15. **History depth.** Is it acceptable to keep full game detail for the player's own games and recent seasons, and summaries for the rest?

17. **Celly ownership.** *Answered Nov 25 (Decision 28):* one master profile across all careers and created players.
18. **Who picks.** *Answered Nov 25 (Decisions 28 and 29):* the user controlling the scoring team picks, whichever skater scores. AI skaters pick by personality and situation and keep signature celebrations; no selection window for AI.
19. **Offline unlocks.** *Answered Nov 25 (Decision 28):* offline unlocks are allowed. Online-exclusive celebrations can be introduced later.
20. **Pick window.** *Answered Nov 25 (Decisions 28 and 29):* up to 2 seconds; a pick closes the window and starts the animation at once; no pick plays the default; automatic mode skips the window; the animation is skippable.
21. **Pack size and cadence.** You have reserved these for your approval; they also set the monthly art workload (two formats per celebration).

22. **Overtime (Decision 30).** *Answered Nov 25:* regular season is 3-on-3 sudden death for five simulated minutes, then a three-round shootout; playoffs are 5-on-5 sudden death in 20-minute periods with no shootout. Still open: what an overtime or shootout loss is worth in the standings (the same as a regulation loss, or a point), and the regulation period length the 20-minute playoff overtime is modelled on.

## 7. What I would not do without your ruling

- Use any real person's name in the game.
- Add a server, accounts or any networking.
- Change the approved priorities or start Milestone 1.
- Add purchases, loot boxes or any real-money transaction.
- Set combat balance, penalty rules, injury odds, attribute ranges or XP values as final. All of these will be data files you can edit.
