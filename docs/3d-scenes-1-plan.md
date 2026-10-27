# 3D scenes, pack 1: plan

Four scenes that open from the Turntable's records carousel, built only from data the app already ships. No new datasets, API calls or pipeline changes. They use the same renderer, materials, post chain, chip, dock, drawers, labels and reduced-motion rules as Turntable v3.

Type names are from `src/types/data-contract.ts`. Paths are under `public/data/`.

## Shared frame (all four scenes)

| Piece | How it is built |
| --- | --- |
| Entry | A **Scenes** row in the Turntable's records carousel, below the live records. Each sleeve is a still taken from the scene's own render (`public/textures/scenes/<id>.webp`, captured from the production build). Choosing a scene plays the v3 record swap (needle-drop `change` kind, 1.2 s). The scene then fades in over 0.9 s (eased); under reduced motion this is a cut. The Turntable's loop pauses and its live sound stops while a scene is open. |
| Exit | Esc or **Back to turntable** in the dock. The scene's R3F canvas, geometry and textures are disposed and the Turntable resumes. |
| Renderer | R3F canvas, the v3 Poly Haven HDRI and the v3 post chain. `createPost` gains an option so the atmosphere pass runs only where there is a globe (Ghost Earths); bloom, AgX, vignette, overlay composite and SMAA are shared. Quality tiers are v3's own `resolveTier`. |
| Chip / details | The v3 needle chip's frame (positioning, flip, card, 4 s auto-collapse, pin) is extracted to `ChipFrame` and used by both the Turntable and the scenes. Each scene supplies its own value text and card rows. |
| Dock | Play/Pause, Speed, Back, Layers, Help, built from v3's `DockButton`. |
| Legend | A slim glass bar with a gliding marker: v3's `LegendBar` look with a scene-supplied gradient and ticks. |
| Disclosure | One line under the legend, built from JSON fields (datasets, windows/years, "context layer, not an EIC frame"). |
| Accessibility | Keyboard parity (arrows/WASD move, Enter plays and speaks, Esc leaves); ARIA live announcement on entry and on Enter. Bangla drafts sit beside the existing Turntable drafts, and colours come from `globals.css` tokens (contrast ≥ 4.5:1). Under reduced motion there are no fly-throughs (cuts instead), no particles and no auto-motion. |
| Loading | Each scene is its own `next/dynamic` chunk, and its data loads only when it opens. |

## Scene 1: Ghost Earths (then vs now)

**Reads**

| File | Type | Fields |
| --- | --- | --- |
| `global/manifest.json` | `GlobalManifest` | `disclosure` |
| `global/heat.json`, `rain.json`, `water.json` | `GlobalLayerFile` | `scale`, `month_start`, `n_months`, `grid.lat`, `grid.lon`, `cells`, `units`, `dataset`, `caveat`, `gap_note` |
| `global/heat.i16.gz`, `rain.i16.gz`, `water.i16.gz` | Int16 per contract §14 | cell × month values (`-32768` = no data) |
| `global/places.json` | `GlobalPlacesFile` | `basis` (window definitions shown on screen), `places[]`: `heat_annual_then_now`, `rain_annual_then_now`, `water_then_now`, `rain_confidence`, `*_cell`, `*_same_record_as` |
| `global/confidence.json` | `GlobalConfidenceFile` | `flags[rain cell_id]`, `method` |

**Windows (from `places.json` `basis`)**
- Heat and rain: annual mean, 1981–1990 vs 2016–2025.
- Water: mean of monthly values, 2003–2006 vs 2021–2024.

Per-cell window means use exactly that definition: the mean of the months present in the window. I checked this against the file: Dhaka gives heat 0.18 → 1.43 and rain 7.68 → 6.98, equal to `places.json` at its two-decimal rounding. The build verifies all 42 places × 3 layers. Where a place is named, the chip shows the `places.json` numbers themselves.

