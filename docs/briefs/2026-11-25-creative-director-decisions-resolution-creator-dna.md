# BEER LEAGUE HOCKEY — CREATIVE DIRECTOR DECISIONS

## 1. Resolution and Rendering Profiles

Adopt 960×540 internal resolution for off-ice scenes and interfaces, maintaining a 16:9 aspect ratio.

This includes:

- Create a Player
- Create a Team
- Career management
- Town map
- Point-and-click adventure locations
- Pro shop
- Sports bar
- Locker room interactions
- Action cinematics
- Fighting cinematics
- Career event cinematics

Preserve the existing on-ice rendering resolution and simulation architecture.

Implement independent rendering profiles with appropriate viewport scaling, letterboxing and pixel-art filtering.

Do not rewrite the on-ice engine to accommodate off-ice artwork.

Audit existing 3:2 and other reference artwork before adaptation. Avoid stretching or destructive cropping.

Use 960×540 as the design coordinate space, while preserving accessible and readable dynamic UI text.

## 2. Creator V1 Authorization

Approved to implement functional Create a Player V1 and Create a Team V1.

Use existing approved assets from Batches 16 and 17.

Preset faces and equipment selection references are acceptable temporary implementations.

However, preserve a data-driven modular architecture that will accommodate:

- Independent hairstyles
- Independent facial hair
- Body types
- Facial features
- Skin tones
- Equipment
- Uniform branding
- Color customization
- Additional future assets

Do not permanently flatten character appearance.

Identify temporary solutions and missing production artwork.

## 3. Hockey Influence Likenesses

Use illustrated collectible cards rather than photographic portraits.

Featured influences can receive individually illustrated portraits for development, subject to rights review before public distribution.

The wider database should use original generic illustrations or silhouettes alongside dynamic player information.

Do not require unique artwork for every historical NHL player.

Support a configurable fictional-player fallback registry if licensing restrictions require it.

## 4. Hockey Influence Database Expansion

A potential supplemental NHL historical statistics dataset has been identified:

https://www.kaggle.com/datasets/flynn28/nhl-player-database

Dataset identifier:

flynn28/nhl-player-database

Investigate using KaggleHub or direct dataset downloads during development.

Inspect all available files, particularly skaters.csv and goalies.csv if present.

The previously supplied NHL biographical CSV should remain available.

Before merging:

- Inspect actual schema.
- Confirm dataset licensing and redistribution conditions.
- Identify unique player IDs.
- Determine historical coverage.
- Identify duplicate records.
- Identify missing values.
- Determine whether statistics are career totals or seasonal records.
- Distinguish regular-season and playoff statistics.
- Validate position classifications.
- Report successful match rates against the existing NHL database.

Prefer stable NHL player IDs for joining records when available.

Do not silently merge ambiguous name matches.

## 5. Expanded Hockey DNA Engine

Do not permanently restrict Hockey Influences to the 64 curated profiles.

Use those 64 curated profiles as the initial high-confidence collection.

Expand the searchable registry to include all eligible players from the supplied databases.

Where sufficient statistics exist, generate evidence-based influence tendencies.

Possible statistical tendencies include:

- Scoring frequency
- Playmaking frequency
- Shot frequency
- Finishing efficiency
- Penalty frequency
- Physical involvement
- Defensive involvement
- Faceoff ability
- Goaltending effectiveness

Only use metrics supported by the available source data.

Normalize performance by position, era, games played and available playing time.

Account for small sample sizes and historically unavailable statistics.

Missing data must not be interpreted as zero ability.

Distinguish:

- Curated influence profiles
- Data-derived influence profiles
- Limited-data influence profiles
- Generic fallback profiles

Allow manual overrides of statistically generated profiles.

Attach data provenance and confidence indicators internally.

Do not infer personality, durability, skating speed or hockey IQ from unrelated statistics.

Do not treat derived ratings as official NHL player ratings.

## 6. Influence Selection

Support one primary Hockey Influence and up to two optional secondary influences.

Suggested initial weighting for review:

- Primary: 60%
- Secondary 1: 25%
- Secondary 2: 15%

