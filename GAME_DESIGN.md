# Game design

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization: **Milestone 0 and the skating prototype only.**

The creative direction in this document comes from the creative director's Nov 25, 2026 response and follow-up briefs (characters, franchises, prestige, careers, tournaments). Specific presets, names, numbers and rules inside each system remain proposals until approved; see `DECISIONS.md`.

Beer League Hockey is a recreational hockey universe: NHL '94 gets people through the door, the dynasty keeps them playing, and beer league culture gives the game its identity. The order of priority is gameplay first, dynasty second, lifestyle third.

The creative DNA is NHL '94 (arcade feel), NBA 2K dynasty (franchise depth and persistent careers), Slap Shot (personalities and comedy), Road Rash (memorable opponents and grudges), GTA (a small interconnected town) and New Star Soccer (personal career and off-ice choices). Winning Gold League is the primary goal, and the career continues after it.

### Pillars

1. **The game feels great in ten seconds.** Skating, passing and one-timers must be fun with no dynasty attached. Milestones 1 to 3 ship nothing else.
2. **The league is alive without you.** Every team in every division has real players who age, improve, quit, move up and hold grudges, whether you play or simulate.
3. **It is about adults with jobs.** Availability, money and personality matter as much as ratings. Your best winger is a night-shift nurse; your goalie owes $240.
4. **Funny, then meaningful.** Jokes come from characters. Retired jerseys and banners are played straight.

### Core loop

1. **Weeknight prep:** check who is available, set lines, chase fees, visit one location.
2. **Game night:** play the game in arcade mode, or simulate it.
3. **After the game:** stats post, standings update, a bar scene or story event may fire.
4. **Between seasons:** playoffs, promotion and relegation, aging, retirements, rookies, recruiting, fee collection for next season.

### On-ice gameplay

- **Controls:** eight-way skating with momentum and glide, a pass button, a shoot button (tap for wrist shot, hold for slap shot), a speed burst, and on defense check, poke and switch player. Two face buttons plus a modifier, playable on keyboard or gamepad.
- **One-timers:** pass, then shoot before the puck arrives. This is the signature goal and gets the most tuning time.
- **Puck:** a free physics object with possession pickup, board and post rebounds, and a simulated height for lifted shots.
- **Goalies:** AI-controlled by default with positioning, save types and rebounds; manual goalie is an option.
- **Overtime (Decision 30, approved Nov 25):** a tied game plays one 5-minute overtime period, then a shootout if still tied.
- **Game rules:** line changes, per-shift fatigue, penalties and power plays, offsides and icing as toggles. Period length and difficulty are configurable.
- **Attributes:** speed, acceleration, agility, shot power, shot accuracy, passing, puck control, checking, defensive awareness, endurance, and a goalie set. Ratings run 1 to 99 but beer leaguers cluster low: a 40 in Puck League is a star.
- **Styles:** archetypes drive AI behavior and comedy, for example Sniper, Grinder, Dangler, Stay-at-home D, Ex-junior ringer, and Guy Who Never Passes.
- **Presentation:** original scorebug, period summaries, three stars, goal replays and a public-access-style broadcast voice in text.

### Referees can get hurt (approved direction, Nov 25; details proposed)

Inspired by Arch Rivals: the referee is a body on the ice, and a referee who is down cannot call anything.

- **How he goes down:** a body check, a high-speed collision or a hard shot knocks the referee over.
- **How long:** about 10 seconds by default, a league-rule value. He sits dazed, then gets up.
- **While he is down:** no penalties are called. The puck stays live and goals still count.
- **He remembers (proposal):** the first hit reads as an accident. Flatten him again and that team gets a tighter whistle for the rest of the period.
- **By division (proposal):** lower divisions have one referee, so one hit means open season; Gold League has two, so one can still call.
- **In the dynasty (proposal):** repeat referee abuse feeds disciplinary hearings and the franchise's sportsmanship reputation, and makes the newspaper.
- **Art:** the supplied referee sheet already has hit, down, dazed and helped-up frames.

Arrives with penalties in Milestone 2. Not implemented.

### Dynasty simulation

