# Data integration plan (`feat/data-all`)

**Status:** draft for approval, 28 Oct 2026. No code written yet.
**Goal:** bring every dataset the Master Build Book marks as verified and usable into the app: the pipeline, the data contract, the voices, the Turntable records and the 3D scenes (including the 11 waiting in `Scenes/future.ts`).
**Deadline:** Video 2 feature freeze, Mon 9 Nov, 18:00 Asia/Dhaka. Work follows the priority order (prompt §6), so stopping after any phase leaves a working, honest app.

Sources read for this plan:
- `docs/BLOOP_MASTER_BUILD_BOOK (1).md` (Parts 0, 4, 5, 6, 7, 13; Appendices A and C);
- `pipeline/reference/bloop_data_tests.py`;
- `pipeline/` (`run_all.py`, `spotcheck.py`, `common.py`, `build_context.py`);
- `src/types/data-contract.ts` (sections 1–14), `src/lib/data/*`, `public/mapping.json`;
- the Turntable v3 records (`Turntable/records.ts`), `docs/3d-scenes-1-plan.md`, `Scenes/future.ts` and `Scenes/registry.ts`.

---

## 1. What the book says (the rules this plan follows)

### 1.1 Part 4: the data registry

**Routes (§4.1).**
- **Browser-safe (CORS `*`):** GIBS tiles, Open-Meteo, Hydrocron, the ORNL MODIS service, USGS, EONET, SWPC and CelesTrak.
- **Pipeline only:**
  - SVS frames (SVS only allows `tempo.multiverse.music`);
  - FIRMS and OpenAQ (keyed);
  - everything behind Earthdata Login;
  - GEOS-CF Zarr, ERDDAP and the TiTiler point reads.
- **Rule:** anything without proven CORS, or that needs a key, reaches the browser as same-origin JSON. Satellite data is called "latest available", never "real-time".

**Values (§4.3).** One table per EIC area, with the measured number and its caveat. Every number in the inventory below comes from there.

