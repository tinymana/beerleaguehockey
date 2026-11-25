# Registries: influences, play styles, archetypes, backgrounds, personality traits

*Revised Nov 25 after the creative director's decisions: play style is chosen (Decision 43), archetypes evolve (Decision 44), personality is its own system (Decision 45).*

Beer League Hockey - Tiny Mana Studios. Requested by the batch 16 brief (section 8) so that card art for batch 16.10 can be commissioned against approved entries.

**Status words used here.** *Implemented*: in the game and tested (v0.3.0). *Designed*: written in `GAME_DESIGN.md`, no code. *Proposed*: my suggestion, not approved. Nothing below adds a gameplay mechanic; where an entry would need one, it says so.

Ids are stable and never shown to players. Display names can change without touching a save.

## 1. Hockey Influences (gold cards): implemented

64 entries. Category: Hockey Influence. **Gameplay effect, implemented:** moves a created player's starting ratings and natural potential toward the listed strengths and away from the weaknesses, without changing the total (primary counts 60 to 100%, up to two secondaries share the rest); supplies the player's listed tendencies. No other effect. **Position eligibility:** F and D influences are open to any skater; G influences to goalies only. **Required artwork for every entry:** one gold card. Real names are a development setting (Decision 34); each entry also needs a fictional alias before real names could be switched off, and real likenesses need licensing review before release.