**Voices reused (unchanged)**
- Heat: then-vs-now heat pitch, `heat` + `heatDeviation`.
- Rain: `monsoon` density, drops per step.
- Water: the `water` bass on the new shared range (see Scene 2).
- Enter plays window A, then window B, through the existing `playCompare(…, "sequential")`. Heat and rain play one annual value per year (10 + 10 steps), the same basis as the window means. Water plays monthly (48 + 48). Both values are then spoken.

**Real data**
- Per-cell then and now values; the change B − A drives both colour and vertex offset.
- Hollow (discarded) cells where a window has no data.
- The confidence badge on rain.

**Decoration**
- The silver and warm shell materials.
- A dim Blue Marble core for orientation.
- Atmosphere, bloom and stars.

**Fixed, stated scales**
- Surface separation: heat 0.02 R per °C, rain 0.02 R per mm/day, water 0.0008 R per cm (shown on screen, "exaggerated").
- Diverging colour, clamped at heat ±3 °C, rain ±3 mm/day and water ±60 cm:
  - ColorBrewer RdBu (blue = lower, red = higher) for heat;
  - BrBG (brown = lower, teal = higher) for rain and water.
- Wording is numbers only ("0.18 → 1.43 °C, change +1.25"). No "hotter"/"wetter" words.

## Scene 2: The playable delta + aquifer (Bangladesh)

**Reads**

| File | Type | Fields |
| --- | --- | --- |
| `context/grace.json` | `GraceContextFile` | `boxes.Bangladesh` / `boxes.NW_India`: `box_lon_lat`, `months`, `cm` (null = missing), `window_A`, `window_B`, `mean_A`, `mean_B`; `gap_note`, `dataset`, `credit` |
| `sequence/index.json`, `rain_NNN.u8.gz` | `SequenceIndex`, contract §2 | 48 frames, `time_utc`, `step_minutes`, `credit` (decoded by `lib/data/sequence.ts`) |
| `latest/rain.json`, `latest/rain.bin` | `RainMetadata` | the chip's "latest frame" row (through the app's `LiveFields`) |

**Mapping change (approved, build book A3/D1)**
- `water` changes from `runtimeRange` (p5–p95 of each series) to `continuous`: −70…+35 cm (linear) → 80–320 Hz (exponential). This applies to the water voice everywhere (Then vs Now and Place History too).
- Before → after, using the semitone difference between `mean_A` and `mean_B` of each box:
  - Bangladesh: −3.46 → −1.52 semitones.
  - NW India: −20.30 → −14.25 semitones.
  - Ratio NW India / Bangladesh: **5.9× → 9.4×**.
  - The brief expected "about 1.5×" before the change. The file gives 5.9× under the old per-series rule, so I report the measured number.

**Voices reused**
- `water` bass for both boxes on the shared range; Bangladesh first, then NW India.
- `rain` (live drops/s rule) for the IMERG frame under the needle, re-set on every frame.
- `ping` earcon for a river pluck. It is neutral, not a data pitch.

**Missing months**
- There is no "no satellite in orbit" sound yet. Rather than invent one, missing months play the existing **`nodata` tick** earcon, which mapping.json describes as the sound "so silence … is not mistaken for the app freezing".
- The caption for the Jul 2017 – May 2018 run reads `gap_note`.
- This is opt-in for this scene (`CompareSide.gapTexture`). Then vs Now keeps its silence.

**Real data**
- Each box's water-table level for the selected month (shared fixed scale).
- Rain particle density per sequence cell, via `mapVoice("rain", mm/h)` (drops/s) → particles/s.
- The time scrubber (48 frames = 24 h).

**Decoration**
- Relief and colour: GEBCO and Blue Marble crops (see Assets), vertical exaggeration stated on screen.
- River glow and block glass.

