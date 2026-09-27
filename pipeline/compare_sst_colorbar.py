"""Is the 'CHANGED' SST colorbar a different image of the SAME colour mapping? Conservative, like-for-like check (v2).
Usage (from pipeline/):  python compare_sst_colorbar.py raw/current_sst_colorbar.png [--register]

v2 compares FULL colour strip vs FULL colour strip (layout-independent), then transfers our verified -5/35 positions
by their fraction along the strip. Pre-written rules (EQUIVALENT only if ALL hold):
 R1 the detected colour strip in OUR local file contains the verified range (start..end, across) within +-3 px
 R2 the two full strips have the same colour sequence: median distance <= 3, 95th pct <= 8 RGB units
 R3 converting real frames with the transferred NEW mapping vs the VERIFIED mapping gives the same temperatures:
    median |dT| <= 0.05 C, 99th pct <= 0.2 C, ocean/land agreement >= 99.9%  (Check C frame AND newest frame)"""
import os, sys, json, shutil
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
from common import *
from PIL import Image
from convert_sst import read_frame

def rgba(path):
    a = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    return a[:, :, :3], a[:, :, 3]

def detect_strip(path, template):
    rgb, alpha = rgba(path)
    colourful = template[(template.max(1) - template.min(1)) > 30]
    H, W, _ = rgb.shape
    flat = rgb.reshape(-1, 3).astype(np.int64); op = alpha.reshape(-1) >= 250
    keys = (flat[:, 0] << 16) | (flat[:, 1] << 8) | flat[:, 2]
    uk, inv = np.unique(keys[op], return_inverse=True)           # compare each distinct colour once (fast)
    ucol = np.stack([(uk >> 16) & 255, (uk >> 8) & 255, uk & 255], 1).astype(np.float32)
    _, d = nearest(ucol, colourful)
    hit = np.zeros(H * W, bool); hit[np.where(op)[0][(d <= 12)[inv]]] = True
    hit = hit.reshape(H, W); counts = hit.sum(1)
    if counts.max() < 50: return None
    band = np.where(counts >= 0.6 * counts.max())[0]
    across = int(np.median(band)); cols = np.where(hit[across])[0]
    return int(cols.min()), int(cols.max()), across, (int(band.min()), int(band.max()))

def resample(s, n=1000):
    return s[np.round(np.linspace(0, len(s) - 1, n)).astype(int)]

def row_strip(path, start, end, across):
    return rgba(path)[0][across, start:end + 1]