| Id | Display name | Pos | Born | Tendencies | Leans toward (strongest first) | Leans away from | Description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | Wayne Gretzky | F | 1961 | playmaker, vision | **passing, off. awareness, hockey IQ**; puck control, wrist accuracy, composure, agility | checking, strength, slap power | Sees the play two passes before anyone else on the ice. |
| F02 | Mario Lemieux | F | 1965 | dangler, power | **puck control, off. awareness, wrist accuracy**; strength, passing, composure, balance | endurance, durability, def. awareness | Big, smooth and impossible to take the puck from. |
| F03 | Jari Kurri | F | 1960 | sniper, two-way | **wrist accuracy, slap accuracy, def. awareness**; off. awareness, hockey IQ, discipline, passing | checking, strength | Finds the quiet ice, finishes, then backchecks. |
| F04 | Teemu Selanne | F | 1970 | speed, sniper | **speed, acceleration, wrist accuracy**; off. awareness, wrist power, agility | def. awareness, checking, faceoffs | Flat-out speed down the wing and a quick release. |
| F05 | Pavel Bure | F | 1971 | speed, breakaway | **acceleration, speed, puck control**; wrist accuracy, agility, off. awareness | def. awareness, durability, checking | Three explosive strides and gone on a breakaway. |
| F06 | Steve Yzerman | F | 1965 | leader, two-way | **leadership, def. awareness, hockey IQ**; passing, wrist accuracy, faceoffs, composure | strength, checking | Captain first: scores, checks and blocks shots. |
| F07 | Mark Messier | F | 1961 | leader, power | **leadership, strength, checking**; speed, faceoffs, composure, wrist power | discipline, agility | Drags a team into the fight and wins it. |
| F08 | Brett Hull | F | 1964 | shooter, sniper | **slap power, slap accuracy, wrist power**; off. awareness, wrist accuracy | def. awareness, speed, endurance | Gets open, one-times it, raises his arms. |
| F09 | Jaromir Jagr | F | 1972 | power, dangler | **puck control, strength, balance**; passing, wrist accuracy, durability, off. awareness | def. awareness, faceoffs | Protects the puck on his hip until you give up. |
| F10 | Joe Sakic | F | 1969 | sniper, leader | **wrist accuracy, wrist power, composure**; leadership, passing, hockey IQ, acceleration | checking, strength | The quiet captain with the fastest wrist shot going. |
| F11 | Peter Forsberg | F | 1973 | power, playmaker | **puck control, balance, passing**; strength, checking, off. awareness, hockey IQ | durability, discipline | Runs you over, then sets up the goal. |
| F12 | Sergei Fedorov | F | 1969 | two-way, speed | **speed, def. awareness, agility**; puck control, wrist power, hockey IQ, faceoffs | checking, strength | Skates like the wind at both ends of the rink. |
| F13 | Mike Bossy | F | 1957 | sniper | **wrist accuracy, off. awareness, wrist power**; slap accuracy, puck control, discipline | checking, durability, def. awareness | Pure goal scorer: the puck is in before you see it. |
| F14 | Guy Lafleur | F | 1951 | speed, sniper | **speed, slap power, off. awareness**; acceleration, wrist accuracy, passing | checking, def. awareness, discipline | Hair flying, full speed, slap shot off the rush. |
| F15 | Gordie Howe | F | 1928 | power, complete | **strength, durability, checking**; wrist accuracy, balance, off. awareness, endurance | discipline, agility | Does everything, forever, and you feel every shift. |
| F16 | Bobby Hull | F | 1939 | shooter, speed | **slap power, speed, strength**; slap accuracy, acceleration, wrist power | def. awareness, passing | The hardest shot anyone had seen, taken at full speed. |
| F17 | Maurice Richard | F | 1921 | sniper, competitor | **wrist accuracy, composure, acceleration**; off. awareness, strength, leadership | discipline, passing | From the blue line in, nobody wanted it more. |
| F18 | Phil Esposito | F | 1942 | net-front | **strength, balance, off. awareness**; wrist accuracy, faceoffs, composure | speed, acceleration, agility | Parks in the slot and cannot be moved. |
| F19 | Bryan Trottier | F | 1956 | two-way, complete | **faceoffs, def. awareness, checking**; passing, leadership, hockey IQ, strength | speed, slap power | Wins the draw, wins the corner, wins the game. |
| F20 | Mike Modano | F | 1970 | speed, two-way | **speed, wrist power, acceleration**; def. awareness, agility, slap accuracy | checking, strength | Jersey flapping, fastest stride on the ice. |
| F21 | Eric Lindros | F | 1973 | power | **strength, checking, wrist power**; puck control, off. awareness, balance | durability, discipline | A freight train with soft hands. |
| F22 | Cam Neely | F | 1965 | power, sniper | **checking, wrist power, strength**; wrist accuracy, off. awareness, composure | durability, speed, agility | Hits like a truck and scores like a sniper. |
| F23 | Brendan Shanahan | F | 1969 | power, shooter | **slap power, strength, wrist power**; checking, leadership, durability | agility, discipline | Goals, hits and the odd scrap, all in one night. |
| F24 | Pavel Datsyuk | F | 1978 | dangler, two-way | **puck control, def. awareness, agility**; passing, hockey IQ, discipline, faceoffs | strength, slap power | Picks your pocket and makes you look silly doing it. |
| F25 | Sidney Crosby | F | 1987 | complete, grinder | **balance, puck control, hockey IQ**; passing, faceoffs, leadership, endurance, strength | slap power, checking | Wins every battle below the goal line. |
| F26 | Alex Ovechkin | F | 1985 | shooter, power | **slap power, slap accuracy, checking**; strength, wrist power, durability, off. awareness | def. awareness, passing | One-timer from the left circle. Everyone knows. It goes in anyway. |
| F27 | Patrick Kane | F | 1988 | dangler, playmaker | **puck control, agility, passing**; wrist accuracy, off. awareness, composure | checking, strength, def. awareness | Slows the game down with the puck on a string. |
| F28 | Connor McDavid | F | 1997 | speed, dangler | **speed, acceleration, puck control**; passing, agility, off. awareness | checking, strength | Top speed with the puck, and then another gear. |
| F29 | Jarome Iginla | F | 1977 | power, leader | **wrist power, strength, leadership**; checking, wrist accuracy, durability | agility, passing | Scores, hits, fights and shakes your hand after. |
| F30 | Paul Kariya | F | 1974 | speed, sniper | **speed, wrist accuracy, agility**; acceleration, passing, discipline, hockey IQ | strength, durability, checking | Small, clean, clever and very fast. |
| F31 | Mats Sundin | F | 1971 | power, leader | **strength, wrist power, balance**; leadership, faceoffs, puck control | agility, acceleration | A big captain with a long reach and a heavy shot. |
| F32 | Doug Gilmour | F | 1963 | two-way, grinder | **composure, def. awareness, passing**; faceoffs, hockey IQ, leadership, endurance | strength, slap power | Undersized, relentless, best when it matters. |
| F33 | Bob Probert | F | 1965 | enforcer | **strength, checking, durability**; balance, wrist power, composure | discipline, speed, agility | The heavyweight. Nobody takes liberties with his linemates. |
| F34 | Tie Domi | F | 1969 | enforcer | **checking, balance, strength**; durability, leadership, endurance | discipline, wrist accuracy, passing | Short, square and always first off the bench. |
| F35 | Theo Fleury | F | 1968 | grinder, sniper | **acceleration, composure, agility**; wrist accuracy, speed, checking | discipline, strength | The smallest guy out there, playing like the biggest. |
| F36 | Jean Beliveau | F | 1931 | leader, playmaker | **leadership, passing, balance**; strength, puck control, discipline, hockey IQ | acceleration, checking | Grace, reach and class in every shift. |
| F37 | Stan Mikita | F | 1940 | playmaker, two-way | **passing, faceoffs, hockey IQ**; puck control, def. awareness, agility | strength, slap power | A crafty centre who made everyone around him better. |
| F38 | Patrice Bergeron | F | 1985 | two-way | **def. awareness, faceoffs, hockey IQ**; discipline, leadership, passing, balance | speed, slap power | Always in the right spot, always wins the draw. |
| F39 | Nathan MacKinnon | F | 1995 | speed, power | **acceleration, speed, wrist power**; strength, puck control, composure | discipline, def. awareness | Explodes through the neutral zone, angry. |
| F40 | Evgeni Malkin | F | 1986 | power, dangler | **puck control, strength, off. awareness**; wrist power, passing, balance | discipline, faceoffs, def. awareness | Big, unpredictable, takes over a game by himself. |
| D01 | Bobby Orr | D | 1948 | offensive-d, speed | **speed, puck control, off. awareness**; acceleration, passing, def. awareness, agility | durability, discipline | A defenceman who leads the rush end to end. |
| D02 | Nicklas Lidstrom | D | 1970 | stay-home, puck-mover | **def. awareness, hockey IQ, discipline**; passing, slap accuracy, composure, durability | checking, strength | Never out of position, never rattled, never in the box. |
| D03 | Scott Stevens | D | 1964 | physical, stay-home | **checking, strength, def. awareness**; balance, leadership, durability | discipline, agility, off. awareness | Keep your head up crossing his blue line. |
| D04 | Ray Bourque | D | 1960 | complete, puck-mover | **slap accuracy, passing, def. awareness**; slap power, hockey IQ, endurance, leadership, durability | acceleration, faceoffs | Plays half the game and hits the net every time. |
| D05 | Paul Coffey | D | 1961 | offensive-d, speed | **speed, acceleration, passing**; off. awareness, puck control, slap power | def. awareness, checking, strength | A fourth forward with the smoothest stride in hockey. |
| D06 | Chris Chelios | D | 1962 | physical, competitor | **durability, endurance, checking**; def. awareness, composure, leadership | discipline, slap accuracy | Mean, tireless, and still playing at an age nobody believes. |
| D07 | Al MacInnis | D | 1963 | shooter | **slap power, slap accuracy, passing**; strength, def. awareness, hockey IQ | speed, agility | The slap shot goalies have nightmares about. |
| D08 | Denis Potvin | D | 1953 | complete, physical | **checking, passing, leadership**; def. awareness, slap power, strength, off. awareness | discipline, speed | Hits you, takes the puck, starts the rush. |
| D09 | Larry Robinson | D | 1951 | physical, stay-home | **strength, def. awareness, balance**; checking, passing, discipline | acceleration, agility | A calm giant who clears the front of the net. |
| D10 | Brian Leetch | D | 1968 | offensive-d, puck-mover | **puck control, passing, agility**; speed, off. awareness, hockey IQ | strength, checking | Walks the blue line and threads the pass. |
| D11 | Chris Pronger | D | 1974 | physical, power | **strength, def. awareness, checking**; passing, slap power, hockey IQ | discipline, agility, speed | Long reach, nasty streak, first pass on the tape. |
| D12 | Scott Niedermayer | D | 1973 | speed, puck-mover | **speed, agility, composure**; passing, def. awareness, leadership, puck control | checking, strength | Effortless skater who is never in a hurry. |
| D13 | Zdeno Chara | D | 1977 | physical, shooter | **strength, slap power, checking**; def. awareness, durability, leadership | agility, acceleration, speed | The biggest man on the ice with the hardest shot. |
| D14 | Cale Makar | D | 1998 | offensive-d, speed | **agility, acceleration, puck control**; speed, off. awareness, wrist accuracy, passing | strength, checking | Edges and deception from the back end. |
| G01 | Patrick Roy | G | 1965 | butterfly, competitor | **positioning, pads, composure**; leadership, rebounds, hockey IQ | puck handling, discipline | Drops to the butterfly and dares you to beat him. |
| G02 | Dominik Hasek | G | 1965 | acrobatic | **reflexes, recovery, agility**; composure, pads, endurance | positioning, rebounds, puck handling | No style at all. Stops everything anyway. |
| G03 | Martin Brodeur | G | 1972 | hybrid, puck-handler | **puck handling, positioning, durability**; glove, composure, endurance | pads, agility | A third defenceman who plays every single night. |
| G04 | Ken Dryden | G | 1947 | stand-up | **positioning, composure, hockey IQ**; glove, strength, balance | recovery, agility, puck handling | Tall, calm, leaning on his stick between whistles. |
| G05 | Grant Fuhr | G | 1962 | acrobatic | **reflexes, glove, agility**; recovery, composure, endurance | positioning, rebounds, discipline | Gives up five, then makes the save that wins it. |
| G06 | Terry Sawchuk | G | 1929 | stand-up, competitor | **reflexes, balance, composure**; glove, positioning | puck handling, discipline | Crouched low, fearless, face first. |
| G07 | Ed Belfour | G | 1965 | butterfly, competitor | **pads, positioning, composure**; puck handling, endurance, recovery | discipline, glove | Intense, technical and a little bit scary. |
| G08 | Henrik Lundqvist | G | 1982 | butterfly | **positioning, reflexes, pads**; composure, durability, leadership | puck handling, recovery | Deep in the net, square to everything. |
| G09 | Carey Price | G | 1987 | hybrid | **positioning, composure, rebounds**; puck handling, glove, hockey IQ | durability, recovery | So calm it looks easy. |
| G10 | Ron Hextall | G | 1964 | puck-handler, competitor | **puck handling, strength, leadership**; reflexes, composure, endurance | discipline, rebounds, positioning | Shoots the puck, swings the stick, owns the crease. |

