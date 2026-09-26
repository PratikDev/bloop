# The Earth Information Jukebox — Complete Team Build Plan

**NASA Space Apps Challenge 2026 · Challenge #14 · Theme: "The Next Frontier"**
**Version:** 25 Sep 2026 · **Status:** challenge chosen, all prototype-critical tests passed, build starts Sat 26 Sep

> Read Sections 1–4 first (what we're building and why), then your own lane in Section 12. Sections 5–7 are the reference for data and formats; Section 16 is the honesty rulebook everyone must follow.

---

## Contents
1. The challenge and deadlines
2. Our concept in one paragraph
3. What makes us different (and what doesn't)
4. What we have already proven (test results)
5. Data source registry (every dataset, with access details)
6. System architecture
7. Data contract (pipeline → app file formats)
8. Pipeline specification (Python)
9. App specification (web)
10. Sound mapping specification (`mapping.json`)
11. Feature list: core → should → creative → teasers → concept-only
12. Team lanes and day-by-day schedule
13. Definition of done and QA checklist
14. Video 1 (1 Oct) plan and shot list
15. Credits, licences and AI disclosure
16. Honesty rules and exact on-screen wording
17. Risks and fallbacks
18. After 1 October: roadmap
19. Open questions / unknowns
20. Glossary

---

## 1. The challenge and deadlines

**Official challenge summary (verbatim):**
> "NASA's Earth Information Center (EIC) produces stunning visualizations of our changing planet, but presenting Earth science through visualization alone limits who can reach it. We invite you to make this complex Earth science accessible, engaging, and multi-sensory by translating sight into sound. Your challenge is to build an "Earth Jukebox"—an interface, script, or application that pairs Earth Information Center (EIC) visual frames with dynamic sonifications generated in real time."

Tags: *Intermediate, Beginner/Youth* · *Arts & Multimedia, Earth Science, Software*.

**The three literal requirements we must satisfy:**
1. Use **EIC visual frames** (NASA's EIC visualizations, published by NASA's Scientific Visualization Studio, SVS).
2. **Pair** the frames with sound.
3. Generate the sonification **in real time** (the sound is computed live while the frames play).

**Deadlines:**

| Date | What | Details |
|---|---|---|
| **Wed 30 Sep** (our internal target) | Upload Video 1 | One day of safety margin |
| **Thu 1 Oct, 11:59 PM** | **Video 1 (prescreening), max 240 s** | Must contain: **team name; every team member listed by name; the problem and challenge statement; our solution approach** (the form asks for concept; we also show a working prototype). Upload to YouTube, paste the link in the Google Form |
| After 1 Oct | Mentor assigned | A month of mentored development |
| **28 Oct** | Full challenge statements published | May add datasets, audiences or hardware requirements; we re-check every feature against it |
| **1 Nov** | Video 2 (240 s) with working build | Same 240-second structure, full demo |
| **14–15 Nov** (global dates per the official FAQ; confirm local dates) | Hackathon; **30-second video** for global judges | Global judges see the project page plus the 30-second video |

**The 240-second structure** (official "240 Seconds of Glory" model, used for both videos):

| Block | Time | Purpose |
|---|---|---|
| WHO | 0:00–0:45 | Attention and authenticity. The first 15 seconds decide whether judges lean forward |
| WHY | 0:45–1:45 | Empathy for the problem; one killer data point |
| WHAT | 1:45–2:45 | The big idea and how it works; show evidence and the prototype |
| SO WHAT NEXT | 2:45–4:00 | Impact, what we need next, close on the working demo |

---

## 2. Our concept in one paragraph

**The Earth Information Jukebox lets anyone *hear* NASA's Earth Information Center visualizations, and trust what they hear.** We take the exact EIC frame on screen (for example, today's global sea surface temperature or the latest half-hourly rainfall), convert every pixel's colour back into the real physical value it represents (°C, mm/hour) using the frame's own colorbar, and generate live sound from those values. We then **check those values against NASA's original source datasets** and show the measured error on screen. Blind and low-vision users can explore the planet by ear with keyboard and speech. Everyone else hears patterns like the monsoon moving over the Bay of Bengal. A "then vs now" mode plays verified decades-long records (e.g. Dhaka's pre-monsoon heat, NASA GISTEMP) so change becomes audible.

**One-line pitch:** *"Hear exactly what NASA's Earth Information Center is showing, and trust it: every sound traces back to a verified NASA measurement."*

---

## 3. What makes us different (and what doesn't)

**Our differentiating combination (hard to copy late):**
1. **Frame-paired:** the sound is generated from the exact EIC frame on screen (the literal challenge ask). The Bangladesh build guide's #14 page uses data series (POWER/NDVI/FIRMS/GRACE) and never mentions EIC frames, so guide-following teams will likely miss this.
2. **Verified:** measured agreement with NASA's source data (SST: median error 0.85 °C; rain: within ~27% of IMERG). None of the known competitors or 2023 finalists report this.
3. **Explorable by ear:** keyboard, speech and screen-reader support (research-based: iSonic, Umwelt, MAIDR).
4. **Evidenced:** in October, a listening study with sighted and blind/low-vision adults. The 2023 sound-challenge finalists we reviewed reported none.

