"""truth/sst_pairs.json, truth/rain_pairs.json (proof in unison) and truth/threeway.json."""
import json
import numpy as np
from common import PUBLIC
from .common import header_problems, info, load

def sst_pairs(check):
    d = load("truth/sst_pairs.json")
    if d is None: return
    lc = json.load(open(PUBLIC / "latest" / "sst.json")).get("latest_check") or {}
    err = np.abs([p["frame"] - p["file"] for p in d["pairs"]])
    ok = (not header_problems(d, "sst_pairs") and d["check"] == lc and len(err) == lc.get("n")
          and abs(float(np.median(err)) - lc.get("median_abs", np.inf)) < 1e-9)
    check("truth/sst_pairs.json = the points behind sst.json latest_check (C1)", ok,
          f"{header_problems(d, 'sst_pairs')}; n {len(err)} vs {lc.get('n')}; median {np.median(err):.4f} vs {lc.get('median_abs')}")
    info("SST frame vs MUR median |error|", f"fresh {np.median(err):.2f} °C on MUR {lc.get('date')} (book 0.31 °C; falsifier > 0.1 °C off)")

def rain_pairs(check):
    d = load("truth/rain_pairs.json")
    if d is None: return
    lc = json.load(open(PUBLIC / "latest" / "rain.json")).get("latest_check") or {}
    wet = [p for p in d["pairs"] if p["kind"] == "rain"]; dry = [p for p in d["pairs"] if p["kind"] == "dry"]
    both = [p for p in wet if p["file"] >= 0.1]
    agree = (len(both) + sum(p["file"] < 0.1 for p in dry)) / max(1, len(wet) + len(dry))
    med = float(np.median(np.abs(np.log10([p["frame"] / p["file"] for p in both])))) if both else np.nan
    ok = (not header_problems(d, "rain_pairs") and d["check"] == lc and len(both) == lc.get("n_both_rain")
          and abs(agree - lc.get("agreement", -1)) < 1e-9 and abs(med - lc.get("median_abs_log10", np.inf)) < 1e-9)
    check("truth/rain_pairs.json = the points behind rain.json latest_check (C1)", ok,
          f"{header_problems(d, 'rain_pairs')}; both-rain {len(both)} vs {lc.get('n_both_rain')}; agreement {agree:.3f}; median |log10| {med:.4f}")
    info("Rain frame vs IMERG", f"fresh: IMERG {lc.get('imerg_run')}, agreement {agree:.0%}, typical error "
         f"{(10 ** med - 1) * 100:.0f}% (book ≈27%, rain/no-rain 100%)")

def threeway(check):
    d = load("truth/threeway.json")
    if d is None: return
    pairs = json.load(open(PUBLIC / "truth" / "sst_pairs.json"))["pairs"]
    same = [(q["lat"], q["lon"], q["frame"], q["file"]) for q in d["points"]] == [(p["lat"], p["lon"], p["frame"], p["file"]) for p in pairs]
    check("truth/threeway.json uses the sst_pairs points and decodes GIBS", not header_problems(d, "threeway") and same
          and d["gibs_decode_share"] >= 0.99, f"{header_problems(d, 'threeway')}; same points {same}; decode {d['gibs_decode_share']:.1%}")
    s = d["summary"]
    info("Three-way (G7)", f"GIBS decode {d['gibs_decode_share']:.0%} (book 100%); median |GIBS−MUR| {s['median_abs_gibs_vs_file']} °C, "
         f"|frame−MUR| {s['median_abs_frame_vs_file']} °C, |frame−GIBS| {s['median_abs_frame_vs_gibs']} °C (n {s['n_gibs']}/{s['n']})")

def run(check):
    sst_pairs(check); rain_pairs(check); threeway(check)