## 2. Play Styles (ice blue cards): proposed registry, chosen by the player (Decision 43)

**Ruling:** Play Style is a player-selected gameplay identity. It influences attribute allocation tendencies, development priorities and AI behaviour, works inside the existing attribute budget, is position-appropriate, and can evolve over a career.

**What exists today:** not a choice yet. Tendency tags come from influences.

**Proposed gameplay implications, for approval before balancing:**

- **Allocation:** a style has its own small set of leanings (the "leans toward" and "leans away" columns). They are blended into the same zero-sum spread the influences use, so a style reshapes a player and never adds rating points. Proposed strength: a quarter of the total, taken proportionally from the influences.
- **Development:** when progression exists, experience flows a little faster into the style's attributes. Proposed: 20% faster there, the same amount slower elsewhere.
- **AI behaviour:** on the ice, AI-controlled players act their style. Track A work, not designed yet.
- **Evolving:** the chosen style can be changed between seasons; the change affects development from then on and never rewrites ratings already earned.
- **Chosen against observed:** the game can also work out an *observed style* from what the player actually does (shots, passes, hits). Show both: "Chosen: Playmaker. Plays like: Sniper." Observed style is a label only.

| Id | Display name | Eligible | Description | Leans toward | Leans away | Status | Art |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PS01 | Sniper | F | Lives to shoot. Finds a lane and lets it go. | wrist accuracy, wrist power, off. awareness | passing, def. awareness | Proposed | Blue card |
| PS02 | Playmaker | F | Pass first, pass second, look annoyed when nobody finishes. | passing, hockey IQ, off. awareness | wrist power, checking | Proposed | Blue card |
| PS03 | Dangler | F | Tries to go through everyone. Sometimes does. | puck control, agility, composure | passing, def. awareness | Proposed | Blue card |
| PS04 | Power Forward | F | Drives the net with a defender on his back. | strength, balance, checking, wrist power | agility, discipline | Proposed | Blue card |
| PS05 | Two-Way Forward | F | Back before the puck is. Coaches love him; nobody else notices. | def. awareness, hockey IQ, discipline, faceoffs | wrist accuracy, slap power | Proposed | Blue card |
| PS06 | Grinder | F | Wins the corner, loses a tooth, goes back in. | endurance, checking, durability | puck control, wrist accuracy | Proposed | Blue card |
| PS07 | Speedster | F, D | One move: faster. | speed, acceleration | strength, checking | Proposed | Blue card |
| PS08 | One-Timer Guy | F, D | Stands at the circle with his stick in the air, all game. | slap power, slap accuracy | def. awareness, endurance | Proposed | Blue card |
| PS09 | Enforcer | F, D | Here so nobody touches the good players. | strength, checking, durability | discipline, puck control | Proposed | Blue card |
| PS10 | Offensive Defenseman | D | A fourth forward who sometimes remembers. | speed, passing, off. awareness | def. awareness, checking | Proposed | Blue card |
| PS11 | Shutdown Defenseman | D | Has not crossed the red line since 2009. | def. awareness, strength, discipline | off. awareness, speed | Proposed | Blue card |
| PS12 | Puck Mover | D | First pass on the tape, every time. | passing, hockey IQ, composure | checking, strength | Proposed | Blue card |
| PS13 | Bruiser | D | Clears the crease by any means. | checking, strength, balance | agility, discipline | Proposed | Blue card |
| PS14 | Butterfly Goalie | G | Drops early, covers the bottom, dares you to go high. | positioning, pad saves | glove, puck handling | Proposed | Blue card |
| PS15 | Stand-Up Goalie | G | Old school. Stays on his skates and plays the angles. | positioning, glove, balance | pad saves, recovery | Proposed | Blue card |
| PS16 | Acrobat | G | No technique. Somehow stops it. | reflexes, recovery, agility | positioning, rebounds | Proposed | Blue card |
| PS17 | Puck-Handling Goalie | G | Thinks he is a defenseman. Is occasionally right. | puck handling, composure | pad saves, discipline | Proposed | Blue card |

