# Earth Information Jukebox — Kill-Check Guide

**Version:** 23 Sep 2026 · **Total time:** about 5–6 hours · **Decision date:** evening of 25 Sep

This guide tests the Jukebox's riskiest assumptions. Do one step at a time. Each step says **what to do**, **what you should see**, and **what to do if you see something different**. At each **CHECKPOINT**, paste the requested output into the chat and wait for the decision before continuing.

The checks run cheapest-first, so a fatal problem shows up before you spend hours:

| Check | Question | Time | Code? |
|---|---|---|---|
| A | Has someone already built it? | 45–60 min | No |
| B | Are the frames free to reuse? | 15 min | No |
| C | Can an EIC frame be turned back into real values accurately? (sea surface temperature) | 3–4 h | Yes |
| D | Does a second EIC visualization qualify for the same test? | 30 min | No |

A fourth check (a short listening test with 5 adults) comes later, only if A–D pass. I'll give you a separate guide for it.

---

## STEP 0 — Before you start (30 min)

### 0.1 Write down your pass/fail rules first (5 min)

Create a folder called `jukebox_check`. Inside it, create `notes.txt` and paste this block into it. You may change the numbers **now**. Do not change them after you see results.

```
PRE-WRITTEN RULES (written on: ____ )
Check A KILL: a public tool already turns EIC/SVS visualization frames into sound
             AND checks the values/sound against the source dataset.
Check B KILL: the frames cannot be redistributed in a public repo or shown in our videos.
Check C PASS: for the best-matching date, median |error| <= 1.0 C
             AND 90th-percentile |error| <= 2.0 C, with at least 45 of 60 points usable.
Check C KILL: still FAIL after one allowed diagnostic re-run.
Check D KILL: none of the checked second visualizations has frames + a numeric colorbar
             + a named source dataset.
```

Why 1 °C: the colorbar spans 40 °C (−5 to 35), so 1 °C is 2.5% of the scale. This is our own choice of "faithful enough" for sound, not an official standard.

### 0.2 Create an Earthdata Login account (5–10 min)

1. Go to **https://urs.earthdata.nasa.gov** and register (free).
2. Confirm your email.
3. Write your username in `notes.txt`. Never write the password there.

**You should see:** you can log in at that site.

### 0.3 Install Python packages (10–15 min)

1. Open a terminal (Windows: "Command Prompt" or "PowerShell").
2. Check Python: `python --version`. **You should see** 3.10 or newer. On Mac/Linux, use `python3` instead of `python` everywhere in this guide.
3. Install the packages:

```
python -m pip install earthaccess xarray h5netcdf numpy pillow pandas matplotlib
```

**You should see:** "Successfully installed ..." at the end, with no red "ERROR" lines.
**If different:** copy the last 20 lines of the error into the chat.

4. Put the five script files (`s1_...py` to `s5_...py`, provided with this guide) into `jukebox_check`. Their full text is also at the end of this guide.

---

## CHECK A — Has someone already built it? (45–60 min, no code)

We are looking for **one specific thing**: a public tool that turns **EIC or SVS visualization frames** into sound **and** checks that against the source data. Ordinary space sonification (pictures of nebulae turned into music) does **not** count; we already know lots exists.

### Step A1 — GitHub (20 min)

Go to **https://github.com/search**. Search each of these, choosing **Repositories**:

1. `"Earth Information Center" sonification`
2. `earth information jukebox`
3. `space apps 2026 jukebox`
4. `svs.gsfc.nasa.gov sonification`
5. `sea surface temperature sonification`
6. `colorbar sonification` and `colormap inversion sonification`

For every result that looks related, write a row in `notes.txt`:

```
name | link | uses EIC/SVS frames? (Y/N) | converts colours to real values? (Y/N) | checks against source data? (Y/N) | last updated
```

**You should expect:** a few general sonification repos and possibly 1–2 Space Apps 2026 teams. Most will convert data series or raw pixels, not EIC frames via a colorbar.

### Step A2 — Web search (15 min)

In Google, search:

1. `"Earth Information Center" sonification`
2. `"Earth Information Center" sound data`
3. `NASA Earth data sonification sea surface temperature`
4. `earth.gov sonification`

Add related results to the same table.

### Step A3 — NASA's own work (10 min)

