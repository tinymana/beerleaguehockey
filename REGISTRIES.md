# Registries: influences, play styles, archetypes, backgrounds, personality traits

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

## 2. Play Styles (ice blue cards): proposed

**What exists today:** play style is not a choice. Each influence carries tendency tags (the Tendencies column above), and a created player inherits them. The tags in use are: playmaker, vision, dangler, power, sniper, two-way, speed, breakaway, leader, shooter, complete, competitor, net-front, grinder, enforcer, offensive-d, stay-home, puck-mover, physical, butterfly, acrobatic, hybrid, stand-up, puck-handler.

**Proposed registry: 18 styles.** Gameplay effect: **none implemented.** Two ways it could work, both needing your approval (question 5 in `CREATOR_PLAN.md`): (a) a label worked out from the player's DNA and shown on a blue card, with no new mechanic; or (b) a choice that nudges the attribute spread the way a small extra influence does. The "attribute tendencies" column is what (b) would lean toward and what (a) would be detected from. On the ice, a style would later steer AI decisions; that belongs to Track A and is not designed.

| Id | Display name | Eligible | Description | Attribute tendencies | Overlaps with | Status | Art |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PS01 | Sniper | F, D | Lives to shoot. Finds a lane and lets it go. | wrist accuracy, wrist power, off. awareness | Influence tag *sniper* | Proposed | Blue card |
| PS02 | Playmaker | F, D | Pass first, pass second, look annoyed when nobody finishes. | passing, hockey IQ, off. awareness | Tags *playmaker*, *vision* | Proposed | Blue card |
| PS03 | Dangler | F | Tries to go through everyone. Sometimes does. | puck control, agility | Tag *dangler* | Proposed | Blue card |
| PS04 | Power Forward | F | Drives the net with a defender on his back. | strength, balance, checking, wrist power | Tags *power*, *net-front* | Proposed | Blue card |
| PS05 | Two-Way Player | F, D | Back before the puck is. Coaches love him; nobody else notices. | def. awareness, hockey IQ, discipline | Tag *two-way* | Proposed | Blue card |
| PS06 | Grinder | F | Wins the corner, loses a tooth, goes back in. | endurance, checking, composure | Tag *grinder* | Proposed | Blue card |
| PS07 | Speedster | F, D | One move: faster. | speed, acceleration | Tags *speed*, *breakaway* | Proposed | Blue card |
| PS08 | One-Timer Guy | F, D | Stands at the circle with his stick in the air, all game. | slap power, slap accuracy | Tag *shooter* | Proposed | Blue card |
| PS09 | Enforcer | F, D | Here so nobody touches the good players. | strength, checking, durability | Tag *enforcer*; the fighting system | Proposed | Blue card |
| PS10 | Faceoff Specialist | F | Takes the draw and goes to the bench. | faceoffs, strength | none | Proposed | Blue card |
| PS11 | Offensive Defenseman | D | A fourth forward who sometimes remembers. | speed, passing, off. awareness | Tag *offensive-d* | Proposed | Blue card |
| PS12 | Stay-at-Home Defenseman | D | Has not crossed the red line since 2009. | def. awareness, strength, discipline | Tag *stay-home* | Proposed | Blue card |
| PS13 | Puck Mover | D | First pass on the tape, every time. | passing, hockey IQ, composure | Tag *puck-mover* | Proposed | Blue card |
| PS14 | Bruiser | D | Clears the crease by any means. | checking, strength, balance | Tag *physical* | Proposed | Blue card |
| PS15 | Butterfly Goalie | G | Drops early, covers the bottom, dares you to go high. | positioning, pads | Tag *butterfly* | Proposed | Blue card |
| PS16 | Stand-Up Goalie | G | Old school. Stays on his skates and plays the angles. | positioning, glove, balance | Tag *stand-up* | Proposed | Blue card |
| PS17 | Acrobat | G | No technique. Somehow stops it. | reflexes, recovery, agility | Tag *acrobatic* | Proposed | Blue card |
| PS18 | Puck-Handling Goalie | G | Thinks he is a defenseman. Is occasionally right. | puck handling, composure | Tag *puck-handler* | Proposed | Blue card |

A Hybrid goalie style (tag *hybrid*) is left out on purpose: it is the absence of a style. Say if you want it as a card.

## 3. Beer League Archetypes (green cards): proposed

**What exists today:** nothing in code. The design mentions archetypes in one list that mixes play styles and personalities (Sniper, Grinder, Dangler, Stay-at-home D, Ex-junior ringer, Guy Who Never Passes).

