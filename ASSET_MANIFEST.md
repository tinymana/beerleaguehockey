# Asset manifest

Beer League Hockey - Tiny Mana Studios. Part of the project knowledge base (see `CLAUDE.md`).

**How to read status in these documents**

- **Approved**: decided by the creative director. Build to it.
- **Proposed**: the developer's recommendation. Not approved; do not build on it without sign-off.
- **Open**: unresolved; needs a prototype or a decision.

Current authorization: **Milestone 0 and the skating prototype only.**

Three pieces of approved art exist today; everything else is either a code-drawn temporary stand-in or not started, and no final art is produced without your approval. Counts are proposals.

| Asset group | Contents | Needed by | Status |
| --- | --- | --- | --- |
| Title screen (locker room) | 1536x1024 key art | Milestone 0 | Supplied, in use |
| Sunset rink splash | 1536x1024 key art | Loading and season start | Supplied |
| Crest logo | Transparent logo | Menus, favicon | Supplied |
| Menu and UI type | Pixel font, menu frames, cursor | Milestone 0 | Temporary code-drawn font; final type needs approval |
| Rink | Ice, lines, boards, nets, benches | Skating prototype | Temporary style test for your review |
| Skater sprite | 8 directions, skate cycle, shoot | Skating prototype | Temporary style test for your review |
| Goalie, referee, crowd, scorebug | Sprites and broadcast overlays | Milestones 1 to 3 | Not started |
| Character layers | About 4 body types, 8 skin tones, 12 face presets, 5 eye colors, 16 hair styles with thinning stages, 8 hair colors plus gray, 10 facial hair styles, 4 helmets, visor and cage, gear trims | Milestone 5 | Not started; presets need approval |
| Character output sizes | 64x64 portrait, 24x24 chat avatar, on-ice sprite | Milestone 5 | Sizes proposed |
| Franchise crests | 40 league teams plus tournament-only teams, three sizes each | Milestone 4 onward | Blocked on your approved roster |
| Uniforms | Home and away per franchise, built from shared stripe templates and three colors | Milestone 4 onward | Blocked on your approved roster |
| Puck Falls locations | The Ice Barn, Locker Room, The Penalty Box, Top Shelf Hockey, The Five Hole, Player Home | Milestone 7 | Not started |
| Group chat, newspaper, trophy and banner art | UI frames, mastheads, trophies, rings, banners | Milestones 5 to 8 | Not started |
| Tournament identities | Logos and trophies per event | Tournament milestone | Not started |
| Audio | Skate, puck, boards, horn, crowd, music | Milestone 1 onward | Not started |

## Files in the repository

| File | What it is | Status |
| --- | --- | --- |
| `art/source/title-locker-room.png` | Supplied title key art, 1536x1024 | Supplied by creative director |
| `art/source/splash-sunset-rink.png` | Supplied sunset rink splash, 1536x1024 | Supplied by creative director |
| `art/source/crest-logo.png` | Supplied crest logo, transparent | Supplied by creative director |
| `public/assets/title-locker-room.png` | Copy of the title art served to the game | In use on the title screen |
| `public/favicon.png` | 64x64 reduction of the crest | Derived from supplied art |
| `site/assets/*` | Web-sized copies and crops of the supplied art, plus real prototype screenshots | Derived; for the website |
| `site/fonts/*` | Tiny5 and Jersey 15 web fonts (SIL Open Font License), carried over from the Ryan's Road site | Third-party, open license |

## Code-drawn temporary assets

These are generated at boot by code and are **not** final art. Each is labeled temporary in the source.

| Asset | Source file | Replace with |
| --- | --- | --- |
| 5x7 pixel font | `src/app/pixelFont.ts` | Approved retro sports typography |
| Rink (ice, lines, boards, nets, stands) | `src/match/view/textures.ts` | Approved rink art |
| Skater, 8 directions x 2 frames | `src/match/view/textures.ts` | Approved skater sprites |
| Puck and shadow | `src/match/view/textures.ts` | Approved sprites |
