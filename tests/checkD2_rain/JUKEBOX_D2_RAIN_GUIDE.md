# Jukebox Check D2 — Can the IMERG rain frame be turned back into real rain rates?

**Time:** about 3–4 hours · **Folder:** make a new folder `rain_check` and put the 5 scripts (`d1`–`d5`) in it.

This is the same idea as Check C (sea surface temperature), with three differences:

1. **The scale is logarithmic** (0.1 → 50 mm/hour). The scripts handle this.
2. **There are two colorbars**, liquid (rain) and frozen (snow). The scripts use both.
3. **The frame has transparency.** No rain = fully transparent. The white-background and black-background versions of each colorbar let the script work out how transparent each colour is.

Do one step at a time. Each step says **what to do**, **what you should see**, and **what to do if it's different**.

---

## R0 — Rules (already written, don't change after seeing results)

```
Check D2 PASS:
  - rain/no-rain agreement between frame and IMERG >= 90% of sampled points, AND
  - for raining points, median |log10(frame rate / IMERG rate)| <= 0.15
Check D2 KILL: fails after one allowed diagnostic re-run.
```

---

## R1 — One-time Earthdata setting for IMERG (5 min)

IMERG files come from NASA's **GES DISC** archive. It needs a one-time approval in your Earthdata account, otherwise downloads fail with an "unauthorized" error.

1. Log in at **https://urs.earthdata.nasa.gov**.
2. Go to **Applications → Authorized Apps**, then **Approve More Applications**.
3. Search for **NASA GESDISC DATA ARCHIVE** and click **Approve**. Accept the terms if asked.

**You should see:** "NASA GESDISC DATA ARCHIVE" in your list of authorized apps.

---

## R2 — Download the files and inspect the frame (20 min)

1. Download the frame you found:
   `https://svs.gsfc.nasa.gov/vis/a000000/a004200/a004285/frames/3600x1800_2x1_30p/flatalpha/imergert_alpha.2026-09-17T00:00:00Z.png`
   **Rename it to `rain_frame.png`.** The original name contains colons, which Windows doesn't allow.
2. Download all four colorbars from the 4285 page into the same folder, keeping their names:
   - `rainbarwhite2.png`
   - `rainbarblack2.png`
   - `snowbarwhite2.png`
   - `snowbarblack2.png`
3. Run:

```
python d1_inspect_rain_frame.py
```