Dropped since the first draft: Faceoff Specialist (too narrow to be an identity; faceoffs now sit under Two-Way Forward). Left out on purpose: a Hybrid goalie, which is the absence of a style.

## 3. Beer League Archetypes (green cards): proposed registry, evolving (Decision 44)

**Ruling:** an archetype is a player's identity within beer league culture. The player picks an eligible starting archetype in the creator; it then evolves with age, experience, memberships, leadership, attendance, loyalty, decisions, discipline, achievements and events. Age-dependent archetypes respect the player's actual age. History is kept, never overwritten. Transitions may trigger dialogue, milestones, cinematics and relationship changes.

**Gameplay implications:** none on attributes, by design (Decision 45 keeps modifiers from stacking across systems). An archetype changes how people talk to you and about you, which invitations and events you see, and what the newspaper calls you. Each of those hooks is specified when its system is built.

**Proposed rules, for approval:**

- A person has exactly **one current archetype** and a **history**: each entry records the archetype, the date it began and the reason.
- Transitions are checked **between seasons**, and when a named event happens (captaincy, a fifth team).
- When more than one is earned, the **rarer one wins** (the order of the evolved table, top first). The player is told, with a card reveal, and it goes in the history.
- An earned archetype is **not lost** when its condition lapses, except where the table says so (Captain, No-Show).
- Generated league players get an archetype by the same rules, applied to their generated history.

