# BEER LEAGUE HOCKEY
## Career, Player DNA, Dynasty & Presentation Expansion

**Developer:** Tiny Mana Studios

**Retro DNA:** NHL ’94 + NBA 2K MyCareer & Dynasty + NBA Live ’98 + Neo Turf Masters + Baseball Stars 2 + Slap Shot.

## 1. Development Instructions

Expand the existing Beer League Hockey project. Do not rebuild the game from scratch.

Before implementing:

- Audit the existing architecture, assets, game systems and save structure.
- Identify reusable functionality.
- Document conflicts with these new requirements.
- Preserve existing working hockey gameplay.
- Maintain compatibility with existing asset packs.
- Create a phased implementation roadmap.
- Obtain creative director approval before making major design decisions.

## 2. Main Menu

The primary menu shall contain:

### Pick-Up

An exhibition mode where players can use their created character alongside randomly selected hockey players from any division.

Support:

- Single-player exhibition.
- Random teammates and opponents.
- AI-controlled players.
- Online multiplayer.
- Mixed-division rosters.
- Individual performance statistics.
- Pick-Up leaderboards.
- Experience progression.
- Guest appearances without permanent team membership.

### League Dynasty

The primary persistent career experience.

Support two career paths:

- Player Career.
- Team Manager Career.

Both modes operate within the same simulated hockey universe.

### Create

- Create a Player.
- Create a Team.
- Edit created players.
- Edit created teams.
- Jersey customization.
- Team branding.
- Nationality selection.
- Player appearance customization.

Use NBA Live ’98 as inspiration for an accessible retro character creator.

### Leaderboard

Track individual and team accomplishments across Pick-Up, tournaments and league seasons.

Separate online verified statistics from offline statistics.

### Options

Include gameplay, controls, difficulty, audio, graphics, accessibility and multiplayer settings.

## 3. Player DNA — Hockey Influences

Introduce a player creation system called **Hockey Influences**.

Players select professional hockey players they grew up watching and whose playing styles they attempt to emulate.

Example influences:

- Wayne Gretzky — vision, passing and offensive awareness.
- Jari Kurri — positioning, finishing and two-way awareness.
- Teemu Selanne — speed, acceleration and scoring.
- Mario Lemieux — puck control, size and offensive creativity.
- Pavel Bure — explosive acceleration and breakaway ability.
- Steve Yzerman — leadership and two-way play.
- Mark Messier — leadership and physicality.
- Brett Hull — shooting and one-timers.
- Nicklas Lidstrom — defensive positioning and intelligence.
- Scott Stevens — checking and defensive physicality.
- Patrick Roy — goaltending and competitiveness.
- Dominik Hasek — reflexes and unconventional saves.

These are illustrative influence profiles, not officially licensed player ratings.

Allow the player to select a primary influence and potentially secondary influences.

Influences affect:

- Randomized starting attribute distributions.
- Natural strengths.
- Natural weaknesses.
- Attribute development potential.
- Playing tendencies.
- Career development opportunities.

Selecting Wayne Gretzky does not make the created player Wayne Gretzky.

The player is still an amateur hockey player attempting to emulate their heroes.

Starting attributes must be randomized within balanced influence-specific ranges.

Store the generated DNA permanently within the player save.

Use a configurable influence registry so real player names can be replaced with fictional equivalents if required for commercial release.

## 4. Player Attributes

Support attributes including:

- Skating speed.
- Acceleration.
- Agility.
- Balance.
- Endurance.
- Wrist shot power.
- Wrist shot accuracy.
- Slap shot power.
- Slap shot accuracy.
- Passing.
- Puck control.
- Offensive awareness.
- Defensive awareness.
- Checking.
- Strength.
- Discipline.
- Faceoffs.
- Durability.
- Leadership.
- Composure.
- Hockey IQ.

Include specialized goaltending attributes.

Distinguish between current ability, natural potential, temporary modifiers and permanent career changes.

## 5. Player Progression

Players begin their careers at age 18.

New players should feel inexperienced and physically limited.

Players earn XP through:

