# L1 — Data / Pipeline: Step-by-Step Completion Guide

**Goal:** by the end of this guide, L1 is **100% done for the 1 October prototype**. Every file in the data contract (Team Build Plan, Section 7) exists, is verified, is published on the Vercel site, and is handed over to L2/L3 with a decoding reference.

**How to use this guide:**
- Do the steps **in order**.
- Each step has **Do → Expect → If different → Done when**.
- Tick the box when "Done when" is true.
- If anything differs from "Expect" and the fix isn't listed, stop and paste the output into the chat.

**What you'll need:** your test folders from Check C, D2, P1b, P2, P3, P4 and P5; Python 3.10+; your Earthdata Login; about 3–5 hours, mostly waiting for downloads.

---

## What L1 delivers (the finish line)

| Folder in the repo | Files | Used by |
|---|---|---|
| `public/data/latest/` | `sst.bin`, `sst.json`, `sst.webp`, `rain.bin`, `rain_phase.bin`, `rain.json`, `rain.png` | Frame view, sound, truth panel |
| `public/data/sequence/` | `rain_000…047.bin` (+ `_phase.bin`, `.png`, `.json`), `index.json` | Storm time-lapse, Story Mode |
| `public/data/context/` | `gistemp_bd.json`, `gpcp_bd.json`, `gpcc_bd.json`, `grace.json`, `firms.json`, `ndvi.json`, `globe_bd.json` | Then vs Now, Place History, GRACE, FIRMS, GLOBE teaser |
| `public/data/demo/` | `dhaka_then_now.json` (numbers **and captions**) | Killer demo, video |
| `public/data/truth/` | `sst_compare.png`, `rain_compare.png`, `crosscheck.png` | Truth panel |
| `pipeline/` | All scripts + `lut_params.json` + `requirements.txt` | Re-running daily |
| `tests/` | Copies of all test scripts and their results | Transparency |

---

## STEP 0 — Put the pipeline into the repo and install packages (20 min)

**Do:**
1. Clone the team repo (`earth-jukebox`) if you haven't.
2. Copy the whole `pipeline/` folder from this pack into the repo root, so you have `earth-jukebox/pipeline/common.py`, etc.
3. Open `.gitignore` in the repo root and **append** the lines from `gitignore_additions.txt`.
4. In a terminal, from the repo root:
   ```
   cd pipeline
   python -m pip install -r requirements.txt
   ```

**Expect:** "Successfully installed …" (or "Requirement already satisfied"), with no red ERROR lines.

**If different:**
- `netCDF4` fails to install on Windows → remove it from `requirements.txt` and re-run; `h5netcdf` covers most files.
- If a later step then says it can't open a `.nc` file, paste that error.

**Done when:** `python -c "import numpy, pandas, PIL, cv2, xarray, h5netcdf, h5py, earthaccess"` prints nothing (no error).
- [ ] Step 0 done

---

## STEP 1 — Copy the verified inputs from your test folders (30 min)

The pipeline reuses exactly what the tests verified. Create these folders inside `pipeline/`:
```
pipeline/inputs/colorbars/
pipeline/inputs/reference/
pipeline/inputs/context/
pipeline/inputs/truth/
```

