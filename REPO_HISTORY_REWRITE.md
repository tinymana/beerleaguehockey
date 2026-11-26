# Removing licence-unverified data from repository history: plan for review

Beer League Hockey - Tiny Mana Studios. Requested by the creative director (Decision 61). **Executed on Nov 25 with the creative director's approval (Decision 67).** Result first; the plan as reviewed follows.

## 0. Result

- **Paths removed from every commit:** the seven in section 4 plus `src/dynasty/data/influences.ts` (the clean file was first renamed `curatedInfluences.ts`).
- **Verified in the rewritten history:** no commit touches any targeted path; no commit's tree contains a file matching the raw or derived data names; the biographical file's header line appears only inside this document's own commands.
- **Unrelated history preserved:** 36 commits before, 36 after, with identical messages in identical order. No commit became empty. The trees of the 12 commits that predate the data are identical, and the tip's tree is identical to the pre-rewrite tip.
- **Every commit id changed,** including the early ones. The commits carried signatures, which a rewrite cannot keep, so their ids changed even where their content did not. Old ids quoted in earlier reports (`0c2a775`, `5affd00`, `232e101`, `fa4ebd1`) no longer exist on the branch.
- **Force push:** `git push --force-with-lease=claude/milestone-0-skating-prototype:2a947228... origin <rewritten>:refs/heads/claude/milestone-0-skating-prototype`, accepted. The branch tip is now `034c3ac`, followed by normal commits.
- **Clean build and tests** run on the rewritten tip: all tests pass; the site build contains no private folder and no dataset content.
- **Backup:** the verified bundle of the pre-rewrite history and its checksum were delivered to the creative director.
- **Still true:** GitHub continues to serve the old commits by their ids (checked: `0c2a775`, `5affd00` and `232e101` still resolve) until GitHub Support purges them. Forks or clones made earlier are unaffected. The local `main` and the tag were re-pointed to the rewritten history; neither is on GitHub.

The force push happened only after approval.

## 1. Where things stand today

- The working tree and the tip of the branch no longer contain any raw dataset, or anything generated from one. The game builds and runs without them (fictional fallback registry).
- Raw files are kept only in `data/private/` and `public/private/`, both git-ignored and removed from site builds.
- Older commits on the pushed branch still contain the files listed below. The repository is public until you change it.
- **Making the repository private, and rewriting history, do not recall copies already cloned, forked or cached.** GitHub also keeps unreachable commits for a time and serves them by their id until its own clean-up runs; asking GitHub Support to purge them is the only way to be sure on their side.

## 2. Backup (done)

`/home/claude/blh_backup_2026-11-25/` in the development workspace:

- `beerleaguehockey-all-refs.bundle`: every branch and tag with full history (verified with `git bundle verify`).
- `private_data/`: the raw statistics, the biographical file and the derived private lists.
- `SHA256SUMS`.

The development workspace is not permanent storage. **You hold the originals** of both datasets; keep them. I can send you the bundle as a file if you want your own copy of the pre-rewrite history.

## 3. Affected references

| Reference | Where | Affected |
| --- | --- | --- |
| `claude/milestone-0-skating-prototype` | GitHub and local | **Yes.** The only branch on GitHub |
| `main` | Local only (never accepted by GitHub from here) | Yes if it is ever pushed; it will be re-pointed after the rewrite |
| `v0.1.0-skating-prototype` (tag) | Local only | No: it predates every file below. It is carried through unchanged |
| Forks, clones, GitHub caches | Outside our control | Unknown |

34 commits in total. Every commit before `0c2a775` is untouched in content; commits from `0c2a775` on are rewritten (new ids), and commits before it keep their ids only if nothing earlier changes, which is the case here.

## 4. Paths to remove from all history