**What is NOT new (don't claim it):**
- Turning map colours back into values (prior art: mcgibs for NASA GIBS; the `unmap` tools; Poco et al. 2018).
- Sonification itself, image-to-sound, spectrogram audification, mapping deviation from normal, spatial audio (all have precedents).
- The 2023 Global Connection winner (Arcobaleno) sonified NASA images for blind users.

**Known 2026 competitors (from public blurbs only):**
- Pundra University repo "The-Earth-Information-Jukebox" (numeric series → Web Audio).
- Stack Underflow (TEMPO, POWER, GIBS).
- Sayqal (45 years, Uzbek maqom music).
- DeepSonic (bathymetry + ML).
- Planet Buddy (children; challenge unclear).

None describes verification, frame pairing, exploration by ear, or listener testing.

---

## 4. What we have already proven (test results)

All tests used pass/fail rules written **before** running.

| Test | Question | Result | Key numbers |
|---|---|---|---|
| **A** Prior art | Has anyone built frame → value → verification → sound? | **CONTINUE** | No exact match found; the colour-inversion step has prior art (mcgibs, unmap) |
| **B** Reuse | Can we reuse SVS frames? | **PASS** | Credit "NASA's Scientific Visualization Studio"; NASA Reproduction Guidelines |
| **C** SST fidelity | EIC SST frame (SVS 5101) → °C vs NASA MUR SST | **PASS** | 60 points: **median error 0.85 °C**, 90th percentile 1.38 °C, bias +0.56 °C, max 2.09 °C; best match MUR 2026-09-21 |
| **D** Rain qualifies | Does IMERG (SVS 4285) have usable frames? | **PASS** | 3600×1800 equirectangular; `flatalpha` data-only layer; liquid and frozen colorbars, 0.1–50 mm/h, log scale |
| **D2** Rain fidelity | EIC rain frame → mm/h vs NASA IMERG | **PASS** | Best match **IMERG Late, 00:00 UTC**; rain/no-rain agreement 100% (150 rain + 150 dry points); **median \|log10 error\| 0.103** (≈ within 27%); bias −0.103 (frame reads ~21% low); rain/snow phase agreement 100%; colorbar strip x = 40–416, y = 37; RGB-only matching |
| **T1** Browser access | Can a browser read SVS pixels? | SVS: **blocked (CORS)** → pipeline needed; POWER: readable; GLOBE API: empty | — |
| **T2** Frame inventory | Latest frames and colorbars per EIC product | **PASS** | 5101 SST newest 1 day old; 4285 IMERG 0 days; 5176 SST 3 days; NDVI 5544 **104 days old (stale)**; others have frames, colorbars unchecked |
| **T3** Sound responsiveness | Is value → sound instant? | **PASS** | — |
| **P1** NASA POWER access | Daily data for Dhaka? | Data PASS; speed FAIL (172 s for 1981–2026) | See P1b: **not reliable** for long-term claims |
| **P1b** POWER cross-check | Does POWER agree with independent records? | **POWER FAILED** (rain and temperature) | See the table below |
| **P2** FIRMS | Fire counts accessible? | **PASS** | CHT Mar–Apr: MODIS 2003 = 4,954; MODIS 2023 = 4,033; VIIRS 2023 = 14,521 · Punjab Oct–Nov: MODIS 2003 = 11,879; MODIS 2023 = 9,850; VIIRS 2023 = 36,165 |
| **P3** GRACE | Water storage accessible + known-answer check | **PASS** | NW India trend **−3.25 cm/yr** (documented depletion ✔); Bangladesh −0.35 cm/yr; Bangladesh means 2003–06 +0.83 cm → 2021–24 −5.82 cm; NW India +8.71 → −53.63 cm; 11-month gap Jul 2017–May 2018 present |
| **P4** NDVI | Vegetation series accessible? | **PASS** | Sundarbans 0.550 → 0.566; Madhupur 0.482 → 0.530; Dhaka control 0.274 → 0.260 (2001–03 vs 2021–23, 69 composites each) |
| **P5** GLOBE | Citizen ground observations in Bangladesh? | **PASS (via CSV)** | GLOBE Clouds 2025 v3.4 matched dataset: **831 unique Bangladesh observations, all satellite-matched, 139 locations, Jan–Dec 2025** |

**P1b cross-check details (why POWER is out and what replaces it):**

| Topic | NASA POWER (Dhaka cell) | Independent records | Verdict |
|---|---|---|---|
| Monsoon rain (Jun–Sep), 1981–90 vs 2016–25 | 6.51 → 14.07 mm/day (**×2.16**) | **GPCP** 15.10 → 13.71 (×0.91; year-to-year correlation with POWER 0.20) · **GPCC gauges** 14.79 → 13.03 (1981–90 vs 2010–19; ×0.88; correlation 0.24) | POWER inconsistent |
| Apr–May temperature | Daily mean 30.13 → 29.24 °C (**−0.89**); daily max 36.57 → 34.44 (−2.13) | **GISTEMP** anomaly −0.14 → +1.23 °C (**+1.37 °C**; 10/10 years each) · Dhaka station (GSOD 41923) 32.87 → 34.19 °C daily max (only 2 early years, so not used formally) | POWER goes the opposite direction |

**Conclusion:** use **GISTEMP** (heat) and **GPCP/GPCC** (rain) for "then vs now". POWER is not used for any long-term claim. The finding is specific to this location and these windows, not a general verdict on POWER.

---

## 5. Data source registry

**Status key:**
- ✅ verified by our tests
- ⏳ verified access, feature scheduled later
- ❌ excluded

### 5.1 EIC frames (the core; frame-paired)

**SVS 5101: Sea Surface Temperature (SST), Near Real Time** ✅
- **Page:** https://svs.gsfc.nasa.gov/5101/ · **API:** https://svs.gsfc.nasa.gov/api/5101
- **Frames:** `https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005101/frames/4096x2048_2x1_30p/sst_mur_no-dates/` (no date printed; use this). The dated version is `.../sst_mur/` (use it only to read the date).
- **Latest stills:** `sst_mur_<YYYYMMDD>_no-dates.exr` (EXR; converted with OpenCV). Use equirectangular only, never the Robinson or hurricane versions.
- **Colorbar:** `https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005101/sst_mur_colorbar.png` (3840×2160 image containing the strip); **−5 to 35 °C, linear**.
- **Map:** equirectangular 2:1, full globe; land = neutral colour.
- **Update:** daily (newest frame was 1 day old in T2).
- **Source dataset:** NASA/JPL **MUR SST v4.1**, short name `MUR-JPL-L4-GLOB-v4.1` (PO.DAAC, Earthdata Login).
  - Variable `analysed_sst` (Kelvin).
  - Also `sst_anomaly` (from 2019), `dt_1km_data` (hours to the nearest infrared measurement) and `analysis_error`.
  - Multi-agency inputs, including JAXA AMSR2; sea ice from EUMETSAT OSI SAF.
- **Our verification:** median error 0.85 °C (Check C).
- **Credit:** "NASA's Scientific Visualization Studio"; "MUR SST, NASA/JPL PO.DAAC".

**SVS 4285: Near Real-Time Global Precipitation (IMERG)** ✅
- **Page:** https://svs.gsfc.nasa.gov/4285/ · **API:** https://svs.gsfc.nasa.gov/api/4285
- **Frames (data-only, transparent where dry):** `https://svs.gsfc.nasa.gov/vis/a000000/a004200/a004285/frames/3600x1800_2x1_30p/flatalpha/imergert_alpha.<ISO time>.png`, e.g. `imergert_alpha.2026-09-17T00:00:00Z.png`. **Windows can't save colons in file names; rename on download.**
- **Colorbars:** liquid `rainbarwhite2.png` / `rainbarblack2.png`; frozen `snowbarwhite2.png` / `snowbarblack2.png`. **0.1–50 mm/h, logarithmic.** Strip at x = 40–416, y = 37 (377 px).
- **Map:** 3600×1800 = exactly IMERG's 0.1° grid.
- **Update:** every 30 minutes (0 days old in T2).
- **Source dataset:** NASA–JAXA **GPM IMERG** half-hourly V07. The **Late run** (`GPM_3IMERGHHL`) matched best, and the frame timestamp marks **the half-hour starting** at that time.
  - Access via GES DISC. **Each user must approve "NASA GESDISC DATA ARCHIVE" in their Earthdata profile.**
  - Variables `Grid/precipitation` (mm/h) and `Grid/probabilityLiquidPrecipitation`.
- **Our verification:** within ~27% (D2).
- **Latency:** IMERG Late arrives many hours after observation (exact delay to confirm). Always show the frame time; never say "live this minute".
- **Credit:** "NASA's Scientific Visualization Studio"; "GPM IMERG, NASA/JAXA, GES DISC".

**Other EIC daily products** (gallery: https://svs.gsfc.nasa.gov/gallery/daily-visualizations/) ⏳ for October
- **5176** SST (second item): frames and colorbar found; 3 days old. Possibly an anomaly product; needs the checklist.
- **5113** VIIRS active fires, **5151/5152/5153/5154** GEOS-CF air quality (PM2.5 / ozone / CO / NOx), **5147** GEOS-FP near-surface temperature, **5148** wind, **5149** precipitation and clouds: frames found; colorbars and dates need the manual checklist + conversion test.
- **5544** NDVI: stale (104 days), so it can't be a live track. Use the MODIS service instead (5.3).
- **4897** seasonal precipitation variation: an IMERG anomaly visualization using IMERG's daily climatology. Candidate for the Anomaly Choir; checklist needed.
- **5067** Earth Observing Fleet – Now: for the "who measured this?" satellite layer (October).

### 5.2 "Then vs now" records (context layers; not frame-paired, labelled as such)

**NASA GISTEMP v4 (250 km)** ✅
- **What:** monthly surface temperature anomalies vs the 1951–1980 normal, from weather stations.
- **Access:** `https://data.giss.nasa.gov/pub/gistemp/gistemp250_GHCNv4.nc.gz` (gzip → netCDF, variable `tempanomaly`). No key.
- **Result:** Dhaka cell, Apr–May, 1981–90 vs 2016–25 = **+1.37 °C** (10/10 years each).
- **Caveat:** monthly, not daily; depends on nearby station coverage.
- **Credit:** "GISTEMP Team, NASA Goddard Institute for Space Studies".

**GPCP v2.3 monthly** ✅
- **What:** NASA-led satellite + gauge precipitation, 2.5°, 1979 onward.
- **Access:** `https://downloads.psl.noaa.gov/Datasets/gpcp/precip.mon.mean.nc` (NOAA PSL; ~20 MB; no key). Variable `precip` (mm/day). **Open with `decode_times=False`**, then time = 1800-01-01 + days.
- **Result:** Jun–Sep 15.10 → 13.71 mm/day (−9%).
- **Caveat:** before 1988 it uses a coarser estimate; cells ~275 km wide.
- **Credit:** "GPCP v2.3 (Adler et al.); data provided by NOAA PSL".

**GPCC Full Data v2020 (2.5°)** ✅
- **What:** rain gauges only; monthly totals to 2019.
- **Access:** `https://downloads.psl.noaa.gov/Datasets/gpcc/full_v2020/precip.mon.total.2.5x2.5.v2020.nc` (mm/month → divide by days in month).
- **Result:** 14.79 → 13.03 mm/day (1981–90 vs 2010–19, −12%).
- **Credit:** "GPCC, Deutscher Wetterdienst; data provided by NOAA PSL".

**NOAA GSOD Dhaka station** (WMO 41923) ⏳ supporting only
- **Access:** `https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/<YEAR>/41923099999.csv` (MAX in °F, PRCP in inches; 9999.9 / 99.99 = missing).
- **Status:** only 2 complete early years, so supporting evidence only.

**NASA POWER** ❌ for long-term claims (failed P1b). May be revisited only for short, recent context after a separate check.

### 5.3 Other verified layers

**GRACE / GRACE-FO (water storage bass line)** ✅
- **Dataset:** JPL mascon **RL06.3M v04 CRI**, short name `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4` (PO.DAAC; Earthdata Login).
- **File:** `GRCTellus.JPL.200204_202607.GLO.RL06.3M.MSCNv04CRI.nc` (~2 GB in memory). The pipeline extracts small regional series; **never ship this file to the browser**.
- **Variable:** `lwe_thickness` in cm, anomalies vs 2004–2009; also `uncertainty`, `land_mask`, `scale_factor`.
- **Grid:** 0.5° sampling, ~3° true resolution; longitude 0–360.
- **Record:** Apr 2002 onward; **gap Jul 2017–May 2018** (35 missing months in total).
- **Boxes used:** Bangladesh lon 88–93, lat 20.5–26.7; NW India lon 72–78, lat 26–32.
- **Credit:** use the dataset's acknowledgement text ("GRACE/GRACE-FO JPL RL06.3Mv04 CRI mascons, NASA/JPL PO.DAAC").

**FIRMS active fires (percussion)** ✅
- **API:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/<SOURCE>/<west,south,east,north>/<days 1–10>/<YYYY-MM-DD>`
- **Sources:** `MODIS_SP` (standard, from Nov 2000) and `VIIRS_SNPP_SP` (from 2012). **Free MAP_KEY** (request on the FIRMS API page). Slow (about 5 minutes per case), so it runs in the pipeline only.
- **Rule:** compare MODIS with MODIS only (VIIRS detects ~3× more). Single years are labelled "example years".
- **Boxes:** CHT lon 91.6–92.7, lat 21.2–23.7 (Mar–Apr); Punjab lon 73.8–77.0, lat 29.5–32.5 (Oct–Nov).
- **Credit:** "NASA FIRMS (LANCE/ESDIS)".

**MODIS NDVI (slow vegetation voice)** ✅
- **Service:** ORNL DAAC MODIS web service `https://modis.ornl.gov/rst/api/v1/MOD13Q1/...`, band `250m_16_days_NDVI`, scale × 0.0001, ≤ 10 dates per request, no key.
- **Points:** Sundarbans 21.95 N 89.18 E; Madhupur 24.62 N 90.05 E; Dhaka control 23.78 N 90.40 E.
- **Caveat:** single 250 m pixels; average an area before claiming change.
- **Credit:** "MODIS MOD13Q1, ORNL DAAC".

**GLOBE Clouds (citizen ground observations)** ✅ (CSV route)
- **Dataset:** GLOBE Clouds **2025 v3.4 matched** CSV (from the GLOBE clouds data page). 831 Bangladesh observations, all satellite-matched, 139 locations.
- The public API returned non-JSON in our tests, so **we use CSV snapshots**, not the live API.
- Matches are processed with up to ~7 days' delay, so the duet uses the archive, not "live".
- Present it as a **second perspective, not a truth test**.
- **Credit:** "NASA GLOBE Program".

### 5.4 October / roadmap sources (not in Video 1)
- JAXA **GSMaP** (0.1°, hourly; free registration; credit "GSMaP data by JAXA"): NASA vs JAXA rain duet.
- UK Met Office **OSTIA** (on PO.DAAC): SST duet.
- **GIBS** colormaps (`sourceValue` per colour): three-way check.
- **NEX-GDDP-CMIP6** (NASA; daily 1950–2100; 35 models; 4 scenarios): "two futures" (model projections, clearly labelled).
- **CelesTrak** GP data + `satellite.js` (SGP4): satellite-pass cues.
- Night lights (Black Marble), OMI NO₂, sea ice, altimetry, SMAP, OCO-2 with NOAA Mauna Loa, MODIS LST/snow, NOAA OISST, CHIRPS: each needs its own access test first.

---

## 6. System architecture

```
                         NIGHTLY / ON-DEMAND DATA PIPELINE (Python, runs on our PC; later GitHub Actions)
 SVS 5101 frame (EXR) ─┐
 SVS 4285 frame (PNG) ─┼─► fetch ─► colorbar inversion (verified LUTs) ─► value grids + metadata ─┐
 IMERG last 48 frames ─┘                                                                        │
 GISTEMP / GPCP / GPCC / GRACE / FIRMS / NDVI / GLOBE ─► build_context (small regional JSON) ────┤
                                                                                                ▼
                                                   public/data/  (static files, a few MB)
                                                                                                │
                    NEXT.JS APP (TypeScript, App Router, Tailwind + shadcn/ui, Web Audio; Vercel) ▼
   Frame view + cursor ◄─ lib/data.ts (grids) ─► lib/audio.ts (live synthesis) ─► speakers/headphones
   Keyboard/speech/captions ─ panels (truth, mapping, provenance, compare) ─ story mode ─ game (optional, lowest priority)
```

**Why a pipeline:**
- **T1:** SVS blocks browser pixel reading (CORS). Displaying SVS images is fine; reading their pixels in the browser is not.
- Slow APIs (FIRMS; POWER-style requests) and big files (GRACE, 2 GB).
- Resilience if the SVS feed stalls: the app plays the last cached frames with their date.
- Low bandwidth for users in Bangladesh.

**"Real time", honestly:** the **sound is synthesised live** in the browser as frames play or as the user explores (that's the challenge's requirement). The **data** is near-real-time: SST daily, rain every 30 minutes, arriving hours to a day after observation. The frame time is always on screen.

**Tech stack:**
- **Pipeline:** Python 3.10+, `numpy`, `pillow`, `opencv-python` (EXR), `xarray`, `h5netcdf`, `earthaccess` (for any Earthdata downloads), `pandas`, `matplotlib`.
- **App:** Next.js (App Router) + TypeScript, Tailwind CSS, **shadcn/ui as the default component library** for every interface element, ESLint, Web Audio API, Web Speech API (speech output; recorded audio for Bangla narration), Canvas 2D for the frame view.
- **Hosting:** public GitHub repo, deployed on **Vercel** (auto-deploys on every push — including the data-file commits L1 makes).
- **Browsers:** Chrome and Edge (desktop and Android) are primary; Firefox and Safari best-effort.

**Repository layout:**
```
earth-jukebox/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                    # app shell: mode tabs, frame canvas, panels, mixer
│  │  └─ globals.css                 # Tailwind entry (v4 CSS-first theme)
│  ├─ components/
│  │  ├─ ui/                         # shadcn/ui primitives (button.tsx, slider.tsx, tabs.tsx, dialog.tsx, ...)
│  │  ├─ frame-view.tsx              # basemap + frame; cursor; playhead
│  │  ├─ explore-controls.tsx        # keyboard/touch/speech navigation, ARIA live region
│  │  ├─ sweep-controls.tsx          # gist sweep, row sweep
│  │  ├─ panels/
│  │  │  ├─ truth-panel.tsx
│  │  │  ├─ mapping-panel.tsx
│  │  │  ├─ provenance-panel.tsx
│  │  │  └─ compare-panel.tsx        # Comparison Player
│  │  ├─ history-chart.tsx           # Place History; chart + playhead
│  │  ├─ story-mode.tsx              # Story Mode script runner
│  │  ├─ captions.tsx                # caption bar + Describe toggle
│  │  └─ game.tsx                    # "Warmer or Colder?" — single mode, lowest priority (see 11.6)
│  ├─ lib/
│  │  ├─ data.ts                     # load grids + JSON; valueAt(track, lat, lon); decode encodings
│  │  ├─ audio.ts                    # Web Audio graph: per-voice synths, panner, limiter, earcons
│  │  ├─ i18n.ts                     # English / Bangla strings; narration clip mapping
│  │  └─ utils.ts                    # shadcn's cn() helper etc.
│  └─ types/
│     └─ data-contract.ts            # shared TS types for the Section 7 file schemas
├─ public/
│  ├─ mapping.json
│  ├─ audio/narration_en/  audio/narration_bn/       # recorded narration clips
│  └─ data/ latest/  sequence/  context/  demo/  truth/   # L1's pipeline output lands here
├─ pipeline/                          # L1 — unchanged, outside the Next.js app, Python
│  ├─ lut_params.json          # verified colorbar settings (single source of truth)
│  ├─ fetch_latest.py          # newest 5101 + 4285 frames
│  ├─ convert_sst.py           # EXR → sRGB → LUT → °C grid
│  ├─ convert_rain.py          # flatalpha → RGB-only LUT (liquid+frozen) → mm/h + phase
│  ├─ fetch_rain_sequence.py   # last ~48 half-hourly frames (time-lapse)
│  ├─ build_context.py         # GISTEMP, GPCP, GPCC, GRACE, FIRMS, NDVI, GLOBE → small JSON
│  ├─ build_demo.py            # "Dhaka then vs now" numbers + series (from context JSON)
│  ├─ spotcheck.py             # acceptance: compares app-format grids to test values
│  └─ run_all.py               # runs everything in order
├─ tests/                             # copies of L1's test scripts + results, for transparency
├─ components.json                    # shadcn/ui config
├─ postcss.config.mjs                 # required by the Tailwind PostCSS plugin
├─ eslint.config.mjs                  # Next.js latest flat config
├─ tsconfig.json
├─ next.config.ts
├─ package.json
├─ LICENSE (MIT for our code)   README.md (credits, how to run)
├─ CLAUDE.md   AGENTS.md   .env.example   docs/AI_USE.md
```
Everything under `src/` should be `.ts`/`.tsx` — no `.js` or `.jsx` files anywhere in the app. The only plain-JS-format files in the whole repo are the two build-tool configs that don't support TypeScript (`postcss.config.mjs`, `eslint.config.mjs`); if the team wants to extend Tailwind's defaults beyond the CSS-first `@theme` config, an optional `tailwind.config.ts` can be added — still TypeScript. L1's pipeline stays Python (`.py`), as before — that's a separate language, not covered by the "no `.js`" rule.

---

## 7. Data contract (pipeline → app)

All files live under `public/data/` (Next.js serves everything in `public/` at the site root, so `public/data/latest/sst.bin` is reachable at `/data/latest/sst.bin`). Binary grids are little-endian, row 0 = north (90° N), column 0 = 180° W.

| File | Content | Encoding |
|---|---|---|
| `latest/sst.bin` | SST grid **1024×512** (block mean of valid source pixels) | `Uint16`: value = round((°C + 5) × 1000); **65535 = land / no data** |
| `latest/sst.json` | Metadata | See the schema below |
| `latest/sst.webp` | Display image, 2048×1024 | From the sRGB-converted frame |
| `latest/rain.bin` | Rain grid **1800×900** (2×2 **maximum**, so small storms survive) | `Uint16`: 0 = dry; else round((log10(mm/h) + 1) × 20000) + 1; 65535 = no data |
| `latest/rain_phase.bin` | Phase per cell | `Uint8`: 0 dry, 1 liquid, 2 frozen |
| `latest/rain.json`, `latest/rain.png` | Metadata; display image (keeps transparency) | — |
| `sequence/rain_000.bin … rain_047.bin` (+ `_phase`, `.png`, `index.json`) | Time-lapse, 1200×600, oldest → newest | As for rain |
| `context/gistemp_bd.json` | Monthly anomalies 1951 → latest for Dhaka and 2–3 other Bangladesh cells | `{cell:{lat,lon,months:[YYYY-MM],anom_C:[...]}}` |
| `context/gpcp_bd.json` | Monthly rain 1979 → latest, same cells | mm/day |
| `context/gpcc_bd.json` | Monthly rain to 2019, same cells | mm/day |
| `context/grace.json` | Bangladesh + NW India monthly | `{box:{months,cm (null = missing),trend_cm_per_yr,mean_A,mean_B}}` |
| `context/firms.json` | Per-day counts for the CHT and Punjab cases | From P2 |
| `context/ndvi.json` | 16-day NDVI, 3 points, both windows | From P4 |
| `context/globe_bd.json` | Bangladesh observations: time, lat, lon, ground cloud cover, satellite cloud value, satellite name | From P5 CSV (trimmed) |
| `demo/dhaka_then_now.json` | Precomputed windows, numbers and series for the killer demo | Section 11.5 |
| `truth/sst_compare.png`, `truth/rain_compare.png`, `truth/crosscheck.png` | Scatter plots / chart from the tests | PNG |

**Metadata schema (`latest/*.json`):**
```json
{
  "product": "sst",                       
  "svs_id": 5101,
  "svs_page": "https://svs.gsfc.nasa.gov/5101/",
  "frame_time_utc": "2026-09-24T00:00:00Z",
  "source_dataset": "MUR-JPL-L4-GLOB-v4.1 (NASA/JPL PO.DAAC)",
  "grid": {"width": 1024, "height": 512, "encoding": "uint16_offset", "scale": 1000, "offset": -5, "nodata": 65535},
  "verified": {"metric": "median_abs_error_C", "value": 0.85, "n_points": 60, "frames_tested": 1, "test": "Check C"},
  "credit": "Visualization: NASA's Scientific Visualization Studio. Data: MUR SST, NASA/JPL PO.DAAC.",
  "generated_utc": "..."
}
```
For rain: `"verified": {"metric": "median_abs_log10_error", "value": 0.103, "approx_percent": 27, "bias_log10": -0.103, "n_points": 150, "agreement": 1.0, "matched_run": "IMERG Late", "test": "D2"}`.

**Land mask / basemap:** land = SST no-data cells. The app draws a dark ocean with slightly lighter land from this mask under the transparent rain layer. It's derived from the data itself; no third-party basemap is needed.

---

## 8. Pipeline specification (Python)

Run order: `python pipeline/run_all.py` (or each script in order). All scripts print a short summary and fail loudly.

| Script | Inputs | Steps | Output | Acceptance |
|---|---|---|---|---|
| `fetch_latest.py` | SVS API / frame folders | 1) Read `api/5101` and `api/4285`; 2) list the frame folders; 3) pick the newest no-dates SST frame and the newest `flatalpha` rain frame; 4) download; 5) record timestamps | `raw/sst_*.exr`, `raw/rain_*.png`, `raw/manifest.json` | Timestamps equal the newest in the listing |
| `convert_sst.py` | EXR + `lut_params.json` | 1) EXR → float RGB (OpenCV with `OPENCV_IO_ENABLE_OPENEXR=1`); 2) sRGB encode (the encoding `s2b` chose); 3) nearest-colour lookup against the SST colorbar LUT (reject colour distance > 20, which means land); 4) block-mean to 1024×512; 5) encode; 6) display WebP | `latest/sst.*` | `spotcheck.py`: 10 fixed points within 0.1 °C of the Check C pipeline values |
| `convert_rain.py` | `flatalpha` PNG + 4 colorbars | 1) Build the liquid and frozen LUTs (strip x 40–416, y 37; log 0.1–50); 2) alpha = 0 → dry; 3) **RGB-only** nearest match across both LUTs → rate + phase; 4) 2×2 max → 1800×900; 5) encode | `latest/rain.*` | 10 points match the D2 values; phase codes correct |
| `fetch_rain_sequence.py` | SVS 4285 folder | Newest ~48 frames (24 h) → same conversion at 1200×600 | `sequence/*` + `index.json` | Frame times continuous (30-min steps) |
| `build_context.py` | Downloaded files from P1b/P2/P3/P4/P5 | GISTEMP/GPCP/GPCC: nearest cells for Dhaka (23.81 N, 90.41 E), Chattogram (22.36, 91.78), Rajshahi (24.37, 88.60), Sylhet (24.90, 91.87). GRACE boxes. FIRMS per-day. NDVI points. GLOBE CSV subset | `context/*.json` | Numbers match P1b/P2/P3/P4/P5 |
| `build_demo.py` | `context/*.json` | Compute windows: heat (GISTEMP Apr–May, 1981–90 vs 2016–25), rain (GPCP Jun–Sep, same windows; GPCC 1981–90 vs 2010–19), water (GRACE 2003–06 vs 2021–24); per-window year-to-year spread (for timbre) | `demo/dhaka_then_now.json` | Heat +1.37 °C; GPCP 15.10/13.71; GPCC 14.79/13.03; GRACE +0.83/−5.82 |
| `spotcheck.py` | Grids + test outputs | Decode the app files at fixed points and compare with the test results | Printed PASS/FAIL | All PASS before deploy |