**Do:** copy (don't move) each file, **renaming where the table says**:

| Copy this file… | …from (your test folder) | …to (in `pipeline/inputs/`) |
|---|---|---|
| `sst_colorbar.png` | Check C (`jukebox_check`) | `colorbars/sst_colorbar.png` |
| `rainbarwhite2.png`, `rainbarblack2.png`, `snowbarwhite2.png`, `snowbarblack2.png` | D2 (`rain_check`) | `colorbars/` (same names) |
| `sst_mur_20260922_no-dates.exr` (the Check C frame) | Check C | `reference/checkC_frame.exr` |
| `points.csv` (from `s3_invert_points.py`) | Check C | `reference/checkC_points.csv` |
| `rain_frame.png` (**the 2026-09-18 00:00 frame used in D2**) | D2 | `reference/d2_frame.png` |
| `rain_points.csv` (**from the final, RGB-only D2 run**) | D2 | `reference/d2_points.csv` |
| `gistemp250.nc`, `gpcp_precip.mon.mean.nc`, `gpcc_full_v2020_2.5.nc` | P1b (test pack folder) | `context/` (same names) |
| `GRCTellus.JPL.200204_202607.GLO.RL06.3M.MSCNv04CRI.nc` | P3 (`grace_files/`) | `context/` (same name) |
| `firms_cases.json` | P2 | `context/` |
| `ndvi_points.json` | P4 | `context/` |
| `globe_bangladesh_unique.csv` | P5b | `context/` |
| `compare.png` | Check C | `truth/compare.png` |
| `rain_compare.png` | D2 | `truth/rain_compare.png` |
| `p1b_crosscheck.png` | P1b | `truth/p1b_crosscheck.png` |

**Important:**
- `checkC_points.csv` must come from the **same frame** as `checkC_frame.exr`.
- `d2_points.csv` must come from the **same frame** as `d2_frame.png` and from the **final RGB-only run**.
- Otherwise the regression checks in Step 9 compare different things.

**Expect:** 5 colorbars, 4 reference files, 7 context files and 3 truth images. The GRACE file is large; the rest are small.

**Done when:** every row above has its file in place.
- [ ] Step 1 done

---

## STEP 2 — Fill in `lut_params.json` (10 min)

Open `pipeline/lut_params.json`. Only **four SST values** are empty (`null`). Everything else is already filled with the verified test values.

| Field | Where to find the value | Example |
|---|---|---|
| `sst.start` | The `START =` value you typed into `s2_build_lut.py` (Check C) | `123` |
| `sst.end` | The `END =` value in `s2_build_lut.py` | `3700` |
| `sst.across` | The `ACROSS =` value in `s2_build_lut.py` | `1500` |
| `sst.exr_encoding` | The output of `s2b_choose_encoding.py`: "Using: sst_frame.png" → `"srgb"`; "Using: sst_frame_raw.png" → `"raw"` | `"srgb"` |

Also check that `sst.orientation` matches what you used (`"horizontal"` is the default). Rain values (`start 40, end 416, across 37`, log 0.1–50) come from D2; leave them unless your D2 run used different numbers.

**Expect:** no `null` left in the file.

**Done when:** `python -c "from common import load_params; load_params(); print('ok')"` (run inside `pipeline/`) prints `ok`.
- [ ] Step 2 done

---

## STEP 3 — Download the newest frames (10 min)

**Do:**
```
python fetch_latest.py --list-only
```
Check the listing, then run the real download:
```
python fetch_latest.py
```

**Expect (list-only):**
- `[sst] SVS 5101: 'Sea Surface Temperature (SST) - Near Real Time…'`
- **exactly one** matching folder ending in `…/frames/4096x2048_2x1_30p/sst_mur_no-dates/`
- `newest: <file name>` with a date within the last 1–3 days
- `[rain] SVS 4285 …` with **one** folder ending in `…/frames/3600x1800_2x1_30p/flatalpha/` and a newest time within the last few hours

**Expect (full run):**
- `saved sst_… (xx MB); age …h` and `saved rain_…`.
- A **Colorbar check** block. **Every line should say `SAME`.**
- `Saved raw/manifest.json`.

**If different:**
- `No folder matched` → paste the "All folders" list it prints.
- A colorbar says `CHANGED` → **stop**. NASA changed a colorbar, so our verified lookup may no longer be right; paste the output.
- A colorbar says "could not download" → fine; the verified local copy is used.
- The SST newest file has no date and no "time taken from dated twin folder" line → paste the output (the frame time would be unknown).

**Done when:** `raw/manifest.json` exists, both products have a `frame_time_utc`, and all colorbars are `SAME`.
- [ ] Step 3 done

---

## STEP 4 — Convert the SST frame (5 min)

**Do:** `python convert_sst.py`

**Expect:**
```
Frame sst_…: 4096x2048; ocean pixels ~65–72% (land/no-data ~28–35%)
  colour distance on ocean: median < 5, 99th pct < 15
  SST °C: min about -2 … median about 15–22 … max about 31–34
  sanity: tropical median ~26–30 °C; polar median < 5 °C
Wrote public/data/latest/sst.bin (1048576 bytes), sst.webp, sst.json (frame time …)
```

**If different:**
- Ocean pixels far below 60% or above 80% → wrong colorbar settings or wrong encoding. Recheck Step 2 (`start`/`end`/`across`, `exr_encoding`).
- Tropical median below 20 °C or polar above 10 °C → the colorbar is flipped or misread. Recheck `orientation`/`start`/`end`.
- "Frame width not divisible" → paste the output.

**Done when:** all four "Expect" lines hold and `public/data/latest/sst.bin` is exactly **1,048,576 bytes**.
- [ ] Step 4 done

---

## STEP 5 — Convert the rain frame (5 min)

**Do:** `python convert_rain.py`

**Expect:**
```
Frame rain_…: 3600x1800; transparent (dry) ~85–95%; visible ~5–15%
  colorbar RGB variant chosen: <straight|black|white>  (exact-match share: … one of them near 100%)
  visible pixels matched within 3 RGB units: ~100%; unmatched (> 25): 0 px (0.00% of visible)
  rain mm/h: median ~0.5–3, 99th pct ~10–40, max ≤ 50; liquid … px, frozen … px
Wrote public/data/latest/rain.bin, rain_phase.bin, rain.png, rain.json (frame time …)
```

**If different:**
- No variant near 100%, or "unmatched" above 1% → **stop** and paste the output. The rain colours may have changed.
- A WARNING line appears → don't publish; paste the output.

**Done when:** unmatched ≤ 1%, `rain.bin` = **3,240,000 bytes**, and `rain_phase.bin` = **1,620,000 bytes**.
- [ ] Step 5 done

---

## STEP 6 — Build the 24-hour storm time-lapse (15–30 min, downloading)

**Do:** `python fetch_rain_sequence.py` (48 frames). If the connection is slow: `python fetch_rain_sequence.py 24`.

**Expect:**
- `48 frames: <start> .. <end> UTC; steps (min): [30]`
- 48 lines `rain_000 … unmatched 0.0%` … `rain_047 …`
- `Wrote 48 frames + public/data/sequence/index.json`

**If different:**
- Steps other than `[30]` → a NOTE is printed; that's acceptable (the app shows each frame's own time), but mention it to L3.
- Any frame with unmatched above 1% → paste the output.

