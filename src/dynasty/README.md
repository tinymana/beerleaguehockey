# dynasty

Persistent league simulation: seasons, standings, rosters, finances, aging, history, prestige, tournaments.

**Not started.** Authorized work is Milestone 0 and the skating prototype only.

Rules for this module when work begins:

- No Phaser, no DOM, no wall-clock time, no `Math.random` (use `core/rng`).
- Talks to the match engines only through `MatchSetup` and `MatchResult`.
- All changes go through named, serializable commands; history is append-only.
- Money is integer cents.