**`lut_params.json` (fill in from the tests):**
```json
{
  "sst":  {"colorbar": "sst_colorbar.png", "orientation": "horizontal", "start": "<from s2>", "end": "<from s2>",
           "across": "<from s2>", "vmin": -5, "vmax": 35, "scale": "linear", "exr_encoding": "<srgb|raw from s2b>",
           "max_colour_distance": 20},
  "rain": {"liquid": ["rainbarwhite2.png", "rainbarblack2.png"], "frozen": ["snowbarwhite2.png", "snowbarblack2.png"],
           "start": 40, "end": 416, "across": 37, "vmin": 0.1, "vmax": 50, "scale": "log", "match": "rgb_only"}
}
```

**Later (October): automation.** A GitHub Actions workflow (daily cron) runs `fetch_latest.py → convert_* → spotcheck.py` and commits `public/data/latest/`. SVS frames need no login; Earthdata-based steps (GRACE etc.) stay one-off.

---

## 9. App specification (web)

**UI library:** shadcn/ui is the default for every interface element — buttons, sliders, tabs, dialogs, toggles, cards — built on top of Tailwind CSS. Nothing hand-rolled where a shadcn primitive fits.

### 9.1 Screen layout
- **Top bar:**
  - title and sonic-identity play button;
  - mode tabs (**Explore · Story · Then vs Now**; shadcn `Tabs` — a **Game** tab is added only if it gets built, since it's lowest priority, see 11.6);
  - track selector (Ocean / Rain / Both);
  - frame date and time; language (EN / বাংলা); Describe toggle; Help.
- **Centre:** frame canvas (basemap + EIC frame) with cursor; large readout ("28.4 °C · 21.5° N, 89.8° E"); caption bar under the map.
- **Right panel (tabs):** **Truth** · **Mapping and Legend** · **Provenance** · **Compare / History** (chart with playhead).
- **Bottom:** mixer (volume, mute, solo per voice), Sweep, keyboard help.

### 9.2 Modules

| Module (file) | Responsibility |
|---|---|
| `lib/data.ts` | Load grids + JSON; `valueAt(track, lat, lon)`; decode encodings; nearest cell |
| `components/frame-view.tsx` | Draw basemap + frame; cursor; highlight; playhead sync; reduced-motion option |
| `lib/audio.ts` | Web Audio graph: per-voice synth (Section 10), stereo panner, master limiter/volume cap, legend tones, earcons |
| `components/explore-controls.tsx` | Mouse/touch/keyboard navigation, speech output, ARIA live region |
| `components/sweep-controls.tsx` | Gist sweep (rings outward from Dhaka), row sweep |
| `components/panels/*.tsx` | Truth, Mapping (renders `mapping.json`), Legend, Provenance — built with necessary shadcn components |
| `components/panels/compare-panel.tsx` | Comparison Player (A then B; left/right ears; disclosure panel) |
| `components/history-chart.tsx` | Place History (GISTEMP + GPCP monthly series; chart + playhead) - built with shadcn `chart` component |
| `components/game.tsx` | "Warmer or Colder?" — **single mode only**: hear a sound, choose the answer, reveal. Lowest build priority (Section 11.6) |
| `components/story-mode.tsx` | Story Mode script runner; "close your eyes" opening |
| `components/captions.tsx` | Caption bar + Describe toggle (spoken descriptions) |
| `lib/i18n.ts` | English / Bangla strings; narration clip mapping |

### 9.3 Keyboard map (shown in Help)

| Key | Action |
|---|---|
| Arrows | Move cursor 1° (Shift: 10°) |
| Enter | Speak value and place |
| Space | Play / pause |
| S | Sweep from Dhaka |
| 1 / 2 / 3 | Ocean / Rain / Both |
| M | Mute all |
| D | Describe mode on/off |
| C | Captions on/off |
| G | Game (if built — lowest priority) |
| T | Then vs Now |
| L | Legend (plays reference sounds) |
| P | Provenance of the current point |
| H or ? | Help |
| Esc | Stop story / close panel |

### 9.4 Accessibility requirements (must, not nice-to-have)
- Everything reachable by Tab, with a visible focus ring; no mouse-only actions.
- ARIA live region announces values, modes and results.
- Canvas has a text alternative; all panels are real HTML text.
- **Captions** for every sound event; **Describe mode** gives spoken descriptions during playback.
- Contrast ≥ 4.5:1; reduced-motion setting disables animations.
- Volume capped; no sudden loud sounds; a clear Stop.
- Works with the screen off (audio-only path through Explore and Game).

---

## 10. Sound mapping specification (`web/mapping.json`)

Every rule below is shown to users in the Mapping panel. Mappings marked **(design choice)** are ours and will be tested in the October listening pilot.

| Voice | Data | Rule | Sound |
|---|---|---|---|
| **Ocean** | SST °C (−5 to 35) | t = (value + 5) / 40; frequency = 220 × 4^t Hz (**linear in value, exponential in frequency**, the build-guide formula) | Warm sine with a soft attack; smooth glide (≈ 30 ms) |
| **Rain** | IMERG mm/h (0.1–50, log) | t = (log10(r) − log10(0.1)) / (log10(50) − log10(0.1)); **drops per second = 2 + 38·t** | Each drop = a short band-passed noise burst (raindrop-like); slight loudness increase with t |
| **Snow** | IMERG frozen phase | Same density rule | Soft bell (sine partials, slow decay) |
| **Stereo** | Longitude | pan = longitude / 180 (−1 left … +1 right) | StereoPannerNode |
| **Silence** | Land, dry, no data | No sound (honest silence) | — |
| **Heat then vs now** | GISTEMP anomaly °C (−2 to +3) | Frequency = 220 × 4^((a + 2) / 5) | Sine |
| **Heat: deviation** (Anomaly Choir, first track) (design choice) | abs(anomaly) in discrete bands: < 0.5 / 0.5–1.0 / 1.0–1.5 / > 1.5 °C | Band 0: pure; band 1: slightly detuned second voice; band 2: more detuned; band 3: detuned + rough. **Warm and cold anomalies treated the same** | Consonance → dissonance ("unusual", not "bad") |
| **Monsoon then vs now** | GPCP monthly mm/day (0–25) | Drops per step = round(mm/day × 0.6); one step = one month (150 ms) | Rain drops |
| **Water** (bass) | GRACE cm (5th–95th percentile range of the series) | Frequency 80–320 Hz, exponential | Low sine; **missing months = silence** ("no satellite was watching") |
| **Fires** | FIRMS detections per day | Click strength = log(1 + count) / log(1 + max) | Percussive click |
| **Vegetation** | NDVI 0–1 | 150–600 Hz, exponential | Slow pad |
| **Variability → timbre** (design choice) | Year-to-year spread within the window (or the 12-month rolling spread) | Higher spread → brighter filter + slight roughness | Filter cutoff + amplitude-modulation depth |
| **Seasonality → rhythm** (design choice) | Month of year | Accent on the climatological peak month (e.g. July for rain, April–May for heat) | Metric accent every 12 steps |
| **Extremes** | Hottest ocean point / heaviest rain cell in view | One short bright ping at that position | Earcon |
| **Satellite whisper** | Source metadata | Soft chime after a spoken value, plus a caption naming the dataset and mission | Earcon |
| **Sonic identity** | Today's SST in 4 latitude bands | 4-note motif (each band's mean → pitch) | Played at start and on track switch |