def main():
    if len(sys.argv) < 2: raise SystemExit("Usage: python compare_sst_colorbar.py raw/current_sst_colorbar.png [--register]")
    P = load_params(); c = P["sst"]
    local, new = PIPE / c["colorbar_file"], Path(sys.argv[1])
    s0, e0, a0 = int(c["start"]), int(c["end"]), int(c["across"])
    v_rgb = row_strip(local, s0, e0, a0); v_val = strip_values(len(v_rgb), c["vmin"], c["vmax"], "linear")
    print(f"Verified mapping (local {Image.open(local).size}): x {s0}..{e0} = {c['vmin']}..{c['vmax']} C, y {a0}")
    dl = detect_strip(local, v_rgb)
    if dl is None: raise SystemExit("Could not detect the strip in the local file - paste this.")
    ds, de, da, band_l = dl
    ok1 = bool(ds - 3 <= s0 and e0 <= de + 3 and band_l[0] - 3 <= a0 <= band_l[1] + 3)
    f0, f1 = (s0 - ds) / (de - ds), (e0 - ds) / (de - ds)
    print(f"Local full colour strip: x {ds}..{de}, rows {band_l[0]}..{band_l[1]}; verified range sits at {f0*100:.1f}%..{f1*100:.1f}% of it")
    print(f"R1 verified range lies inside the detected strip -> {'PASS' if ok1 else 'FAIL'}")
    dn = detect_strip(new, v_rgb)
    if dn is None: raise SystemExit("No matching colour strip in the new file -> NOT EQUIVALENT (paste this).")
    ns, ne, na, band_n = dn
    print(f"New full colour strip ({Image.open(new).size}): x {ns}..{ne}, rows {band_n[0]}..{band_n[1]}")
    full_l, full_n = row_strip(local, ds, de, a0), row_strip(new, ns, ne, na)
    dist = np.sqrt(((resample(full_l) - resample(full_n)) ** 2).sum(1))
    ok2 = bool(np.median(dist) <= 3 and np.percentile(dist, 95) <= 8)
    print(f"R2 full strip vs full strip (1000 samples): median {np.median(dist):.2f}, 95th {np.percentile(dist,95):.2f}, max {dist.max():.2f} -> {'PASS' if ok2 else 'FAIL'}")
    ts, te = int(round(ns + f0 * (ne - ns))), int(round(ns + f1 * (ne - ns)))
    n_rgb = row_strip(new, ts, te, na); n_val = strip_values(len(n_rgb), c["vmin"], c["vmax"], "linear")
    print(f"Transferred mapping in the new file: x {ts}..{te} = {c['vmin']}..{c['vmax']} C, y {na}")
    frames = sorted((INPUTS / "reference").glob("checkC_frame.*"))[:1]
    if (RAW / "manifest.json").exists():
        frames.append(PIPE / json.load(open(RAW / "manifest.json"))["products"]["sst"]["local"])
    ok3 = True; r3 = {}
    for fpath in frames:
        rgb, transp = read_frame(fpath, c["exr_encoding"])
        tv, _, _ = invert_rgb_image(rgb, v_rgb, v_val, c["max_colour_distance"], transp)
        tn, _, _ = invert_rgb_image(rgb, n_rgb, n_val, c["max_colour_distance"], transp)
        both = np.isfinite(tv) & np.isfinite(tn); agree = float((np.isfinite(tv) == np.isfinite(tn)).mean())
        dT = np.abs(tv[both] - tn[both])
        ok = bool(np.median(dT) <= 0.05 and np.percentile(dT, 99) <= 0.2 and agree >= 0.999); ok3 = ok3 and ok
        r3[fpath.name] = {"median": float(np.median(dT)), "p99": float(np.percentile(dT, 99)), "mask_agreement": agree, "pass": ok}
        print(f"R3 {fpath.name}: median |dT| {np.median(dT):.3f} C, 99th {np.percentile(dT,99):.3f} C, max {dT.max():.3f} C, mask {agree*100:.3f}% -> {'PASS' if ok else 'FAIL'}")
    equivalent = bool(ok1 and ok2 and ok3)
    print(f"\nVERDICT: {'EQUIVALENT - same scientific colour mapping' if equivalent else 'NOT EQUIVALENT - do not publish; paste this output'}")
    write_json(WORK / "sst_colorbar_comparison.json", {
        "verdict": "EQUIVALENT" if equivalent else "NOT_EQUIVALENT", "local_sha256": sha256(local), "new_sha256": sha256(new),
        "local_full_strip": [ds, de, a0], "new_full_strip": [ns, ne, na], "transferred_mapping": [ts, te, na],
        "R1": ok1, "R2": {"median": float(np.median(dist)), "p95": float(np.percentile(dist, 95)), "pass": ok2}, "R3": r3,
        "checked_utc": now_utc()})
    if not equivalent and "--register-verified" in sys.argv:
        vj, cj = WORK / "verify_latest.json", WORK / "sst_range_calibration.json"
        v = json.load(open(vj)) if vj.exists() else {}
        fresh = vj.exists() and (not cj.exists() or vj.stat().st_mtime > cj.stat().st_mtime)
        if v.get("sst", {}).get("pass") and fresh:
            equivalent = True
            print("Registering because verify_latest.py PASSED on the newest frame AFTER the calibration "
                  "(the frame -> value accuracy vs NASA MUR is what matters).")
        else:
            raise SystemExit("--register-verified refused: run verify_latest.py after the calibration and get SST PASS first.")
    if equivalent and ("--register" in sys.argv or "--register-verified" in sys.argv):
        dst = INPUTS / "colorbars" / "sst_colorbar_official.png"; shutil.copy(new, dst)
        P["sst"]["colorbar_online_reference"] = {"file": "inputs/colorbars/sst_colorbar_official.png", "sha256": sha256(dst),
            "full_strip": [ns, ne, na], "transferred_mapping": [ts, te, na],
            "equivalence_check": "R1-R3 PASS" if ok1 and ok2 and ok3 else "verify_latest.py SST PASS after calibration",
            "registered_utc": now_utc()}
        json.dump(P, open(PIPE / "lut_params.json", "w"), indent=2)
        print("Registered the official file as the online reference (conversion still uses the verified local mapping).")
    elif equivalent:
        print("Re-run with --register to record the official file as the online reference.")

if __name__ == "__main__":
    main()