**Rivers**
- Natural Earth `rivers.json` has **Ganges** (the Padma in Bangladesh) and **Brahmaputra** (the Jamuna). It has **no Meghna**, so the Meghna is not drawn and the scene says so.
- Rivers are visual only. Their chip reads "River heights: coming (SWOT)".

**Honesty line**
- Box bounds are read from `box_lon_lat`: Bangladesh lon 88–93, lat 20.5–26.7; NW India lon 72–78, lat 26–32.
- "~3° true resolution" comes from `ensemble_bd.json` `voices.water.resolution` ("about 3 deg true resolution").

## Scene 3: Sound terrain, Bay of Bengal

**Reads**

| File | Type | Fields |
| --- | --- | --- |
| `latest/sst.json`, `sst.bin` | `SstMetadata` | `grid`, `frame_time_utc`, `source_dataset`, `credit` (decoded by `decodeSst`) |
| `latest/sst.webp` | display image | NASA SVS's own colormap: the terrain colour is sampled from it |
| `sequence/*` | as Scene 2 | rain sheets and the 24 h loop |

**Region and axis**
- Region: 5–25° N, 78–100° E. Today's grid has 2197 ocean cells (26.89 → 31.19 °C).
- The zoomed axis is the grid's regional min/max rounded outward to whole degrees (**26–32 °C** today). It is computed at load and shown, spoken and captioned, with a "Zoomed axis" badge always visible.
- Height is linear on that axis, at a fixed stated scale.

**Voices**
- `ocean` voice with a new, clearly named engine option `setOceanAxis({min, max} | null)`:
  - `mapContinuous` runs with the rule's own output (220–880 Hz, exponential) over the zoomed input range.
  - mapping.json and the global SST rule are unchanged; `null` restores it. The Mapping panel is untouched.
- Nearby rain:
  - The `rain` drops/s rule per source, through `PannerNode` (`panningModel: "HRTF"`, `rolloffFactor: 0`, so position is direction only and loudness stays the data loudness).
  - Up to 4 nearest wet sequence cells within 1.5°.
- Land is silent: no SST value means no voice.

**Mini-goal: "Find the warmest water"**
- The target is the regional argmax of the grid (today 31.19 °C at 6.50° N, 98.96° E).
- Arriving within that cell gives a sparkle plus the spoken value.
- A quick check confirms target = grid max.