| Path | In history since | What it is |
| --- | --- | --- |
| `data/reference/nhl_players.csv` | `0c2a775` | The biographical file (precaution, Decision 61) |
| `data/reference/README.md` | `0c2a775` | Describes that file; harmless, removed for tidiness |
| `data/reference/nhl_stats/` | `5affd00` | Raw `SKATERS.csv` and `GOALIES.csv` |
| `data/derived/` | `5affd00` | Match and review lists and sample profiles that restate the raw data |
| `data/influences/derived_tendencies.tsv` | `232e101` | 861 player ids with a tendency letter |
| `data/influences/reconciliation_decisions.tsv` | `232e101` | Header only; removed for consistency |
| `src/dynasty/data/influencesExtended.ts` | `232e101` | 8,598 names, positions, birth years and countries from the biographical file |

**For your decision, not in the default list:**

- `src/dynasty/data/influences.ts` in commits before today carried country, shooting side, height, weight and an id for the 64 curated players, taken from the biographical file. Today's version carries none of them. Removing the file from history would also remove today's version, so the clean way is to rename it now (to `curatedInfluences.ts`) and then purge the old path. Say the word and I will add that.
- `INFLUENCE_ENGINE.md` quotes career totals for ten players and a handful of names as audit evidence. These are a few published facts, not the dataset. I have left it; it can be trimmed.

## 5. Generated artifacts outside git

| Artifact | State |
| --- | --- |
| Hosted preview (private to you) | Republished today from a build with no dataset content. Its previous versions (v0.4.0 of earlier today) contained the wider registry: names, birth years, countries. They are private to your account. I cannot delete old versions from here |
| `dist/`, `dist-site/` | Never committed. Rebuilt clean |
| Review files sent to you in this conversation (`reconciliation.tsv`) | In your hands only |

## 6. Proposed commands

Run in a fresh clone, not the working copy, so a mistake costs nothing. `git filter-repo` is the tool GitHub recommends; it is not installed in the workspace and would be installed with `pip install git-filter-repo`.

```bash
# 0. Fresh mirror of what GitHub has
git clone --mirror https://github.com/tinymana/beerleaguehockey.git blh-rewrite.git
cd blh-rewrite.git

# 1. Remove the paths from every commit on every ref
git filter-repo \
  --invert-paths \
  --path data/reference/nhl_players.csv \
  --path data/reference/README.md \
  --path data/reference/nhl_stats \
  --path data/derived \
  --path data/influences/derived_tendencies.tsv \
  --path data/influences/reconciliation_decisions.tsv \
  --path src/dynasty/data/influencesExtended.ts

# 2. Prove they are gone from all history (each must print nothing)
git log --all --oneline -- data/reference data/derived src/dynasty/data/influencesExtended.ts data/influences/derived_tendencies.tsv
git grep -l "SKATERS\|PlayerID,Player,Position" $(git rev-list --all) | head

# 3. Prove unrelated history is intact: same number of commits, same messages, same tip tree apart from nothing
git rev-list --all --count          # expect 34
git log --format=%s | md5sum        # compare with the same command before the rewrite

# 4. Replace the branch on GitHub (the one destructive step)
git remote add origin https://github.com/tinymana/beerleaguehockey.git   # filter-repo removes the remote on purpose
git push --force origin refs/heads/claude/milestone-0-skating-prototype
```

Then, in the working copy: `git fetch origin && git reset --hard origin/claude/milestone-0-skating-prototype`, re-point the local `main` and re-create the local tag from the rewritten history, run the tests and a build.

The tip's files are identical before and after: today's commit already removed everything, so step 1 changes only older commits.

## 7. On your side (GitHub)

1. Set the repository to private (Settings, General, Danger Zone). You said you will manage visibility.
2. After the force push, ask GitHub Support to remove cached views and unreachable commits for the repository, quoting commits `0c2a775`, `5affd00` and `232e101`.
3. Check Insights, Forks. A fork made while the repository was public keeps its copy.
4. Create `main` and switch on Pages only after the rewrite, so no second branch carries the old history.

## 8. What I need from you

- Approve the path list in section 4 (and say whether to include the old `influences.ts` path).
- Approve the force push in step 4. It was refused by the workspace's safety check when I attempted the smaller one-commit version earlier, so it may need you to allow it here, or to run step 4 yourself from the commands above.
