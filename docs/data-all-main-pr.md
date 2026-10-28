# PR: daily data refresh on `main` (crons + fresh data for the deployed A2)

**Base:** `main`.
**Head:** a new branch, `data-cron`: `main` plus seven commits cherry-picked from `feat/data-all`.
**Scope:** pipeline, workflows and data only. No app code, no `mapping.json`, no UI change.

## Why

- GitHub runs `schedule` and `workflow_dispatch` workflows **only from the default branch**, so the data crons on `feat/data-all` can't run until they are on `main`.
- Reference test **A2** checks the deployed site, which Vercel builds from `main`. It needs:
  - SST and rain frames ≤ 2 days old;
  - `latest_check` in `sst.json`;
  - verified numbers that aren't the old 0.85 °C.

  Today the deployed data is about a month old.

## What goes in (7 commits, in this order)

| Commit on `feat/data-all` | What it adds |
|---|---|
| `d99f808` docs | `docs/BLOOP_MASTER_BUILD_BOOK.md` (the build book the pipeline cites) |
| `fea1121` pipeline | `pipeline/reference/bloop_data_tests.py`. The pipeline imports its tested routines; it contains no keys (checked) |
| `182a649` pipeline | `pipeline/core/`, `pipeline/products/`, `build_freshness.py`, `run_all.py --cadence`; `verify_latest.py` logs in non-interactively and writes the truth pairs; `build_context.py` keeps the FIRMS daily block; raw formats git-ignored |
| `03a887c` pipeline | `pipeline/checks/` + a two-line hook in `spotcheck.py` |
| `d9b2d39` pipeline | `.github/workflows/data-run.yml` (shared) + `data-daily.yml` (02:15 UTC), `data-weekly.yml` (Mon 03:30 UTC), `data-static.yml` (manual) |
| `dea7893` data | Fresh frames: SST 27 Oct, rain 28 Oct 08:30 UTC, 48-frame sequence, `latest_check` (SST 0.29 °C / 60 points; rain 100% agreement, ≈ 25%) |
| `ab3634c` data | New files: 5176 anomaly, MUR dt, truth pairs, three-way, FWI + archive, 5584, 5113 picture, FIRMS NOAA-20/21 daily, VJ146A2 night lights, `meta/freshness.json` |

**Dry run:** the seven commits apply to `origin/main` (`fdb59a1`) with no conflicts. `pipeline/`, `.github/`, `.gitignore` and `public/data/` on `main` are identical to this branch's base.

**Unaffected app:** the app on `main` ignores the new files and keeps working. The new files are additive; existing files keep their shapes, and `firms.json` only gains a `daily` key.

### Commands

```
git fetch origin
git switch -c data-cron origin/main
git cherry-pick d99f808 fea1121 182a649 03a887c d9b2d39 dea7893 ab3634c
git push -u origin data-cron        # then open the PR against main
```

## Before the first run

1. **Repository secrets** (Settings → Secrets and variables → Actions): `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`, `FIRMS_MAP_KEY`, `OPENAQ_API_KEY`. The Earthdata account must have approved **"NASA GESDISC DATA ARCHIVE"**.
2. **Settings → Actions → General → Workflow permissions:** allow jobs to request write access. Each job asks only for `contents: write` (to commit `public/data`) and `issues: write` (to report a failed run).
3. **Branch protection:** if `main` requires reviews or status checks, the bot's daily `data:` commit will be refused. Either allow GitHub Actions to bypass, or tell me and I'll switch the workflow to open a PR instead of pushing.

## What happens after the merge

- **Every day:**
  - `data-daily` runs `pipeline/run_all.py --cadence daily`: the frame steps, then `verify_latest`, then the daily products, then `build_freshness`;
  - then `spotcheck.py`;
  - if spotcheck passes, it commits **only `public/data`** as `data: daily refresh <time> (spotcheck passed)`, and Vercel redeploys;
  - if anything fails, it opens an issue with the redacted log tail, and the last good data stays.
- **First run:** start it by hand (Actions → data-daily → Run workflow) right after merging, so A2 doesn't wait for 02:15 UTC.
- **Weekly and static:** `data-weekly` has no products until phase 3 (it only rebuilds `freshness.json`). `data-static` is manual.
- **Repo growth:** each daily commit rewrites about 15–20 MB of grids, so git history grows about 0.5 GB a month. Fine through the hackathon; Git LFS or a data branch can come later.

## How to verify

1. **Actions log:** `ALL REQUIRED STEPS PASSED`, then a `data:` commit on `main` touching only `public/data/`.
2. **Deployed site:** after Vercel redeploys, run

   ```
   python pipeline/reference/bloop_data_tests.py A2 --no-install
   ```

   against `https://bloop-ptsd.vercel.app`. Expect **PASS** (the same test passed against the local build of these files on 28 Oct).
3. **Freshness:** `https://bloop-ptsd.vercel.app/data/meta/freshness.json` should list 21 products, all `ok` or `baseline`.

## Not in this PR

The app work on `feat/data-all`: badges, the Truth panel showing 0.29 °C, proof in unison (U), the normal tone and the Sound terrain update. It sits on top of `feat/3d-scenes-1`, which isn't on `main` yet, and comes with the full data-integration PR later.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