**Global audio rules:**
- Master volume capped.
- Limiter on the master bus.
- Every voice can be muted or soloed.
- **Personalisation (style or instrument) may change timbre only, never the value → pitch/density rules.**

---

## 11. Feature list

### 11.1 CORE (must be done by Sun night)
| ID | Feature | Research-guide ref |
|---|---|---|
| A1 | Frame-locked player: SST and rain EIC frames, cursor, readout, frame time | #1, #8 |
| A2 | Live sound from verified values (ocean, rain, snow) | #2, #9, Elemental Jukebox |
| A3 | **Truth panel** with exact wording (Section 16) + scatter plots | #3 |
| A4 | Mapping spec + **audio legend** (0/10/20/30 °C; light/heavy rain; snow) + 30 s warm-up | #4, #5, concept 23.4-10 |
| A5 | Keyboard + speech + screen-reader exploration | #6 |
| A6 | Gist sweep from Dhaka | #7 |
| A7 | Two-voice orchestra with mixer | Architecture B, #13 |
| A8 | Honest silence + stereo by longitude | 23.4-4, #28 (lite) |

### 11.2 CREATIVE LAYER A (Sun)
| ID | Feature | What it does |
|---|---|---|
| C1 | **"Close your eyes" opening** | Black screen, 10 s of real ocean + rain sound, "Now open your eyes", the frame fades in. Skip button |
| C2 | **Pipeline X-ray** | Hover: colour swatch → marker slides to its colorbar position → number → note (≈ 1.2 s) |
| C7 | **Satellite whisper** | Spoken value + chime + caption from metadata (e.g. "IMERG, NASA–JAXA GPM, Late run") |
| C9 | **Sonic identity** | Data-generated motif (no copyrighted music) |