- League games.
- Pick-Up games.
- Tournaments.
- Training.
- Side missions.
- Career decisions.
- Individual accomplishments.
- Team accomplishments.

Progression should feel earned.

Avoid allowing every player to eventually maximize every attribute.

Hockey Influences, training decisions, injuries, age and natural potential should create different career outcomes.

## 6. Season Structure

Replace the previous season structure with:

- Winter Season.
- Spring Season.
- Summer Season.
- Fall Season.

Each season consists of:

- 20 regular-season games.
- Postseason playoffs.
- A season championship.
- Individual statistics.
- Team statistics.
- Awards.
- Offseason roster activity.

Four seasons equal one calendar year.

A player may potentially experience 50 calendar years of recreational hockey.

A complete 50-year career represents:

- 200 league seasons.
- Up to 4,000 regular-season games before playoffs, tournaments and Pick-Up games.

Provide calendar advancement, quick simulation and season simulation to make long careers practical.

## 7. Aging, Injuries & Retirement

Players age according to the calendar, not after every season.

Career stages should include:

- Rookie.
- Developing player.
- Prime.
- Veteran.
- Aging veteran.
- Retirement.

After approximately age 40, durability and recovery should become increasingly important.

Potential events include:

- Minor injuries.
- Recurring injuries.
- Reduced recovery.
- Permanent attribute reductions.
- Extended absences.
- Career-ending injuries.
- Voluntary retirement.

Aging must be individualized rather than identical for every player.

Player DNA, durability, injury history, training and career workload should influence longevity.

Allow exceptional players to remain active into their late 60s if their circumstances permit.

## 8. Recruitment & Team Invitations

Team captains actively recruit players based on their performance, reputation, reliability and relationships.

Example dialogue:

"Hey bud, we've been watching you play. You interested in joining our Silver team next season?"

Players may receive invitations from:

- Teams within their division.
- Higher-division teams.
- Lower-division teams.
- Rival teams.
- Tournament teams.
- Friends and former teammates.

Recruitment should occur naturally throughout a career.

Players should not automatically be required to abandon their current team when accepting another opportunity.

## 9. Multiple Team Membership

Allow players to participate on multiple teams when league eligibility and finances permit.

Example:

A player may be registered with both a Bronze and Silver team.

Each membership has its own:

- Registration fees.
- Schedule.
- Statistics.
- Teammate relationships.
- Captain relationship.
- Championship history.

Generate scheduling conflicts.

When two teams play on the same night, the player may have to choose which team to represent.

Decisions can influence:

- Team chemistry.
- Captain relationships.
- Reputation.
- Future recruitment.
- Playing opportunities.

Do not permit the player to physically participate in overlapping games.

## 10. Emergency Substitute System

Recreational hockey teams frequently struggle to field complete rosters.

Generate situations involving:

- Players calling out sick.
- Players working late.
- Players forgetting games.
- Goalies failing to show up.
- Teams needing an extra skater.
- Tournament roster shortages.

Players may receive emergency substitute invitations from any division, including Gold.

Example:

"Gold Division tonight. We're short two guys. Can you make it?"

These appearances create opportunities to:

- Gain experience.
- Impress higher-level captains.
- Build relationships.
- Earn reputation.
- Experience higher-level competition.

An emergency appearance does not automatically promote the player or grant permanent team membership.

## 11. Championships & Collectibles

Distinguish tournament victories from league championships.

### League Season Championships

Award a commemorative championship shirt.

Example:

2026 FALL LEAGUE CHAMPIONS

The shirt should include:

- Team branding.
- Division.
- Year.
- Season.
- Championship designation.

Championship shirts become persistent career collectibles.

Players can display and potentially wear earned shirts.

### Tournament Championships

Award physical trophies.

Tournament trophies should have unique identities, designs and histories.

Display trophies in the player's personal collection and, when appropriate, the team clubhouse.

Do not award fictional accomplishments that were not actually earned.

## 12. Side Missions & Recreational Hockey Culture

Introduce contextual activities outside games.

Examples:

