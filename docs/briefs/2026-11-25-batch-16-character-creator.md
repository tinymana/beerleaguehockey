# BEER LEAGUE HOCKEY — BATCH 16 ASSET INTEGRATION & CHARACTER CREATOR

## 1. Project Direction

Create a Player is intended to be one of the flagship features of Beer League Hockey.

The creative direction is a combination of:

- NBA Live ’98 character creation
- NBA 2K player customization and Player DNA
- NHL ’94 arcade gameplay
- Premium late-1990s 32-bit pixel artwork
- Authentic adult recreational hockey culture

Players should be able to recreate themselves, their friends and their real-life beer league teammates.

Maximum customization, personality, replayability and authenticity are priorities.

These characters are recreational hockey players, not professional athletes or fashion models. Embrace realistic imperfections, different ages, diverse appearances, questionable haircuts, beer bellies and mismatched equipment.

## 2. Asset Registry

The following asset packages have been produced.

| Batch | Description | Status |
|---|---|---|
| 16.01 Final | Unbranded base character models | Packaged |
| 16.02 Revised | Authentic beer league portraits | Packaged |
| 16.02B | Bald head foundations | Packaged |
| 16.03 | Hairstyles | Packaged |
| 16.04 | Facial hair | Packaged |
| 16.05 | Skin tone palettes | Packaged |
| 16.06 | Body types | Packaged |
| 16.07 | Equipment customization | Packaged |
| 16.08 | Nationality flags | Packaged |
| 16.09 V2 | Premium attribute icons | Packaged |
| 16.10 | Hockey Influence, Play Style and Archetype cards | On hold |
| 16.11 | Create a Player interface | Packaged |

Always prioritize the latest revised or final package.

Do not use superseded artwork in production.

Inspect each package's JSON manifest and CLAUDE.md before integration.

## 3. Asset Audit Requirements

Before implementation, audit every supplied package.

Classify assets as:

- Production-ready sprites
- Modular customization layers
- Finished portrait presets
- Reference artwork
- Experimental assets requiring cleanup
- Missing assets

Some generated packages contain baked backgrounds, facial hair, uniforms or accessories. Do not assume every supplied PNG is a production-ready modular layer.

Identify any issues with transparency, alignment, recoloring masks, inconsistent dimensions or baked branding.

Do not silently substitute inferior artwork or flatten the customization system to accommodate incomplete assets.

Provide an asset deficiency report so additional artwork can be commissioned.

## 4. Maximum Character Customization

The following quantities represent creative production targets, not verified completed asset counts.

| Customization | Target |
|---|---:|
| Bald head foundations | 32+ |
| Hairstyles | 60+ |
| Hair colors | 20 |
| Facial hairstyles | 40+ |
| Facial hair colors | 20 |
| Skin tones | 24 |
| Eye colors | 12 |
| Body types | 12 |
| Eyebrow variations | 16 |
| Facial imperfections | 24 |
| Age-related overlays | 10 |
| Equipment variations | 40+ |
| Nationalities | 249 countries and territories |

The system must be data-driven and expandable without rewriting the character creator.

Additional assets should be registered through manifests and stable IDs.

### Appearance Requirements

Support independent customization of:

- Facial structure
- Skin tone
- Eyes and eyebrows
- Nose and jawline
- Hairstyle and hair color
- Facial hair and facial hair color
- Receding hairlines and bald spots
- Missing teeth
- Scars, freckles and wrinkles
- Height and weight
- Body shape
- Helmets and face protection
- Gloves, skates and sticks
- Socks and accessories

Nationality, appearance and ethnicity must not determine hockey attributes or restrict available customization choices.

### Body Types

Include realistic recreational hockey builds:

- Skinny rookie
- Lean athlete
- Average build
- Muscular player
- Stocky defenseman
- Heavyweight enforcer
- Dad bod
- Beer belly
- Older veteran

Body type names and final classifications should be reviewed before implementation.