**Gameplay effect: none implemented, and none proposed here beyond flavour.** The brief suggests archetypes could later influence dialogue, attendance, recruitment, personality, chemistry and career events; each of those would be its own approved design. No bonuses, rarity or packs.

**The main issue to settle (question 6):** a created player starts at 18, and half of these describe someone older. Suggested reading: an archetype is who you are in the room right now. A created player starts with one that fits an 18-year-old and can grow into others; generated league players can have any.

| Id | Display name | Eligible | At 18? | Description | Overlaps with | Status | Art |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AR01 | Beer Leaguer | All | Yes | The default setting. Here for the hockey, mostly. | none: the baseline | Proposed | Green card |
| AR02 | Rookie | All | Yes | New skates, no idea where to stand, tapes his stick wrong. | Career stage "Rookie" (the same word for two things) | Proposed | Green card |
| AR03 | Pond Hockey Kid | Skaters | Yes | Learned outdoors. Great hands, has never heard of offside. | Background *Pond hockey* | Proposed | Green card |
| AR04 | Washed-Up Junior | All | Borderline | Played junior, will tell you, peaked at 17. | Background *Junior*; personality *Washed-Up Legend* | Proposed | Green card |
| AR05 | Weekend Warrior | All | Yes | Desk job all week, Game 7 every Sunday night. | Team culture *Just Here for the Exercise* | Proposed | Green card |
| AR06 | Journeyman | All | No | Eleven teams in nine years. Knows everyone, owes most of them. | Team history (should be earned, not chosen) | Proposed | Green card |
| AR07 | Old Timer | All | No | Slower every year, somehow always open. | Career stages "Veteran" and "Aging veteran" | Proposed | Green card |
| AR08 | Hockey Dad | All | No | Leaves early for the kid's practice. Brings orange slices by mistake. | Availability (kids are already a reason to miss games) | Proposed | Green card |
| AR09 | Equipment Guy | All | Yes | Four sticks, three hundred dollars each. Cannot raise the puck. | Personality *Equipment Snob*; the equipment life meter | Proposed | Green card |
| AR10 | Locker Room Legend | All | Borderline | Average on the ice. Undefeated in the room. | Leadership, team chemistry | Proposed | Green card |
| AR11 | Emergency Goalie | Goalies | Yes | Not a goalie. Owns the gear. Gets the call anyway. | The emergency substitute system; position | Proposed | Green card |
| AR12 | No-Show | All | Yes | "On my way." He is not on his way. | Availability, fee reliability; personality *Unreliable Goalie* | Proposed | Green card |

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

## 5. Personality Traits: designed, not built

From `GAME_DESIGN.md`: personality types "change how a player behaves", and each player also has loyalty, ambition, fee reliability and an availability pattern. No code. **Gameplay effect:** none implemented; the design intends effects on dialogue, attendance, fees and chemistry, all still to be specified. **Art:** none required unless traits get cards.

| Id | Display name | Description | Overlaps with | Status |
| --- | --- | --- | --- | --- |
| PT01 | The Guy Who Never Passes | Has not completed a pass since joining. Leads the team in shots and in complaints about him. | Play styles Sniper and Dangler | Designed |
| PT02 | The Unreliable Goalie | Brilliant when he shows up. | Archetypes No-Show, Emergency Goalie | Designed |
| PT03 | The Guy Who Always Owes Money | "I'll get you next week." | Fee reliability; archetype Journeyman | Designed |
| PT04 | The Equipment Snob | Judges your tape job. | Archetype Equipment Guy (near duplicate) | Designed |
| PT05 | The Washed-Up Legend | Was somebody once. Still is, to hear him tell it. | Archetype Washed-Up Junior (near duplicate) | Designed |

## 6. Where the five registries overlap

- **Archetype against background:** Pond Hockey Kid and Washed-Up Junior restate a background as a persona. Either drop them as archetypes, or let the background suggest the archetype.
- **Archetype against personality:** Equipment Guy and Washed-Up Junior are the same jokes as The Equipment Snob and The Washed-Up Legend. I would fold personality traits into archetypes: one green registry, one card each.
- **Archetype against career state:** Rookie, Journeyman, Old Timer and Hockey Dad describe age or history. They read better as things you become than things you pick at 18.
- **Archetype against other systems:** No-Show and Emergency Goalie sit on top of availability and the substitute system. If they are chosen labels, they must not contradict what the simulation actually has the player do.
- **Play style against influence:** every proposed style already exists as an influence tendency. If style becomes a separate choice, a player could pick a playmaker hero and a Sniper style; that is fine if intended, and should be said so.
- **Words used twice:** "Rookie" is a career stage and an archetype; "archetype" in the old design meant play style. Each needs one meaning.
