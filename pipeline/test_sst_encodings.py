"""Why do the colorbar's own ticks (about x=200 / x=1400) disagree with the MUR fit (158 / 1451)?
Hypothesis: our EXR -> 8-bit colour conversion does not exactly match how the legend PNG was made, which shifts
dark (cold) and deep-red (warm) colours along the strip. Test a small, fixed set of standard conversions.
Usage (from pipeline/): python test_sst_encodings.py

Pre-written rule: an encoding is ACCEPTED if
  (1) the MUR-fit positions of -5 C and 35 C fall within 10 px of the colorbar's own -5 and 35 ticks, and
  (2) its median colour distance to the legend is the lowest among encodings meeting (1).
If none meets (1): the frame's colours do not follow the legend linearly -> paste the output (see guide for options)."""
import os, json
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
import cv2, pandas as pd
from common import *
from compare_sst_colorbar import detect_strip, row_strip

P = load_params(); c = P["sst"]
local = PIPE / c["colorbar_file"]
s0, e0, a0 = int(c["start"]), int(c["end"]), int(c["across"])
tmpl = row_strip(local, s0, e0, a0)
ds, de, da, (top, bot) = detect_strip(local, tmpl)

# --- 1) ticks drawn INSIDE the bar (short white lines at its top/bottom edge) ---
from PIL import Image
arr = np.asarray(Image.open(local).convert("RGB")).astype(np.float32)
def white_cols(rows):
    seg = arr[rows, :, :]
    bright = (seg.min(2) >= 225) & ((seg.max(2) - seg.min(2)) <= 25)
    frac = bright.mean(0)
    cand = np.where(frac >= 0.5)[0]
    cand = cand[(cand >= ds) & (cand <= de)]
    keep = []
    for x in cand:                                   # isolated white line: neighbours 5 px away are not white
        l, r = max(ds, x - 5), min(de, x + 5)
        if frac[l] < 0.5 or frac[r] < 0.5: keep.append(x)
    groups = []
    for x in keep:
        if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
        else: groups.append([x])
    return [float(np.mean(g)) for g in groups if len(g) <= 8]
ticks_top = white_cols(list(range(top + 1, top + 10)))
ticks_bot = white_cols(list(range(bot - 9, bot)))
raw_ticks = ticks_top if len(ticks_top) >= len(ticks_bot) else ticks_bot
def regular(ts):
    """Keep the largest evenly spaced subset (white/pale parts of the colormap can create false marks)."""
    best = []
    for i in range(len(ts)):
        for j in range(i + 1, len(ts)):
            sp = ts[j] - ts[i]
            if sp < 20: continue
            chain = [t for t in ts if abs((t - ts[i]) / sp - round((t - ts[i]) / sp)) * sp <= 3]
            if len(chain) > len(best): best = chain
    return best
ticks = regular(raw_ticks)
print(f"Colour strip x {ds}..{de}, rows {top}..{bot}")
print(f"White marks inside the bar: {[round(t,1) for t in raw_ticks]}")
print(f"Evenly spaced tick set:     {[round(t,1) for t in ticks]}")
if len(ticks) >= 2:
    sp = np.diff(ticks); print(f"  spacing {np.round(sp,1).tolist()}")
sp = float(np.min(np.diff(ticks))) if len(ticks) >= 2 else 0
n_int = round((ticks[-1] - ticks[0]) / sp) if sp else 0
if n_int == 8:     # -5 ... 35 in steps of 5 C = 8 intervals (a tick hidden in the white 15 C zone is fine)
    t_m5, t_35 = ticks[0], ticks[-1]
    print(f"  tick spacing {sp:.1f} px, 8 intervals: -5 C tick at x = {t_m5:.1f}, 35 C tick at x = {t_35:.1f}")
else:
    t_m5, t_35 = float(s0), float(e0)
    print(f"  (could not identify the -5..35 tick set; using lut_params {s0}/{e0} as the tick positions - check the image by eye)")

# --- 2) encodings ---
pts = pd.read_csv(INPUTS / "reference" / "checkC_points_with_mur.csv")
col = min([k for k in pts.columns if k.startswith("mur_centre_")], key=lambda k: np.nanmedian(np.abs(pts["frame_temp_C"] - pts[k])))
truth = pts[col].values
frame = next(iter(sorted((INPUTS / "reference").glob("checkC_frame.exr"))))
img = cv2.imread(str(frame), cv2.IMREAD_UNCHANGED).astype(np.float32)
lin = np.nan_to_num(img[:, :, [2, 1, 0]])[pts.y.values, pts.x.values]
def srgb(v):
    v = np.clip(v, 0, 1); return np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)
ENC = {"srgb": srgb, "raw": lambda v: np.clip(v, 0, 1),
       "gamma2.2": lambda v: np.power(np.clip(v, 0, 1), 1 / 2.2), "gamma1.8": lambda v: np.power(np.clip(v, 0, 1), 1 / 1.8)}
full = row_strip(local, ds, de, a0)
print(f"\nMUR column {col}; {len(pts)} points; ticks used: -5 at {t_m5:.1f}, 35 at {t_35:.1f}")
print(f"{'encoding':9s} {'colour dist med/p90':>20s} {'fit -5 at':>10s} {'fit 35 at':>10s} {'err vs MUR (tick mapping) med/p90/bias':>40s}  rule(1)")
rows = []
for name, fn in ENC.items():
    u8 = (fn(lin) * 255 + 0.5).astype(np.float32)
    j, d = nearest(u8, full); pos = ds + j
    ok = np.isfinite(truth)
    b, a = np.polyfit(pos[ok], truth[ok], 1)
    x5, x35 = (-5 - a) / b, (35 - a) / b
    pred = -5 + 40 * (pos - t_m5) / (t_35 - t_m5); err = pred[ok] - truth[ok]
    r1 = abs(x5 - t_m5) <= 10 and abs(x35 - t_35) <= 10
    rows.append(dict(encoding=name, dist_med=float(np.median(d)), dist_p90=float(np.percentile(d, 90)), fit_m5=float(x5), fit_35=float(x35),
                     err_med=float(np.median(np.abs(err))), err_p90=float(np.percentile(np.abs(err), 90)), bias=float(np.mean(err)), rule1=bool(r1)))
    print(f"{name:9s} {np.median(d):9.2f} / {np.percentile(d,90):6.2f} {x5:10.1f} {x35:10.1f} "
          f"{np.median(np.abs(err)):14.2f} / {np.percentile(np.abs(err),90):5.2f} / {np.mean(err):+5.2f}     {'yes' if r1 else 'no'}")
acc = [r for r in rows if r["rule1"]]
if acc:
    best = min(acc, key=lambda r: r["dist_med"])
    print(f"\nACCEPTED: '{best['encoding']}' -> set \"exr_encoding\": \"{best['encoding']}\" and start/end = the -5/35 ticks "
          f"({round(t_m5)}/{round(t_35)}); then run diagnose_sst_strip.py --reverify")
else:
    print("\nNO ENCODING MEETS RULE (1): the frame colours do not follow the legend linearly. Paste this output.")
write_json(WORK / "sst_encoding_test.json", {"ticks": ticks, "tick_m5": t_m5, "tick_35": t_35, "results": rows})
