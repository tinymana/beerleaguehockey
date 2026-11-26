# Batch 16.10: definitive card artwork specification

Beer League Hockey - Tiny Mana Studios. Requested in the creative director's proposed rulings of Nov 25. Written against the 960x540 off-ice design space (Decision 38) and the three card frames supplied in batch 16.11 (`card_gold`, `card_blue`, `card_green`, 64x64 nine-slice).

**Approved (Decision 56).** Everything here is cleared for production, including the 18 archetype cards (registry approved, Decisions 54 and 55). Follow the approved batch 18 visual style; true transparency; no real manufacturer or team branding; the official crest on card backs.

**The one rule that shapes everything: art carries no words and no numbers.** Names, descriptions, eligibility, progress, statistics, flags, position and era are drawn by the game from data. A card whose name changes, or whose threshold is rebalanced, needs no new art. This also lets every real name be swapped for a fictional one before release (Decision 34).

## 1. Sizes

All cards are portrait, 5:7. Three sizes, each an exact half of the one above, so one master illustration serves all three.

| Size | Pixels | Used for |
| --- | --- | --- |
| Large | 160 x 224 | The selected card in the creator, card reveals, the collection viewer |
| Medium | 80 x 112 | Lists and grids: choosing an influence, a play style, the archetype collection |
| Small | 40 x 56 | The three influence slots on the profile, save-slot summaries |

**Ruling:** create master illustrations at Large, and optimize the Medium and Small versions by hand wherever visual clarity requires it.

Format: PNG, transparent outside the card, no anti-aliasing against the background, no baked drop shadow, palette consistent with batch 16.11. Higher-fidelity re-issues (Decision 35) keep these exact pixel sizes and zones.

## 2. Zones of the Large card (160 x 224)

Coordinates are x, y, width, height from the top-left. The game draws into every zone marked "dynamic", so the template must leave them as flat, uncluttered fields.

| Zone | Rectangle | Template supplies | Game draws (dynamic) |
| --- | --- | --- | --- |
| Frame | whole card, 6 px border | The coloured border, corners, any foil trim | Nothing |
| Title bar | 8, 8, 144, 18 | A plain band | Name, up to 20 characters, one line |
| Type tag | 8, 28, 72, 10 | A small plain pill | "HOCKEY INFLUENCE", "PLAY STYLE", "ARCHETYPE" |
| Corner badge | 124, 28, 28, 10 | A small plain pill | Position (F, D, G), eligibility icon, or rarity |
| Illustration window | 8, 42, 144, 96 | An inner bevel only | The illustration (section 4), or a silhouette |
| Description box | 8, 142, 144, 40 | A plain panel | Up to three lines of description |
| Footer strip | 8, 186, 144, 30 | A plain panel with one dividing line at y 200 | Two lines: tendencies or leanings; eligibility or progress bar |

Medium (80 x 112) keeps the title bar (4, 4, 72, 10), the illustration window (4, 16, 72, 48) and a two-line footer (4, 68, 72, 40); the description is dropped. Small (40 x 56) is frame plus illustration window (3, 3, 34, 50) only, with the type shown by frame colour.

## 3. Templates to deliver (blank, reusable)

| Id | File name | Sizes | Notes |
| --- | --- | --- | --- |
| T1 | `card_gold_blank` | L, M, S | Hockey Influence. Gold, the most ornate of the three: this is the collectible |
| T2 | `card_blue_blank` | L, M, S | Play Style. Ice blue |
| T3 | `card_green_blank` | L, M, S | Archetype. Green |
| T4 | `card_back` | L, M, S | One shared back, with the official Beer League Hockey crest (the crest is used for all game branding). For reveal flips |
| T5 | `card_locked_overlay` | L, M, S | Transparent overlay for the locked state: darkening, chain or padlock motif, leaving the title bar and footer readable. One overlay works over all three colours |
| T6 | `card_silhouette_f`, `_d`, `_g` | 144x96, 72x48, 34x50 | Generic player silhouettes for the illustration window, one each for forward, defence and goalie, for any influence without its own illustration |
| T7 | `card_focus_ring` | L, M, S | Selection highlight drawn outside the frame, for keyboard and gamepad focus |
| T8 | `card_new_badge` | 24 x 12 | "Just earned" marker with no text (a star or burst); the game adds any word |

That is 3 blank fronts, 1 back, 1 locked overlay, 3 silhouettes, 1 focus ring, 1 badge.

## 4. Card states

| State | How it looks | Built from |
| --- | --- | --- |
| Unlocked | Full colour | Template + illustration + dynamic text |
| Locked, visible | Illustration shown desaturated under T5; name shown; footer shows the requirement and a progress bar | The same illustration, desaturated by the game; T5 |
| Locked, hidden | Card back or a "?" silhouette; name hidden; footer shows a **cryptic hint that does not reveal the exact requirement** (ruled) | T4 or T6. Used for archetypes whose requirement is a secret (Hall of Famer, Ringer, No-Show, Hockey Parent) |
| Selected / focused | T7 around the card | T7 |
| Active archetype | A small marker in the corner badge | Dynamic |
| Limited data (influences) | Silhouette instead of an illustration; a plain "limited data" line in the footer | T6 + dynamic text |

No separate locked illustration is needed for any card.

## 5. Illustrations to deliver

Each is a 144 x 96 illustration-window image (plus 72 x 48 and 34 x 50), with **no text, no numbers, no logos of real brands or teams, and no real likeness** unless the card is one of the featured influence illustrations under Decision 40.

### 5a. Gold: Hockey Influences

