"""Fix for 'NO ENCODING MEETS RULE (1)'. The legend's tick geometry and NASA MUR disagree by a clean linear stretch
around 15 C, and changing the colour encoding does not remove it. So we test SCALE hypotheses, with pre-written rules.
Usage (from pipeline/): python calibrate_sst_range.py            (analyse only)
                        python calibrate_sst_range.py --apply    (write the chosen mapping into lut_params.json)

Steps
 1 Tick geometry from the image: the evenly spaced in-bar ticks; the tick nearest the strip centre is 15 C
   (the pale break of the colormap); -5 C = 15 - 4*spacing, 35 C = 15 + 4*spacing.
 2 Hypotheses for what the frame's colours mean at those ticks (Check C points, sRGB encoding):
   H0 legend as labelled: -5..35 C  (0 free parameters)
   H1 round-number scale: the colour at the -5/35 ticks means vmin/vmax from a small set of round pairs centred
      on 15 C: (-4,34), (-3,33), (-6,36)  (0 continuous free parameters; best pair chosen)
   H2 fitted line vs MUR (2 free parameters), scored by 5-fold cross-validation (out-of-sample)
 3 Pre-written decision: a hypothesis is 'as good as H2-CV' if its median |error| <= H2-CV median + 0.1 C AND its
   90th-percentile |error| <= H2-CV p90 + 0.15 C (the tails reveal scale errors). Choose H0 if as good; else the H1 pair
   with the smallest p90 among those as good; else H2 (values rounded to 0.1 C) labelled 'empirically calibrated'. Step 10 (verify_latest.py, a new frame)
   remains the out-of-sample test for whichever is chosen."""
import sys, json
import pandas as pd
from common import *
from compare_sst_colorbar import detect_strip, row_strip
from convert_sst import read_frame
from PIL import Image

P = load_params(); c = P["sst"]
local = PIPE / c["colorbar_file"]
tmpl = row_strip(local, int(c["start"]), int(c["end"]), int(c["across"]))
ds, de, da, (top, bot) = detect_strip(local, tmpl)
arr = np.asarray(Image.open(local).convert("RGB")).astype(np.float32)

def white_marks(rows):
    seg = arr[rows, :, :]
    frac = ((seg.min(2) >= 225) & ((seg.max(2) - seg.min(2)) <= 25)).mean(0)
    cand = [x for x in np.where(frac >= 0.5)[0] if ds <= x <= de and (frac[max(ds, x - 5)] < 0.5 or frac[min(de, x + 5)] < 0.5)]
    groups = []
    for x in cand:
        if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
        else: groups.append([x])
    return [float(np.mean(g)) for g in groups if len(g) <= 8]
marks = max([white_marks(list(range(top + 1, top + 10))), white_marks(list(range(bot - 9, bot)))], key=len)
best = []
for i in range(len(marks)):
    for j in range(i + 1, len(marks)):
        sp = marks[j] - marks[i]
        if sp < 20: continue
        chain = [t for t in marks if abs((t - marks[i]) / sp - round((t - marks[i]) / sp)) * sp <= 3]
        if len(chain) > len(best) or (len(chain) == len(best) and sp < np.min(np.diff(best))): best = chain
spacing = float(np.median(np.diff(best)))
steps = np.round((np.array(best) - best[0]) / spacing)
spacing, a0 = np.polyfit(steps, best, 1); spacing = float(spacing)   # least-squares tick grid over the whole chain
mid = (ds + de) / 2
t15 = float(a0 + spacing * round((mid - a0) / spacing))   # grid point nearest the strip centre = 15 C (works even if
                                                          # the 15 C tick itself is invisible in the white zone)
pale = arr[da, int(round(t15)) - 12: int(round(t15)) + 13].mean(0)
x_m5, x_35 = t15 - 4 * spacing, t15 + 4 * spacing
print(f"Strip x {ds}..{de} (centre {mid:.1f}). White marks: {[round(m,1) for m in marks]}")
print(f"Evenly spaced ticks: {[round(t,1) for t in best]}  spacing {spacing:.2f} px")
print(f"15 C tick = {t15:.1f} (tick-grid point nearest the strip centre {mid:.1f}; colour there {pale.round().astype(int).tolist()} should be pale/white)")
print(f"=> -5 C tick at x = {x_m5:.1f}, 35 C tick at x = {x_35:.1f}")