- Practice skating.
- Improve shooting.
- Attend a stick-and-puck session.
- Help recruit a goalie.
- Find a substitute player.
- Attend a team gathering.
- Visit the pro shop.
- Attend a tournament.
- Resolve teammate disputes.
- Pay registration fees.
- Help organize team activities.

Side missions should contribute to progression, relationships, reputation or career opportunities.

Maintain the humorous adult recreational hockey atmosphere.

## 13. Cinematic Action Shots

Introduce full-screen illustrated action sequences inspired by Neo Turf Masters and Baseball Stars 2.

These should become a signature presentation feature.

Use original 32-bit pixel-art illustrations with dramatic composition, expressive characters and exaggerated sports presentation.

Trigger cinematics for significant events.

### Hockey Action

- Breakaway.
- One-timer.
- Slap shot.
- Puck hitting the post.
- Puck hitting the crossbar.
- Spectacular goalie save.
- Glove save.
- Diving save.
- Goal scored.
- Water bottle knocked off the net.
- Overtime winner.
- Hat trick.
- Heavy body check.
- Broken stick.
- Goalie pulled.
- Penalty shot.

### Fighting & Penalties

- Players dropping gloves.
- Hockey fight.
- Officials separating players.
- Player sent to penalty box.
- Player ejected for fighting.
- Player arguing with referee.
- Angry captain.
- Bench reaction.

### Career Events

- First career goal.
- First career game.
- Recruitment invitation.
- Emergency substitute request.
- Serious injury.
- Return from injury.
- Retirement announcement.
- Jersey retirement.
- Hall of Fame induction.

### Broadcast & Team Presentation

- Team Playing Next.
- Starting lineup.
- Rivalry game.
- Playoff game.
- Championship game.
- Tournament final.
- Championship victory.
- Tournament trophy presentation.
- Championship shirt presentation.
- Disappointed losing team.

Cinematics must use actual game events and career data.

Support dynamic overlays for:

- Player names.
- Team names.
- Jersey numbers.
- Team colors.
- Scores.
- Statistics.
- Division.
- Season.
- Tournament name.

Keep character art, backgrounds, effects and text overlays modular wherever practical.

Do not bake dynamic player or team information into reusable artwork.

Cinematics must not interrupt or duplicate scoring logic.

Support configurable presentation frequency and skipping.

## 14. Technical Architecture

Maintain separate systems for:

- Hockey gameplay.
- Player DNA.
- Attribute progression.
- Career calendar.
- League simulation.
- Team membership.
- Recruitment.
- Substitute invitations.
- Injuries and aging.
- Championship collectibles.
- Cinematic presentation.
- Online and offline statistics.
- Multiplayer.

Use stable entity identifiers, versioned saves and deterministic simulation where appropriate.

Avoid hardcoding individual team names, player names, season dates or accomplishments into game logic.

## 15. Asset Integration

Continue using the established Beer League Hockey asset pipeline.

For each asset batch, support:

- Individual named PNG files.
- True transparency where required.
- Sprite atlases.
- 8×8 tiles for modular environmental assets.
- JSON manifests.
- Mounting anchors and animation metadata.
- CLAUDE.md integration instructions.
- Preview images.
- ZIP distribution packages.

Full-screen cinematic illustrations are exempt from the 8×8 tile requirement.

Use a centralized asset registry and preserve consistent naming conventions.

## 16. Implementation Order

1. Audit existing project.
2. Update main menu architecture.
3. Implement Hockey Influences and player creation.
4. Implement player attributes and progression.
5. Update league calendar and season simulation.
6. Implement aging and injury systems.
7. Implement recruitment and multiple team membership.
8. Implement emergency substitute opportunities.
9. Implement championship shirts and tournament trophies.
10. Implement Pick-Up and multiplayer architecture.
11. Implement leaderboard infrastructure.
12. Implement cinematic event framework.
13. Integrate cinematic artwork.
14. Balance, test and validate long-term career simulation.

Do not attempt to implement every feature in a single development pass.

Present the architecture audit, implementation roadmap, required asset inventory and unresolved design questions before beginning major implementation.