## 5. Modular Rendering Architecture

Character appearance must be stored as configuration data rather than a flattened image.

Use independent rendering layers wherever validated assets support them.

Proposed layer structure:

1. Base body
2. Skin and complexion
3. Head foundation
4. Facial features
5. Age and imperfection overlays
6. Eyebrows
7. Hair
8. Facial hair
9. Jersey and pants
10. Team branding
11. Jersey number and surname
12. Equipment
13. Optional accessories

Support separate front, rear and side views as appropriate.

Maintain distinct rendering profiles for:

- Character creator
- Player portraits
- Locker room scenes
- Career cinematics
- On-ice gameplay

Do not replace the existing on-ice sprites or modify gameplay physics as part of this asset integration.

### Uniform Requirements

Never permanently bake the following into customizable base models:

- Jersey numbers
- Player surnames
- Team logos
- Captain letters
- Team colors
- Sponsor branding

These must be independently rendered or recolored.

## 6. Player Creator Interface

Use the approved Batch 16.11 interface reference as the visual design target.

The visual language includes:

- Dark navy and ice-blue backgrounds
- Metallic panel borders
- Gold selected states
- Green confirmation buttons
- Bold retro sports typography
- Premium illustrated attribute icons
- Large character preview
- Collectible-style player identity cards

Do not use the entire reference screenshot as a static interactive background.

Build a functional interface using reusable components and dynamic content.

### Navigation

The creator should accommodate:

- Profile
- Appearance
- Equipment
- Nationality
- Hockey Influence
- Play Style
- Archetype
- Attributes
- Summary

### Profile Fields

Support fields appropriate to the existing career architecture:

- First name
- Last name
- Nickname
- Jersey number
- Nationality
- Hometown
- Height
- Weight
- Shooting or catching handedness
- Position

The approved design reference contains illustrative names, ages and attribute values. These are not default gameplay values.

Preserve established career starting-age rules.

### Customization Controls

Support:

- Rotate character preview
- Randomize entire appearance
- Randomize individual features
- Lock individual features during randomization
- Save appearance presets
- Load appearance presets
- Reset appearance
- Preview equipment
- Review player summary
- Confirm player creation

Appearance randomization must not reroll confirmed hockey attributes.

## 7. Hockey Influences, Play Styles and Archetypes

The approved visual direction uses three distinct collectible card categories.

### Gold — Hockey Influence

Represents the NHL players a recreational player grew up watching and emulating.

The existing NHL player database should serve as the searchable player registry.

Do not create thousands of individual card textures.

Use reusable card templates with dynamic:

- Player name
- Nationality flag
- Position
- Portrait or fallback illustration
- Era information
- Playing tendencies, where supported by reliable data

Biographical information alone is insufficient to determine a player's hockey abilities or playing style.

Do not invent historical player ratings from height, weight, nationality or draft information.

Use curated profiles or appropriate performance data where available.

Real player names, likenesses and team branding require licensing review before public release.

### Ice Blue — Play Style

Represents how the created player approaches hockey on the ice.

Potential examples include:

- Sniper
- Playmaker
- Grinder
- Dangler
- Two-way player
- Stay-at-home defenseman
- Power forward
- Enforcer
- Goaltending styles

These are examples, not a finalized registry.

### Green — Beer League Archetype

Represents the personality, background and lifestyle of an adult recreational hockey player.

Potential examples include:

- Beer Leaguer
- Old Timer
- Rookie
- Journeyman
- Pond Hockey Kid
- Washed-Up Junior
- Hockey Dad
- Weekend Warrior
- Equipment Guy
- Locker Room Legend
- Emergency Goalie
- No-Show

This category is particularly important to the game's humor, immersion and career storytelling.

Archetypes could influence dialogue, attendance, recruitment, personality, team chemistry and career events, subject to approved gameplay design.

