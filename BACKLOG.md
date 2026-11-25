# Backlog

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization: **Milestone 0 and the skating prototype only.**

Nothing in this file is authorized for implementation. A backlog entry is an idea with a proposed home, not a work order.

## Proposed placement

The new systems slot into the existing milestones without changing their order; only the tournament circuit and multiplayer get their own later milestones.

| System | First appears | Notes |
| --- | --- | --- |
| Five-division league, 40 franchises, competition context, stat buckets | Milestone 4 | Needs your approved franchise roster, or runs on placeholders |
| Procedural people: nationality pools, hockey background, personality | Milestone 4 | Data only; portraits can be placeholders |
| Franchise identities and cultures driving AI managers | Milestones 4 to 5 | Crests and uniforms follow your art approvals |
| Create-a-player screens and layered portraits | Milestone 5 | Needs the character layer art set |
| Manager and player-manager careers, emergency subs, free-agent skates | Milestone 5 |  |
| Team group chat, working version | Milestone 5 | Availability, subs, fees |
| Personal and team finances, visible aging, return from retirement | Milestone 6 |  |
| Prestige and reputation | Milestone 6 | Values tuned in Milestone 9 |
| Puck Falls hub, dialogue voice engine, full group chat, alcohol and social system | Milestone 7 |  |
| Fighting minigame, disciplinary hearings, commissioner | Milestone 7 |  |
| Player-only career and captain lock | Milestone 7 | Needs teammate AI from Milestone 2 |
| Newspaper, banners, rings, retired jerseys, Hall of Fame, leaderboards | Milestone 8 |  |
| Tournament circuit | New milestone after 8 | Data model ready from Milestone 4 |
| Career transitions across all roles | With tournaments | Role records exist from Milestone 5 |
| Multiplayer and cloud saves | After Milestone 9 | No infrastructure before then |

The first build you will see after approval is Milestone 0 plus a skating prototype: one skater, one puck, the rink, so you can judge feel before anything else is built on it.

## Long-term feature list (from the creative director)

- Custom team names, logos, colors and jerseys
- Emergency substitute players
- Free-agent recruitment skates
- League commissioner interactions
- Player reputation system
- League disciplinary hearings
- Referee knock-out: referee can be hurt for about 10 seconds and cannot make calls (Milestone 2, with penalties)
- Playable fighting minigame
- League newspaper with headlines generated from real simulation events
- Championship banners and rings
- Retired jersey ceremonies
- Franchise Hall of Fame
- Historical season summaries
- All-time statistical leaderboards
- Franchise rivalries; former teammates becoming opponents
- Player reunions and retirement events
- Persistent trophy cabinet
- Team group chat as the management interface
- Create-a-player with layered pixel-art characters and visible aging
- Data-driven dialogue with individual speaking styles (no external AI service)
- Franchise identities, cultures and prestige
- Three career paths with organic transitions
- Independent tournament circuit
- Multiplayer: local and online exhibition, private leagues, asynchronous dynasty, commissioner-run leagues
- Explorable 32-bit Puck Falls hub

## Prototype follow-ups (small, for the next gameplay milestone)

- Net is a simple box; the puck can be carried into the mouth on the blade without scoring
- Skater has no stop or shooting animation, no skate marks or ice spray
- No sound
- Analog stick is quantized to eight directions by design; revisit if it feels stiff on a pad
- Promote more `FEEL` constants (wind-up time, pickup cooldown, stick reach) into the tuning panel if needed

## Goal bottle and dislodged nets (raised by art batch 11)

Batch 11 supplies a bottle on each crossbar with a knock-off animation, and a dislodged-goal animation. Possible homes: the bottle as a skill shot or taunt in the arcade layer (Milestone 2 or later); a dislodged net as a stoppage once referees and whistles exist. Proposed home only. Not designed, not authorized.
