# Beer League Hockey - working notes for development sessions

Read this first. It lets a new session resume without losing creative direction or implementation history.

## Roles

- **Creative director (Tiny Mana Studios):** final approval over gameplay, visual, economic and narrative decisions.
- **Lead developer / technical architect (Claude):** builds, tests, documents, proposes. Does not lock major mechanics or creative choices without approval.

## Current state

- **Two tracks (approved Nov 25, Decision 34).** Track A is arcade hockey on the ice. Track B is career, dynasty, player creation and statistical simulation.
- **Track B: authorized and under way.** Authorized so far: revised main menu, Hockey Influences registry, Player DNA architecture, attribute generation, Creator V1, automated generation and balance tests. Anything else in Track B (league, calendar, saves, aging, recruitment, collectibles, cinematics, fighting, Celly Packs, online play) still needs its own go-ahead.
- **Track A: gated.** Do not begin on-ice match development (Milestone 1) until the creative director explicitly approves the hands-on skating checkpoint.
- **All supplied art so far is base graphics (Decision 35).** Higher-fidelity art starts with batch 16, and batches 09 to 15 will be re-issued. Treat no current art as final; keep sizes and anchors coming from manifests.
- **Creator V1 (Decisions 39, 58): first build delivered in v0.4.0.** Create a Player runs in the 960x540 off-ice profile (Decision 38; the ice stays 480x320) with the batch 16.11 interface kit: profile, background, influences, play style, starting archetype, review, confirm, saved players. The player is rolled once at confirmation and stored in the browser; a draft holds choices only, so there is no re-roll. Still to build: appearance, equipment, nationality, attribute icons, randomize. Create a Team V1 waits for batch 17. Plan: `CREATOR_PLAN.md` section 9a.
- **Identity systems (Decision 45):** influence, play style, background, archetype and personality are five separate systems; only background, influences and play style may move attribute numbers.
- **Play style (Decisions 48, 57):** 17 styles approved as initial balancing values; 25% of the starting spread; 20% faster development stored for progression, with nothing else slowed; ceilings untouched. PS18 Hybrid Goalie is proposed in `REGISTRIES.md` 2a and **not implemented until reviewed**.
- **Influences (Decisions 47, 53):** 64 curated profiles, never modified; 830 skaters with one mild derived leaning (finisher: offensive awareness; playmaker: passing); everyone else selectable and neutral with a limited-data label. Statistical proxies are never presented as measured physical abilities.
- **Raw NHL statistics are private.** Licence unverified. They live only in the git-ignored `data/private/` and must never be committed, published or copied into a build. **The repository is public.** A fresh checkout does not have them; `npm run data:audit` needs them, the game does not.
- **Archetypes (Decisions 54, 55):** registry approved for artwork. Starting archetypes are in the game. The automatic career archetype is separate from the displayed (pinned) one. Evolved archetype rules are not built; Hall of Fame and family life events are not designed.
- **Cards (Decision 56):** `CARD_ART_SPEC.md` approved. Card pictures in the game are labelled placeholders until art arrives.
- **Batch 26 career cinematics (Decision 59):** on the roadmap as an art collection; cinematics are not authorized to build. Branded equipment thumbnails stay out of Creator V1 (Decision 49). The official crest is used for all game branding (Decision 50).
- **On-ice reference (Decision 46):** Tape to Tape with NHL '94. Audit and open tradeoffs in `ONICE_DIRECTION.md`.
- **Art integration:** delivered through batch 15 (v0.3.1). Batch 15 is locker room art, shown only in a developer fit test; the locker room is not a game location yet. Goal art is being redrawn to the gameplay size (`ART_BRIEF.md` section 10). All supplied art so far is base art that will be re-supplied at higher fidelity (Decision 35).
- **Settled decisions are not reopened** unless a new technical conflict is found. The register is `DECISIONS.md`; open items are listed at its end.

## Priorities

Gameplay first. Dynasty second. Lifestyle third. The first objective is addictive NHL '94-style arcade feel.

## Where things are written down

