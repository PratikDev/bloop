# 13 November: onboarding checklist

The official resource list may grow when the challenge opens. Everything below runs from `pipeline/` on this machine,
with no installs on C: (extra Python libraries are in `D:\Jukebox\tools\pylib`, ffmpeg in `D:\Jukebox\tools\ffmpeg`).
Work on `bloop-dev`; push only after the checks pass.

## 1. Diff the revealed list against ours (5 minutes)

1. Open Challenge #14's **Resources** tab. Select all, copy, paste into `data_raw/_tmp/resources_nov13.txt`.
2. Run:

   ```
   python -m svs.onboard.diff ../data_raw/_tmp/resources_nov13.txt
   ```

   It sorts every SVS ID it finds into four groups and prints the commands for the new ones:
   - **already official**: nothing to do;
   - **related record exists**: move that ID's row from the `related` table into the `official` table of
     `docs/official_resources_links.md` (one line); the record, doc and validation row already exist;
   - **covered by another record or a live product**: nothing to do (note it in the table);
   - **new**: onboard it (step 2).
3. Non-SVS links (GIBS/Worldview layers, partner datasets): a Worldview layer becomes
   `python -m svs.onboard gibs:<LayerId>@<YYYY-MM-DD>`; other datasets go to `docs/related/COMPANION_SOURCES.md`.

## 2. Onboard each new ID (target: under 60 minutes each)

```
python -m svs.onboard <svs_id> --frames 3
```

One command runs: API fetch → twin finder (SOS / equirectangular versions) → asset choice (smallest usable tier) →
frames (ffmpeg if the item is movie-only) → frame times (date file, burned-in date, file name, dataset range) →
georeference → colorbar (page key, then the frame's own bar) → inversion → validation-source lookup and check →
status (verified → stated error → relative → pattern only → not usable) → export, manifest, `docs/related/<id>.md`,
validation row, registry row, related index. Graphs and spirals in `svs/onboard/series.py` are played from their
cited source series automatically.

The run prints its time per step and writes `data_raw/related/onboard/<id>.json`. A missing validation source never
stops it: the record ships with the status it earned. **Read the status line** and the doc before promoting.

## 3. Rebuild the shared files and rerun every check (10 minutes)

```
python -m svs.records.voices
python build_freshness.py --only rel_<id> [rel_<id2> …]
python -m unittest discover -s svs/tests -t .          # includes the completeness test
cd .. && bun test && bun run lint && bunx tsc --noEmit -p .
```

The completeness test reads the `official` table: after promotion it requires the ID's doc (`docs/official/` or
`docs/related/`), its manifest and its validation row — all written by step 2.

## 4. Commit and redeploy

```
git status                                   # only the new record, its doc, the shared index/registry/freshness/voices
git add <those paths> && git commit -m "related: onboard SVS <id> (<status>)" -- <paths>
```

Push `bloop-dev` and merge to `main` (with the team's yes): Vercel deploys on every push to `main`, and the daily
GitHub Action (which also refreshes 5624 and 5650) only runs from `main`.

## If SVS is slow (we saw ≈ 20 KB/s on 29 Oct)

- Keep `--frames 3` (or `--frames 2`); the asset rule already picks the smallest tier ≥ 1024 px wide.
- Downloads resume: if a run stalls for more than 10 minutes, stop it and run the same command again; partial files in
  `data_raw/<id>/frames/*.part` continue where they stopped.
- A twin with a flat 2:1 set is usually smaller than the hyperwall cut; the twin finder prefers it automatically.
- If an item cannot be fetched at all, onboard the matching GIBS layer instead (`gibs:<Layer>@<date>`) and say so in
  the table's "Why" column.
- Movie-only items download the whole MP4 once: check its size on the SVS page first; if it is over ~500 MB and SVS is
  slow, onboard a still or the GIBS layer instead.