- **Structure:** five divisions from Puck League up to Gold League, with promotion and relegation each season (see decisions 6 to 8).
- **Players as people:** each has an age, occupation, personality traits, availability pattern, fee reliability, loyalty and ambition. Occupation drives schedule conflicts and income.
- **Availability:** each game night rolls who shows up, from work shifts, kids, injuries, hangovers and vacations. A short bench is a real tactical problem.
- **Money:** the team owes the rink a season fee. Players pay shares, some late, some never. Sponsors, the bar tab and jersey orders move the budget. Fail to pay and you forfeit games.
- **Careers:** players develop into their late twenties, decline through their late thirties and forties, and retire. Rookies and transfers enter each season. Good players get poached upward; fading ones drift down.
- **Chemistry and rivalries:** linemates build chemistry by playing together. Morale responds to ice time, results and events. Rivalries form from playoff series and incidents.
- **History:** every game, season and career stat line is kept. Records, trophies, retired jerseys and a Hall of Fame are built from that history.

The working ladder has eight teams per division. Rating ranges are balancing targets, not eligibility rules: ringers, fading veterans and raw rookies should regularly sit outside them.

| Tier | Division | Typical rating | Identity |
| --- | --- | --- | --- |
| 1 | Gold League | 75 to 90 | Former professionals, college players and elite amateurs |
| 2 | Silver League | 60 to 79 | Highly competitive experienced players |
| 3 | Bronze League | 45 to 64 | Established recreational players |
| 4 | Tin League | 30 to 49 | Weekend warriors and aging veterans |
| 5 | Puck League | 15 to 34 | Beginners and lovable disasters |

Every player is a person, not a stat line. Beyond the fields above, each carries reputation, friendships and rivalries, team history, injury history and disciplinary history. Personality types such as The Guy Who Never Passes, The Unreliable Goalie, The Guy Who Always Owes Money, The Equipment Snob and The Washed-Up Legend change how they play, when they show up, who they get along with and which story events find them.

### Lifestyle RPG

Puck Falls (working name) is a small hockey town of six locations, each with a job in the loop. It will eventually be an explorable 32-bit pixel-art hub; it is not being built yet.

| Location | Purpose |
| --- | --- |
| The Ice Barn | League headquarters: games, practices, free-agent skates, the commissioner, standings, fee payments, championship ceremonies |
| The Locker Room | Lines, team talks, player conversations, chemistry, conflict resolution, pre-game and post-game reactions |
| The Penalty Box Sports Bar | Celebrations, team bonding, recruiting, rival encounters, sponsors, bar tabs and social events |
| Top Shelf Hockey | Equipment, jersey customization, team merchandise, repairs, sponsorships |
| The Five Hole | Adult nightclub: comedic character encounters, celebrations, lifestyle choices with financial and morale consequences. Non-explicit |
| Player Home | Career management, personal finances, messages, calendar, trophy cabinet, memorabilia, personal stats |

Dialogue is short, choice-driven and data-authored. Adult humor stays implied and character-driven; nothing explicit is shown or described.

### Create-a-player and characters

One character system builds every person in the game, whether you create them or the league generates them, and the creator is a fast late-1990s-style menu rather than a 3D editor.

- **Creator flow:** four short screens (Identity, Body and face, Gear, Hockey and personality) with a live portrait, a Randomize button per screen and for the whole player, and a seed you can re-roll.
- **Fields:** first name, last name, nickname, nationality, hometown, age, height, weight, body type, skin tone, face preset, eye color, hair style, hair color, facial hair, position, handedness, jersey number, helmet style, visor or cage, equipment appearance, occupation, hockey background, archetype, personality, speaking style, native language and English fluency.
- **Independence rules:** nationality selects name and hometown pools and nothing else. Appearance, personality, intelligence and ratings are rolled separately. Two players from the same country can differ on every other field, including fluency.
- **Hockey background:** complete beginner, pond hockey, youth, high school, junior, college, former minor-league pro, former pro, roller hockey convert, returning rec veteran. Background shapes starting attributes, tactical awareness, development potential and which teams want you. Rare backgrounds are rare: a former pro in Tin is a league-wide story.
- **Tactical awareness:** a new attribute that keeps rising with experience while speed and endurance fall, so veterans stay useful.
- **Aging you can see:** hair grays and thins, weight drifts, and the portrait updates each season. Face, eyes, skin tone and build stay fixed, so a Season 1 rookie is recognizable in Season 20. Retired players can come back, with the same identity and history.