Do not implement fixed bonuses, rarity tiers, card pack economies or pay-to-win mechanics based on the concept artwork.

## 8. IMPORTANT — Batch 16.10 Is On Hold

Before additional card artwork is produced, return the existing or proposed registry for:

1. Hockey Influences
2. Play Styles
3. Beer League Archetypes
4. Player Backgrounds
5. Personality Traits

For each entry, provide:

- Stable ID
- Display name
- Description
- Category
- Position eligibility
- Gameplay effects, if any
- Attribute tendencies, if any
- Implementation status
- Required artwork

Clearly distinguish implemented features from proposed features.

Identify overlaps between archetypes, backgrounds and personality traits.

Do not introduce new gameplay mechanics without creative director approval.

Once the registry is approved, the artwork team will produce matching illustrated cards using the established gold, blue and green visual direction.

## 9. Attribute Icons

Use Batch 16.09 V2 as the preferred attribute icon collection.

The approved style includes:

- Detailed 32-bit pixel illustrations
- Gold borders
- Ice-blue textured backgrounds
- Consistent visual identity

Both 64×64 and 32×32 versions are supplied.

Map these icons to the existing attribute registry.

Do not create new gameplay attributes simply because an icon exists.

Where embedded labels are too small, render accessible dynamic labels alongside the artwork.

## 10. Save Data and Persistence

Use stable IDs for all customization selections.

Character appearance must survive:

- Saving and loading
- Team transfers
- Joining multiple teams
- Uniform changes
- Career progression
- Equipment purchases
- Aging
- Retirement
- Future asset expansions

Use versioned appearance schemas and migration support.

Missing or unavailable cosmetic assets must have safe fallbacks.

Avoid coupling character appearance to a particular franchise or uniform.

## 11. Character Creator Asset Lab

Create or extend the existing development asset lab to support character customization testing.

Include:

- Individual asset previews
- Layer visibility toggles
- Character rotation
- Attachment anchor visualization
- Transparency inspection
- Palette swapping
- Equipment compatibility testing
- Randomized character generation
- Missing asset warnings
- Portrait and gameplay sprite comparisons

This should allow the creative director to review artwork without entering a full career or exhibition match.

## 12. Upcoming Batch 17 — Create a Team

The next artwork production phase will include:

| Batch | Asset |
|---|---|
| 17.01 | Team crest templates |
| 17.02 | Team mascots |
| 17.03 | Home jersey templates |
| 17.04 | Away jersey templates |
| 17.05 | Alternate jersey templates |
| 17.06 | Helmet customization |
| 17.07 | Socks and pants |
| 17.08 | Team typography |
| 17.09 | Team creator interface |

Apply the same maximum-customization philosophy to team creation.

Team branding must be modular and dynamically applied to player uniforms, scoreboards, standings, broadcast overlays, arena signage and championship merchandise.

Support ridiculous recreational hockey team identities, including names such as Sofa Kings and Moose Knucklers.

Do not permanently bake team identities into base assets.

Before Batch 17 production advances too far, identify the required technical specifications for:

- Crest dimensions
- Jersey template dimensions
- Recoloring masks
- Uniform attachment points
- Mascot artwork
- Number and surname placement
- Supported color channels
- Atlas formats
- Transparency requirements

## 13. Required Response

Before making substantial architectural changes, return:

1. Current character creator implementation status.
2. Batch 16 asset audit.
3. Missing or incompatible artwork.
4. Proposed modular rendering architecture.
5. Existing or proposed Hockey Influence registry.
6. Existing or proposed Play Style registry.
7. Existing or proposed Beer League Archetype registry.
8. Batch 17 technical artwork specifications.
9. Recommended implementation sequence.
10. Questions requiring creative director approval.

Preserve all existing gameplay systems, architecture, tests and career decisions.

Do not introduce unapproved gameplay mechanics or discard existing functionality.

The goal is to build the most entertaining and comprehensive recreational hockey character creator possible.