**Done when:** `public/data/sequence/index.json` lists 48 (or 24) frames, and each `rain_XXX.bin` is **1,440,000 bytes** (1200×600×2).
- [ ] Step 6 done

---

## STEP 7 — Build the context files (10–20 min; GRACE is slow to open)

**Do:** `python build_context.py`

**Expect:**
```
Wrote context/gistemp_bd.json (… KB)
Wrote context/gpcp_bd.json (… KB)
Wrote context/gpcc_bd.json (… KB)
Wrote context/grace.json (… KB)
Wrote context/firms.json (… KB)
Wrote context/ndvi.json (… KB)
  GLOBE: 831 rows from globe_bangladesh_unique.csv; time='…', lat='…', lon='…'
         cloud-cover columns: [...]
         satellite columns: [...]
Wrote context/globe_bd.json (… KB)
  GRACE Bangladesh: trend -0.35 cm/yr; A +0.83; B -5.82; missing months …
  GRACE NW_India: trend -3.25 cm/yr; A +8.71; B -53.63; missing months …
Copied truth/sst_compare.png
Copied truth/rain_compare.png
Copied truth/crosscheck.png
```

**Check against P3:** the GRACE numbers must equal your P3 results (−0.35 / +0.83 / −5.82 and −3.25 / +8.71 / −53.63).

**If different:**
- A GRACE number differs → paste the output (the method must match P3).
- The GLOBE row count isn't 831 → check that the right CSV is in `inputs/context/`.
- The GLOBE cloud-cover or satellite column lists are empty → paste the output; the teaser needs those columns.
- `MISSING inputs/truth/…` → copy that image (Step 1) and re-run.