Redistribute weights appropriately when fewer influences are selected.

Influences should shape randomized starting attribute distributions, natural tendencies and development potential.

They must not guarantee professional-level abilities.

Maintain recreational hockey-appropriate starting attribute budgets and progression limits.

Use seeded generation and persist confirmed player DNA.

Prevent repeatedly reopening the creator from rerolling confirmed attributes.

## 7. Play Style

Play Style is a player-selected gameplay identity.

It should influence attribute allocation tendencies, development priorities and AI behavior where applicable.

Examples:

- Sniper
- Playmaker
- Grinder
- Dangler
- Power Forward
- Two-Way Forward
- Shutdown Defenseman
- Offensive Defenseman

Use position-appropriate selections.

Play Style should work within existing attribute budgets rather than providing unrestricted additive bonuses.

Allow play style to evolve over the player's career.

Distinguish chosen development focus from statistically observed playing behavior if appropriate.

Provide the proposed play style registry before final balancing.

## 8. Evolving Beer League Archetypes

Archetypes should represent a player's identity within recreational hockey culture.

The player selects an eligible starting archetype during character creation.

Archetypes can evolve based on:

- Age
- Career experience
- Team memberships
- Leadership
- Attendance
- Loyalty
- Decisions
- Discipline
- Achievements
- Career events

Examples of potential career identities:

- Rookie
- Pond Hockey Kid
- Washed-Up Junior
- Journeyman
- Locker Room Legend
- Captain
- Old Timer

These are illustrative examples, not a finalized registry.

Age-dependent archetypes must respect the player's actual age.

Preserve an archetype history rather than overwriting previous identities without a record.

Archetype transitions may trigger dialogue, career milestones, cinematics and relationship changes.

Provide proposed eligibility criteria and transition rules for creative director approval.

## 9. Separate Personality Architecture

Keep the following systems distinct:

HOCKEY INFLUENCE
Who the player grew up watching and emulating.

PLAY STYLE
How the player approaches hockey on the ice.

BACKGROUND
The player's permanent personal and hockey history.

ARCHETYPE
The player's evolving identity within beer league culture.

PERSONALITY
Behavioral tendencies that influence dialogue, relationships and decisions.

Personality traits should not be permanently embedded within archetypes.

Allow personality development through relevant career events, subject to approved rules.

Avoid duplicate or conflicting attribute modifiers across systems.

## 10. Required Card Registry

Return finalized or proposed registries for:

- Featured Hockey Influences
- Play Styles
- Starting Archetypes
- Career-evolved Archetypes
- Player Backgrounds
- Personality Traits

Include stable IDs, descriptions, eligibility requirements, artwork requirements and gameplay implications.

Batch 16.10 artwork remains on hold until these registries are reviewed.

Approved visual direction:

- Gold: Hockey Influences
- Ice blue: Play Styles
- Green: Beer League Archetypes

## 11. Off-Ice Adventure Direction

Preserve the approved creative references:

- The Adventures of Willy Beamish
- Day of the Tentacle
- Arch Rivals
- Detailed original 32-bit Beer League Hockey artwork

Batch 18 will produce interactive career and lifestyle locations using the newly proposed 960×540 design resolution.

Provide technical specifications for background layers, foreground objects, NPC sprites, environmental animations, hotspots and dialogue interfaces.

Preserve the equipment lifecycle and independent skate sharpening system.

Top Shelf Hockey must function as an interactive point-and-click pro shop where players can purchase, replace and maintain equipment.

## 12. Required Follow-Up

Before finalizing new gameplay systems, return:

1. Database inspection results.
2. Source file names and actual column schemas.
3. Database merge coverage.
4. Proposed statistical influence-generation algorithm.
5. Sample influence profiles for review.
6. Proposed Play Style registry.
7. Proposed Archetype registry.
8. Proposed Background and Personality registries.
9. Creator V1 implementation plan.
10. Batch 18 artwork specifications.
11. Open questions requiring creative director approval.

Preserve existing approved career mechanics and on-ice functionality.

The objective is maximum character customization, meaningful career diversity and authentic recreational hockey culture.
