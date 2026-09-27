# L3 interface: Phase 3 and Phase 4 (`L3-interface` into `main`)

## Summary

This brings L3's work since PR #3 into `main`: 19 commits, 106 files. Phase 3 adds Then vs Now, Place History, the storm time-lapse, the satellite whisper, Story Mode, the Provenance panel and a credits footer. Phase 4 adds captions for every sound, Describe mode, the Bangla setting (English fallback), "Coming in October" labels and an accessibility pass. It also has the fixes from L2's review of PR #4.

The sound still comes from L3's **interim engine**, built to L2's API; the app says so with an "Interim sound engine" badge. Swapping in L2's engine is one file (`docs/L3/integration.md`). Full record: [PROGRESS.md](PROGRESS.md).

## What L3 adds

| Feature | What it does | State |
|---|---|---|
| Then vs Now | "Dhaka then vs now": heat (GISTEMP), monsoon (GPCP) and water (GRACE), with charts whose playheads follow the sound, a disclosure panel, and "then left, now right" | Complete; captions **Pending team approval** |
| Place History | Chattogram, Dhaka, Rajshahi or Sylhet; heat or rain; a decade played month by month with a playhead | Complete; drag-to-scrub not built |
| Storm time-lapse | The last 48 half-hourly IMERG frames at 2 per second; the cursor follows the heaviest rain near Bangladesh; each frame's own value and time on screen; works with sound off | Complete; 10.5 MB first download (request C5) |
| Satellite whisper | After a spoken value: a chime and a caption naming the mission and dataset from the metadata, e.g. "measured by NASA and JAXA's GPM satellites (IMERG, Early run)" | Complete |
| Story Mode | Ocean hum, sweep from Chattogram, storm time-lapse, satellite whisper, "How we know"; X-ray labelled "Coming in October"; every number from L1's files; Esc exits | Complete; **length not verified by a person** (97 s with the test voice; target 60 to 90 s) |
| Provenance panel (P) | Value, full dataset name, SVS ID and link, frame time and check for the point on screen | Complete (minimal) |
| Captions | A caption for every sound, including spoken lines and the end of Place History | Complete |
| Describe mode (D) | Says what is playing, through the built-in voice or the screen reader, never both | Complete |
| Bangla setting | Switches every string in the app's table; untranslated strings show in English; speech stays English with Bangla on screen (plan §17) | Mechanism complete; **0 of 272 strings translated** |
| "Coming in October" labels | Every plan §11.7 concept item and X-ray, in Help (and X-ray wherever it appears) | Complete |
| Credits footer | Plan §15 text, split into "Data in this app" and "Also used in our testing" | Complete; plan and README to match (E3) |
| L2 review fixes (PR #4) | Eight sound and UI bugs: history playhead, monsoon stop, mixer, clicks, rain timing, opening, map click during reveal | Fixed |

## Interim or pending

| Item | Why | Waiting for |
|---|---|---|
| Interim sound engine | L2's engine isn't merged yet | L2; the swap is one file (`src/lib/audio-adapter/index.ts`) |
| Ocean Truth number | Shows "Verification being updated" | L1: held-out check (A1) |
| Rain Truth and Then vs Now wording | Shown with a "Pending team approval" badge, built from the JSON | Team approval of new §16 wording (A2, A3, A4) |
| X-ray | Labelled "Coming in October" | L1 colorbar data (C1) |
| Bangla translations | 272 strings; the video's closing shot needs 39 first (priority list at the top of `bangla-strings.md`) | A translator; recorded Bangla narration (L4) |
| Caption keys | Time-lapse keys (B8) and two UI-only keys (B7 heads-up) | L2 to confirm |

## Merge readiness (checked 28 Sep)

- **With `main`:** clean. `main` has only the PR #3 merge commit, whose files match `0a90552`, which this branch already contains. A `--no-commit` merge of `origin/main` into this branch brought in no file changes; lint, type check, build and the scripted browser checks passed on it. The merge was then aborted, not committed.
- **With L2's branch** (dry run with `git merge-tree`, nothing merged): the only conflict is **`bun.lock`**. `package.json` merges on its own and keeps L2's `"test": "bun test"`. Both branches add `@types/bun`. Resolve by taking this branch's `bun.lock` or running `bun install` (L2 confirmed both work, decision 12). No other file is changed on both sides.

## Config, schema and environment

- **Dependencies:** adds `recharts` 3.8.0 and `@types/bun`.
- **Schema:** no change to `src/types/data-contract.ts` or to L1's files since PR #3.
- **Config and environment:** no change to `next.config.ts`, `tsconfig.json` or environment variables. `src/app/globals.css` adds three chart colour tokens only.
- **Shared files:** L3 owns the re-themed shadcn `dialog`, `sheet`, `slider`, `tabs`, `toggle`, `toggle-group`, `tooltip`, `chart` (and `button`); it doesn't add L2's `badge`, `card`, `label`, `select` or `switch` (proposal B4).

## How it was validated

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` after every change.
- Scripted checks in headless Microsoft Edge on the production build, measuring audio through the app's analyser: the core flow, sound off, Then vs Now, the time-lapse, Story Mode, Provenance, and a keyboard-only accessibility pass (every mode, focus rings, 200% zoom, phone size, reduced motion). No console errors. The scripts live outside the repo for now (PROGRESS.md §8).
- Contrast: every text pair meets WCAG AA (lowest 5.53); borders meet 3:1 (lowest 3.09).

## What reviewers should check

1. **Listen** (nobody has yet): play Story Mode on a laptop with its normal voice and time it; check the hum, sweep and chime are clear under the speech; ear-check the interim sound (L2's tests T2 to T6).
2. **Screen reader** (NVDA + Chrome): arrows on the map read the value once; Enter with Built-in voice off reads "Source: …"; Describe on with S reads the sweep once; Story's Esc says "Story stopped. Back to Explore."; Help lists the "Coming in October" items. Steps are in PROGRESS.md §9.
3. **Honesty:** every number on screen comes from L1's files; pending wording shows its badge; nothing unbuilt looks finished.
4. **L2:** confirm the B8 time-lapse caption keys and the two UI caption keys (B7 heads-up); check that `L2AudioApi` in `src/lib/audio-adapter/types.ts` still matches your engine.
5. **Team:** approve or change the §16 wording (A1 to A4) and update the plan for the sweep from Chattogram (E1) and the credits split (E3).
6. **After merging with L2:** resolve `bun.lock` as above, then run `bun run lint`, `bun run build` and `bun test`.

## Related

- PR #3 (Phase 0 to 2), PR #4 (L2's review; fixes in `5a77b30`).
- Requests to other lanes: [contract-proposals.md](contract-proposals.md).
