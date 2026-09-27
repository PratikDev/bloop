"""Step 7: acceptance checks. Exit code 0 only if every check passes.
A) SST regression: re-run our pipeline on the Check C frame; compare with Check C points (<= 0.1 °C)
B) SST grid: decode public sst.bin and compare with the pipeline's own block means (<= 0.002 °C)
C) Rain regression: re-run on the D2 frame; compare with D2 points (median within 1 colorbar step, max within 3 steps ≈ ±5%; phase equal; dry = 0)
D) Rain grid: decode public rain.bin/rain_phase.bin vs 2x2 max of the pipeline's full-res result
E) Metadata: required fields + verified numbers
F) Demo numbers equal the tested values
G) File sizes and presence"""
import json, sys
import pandas as pd
from common import *
from convert_sst import invert_sst
from convert_rain import invert_rain

results = []
def check(name, ok, detail=""):
    results.append((name, bool(ok), detail)); print(f"[{'PASS' if ok else 'FAIL'}] {name}  {detail}")

P = load_params()
REF = INPUTS / "reference"

# A) SST regression on the Check C frame
try:
    frame = next(iter(sorted(REF.glob("checkC_frame.*"))))
    pts = pd.read_csv(REF / "checkC_points.csv")
    _, vals, _ = invert_sst(frame, P)
    got = vals[pts.y.values, pts.x.values]
    diff = np.abs(got - pts.frame_temp_C.values)
    check("A SST regression (Check C frame, 60 points)", np.all(diff <= 0.1), f"max diff {np.nanmax(diff):.4f} °C")
except StopIteration:
    check("A SST regression", False, "inputs/reference/checkC_frame.* missing")

# B) SST grid encode/decode
try:
    meta = json.load(open(PUBLIC / "latest" / "sst.json"))
    gw, gh = meta["grid"]["width"], meta["grid"]["height"]
    u = np.fromfile(PUBLIC / "latest" / "sst.bin", dtype="<u2").reshape(gh, gw)
    full = np.load(WORK / "sst_fullres.npy"); f = full.shape[1] // gw
    ref = block_nanmean(full, f); dec = decode_sst(u)
    both = np.isfinite(ref) & np.isfinite(dec)
    same_mask = np.array_equal(np.isfinite(ref), np.isfinite(dec))
    check("B SST grid decode vs pipeline", same_mask and np.nanmax(np.abs(ref[both] - dec[both])) <= 0.002,
          f"max diff {np.nanmax(np.abs(ref[both]-dec[both])):.4f} °C; land/ocean mask identical: {same_mask}")
except Exception as e:
    check("B SST grid", False, str(e))

# C) Rain regression on the D2 frame
try:
    frame = next(iter(sorted(REF.glob("d2_frame.*"))))
    pts = pd.read_csv(REF / "d2_points.csv")
    variant = json.load(open(WORK / "rain_variant.json"))["variant"] if (WORK / "rain_variant.json").exists() else None
    _, _, rate, phase, _, _, v, _ = invert_rain(frame, P, variant=variant)
    r = rate[pts.y.values, pts.x.values]; ph = phase[pts.y.values, pts.x.values]
    rain = pts.kind.values == "rain"; dry = ~rain
    logdiff = np.abs(np.log10(np.maximum(r[rain], 1e-9)) - np.log10(pts.frame_rate.values[rain]))
    phase_map = {"liquid": 1, "frozen": 2}
    ph_ok = np.all(ph[rain] == np.array([phase_map[x] for x in pts.frame_phase.values[rain]]))
    step = (np.log10(P["rain"]["vmax"]) - np.log10(P["rain"]["vmin"])) / (P["rain"]["end"] - P["rain"]["start"])
    ok = np.median(logdiff) <= step + 1e-6 and logdiff.max() <= 3 * step + 1e-6 and ph_ok
    check("C Rain regression (D2 frame, rain points)", ok,
          f"median |log10 diff| {np.median(logdiff):.4f} (limit {step:.4f} = 1 colorbar step), max {logdiff.max():.4f} (limit {3*step:.4f} ≈ ±5%), "
          f"exactly equal {np.mean(logdiff < 1e-6)*100:.0f}%; phase identical: {ph_ok}; variant {v}")
    check("C Rain regression (D2 frame, dry points)", np.all(r[dry] == 0), f"{dry.sum()} dry points all zero")
except StopIteration:
    check("C Rain regression", False, "inputs/reference/d2_frame.* missing")

