"""Which pixel positions really mean -5 C and 35 C on our colorbar? Decide with independent data (NASA MUR), not by eye.
Needs: inputs/reference/checkC_points.csv (from s3) and inputs/reference/checkC_points_with_mur.csv (from s4).
Usage (from pipeline/): python diagnose_sst_strip.py            (diagnose only)
                        python diagnose_sst_strip.py --reverify (ONLY after you corrected start/end in lut_params:
                        recomputes the Check C accuracy vs MUR with the corrected mapping, updates lut_params 'verified',
                        and rewrites the Check C reference points so spotcheck A tests the corrected mapping; the
                        original files are kept as *_original.*)

Pre-written rules:
 D1 lut_params reproduce the Check C frame temperatures (max diff <= 0.1 C) -> confirms these ARE the numbers Check C used
 D2 fit MUR temperature = a + b * (position along the full colour strip) using the 60 Check C points
 D3 the mapping whose predicted errors vs MUR are smallest (median |error|) is the one the data supports;
    a mapping is 'supported' if its -5/35 positions are within 10 px of the fitted ones"""
import json
import pandas as pd
from common import *
from compare_sst_colorbar import detect_strip, row_strip

P = load_params(); c = P["sst"]
local = PIPE / c["colorbar_file"]
s0, e0, a0 = int(c["start"]), int(c["end"]), int(c["across"])
pts = pd.read_csv(INPUTS / "reference" / "checkC_points.csv")
mur = pd.read_csv(INPUTS / "reference" / "checkC_points_with_mur.csv")
col = [k for k in mur.columns if k.startswith("mur_centre_")]
best = min(col, key=lambda k: np.nanmedian(np.abs(mur["frame_temp_C"] - mur[k])))
truth = mur[best].values
from convert_sst import read_frame
frame = next(iter(sorted((INPUTS / "reference").glob("checkC_frame.*"))))
frame_rgb, _ = read_frame(frame, c["exr_encoding"])              # colours with the CURRENT encoding setting
rgb = frame_rgb[pts.y.values, pts.x.values].astype(np.float32)
print(f"Using {len(pts)} Check C points; MUR column {best}")

# D1
v_rgb = row_strip(local, s0, e0, a0); v_val = strip_values(len(v_rgb), float(c["vmin"]), float(c["vmax"]), "linear")
j, d = nearest(rgb, v_rgb); rep = v_val[j]
diff = np.abs(rep - pts["frame_temp_C"].values)
print(f"D1 lut_params ({s0}..{e0}, y {a0}) reproduce the Check C values in checkC_points.csv: max diff {diff.max():.3f} C -> "
      f"{'PASS' if diff.max() <= 0.1 else 'DIFFERENT (expected only if you already corrected lut_params)'}")

# D2: positions along the FULL strip
ds, de, da, band = detect_strip(local, v_rgb)
full = row_strip(local, ds, de, a0)
jf, dfull = nearest(rgb, full); pos = ds + jf
ok = np.isfinite(truth)
b, a = np.polyfit(pos[ok], truth[ok], 1)
resid = truth[ok] - (a + b * pos[ok])
x_m5, x_35 = (-5 - a) / b, (35 - a) / b
print(f"D2 full colour strip x {ds}..{de}. Fit from MUR: T = {a:.3f} + {b:.5f} * x  (residual std {resid.std():.2f} C)")
print(f"   -> -5 C at x = {x_m5:.1f}, 35 C at x = {x_35:.1f}")

# D3: compare candidate mappings
vmin, vmax = float(c["vmin"]), float(c["vmax"])
imp = lambda T: s0 + (T - vmin) / (vmax - vmin) * (e0 - s0)        # where lut_params put -5 C and 35 C (may extrapolate)
cands = {"A lut_params": (imp(-5), imp(35)), "B full strip ends": (ds, de), "C MUR fit": (x_m5, x_35)}
res = {}
for name, (xs, xe) in cands.items():
    pred = -5 + 40 * (pos - xs) / (xe - xs)
    err = pred[ok] - truth[ok]
    res[name] = {"start": float(xs), "end": float(xe), "median_abs": float(np.median(np.abs(err))),
                 "p90_abs": float(np.percentile(np.abs(err), 90)), "bias": float(np.mean(err)), "n": int(ok.sum()),
                 "supported": bool(abs(xs - x_m5) <= 10 and abs(xe - x_35) <= 10)}
    print(f"D3 {name:18s} x {xs:7.1f}..{xe:7.1f}: median |error vs MUR| {res[name]['median_abs']:.2f} C, p90 {res[name]['p90_abs']:.2f} C, "
          f"bias {res[name]['bias']:+.2f} C{'  <- supported by the data' if res[name]['supported'] else ''}")
import sys, shutil
if "--reverify" in sys.argv:
    A = res["A lut_params"]
    if not A["supported"]:
        raise SystemExit("--reverify refused: the current lut_params are not supported by the MUR data (see D3). Fix start/end first.")
    ref = INPUTS / "reference"
    for f in ("checkC_points.csv",):
        if not (ref / f.replace(".csv", "_original.csv")).exists(): shutil.copy(ref / f, ref / f.replace(".csv", "_original.csv"))
    pts2 = pts.copy(); pts2["frame_temp_C"] = rep            # per-point inversion with the corrected mapping
    pts2.to_csv(ref / "checkC_points.csv", index=False)
    c["verified"] = {"metric": "median_abs_error_C", "value": round(A["median_abs"], 2), "p90_abs_error_C": round(A["p90_abs"], 2),
                     "bias_C": round(A["bias"], 2), "n_points": A["n"], "frames_tested": 1,
                     "test": "Check C re-evaluated with corrected colorbar positions (same frame, same MUR values)"}
    json.dump(P, open(PIPE / "lut_params.json", "w"), indent=2)
    print(f"RE-VERIFIED: median {A['median_abs']:.2f} C, p90 {A['p90_abs']:.2f} C, bias {A['bias']:+.2f} C -> written to lut_params.json 'verified'; "
          f"reference points rewritten (original kept).")
write_json(WORK / "sst_strip_diagnosis.json", {"mur_column": best, "fit": {"a": a, "b": b, "x_minus5": x_m5, "x_35": x_35,
           "residual_std": float(resid.std())}, "full_strip": [ds, de], "candidates": res, "D1_max_diff": float(diff.max())})
print("Saved work/sst_strip_diagnosis.json")