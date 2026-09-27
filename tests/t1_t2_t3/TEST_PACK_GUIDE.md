# Earth Information Jukebox — Pre-Build Test Pack

**Purpose:** confirm in one sitting that the technology and every data source the prototype needs actually work, so you can start building with no significant open questions.
**Total time:** about 3–4 hours, mostly waiting for downloads. Part A decides *how* the prototype is built. Part B confirms the data layers.

| Part | Test | Question | Time | Needs | Blocks building? |
|---|---|---|---|---|---|
| A | **T1** Browser access | Can a web page read SVS frames and the POWER/GLOBE APIs directly? | 15 min | Nothing | **Yes** (decides the architecture) |
| A | **T2** Frame inventory | Can we list the latest frames and colorbars for every EIC product, and how fresh are they? | 20 min | Nothing | **Yes** |
| A | **T3** Sound responsiveness | Is converted-value → sound instant in the browser? | 30 min | Your SST files from Check C | **Yes** |
| B | **P1** NASA POWER | Bangladesh then vs now: heat, monsoon, sunlight (killer demo A1/A3) | 10 min | Nothing (no key) | Feeds the Video 1 clip |
| B | **P2** FIRMS | Fire counts as percussion, 2003 vs 2023 | 30 min | Free FIRMS MAP_KEY | No |
| B | **P3** GRACE/GRACE-FO | Water-storage bass line + a known-answer check | 30–60 min | Earthdata Login | No |
| B | **P4** MODIS NDVI | Vegetation as a slow voice, then vs now | 20–40 min | Nothing (expected) | No |
| B | **P5** GLOBE | Public read access; how many citizen observations in Bangladesh? | 15 min | Nothing (expected) | No |
| C | **D2** Rain inversion | IMERG frame → real mm/h | 3–4 h | See `JUKEBOX_D2_RAIN_GUIDE.md` | No (run during the build) |

---

## STEP 0 — Setup (15 min)

1. Make a folder `test_pack` and put **all files from this pack** in it. Copy `sst_frame.png` and `sst_colorbar.png` from your Check C folder into it too.
2. Install packages (skip any already installed):
   ```
   python -m pip install earthaccess xarray h5netcdf numpy pandas pillow matplotlib
   ```
3. **FIRMS MAP_KEY:** open https://firms.modaps.eosdis.nasa.gov/api/area/, click **"request free MAP_KEY"**, and enter your email. Paste the key into `p2_firms.py` where it says `PASTE_YOUR_MAP_KEY`.
4. Paste this into `notes.txt` **before running anything** (change numbers now if you want, never after):

```
PRE-WRITTEN RULES
T1 PASS: SVS frame pixels readable in the browser (fetch OR crossOrigin image).
         FAIL -> use a nightly data pipeline (not a failure of the project).
T2 PASS: frame folders + colorbar found for 5101 and 4285; newest daily frame <= 3 days old.
T3 PASS: average handler <= 5 ms; audio baseLatency <= 50 ms; sound feels instant.
         Whole-frame conversion > 3 s -> precompute value grids (design choice, not a failure).
P1 PASS: POWER returns 1981 -> within 7 days of today; meteorology missing < 1%; response < 60 s.
         (The heat/rain numbers are FINDINGS, not pass/fail.)
P2 PASS: MAP_KEY works; MODIS_SP returns detections for both 2003 and 2023.
P3 PASS: lwe_thickness readable; record 2002 -> 2025+; Jul 2017–May 2018 gap present;
         KNOWN ANSWER: NW India trend is negative. If not negative -> pipeline suspect, stop and report.
P4 PASS: NDVI returned for >= 2 points in both windows, values between 0 and 1.
P5 ACCESS PASS: GLOBE search works without a key.
   LOCAL: >= 20 Bangladesh records in the window -> local duet; otherwise use global matched archive.
```

---

## PART A — Technical tests

### T1 — Can a browser read SVS and the APIs? (15 min)
1. In the terminal, inside `test_pack`, run: `python -m http.server 8000`
2. In Chrome or Edge, open **http://localhost:8000/t1_cors_test.html**. Don't double-click the file; it must be opened through the local server.
3. Click **Run test**, wait for all rows, then click **Copy results**.

**You should see** one row per URL with PASS or FAIL for "fetch" and "image pixels". Six URLs are prefilled: the SST colorbar, an IMERG frame, the SVS API, an SVS frame folder, a POWER API call and a GLOBE API call.

**What it means:**
- **Images PASS:** the browser can convert frames itself.
- **Images FAIL:** we use a nightly pipeline (a scheduled job converts frames into small value files; the site plays those). **This is normal and planned for.**
- **POWER/GLOBE fetch FAIL:** those calls go through the same pipeline or a tiny proxy.

> Paste: the copied results.

### T2 — Latest frames and colorbars for every EIC product (20 min)
Run: `python t2_frame_list.py`

**You should see:**
- For each of 14 EIC products: title, number of frame folders, colorbar files, the newest frame's date and its age in days.
- At the end, a **SUMMARY** table.
- A saved `frame_inventory.json`.