1. Open **https://svs.gsfc.nasa.gov** and use the site search for `sonification`. Note any result that uses **Earth** (not astronomy) data.
2. Open **https://earth.gov** (the EIC's public site) and look for anything about sound or audio.
3. Note whether NASA already offers a sonified version of any **daily-updated** EIC visualization.

### Step A4 — 2026 Space Apps teams (10 min)

Open **https://www.spaceappschallenge.org/2026/find-a-team/** and search `jukebox`. Note how many teams are listed and anything they say about their approach.

### What the result means

- **KILL:** at least one row has Y in all three columns (uses EIC/SVS frames, converts colours to values, checks against source data).
- **CONTINUE:** anything else, including tools that do only one or two of the three.

> **CHECKPOINT A — paste into chat:** your table, plus the number of 2026 "jukebox" teams you saw.

---

## CHECK B — Can we reuse the frames? (15 min, no code)

### Step B1 — The SST visualization page

1. Open **https://svs.gsfc.nasa.gov/5101/**.
2. Scroll to the bottom: find the **credits** section and any text about **usage**, **copyright** or **licensed** material.
3. Copy that text into `notes.txt`.

### Step B2 — SVS general policy

1. On the SVS site, find the page about **usage/credits/copyright**. Check the footer links or the "Help" page at https://svs.gsfc.nasa.gov/help/.
2. Copy the key sentence(s) into `notes.txt`.

**You should expect:** material is free to use, with a request to credit NASA's Scientific Visualization Studio. Exceptions usually concern licensed music, which we don't use.

- **KILL:** the page says the frames cannot be redistributed or reused publicly.
- **CONTINUE:** free to use, even if credit is required.

> **CHECKPOINT B — paste into chat:** the copied usage/credit text.

---

## CHECK C — Can an EIC frame be turned back into real temperatures? (3–4 h)

**The idea:** the EIC sea-surface-temperature (SST) picture colours the ocean using a colorbar from −5 to 35 °C, and is made from the MUR SST dataset. If we read a pixel's colour, look it up on the colorbar, and get a temperature close to the real MUR value at that spot on that date, then our Jukebox plays *real data*, not just colours.

### Step C1 — Download the frame and the colorbar (30 min)

1. Open **https://svs.gsfc.nasa.gov/5101/** (title: "Sea Surface Temperature (SST) - Near Real Time").
2. The page has several versions. Find:
   - **(a) the equirectangular version with NO datestamp.** Look for its frames link or the "most recent" still image. Prefer the **largest PNG or TIF** (ideally 4096 × 2048). Avoid JPG if a PNG/TIF exists.
   - **(b) the datestamped version** (same picture with the date printed on it). You need it only to read the date.
   - **(c) the colorbar image.** Usually a separate small image with numbers from −5 to 35.
3. If there is a frames folder, download the **last** (highest-numbered) frame of (a) and the **last** frame of (b). They show the same, most recent day.
4. **Helpful:** open **https://svs.gsfc.nasa.gov/api/5101** in your browser. If it works, it lists every file with its full link. Search the page (Ctrl+F) for `colorbar`, `frames` and `.png`.
5. Save the files in `jukebox_check` with these names:
   - frame (a) → `sst_frame.png`. If it's a JPG, save it as `sst_frame.jpg` and change `FRAME = "sst_frame.png"` to `sst_frame.jpg` in `s1`, `s3`.
   - colorbar (c) → `sst_colorbar.png`
6. In `notes.txt` write:
   - the date shown on frame (b);
   - the file names, formats and pixel sizes you downloaded;
   - the colorbar's end labels and units exactly as printed.

**You should see:** a flat world map (not a globe) about twice as wide as it is tall, and a colorbar labelled −5 to 35 °C.

**If different:**
- If you can't find a colorbar image, or the only frames are a rotating globe or a video, **stop here** and report. That is itself decision-relevant.
- If only JPG exists, continue but note it; JPG compression adds some error.

### Step C2 — Check the map layout (10 min)

In the terminal, go into the folder (`cd path\to\jukebox_check`) and run:

```
python s1_inspect_frame.py
```

**You should see:**
- `Size: 4096 x 2048` (or another size where width = 2 × height).
- The three **OCEAN** lines show colourful RGB values (blues, greens, oranges).
- The three **LAND** lines (Sahara, Dhaka, Australia) all show the **same neutral colour** (for example grey, black or white).