### 11.3 SHOULD + CREATIVE LAYER B (Mon)
| ID | Feature | What it does |
|---|---|---|
| C4 | **Storm time-lapse** | Last ~48 half-hourly IMERG frames at about 2 frames/s over Bangladesh and the Bay; the cursor follows the heaviest nearby cell |
| B1 | **Comparison Player** | A then B; left/right ears; **disclosure panel** (windows, datasets, numbers); single years labelled "example years" |
| B2 + C6 | **GRACE "water that disappeared"** | NW India vs Bangladesh bass line; 2003–06 vs 2021–24; the 11-month gap plays as silence with a caption |
| B3 | **FIRMS fire percussion** | CHT and Punjab, 2003 vs 2023, MODIS only, "example years; same sensor" |
| B4 | **Provenance drawer** | Point → colour → value → dataset → SVS ID → frame time → measured error |
| B5/B6 | **Extreme pings + spoken area summary** | 3×3 grid summary, code-computed |
| C3 | **Story Mode (60–90 s)** | Ocean hum → sweep to the Bay of Bengal → storm time-lapse → satellite whisper → X-ray on one point → truth reveal |
| H1 | **Place History** | Pick Dhaka / Chattogram / Rajshahi / Sylhet → GISTEMP heat + GPCP rain play month by month with a **scrubbing chart** |
| H2 | **Variability → timbre, seasonality → rhythm** | Applied in History and Then vs Now |
| H3 | **Scrubbing chart with playhead** | In Compare / History, synced to the sound |

