# Beer League Hockey - working notes for development sessions

Read this first. It lets a new session resume without losing creative direction or implementation history.

## Roles

- **Creative director (Tiny Mana Studios):** final approval over gameplay, visual, economic and narrative decisions.
- **Lead developer / technical architect (Claude):** builds, tests, documents, proposes. Does not lock major mechanics or creative choices without approval.

## Current state

- **Authorized:** Milestone 0 and the initial skating prototype. Delivered as v0.1.0.
- **Waiting on:** the creative director's review of the playable checkpoint. Do not start Milestone 1 until approved.
- **Not started and not authorized:** dynasty, lifestyle, league economy, characters, franchises, prestige, careers, tournaments, multiplayer.

## Priorities

Gameplay first. Dynasty second. Lifestyle third. The first objective is addictive NHL '94-style arcade feel.

## Where things are written down

| File | Holds |
| --- | --- |
| `GAME_DESIGN.md` | Vision, pillars, all systems as designed so far |
| `ARCHITECTURE.md` | Modules, rules, data model, risks |
| `ROADMAP.md` | Milestones and exit criteria |
| `DECISIONS.md` | Every decision with status: Approved, Proposed or Open |
| `BACKLOG.md` | Ideas with a proposed home. Never a work order |
| `ASSET_MANIFEST.md` | Supplied art, temporary assets, what is needed |
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
9. All teams, players, places and brands are original and fictional. Adult humor is character-driven and non-explicit.
10. Art: the creative director supplies and approves artwork. Code-drawn assets are temporary and labeled so. Never present generated placeholders as final. The UI must look like a retro sports game, not a web app.

## Checkpoint report format

At every checkpoint give: 1) what was implemented, 2) what was tested, 3) known issues, 4) files changed, 5) controls and testing instructions, 6) Git commit or checkpoint, 7) decisions needing creative approval, 8) recommended next step.

## Commands

```bash
npm run dev         # develop
npm test            # tests
npm run typecheck   # strict TypeScript
npm run build:site  # game + website into dist-site/
```

## Git

Small commits, a tag at each milestone checkpoint, `main` always playable. Update `CHANGELOG.md` and `site/devnotes.json` with each release.