### 3a. Starting archetypes (selectable at 18)

| Id | Display name | Eligible | Description | Status | Art |
| --- | --- | --- | --- | --- | --- |
| AR01 | Rookie | Anyone | New skates, no idea where to stand, tapes his stick wrong. The default. | Proposed | Green card |
| AR02 | Pond Hockey Kid | Background: Pond hockey | Learned outdoors. Great hands, has never heard of offside. | Proposed | Green card |
| AR03 | Washed-Up Junior | Background: Junior | Played junior, will tell you, peaked at 17. | Proposed | Green card |
| AR04 | Rink Rat | Background: Youth hockey or High school | Has been at this rink since he was six. Knows which shower works. | Proposed (new) | Green card |
| AR05 | Roller Kid | Background: Roller hockey convert | Dangles for days. Cannot stop. | Proposed (new) | Green card |
| AR06 | Equipment Guy | Anyone | Four sticks, three hundred dollars each. Cannot raise the puck. | Proposed | Green card |
| AR07 | Emergency Goalie | Position: goalie | Not really a goalie. Owns the gear. Gets the call anyway. | Proposed | Green card |

### 3b. Career-evolved archetypes (earned, never chosen)

Rarest first. All thresholds are proposals.

| Id | Display name | Earned when | Lost when | Description | Art |
| --- | --- | --- | --- | --- | --- |
| AR20 | Hall of Famer | Inducted | Never | They put your picture up by the snack bar. | Green card |
| AR21 | Locker Room Legend | Age 30+, 40 seasons played, leadership in the top tenth of the league, attendance above 85% | Never | Average on the ice. Undefeated in the room. | Green card |
| AR22 | Captain | Named captain of a team | Captaincy ends (returns to previous) | Wears the C. Collects the fees. Regrets both. | Green card |
| AR23 | Old Timer | Age 45+ | Never | Slower every year, somehow always open. | Green card |
| AR24 | Iron Man | 100 consecutive league games without missing one | The streak ends (kept in history) | Has not missed a game in a decade. Nobody asked him to. | Green card |
| AR25 | Journeyman | Member of a 5th different team | Never | Eleven teams in nine years. Knows everyone, owes most of them. | Green card |
| AR26 | Hockey Dad | Age 28+ and the "kids" life event | Never | Leaves early for the kid's practice. Brings orange slices by mistake. | Green card |
| AR27 | Ringer | Plays two or more divisions below his rating for a season | Stops doing it | Says he is "just getting back into it". Scores six. | Green card |
| AR28 | No-Show | Attendance under 50% across two seasons | Attendance above 75% for two seasons | "On my way." He is not on his way. | Green card |
| AR29 | Weekend Warrior | Age 25+, 12 seasons played | Never | Desk job all week, Game 7 every Sunday night. | Green card |
| AR30 | Beer Leaguer | 4 seasons played | Never | Here for the hockey. Mostly. | Green card |