### 11.4 POLISH (Tue morning; **feature freeze 12:00**)
| ID | Feature |
|---|---|
| C8 | **Bangla / English** toggle (labels; recorded Bangla narration for Story Mode) |
| H4 | **Caption bar** (e.g. "Apr–May 2019 · +1.6 °C above 1951–80 normal") |
| H5 | **Describe mode** (spoken descriptions during any playback) |
| — | Accessibility pass; bug fixes |

### 11.5 THE KILLER DEMO: "Dhaka then vs now" (in Then vs Now mode and in the video)
| Part | Data | Plays | On-screen numbers |
|---|---|---|---|
| **Heat** | GISTEMP Apr–May anomalies, Dhaka cell | 1981–1990, then 2016–2025; pitch + Anomaly-Choir dissonance | **"+1.37 °C warmer (NASA GISTEMP; 10 years each)"** |
| **Monsoon** | GPCP Jun–Sep monthly | Same windows; rain density | **"Not wetter: GPCP −9%, rain gauges (GPCC, to 2019) −12%"** |
| **Water** | GRACE Bangladesh (and NW India) | 2003–06 vs 2021–24; bass line; gap = silence | **"Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm"** |
| **Optional honesty beat** | P1b | One caption | "A popular reanalysis-based dataset disagreed with independent records at this location, so we checked before you heard it." |

**The story:** *hotter, not wetter, and the water underground is falling.* Every number above is from our tests. We **don't** claim "more erratic rain" (not tested; would need IMERG daily).

