# Match plan: what a full game looks like

**Status: proposal for the creative director (Nov 26). Nothing here is approved except where a decision number is given.**
The creative director asked to lock in what a full game looks like first; the adventure play between places is locked in later (Decision 85).

Today (v0.10.1) the 5-on-5 test game has skating, shooting, goalies, passing, control switching, pucks knocked loose, a simple computer team, line-ups after goals, a score and a running clock. It never ends and nothing stops play except a goal.

## 1. A game from start to finish

| Moment | What happens | Supplied graphic used |
| --- | --- | --- |
| Matchup | Both teams named, records if any, "vs" | Team matchup (intro) |
| Opening faceoff | Referee at centre, teams line up, puck drop | Faceoff tag |
| Play | 5 on 5 and goalies; scorebug always on | Scorebug (game) |
| Goal | Lamp, net ripple, crowd, horn; scorer named with his line; faceoff at centre | GOAL! splash, goal package, goal scorer lower third |
| Whistle | Referee signals, play stops, faceoff at the right dot | Faceoff tag |
| Penalty | Call shown, player to the box, power play clock runs | Penalty package, penalty lower third, scorebug (power play), power play tag |
| End of period | Horn, period summary, intermission | Period transition, period summary, intermission panel |
| End of game | Final score, three stars, back to the menu | Final panel, three stars |
| Tie | Overtime, then a shootout (section 6) | Scorebug (OT / shootout) |

A mock-up of the scorebug, power play clock, faceoff tag, goal splash and scorer line over the current game was sent with this plan (`full_game_mockup.png`, not in the repository).

## 2. Clock

- Three periods. **Proposed starting value: 3:00 each, running clock**, with 2, 3, 5 and 10 minute choices in Options later.
- The clock stops only on a goal, a penalty call and the end of a period in the first version (running time, like most rec leagues); a stop-time setting can follow.
- Intermission is a panel with the period summary and a button to carry on, not a wait.

## 3. Stoppages and faceoffs