- The gold blank template (T1) and the three silhouettes (T6) cover every influence, including all 64 curated and any added later.
- **Ruling: 12 featured Hockey Influence illustrations initially**, subject to rights review. Everyone else uses the reusable generic forward, defenseman and goalie illustrations (T6). Featured illustrations are not a Creator V1 dependency. Suggested twelve: the twelve example influences named in the original brief. For each: illustrated, not photographic; file name by neutral id (`influence_F01`), never by the person's name.
- Dynamic fields on a gold card: name (or fictional alias), position, country flag, era, career span, tendencies, the curated blurb, and the slot it fills (primary 60%, secondary 25%, secondary 15%).

### 5b. Ice blue: the 17 Play Styles (ready to draw)

A character vignette showing the style in action. Skater cards show a generic skater in a neutral uniform; goalie cards a generic goalie.

| File | Style | For | Picture brief |
| --- | --- | --- | --- |
| `style_PS01` | Sniper | F | Mid-release wrist shot, eyes on the top corner |
| `style_PS02` | Playmaker | F | Head up, sliding a pass through traffic |
| `style_PS03` | Dangler | F | Puck pulled between a sprawling defender's legs |
| `style_PS04` | Power Forward | F | Driving the net with a defender hanging off him |
| `style_PS05` | Two-Way Forward | F | Stick in the lane, backchecking hard |
| `style_PS06` | Grinder | F | Digging in the corner, snow flying, missing tooth |
| `style_PS07` | Speedster | F, D | Blur of speed lines, hair out the back of the helmet |
| `style_PS08` | One-Timer Guy | F, D | Stick cocked high at the circle, waiting |
| `style_PS09` | Enforcer | F, D | Gloves off at his feet, calm stare |
| `style_PS10` | Offensive Defenseman | D | A defenceman leading the rush, forwards trailing |
| `style_PS11` | Shutdown Defenseman | D | Planted at the crease, arm barring an attacker |
| `style_PS12` | Puck Mover | D | A crisp first pass from behind his own net |
| `style_PS13` | Bruiser | D | A huge open-ice hit, the other player airborne |
| `style_PS14` | Butterfly Goalie | G | Down in the butterfly, pads flared |
| `style_PS15` | Stand-Up Goalie | G | Upright, square to the shooter, old-school mask |
| `style_PS16` | Acrobat | G | A sprawling, impossible glove save |
| `style_PS17` | Puck-Handling Goalie | G | Out of the crease, firing a pass up the ice |

Dynamic fields on a blue card: name, eligible positions, description, "leans toward" and "leans away" attribute icons (the batch 16.09 icons), and "develops faster".

### 5c. Green: 7 starting and 11 evolved Archetypes (approved)

| File | Archetype | Picture brief |
| --- | --- | --- |
| `arch_AR01` | Rookie | Brand-new gear, price tag still on, standing in the wrong spot |
| `arch_AR02` | Pond Hockey Kid | Toque instead of a helmet, snowbank boards, boots for goalposts |
| `arch_AR03` | Washed-Up Junior | Faded junior jacket, pointing at an old team photo |
| `arch_AR04` | Rink Rat | Leaning on the snack bar like he owns it, skate guards on |
| `arch_AR05` | Roller Kid | Inline skates slung over a shoulder, crashing into the boards on ice |
| `arch_AR06` | Equipment Guy | Buried under sticks and bags, everything immaculate |
| `arch_AR07` | Emergency Goalie | Half-dressed in mismatched pads, phone ringing |
| `arch_AR20` | Hall of Famer | A framed photo by the snack bar, small brass plate (blank) |
| `arch_AR21` | Locker Room Legend | Holding court on the bench, the whole room laughing |
| `arch_AR22` | Captain | The C on the chest, collecting cash in a helmet |
| `arch_AR23` | Old Timer | Grey beard, ancient gloves, wide open at the back post |
| `arch_AR24` | Iron Man | Skating through a blizzard to an empty rink, first one there |
| `arch_AR25` | Journeyman | A hockey bag covered in different team patches (invented crests) |
| `arch_AR26` | Hockey Parent | Full gear, a child's backpack in one hand, orange slices in the other |
| `arch_AR27` | Ringer | Far too smooth, a pile of pucks in the net, innocent shrug |
| `arch_AR28` | No-Show | An empty stall with a phone lit up: no words on the screen |
| `arch_AR29` | Weekend Warrior | Tie loosened under the shoulder pads, briefcase by the bag |
| `arch_AR30` | Beer Leaguer | Post-game, helmet off, can in hand, content |

Dynamic fields on a green card: name, description, eligibility, progress toward the threshold (a bar and "31 / 40 seasons"), date earned, and the "active" marker.

Any lettering inside an illustration (a jersey letter such as the captain's C is fine; signs, phones and plaques are not) must be left blank so it can be localised and renamed.

## 6. Count

| Item | Count |
| --- | --- |
| Blank templates and shared pieces (T1 to T8) | 10 pieces, most in three sizes |
| Play Style illustrations | 17 |
| Archetype illustrations | 18 |
| Featured influence illustrations | 12 initially, subject to rights review |

## 7. Manifest

One `manifest.json` with, for each file: id, file, size, and for templates the zone rectangles from section 2 as they were actually drawn. If a zone had to move, say so in the manifest and the game will follow it; the zones come from the manifest, not from this document, once art exists.

## 8. Answered (Decision 56)

1. Sizes: masters at Large, smaller versions optimized where clarity requires it.
2. Hidden archetypes: cryptic hints.
3. Featured influences: 12 initially.

If PS18 Hybrid Goalie is approved (`REGISTRIES.md` section 2a), add `style_PS18` to section 5b: 18 Play Style illustrations.