**Dead / excluded (§4.5).** Respected in full; the inventory marks every such row **No**:
- NASA POWER for long-term rain or heat;
- GEOS-CF v1, and splicing v1 with v2;
- inverting the 5151–5154, 5148 and 4950 frames; 5544; 5046/5064;
- LHASA at GES DISC; SWOT Version C; the OPERA ArcGIS services;
- IRIS audio; legacy SWPC JSON; xeno-canto v2; the GLOBE API; the US Embassy live feed (historic files only);
- EMIT over Bangladesh; OCO-2 as a live voice; IMERG Final after Sep 2025;
- **S-NPP after 2 Nov 2026, 13:00 UTC:** use NOAA-20/21 (`VJ1…`, `VJ2…`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`);
- Himawari P-Tree; BMD paid data; TEMPO for Bangladesh; Open-Notify.

**Independence (§4.6).** Each duet says its shared inputs out loud:
| Pair | What we say |
|---|---|
| IMERG × GSMaP | "Partly independent" (both use GPM microwave) |
| MUR × OSTIA × OISST | "Partly independent"; AMSR2 is the most independent |
| CAMS | "Not independent of NASA" (it assimilates MODIS AOD) |
| MERRA-2 | "Model estimate; not for validation" |
| Wells × GRACE | Independent (seasonal rhythm only) |
| GEDI × ICESat-2 × CMS | ICESat-2 is the independent lidar; CMS uses GEDI for calibration |
| 5176 × CRW | Independent; expect an offset |

**Claim ledger (§4.8).** A number goes on screen only if it comes from app JSON, with its label. The "Never say" list is enforced by the caption guardrail test (§10).

**Build reference (§4.10).** Exact paths, variables, boxes and points. The pipeline takes these from the reference suite's constants, not new literals (§2.1).

### 1.2 Part 5: the engine

**Data contract (§5.3).**
- Grids are little-endian; row 0 = 90° N; col 0 = 180° W.
- Every product carries a metadata block with `product`, `source_dataset`, `grid`, `verified`, `credit` and `generated_utc`.
- The 21 proposed files are all in the inventory. Missing products follow the same style.

**Mapping (§5.4).** 15 new voices, each listed in §5 with its rule. Global rules:
- master gain capped, with a limiter;
- mute and solo on every voice;
- **personalisation changes timbre only.**

**Guardrails (§5.5), enforced:**
- **1:** untested polarities are labelled "design choice" (fresh → higher, FWI → dissonance, NDVI).
- **2:** one shared scale for every comparison.
- **4:** no second variable in loudness on a pitched voice.
- **6:** one neutral missing-data texture (the existing `nodata` tick).
- **7:** "not wetter" stays plain.
- **9:** no warning-like sounds.
- **12:** event ≠ trend; frame-paired ≠ context.
- **14:** the Comparison Player refuses single years unless they are labelled "example years".
- **15:** model ≠ measurement: a "Model estimate" badge and a distinct timbre family.
- **16:** a stale product shows its age and plays the "recorded" texture.

### 1.3 Parts 6–7: the ideas used here

**Part 6 IDs:**
| Group | Ideas |
|---|---|
| A, B | A2 captions; B3 normal tone; B5 cold wake; B6 Fire Geiger; B7 haze; B8 FWI chord |
| C | C1 proof in unison; C5 freshness as clarity |
| D | D4 two futures; D5 sea level + silent gauge |
| E | E2 three chords of Aug 2024; E3 river notes; E4 thunder score; E5 three air layers; E6 sweet-water plume; E7 night-light rests |
| F, G | F1 NASA × JAXA; F2 SST triad; F3 coral; G1 IMERG audification; G2 quake |
| I, X | I4 music-box year; X1 live events; X2 satellite cues |

**Part 7 scenes:** 3D-2, 3, 5, 8, 9, 10, 13, 14, 15, 18, 19, 20, 21, 23, 24, 25 and 26, plus updates to Pack 1. 3D-16 (AR) and 3D-22 (population) are stretch goals.

**Design law:** 3D never moves a value. It never encodes data in perspective size or in loudness by distance. Every scene has a flat fallback and full keyboard control.

### 1.4 Part 13: honesty and wording

- §13.1 rules 1–12 apply to every voice. The labels are frame-paired vs context, measurement vs model, and the agency badge.
- §13.2 sets the exact wording: "Model estimate", "Latest available: [age]", "No satellite in orbit", "The monitor went quiet (4 March 2025)", "One event, not a trend" and "Partly independent".
  - Numbers inside those templates are filled from JSON only.
- §13.3 gives the credit lines, used verbatim per source.

### 1.5 Appendices

- **Appendix A:** the latest result of every test. These are the acceptance references in the inventory's "Book check" column.
- **Appendix C:** the key names, plus the reference suite's secret masking (`redact()`). Every pipeline log line goes through it.

### 1.6 The reference suite and the existing app

**`bloop_data_tests.py` is importable as a library.** Its only import-time side effect is creating `BLOOP_OUT`, which I redirect into `pipeline/work/ref/`.

It already contains, tested:
- the access helpers: `earthdata()`, `cmr_latest`, `ed_search`, `open_remote`, `titiler_point`, `stac_points`, `geoscf_store`, `rasterio_point`, `local_points`;
- the frame helpers: `invert_colours`, `find_ticks`, `robinson_px`, `fwi_classify`;
- the network and safety helpers: `secret`, `redact` and the Origin-aware `http`.

Pipeline steps import these through one adapter (`pipeline/core/ref.py`) instead of copying them. Where a test hard-codes a short window (for example K10's 10 days), the product script passes a longer window to the same helpers.

**The existing app:**
- **Contract:** `data-contract.ts` (762 lines, sections 1–14).
- **Mapping:** `mapping.json` v0.1.0 has 13 voices; the shared GRACE range is already in it.
- **Records:** `RECORD_PLUGINS` expects a **global grid** for each record.
- **Scenes:** `FUTURE_SCENE_SPECS` holds 11 `null` components.
- **Truth panel:** the ocean section shows "Verification being updated" (**no 0.31 °C number in the app yet**).

---

## 2. Local state found

### 2.1 Uncommitted changes to `public/data` (yours; I haven't touched or committed them)

These 154 files are a pipeline re-run from **28 Sep, ~13:57 UTC**. It doesn't refresh the data to today.

| What | Change |
|---|---|
| `latest/rain.*` (bin, png, phase, json) | Frame moves 27 Sep 02:30 → **28 Sep 08:30 UTC** (still **~30 days old**). **The `latest_check` block is deleted** from `rain.json` |
| `latest/sst.json` | Same frame (25 Sep). Only `generated_utc` changes. **The `latest_check` block (60 points, median 0.319 °C) is deleted** |
| `sequence/` (48 × json/png/u8.gz + `index.json`) | Window shifted 5 h later (starts 26 Sep 08:00 instead of 03:00) |
| `context/ensemble_bd.json`, `context/globe_duet.json`, `demo/*.json` | `generated_utc` only; values identical |
| `.gitignore` | One blank line added |

**Why it matters:**
- `src/lib/truth.ts` and `src/lib/whisper.ts` read `latest_check`. Committing these files would make the rain Truth text fall back to the original verification.
- The data would still fail A2 (frames ≤ 2 days old).

**My recommendation:** discard them (`git restore -- public/data .gitignore`) and regenerate fresh data in phase 1. **I'm waiting for your answer (Q1).**

### 2.2 Untracked files

- `docs/BLOOP_MASTER_BUILD_BOOK (1).md`: the book has this name, not `docs/BLOOP_MASTER_BUILD_BOOK.md`.
- `pipeline/reference/bloop_data_tests.py`: the pipeline will import it, so GitHub Actions needs it in git.
- `docs/IDEA LIST.MD` and `package-lock.json`: the project uses `bun.lock`, so I'll leave both alone.

Q2 asks about committing the book and the suite.

---

## 3. Keys checklist (Appendix C names)

All 8 names are present in `.env.local`. I checked names only; values are never read or printed.

| Key | `.env.local` | Vercel env | GitHub Actions secret | Used by |
|---|---|---|---|---|
| `EARTHDATA_USERNAME` | ✅ | not needed | **add** | All earthaccess products |
| `EARTHDATA_PASSWORD` | ✅ | not needed | **add** | Same |
| `FIRMS_MAP_KEY` | ✅ | not needed | **add** | FIRMS (pipeline only) |
| `OPENAQ_API_KEY` | ✅ | **add** (for `/api/air/dhaka`) | **add** (daily backfill) | Ground PM2.5 |
| `NASA_API_KEY` (optional) | ✅ | not needed | optional | DONKI only (optional, not planned). The book (§2.3 #5) says to **regenerate it**: it appeared in run-3 output |
| `WAQI_TOKEN` (optional) | ✅ | not needed | not needed | Not planned |
| `XC_API_KEY` (optional) | ✅ | not needed | not needed | Not planned (Doel recordings are NC-SA) |
| `FREESOUND_TOKEN` (optional) | ✅ | not needed | not needed | Not planned |

Also:
- **The Earthdata account must approve "NASA GESDISC DATA ARCHIVE"** (MERRA-2, IMERG). Phase 1 checks this with E3 and stops if access is denied.
- No key ever gets a `NEXT_PUBLIC_` prefix or reaches client code.
- Phase-end checks grep the client bundle for key patterns.

---

## 4. Architecture

### 4.1 Pipeline layout (additive; existing scripts are unchanged)

```
pipeline/
  core/            ref.py (imports the reference suite; BLOOP_OUT → work/ref), places.py (points/boxes from the suite's
                   constants), header.py (common JSON header + writer + freshness record), grids.py (int16/u8
                   equirect grids, Robinson → equirect), log.py (every print goes through redact())
  products/        one module per output file, grouped by EIC area (ocean/, air/, bio/, fire/, ghg/, energy/,
                   disasters/, water/, agri/, other/); registry.py lists id, module, cadence, outputs, freshness
                   limit, badge, credit
  checks/          one spotcheck module per area (shape spec + invariants + book comparison); spotcheck.py calls
                   checks.run(check) at the end (additive)
  manual_inputs/   README.md + git-ignored manual files (ACAG, Embassy, FFWC stub)
  build_freshness.py
```

**`run_all.py` gains `--cadence daily|weekly|static|all`.**
- Products run as **optional** steps: on failure they warn, keep the last good file and never block the core SST/rain build.
- `spotcheck.py` stays required.

**Spotcheck severity:**
- **FAIL:** shape or contract mismatch; a grid that doesn't round-trip; NaN or out-of-physical-range values; a missing source time; any comparison not on one scale.
- **INFO:** the book's acceptance value next to the fresh value. Differences are reported, never forced.
- **STOP-and-ask:** the "fails badly" thresholds, for example duet r < 0.5, no SWOT reach ≥ 3 m, 5176 sign agreement < 80%, or OPERA S1 not rising.

### 4.2 Live routes (Next.js route handlers under `src/app/api/`)

Before writing them I'll read the installed Next 16 guides (`node_modules/next/dist/docs/`: route handlers, caching).

| Route | Upstream | Key (server-side) | `s-maxage` | Fallback |
|---|---|---|---|---|
| `/api/air/dhaka` | OpenAQ v3 `/locations` + `/latest` (median of stations ≤ 6 h old, n reported) + CAMS (Open-Meteo) + the latest GEOS-CF v2 from `context/geoscf_bd.json` | `OPENAQ_API_KEY` | 3600 | `context/air_dhaka.json` latest hour + `age` |
| `/api/events` | EONET v3 + USGS GeoJSON, BD/Bay box | — | 600 | `live/events.json` + `age` |
| `/api/sats` | CelesTrak GP (10 satellites) | — | 7200; any non-200 → stop, serve the snapshot | `live/sats.json` + `age` |
| `/api/spaceweather` | SWPC `json/rtsw/rtsw_wind_1m.json` (+ Kp) | — | 300 | `live/spaceweather.json` + `age` |

- Every response carries `source_time_utc`, `fetched_utc` and `age_s`.
- One shared helper (`src/lib/server/upstream.ts`) does the timeout, the fallback and the redaction.
- Vercel functions have no durable disk, so "last good cached JSON" = the snapshot the daily cron commits, plus the CDN copy (`stale-while-revalidate`).

### 4.3 GitHub Actions

| Workflow | Schedule | Runs |
|---|---|---|
| `data-daily.yml` | Daily 02:00 UTC | Frames: 5101, the 4285 sequence, 5176, 5315 (+ archive), 5584, 5113. Truth tests (`verify_latest`, truth pairs, three-way). Products: FIRMS, SMAP SSS/SM, VJ146, CRW, the SST triad, the duet extension, Mauna Loa, sea ice, air backfill, GEOS-CF, GloFAS, snow, AERONET, CelesTrak/EONET/SWPC snapshots. Then `build_freshness.py` → `spotcheck.py` |
| `data-weekly.yml` | Mon 03:00 UTC | GRACE, SWOT reaches, CERES, NASA-SSH GMSL, NDVI, ECOSTRESS ET, MERRA-2, IBTrACS, GBIF, VEDA/GHG points, chlorophyll |
| `data-static.yml` | `workflow_dispatch` | GEDI, CMS, ICESat-2, GPW, LIS/OTD, cold wakes, OPERA Aug 2024, HydroShare wells, PSMSL, NEX-GDDP, the EarthScope WAV, ACAG/Embassy (if the manual files exist), POWER × ERA5 |

**Each run:**
- commits `public/data` (and nothing else) **only if `spotcheck.py` passes**;
- otherwise opens an issue with the redacted log and keeps the last good data;
- uses `contents: write` and `issues: write`, with secrets from the repo settings.

**Constraint:** GitHub runs `schedule` and `workflow_dispatch` workflows **only from the default branch (`main`)**. On `feat/data-all` they can't fire. I'll test the same commands locally, and the crons start when you merge (Q3).

### 4.4 Freshness and badges

**`meta/freshness.json`** holds one entry per product:
- the times: `source_time_utc` and `generated_utc`;
- the freshness rules: `limit_days` and `cadence`;
- the badges: `badge.agency` (NASA / JAXA / NOAA / Copernicus / ground / other), `badge.kind` (measurement / model / inventory) and `badge.pairing` (frame-paired / context);
- `shares_inputs_with` and `credit`.

The app reads this one file for:
- the data-age badge ("Latest available: [age]");
- the badges on every voice and record;
- the credits drawer, so credit lines live in one place: the pipeline JSON.

A product past `limit_days` plays the "recorded" texture (guardrail 16).

**Static baselines** (GEDI, CMS, climatologies, historic events) show their period ("2000-era baseline", "1995–2014") instead of an age, and never claim to be current.

### 4.5 Size budget

| Area | Now | After (estimate) |
|---|---|---|
| `global/` | 13.6 MB | 13.6 MB |
| `sequence/` | 10.6 MB | 10.6 MB |
| `latest/` | 7.0 MB | 10.1 MB (+sst_anom 1.05, sst_dt 0.52, fwi_class 0.52, landslide 0.52, fires.webp ~0.3, sst_anom.webp ~0.2) |
| `archive/fwi/` | — | ~2.4 MB (rolling 60 days × ~40 KB gz class grids) |
| `context/` | 1.2 MB | ~2.5 MB (≈40 new small JSONs; per-row sizes below) |
| `truth/`, `meta/`, `live/` | 0.2 MB | ~0.4 MB |
| `audio/` | — | ~0.5 MB (quake WAV ~0.3 MB, IMERG audification ~0.2 MB) |
| **Total** | **32.9 MB** | **≈ 40 MB** (< 60 MB budget; spotcheck enforces it) |

**Repo growth (a risk, not a budget breach).** Daily commits rewrite ~15–20 MB of binaries (rain grids, sequence, SST, the new grids), so git history grows about 0.5 GB a month. It's fine through the hackathon. After that, move the sequence to a data branch or Git LFS (roadmap).

---

## 5. Inventory: one row per Part 4 dataset

Column key:
- **Include?:** Yes / No, with the book's reason.
- **Creds:** ED = Earthdata Login.
- **Book check:** the acceptance value, with the tolerance it is compared at. "Report" = a live snapshot, compared for plausibility only.
- **Size:** of the output under `public/data`.

### 5.1 SVS / EIC frames (§4.2)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| SVS 5101 SST | **Yes** (core; existing) | SVS frames [B5101] (`fetch_latest`, `convert_sst`, `verify_latest`) | — | — | `latest/sst.bin/.json/.webp` (existing) | `SstMetadata` §1 | ocean voice, C1 frame tone; Ocean record; terrain, ghost, delta | Median 0.31 °C (60 pts); falsifier > 0.1 °C off | daily | 1.3 MB |
| SVS 4285 IMERG rain | **Yes** (core; existing) | SVS frames [B4285] | — | — | `latest/rain.*`, `sequence/*` (existing) | `RainMetadata`, `SequenceIndex` §1–2 | rain/snow; Rain record; delta/terrain rain; C1 (rain) | ≈27% (median abs log10 0.103), rain/no-rain 100%, phase 100% | daily | 15.5 MB |
| SVS 5176 SST anomaly | **Yes** | SVS EXR + tick-calibrated colorbar (−4…+4 °C; ticks x 127…896, 96.1 px/°C) [C5176] | — | — | `latest/sst_anom.bin` (Int16, 0.001 °C, 1024×512) + `.json` + `.webp` | `SstAnomalyMetadata` §15 | normal tone B3; coral F3; Ocean record (anomaly view); terrain toggle | Sign ≥ 90% (book 91%, n 1,101), ρ 0.79 ± 0.05, offset −0.31 ± 0.15 °C, ticks 9/9 | daily | 1.25 MB |
| SVS 5113 VIIRS fires | **Yes, display only** (moderate ρ 0.60–0.62: no inversion claim) | SVS [C5113] | — | — | `latest/fires.webp` + `fires.json` (frame time, credit) | `DisplayFrameMeta` §15 | Wildfires record texture | — (re-run C5113 after 2 Nov: does it keep updating on NOAA-21?) | daily | ~0.3 MB |
| SVS 5315 FWI (Robinson) | **Yes** | SVS PNG → `fwi_classify` → Robinson-to-equirect [C5315] | — | — | `latest/fwi_class.bin` (u8 0–6) + `.json`; `archive/fwi/FWI_YYYYMMDD.u8.gz`; `context/fwi_archive_index.json` | `FwiClassMetadata`, `FwiArchiveIndex` §15 | FWI chord B8; Wildfires record; 3D-23 pins | 6 classes distinct; ≥ 93% of coloured px decode | daily (**the archive starts in phase 1**: no SVS archive exists) | 0.5 MB + 2.4 MB |
| SVS 5584 landslide exposure | **Yes** | SVS [C5584] | — | — | `latest/landslide_class.bin` (u8 0–3) + `.json` | `LandslideClassMetadata` §15 | threshold rumble; Disasters record | 3 classes; age ≤ 2 d | daily | 0.5 MB |
| SVS 4950 GEDI render | **Backdrop only** (inversion excluded: 16:9 renders) | SVS | — | — | `textures/scenes/gedi-backdrop.webp` (display) | — | 3D-9 backdrop (credited) | — | static | ~0.2 MB (textures, not data) |
| SVS 5099 polar sea ice | No (values come from NSIDC v4; no planned display) | — | — | — | — | — | — | — | — | — |
| SVS 5120 GOES | No (Bangladesh out of view) | — | — | — | — | — | — | — | — | — |
| SVS 5147 / 5149 / 5150 GEOS-FP | No (same model family; 5150 is MP4 only; no consumer) | — | — | — | — | — | — | — | — | — |
| SVS 5148 wind | No (excluded: ρ 0.40) | — | — | — | — | — | — | — | — | — |
| SVS 5151–5154 GEOS-CF frames | No (excluded: 137 d stale, 1% colour match) | — | — | — | — | — | — | — | — | — |
| SVS 5544 NDVI | No (excluded: 135 d stale) | — | — | — | — | — | — | — | — | — |
| SVS 4897 seasonal IMERG | No (checklist pending; no consumer) | — | — | — | — | — | — | — | — | — |
| SVS 5046 / 5064 | No (excluded: 1,305 d stale) | — | — | — | — | — | — | — | — | — |
| SVS 5067 fleet | No as data (the orrery uses CelesTrak; 5067 is cited as the visual reference) | — | — | — | — | — | — | — | — | — |
| SVS 5072 / 5577 / 5011 / 5313 / 3912 / 5425 / 5196 / 5533 / 5600 | No (charts or beauty pieces, not pairable; no consumer in scope) | — | — | — | — | — | — | — | — | — |

### 5.2 Ocean and sea level (§4.3.1)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| MUR SST v4.1 (`analysed_sst`, `dt_1km_data`) | **Yes** | earthaccess PO.DAAC [E1] (the same download `verify_latest` uses; block-reduced to 1024×512) | ED | — | `latest/sst_dt.bin` (u8 hours, 255 = none) + `.json`; MUR tone in `truth/sst_pairs.json` | `SstDtMetadata`, `TruthPairsFile` §15 | clarity C5 (reverb tail); C1 file tone; terrain clarity | `dt_1km_data` present; median 0.31 ± 0.1 °C | daily | 0.52 MB |
| Truth pairs (SST 60 + rain 150) | **Yes** (proof in unison) | Existing truth tests (`verify_latest` points) | ED | — | `truth/sst_pairs.json`, `truth/rain_pairs.json` | `TruthPairsFile` §15 | C1 voice (U key, Truth button); 3D-18 helix; Ocean record back | Median \|err\| = the panel figure exactly | daily | ~40 KB |
| GIBS MUR25 colormap (three-way) | **Yes** | GIBS WMTS + colormap `sourceValue` [G7] | — | — | `truth/threeway.json` | `ThreeWayFile` §15 | Truth panel; Ocean record back | GIBS decodes 100% of tile pixels | daily | ~25 KB |
| NOAA CRW SSTA + DHW | **Yes** | ERDDAP [F2, C5176] | — | — | `context/coral_stmartins.json` (+ the CRW check inside `sst_anom.json`) | `CoralFile` §15 | coral tremolo F3; Ocean record; 3D-19 | DHW 24 Oct 3.23–3.99 °C-weeks (68/81 valid px) | daily | ~30 KB |
| OSTIA | **Yes** (triad) | PO.DAAC [E14, D36] | ED | — | `context/sst_triad.json` | `SstTriadFile` §15 | SST triad duet (F2) | 30.10 vs MUR 29.76 at the test point (report spreads) | daily | ~20 KB (whole triad) |
| NOAA OISST v2.1 | **Yes** (triad) | ERDDAP [F3] | — | — | same | same | same | 29.98 °C (10 Oct); ~2-week lag (triad date = latest common day) | daily | (in triad) |
| AMSR2 REMSS L3U | **Yes** (triad; most independent) | PO.DAAC [D35, E14] | ED | — | same; **skin vs foundation flagged** | same | same | 31.39 (17 Oct) vs MUR 30.18 (not like-for-like) | daily | (in triad) |
| JAXA SGLI SST | No (catalogue resolution conflict; no values tested) | — | — | — | — | — | — | — | — | — |
| NASA-SSH GMSL | **Yes** | PO.DAAC [K1]; **units and reference period read from the file header** (stop if absent) | ED | — | `context/sealevel.json` | `SeaLevelFile` §15 | sea-level tone + annual vibrato D5; Sea level record; 3D-14 | Last value 11.58 at 2026.78 (units TBC) | weekly | ~40 KB |
| PSMSL gauges (Hiron Point, Cox's Bazar, Chittagong) | **Yes** | PSMSL [F12] | — | — | same file (`gauges`) | same | gauge voice (silent after the last year); 3D-14 | Ends 2003 / 2000 / 1992 (exact) | static | (in file) |
| SMAP SSS (JPL 8-day V5) | **Yes** | PO.DAAC [E4] | ED | — | `context/salinity_bay.json` | `SalinityFile` §15 | salinity voice (fresher → higher, design choice); Ocean record card; 3D-15 | 15.8 vs 21.8 psu ± 0.1 | daily | ~25 KB |
| PACE OCI chlorophyll (8-day) | **Yes** | OB.DAAC [K3] (latitude-order fix) | ED | — | `context/chlorophyll_bay.json` | `ChlorophyllFile` §15 | 3D-8 ocean shell; Ocean record card | Report (the R4 value isn't in the book); Case-2 caveat shown | daily | ~10 KB |
| CYGNSS L2 | No (no consumer; number of active satellites unknown) | — | — | — | — | — | — | — | — | — |
| Cold wakes (MUR + IBTrACS): Amphan + one recent storm in the SVS archive | **Yes** | earthaccess + NCEI [K11] | ED | — | `context/cold_wake_amphan.json`, `context/cold_wake_<storm>.json` (track pts, before/after, Δ, windows) | `ColdWakeFile` §15 | SST voice drop (B5); Disasters record; 3D-2 | Amphan mean −2.79 ± 0.05, strongest −3.92 ± 0.05 (12 pts); recent storm: report | static | ~20 KB each |
| IBTrACS v04r01 NI | **Yes** | NCEI CSV [F11] | — | — | `context/storms_ni.json` (events, landfall dates, "recent storms provisional") | `StormsFile` §15 | 3D-23 pins; 3D-2 track; Disasters record | Contains Dana, Fengal, Montha, Ditwah, Senyar… | weekly | ~60 KB |
| EONET | **Yes** (live) | `/api/events` [G3, K7] | — | — | `live/events.json` snapshot | `LiveEventsResponse` §15 | event chimes (X1); Disasters record | — (Arnab's position is checked before use) | 10 min | ~20 KB |

### 5.3 Air quality (§4.3.2)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| OpenAQ v3 ground PM2.5 | **Yes** (measurement, "ground") | `/api/air/dhaka` + daily hourly backfill (`/sensors/{id}/hours`) [K2] | `OPENAQ_API_KEY` (server) | — | `context/air_dhaka.json` (rolling 14-day hourly: ground median + n, CAMS, GEOS-CF, ratios) | `AirDhakaFile`, `AirNowResponse` §15 | air voice (ground layer B7); Air record; ground-vs-models duet; 3D-21/25 | 72.2 µg/m³, 11 stations ≤ 6 h (snapshot: report) | live 1 h / daily file | ~80 KB |
| CAMS PM2.5 (Open-Meteo) | **Yes** (**Model estimate · Copernicus**; assimilates MODIS AOD) | Same route + backfill [F5] | — | — | same | same | air model ring | 127.1 (snapshot: report) | live 1 h | (in file) |
| GEOS-CF v2 analysis + 5-day forecast (`PM25_RH35`) | **Yes** (**Model estimate · NASA**; v2 only) | Public Zarr [G2] | — | — | `context/geoscf_bd.json` (Dhaka, Chattogram, Khulna) | `GeosCfFile` §15 | air model ring; 3D-21/25 | 50.4 (snapshot: report) | daily | ~40 KB |
| MERRA-2 PM2.5 (GES DISC formula) | **Yes** (**Model estimate**; no nitrate; biased low) | earthaccess GES DISC [E3]: monthly `M2TMNXAER` 2000→ + daily `M2T1NXAER` for the latest ~90 d (a daily 2000→ pull would be ~9,500 files) | ED + GES DISC approval | — | `context/merra2_pm25_dhaka.json` | `Merra2Pm25File` §15 | E5 layer (a); 3D-25 month fog | 16.1 (26 Aug) / 22.8 (27 Aug) ± 0.1 | weekly | ~40 KB |
| ACAG monthly PM2.5 | **Yes, if the manual file exists** (CC BY 4.0) | Manual [E18] | — | **WUSTL Box file** (see `manual_inputs/README.md`) | `context/acag_dhaka.json` | `AcagFile` §15 | E5 slow bass | Skips with a clear message if missing | static | ~15 KB |
| US Embassy Dhaka hourly 2016 – 4 Mar 2025 | **Yes, if the manual file exists** | Manual [F16] | — | **EPA Excel files** | `context/embassy_dhaka.json` (daily means + halt date) | `EmbassyFile` §15 | E5 ground clicks → "The monitor went quiet (4 March 2025)" | Halt date 4 Mar 2025 voiced | static | ~40 KB |
| AERONET Dhaka University + Bhola | **Yes** | AERONET web service [E11] | — | — | `context/aeronet_bd.json` | `AeronetFile` §15 | Air record card; 3D-8 air shell | Both active (last ≤ 2 d) | daily | ~30 KB |
| VEDA collections with BD values (NO2 etc.) | **Yes** | TiTiler point [K16] | — | — | `context/veda_points.json` | `VedaPointsFile` §15 | 3D-8 air shell (NO2); Air record card | 6/8 collections return values | weekly | ~20 KB |
| MAIAC AOD | No (Terra/Aqua ending; the haze voice uses PM2.5) | — | — | — | — | — | — | — | — | — |
| TROPOMI NO2 | No (~10-day archive; VEDA covers NO2) | — | — | — | — | — | — | — | — | — |
| OMI AOD (GIBS) | No (Aura ending; no consumer) | — | — | — | — | — | — | — | — | — |
| WAQI | No (optional mirror; OpenAQ covers DoE) | — | — | — | — | — | — | — | — | — |
| SVS 5151–5154 | No (excluded) | — | — | — | — | — | — | — | — | — |
| TEMPO | No (doesn't cover Bangladesh; contrast line in text only) | — | — | — | — | — | — | — | — | — |

### 5.4 Biodiversity (§4.3.3)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| GEDI L3 canopy height + L4B biomass | **Yes** | ORNL earthaccess [L2] | ED | — | `context/forest_points.json` | `ForestPointsFile` §15 | forest organ-pipe voice; Biodiversity record; 3D-9; 3D-8 land shell | Sundarbans 6.0 / 9.9 / 2.8, Madhupur 7.1, Lawachara 17.2, Dhaka 17.0 m (± 0.1; Dhaka = "buildings, not forest") | static | ~15 KB |
| NASA CMS Bangladesh mangrove (hmax95 + biomass) | **Yes** (2000-era baseline) | ORNL [L1] | ED | — | same | same | same | Centre 10.2 m, 67 Mg/ha (± 0.1) | static | (in file) |
| ICESat-2 ATL08 | **Yes** (the independent lidar) | NSIDC earthaccess [L3]; extend beyond n = 2 | ED | — | same | same | same | Median 7.9 m (n = 2); report the new n | static | (in file) |
| Three-lidar agreement points | **Yes** (computed) | From the three rows above | — | — | `context/forest_agreement.json` (points within 3 m; spread) | `ForestAgreementFile` §15 | 3D-9 "trees" | Report how many qualify; if none, say so | static | ~5 KB |
| CMS global mangrove | No (the Bangladesh map is used) | — | — | — | — | — | — | — | — | — |
| GEDI L2A | No (footprint check only) | — | — | — | — | — | — | — | — | — |
| GBIF Doel (non-NASA) | **Yes** ("observations, not presence") | GBIF API [K3] | — | — | `context/gbif_doel.json` (monthly counts) | `GbifFile` §15 | Biodiversity record card | 16,679 records (≥; the count grows); monthly profile | weekly | ~3 KB |
| VIIRS SNPP EVI (GIBS) | No (S-NPP ends 2 Nov) | — | — | — | — | — | — | — | — | — |
| xeno-canto v3 | No (all 4 recordings NC-SA; team recordings preferred) | — | — | — | — | — | — | — | — | — |

### 5.5 Wildfires (§4.3.4)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| FIRMS NRT `VIIRS_NOAA21_NRT` / `VIIRS_NOAA20_NRT` / `MODIS_NRT` | **Yes** (S-NPP switch) | FIRMS API [E12, K4] (national + CHT + Punjab boxes) | `FIRMS_MAP_KEY` | — | `context/firms.json`: **additive** `daily` block (existing `cases` untouched) | `FirmsDailyBlock` §15 (`FirmsSource` widened additively) | Fire Geiger B6 (Poisson rate = count; FRP → filter); Wildfires record | National 10-day count (Oct = off-season; report) | daily | +~40 KB |
| FIRMS history (MODIS_SP 2003 vs 2023) | **Yes** (existing; "example years") | [P2] | `FIRMS_MAP_KEY` | — | `context/firms.json` `cases` (existing) | `FirmsContextFile` §6 | Comparison Player (MODIS vs MODIS only) | CHT 4,954 / 4,033; Punjab 11,879 / 9,850 (exact) | static | existing |
| VNP14IMG_NRT | No (S-NPP) | — | — | — | — | — | — | — | — | — |
| GIBS fire layers | No (none decoded) | — | — | — | — | — | — | — | — | — |

### 5.6 Greenhouse gases (§4.3.5)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| NOAA GML Mauna Loa CO2 | **Yes** (in situ) | CSV [E15] | — | — | `context/co2.json` (daily, last 2 years + monthly 1958→) | `Co2File` §15 | CO2 pedal; GHG record; tunnel pedal (overlapping years only, said aloud) | 426.96 ppm on 24 Oct 2026 (exact) | daily | ~30 KB |
| OCO-2 XCO2 Lite | **Status only** ("lagged ~90 d; termination proposed") | CMR [D23] | — | — | `meta/freshness.json` entry | `FreshnessEntry` §15 | GHG record note; no voice | Newest ~89–90 d | daily | — |
| U.S. GHG Center collections with BD values | **Yes** (model/inventory badge) | TiTiler [K5] | — | — | `context/ghg_points.json` | `GhgPointsFile` §15 | GHG record card; 3D-8 | 3/6 collections | weekly | ~10 KB |
| EMIT CH4 | No (newest over BD Jan 2023; "never say methane plume") | — | — | — | — | — | — | — | — | — |
| SVS 5196 / GIBS GHG | No | — | — | — | — | — | — | — | — | — |

### 5.7 Energy (§4.3.6)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| Black Marble **VJ146A2** (NOAA-20) | **Yes** (replaces VNP46A2) | LAADS earthaccess [E5 → VJ146] (Dhaka / Chattogram / Khulna, 5×5 px median; cloud-masked days flagged) | ED | — | `context/nightlights.json` (daily + monthly) | `NightLightsFile` §15 | light voice (shimmering voice count); Energy record; 3D-10 | Dhaka ≈ 25–32 nW·cm⁻²·sr⁻¹ (S-NPP basis; NOAA-20 may differ: report) | daily (8-d lag) | ~40 KB |
| VNP46A2 / VNP46A1 | No (S-NPP) | — | — | — | — | — | — | — | — | — |
| Remal blackout (K12) | No claim ("inconclusive"; never say "Remal blackout") | — | — | — | — | — | — | — | — | — |
| CERES SYN1deg daily | **Yes** | ASDC, HDF4 via pyhdf [L6] | ED | — | `context/energy_dhaka.json` | `EnergyFile` §15 | energy two-tone beat; Energy record; 3D-8 energy shell | 190.6 / 168.6 / 198.0 W/m² on 31 Jul 2026 (± 0.1) | weekly (~86-d lag) | ~30 KB |
| NASA POWER solar vs ERA5 | **Yes** (labelled solar voice only; POWER stays excluded for rain/heat) | POWER API + Open-Meteo ERA5 [K6] | — | — | `context/solar_dhaka.json` | `SolarFile` §15 | solar voice; Energy record card | r 0.85 ± 0.02; −0.44 ± 0.02 kWh/m²/day (2024) | static | ~20 KB |
| SVS 5313 | No | — | — | — | — | — | — | — | — | — |

### 5.8 Disasters (§4.3.7)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| OPERA DSWx-S1, Aug 2024 (one MGRS tile, S1 only, 3 dates) | **Yes** (fixes the mixed-sensor issue) | earthaccess [E7] | ED | — | `context/opera_aug2024.json` | `OperaFloodFile` §15 | E2 three chords; Disasters record; 3D-23 pins | Must rise 5 May → 9 Aug → 21 Aug, or report (STOP-and-ask) | static | ~5 KB |
| OPERA DSWx-HLS / DIST-ALERT | No (mixing sensors is exactly the bug; DIST not in scope) | — | — | — | — | — | — | — | — | — |
| LANCE MCDWD flood | No (no consumer in scope) | — | — | — | — | — | — | — | — | — |
| LHASA v2 at GES DISC | No (excluded: ended 2021) | — | — | — | — | — | — | — | — | — |
| USGS earthquakes | **Yes** (live) | `/api/events` [G1] | — | — | `live/events.json` | `LiveEventsResponse` §15 | percussive layer X1; Disasters record | — | 10 min | (shared) |
| EarthScope waveform → WAV (Mandalay M7.7 at IU.CHTO) | **Yes** (credit EarthScope/NSF) | FDSN + ObsPy [F13] | — | — | `audio/quake_mandalay.wav` + `.json` | `AudioClipMeta` §15 | G2 layer; Disasters record | File exists; 146,400 samples | static | ~0.3 MB |
| NISAR | No (provisional; ~6.6 GB per scene; roadmap) | — | — | — | — | — | — | — | — | — |
| Disasters Charter pages | No (illustration only) | — | — | — | — | — | — | — | — | — |
| Worldview snapshot, 21 Aug 2024 | Optional (display still on the OPERA pin) | Snapshots API [K14] | — | — | `textures/scenes/flood-20240821.jpg` | — | 3D-23 pin card | 200, JPEG | static | ~40 KB |

### 5.9 Water resources (§4.3.8)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| IMERG Late daily × JAXA GSMaP daily (Dhaka box) | **Yes** ("partly independent") | earthaccess + JAXA Earth API [K10]: extend to Jun–Sep (≥ 60 days) | ED | — | `context/duet_rain.json` (daily pairs + r + n) | `DuetRainFile` §15 | NASA × JAXA duet record (F1 chord width); 3D-26 | r 0.95 on 1–10 Jul 2025 (± 0.01), then report the new r; **STOP if r < 0.5** | daily | ~15 KB |
| IMERG half-hourly (G1 audification) | Optional (phase 5; overnight job) | earthaccess [E2]; Final to Sep 2025, then Late (switch labelled) | ED | — | `audio/imerg_dhaka_audification.wav` + `.json` | `AudioClipMeta` §15 | G1 heartbeat | FFT peak at 1/day | static | ~0.2 MB |
| GRACE/GRACE-FO mascons | **Yes** (existing) | Existing `build_context` | ED | — | `context/grace.json` (existing) | `GraceContextFile` §5 | water bass (shared −70…+35 cm); 3D-3 aquifer | Shared scale 9.4× (existing) | weekly | existing |
| HydroShare wells (CC BY 4.0) | **Yes** | HydroShare REST [K8] (manual fallback if REST is blocked) | — | Fallback only | `context/wells_grace.json` (monthly climatology + r) | `WellsGraceFile` §15 | aquifer breathing (3D-3); Water record | 1,268 stations; r +0.93 ± 0.02; 2.7 m vs 41 cm | static | ~10 KB |
| SWOT RiverSP Version D + Hydrocron (+ reach polylines) | **Yes** | earthaccess RiverSP granule (reach IDs **and reach polylines, which follow SWORD**) + Hydrocron WSE [E6]; 3–5 reaches on the Padma / Jamuna / **Meghna** with ≥ 3 m swing and ≥ 8 passes | ED (granule); Hydrocron none | — | `context/swot_reaches.json` (IDs, river, pass times, WSE, swing, simplified geometry) | `SwotReachesFile` §15 | river pluck voice; Water record; 3D-3 strings (incl. the Meghna) | 43499600141: 36 passes, 8.06 m; **STOP if no other reach reaches 3 m** | weekly | ~150 KB |
| SMAP soil moisture (`SPL3SMP_E`) | **Yes** | NSIDC earthaccess [K13]; skips 14 May–28 Jul 2026 | ED | — | `context/soil_bd.json` (monthly BD box) | `SoilFile` §15 | soil crackle ↔ legato; Water record | Feb 0.304 / Aug 0.427 m³/m³ (± 0.005) | daily (monthly roll-up) | ~10 KB |
| GloFAS discharge, Bahadurabad (model) | **Yes** (**Model estimate · Copernicus**) | Open-Meteo flood API [F5] | — | — | `context/glofas_bahadurabad.json` | `GlofasFile` §15 | river-flow model voice; Water record card | ≈ 2,343–2,414 m³/s (report) | daily | ~20 KB |
| VIIRS snow VJ210A1 (NOAA-20) | **Yes** | NSIDC earthaccess [D40] (Himalayan box) | ED | — | `context/snow_himalaya.json` | `SnowFile` §15 | Water record card | Fresh (≤ 1 d) | daily | ~10 KB |
| GPCP / GPCC | **Yes** (existing) | Existing | — | — | existing | §4 | "not wetter" | Existing F checks | static | existing |
| GLDAS Noah | No (86-d lag; no consumer) | — | — | — | — | — | — | — | — | — |
| FFWC (BWDB) | No (needs registration) → **stub + README** | — | `FFWC_TOKEN` (after registering) | Registration | — | — | — | — | — | — |
| data.gov.bd water levels | No (possibly stale; untested) | — | — | — | — | — | — | — | — | — |

### 5.10 Agriculture (§4.3.9)

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| MODIS NDVI MOD13Q1 (Bogura + 3 existing points) | **Yes** | ORNL MODIS web service [E10, K9] | — | — | `context/ndvi.json` (**additive** `series`) + `context/crop_bogura.json` | `NdviSeriesBlock`, `CropFile` §15 | vegetation pad; Agriculture record; 3D-20; 3D-8 land shell | Bogura peaks > 0.5 on 16 Oct 2025, 9 May 2026, 10 Jun 2026 | weekly | ~15 KB |
| VIIRS NDVI, NOAA-20 equivalent (not ORNL VIIRS, not VNP13A1) | **Yes, if CMR lists it** (likely `VJ113A1`; the book marks it [PV]) | earthaccess LP DAAC | ED | — | Same files (second series) | same | same | Report; if absent: MODIS only, and the app says so | weekly | (in files) |
| ECOSTRESS ET (`ECO_L3T_JET`) | **Yes** | LP DAAC earthaccess [L5] | ED | — | `context/et_bd.json` | `EtFile` §15 | Agriculture record card | Report (the R4 value isn't in the book); irregular overpasses | weekly | ~10 KB |
| ECOSTRESS LST / HLS / OPERA DIST / VIIRS EVI (GIBS) | No (not in scope; EVI is S-NPP) | — | — | — | — | — | — | — | — | — |

### 5.11 Human dimensions, cryosphere, Sun–Earth, long records (§4.3.10) + lightning

| Dataset | Include? | Route [test] | Creds | Manual | Output | Contract | Consumers | Book check | Cadence | Size |
|---|---|---|---|---|---|---|---|---|---|---|
| LIS/OTD diurnal climatology (`lolrdc`, 24 h × 12 months) | **Yes** | GHRC earthaccess [E16] | ED | — | `context/lightning_bd.json` | `LightningFile` §15 | thunder drum hits (no death bells); 3D-24 | Documented ~69% pre-monsoon share (± 5 pts) | static | ~5 KB |
| NSIDC Sea Ice Index v4 | **Yes** | HTTPS [F10] | — | — | `context/seaice.json` (daily, last 2 y + monthly 1979→; no v3→v4 splice) | `SeaIceFile` §15 | Sea level record card | Arctic 6.717 M km² on 17 Oct (± 0.005) | daily | ~40 KB |
| SWPC RTSW (`json/rtsw/*`, `proton_speed`) | **Yes** (live) | `/api/spaceweather` [G4] | — | — | `live/spaceweather.json` | `SpaceWeatherResponse` §15 | 3D-8 space-weather shell | Fields present | 5 min | ~5 KB |
| CelesTrak GP (Terra, Aqua, NOAA-20/21, GPM, SMAP, SWOT, PACE, Landsat 9; S-NPP) | **Yes** (live; stop on any non-200; ≤ 1 refresh / 2 h) | `/api/sats` [G6] | — | — | `live/sats.json` | `SatsResponse` §15 | 3D-5 orrery; X2 "who measured" cue | 10 element sets fetched | 2 h | ~10 KB |
| NEX-GDDP-CMIP6 (~5 models × SSP2-4.5 / SSP5-8.5) | **Yes** (**Model projections, not forecasts**) | NCSS point [E13] | — | — | `context/futures_dhaka.json` (days > 35 °C, 1995–2014 vs 2081–2100, spread) | `FuturesFile` §15 | two-futures chord width (D4); 3D-13 | ACCESS-CM2 SSP5-8.5 Apr–May 2081 mean 36.1 °C (± 0.1) | static | ~30 KB |
| SEDAC GPW v4.11 (2.5′) | Optional (phase 5) | earthaccess SEDAC [L7] | ED | — | `context/population.json` | `PopulationFile` §15 | 3D-22 (stretch) | 30′: Dhaka 7,920; Chattogram 4,018; Khulna 1,056 (exact); 2.5′ will be higher (report) | static | ~30 KB |
| geoBoundaries ADM2 | **Reuse** (already used for borders) | — | — | — | `public/geo` (existing) | — | district picker | 64 districts | static | existing |
| GISTEMP v4 | **Yes** (existing) | Existing | — | — | existing | §3 | heat voices; time tunnel | Existing F checks | static | existing |
| NASA DONKI | No (optional only; 503 three times) | — | — | — | — | — | — | — | — | — |
| Himawari-9 / GK2A | No (needs server decoding; P-Tree forbidden) | — | — | — | — | — | — | — | — | — |
| GIBS sea ice / NOAA GSOD | No (no consumer / supporting only) | — | — | — | — | — | — | — | — | — |

### 5.12 Natively audio sources (§4.4)

| Source | Include? | Reason |
|---|---|---|
| EarthScope miniSEED → WAV | **Yes** | See §5.8 |
| NOAA passive-acoustic bucket | No | No explicit licence; global framing only |
| xeno-canto v3 | No | NC-SA |
| Freesound | No | No CC0 match; team recordings preferred |
| Chandra/NASA sonification audio | No | No licence found: don't embed |
| EMFISIS | No | Not checked |
| Astronify / STRAUSS / Erie | No | Tools, not data |

### 5.13 `meta/freshness.json` and provisional limits

**Limits (days):**
| Group | Products and limits |
|---|---|
| Frames | sst 2, rain 2, sst_anom 5, fwi 2, landslide 2, fires 3 |
| Ocean | MUR dt 3, CRW 3, OSTIA 3, OISST 21, AMSR2 10, SSS 10, PACE 10, GMSL 30, sea ice 3 |
| Air | ground and CAMS 0.25, GEOS-CF 2, MERRA-2 45, AERONET 7 |
| Fire, GHG, energy | FIRMS 2, Mauna Loa 5, VJ146 14, CERES 120 |
| Water, agriculture | SWOT 21, duet 3, soil 5, GloFAS 2, snow 3, NDVI 30, ET 45 |
| Live | events 0.01, sats 0.25, SWPC 0.01 |

**Static baselines have no limit:** GEDI, CMS, ICESat-2, lightning, wells, cold wakes, OPERA, IBTrACS history, PSMSL, NEX-GDDP, POWER × ERA5 and GPW.

---

## 6. Voices (`mapping.json`, additive)

Rules:
- Each voice is added to `mapping.json` and its rule sentence is generated in the Mapping panel by `ruleText()`.
- Model voices use one **distinct timbre family** (a soft, filtered "model" register) and always show the **Model estimate** badge.
- Every voice shows its agency badge, measurement/model, frame-paired/context, data age and shared inputs.

| Voice id | Data | Rule (from §5.4) | Badge | Design choice? |
|---|---|---|---|---|
| `normalTone` | 5176 anomaly | Fixed reference (B3) at anomaly 0; the data voice bends by the anomaly; deviation is heard as interval + beating | NASA · measurement · frame-paired | No (passed C5176) |
| `clarity` | MUR `dt_1km_data` | Reverb tail length by hours since IR (C5); **not a low-pass** | NASA · measurement · context | Yes |
| `unison` | Truth pairs | Frame tone + file tone in one ear; beats = \|f1 − f2\|; **U key** + Truth-panel button | NASA · frame-paired | No (I1) |
| `coral` | CRW DHW | DHW → tremolo depth on the normal tone | NOAA · measurement · context | Yes |
| `air` | PM2.5 (ground / CAMS / GEOS-CF / MERRA-2) | Low-pass 8 kHz → 800 Hz exponential over one stated range; grain density as a redundant cue | ground / Copernicus / NASA; models badged | Yes |
| `river` | SWOT WSE | Karplus–Strong pluck; pitch on one shared metre scale for all reaches; one note per pass, no interpolation | NASA/CNES · measurement · context | Yes |
| `salinity` | SMAP SSS | Fresher → higher, purer (labelled design choice) | NASA · measurement · context | Yes |
| `soil` | SMAP SM | Dry → crackle; wet → legato | NASA · measurement · context | Yes |
| `forest` | Canopy height | Height → organ-pipe partial pitch; each source has its own timbre; agreement = unison | NASA (GEDI / CMS / ICESat-2) | Yes |
| `light` | VJ146 radiance | Number of shimmering voices; cloud-masked nights = rests labelled "clouds, not blackouts" | NASA/NOAA · measurement | Yes |
| `energy` | CERES in vs out | Two tones; their difference = beat rate | NASA · measurement | Yes |
| `fireGeiger` | FIRMS count | Poisson click rate = count; FRP → filter brightness, not loudness | NASA · measurement | No (B6 rule) |
| `fwiChord` | 5315 classes | 6 classes → 6 fixed harmonic states (open fifth → dense cluster) | NASA GISS · model forecast | Yes |
| `co2` | Mauna Loa | Slow pedal tone (ppm → pitch, own labelled scale) | NOAA · measurement | Yes |
| `seaLevel` + `gauge` | GMSL + PSMSL | Rising tone with annual vibrato; the gauge voice **goes silent after its last year** | NASA / PSMSL | Yes |
| `recorded` (earcon) | Freshness | Neutral "recorded" texture for stale products (guardrail 16), distinct from the `nodata` tick | — | — |

**Contract consequence.** New mapping kinds have no place in today's `VoiceMapping`:
- `classes` (FWI);
- `pair` (energy, unison);
- output params `cutoffHz`, `rate`, `voiceCount`, `tremoloDepth`, `reverbSec`.

They are defined in §15. `VoiceMapping` and the `output.param` union are **widened additively**, and existing members are unchanged.

**The shared-scale guardrail test** asserts:
- every comparison pair (records, duets, Comparison Player) resolves to one mapping entry;
- every model dataset maps to a model-family voice with a badge.

---

## 7. Records (Turntable carousel)

### 7.1 What changes

- `RECORD_PLUGINS` stays as it is for **grid records**: Ocean (sst + anomaly view), Rain, Wildfires (FWI class grid + fires image), Disasters (landslide grid).
- A second plugin kind, **place records**, is added for point/series data. It puts pins on the globe at the JSON's points, and the needle plays the pin it's on.
  - The voice is chosen from the pin's mapping entry.
  - Off a pin = honest silence, with the neutral tick if the cursor is inside a no-data gap.
- `COMING_RECORDS` gains `ghg` (additive), so the 11 area records are:
  Ocean, Rain, Sea level, Air, Biodiversity (`forests`), Wildfires (`fire`), GHG, Energy, Disasters, Water, Agriculture.

### 7.2 Duet records

- **NASA × JAXA rain:** `duet_rain.json`.
- **SST triad:** `sst_triad.json`.
- **Ground vs models (air):** `air_dhaka.json`.
- **Frame vs file (proof in unison):** `truth/*_pairs.json`.

### 7.3 Sleeve back

Built from JSON only:
- the dataset(s), agency badges, measurement/model, frame-paired/context;
- frame/data time and age (from `freshness.json`);
- the measured error or agreement (`verified` / `r` / `n`).

A record whose data is missing or failed its spotcheck stays a locked sleeve: no data, no sound. This is how today's "coming" records behave.

---

## 8. 3D scenes (Part 7)

All scenes share the same rendering, UI, motion and accessibility as Turntable v3 and Pack 1:
- `SceneShell`, `ChipFrame`, the dock, legend and disclosure;
- reduced motion = cuts, no particles;
- keyboard parity;
- `?debug=1` hooks for the quick checks.

Each scene moves from `FUTURE_SCENE_SPECS` into `SCENE_IDS`, with its own folder, matching the Pack-1 layout (`index.tsx`, `<Name>View.tsx`, `<id>-scene.ts`, `use-<id>-data.ts`, `use-<id>-sound.ts`).

| Scene | `future.ts` key | Data | Phase |
|---|---|---|---|
| 3D-2 Amphan's cold scar (+ a frame-paired recent storm if the archive covers it) | `amphanColdScar` | `cold_wake_*.json`, `storms_ni.json`, IMERG, MUR | 2 |
| 3D-3 delta update: SWOT strings + Meghna + wells breathing | `riverHeights` (update to `delta`) | `swot_reaches.json`, `wells_grace.json`, `grace.json` | 2 |
| 3D-26 NASA × JAXA twin globes | `twinGlobes` | `duet_rain.json` + frames | 2 |
| 3D-21 haze dome + 3D-25 snow globe | `snowGlobeHazeDome` | `/api/air/dhaka`, `geoscf_bd.json`, `merra2_pm25_dhaka.json` | 2 |
| 3D-18 proof helix (in the Truth panel + Ocean record) | new | `truth/*_pairs.json` | 1 (with C1), else 2 |
| Sound terrain update: absolute / anomaly toggle (normal tone) + clarity | (Pack 1) | `sst_anom.bin`, `sst_dt.bin` | 1 |
| 3D-9 forest of three lidars | `forestOfLidars` | `forest_points.json`, `forest_agreement.json` | 3 |
| 3D-10 light columns | `dhakaLightColumns` | `nightlights.json` | 3 |
| 3D-14 sea-level glass | `seaLevelGlass` | `sealevel.json` | 3 |
| 3D-19 coral glass ("alert" wording only if the CRW threshold source is added) | `coralGlass` | `coral_stmartins.json` | 3 |
| 3D-20 crop-heartbeat field | new | `crop_bogura.json` | 3 |
| 3D-15 sweet-water tongue | new | `salinity_bay.json` | 3 |
| 3D-23 music-box cylinder year | new | `storms_ni.json`, `opera_aug2024.json`, `fwi_archive_index.json` | 3 |
| Time tunnel: optional CO2 pedal (Mauna Loa years only, said aloud) | (Pack 1) | `co2.json` | 3 |
| 3D-24 morning thunder towers | `thunderTowers` | `lightning_bd.json` | 4 |
| 3D-5 satellite orrery (`satellite.js` SGP4, MIT; S-NPP shown as "science products ended 2 Nov 2026") | `satelliteOrrery` | `/api/sats` | 4 |
| 3D-13 two-futures fork | new | `futures_dhaka.json` | 4 |
| 3D-8 exploded Earth mixing desk | `mixingDesk` | many | 4 |
| 3D-16 AR / 3D-22 population | — | — | 5 (stretch) |

---

## 9. Phase order (prompt §6) with exit gates

**After every phase:**
- build, type-check and lint;
- `spotcheck.py`;
- the existing quick checks (Turntable and scene values = 2D `valueAt`);
- update `docs/data-integration-status.md`.

**Commits** are small and labelled: `pipeline:` (code), `data:` (only after spotcheck passes), `app:`, `scene:`.

### Phase 1: Foundation (target 28 Oct – 1 Nov). **Checkpoint: stop and report with screenshots**

1. **Pipeline scaffolding:**
   - `core/` (reference adapter, places, header, grids, redacted logging), `products/registry.py`, `checks/`, `run_all.py --cadence`;
   - `.gitignore` for raw formats;
   - `requirements.txt` (+ zarr, pyhdf, rasterio, obspy, jaxa-earth, scipy, requests, openpyxl).
2. **Core refresh:**
   - fresh 5101 / 4285 / sequence + `verify_latest` (restores `latest_check`);
   - A2 run against the local build (`BLOOP_APP=http://localhost:3000`); the deployed A2 can only pass after you merge and deploy;
   - Truth panel: the ocean number shown from `latest_check` (no typed number).
3. **Workflows:** `data-daily.yml` (+ weekly/static skeletons). Commit on pass, open an issue on fail.
4. **Freshness and badges:** `meta/freshness.json` + `build_freshness.py`; a data-age badge and source badges on every voice and record; the "recorded" texture.
5. **S-NPP → NOAA-20/21 (data):**
   - the FIRMS daily block (`VIIRS_NOAA21_NRT`/`VIIRS_NOAA20_NRT`);
   - VJ146A2 night lights;
   - the NOAA-20 NDVI short name confirmed in CMR.
6. **Truth pairs + C1:** `truth/sst_pairs.json`, `truth/rain_pairs.json`, `truth/threeway.json`; the `unison` voice; the U key + Truth-panel button; 3D-18 proof helix if time allows.
7. **5176 anomaly + normal tone:** `sst_anom.*`, `sst_dt.*`; the `normalTone` + `clarity` voices; the Sound terrain toggle.
8. **Start the FWI daily archive** (5315 class grids), plus 5584 and 5113 in the daily job. Their voices and records come in phase 3.
9. **Foundation UI:**
   - place-record plugin kind and sleeve back from JSON;
   - A2 caption engine (JSON fields only);
   - Help dialog: scene keys + U;
   - Bangla drafts marked "needs translator review".

### Phase 2: Water, Disasters, Air, Ocean extras (target 2 – 5 Nov). **Checkpoint: stop and report with screenshots + a 20-s recording per new scene**

- **Products:**
  | Area | Files |
  |---|---|
  | Water | `swot_reaches`, `duet_rain` (Jun–Sep), `wells_grace`, `soil_bd`, `glofas_bahadurabad` |
  | Disasters | `cold_wake_amphan` + a recent storm, `storms_ni`; `/api/events` |
  | Air | `/api/air/dhaka`, `air_dhaka` (daily backfill), `geoscf_bd`, `merra2_pm25_dhaka`, `aeronet_bd`, `veda_points`; `acag_dhaka` / `embassy_dhaka` if the manual files exist |
  | Ocean | `coral_stmartins`, `sst_triad`, `salinity_bay` |
- **Voices:** `air`, `river`, `soil`, `salinity`, `coral`; duet chord width; triad chord.
- **Records:** Water, Disasters, Air, Ocean extras; the duet records.
- **Comparison Player** (§5.8): sequence / duet / overlay; disclosure always visible; single-year guard.
- **Scenes:** 3D-2, 3D-3 update, 3D-26, 3D-21/25.

### Phase 3: Biodiversity, Wildfires, Energy, Sea level, Agriculture, GHG (target 5 – 8 Nov)

- **Products:**
  | Area | Files |
  |---|---|
  | Biodiversity | `forest_points`, `forest_agreement`, `gbif_doel` |
  | Wildfires | FIRMS daily, `fwi_class` + index, `fires.webp` |
  | Disasters | `landslide_class`, `opera_aug2024`, `quake_mandalay.wav` |
  | Energy | `nightlights`, `energy_dhaka`, `solar_dhaka` |
  | Sea level and ice | `sealevel`, `seaice` |
  | Ocean | `chlorophyll_bay` |
  | Agriculture | `ndvi` series, `crop_bogura`, `et_bd` |
  | GHG | `co2`, `ghg_points`, OCO-2 status |
  | Water | `snow_himalaya` |
- **Voices:** `forest`, `fireGeiger`, `fwiChord`, `light`, `energy`, `seaLevel` + `gauge`, `co2`.
- **Records:** Biodiversity, Wildfires, Energy, Sea level, Agriculture, GHG.
- **Scenes:** 3D-9, 3D-10, 3D-14, 3D-19, 3D-20, 3D-15, 3D-23; the tunnel CO2 pedal.

### Phase 4: Lightning, orrery, space weather, futures (target 8 – 9 Nov, before 18:00)

- **Products:** `lightning_bd`, `futures_dhaka`, `/api/sats`, `/api/spaceweather`.
- **Scenes:** 3D-24, 3D-5, 3D-13, 3D-8.

### Phase 5: Optional

G1 IMERG audification (an overnight background job: 12–14 h per cell-year, so I suggest starting it early, in the background), 3D-16 AR, 3D-22 population (GPW).

**Honest pacing note.** Phases 1–2 fit the window comfortably. Phases 3–4 depend on how many data pulls work first time. Anything unfinished stays a locked sleeve or a typed `future.ts` hook, never a half-working feature.

**Stop immediately and ask if:**
- a key or manual file is missing;
- a licence is unclear;
- a book check fails badly (the STOP thresholds in §4.1).

---

## 10. Verification (reported in `docs/data-integration-status.md`)

**Per product:**
- the spotcheck result;
- fresh value vs the book's value;
- output size;
- source timestamp.

**Per voice:** at 3 points, spoken/shown value = JSON value, plus the rule with the pitch/rate at those points.

**Per scene:**
- 3 values = JSON;
- FPS on High and Low (production build);
- a reduced-motion run and a keyboard-only run.

**Guardrail tests (`bun test`):**
- every comparison uses one mapping entry;
- every model dataset has a model badge and a model-family timbre;
- no hard-coded digits next to units in UI strings (a grep over `src/lib/i18n` and components: every number must be a `{param}` filled from JSON).

**Security:**
- grep `.next/static` for key patterns, plus the actual key values read from the environment, never printed;
- `.env*` is ignored (already true);
- logs pass through `redact()`.

**Regression:**
- build, type-check and lint;
- all tabs, the Turntable and the Pack-1 scenes still work;
- no console errors;
- Lighthouse accessibility ≥ 95.

**Reference tests:** A2, A3, C5176, E5, E6, E7, E12, K2, K8, K10, K11, L1–L7, C5113, K4 (`python bloop_data_tests.py <ids> --no-install`; summary pasted).

---

## 11. Files I'll add or touch

**Add:**
- `pipeline/core/`, `pipeline/products/**`, `pipeline/checks/**`, `pipeline/build_freshness.py`, `pipeline/manual_inputs/README.md` (+ an FFWC stub note);
- `.github/workflows/data-daily.yml`, `data-weekly.yml`, `data-static.yml`;
- `src/types/contract-15/*.ts` (section 15 split by area to keep files short; re-exported from `data-contract.ts` §15);
- `src/app/api/{air/dhaka,events,sats,spaceweather}/route.ts`, `src/lib/server/upstream.ts`;
- `src/lib/data/` loaders per new file, `src/lib/data/freshness.ts`;
- `src/lib/audio-adapter/voices/*` (the new voices), `src/lib/captions/*`;
- `src/components/` badges (`SourceBadges`, `DataAge`), `ComparisonPlayer/`, place-record pieces;
- `src/components/Scenes/<scene>/` per new scene;
- `docs/data-integration-status.md`, `docs/data-all/` (screenshots, recordings), `docs/data-all-pr.md`.

**Touch (additive):**
- `pipeline/run_all.py` (`--cadence`, optional products), `pipeline/spotcheck.py` (calls `checks.run`), `pipeline/requirements.txt`, `.gitignore`;
- `src/types/data-contract.ts` (§15 header + re-exports; `FirmsSource`, `VoiceMapping` and the param unions widened), `public/mapping.json`;
- `src/lib/audio/mapping.ts` (`ruleText` for new kinds), `src/lib/audio-adapter/types.ts` (`VoiceId` widened), `src/lib/data/paths.ts` / `index.ts`;
- `Turntable/records.ts` (place records, `ghg`), `SleeveRow.tsx` / `Drawers.tsx` / `CreditsLink.tsx` (sleeve back, credits from `freshness.json`);
- `panels/TruthPanel.tsx` / `Checks.tsx` (ocean number from JSON, U button), `panels/MappingPanel.tsx`, `HelpDialog.tsx`;
- `Scenes/registry.ts` and `Scenes/future.ts`, Pack-1 `terrain/` and `tunnel/`;
- `lib/i18n/en/*` + Bangla drafts;
- `package.json` (+ `satellite.js`).

**Not touched:**
- existing output formats (§1–14 files keep their shapes; `firms.json` and `ndvi.json` only gain keys);
- `main`;
- your local `public/data` changes, until you answer Q1.

---

## 12. Where reality or the book disagrees with the prompt (decisions I've made; tell me if any is wrong)

1. **Book file name:** it's `docs/BLOOP_MASTER_BUILD_BOOK (1).md`, untracked.
2. **Workflows don't fire from a feature branch.** `schedule` and `workflow_dispatch` only run from `main`, and A2 checks the deployed app. Phase 1 proves both locally; the crons and the deployed A2 start after your merge.
3. **Hourly air snapshots:** a commit every hour = 24 commits and 24 Vercel builds a day. Instead, the **daily** job backfills the past 24 hourly values (OpenAQ `/hours`, Open-Meteo past hours, GEOS-CF hourly analysis), and `/api/air/dhaka` serves "now".
4. **MERRA-2 "2000→ daily":** monthly `M2TMNXAER` for 2000→ plus daily for the latest ~90 days (a full daily pull would be ~9,500 files).
5. **SWORD geometry:** taken from the RiverSP reach shapefiles (SWORD-defined polylines), so there's no separate SWORD download. SWORD is credited.
6. **ERA5 (solar check) is a reanalysis:** it gets the Model badge, although it isn't in the prompt's model list.
7. **Historic `VIIRS_SNPP_SP` 2023 FIRMS case:** kept. It predates 2 Nov, and the rule targets products after that date. The Comparison Player compares MODIS with MODIS only.
8. **S-NPP wording:** the satellite still flies, so the label is "science products ended 2 Nov 2026 (NOAA NESDIS)", not "ended".
9. **CRW "alert level":** not shown (book §14 open). DHW numbers only, unless you want me to source the CRW threshold page.
10. **OPERA DSWx-S1 on 5 May 2024:** S1 coverage for that date is uncertain. If no S1 granule exists on the chosen tile, I'll report it and use the nearest pre-flood S1 date, labelled.
11. **Contract length:** §15 goes in `src/types/contract-15/*.ts`, re-exported from `data-contract.ts` §15. This keeps each file short (AGENTS.md).
12. **Licences to watch:**
    - AERONET's data policy asks for acknowledgement (credited);
    - OpenAQ provider licences vary (we publish derived medians, credited "OpenAQ and Bangladesh DoE");
    - ACAG and HydroShare are CC BY 4.0;
    - GBIF counts only, with citation.

    If any of these needs explicit permission, I'll stop and ask.

---

## 13. Questions before I start

- **Q1. Your local `public/data` changes** (28 Sep re-run, still ~30 d old, deletes `latest_check`): (a) **discard and regenerate fresh in phase 1** (recommended), (b) leave them uncommitted for phase 1 to overwrite, or (c) commit them as-is first?
- **Q2. Untracked files:** may I commit `pipeline/reference/bloop_data_tests.py` (the pipeline imports it; Actions needs it) and the book, renamed to `docs/BLOOP_MASTER_BUILD_BOOK.md`? (`IDEA LIST.MD` and `package-lock.json` stay untouched.)
- **Q3. Pushing:** may I push `feat/data-all` to `origin` at the checkpoints (for a Vercel preview and to smoke-test workflows with a `push` trigger)? I won't push without a yes, and I never touch `main`.
- **Q4.** Do you agree with the daily air backfill instead of hourly commits (§12.3)?