**Done when:** 7 context files are written, the GRACE numbers match P3, GLOBE shows 831 rows with non-empty column lists, and 3 truth images are copied.
- [ ] Step 7 done

---

## STEP 8 — Build the killer-demo file (1 min)

**Do:** `python build_demo.py`

**Expect** (these three captions are what the app and the video will show):
```
Dhaka, April–May: +1.37 °C (NASA GISTEMP, 1981–1990 vs 2016–2025, 10 and 10 years).
Dhaka, June–September: not wetter. GPCP -9% (1981–1990 vs 2016–2025); rain gauges (GPCC) -12% (1981–1990 vs 2010–2019).
Water storage (GRACE): Bangladesh +0.83 → -5.82 cm; NW India +8.71 → -53.63 cm (2003–06 vs 2021–24). Silence = no satellite measurements (Jul 2017–May 2018).
  GPCP means 15.10 -> 13.71; GPCC 14.79 -> 13.03; heat A -0.14 B +1.23
Wrote public/data/demo/dhaka_then_now.json
```

**If different:** any number that doesn't match P1b/P3 → paste the output. Don't fix numbers by hand; the file must stay the single source of truth.

**Done when:** all numbers match exactly.
- [ ] Step 8 done

---

## STEP 9 — Run the acceptance checks (2 min)

**Do:** `python spotcheck.py`

**Expect:** every line `[PASS]`, ending with `N passed, 0 failed`.

| Check | What it proves | If it FAILS |
|---|---|---|
| **A** SST regression | Our pipeline reproduces the Check C inversion exactly (≤ 0.1 °C at 60 points) | Wrong `start`/`end`/`across`/`exr_encoding`, or `checkC_points.csv` is from a different frame. Try copying Check C's `sst_frame.png` as `reference/checkC_frame.png` (and delete the `.exr`): if A then passes, `exr_encoding` is wrong |
| **B** SST grid | The published file decodes back to the pipeline's values | Paste the output |
| **C** Rain regression | Reproduces the D2 inversion (median within 1 colorbar step, max within ~±5%, phase identical, dry = 0) | Set `"rgb_variant"` in `lut_params.json` to `"black"`, then `"white"`, then `"straight"`, re-running `convert_rain.py` + `spotcheck.py` each time. Keep the one that passes and note it. If none passes, paste the output |
| **D** Rain grid | The published file decodes back correctly | Paste the output |
| **E** Metadata | Required fields + verified numbers (0.85 °C; 0.103) + a frame time | Re-run Steps 3–5 |
| **F** Demo numbers | +1.37 °C; 15.10/13.71; 14.79/13.03; GRACE values | Re-run Steps 7–8 |
| **G** Files | Exact sizes; all files present; total < 60 MB | Re-run the missing step |

**Done when:** `0 failed`.
- [ ] Step 9 done

---

## STEP 10 — Re-verify the *latest* frames against NASA (required, 20–40 min)

Spotcheck proves the pipeline reproduces the tests. This step proves **today's** frames are also correct. It matters because the latest SST frame may be a different file type (PNG vs EXR) from the tested one.

**Do:** `python verify_latest.py` (asks for Earthdata login if needed).

**Expect:**
- `SST vs MUR <date>: median ≤ 1.0, p90 ≤ 2.0, bias …` for up to 3 dates, then **`SST RESULT: PASS`**.
- `Rain vs IMERG Late <file>: agreement ≥ 90%, median |log10| ≤ 0.15`, then **`RAIN RESULT: PASS`**.
- `Saved work/verify_latest.json`.

**If different:**
- `no MUR file yet` for all dates → wait a day or re-run with the previous frame.
- `no IMERG Late file yet` → wait a few hours and re-run.
- **FAIL** → **don't publish these frames.** Instead, publish the tested frames:
  ```
  python convert_sst.py inputs/reference/checkC_frame.exr --time=2026-09-22T00:00:00Z
  python convert_rain.py inputs/reference/d2_frame.png --time=2026-09-18T00:00:00Z
  python spotcheck.py
  ```
  Then paste the FAIL output here so we can find out why.

