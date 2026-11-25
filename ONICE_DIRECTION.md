# On-ice direction: Tape to Tape as a reference, and an audit of what we have

Beer League Hockey - Tiny Mana Studios. Answers the creative director's Tape to Tape update of Nov 25 (Decision 46). **An audit and recommendations only.** Nothing on the ice has changed, and on-ice match development is still gated on the skating checkpoint.

## 1. Reference hierarchy (approved)

| Area | References |
| --- | --- |
| On-ice gameplay | Tape to Tape, NHL '94 |
| On-ice visual presentation | Tape to Tape (primary), approved Beer League Hockey artwork |
| Career and dynasty | NBA 2K, NBA Live '98 |
| Off-ice adventure | The Adventures of Willy Beamish, Day of the Tentacle |
| Character art and humor | Arch Rivals, Slap Shot |
| Action cinematics | Neo Turf Masters, Baseball Stars |

Not taken from Tape to Tape: roguelike structure, supernatural abilities, power-ups. The game remains a persistent recreational hockey career RPG. Everything stays original: art, code, characters, branding, environments.

## 2. What the reference does, in terms that matter to us

I have not played it; this is from published descriptions and reviews, and you know it better than I do, so correct anything here.

- It is described as an NHL '94-style arcade game with modern, responsive controls; its makers call the aim a blend of modern precision and 1990s pace.
- Reported controls beyond pass and shoot: aiming a slap shot with the stick, and holding pass for a saucer pass. Big hits, one-timers and desperate saves are selling points.
- Its look is cartoon, with humorous character designs. One early write-up describes the arena as a 3D model and the players as paper-doll-style sprites: figures built from separately animated parts rather than drawn frame by frame.

That last point is the important one technically. A paper-doll character can move fluidly and expressively with very little art per pose, and a 3D arena gives real lighting, shadows and depth. Our game is the opposite kind of thing: hand-placed pixel art on a flat tile rink at 480x320.

## 3. Audit of our on-ice art against the direction

| Area | What we have | Gap against the direction | Opportunity |
| --- | --- | --- | --- |
| Skater sprites | One supplied sheet, 48x48 cells, eight directions, a few poses, colours painted in | Little personality; everyone is the same person; no team colours | Larger, more characterful skaters with visible faces, hair and builds; layered so team colours and created players show |
| Goaltender | None on the ice yet. Batch 01 goalie sheets exist as reference | Everything | Goalie with readable save animations: butterfly, glove, stack, desperation |
| Animation | Two or three frames per action | Stiff next to the reference | More frames on the actions that carry feel: stride, stop, shot wind-up and follow-through, hit, fall, celebration |
| Rink | Modular tiles, markings, cosmetic ice wear | Flat and evenly lit | Ice sheen, snow build-up, spray on stops, skate cuts that follow the blades |
| Shadows and lighting | A blob shadow under the skater; light streaks on the ice; a soft light-pool sprite (batch 14) unused | No sense of arena light | Use the light pools; shaped shadows that follow the sprite; darker ice toward the boards |
| Arena atmosphere | Side stands with a seated crowd, benches, goal lamps; crowd celebrates goals | End stands missing; crowd idle most of the time | Crowd that follows play (leaning, standing on rushes), end seating, noise-reactive moments |
| Camera | Follows the skater with look-ahead; slight shake on shots and goals | No drama on big moments | Brief push-in on goals and hits, wider framing on breakouts, puck-led rather than player-led |
| Visual effects | Camera shake only | No impact feedback | Hit flashes, puck trail on hard shots, net bulge (art exists), stick-on-puck sparks, glass shake |
| Equipment readability | Painted into the one sprite | Cannot see sticks, gloves or helmets as separate things | Follows from layered skaters |
| Puck visibility | Small dark puck with a shadow | Easy to lose in traffic | Outline or glow ring; a marker when it is off screen |
| Broadcast presentation | A temporary text HUD | No scorebug, replays or stingers | Scorebug in team colours, goal replays, period stingers |

## 4. Tradeoffs that need your ruling before any of this is built

1. **How big a skater is on screen.** Personality needs pixels. At 480x320 a 48x48 skater is fine for NHL '94 readability and small for Tape to Tape expressiveness. Options: keep the size and get personality through animation and effects; or raise skaters to about 64 px, which shows less ice around them; or raise the on-ice resolution, which you have said not to do without approval.
2. **Aspect.** Off-ice is now 960x540, widescreen. The ice is 480x320, which is 3:2. They will sit differently on a monitor: the ice will have bars at the sides where the menus do not. A vertical rink actually wants a taller window, not a wider one, so widening the ice view would show less of the length of the rink. My recommendation: keep the ice at 3:2 and put the side bars to work as a broadcast frame (scorebug, bench, sponsor boards), rather than change the camera.
3. **Frame-by-frame or built from parts.** Fluid animation in pixel art is expensive: every frame of every action, in eight directions, for every body type and layer. The reference avoids that cost with paper-doll characters. We can stay frame-by-frame (truest to "detailed 32-bit pixel art", most art), or move skaters to parts animated by the game (far less art, a different look, new code). This decides the size of every future skater batch.
4. **Lighting.** Real lighting and soft shadows are 3D or shader work. In 2D we can approximate with drawn shadows, light pools and tinting. Good, not the same.
5. **Rink orientation and resolution** stay as approved. Nothing here needs them changed.

## 5. Recommendations

- Treat feel first. Responsive skating, passing, shooting feedback, hits and goalie behaviour are Track A, and most of the Tape to Tape gameplay list lives there. The skating checkpoint is still the gate.
- Decide tradeoffs 1 to 3 before the next skater batch is drawn, because they set its size, its layers and its frame count. `ART_BRIEF.md` should be reissued once you have.
- Cheap wins that need no new art and no engine change, once Track A is open: the unused light pools, impact effects, puck outline, camera push-ins, a crowd that reacts to rushes.
- Nothing existing is discarded. The current rink, boards, stands and crowd all carry forward.