### Dialogue and voice

Every line is authored and assembled by rules; no external AI service is used.

- **How a line is built:** the situation (venue, event, result, morale, relationship, money) selects a template; the speaker's personality and speaking style choose the variant and vocabulary; fluency applies a light finishing pass.
- **Speaking styles:** a starting set such as Deadpan, Chirper, Dad Joker, Man of Few Words, Stats Nerd, Corporate Speak and Old-Timer, each with its own word list and catchphrases.
- **Language background:** native language and English fluency are separate from nationality. Lower fluency means simpler sentences, an occasional translated expression, or a word from the speaker's first language, always readable.
- **Where it shows up:** team group chat, locker room, recruiting, the bar, rival encounters, tournaments, post-game interviews and personal career events, all from the same engine.
- **Source of humor:** the individual, hockey culture and the situation. Never the accent.

### Franchise identity

Teams have ridiculous names and serious branding: the joke is that the Sofa Kings have a crest a pro club would envy.

- **Naming direction:** rec-league humor, hockey puns, double entendres and drinking references, in the spirit of Sofa Kings, Moose Knucklers, Morning Wood, The Sloppy Seconds, The Flaming Zambonis, The Bald Eagles, The Ice Holes, The Mid-Ice Crisis, The Dirty Danglers, The Groin Pullers, The Mother Puckers, The Whiskey Dekes and The Fighting Squirrels. No generic pro-style names. Innuendo stays implied.
- **What a franchise has:** a permanent ID, name and abbreviation, primary, secondary and accent colors, an original crest, home and away uniforms, founding year, backstory, culture, rivals, records, prestige, and recruitment and financial tendencies.
- **Culture drives AI:** each culture is a set of weights the AI manager uses. Old Guard teams keep loyal veterans, Ringer Hunters chase ex-junior talent, Party Teams value chemistry and social events, Bruisers take more penalties, Deadbeats struggle to collect fees.
- **Identity is not a division:** a franchise keeps its name, history and rivalries as it is promoted or relegated. Prestige rises and falls with results.
- **Other team types:** custom franchises you create, and tournament-only teams that appear at special events and never join the ladder.
- **Approval gate:** the inaugural roster, logos and uniforms are yours to approve. Until then the game uses clearly labeled placeholder teams.

### Prestige and reputation

Division says where a franchise plays; prestige says what it has done. A Tin League club with three old Gold titles can outrank a new Silver side.

- **Prestige** is permanent and only goes up. Ranks are provisionally Unknown, Established, Respected, Contender, Elite and Legendary.
- **Prestige XP** comes from season wins, playoff berths, regular-season and division titles, promotion, beating higher-division opponents, tournament wins, regional to international achievements and Gold League championships. Awards scale with competition difficulty, tournament standing and opponent quality.
- **No farming:** exhibitions award nothing, and each accomplishment can be awarded once.
- **Current reputation** is a separate, moving score built from recent results, fee reliability, sportsmanship and competitiveness. It can fall.
- **Effects:** recruitment and free-agent interest, player retention, sponsors, invitational eligibility, rivalry intensity, community recognition and honors. Prestige never changes on-ice attributes.
- **Same rules for everyone:** AI franchises earn and lose by identical rules, and prestige survives manager changes and retirements. Rankings exist per division and overall.

### Career paths

There is one persistent universe and three ways to live in it. On first entering League Dynasty you choose Player, Player-Manager or Manager (Decision 27, approved Nov 25); the choice sets how you start, not what you can become. A Player has no management duties. A Manager has no personal player. A franchise always outlives its founder: leaving, resigning or retiring never deletes or resets a team.

- **Player career:** create a player, find a team, pay your own fees, improve, buy gear, manage your money and time, earn ice time and the captaincy, field offers, move between teams and divisions. Captain lock eventually lets you control only your player.
- **Manager career:** found or take over a franchise: identity, recruiting, lines, fees, team finances, availability, emergency subs, chemistry, tournaments, sponsors, history. Play with whole-team control or simulate.
- **Player-manager:** both at once. Personal money and team money are always separate accounts.
- **Transitions:** become captain, found a franchise, retire as a player and keep managing, resign and join another club, come back from retirement. The league keeps running whatever role you hold.
- **More than one finish line:** tournament wins, individual awards, franchise titles, milestones, community reputation, records and the Hall of Fame all count alongside Gold League.