- Play stops for: a goal, the goalie freezing the puck, icing, offside, a penalty, the end of a period.
- Every stoppage ends with a faceoff at one of the nine dots the rink already has.
- **Faceoff:** both centres at the dot, wingers and defence in their spots, the referee drops the puck after a short, slightly varied wait. Pressing the button nearest the drop wins the draw, and the held direction says where it goes. Jumping early loses it. The computer's timing is a setting.
- **Icing:** no-touch (whistle as the puck crosses the goal line untouched from the shooter's own side of centre). Not called while short-handed.
- **Offside:** an attacker over the blue line before the puck stops play; faceoff outside the zone. A delayed, tag-up version can follow.
- **Proposed default: icing and offside on**, each with its own switch in Options (off gives shinny rules). Open.

## 4. Contact: bumps, stick checks and the check that costs you

Direction from the creative director (Nov 26, Decision 85): body checking is not really a thing in rec leagues. Contact is **bumps**; **holding the button too long makes it a check, which may be a penalty**.

Proposed mechanic, one button (the pass/switch button's neighbour; on defence only):

| Press | What it does | Risk |
| --- | --- | --- |
| Tap | **Stick check:** a poke at the puck in front of you, or a stick lift from the side. Knocks the puck loose if it reaches | A miss leaves you flat-footed for a moment |
| Tap from behind, or on a player without the puck | Same reach | A chance of hooking, tripping or slashing |
| Hold briefly | **Bump:** lean into the carrier, slowing him and making the puck easier to take | None if released in time |
| Hold too long | **Check:** a real hit. He goes down and the puck is free | A high chance of a penalty (roughing, or boarding near the boards), higher from behind |

- The automatic puck knock-off in the test game is replaced by this button for the player; the computer uses the same button with a timing setting.
- Skaters still cannot skate through each other.
- The fighting system (designed, not authorized) is separate and is not part of this plan.

## 5. Penalties

- Minors only in the first version: tripping, hooking, slashing, roughing, boarding. Two minutes on the game clock, **scaled to the period length** (proposed: a tenth of a period, so 18 seconds at 3:00; open).
- The player skates to the penalty box (batch 12 art is in the arena); his team plays a skater short, to a minimum of three skaters. A power-play goal ends the penalty.
- Whether a foul is called is drawn from a seeded stream with chances set as data, so the referee is not perfect. How strict he is can be a setting, and later a referee personality.
- Not in the first version: majors, misconducts, penalty shots, delayed penalties with the extra attacker, offsetting minors, fighting.

## 6. Ties

Decision 30 (approved) already sets it for league play: sudden-death 3-on-3 for five minutes, then a shootout of three attempts each. **Proposed for Pick-Up: the same, scaled to the period length**, with "ties stand" as an option. Open.

## 7. The referee

- One referee on the ice (the supplied sheet has one design). He follows the play from the side boards, drops pucks, signals goals, icing, offside and penalties, and stays out of the way.
- Linesmen are not drawn; the one referee makes every call.
- The knock-out-the-referee idea (the sheet has hit, down and dazed frames) is in the backlog and not part of this plan.

## 8. Who is on the ice

- Five skaters and a goalie a side, the same five all game in the first version. **Line changes and fatigue come later** (the benches and bench players are already drawn).
- Every skater is identical until attributes are connected (Track B's player DNA exists; wiring it into play needs its own go-ahead).
- Names and numbers from the fictional name pools, so the scorer line and three stars have someone to show.
- A created player dropped into the home team is the natural link to Create a Player ("Pick-Up choice" is already stored); needs its own go-ahead.
- **Teams:** two placeholder sides. Real team identities, colours and uniforms are the creative director's (batch 17, Create a Team). The gold tint is temporary.

## 9. Numbers kept during a game

Goals, assists (the last two teammates to pass before a goal), shots, saves, faceoffs won, takeaways (stick checks that win the puck), penalty minutes, power-play goals, time in the attacking zone. The supplied period summary shows shots, hits and PIM: with no body checking **"hits" should read "takeaways"** (art change, section 10).

## 10. Presentation graphics: what was supplied and what it needs

All from art batch 01 (`art/source/generated-batch-01/`). **None is on a true pixel grid:** they are large soft-edged images, like the skater and goalie sheets were. Each needs either the same reduce-and-clean pass or a re-issue at exact game sizes (preferred, at the batch 18 standard).

| Graphic | Supplied | Use | Needs |
| --- | --- | --- | --- |
| Scorebug: game, power play, OT / shootout | Blank and filled sample | Always on screen | Exact size (proposed about 132x30 on the 480x320 screen); team name and colour slots |
| GOAL! splash | Yes | Goals | Size only |
| Faceoff, power play, penalty tags | Yes, two styles each | Stoppages, power plays | Pick one style of each |
| Player, goal scorer and penalty lower thirds | Yes, **with a face painted in** | Naming a player | A blank version with an empty portrait window (the 56 preset faces are 64x64) |
| Period transitions, period summary | Yes | Period ends | "Hits" row renamed |
| Intermission panel | Yes | Intermissions | None |
| Three stars | Yes, blank and with sample faces | End of game | Portrait windows sized to the faces |
| Final panel | Yes | End of game | Team crest slots in place of the helmets, when teams exist |
| Team matchup (intro) | Yes | Before the game | Team crest slots |
| Goal, replay and penalty packages; broadcast wipes | Yes | Banners and transitions | Replays are not in the first version |
| Jumbotron | Yes | Arena scoreboard, crowd shots | Later |
| Headline font, scoreboard digits, LED digits | Yes | Scorebug numbers, banners | Reduce-and-clean; the 8x8 UI font will not survive at that size, so the game's own font stays for small text |
| Referee, 10 poses in side and front views, plus hit and dazed frames | Yes | The referee | **A back view (north-facing row)**; 32 px scale |
| On-ice effects (spray, impact, streaks) | Yes | Stops, shots, bumps | Reduce-and-clean; no controlled-player marker in the sheet |

**Sound: nothing exists yet.** A full game needs at least: whistle, horn, puck on stick, shot, post, save, boards, skate stop, crowd bed and goal roar, a menu blip. The public-access broadcast voice is text only (already in the design).

## 11. Not in the first full game

Line changes and fatigue, injuries, fights, replays, attributes changing play, referee personalities, the crowd reacting to more than goals, career and league play around the game, and everything off the ice. Each needs its own go-ahead.

## 12. Proposed build order

Each step is a playable build with its own checkpoint.

1. **Clock and whistles:** periods, running clock, intermission panel, final score, real faceoffs at the dots, the goalie's freeze stopping play.
2. **Contact:** the stick check, bump and check button of section 4, without penalties yet.
3. **Referee and rules:** the referee on the ice, icing and offside with switches.
4. **Penalties:** calls, the penalty box, power plays.
5. **Presentation:** scorebug, goal and penalty banners, scorer line, period summary, three stars, final, matchup; names, numbers and game statistics.
6. **Ties:** overtime and shootout.

Steps 1 and 2 give a game that can be finished and played like pick-up. Sound can start at any step once effects are supplied or approved to be sourced.

## 13. Decisions needed

1. Period length and count (proposed three of 3:00, running clock).
2. Icing and offside on by default, with switches?
3. The contact button as in section 4: tap to stick check, hold to bump, too long is a check and a likely penalty?
4. Penalty length (proposed a tenth of a period) and the five minors listed.
5. Ties in Pick-Up: overtime and shootout as in Decision 30, or ties stand?
6. Presentation art: re-issue at game sizes (preferred), or reduce what was supplied as was done for the skater and goalie?
7. Which style of the faceoff, power play and penalty tags.
8. Placeholder team names and colours for testing until real teams are designed.
9. Player switching: stay manual, or switch automatically when the other team takes the puck?