**Real data**: height, colour (sampled from NASA's image), the voice under your feet, rain sheets.

**Decoration**: land relief (GEBCO, exaggeration stated), water sheen, sparkle.

## Scene 4: Dhaka time tunnel

**Reads**

| File | Type | Fields |
| --- | --- | --- |
| `context/gistemp_bd.json` | `GistempContextFile` | `cells.Dhaka.months`, `anom_C`, `lat`, `lon`, `dataset`, `credit` |
| `context/gpcp_bd.json` | `RainContextFile` | `cells.Dhaka.months`, `mm_per_day`, `caveat`, `dataset` |
| `demo/dhaka_then_now.json` | `DhakaThenNowDemo` | `heat.A/B` (`window`, `years`, `values`, `mean`), `heat.caption`, `rain.caption`, `rain.gpcp.change_pct` |

**Rings and beads**
- One ring per year, 1951 → 2026: **76 rings** (GISTEMP runs 1951-01 → 2026-08).
- Ring colour is the year's April–May anomaly = mean(April, May). This is exactly how the demo's `heat.A/B.values` are built: all 20 demo years match to the last digit.
- 12 beads per ring, sized by GPCP mm/day. GPCP starts in 1979-01 and the file ends 2026-06, so earlier and later beads are absent, not zero.
- June carries the "tala wheel" glow, which is decoration.
- The 1981–1990 and 2016–2025 windows are highlighted and labelled from `heat.A.window` / `heat.B.window`.

**Voices**
- `heat` (pitch per year, with the Anomaly Choir bands built into the heat voice) and `monsoon` (drops per month step), together. This uses a new adapter sequence `playYearsAndMonths`, which reuses the existing voice objects.
- The existing heat voice applies the `heatDeviation` bands to every year, not only the windows. The voice is reused unchanged, so the choir sounds wherever a year is unusual. I have not added a windows-only gate.
- At the windows the captions read `heat.caption` and `rain.caption` verbatim ("… not wetter. GPCP −9% …"). The same rule plays with no swell.
- Credit on screen: "Pitch-per-year idea after Daniel Crawford (2013)."

**Controls**
- Speed, pause, scrub by year, and jump to 1981 / 2016.
- At the end the camera lands back on the turntable.

**Real data**: ring colours, bead sizes, the windows and the captions.

**Decoration**: tunnel glow, bloom and the June glow.

## Assets

`scripts/build-scene-textures.mjs` crops the **same GEBCO and Blue Marble sources** v3 already downloads and credits (`node_modules/.cache/earth-textures`). These are basemap textures, not datasets:
- `public/textures/scenes/bd-relief.png` and `bd-colour.webp`: lon 86–95, lat 19–28.
- `public/textures/scenes/bay-relief.png` and `bay-colour.webp`: lon 76–102, lat 3–27.
- Sleeve stills: `public/textures/scenes/<scene>.webp`.

## Dropped or simplified, and why

- **Meghna river**: not in the shipped Natural Earth file, so it is not drawn.
- **"No satellite in orbit" texture**: no such sound exists, so I reuse the `nodata` tick. No new sound and no mapping change.
- **Anomaly Choir "in the two windows" only**: the heat voice applies it to every year, so it is reused as-is.
- **The "~1.5×" before-number**: the data gives 5.9×. Reported as measured.
- **`ensemble_bd.json`, FIRMS and NDVI**: not needed by these four scenes (Scene 2's GRACE and rain come from their own files).
- **Tactile STL export**: bonus, only if all four are done.

## Not in this pack (typed hooks only)

`src/components/Scenes/future.ts` lists each one with a `null` loader and the data it needs:
- Amphan cold scar (MUR + IBTrACS)
- River heights (SWOT)
- NASA × JAXA twin globes (GSMaP)
- Satellite orrery (CelesTrak)
- Forest of three lidars (GEDI/ICESat-2/CMS)
- Dhaka light columns (Black Marble)
- Coral glass (Coral Reef Watch)
- Thunder towers (LIS)
- Snow globe and haze dome (air data)
- Sea-level glass (NASA-SSH, PSMSL)
- Mixing desk

## As built (changes from the plan above)

- **Scene 2, aquifer blocks:** they stand beside the map (east), Bangladesh in front and NW India behind, on one height scale. Directly under the relief, the Bangladesh block was hidden from every useful camera angle. Footprints are each box's own shape scaled to 55% (only the height is data).
- **Scene 2, rain:** NASA's own IMERG frame image (sequence/*.png, cropped to the region) is laid on the land as a decal, so rain is visible with reduced motion too, when there are no particles.
- **Scene 3, legend colours:** taken from the frame itself. Each 0.5 °C band of the zoomed axis gets the mean colour of NASA's SST image over the region's cells in that band. No colormap is reconstructed.
- **Scene 3, terrain:** height is 0.7 scene units per °C (stated on screen as "1 °C = 78 km of height").
- **Scene 4, captions:** the window captions are emitted at 1981 (window label), at 2016 (`heat.caption`) and four years later (`rain.caption`), verbatim from the demo JSON.
- **Bonus, tactile record (STL):**
  - Built in Scenes 2 and 4. The disc is 120 mm across, with the ridge height 0.4–4 mm over the series' fixed range.
  - There are raised ticks every ten years. The label is embossed from a canvas rendering of the dataset name and the years (no font files).
  - The scale is in the file name.
- **Debug hooks (`?debug=1`):** each scene publishes `window.__scene` (what the chip shows, plus actions to move the needle) and `window.__sceneFps`, for the quick checks.