### 11.6 TEASERS (only if everything above is done)
- GLOBE duet (archive): one Bangladesh observation, ground cloud cover vs satellite, labelled "Coming in October: citizen ground truth".
- Earth Ear ID lite: 8-band comfort check, labelled "comfort check, not a hearing test".
- Anomaly clip from SVS 5176, **only if** it is an anomaly product and passes a 15-minute checklist.
- Earth postcard: 10 s audio + frame export.
- **"Warmer or Colder?" game** (single mode only): hear a sound, choose the answer, then see the real value revealed. This is the **lowest build priority** in the whole plan — build it only once every feature above is done. No separate blindfold/audio-only mode; the one mode already plays sound with no answer-revealing visual on screen.

### 11.7 CONCEPT-ONLY in Video 1 (labelled "coming in October")
- "Check the AI by ear" and "Ask the Earth" (voice agent; the AI never produces numbers).
- The listening study with blind and low-vision adults.
- The full Anomaly Choir and Change Choir.
- Satellite-pass cues ("who measured this?").
- Raga music mode.
- NASA vs JAXA (GSMaP) and NASA vs UK Met Office (OSTIA) duets.
- More EIC tracks: fires, air quality, wind.
- Kiosk / hyperwall mode.

---

## 12. Team lanes and day-by-day schedule

**Lanes (assign one owner each; owners may help across lanes):**
- **L1 Data / Pipeline:** Python scripts, data files, spot checks, deployment.
- **L2 Audio:** `lib/audio.ts`, `mapping.json`, sound design, earcons, mix.
- **L3 Interface / Accessibility:** `components/frame-view.tsx`, `explore-controls.tsx`, panels, keyboard, captions, i18n.
- **L4 Story / Video / QA:** script, narration (EN + BN), Story Mode content, recording, editing, QA checklist, submission.

| Day | L1 Data | L2 Audio | L3 Interface / Accessibility | L4 Story / Video / QA |
|---|---|---|---|---|
| **Sat 26 (AM)** | Repo, `lut_params.json`, `fetch_latest.py` | Audio graph skeleton, master cap | App shell, layout, frame display | Script draft v1; collect member names/roles |
| **Sat 26 (PM)** | `convert_sst.py`, `convert_rain.py`, `spotcheck.py` | Ocean, rain and snow voices; stereo | Cursor, readout, `lib/data.ts` integration | Narration outline (EN/BN) |
| **Sun 27** | `build_context.py`, `build_demo.py` | Mixer, sweep, legend tones, **C1**, **C9** | Keyboard + speech + ARIA, Truth/Mapping/Legend panels, **C2** X-ray, **C7** whisper | Voice-over draft; **core acceptance test (Sun night)** |
| **Mon 28** | `fetch_rain_sequence.py`; commit data to trigger the shared Vercel deploy | GRACE bass + gap silence; FIRMS clicks; Anomaly-Choir dissonance; variability/seasonality mappings | Comparison Player, Place History + scrubbing chart, Provenance drawer, extreme pings + area summary, **Story Mode** | Record Bangla + English narration; rehearse |
| **Tue 29 (AM)** | Final data refresh; spot checks | Mix polish | Bangla toggle, caption bar, Describe mode, accessibility pass; **FREEZE 12:00** | QA checklist run |
| **Tue 29 (PM)** | Support recording | Support recording | Support recording | **Record** screen clips + voice-over |
| **Wed 30** | — | — | — | **Edit, subtitles, check under 4:00 (aim 3:50), upload to YouTube, submit the Google Form** |