# D) Rain grid encode/decode
try:
    meta = json.load(open(PUBLIC / "latest" / "rain.json"))
    gw, gh = meta["grid"]["width"], meta["grid"]["height"]
    u = np.fromfile(PUBLIC / "latest" / "rain.bin", dtype="<u2").reshape(gh, gw)
    up = np.fromfile(PUBLIC / "latest" / "rain_phase.bin", dtype="u1").reshape(gh, gw)
    full = np.load(WORK / "rain_fullres.npy"); fph = np.load(WORK / "rain_phase_fullres.npy")
    ref, refp = block_max_with_phase(full, fph, full.shape[1] // gw)
    dec = decode_rain(u); wet = ref > 0
    ld = np.abs(np.log10(dec[wet]) - np.log10(ref[wet])) if wet.any() else np.array([0.0])
    check("D Rain grid decode vs pipeline", np.all((dec > 0) == wet) and ld.max() <= 0.0001 and np.array_equal(up, refp),
          f"max |log10 diff| {ld.max():.6f}; wet/dry identical; phase identical: {np.array_equal(up, refp)}")
except Exception as e:
    check("D Rain grid", False, str(e))

# E) Metadata: required fields; published 'verified' equals lut_params (single source of truth); numbers self-consistent
for prod in ("sst", "rain"):
    try:
        m = json.load(open(PUBLIC / "latest" / f"{prod}.json"))
        need = ["product", "svs_id", "svs_page", "frame_time_utc", "source_dataset", "grid", "verified", "credit", "generated_utc"]
        miss = [k for k in need if m.get(k) in (None, "")]
        same = m["verified"] == P[prod]["verified"]
        consistent = True
        if prod == "sst" and "p90_abs_error_C" in m["verified"]:
            consistent = m["verified"]["value"] <= m["verified"]["p90_abs_error_C"]      # a median cannot exceed its p90
        check(f"E {prod}.json fields + verified numbers", not miss and same and consistent,
              f"missing: {miss}; matches lut_params: {same}; self-consistent: {consistent}; frame_time {m.get('frame_time_utc')}")
    except Exception as e:
        check(f"E {prod}.json", False, str(e))

# F) Demo numbers
try:
    d = json.load(open(PUBLIC / "demo" / "dhaka_then_now.json"))
    exp = [("heat change", d["heat"]["change_C"], 1.37, 0.01),
           ("GPCP A", d["rain"]["gpcp"]["A"]["mean"], 15.10, 0.01), ("GPCP B", d["rain"]["gpcp"]["B"]["mean"], 13.71, 0.01),
           ("GPCC A", d["rain"]["gpcc"]["A"]["mean"], 14.79, 0.01), ("GPCC B", d["rain"]["gpcc"]["B"]["mean"], 13.03, 0.01),
           ("GRACE BD A", d["water"]["Bangladesh"]["mean_A"], 0.83, 0.01), ("GRACE BD B", d["water"]["Bangladesh"]["mean_B"], -5.82, 0.01),
           ("GRACE NWI A", d["water"]["NW_India"]["mean_A"], 8.71, 0.01), ("GRACE NWI B", d["water"]["NW_India"]["mean_B"], -53.63, 0.01),
           ("GRACE NWI trend", d["water"]["NW_India"]["trend_cm_per_yr"], -3.25, 0.01)]
    for name, got, want, tol in exp:
        check(f"F demo {name}", abs(got - want) <= tol, f"got {got} expected {want}")
except Exception as e:
    check("F demo", False, str(e))

# G) Files
expected = {"latest/sst.bin": 1024 * 512 * 2, "latest/rain.bin": 1800 * 900 * 2, "latest/rain_phase.bin": 1800 * 900}
for rel, size in expected.items():
    p = PUBLIC / rel
    check(f"G {rel} size", p.exists() and p.stat().st_size == size, f"{p.stat().st_size if p.exists() else 'missing'} bytes (expected {size})")
for rel in ["latest/sst.webp", "latest/rain.png", "sequence/index.json", "context/gistemp_bd.json", "context/gpcp_bd.json",
            "context/gpcc_bd.json", "context/grace.json", "context/firms.json", "context/ndvi.json", "context/globe_bd.json",
            "truth/sst_compare.png", "truth/rain_compare.png", "truth/crosscheck.png", "context/ensemble_bd.json", "context/globe_duet.json"]:
    check(f"G {rel} present", (PUBLIC / rel).exists())
try:
    idx = json.load(open(PUBLIC / "sequence" / "index.json"))["frames"]
    missing = [f["grid"] for f in idx if not (PUBLIC / "sequence" / f["grid"]).exists() or not (PUBLIC / "sequence" / f["png"]).exists()]
    check("G sequence frames complete", len(idx) >= 24 and not missing, f"{len(idx)} frames; missing files: {missing[:3]}")
    old = [p.name for p in (PUBLIC / "sequence").glob("*.bin")]
    check("G no leftover old-format sequence files", not old, f"{len(old)} .bin files (delete public/data/sequence/*.bin)")
except Exception as e:
    check("G sequence", False, str(e))
try:   # H) the compact time-lapse encoding round-trips within half a log step, phases identical
    full = np.load(WORK / "rain_fullres.npy"); fph = np.load(WORK / "rain_phase_fullres.npy")
    g, gp = block_max_with_phase(full, fph, P["rain"]["sequence_factor"])
    r2, p2 = decode_rain_u8(encode_rain_u8(g, gp)); wet = g > 0
    ld = np.abs(np.log10(r2[wet]) - np.log10(np.clip(g[wet], 0.1, 50))) if wet.any() else np.array([0.0])
    half = (np.log10(50) + 1) / RAIN_U8_LEVELS / 2
    check("H time-lapse encoding round-trip", ld.max() <= half + 1e-6 and np.array_equal(p2[wet], gp[wet]) and np.all(r2[~wet] == 0),
          f"max |log10 diff| {ld.max():.4f} (limit {half:.4f}, about ±2.5%)")
except Exception as e:
    check("H time-lapse encoding", False, str(e))
total = sum(p.stat().st_size for p in PUBLIC.rglob("*") if p.is_file())
check("G total public/data size < 60 MB", total < 60e6, f"{total/1e6:.1f} MB")

n_fail = sum(1 for _, ok, _ in results if not ok)
print(f"\n{len(results) - n_fail} passed, {n_fail} failed")
sys.exit(1 if n_fail else 0)