**If different:**
- An OCEAN line shows the land colour, or a LAND line shows a sea colour → the map is not a full-globe equirectangular map, or it's shifted. **Stop and paste the output.**
- Width is not 2 × height → paste the output.

### Step C3 — Build the colour → temperature lookup (30 min)

**3a. Find the colour strip's pixel positions.** Run:

```
python -c "from PIL import Image; import matplotlib.pyplot as plt; plt.imshow(Image.open('sst_colorbar.png')); plt.show()"
```

A window opens. Move your mouse over the image; the bottom-right corner shows `x=... y=...`.
- Note the **x where the colour strip starts** (cold end) and **where it ends** (warm end), ignoring borders.
- Note a **y through the middle** of the strip.
- If the strip is vertical, note the **y** start and end and an **x** through the middle instead.

**3b. Check the labels.**
- Are the numbers evenly spaced (e.g. −5, 0, 5, 10 ... 35 at equal distances)? Write yes/no in `notes.txt`.
- If **no**, the scale isn't linear. **Stop and paste a screenshot of the colorbar.**

**3c. Edit `s2_build_lut.py`** (open it in Notepad or VS Code) and set:
- `ORIENTATION` (`"horizontal"` or `"vertical"`)
- `START`, `END`, `ACROSS` (the numbers from 3a)
- `VMIN, VMAX` (the end labels, normally `-5.0, 35.0`)

**3d. Run:**

```
python s2_build_lut.py
```

**You should see:**
- `Strip length:` a few hundred pixels, and `distinct colours in strip:` roughly 50 or more.
- `Pixels whose colour also appears far away in the strip: 0` (or a very small number).
- `Saved lut.npz`.

**If different:**
- Distinct colours under ~20 → the colorbar has few steps, so precision will be low. Continue, but note it.
- Many far-away repeats → the colormap reuses colours, so inversion is ambiguous. **Paste the output.**
- The printed cold-end colours look warm (reds) → orientation is flipped. Swap START and END, or check ORIENTATION.

### Step C4 — Read 60 ocean points from the frame (10 min)

Run:

```
python s3_invert_points.py
```

**You should see:**
- `Saved 60 points to points.csv`.
- `Ocean-looking pixels rejected because colour not on colorbar:` a small number (0 to about 15).
- A small table where `frame_temp_C` ranges roughly from about 0 to 30, and `colour_dist` is mostly 0–5 for PNG (up to ~15 for JPG).

**If different:**
- Many rejections (e.g. over 50), or `colour_dist` often above 15:
  - Common with JPG files. Change `MAX_COLOUR_DIST = 20` to `35`, re-run once, and note that you did.
  - If still bad, paste the output.
- Temperatures that make no sense (e.g. all about −5 or all about 35) → colorbar settings are wrong; recheck Step C3.

### Step C5 — Get the real MUR temperatures (30–90 min, mostly waiting)

**5a. Choose 3 candidate dates.**
- Take the date printed on the datestamped frame (Step C1), plus one day before and one day after.
- If you couldn't read a date, use yesterday, 2 days ago and 3 days ago.

We test three dates because the frame's exact date can be off by one day; the script finds the best match.

**5b. Edit `s4_get_mur.py`:** set `CANDIDATE_DATES`, and set `W, H` to the size from Step C2 if it isn't 4096 × 2048.

**5c. Run:**

```
python s4_get_mur.py
```

It asks for your Earthdata **username and password** the first time.

**You should see**, for each date:
- `using 2026....-JPL-L4_GHRSST-SSTfnd-MUR-GLOB-v02.0-fv04.1.nc`
- then 60 dots appearing one by one
- then `done`

At the end: `Saved points_with_mur.csv`.

**If different:**

| Symptom | Likely cause | What to do |
|---|---|---|
| `no MUR file found` for the newest date | Near-real-time file not published yet | Fine, as long as the other dates work |
| Login / 401 error | Wrong credentials | Check username/password at urs.earthdata.nasa.gov; re-run |
| Dots appear extremely slowly (over 30 min for one date) | Streaming is slow on your connection | Stop with Ctrl+C, set `MODE = "download"` (downloads each full file, several hundred MB), re-run |
| Any other error | — | Paste the last 20 lines |

### Step C6 — Compare and get the verdict (10 min)

Run:

```
python s5_compare.py
```