## 4. Player Backgrounds: implemented

Ten entries in `src/dynasty/backgrounds.ts`. **Gameplay effect, implemented:** sets the starting overall level and its spread, and shifts the attributes that come from experience (awareness, discipline, leadership, composure, hockey IQ; for goalies also positioning and rebound control). Does not touch potential, distribution or tendencies (Decision 34). All numbers are proposals awaiting balance review. **Art:** none required; a small icon each would do. The mockup's "Background (optional)" field is this registry.

| Id | Display name | Eligible | Youngest age | Starting level | Experience shift | Offered to a created 18-year-old | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| beginner | Complete beginner | All | 16 | 16 +/- 4 | -4 | Yes | Implemented |
| pond | Pond hockey | All | 16 | 22 +/- 5 | -2.4 | Yes | Implemented |
| roller | Roller hockey convert | All | 16 | 24 +/- 5 | -1.6 | Yes | Implemented |
| youth | Youth hockey | All | 16 | 28 +/- 5 | -0.4 | Yes | Implemented |
| highSchool | High school | All | 17 | 34 +/- 5 | +0.8 | Yes | Implemented |
| junior | Junior | All | 18 | 44 +/- 6 | +2 | Yes | Implemented |
| college | College | All | 22 | 55 +/- 6 | +2.8 | No: too young | Implemented, league players only |
| recVeteran | Returning rec veteran | All | 30 | 40 +/- 8 | +3.2 | No: too young | Implemented, league players only |
| minorPro | Former minor-league pro | All | 24 | 68 +/- 5 | +3.6 | No: too young | Implemented, league players only |
| formerPro | Former pro | All | 26 | 80 +/- 5 | +4 | No: too young | Implemented, league players only |

