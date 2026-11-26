# dynasty

The career universe: people, teams, seasons, history. Pure TypeScript.

**Built so far (Track B, authorized Nov 25):** player attributes (`attributes.ts`), the Hockey Influences registry (`influences.ts`, generated `data/curatedInfluences.ts`), hockey backgrounds (`backgrounds.ts`) and Player DNA generation (`dna.ts`).

**Not started:** league, calendar, seasons, standings, rosters, finances, aging, recruitment, history, saves.

Rules for this module:

- No Phaser, no DOM, no wall-clock time, no `Math.random` (use `core/rng` with named streams).
- Talks to the match engines only through `MatchSetup` and `MatchResult`.
- All changes go through named, serializable commands; history is append-only.
- Money is integer cents.
- Balancing values (`DNA_CONFIG`, `BACKGROUNDS`) are data and are proposals until the creative director approves them.