### Tournament circuit

Tournaments are their own competitions running beside the league calendar, never a kind of playoff.

- **Kinds:** weekend, charity, local invitational, regional, destination, national and international events.
- **Formats:** single elimination, double elimination, round robin, and group stage then knockout.
- **Each tournament has:** a permanent identity with annual editions, host location, eligibility and skill divisions, entry fee, prize pool, entrants, temporary rosters and guest players, schedule, its own rules, travel and lodging costs, fatigue across several games in a weekend, awards and MVP, past results, returning champions and its own reputation.
- **Entry is separate from the league:** franchises choose to enter, and individual players can be invited onto a temporary tournament team without leaving their regular club.
- **Stats stay separate:** regular season, league playoffs and tournaments are kept apart, with combined career totals derived from them.

### Team group chat

The group chat is the management screen, dressed as a rec-team text thread, and is planned as a signature feature.

- Players confirm or bail, ask for a sub goalie, argue about unpaid fees, celebrate, complain about ice time, chirp rivals, suggest recruits, report injuries and invite everyone to The Penalty Box.
- Every message is produced from real game state and a persistent character. If Rob says Mike owes $180, Mike owes $180.
- You act by replying: find a sub, chase a fee, set the lines, call out a no-show.

### League newspaper and long-term features

The town paper reports what the simulation actually did, in headlines such as LOCAL GOALIE FINALLY PAYS LEAGUE FEES and 47-YEAR-OLD DEFENSEMAN ANNOUNCES FIFTH RETIREMENT.

Also on the long-term list: emergency substitutes, free-agent recruitment skates, commissioner interactions, player reputation, disciplinary hearings, the fighting minigame, championship banners and rings, retired-jersey ceremonies, a franchise Hall of Fame, season summaries, all-time leaderboards, former teammates as opponents, and reunion and retirement events.

### Multiplayer (future)

Friends managing rival franchises in one shared universe is a future requirement: local and online exhibition, private leagues, asynchronous dynasty management, scheduled head-to-head games and commissioner-run leagues. No servers, accounts or networking are added now.

### Tone and art direction

The three attached pieces set the look: a red, white and royal-blue palette, the crossed-sticks-and-mug crest, snowy night exteriors, and The Penalty Box in neon. Gameplay sprites follow the same palette on a strict pixel grid. The title screen uses the locker-room scene; the sunset rink splash suits loading and season-start screens; the crest is the logo for the menu, favicon and save files.

The target is late-1990s 32-bit pixel art in the Saturn and PlayStation 2D tradition, with NHL '94 readability on the ice: rich environments, expressive portraits, bold retro sports type, snowy nights, warm locker rooms and neon bars. Menus, scoreboards, stat screens and dialogue boxes must look like a commercial retro sports game.

- **Avoid:** SaaS dashboard styling, rounded cards, glass effects, emoji as game assets, mixed pixel resolutions, blurry scaling, and AI-generated placeholders presented as final art.
- **Title screen:** your menu-free title art is the background; the menu is a separate interactive layer: New Career, Continue Career, Exhibition, Multiplayer, Options, Credits. Unbuilt modes are marked Coming Soon.
- **Art ownership:** you provide and approve artwork. Anything I generate in code is a labeled temporary stand-in.

All teams, players, sponsors and brands are original and fictional. No real leagues, teams, players or beer brands appear.

### Expansion direction received Nov 25 (not yet reconciled)

Two briefs from the creative director extend this document: *Career, Player DNA, Dynasty & Presentation Expansion* (verbatim in `docs/briefs/`) and *Arcade Fighting System* (below). Where they differ from the sections above (season structure, career length, career paths, attributes, team membership, menus), the briefs are the newer direction; the differences and the open questions are listed in `EXPANSION_PLAN.md`. This document will be rewritten section by section as those questions are answered.

### Arcade fighting system (direction, Nov 25; nothing built)