The mockup's "Ex-junior ringer" is the *Junior* background under a funnier name. Display names are yours to change.

## 5. Personality Traits: proposed registry, a separate system (Decision 45)

**Ruling:** personality is behavioural tendencies that influence dialogue, relationships and decisions. It is not embedded in archetypes and can develop through career events under approved rules. No duplicate or conflicting attribute modifiers across systems.

**Gameplay implications:** none on attributes. A trait changes which lines a person says, how they react to events, and what they decide when the simulation gives them a choice (show up, pay, pass, fight, stay, leave). **Proposed rules:** each person has two or three traits; opposites cannot be held together; a trait can change only through a named career event. **Art:** none required; a small icon each if traits are shown.

| Id | Display name | Opposite | Shows up as | Replaces (old design) | Status |
| --- | --- | --- | --- | --- | --- |
| PT01 | Reliable | Flaky | Confirms early, shows up, brings both jerseys | - | Proposed |
| PT02 | Flaky | Reliable | "Probably." Late or absent; goalies are worst | The Unreliable Goalie | Proposed |
| PT03 | Puck Hog | Team Player | Shoots from everywhere; linemates complain | The Guy Who Never Passes | Proposed |
| PT04 | Team Player | Puck Hog | Passes, covers a shift, celebrates other people's goals | - | Proposed |
| PT05 | Deadbeat | Pays Up | Owes fees; has a story every time | The Guy Who Always Owes Money | Proposed |
| PT06 | Pays Up | Deadbeat | First to settle; sometimes covers a teammate | - | Proposed |
| PT07 | Hothead | Even-Keeled | Takes the bait; first into a scrum | - | Proposed |
| PT08 | Even-Keeled | Hothead | Skates away; talks the captain down | - | Proposed |
| PT09 | Gear Snob | - | Judges your tape job; always knows what stick you should have bought | The Equipment Snob | Proposed |
| PT10 | Storyteller | - | Was somebody once. The story gets better every year | The Washed-Up Legend | Proposed |
| PT11 | Chirper | - | Never stops talking, on the bench or in the chat | - | Proposed |
| PT12 | Loyal | Mercenary | Stays through bad seasons; takes it personally when others leave | - | Proposed |
| PT13 | Mercenary | Loyal | Goes where the wins or the free beer are | - | Proposed |
| PT14 | Competitive | Just Here for Fun | Keeps score in warm-ups | - | Proposed |
| PT15 | Just Here for Fun | Competitive | Does not know the score. Had a great time | - | Proposed |

One overlap to watch: **Hothead** and the **discipline** attribute describe nearby things. Proposed split: discipline is how often you take penalties in play; Hothead is how you react off the puck and in dialogue. Neither modifies the other.

## 6. How the five systems stay distinct (Decision 45)

| System | Answers | Chosen or earned | Changes over a career | Touches attributes |
| --- | --- | --- | --- | --- |
| Hockey Influence | Who did you grow up watching? | Chosen once | No | Yes: distribution and potential |
| Play Style | How do you play? | Chosen, can be changed | Yes, by choice | Yes: distribution and development focus, inside the same budget |
| Background | Where did you come from? | Chosen once | No | Yes: starting level and experience |
| Archetype | Who are you in the room? | Starting one chosen, the rest earned | Yes, by what you do | No |
| Personality | How do you behave? | Assigned or lightly chosen | Rarely, through events | No |

- **Only three systems move numbers**, and each moves a different thing: background sets the level, influences and play style share one zero-sum spread, influences alone set potential.
- **Archetype and personality never grant a modifier.** Where an archetype sounds like a number (Iron Man, Enforcer), the number is the cause, not the effect.
- **Words with one meaning each:** "Rookie" is an archetype; the career stage is "first-year player". "Archetype" no longer means play style anywhere.
- **Background can gate a starting archetype** (Pond Hockey Kid), and that is the only link between those two.
- **Featured Hockey Influences** are the 64 curated profiles in section 1. The wider database joins them in separate classes (`INFLUENCE_ENGINE.md`).