**If different:**
- `API FAILED` for some IDs is fine for a few; if it fails for all, paste the output.
- 0 frame folders for 5101 or 4285 → paste the output (we'll find the frame URLs another way).
- Age of 5+ days on a daily product → note it: that feed may have stalled.

> Paste: the SUMMARY table.

### T3 — Is the sound instant? (30 min)
1. With the server still running, open **http://localhost:8000/t3_audio_latency.html**.
2. **Frame image:** choose `sst_frame.png`. **Colorbar:** choose `sst_colorbar.png`.
3. Enter the same START / END / ACROSS numbers you used in `s2_build_lut.py`. Keep min −5, max 35, scale linear, unit °C.
4. Click **Build lookup**, then **Convert whole frame (timed)**.
5. Click **Start sound**. Move the mouse over the ocean for about 30 seconds, then click the map and use the arrow keys and **Enter** (it should speak the value).
6. Click **Sweep this row (5 s)** once.
7. Click **Copy results**.

**You should see:**
- The readout shows sensible temperatures (e.g. about 28–30 °C in the tropics, "No data" on land).
- The pitch follows the mouse with no noticeable delay.

> Paste: the copied results, and one sentence on how the delay *felt*.

---

## PART B — Data tests

### P1 — NASA POWER: Bangladesh then vs now (10 min)
Run: `python p1_power.py`

**You should see:**
- One line per parameter with first and last date and % missing. Meteorology starts 1981; sunlight starts 1984, so it shows some missing, which is expected.
- **A1 HEAT** (Apr–May, 1981–1990 vs 2016–2025): mean daily max, days ≥ 35 °C, days above the old 90th percentile, and mean wet-bulb temperature.
- **A3 MONSOON** (Jun–Sep): rainy days, extreme days, mean rain and day-to-day spread.
- **A15 SUNLIGHT**: average sunlight at the surface, 1984–1993 vs 2016–2025.
- Files `power_dhaka.json` (ready for the prototype) and **`p1_heat_then_vs_now.wav`**. Listen to it: the first half is the old decade, the second half is the recent one.

**Important:** the numbers are *findings*. Whatever they show, that's the honest result. POWER is a 0.5° reanalysis grid cell (about 50 km), not a Dhaka weather station; say so on screen.

> Paste: the full printed output, and whether the difference is audible in the WAV.

### P2 — FIRMS fires as percussion (30 min, mostly automatic)
Run: `python p2_firms.py` (after pasting your MAP_KEY).

**You should see**, for the Chittagong Hill Tracts (Mar–Apr) and Punjab (Oct–Nov), in 2003 (MODIS), 2023 (MODIS) and 2023 (VIIRS):
- the total number of fire detections, the busiest day, and the summed fire radiative power (FRP);
- saved `firms_cases.json` plus two WAVs (2003 vs 2023, MODIS only, so it's the same sensor).

**Note:** VIIRS usually detects more fires than MODIS because it has finer pixels. That's why the fair then-vs-now comparison is MODIS vs MODIS.

**If different:** an error mentioning the key → check it's pasted correctly; a transaction-limit message → wait 10 minutes and re-run.

> Paste: the printed lines.

### P3 — GRACE/GRACE-FO bass line (30–60 min, mostly downloading)
Run: `python p3_grace.py`. It asks for your Earthdata login if needed.

**You should see:**
- A dataset summary; `lwe_thickness` in cm.
- For **Bangladesh** and **NW India**: months covered (from 2002), the missing months, whether the **Jul 2017–May 2018 gap** is present, the linear trend in cm/yr, and the window means.
- `grace_boxes.json` and `p3_grace_bangladesh_bassline.wav`. Gaps play as silence (honest silence).
- **Known-answer check:** the NW India trend should be **negative** (groundwater depletion there is documented). If it isn't, stop and paste the output.

**If different:** "empty box" → paste the dataset summary; a download error → re-run (earthaccess resumes).

> Paste: everything after the dataset summary.

### P4 — MODIS NDVI slow voice (20–40 min)
Run: `python p4_ndvi.py`

**You should see**, for Sundarbans, Madhupur forest and Dhaka city (a *control*: little vegetation):
- the number of available dates;
- for 2001–2003 and 2021–2023: mean NDVI and the seasonal range;
- `ndvi_points.json` and `p4_ndvi_sundarbans_then_vs_now.wav`.

**If different:** "Unexpected response format" → paste the printed text (the service format may differ; we'll switch to NASA AppEEARS). Timeouts → re-run.

> Paste: the printed output.

### P5 — GLOBE citizen observations (15 min)
Run: `python p5_globe.py`

**You should see**, for each candidate protocol:
- "ACCESS OK without key", or an HTTP error (some protocol names may not exist; that's expected);
- for working ones: records worldwide in the window and **how many fall in Bangladesh**;
- the example field names, and a saved `globe_summary.json`.

> Paste: the printed output.

---

## FINAL CHECKPOINT — paste this block into the chat

```
T1: [copied results]
T2: [SUMMARY table]
T3: [copied results] + how the delay felt
P1: [full output] + audible? yes/no
P2: [printed lines]
P3: [output after dataset summary]
P4: [output]
P5: [output]
Anything that failed or surprised you:
```

## What happens after

| Result | Decision |
|---|---|
| T1 images PASS + T3 PASS | Browser-first prototype: frames are converted live in the page |
| T1 images FAIL, or T3 conversion slow | Nightly pipeline: converted value grids are served with the site (planned default) |
| T2 shows a stalled feed | Show the frame date on screen; cache the latest frames |
| P1 PASS | The Bangladesh then-vs-now clip goes into Video 1 (labelled "context layer: NASA POWER") |
| P2–P4 PASS | Fires, water storage and vegetation become context voices in October |
| P3 known-answer FAILS | Fix the GRACE pipeline before using it anywhere |
| P5 LOCAL | GLOBE duet uses Bangladesh observations; otherwise the global matched archive |