- **What it is:** when a fight starts during play, the match hands off to a full-screen fighting scene in original 32-bit pixel art: Punch-Out!! timing and pattern-reading with Baseball Stars 2 presentation. It is played, not watched.
- **Triggers:** excessive checking, rivalries, retaliation, protecting a teammate, repeated aggression, personality conflicts, deliberate challenges. Challenges can be accepted or declined where it makes sense.
- **Sequence:** confrontation, gloves drop, cinematic transition, the fight (attacks, blocks, dodges, counters), one fighter loses balance, tires or is beaten, officials step in, penalties and possible ejections, back to hockey.
- **Mechanics:** directional dodge, block, duck, quick and heavy punches, jersey grab, button combinations, counter windows, stamina, balance, knockdowns. Accessible first; rewards timing and learning an opponent. Keyboard, gamepad and multiplayer.
- **Attributes:** strength, balance, endurance, composure, aggression, durability, fighting experience, reaction speed, tied to player DNA. Fighting has its own experience track and must not become the main way to improve at hockey.
- **Opponent personalities:** Brawler, Counterpuncher, Heavyweight, Grappler, Speedster, Veteran, Hothead, Opportunist. Each telegraphs its attacks with readable animation cues.
- **Consequences:** reputation, teammate relationships, captain approval, rivalries, penalty minutes, suspensions, ejections, injury risk, recruitment, chemistry. Fighting is not always good for you: some captains want protection, others see a liability. Fighting stats are tracked apart from hockey stats.
- **Technical:** an independent game state. The match state is preserved on entry and resumed on exit; penalties and injuries are applied exactly once. Fighters are built from layers (created appearance, skin tone, hair, facial hair, body type, jersey colours and number, opponent identity) over reusable backgrounds, animation atlases, effects and HUD. Difficulty is configurable and fights can be auto-simulated.
- **Needs approval before it is final:** combat balance, penalty rules, injury probabilities.

### Celly Packs and goal emotes (direction, Nov 25; nothing built)

- **What it is:** collectible goal celebrations you unlock, collect, equip and perform across a career. Purely cosmetic: no effect on attributes, scoring or results.
- **After a goal (Decision 28, approved):** once the goal is confirmed, the user controlling the scoring team has 2 seconds to pick one of four equipped celebrations by direction (keyboard or gamepad), whichever skater scored. No pick plays the default. The celebration animation that follows can be skipped.
- **Ownership (Decision 28, approved):** one master profile holds every unlock and the loadout, across all careers and created players. Offline play unlocks celebrations; online-exclusive ones may come later.
- **Two formats:** an on-ice overhead sprite animation, and a full-screen 32-bit cinematic that shows the created player's appearance, jersey colours, number and team. Each celebration supports both where practical.
- **AI celebrations (Decision 29, approved):** AI skaters pick from their personality, preferences and the situation (rival, former team, hat trick, overtime winner, championship, well behind) and keep persistent signature celebrations, so familiar opponents are recognisable. No selection window for AI. Seeing an NPC's celebration does not unlock it.
- **Early pick (Decision 29, approved):** two seconds is a maximum. A valid pick closes the window and the animation starts immediately; automatic celebration mode skips the window.
- **Monthly packs:** released by Tiny Mana Studios on real-world dates, independent of the in-game calendar. Each pack has an ID, name, release date, preview art, celebration IDs, animation assets, unlock requirements, a compatibility version and a manifest. Installing a pack never needs a code change and never invalidates a save.
- **Unlocks:** configurable, from career goals, assists, games played, hat tricks, overtime winners, league championships, tournament wins, monthly challenges, milestones and special events. Once unlocked, a celebration stays with the profile for good, including after its event ends.
- **Loadout and collection:** four active slots; a collection screen with locked and unlocked states, previews, unlock progress, equipped slots and pack history.
- **Multiplayer:** send the celebration ID, never the files; fall back to the default if the other client lacks the pack.
- **Technical:** fires only after a confirmed goal; never duplicates a goal, changes a result or interrupts scoring. Assets are kept apart from core player animation. Manifests are versioned and backward compatible.
- **Needs approval:** any paid purchase, loot box or real-money transaction; pack size, unlock difficulty and release cadence.