**Done when:** both SST and rain say **PASS** (or you've published the tested frames and reported the failure).
- [ ] Step 10 done

---

## STEP 11 — Commit, push and verify the deployed files (20 min)

**Do:**
1. From the repo root: `git status`. You should see `pipeline/*.py`, `pipeline/lut_params.json`, `pipeline/requirements.txt`, `pipeline/inputs/colorbars/*`, `pipeline/inputs/reference/*`, the small `pipeline/inputs/context/*.json/*.csv`, `pipeline/inputs/truth/*`, and `public/data/**`.
   - You should **not** see `pipeline/raw/`, `pipeline/work/` or any `.nc` file. If you do, fix `.gitignore` (Step 0).
2. Commit and push:
   ```
   git add pipeline public/data .gitignore
   git commit -m "L1: verified data pipeline + published data (SST, rain, sequence, context, demo, truth)"
   git push
   ```
3. Wait for the Vercel deployment to finish (Vercel dashboard → Deployments → "Ready").
4. Open these URLs on the deployed site (replace `<site>` with our Vercel domain):
   - `https://<site>/data/latest/sst.json` → shows JSON with `"svs_id": 5101` and a `frame_time_utc`
   - `https://<site>/data/latest/rain.json` → JSON with `"svs_id": 4285`
   - `https://<site>/data/demo/dhaka_then_now.json` → contains "+1.37 °C"
   - `https://<site>/data/sequence/index.json` → lists 48 (or 24) frames
   - `https://<site>/data/latest/sst.bin` → downloads a 1,048,576-byte file
   - `https://<site>/data/truth/sst_compare.png` → shows the scatter plot

**If different:** 404 → check the files are under `public/data/` (not `web/data/`) and that the deployment is finished.

**Done when:** all six URLs work on the deployed site.
- [ ] Step 11 done

---

## STEP 12 — Hand over to L2 and L3 (15 min)

Post this in the team chat (or add it as `docs/DATA_HANDOFF.md`):

**Where the data is:** `/data/...` on the site (the files in `public/data/`).

**How to decode (TypeScript for `src/lib/data.ts`):**
```ts
// All binary grids: little-endian, row 0 = 90°N, column 0 = 180°W, equirectangular.
export async function loadU16(url: string): Promise<Uint16Array> {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const out = new Uint16Array(buf.byteLength / 2);
  for (let i = 0; i < out.length; i++) out[i] = dv.getUint16(i * 2, true); // explicit little-endian
  return out;
}
export async function loadU8(url: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}
export function cellIndex(lat: number, lon: number, width: number, height: number): number {
  const row = Math.min(height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * height)));
  const col = Math.min(width - 1, Math.max(0, Math.floor(((lon + 180) / 360) * width)));
  return row * width + col;
}
export const decodeSst = (u: number): number => (u === 65535 ? NaN : u / 1000 - 5);           // °C; NaN = land/no data
export const decodeRain = (u: number): number =>                                             // mm/h; 0 = dry
  u === 0 ? 0 : u === 65535 ? NaN : Math.pow(10, (u - 1) / 20000 - 1);
// Phase (rain_phase.bin): 0 dry, 1 liquid, 2 frozen.
```

**Grid sizes:**
- `latest/sst.bin` is 1024×512.
- `latest/rain.bin` + `rain_phase.bin` are 1800×900.
- `sequence/rain_XXX.bin` are 1200×600.

Always read `width`/`height` from the matching `.json` rather than hard-coding them.

**Truth-panel numbers:** read `verified` from `latest/sst.json` and `latest/rain.json`. **Demo captions:** read from `demo/dhaka_then_now.json` (`heat.caption`, `rain.caption`, `water.caption`). No numbers are hard-coded in the app.

**Test values for L3** (so they can check `valueAt()`): pick 3 points from `pipeline/inputs/reference/checkC_points.csv` after running
```
python convert_sst.py inputs/reference/checkC_frame.exr --time=2026-09-22T00:00:00Z
```
Or ask L1 to print `decode_sst` at any lat/lon.

**Done when:** L2 and L3 confirm they can load `sst.json` + `sst.bin` and read a sensible value at a test point (e.g. tropical ocean about 28 °C).
- [ ] Step 12 done

---

## STEP 13 — Transparency folder (15 min)

**Do:** in the repo, create `tests/` with a sub-folder per test:
- `checkA_prior_art`, `checkC_sst`, `checkD2_rain`, `t1_t2_t3`, `p1_power`, `p1b_crosscheck`, `p2_firms`, `p3_grace`, `p4_ndvi`, `p5_globe`.
- Copy each test's **scripts** and **printed results / small outputs** (CSV, JSON, PNG). No large data files: no `.nc`, `.exr` or `.HDF5`.
- Add `tests/README.md` with one line per test: question, date, result (copy from Team Build Plan Section 4).

**Done when:** `tests/` is committed and pushed.
- [ ] Step 13 done

---

## STEP 14 — Refresh routine for Mon 28 and Tue 29 (10–30 min each time)

Run this before L4 records anything, so the frames are fresh and verified:
```
cd pipeline
python run_all.py --no-context        # fetch → convert SST → convert rain → sequence → spotcheck
python verify_latest.py               # must PASS both
cd ..
git add public/data && git commit -m "L1: data refresh <date>" && git push
```

**Rules:**
- **Freeze the data on Tue 29 at 12:00**, together with the feature freeze, so the recording uses exactly the verified files.
- If `verify_latest.py` FAILS on a refresh, don't commit. Keep the previous published data.

- [ ] Step 14 routine understood (and run on Mon + Tue)

---

## L1 = 100% DONE checklist

- [ ] Step 0: pipeline in the repo; packages installed
- [ ] Step 1: all verified inputs copied
- [ ] Step 2: `lut_params.json` complete
- [ ] Step 3: newest frames fetched; all colorbars `SAME`
- [ ] Step 4: SST converted; sanity lines as expected; `sst.bin` = 1,048,576 bytes
- [ ] Step 5: rain converted; unmatched ≤ 1%; sizes correct
- [ ] Step 6: 48 (or 24) sequence frames + `index.json`
- [ ] Step 7: 7 context files; GRACE numbers equal P3; GLOBE 831 rows; 3 truth images
- [ ] Step 8: demo captions with +1.37 °C / −9% / −12% / GRACE numbers
- [ ] Step 9: `spotcheck.py` → **0 failed**
- [ ] Step 10: `verify_latest.py` → SST PASS + rain PASS (or tested frames published and failure reported)
- [ ] Step 11: pushed; 6 URLs work on the Vercel site
- [ ] Step 12: L2/L3 confirmed they can decode the data
- [ ] Step 13: `tests/` transparency folder pushed
- [ ] Step 14: refresh routine run on Mon and Tue; data frozen Tue 12:00

**Not part of L1 for 1 October** (October roadmap): GitHub Actions automation, additional EIC tracks (fires, air quality, wind, rain anomaly), GIBS three-way check, held-out bias checks, GSMaP and OSTIA duets.

---

## Pipeline file reference

| File | Purpose |
|---|---|
| `common.py` | Paths, downloads, colour lookup, inversion, encoders/decoders (the data contract lives here) |
| `lut_params.json` | Verified colorbar settings, credits and verified numbers |
| `fetch_latest.py` | Newest SST + rain frames, colorbar change check, `raw/manifest.json` |
| `convert_sst.py` | SST frame → `latest/sst.bin/.json/.webp` (`--time=` when converting a file by path) |
| `convert_rain.py` | Rain frame → `latest/rain.bin/_phase.bin/.json/.png` |
| `fetch_rain_sequence.py` | Last 48 (or N) rain frames → `sequence/` |
| `build_context.py` | GISTEMP, GPCP, GPCC, GRACE, FIRMS, NDVI, GLOBE → `context/`; truth images → `truth/` |
| `build_demo.py` | Killer-demo numbers + captions → `demo/dhaka_then_now.json` |
| `spotcheck.py` | Acceptance checks A–G (exit code 0 = all pass) |
| `verify_latest.py` | Latest frames vs MUR SST and IMERG Late |
| `run_all.py` | Runs the steps in order and stops at the first failure |
| `requirements.txt` | Python packages |