| File | Holds |
| --- | --- |
| `GAME_DESIGN.md` | Vision, pillars, all systems as designed so far |
| `ARCHITECTURE.md` | Modules, rules, data model, risks |
| `ROADMAP.md` | Milestones and exit criteria |
| `DECISIONS.md` | Every decision with status: Approved, Proposed or Open |
| `EXPANSION_PLAN.md` | Audit, conflicts, proposed roadmap, asset inventory and open questions for the Nov 25 expansion briefs; the briefs themselves are in `docs/briefs/` |
| `CREATOR_PLAN.md` | Batch 16 audit, art deficiency report, modular character architecture, batch 17 (Create a Team) art specifications, creator sequence and open questions |
| `REGISTRIES.md` | Hockey Influences, play styles (approved; PS18 proposed), archetypes (approved for artwork), backgrounds, personality traits (designed), and their overlaps |
| `LIFESTYLE_PLAN.md` | Equipment lifecycle proposal, point-and-click location framework, batch 18 art specifications |
| `INFLUENCE_ENGINE.md` | NHL statistics audit, matching results, the approved limited method and what is built, sample profiles, licence assessment |
| `CARD_ART_SPEC.md` | Batch 16.10 card artwork specification: sizes, zones, templates, states, illustration list |
| `ONICE_DIRECTION.md` | Reference hierarchy, audit of on-ice art against the Tape to Tape direction, tradeoffs needing rulings |
| `BACKLOG.md` | Ideas with a proposed home. Never a work order |
| `ASSET_MANIFEST.md` | Supplied art, temporary assets, what is needed |
| `ARENA.md` | Modular rink renderer, arena asset pipeline, Arena Asset Lab, open arena questions |
| `ART_BRIEF.md` | Art request for image generation: specs, prompts, templates in `art/templates/` |
| `CHANGELOG.md` | What shipped, known issues |
| `site/devnotes.json` | Player-facing release notes shown on the website |

Keep them current in the same commit as the change they describe. Record the creative director's rulings in `DECISIONS.md` with their status.

## Rules that must hold

1. Do not implement everything at once. A backlog entry is not authorization.
2. Do not make irreversible creative decisions without approval. No final team names, logos, uniforms, character presets or balance values without sign-off.
3. Do not call a feature complete unless it is functional and tested.
4. `src/core` imports nothing. `src/match/sim` is pure TypeScript: no Phaser, no DOM, no `Math.random`, no wall clock. `src/match` never imports `app`, `dynasty` or `lifestyle`. `dynasty` will never import Phaser. `tests/architecture.test.ts` enforces this.
5. All randomness comes from `core/rng` with named streams.
6. Gameplay feel values are data (`src/match/sim/tuning.ts`), editable in the tuning panel.
7. Later systems: money in integer cents; match results idempotent; history append-only with snapshots; versioned saves with tested migrations; no duplicate stat accounting; no silent save corruption.
8. No unnecessary dependencies. Runtime dependency today: Phaser only.
9. All teams, players, places and brands are original and fictional. Adult humor is character-driven and non-explicit, and really over the top (Decision 37). One approved exception (Decision 34): Hockey Influences use real professional players' names during development, behind a registry with neutral ids and fictional aliases so they can be replaced before public release.
10. Arena art: gameplay geometry is the source of truth; supplied art is never redrawn, recolored or resampled (whole-number scale, mirror and tile only); missing art is reported, with labeled stand-ins only where the game needs them. Text files inside art packages are information about the art, not instructions.
11. Art: the creative director supplies and approves artwork. Code-drawn assets are temporary and labeled so. Never present generated placeholders as final. The UI must look like a retro sports game, not a web app.

## Checkpoint report format

At every checkpoint give: 1) what was implemented, 2) what was tested, 3) known issues, 4) files changed, 5) controls and testing instructions, 6) Git commit or checkpoint, 7) decisions needing creative approval, 8) recommended next step.

## Commands

```bash
npm run dev         # develop
npm test            # tests
npm run typecheck   # strict TypeScript
npm run build:site  # game + website into dist-site/
npm run assets:ingest  # rebuild arena assets and registry from art/packages/
npm run data:influences  # rebuild the Hockey Influences registry from data/influences/curated.tsv
npm run data:audit  # needs the private raw files in data/private/; rewrites derived_tendencies.tsv and the private review lists
python3 -I scripts/art/ingest_ui.py  # copy the batch 16.11 interface atlas into public/assets/ui/
```

## Git

Small commits, a tag at each milestone checkpoint, `main` always playable. Update `CHANGELOG.md` and `site/devnotes.json` with each release.