pts = pd.read_csv(INPUTS / "reference" / "checkC_points_with_mur.csv")
col = min([k for k in pts.columns if k.startswith("mur_centre_")], key=lambda k: np.nanmedian(np.abs(pts["frame_temp_C"] - pts[k])))
truth = pts[col].values; ok = np.isfinite(truth)
frame = next(iter(sorted((INPUTS / "reference").glob("checkC_frame.*"))))
rgb, _ = read_frame(frame, c["exr_encoding"])
full = row_strip(local, ds, de, da)
j, dist = nearest(rgb[pts.y.values, pts.x.values].astype(np.float32), full)
pos = (ds + j).astype(float)
print(f"\nCheck C points: {ok.sum()}, MUR column {col}, encoding {c['exr_encoding']}, colour distance median {np.median(dist):.2f}")

def score(vmin, vmax):
    pred = vmin + (vmax - vmin) * (pos - x_m5) / (x_35 - x_m5); e = pred[ok] - truth[ok]
    return float(np.median(np.abs(e))), float(np.percentile(np.abs(e), 90)), float(np.mean(e))
res = {}
res["H0 legend -5..35"] = (-5.0, 35.0, *score(-5, 35))
for lo, hi in ((-4, 34), (-3, 33), (-6, 36)):
    res[f"H1 round {lo}..{hi}"] = (float(lo), float(hi), *score(lo, hi))
# H2: 5-fold CV of a fitted line T = a + b*pos
idx = np.where(ok)[0]; rng = np.random.default_rng(0); rng.shuffle(idx); folds = np.array_split(idx, 5); cv = np.full(len(pos), np.nan)
for k in range(5):
    test = folds[k]; train = np.setdiff1d(idx, test)
    b, a = np.polyfit(pos[train], truth[train], 1); cv[test] = a + b * pos[test]
e = cv[idx] - truth[idx]
b, a = np.polyfit(pos[ok], truth[ok], 1)
h2 = (round(a + b * x_m5, 1), round(a + b * x_35, 1))
res["H2 fitted (5-fold CV)"] = (h2[0], h2[1], float(np.median(np.abs(e))), float(np.percentile(np.abs(e), 90)), float(np.mean(e)))
print(f"\n{'hypothesis':24s} {'value at -5/35 ticks':>22s} {'median':>8s} {'p90':>6s} {'bias':>7s}")
for k, (lo, hi, m, p90, bi) in res.items():
    print(f"{k:24s} {lo:9.1f} .. {hi:6.1f} C {m:8.2f} {p90:6.2f} {bi:+7.2f}")
cvm, cvp = res["H2 fitted (5-fold CV)"][2], res["H2 fitted (5-fold CV)"][3]
acceptable = lambda k: res[k][2] <= cvm + 0.1 and res[k][3] <= cvp + 0.15      # median AND tail (p90) as good as H2-CV
h1_ok = [k for k in res if k.startswith("H1") and acceptable(k)]
if acceptable("H0 legend -5..35"): choice = "H0 legend -5..35"
elif h1_ok: choice = min(h1_ok, key=lambda k: res[k][3])
else: choice = "H2 fitted (5-fold CV)"
lo, hi = res[choice][0], res[choice][1]
print(f"\nDECISION (pre-written rule): {choice}  ->  colour at x {x_m5:.1f} means {lo} C, at x {x_35:.1f} means {hi} C")
report = {"ticks": best, "spacing": spacing, "tick_15": t15, "x_m5": x_m5, "x_35": x_35, "hypotheses": res, "choice": choice,
          "vmin": lo, "vmax": hi, "checked_utc": now_utc()}
write_json(WORK / "sst_range_calibration.json", report)
if "--apply" in sys.argv:
    c["start"], c["end"] = int(round(x_m5)), int(round(x_35)); c["across"] = int(da); c["vmin"], c["vmax"] = lo, hi
    c["calibration"] = {"method": choice, "legend_labels": "-5..35 C", "ticks_px": [round(x_m5, 1), round(x_35, 1)],
                        "value_at_ticks_C": [lo, hi], "evidence": "calibrate_sst_range.py vs NASA MUR (Check C, 60 points)",
                        "note": "Frame colours checked against MUR imply this scale; out-of-sample test = verify_latest.py on a new frame."}
    json.dump(P, open(PIPE / "lut_params.json", "w"), indent=2)
    print(f"Applied to lut_params.json: start {c['start']}, end {c['end']}, across {c['across']}, vmin {lo}, vmax {hi}")
elif "--apply" not in sys.argv:
    print("Nothing changed. Re-run with --apply to write this mapping into lut_params.json.")