**You should see:**
- `Mode: RGBA` and `Size: 3600 x 1800`.
- A large share of **fully transparent** pixels (most of the Earth isn't raining at any moment), and some visible ones.

**If different:**
- Mode is `RGB` (no transparency) → you downloaded a non-`flatalpha` version. Re-download from the `flatalpha` folder.
- Size isn't 3600 × 1800 → paste the output here.

---

## R3 — Build the two colour lookups (40 min)

**3a. Find the colour strip in the colorbar.** Open the liquid black-background colorbar with coordinates showing:

```
python -c "from PIL import Image; import matplotlib.pyplot as plt; plt.imshow(Image.open('rainbarblack2.png')); plt.show()"
```

Hover the mouse and note:
- `START`: x where the colour strip begins (the 0.1 end);
- `END`: x where it ends (the 50 end);
- `ACROSS`: a y through the middle of the strip, **avoiding any tick marks** that cross it.

Then check `rainbarwhite2.png` the same way. The strip should sit at the **same** pixel positions. Repeat for `snowbarblack2.png` and `snowbarwhite2.png`; their positions may differ from the rain bars.

**3b. Check the log scale.** Note the x positions of the **1** and **10** tick labels on the rain bar, then compute:
- `(x_of_1 − START) / (END − START)` → should be about **0.37**
- `(x_of_10 − START) / (END − START)` → should be about **0.74**

Write both numbers in `notes.txt`. If they're far off (by more than about 0.05), the scale isn't a simple log scale from 0.1 to 50. **Stop and paste the numbers and a screenshot of the colorbar.**

**3c. Edit `d2_build_rain_luts.py`.** In the `BARS` section, replace the three zeros on each line with your START, END and ACROSS values. Set `ORIENTATION` if the bars are vertical.

**3d. Run:**

```
python d2_build_rain_luts.py
```

**You should see** for both `liquid` and `frozen`:
- `strip length` of a few hundred px;
- `opacity` numbers between 0 and 1. The low end may be below 1 (light rain drawn faint); the high end should be about 1.0;
- `Liquid colours that are within 10 units of a frozen colour:` 0 or small;
- `Saved rain_luts.npz`.

**If different:**
- `white and black strips have different sizes` → the START/END/ACROSS values don't fit one of the files. Recheck 3a.
- Opacity values all near 0 → the white and black files are swapped, or the ACROSS row misses the strip. Recheck.
- Many liquid colours close to frozen colours → rain and snow can't be told apart by colour. Note it and continue.

---

## R4 — Sample points from the frame (5 min)

```
python d3_sample_rain_points.py
```

**You should see:**
- `Saved 300 points (150 rain, 150 dry)`;
- `Rain points whose colour was NOT close to either colorbar:` 0 or a small number;
- a split between liquid and frozen (mostly liquid is normal);
- a table where `frame_rate` ranges from about 0.1 to tens of mm/h, and `match_dist` is mostly small (under about 5).

**If different:**
- Many rain points not close to either colorbar (e.g. more than 20) → paste the output. The colours may be blended differently than expected.

---

## R5 — Get the real IMERG values (15–30 min, mostly downloading)

The frame is labelled 17 Sep 2026, 00:00 UTC. We don't know whether it shows the half-hour **starting** at 00:00 or the one **ending** at 00:00, nor whether it uses IMERG **Early** or **Late**. So the script tests all four combinations and finds the best match. Each file is small (tens of MB).

```
python d4_get_imerg.py
```

It asks for your Earthdata login if needed.

**You should see:**
- For each of 4 labels, a filename like `3B-HHR-E.MS.MRG.3IMERG.20260917-S000000-E002959....HDF5` (E = Early, L = Late).
- `grid check: lon -179.95..179.95 (3600), lat -89.95..89.95 (1800)`.
- `Saved rain_points_with_imerg.csv`.

**If different:**

| Symptom | Likely cause | What to do |
|---|---|---|
| 401 / unauthorized | GES DISC not approved | Do R1, then re-run |
| `no file found` for some labels | That run/time not available | Fine if at least one label works |
| Grid check shows different numbers | Different grid layout | **Paste the output. Don't continue**; the point positions would be wrong |
| `KeyError` about `probabilityLiquidPrecipitation` | That field is named differently in this version | Paste the output. Only the snow/rain check is affected |
| Any other error | — | Paste the last 20 lines |

---

## R6 — Compare and verdict (5 min)

```
python d5_compare_rain.py
```

**You should see:**
- A table with one row per candidate:
  - `agreement` — rain/no-rain agreement;
  - `dry_ok` / `rain_ok` — agreement for each group;
  - `median_abs_log` — typical size of the error;
  - `median_log_bias` — whether the frame reads high or low; 0.1 means about 26% high;
  - `phase_agreement` — rain vs snow agreement.
- `Best match: ...` and `RESULT vs your thresholds: PASS` or `FAIL`.
- Files `rain_compare.png` (points should hug the dashed line) and `rain_worst5.csv`.

**How to read it:**
- **PASS, with one candidate clearly better than the others** → the method works for rain, and we also learn which IMERG run and time the frame uses.
- **FAIL, with `median_log_bias` about equal to `median_abs_log`** (all errors the same direction) → probably colorbar ends or orientation. One diagnostic re-run is allowed after rechecking R3.
- **FAIL on `rain_ok`** (frame shows rain where IMERG says dry) but good `median_abs_log` → probably a time mismatch. Report; don't tune.
- **All four candidates look equally bad** → alignment or product mismatch. Report.

> **CHECKPOINT D2 — paste into chat:**
> 1. Full output of `d5_compare_rain.py`
> 2. `rain_compare.png`
> 3. Contents of `rain_worst5.csv`
> 4. Outputs of `d2` and `d3`, and your two log-scale numbers from 3b