**You should see:**
- A table with one row per date and method (`centre` = the single MUR value at the pixel centre; `box` = the average over the pixel's area), sorted by `median_abs`.
- `Best match: ...` and `RESULT vs your thresholds: PASS` or `FAIL`.
- Files `compare.png` (points should hug the dashed diagonal line) and `worst5.csv`.

**How to read it:**
- **PASS, and the best date's error is clearly lower than the other dates** → the method works; the date match is also a sign we're comparing like with like.
- **FAIL with `bias` about equal to `median_abs`** (all errors the same sign) → probably a colorbar setting (ends, orientation) or a non-linear scale. You may do **one** diagnostic re-run after rechecking Step C3. Note what you changed.
- **FAIL, but the worst points are near coasts or sharp fronts** → pixel size or smoothing. Report; don't tune.
- **FAIL everywhere, and no date is clearly best** → date or map-alignment mismatch. Report.
- **Fewer than 45 usable points** (`n` column) → too many points fell on land or missing data. Report.

**Do not** change the thresholds in `s5_compare.py` after seeing the results.

> **CHECKPOINT C — paste into chat:**
> 1. The full printed output of `s5_compare.py`
> 2. The `compare.png` image
> 3. The contents of `worst5.csv`
> 4. From `notes.txt`: file formats and sizes, the frame date, whether the colorbar was linear, and any re-runs you did

---

## CHECK D — Does a second EIC visualization qualify? (30 min, no code)

A jukebox needs more than one track. Before we write code for a second one, we check which candidates are even testable.

1. Open **https://svs.gsfc.nasa.gov/gallery/daily-visualizations/**.
2. Open the **IMERG precipitation** visualization and **one GEOS-CF air-quality** visualization (for example PM2.5 or ozone).
3. For each, fill in this checklist in `notes.txt`:

```
Title + page link:
Flat map, 2:1 (equirectangular)? (Y/N)
Version WITHOUT datestamp? (Y/N)
Colorbar image with numbers? (Y/N)  Range + units:
Colorbar ticks evenly spaced (linear) or like 0.1, 1, 10 (log)?
Source dataset named on the page? Name + link:
Updated daily? (Y/N)
Anything drawn on top of the data (labels, hatching, transparency, basemap)?
```

- **KILL (for the Jukebox as a multi-dataset idea):** neither candidate has frames + a numeric colorbar + a named source.
- **CONTINUE:** at least one does. I'll then give you the exact script for its source data, since each dataset is read differently.

> **CHECKPOINT D — paste into chat:** both filled checklists.

---

## Final report template (if you do everything in one go)

```
CHECK A: KILL / CONTINUE — table:
CHECK B: KILL / CONTINUE — usage text:
CHECK C: PASS / FAIL — s5 output, compare.png, worst5.csv, notes (formats, date, linear?, re-runs)
CHECK D: checklists for IMERG + GEOS-CF item
Time spent per check:
Anything surprising:
```

---

## Appendix — full script texts

In case the attached files are missing, copy each block into a file with the given name.

### s1_inspect_frame.py
```python
# Step 5: inspect the SST frame and check the map layout
import sys
from PIL import Image
import numpy as np

FRAME = "sst_frame.png"          # <- change if your file has another name

img = Image.open(FRAME).convert("RGB")
a = np.asarray(img)
H, W = a.shape[:2]
print(f"Size: {W} x {H}  (expect 4096 x 2048, i.e. width = 2 x height)")

def px(lat, lon):
    x = int((lon + 180) / 360 * W)
    y = int((90 - lat) / 180 * H)
    return min(max(x, 0), W - 1), min(max(y, 0), H - 1)

tests = [
    ("Open Atlantic (0N, 30W) - should be OCEAN colour", 0, -30),
    ("Open Pacific (0N, 150W) - should be OCEAN colour", 0, -150),
    ("Indian Ocean (15S, 80E) - should be OCEAN colour", -15, 80),
    ("Sahara (23N, 13E) - should be LAND colour", 23, 13),
    ("Dhaka (23.7N, 90.4E) - should be LAND colour", 23.7, 90.4),
    ("Central Australia (25S, 134E) - should be LAND colour", -25, 134),
]
for name, lat, lon in tests:
    x, y = px(lat, lon)
    print(f"{name}: pixel ({x},{y}) RGB = {tuple(int(v) for v in a[y, x])}")

flat = a.reshape(-1, 3)
uniq = np.unique(flat[:: max(1, len(flat)//2_000_000)], axis=0)
print(f"Distinct colours (sampled): {len(uniq)}")
```

### s2_build_lut.py
```python
# Step 6: turn the colorbar image into a colour -> temperature lookup table
from PIL import Image
import numpy as np

COLORBAR = "sst_colorbar.png"   # <- your colorbar file
ORIENTATION = "horizontal"      # "horizontal" (cold on left) or "vertical" (cold at bottom)
START = 0     # pixel where the colour strip starts (x for horizontal, y for vertical)
END = 0       # pixel where the colour strip ends
ACROSS = 0    # a row (horizontal) or column (vertical) through the MIDDLE of the strip
VMIN, VMAX = -5.0, 35.0   # labels at the two ends of the strip (deg C)

if END <= START:
    raise SystemExit("Set START, END and ACROSS first (see the guide).")

a = np.asarray(Image.open(COLORBAR).convert("RGB")).astype(int)
if ORIENTATION == "horizontal":
    colours = a[ACROSS, START:END + 1]
else:
    colours = a[START:END + 1, ACROSS][::-1]   # flip so index 0 = cold end
n = len(colours)
values = VMIN + (VMAX - VMIN) * np.arange(n) / (n - 1)

uniq = np.unique(colours, axis=0)
print(f"Strip length: {n} px, distinct colours in strip: {len(uniq)}")
print(f"Temperature step per strip pixel: {(VMAX - VMIN) / (n - 1):.3f} C")
print("First 3 colours (cold end):", colours[:3].tolist())
print("Last 3 colours (warm end):", colours[-3:].tolist())
# Repeated colours far apart would make inversion ambiguous
dup = 0
for i in range(n):
    same = np.where((colours == colours[i]).all(axis=1))[0]
    if same.max() - same.min() > max(3, n // 40):
        dup += 1
print(f"Pixels whose colour also appears far away in the strip: {dup} (0 is ideal)")
np.savez("lut.npz", colours=colours, values=values)
print("Saved lut.npz")
```

### s3_invert_points.py
```python
# Step 7: pick ocean points and convert their colours to temperatures
from PIL import Image
import numpy as np, pandas as pd

FRAME = "sst_frame.png"
N_POINTS = 60
MAX_LAT = 60          # stay between 60S and 60N (avoids sea-ice rendering)
MAX_COLOUR_DIST = 20  # colour must be this close to the colorbar to count as "matched"
SEED = 42

lut = np.load("lut.npz")
lc, lv = lut["colours"].astype(float), lut["values"]
a = np.asarray(Image.open(FRAME).convert("RGB")).astype(float)
H, W = a.shape[:2]
rng = np.random.default_rng(SEED)

def nearest(c):
    d = np.sqrt(((lc - c) ** 2).sum(axis=1))
    i = int(d.argmin())
    return lv[i], d[i]

rows, tried, unmatched = [], 0, 0
bands = np.linspace(-MAX_LAT, MAX_LAT, 7)           # 6 latitude bands
per_band = int(np.ceil(N_POINTS / 6))
for b in range(6):
    got = 0
    while got < per_band and tried < 200000:
        tried += 1
        lat = rng.uniform(bands[b], bands[b + 1]); lon = rng.uniform(-180, 180)
        x = int((lon + 180) / 360 * W); y = int((90 - lat) / 180 * H)
        x = min(max(x, 3), W - 4); y = min(max(y, 3), H - 4)
        block = a[y - 3:y + 4, x - 3:x + 4].reshape(-1, 3)
        dists = [nearest(c)[1] for c in block[::6]]
        if max(dists) > MAX_COLOUR_DIST * 3:        # land/coast/label nearby: skip
            continue
        val, dist = nearest(a[y, x])
        if dist > MAX_COLOUR_DIST:
            unmatched += 1
            continue
        lon_c = -180 + (x + 0.5) * 360 / W; lat_c = 90 - (y + 0.5) * 180 / H
        rows.append(dict(x=x, y=y, lat=round(lat_c, 4), lon=round(lon_c, 4),
                         r=int(a[y, x, 0]), g=int(a[y, x, 1]), b=int(a[y, x, 2]),
                         frame_temp_C=round(float(val), 3), colour_dist=round(float(dist), 2)))
        got += 1
df = pd.DataFrame(rows)
df.to_csv("points.csv", index=False)
print(f"Saved {len(df)} points to points.csv")
print(f"Ocean-looking pixels rejected because colour not on colorbar: {unmatched}")
print(df.describe()[["frame_temp_C", "colour_dist"]].round(2))
```

### s4_get_mur.py
```python
# Step 8: read the real MUR SST values at the same points, for 3 candidate dates
import datetime as dt
import earthaccess, xarray as xr, pandas as pd, numpy as np

CANDIDATE_DATES = ["2026-09-20", "2026-09-21", "2026-09-22"]   # <- see guide, Step 8.2
MODE = "stream"      # "stream" reads only what it needs; "download" saves whole files (~hundreds of MB each)
W, H = 4096, 2048    # frame size from Step 5

earthaccess.login(strategy="interactive", persist=True)
pts = pd.read_csv("points.csv")
dx, dy = 360 / W, 180 / H

for date in CANDIDATE_DATES:
    d = dt.date.fromisoformat(date)
    res = earthaccess.search_data(short_name="MUR-JPL-L4-GLOB-v4.1",
                                  temporal=(str(d - dt.timedelta(days=1)), str(d + dt.timedelta(days=1))))
    tag = date.replace("-", "")
    res = [r for r in res if any(l.split("/")[-1].startswith(tag) for l in r.data_links())]
    if not res:
        print(f"{date}: no MUR file found (may not be published yet)"); continue
    print(f"{date}: using {res[0].data_links()[0].split('/')[-1]}")
    if MODE == "download":
        f = earthaccess.download(res[:1], "mur_files")[0]
    else:
        f = earthaccess.open(res[:1])[0]
    ds = xr.open_dataset(f, engine="h5netcdf")
    sst = ds["analysed_sst"].isel(time=0)
    centre, boxmean = [], []
    for _, p in pts.iterrows():
        lon0 = -180 + p.x * dx; lat1 = 90 - p.y * dy
        box = sst.sel(lat=slice(lat1 - dy, lat1), lon=slice(lon0, lon0 + dx))
        boxmean.append(float(box.mean()) - 273.15)
        centre.append(float(sst.sel(lat=p.lat, lon=p.lon, method="nearest")) - 273.15)
        print(".", end="", flush=True)
    pts[f"mur_centre_{tag}"] = np.round(centre, 3)
    pts[f"mur_box_{tag}"] = np.round(boxmean, 3)
    print(f"\n{date}: done")
    pts.to_csv("points_with_mur.csv", index=False)   # saved after each date, in case of a crash
print("Saved points_with_mur.csv")
```

### s5_compare.py
```python
# Step 9: compare frame-derived temperatures with MUR, and pick the best-matching date
import pandas as pd, numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

MEDIAN_LIMIT = 1.0   # deg C  <- your pre-written threshold
P90_LIMIT = 2.0      # deg C  <- your pre-written threshold

df = pd.read_csv("points_with_mur.csv")
results = []
for col in [c for c in df.columns if c.startswith("mur_")]:
    ok = df[col].notna()
    err = (df.loc[ok, "frame_temp_C"] - df.loc[ok, col])
    results.append(dict(column=col, n=int(ok.sum()), bias=err.mean(),
                        median_abs=err.abs().median(), p90_abs=err.abs().quantile(0.9),
                        max_abs=err.abs().max()))
r = pd.DataFrame(results).sort_values("median_abs")
print(r.round(3).to_string(index=False))
best = r.iloc[0]
passed = best.median_abs <= MEDIAN_LIMIT and best.p90_abs <= P90_LIMIT
print(f"\nBest match: {best.column}")
print(f"RESULT vs your thresholds: {'PASS' if passed else 'FAIL'}")

col = best.column; ok = df[col].notna()
plt.figure(figsize=(5, 5))
plt.scatter(df.loc[ok, col], df.loc[ok, "frame_temp_C"], s=14)
lo, hi = -3, 33
plt.plot([lo, hi], [lo, hi], "k--", lw=1)
plt.xlabel("MUR SST (C)"); plt.ylabel("Temperature read from frame colour (C)")
plt.title(f"Frame vs MUR ({col})"); plt.tight_layout(); plt.savefig("compare.png", dpi=120)
df.assign(error=df["frame_temp_C"] - df[col]).sort_values("error", key=abs, ascending=False) \
  .head(5)[["lat", "lon", "frame_temp_C", col, "colour_dist"]].to_csv("worst5.csv", index=False)
print("Saved compare.png and worst5.csv")
```