**Dependency order (don't start a task before its inputs exist):**
`lut_params → convert_* → grids` → `lib/data.ts` → `frame-view.tsx + lib/audio.ts` → `explore / sweep` → `X-ray, whisper, close-your-eyes` → `time-lapse` → `Story Mode` → `game.tsx (lowest priority, time-permitting)` → `video`.
`context JSON → demo JSON` → `compare-panel.tsx / history-chart.tsx` → `Then vs Now` → `video`.

---

## 13. Definition of done and QA checklist

**Core acceptance (Sun night):**
- [ ] `spotcheck.py`: all 10 SST and 10 rain points PASS (SST within 0.1 °C of the test pipeline; rain within 1% in log terms; phase correct).
- [ ] Cursor readout equals `valueAt()` at 5 random points (manual check against the pipeline printout).
- [ ] Sound responds instantly (T3 standard); no clicks or pops; volume capped.
- [ ] A complete run using the keyboard only: explore, speak a value, switch tracks, sweep.
- [ ] The Truth panel shows exactly the Section 16 wording.
- [ ] No errors in the browser console (Chrome, Edge).
- [ ] Credits visible (footer + README).

**Final QA (Tue 12:00):**
- [ ] Story Mode: every spoken number is read from JSON (no hard-coded numbers).
- [ ] Then vs Now: heat +1.37 °C; GPCP 15.10 → 13.71; GPCC 14.79 → 13.03; GRACE +0.83 → −5.82 cm (Bangladesh), +8.71 → −53.63 cm (NW India).
- [ ] Disclosure panel present on every comparison.
- [ ] Frame date/time visible in every view.
- [ ] Captions and Describe mode work in both languages (Bangla via recorded clips).
- [ ] Deployed URL works on a laptop and an Android phone.
- [ ] Concept-only items are labelled "coming in October".

---

## 14. Video 1 (1 Oct) plan and shot list

**Hard requirements:** max 240 s · team name · **every member named (on screen + voice)** · problem and challenge statement · solution approach · YouTube link in the Google Form by **1 Oct 11:59 PM** (we submit 30 Sep).

| Time | Block | Shot | Feature used |
|---|---|---|---|
| 0:00–0:15 | WHO (hook) | Black screen; ocean + rain sound; "This is today's ocean and rain, as NASA data. Now open your eyes." The frame fades in | C1 |
| 0:15–0:45 | WHO | Team name + each member's name and role over the sonic identity motif; "CSE students from Bangladesh, a monsoon country" | C9 |
| 0:45–1:15 | WHY | The official challenge text on screen; "EIC's visuals are for eyes only. What if you can't see them?" | — |
| 1:15–1:45 | WHY (killer data point) | **Dhaka then vs now:** heat pitch rises (+1.37 °C), monsoon not wetter, GRACE bass sinks, gap silence | 11.5 |
| 1:45–2:45 | WHAT | Story Mode excerpt → Pipeline X-ray ("colour → 28.4 °C → sound") → storm time-lapse → satellite whisper → **Truth panel** (0.85 °C; ~27%) | C3, C2, C4, C7, A3 |
| 2:45–3:15 | SO WHAT NEXT (proof) | **If the game is built in time** (it's lowest priority, see 11.6): a teammate hears a sound and guesses "Warmer or Colder?", score + reveal. **If not ready yet:** a live keyboard-only, eyes-closed moment in Explore mode, values spoken aloud, to make the same point | `game.tsx` (optional) / A5 (fallback) |
| 3:15–3:45 | SO WHAT NEXT (roadmap) | Labelled concepts: check the AI by ear, "Ask the Earth", listening study with blind and low-vision adults, more EIC tracks, NASA–JAXA duet; "What we need: mentors for the study design, contacts with blind and low-vision organisations" | 11.7 |
| 3:45–3:50 | Close | The live app in Bangla mode, playing; tagline | C8 |

**Recording checklist:**
- [ ] Screen recording **with system audio** (e.g. OBS).
- [ ] Separate clean voice-over.
- [ ] Subtitles (EN; BN optional).
- [ ] NASA SVS credit visible.
- [ ] **No copyrighted music** (our sonification is the soundtrack).
- [ ] **No one under 18 on camera.**
- [ ] Every on-screen number matches Section 16.
- [ ] Final length under 4:00.

---

## 15. Credits, licences and AI disclosure

**On screen (footer) and in the README:**
- "Visualizations: NASA's Scientific Visualization Studio (SVS 5101, 4285) for the NASA Earth Information Center."
- "Data: MUR SST (NASA/JPL PO.DAAC); GPM IMERG (NASA/JAXA, GES DISC); GRACE/GRACE-FO JPL mascons RL06.3Mv04 (NASA/JPL PO.DAAC); NASA FIRMS; MODIS MOD13Q1 via ORNL DAAC; NASA GLOBE Program; NASA GISTEMP v4; GPCP v2.3 and GPCC Full Data v2020 (via NOAA PSL)."
- Follow each dataset's own acknowledgement text where one is provided (e.g. GRACE, GPCP).

**Partner-agency note (for the project page):** IMERG comes from the joint NASA–JAXA GPM mission; MUR includes JAXA AMSR2 and EUMETSAT sea-ice inputs; GPCC is from Germany's national weather service (Deutscher Wetterdienst).

**Our code:** MIT licence (public repository, as Space Apps requires).

**Audio:** all sound is generated by our code; no third-party music or samples.

**AI disclosure (project page "Use of AI" section):** list any AI tools used for coding help, writing or translation. Any in-app AI feature (October) is disclosed, and **AI never produces numbers**.

---

## 16. Honesty rules and exact on-screen wording

**Rules:**
1. No number appears unless it comes from our grids, JSON or tests.
2. Anything not working is labelled "concept" or "coming in October".
3. "Real time" = the sound is generated live; the data is near-real-time. The frame time is always shown.
4. Comparisons use multi-year windows; single years are labelled "example years".
5. Don't claim "sound beats sight", "more erratic rain", or any novelty listed in Section 3 as not new.
6. POWER is not used for long-term claims.
7. No bias correction until held-out frames confirm the offsets are stable.

**Exact wording:**

| Where | Text |
|---|---|
| Truth panel (SST) | "Checked against NASA MUR SST: median error 0.85 °C (60 ocean points, one frame)." |
| Truth panel (rain) | "Checked against NASA IMERG (Late run): typically within ~27% (150 rain points, one frame); agreed on where it was raining at every sampled point." |
| Frame label | "EIC frame: [product], [date time UTC]. Sound generated live from this frame." |
| Heat comparison | "Dhaka, April–May: +1.37 °C (NASA GISTEMP, 1981–1990 vs 2016–2025, 10 years each)." |
| Rain comparison | "Dhaka, June–September: not wetter. GPCP −9% (1981–1990 vs 2016–2025); rain gauges (GPCC) −12% (1981–1990 vs 2010–2019)." |
| Water comparison | "Water storage (GRACE): Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm (2003–06 vs 2021–24). Silence = no satellite measurements (Jul 2017–May 2018)." |
| Fires | "Example years, same sensor (MODIS): CHT Mar–Apr 4,954 (2003) vs 4,033 (2023)." |
| GLOBE (teaser) | "Citizen observers vs satellite: two perspectives, not right vs wrong." |
| Earth Ear ID (teaser) | "Comfort check, not a hearing test." |

---

## 17. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Behind schedule on Monday | Drop B3 (FIRMS) and B5/B6 first; keep C4, B2, C3, H1 (they carry the story) |
| SVS feed stalls | Use cached frames; the frame time is always on screen |
| EXR conversion issues on a teammate's PC | Use the converted PNG from Check C |
| Vercel deploy fails | Record from localhost |
| Bangla narration not ready | English narration + Bangla subtitles |
| Time-lapse too heavy | 24 frames instead of 48; lower resolution |
| Browser speech sounds poor | Recorded narration for Story Mode; speech only for live values |
| Rain frame format changes | Re-run the D2 scripts on the new frame before using it |
| Anyone unsure about a number | It doesn't go on screen until checked against Section 16 |

---

## 18. After 1 October: roadmap (mentoring month → 1 Nov video → hackathon)

**Week 1 (evidence + tracks):**
- Held-out bias checks (a second SST and rain frame); apply corrections only if stable.
- Checklist + conversion tests for fires (5113), PM2.5 (5151), near-surface temperature (5147), wind (5148) and rain anomaly (4897).
- Three-way check against GIBS.
- Start blind and low-vision participant recruitment and consent planning with the mentor.

**Week 2 (modes):**
- Full Anomaly Choir, Change Choir, spectral overview.
- Music vs precise mode; raga/style skins (with a musician consultant).
- Uncertainty heard as clarity (MUR `dt_1km_data`).
- Earth Ear ID; the full GLOBE duet.

**Week 3 (AI + partners):**
- "Check the AI by ear" and "Ask the Earth" (tool-calling; numbers only from code; ~50-question benchmark).
- "AI vs Verified" experiment.
- NASA–JAXA GSMaP and UK Met Office OSTIA duets.
- Satellite-pass cues (CelesTrak + satellite.js, checked against published passes).

**Week 4 (study + polish):**
- Listening study: audio-only vs visual-only vs both; identify / compare / trend tasks; sighted and blind/low-vision adults.
- Mapping optimisation on held-out listeners.

**28 Oct:** re-check every feature against the full challenge statement (EIC products, hardware such as kiosk/hyperwall, audience).

**1 Nov:** Video 2 with the full working build and study results.

**Hackathon:** polish, 30-second video, project page.

Full idea catalogue: `JUKEBOX_RESEARCH_AND_BLUEPRINT.md` (Sections 1–26).

---

## 19. Open questions / unknowns

- Exact IMERG Late latency behind the SVS frames (show frame time regardless).
- Whether SVS 5176 is an anomaly product.
- Whether the SST (+0.56 °C) and rain (−0.103 log) offsets are stable across frames.
- Whether listeners can hear the variability → timbre and seasonality → rhythm mappings (pilot in October).
- What the 28 Oct statement adds (hardware? specific EIC products?).
- Local hackathon dates (the global FAQ says 14–15 Nov).

---

## 20. Glossary

| Term | Meaning |
|---|---|
| **EIC** | NASA's Earth Information Center: exhibits and dashboards showing Earth data; its daily visualizations are made by SVS |
| **SVS** | NASA's Scientific Visualization Studio, which publishes the frames we use |
| **Frame** | One image of a visualization at one time |
| **Colorbar / LUT** | The legend mapping colours to values; our lookup table (LUT) reverses it: colour → value |
| **Colorbar inversion** | Converting a pixel's colour back into its physical value |
| **Equirectangular** | A flat world map, twice as wide as tall (longitude → x, latitude → y) |
| **MUR SST** | NASA/JPL's daily ~1 km global sea surface temperature analysis |
| **IMERG** | NASA–JAXA's half-hourly global precipitation estimate (GPM mission) |
| **GRACE / GRACE-FO** | Twin-satellite missions measuring changes in Earth's gravity, which reveal water storage change |
| **FIRMS** | NASA's fire detection service (MODIS, VIIRS satellites) |
| **NDVI** | A vegetation greenness index (0–1) |
| **GISTEMP** | NASA's station-based global temperature record |
| **GPCP / GPCC** | Long-term rainfall records (satellite + gauge / gauge-only) |
| **Reanalysis** | Model output blended with observations (e.g. MERRA-2, which NASA POWER uses) |
| **Anomaly** | Difference from a long-term normal (e.g. vs 1951–1980) |
| **CORS** | A browser security rule; SVS blocks pages from reading its image pixels, hence our pipeline |
| **Honest silence** | Silence wherever there is no data |
| **BLV** | Blind and low-vision |