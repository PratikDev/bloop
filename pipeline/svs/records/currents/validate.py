"""Validate 3912 (every choice below was fixed before the comparison numbers were read):
(a) SST vs MUR25 at the weekly sample dates, 0.5° cells with streak coverage ≥ MIN_COV: global Spearman (provisional
    ≥ 0.9) and median |Δ| + bias per basin. Model (ECCO2) vs observation (MUR): an offset is expected, not hidden.
(b) Direction vs OSCAR in strong-current cells (OSCAR speed ≥ STRONG m/s) inside fixed boxes: median angular difference
    for the pattern drift (0–180°, chance 90°), the streak axis (0–90°, chance 45°) and the axis signed by the drift
    (0–180°, chance 90°). Provisional ≤ 45° for the two directions.
(c) East India Coastal Current: monthly along-shore component (towards N30°E = poleward) in coastal cells of the western
    Bay. 'Reversal shown' = poleward in ≥ 2 of Mar–May 2007 and equatorward in ≥ 2 of Oct–Dec 2007.
Usage (from pipeline/): python -m svs.records.currents.validate"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import flow, validate as V
from svs.config import raw_dir
from svs.regrid import centres
from . import MIN_COV, SID, grids
from .truth import GRID_DEG, sample_dates

ROOT = raw_dir(SID)
RECORD = "currents_3912"
STRONG = 0.25
BOXES = {"Gulf Stream": (-75, 33, -50, 42), "Kuroshio": (130, 28, 155, 38), "Agulhas": (15, -42, 35, -30),
         "Bay of Bengal (EICC)": (80, 8, 88, 20)}                                    # W, S, E, N
EICC_BOX, EICC_AXIS_DEG = (80, 8, 88, 21), 30.0

def basins(lat, lon):
    """Fixed partitions: Arctic, Southern Ocean, then Atlantic / Indian / Pacific by longitude, split N/S at the equator."""
    LA, LO = np.meshgrid(lat, lon, indexing="ij")
    atl = ((LO >= -70) & (LO < 20)) | ((LO >= -100) & (LO < -70) & (LA > 8))
    ind = (LO >= 20) & (LO < 120) & (LA < 30) & ~((LO >= 100) & (LA > 0))
    out = {"Arctic (>66°N)": LA > 66, "Southern Ocean (<50°S)": LA < -50}
    mid = (LA <= 66) & (LA >= -50)
    for name, m in (("Atlantic", atl), ("Indian", ind), ("Pacific", ~atl & ~ind)):
        out[f"North {name}" if name != "Indian" else "Indian"] = mid & m & (LA >= 0) if name != "Indian" else mid & m
        if name != "Indian": out[f"South {name}"] = mid & m & (LA < 0)
    out["Bay of Bengal"] = (LO >= 80) & (LO <= 95) & (LA >= 5) & (LA <= 23)
    return out

def in_box(lat, lon, b):
    LA, LO = np.meshgrid(lat, lon, indexing="ij")
    return (LO >= b[0]) & (LO <= b[2]) & (LA >= b[1]) & (LA <= b[3])

def main():
    g = grids()
    nums = list(g["frame_numbers"]); times = [dt.datetime.fromisoformat(t.replace("Z", "+00:00")) for t in g["times"]]
    lat, lon = centres(GRID_DEG)
    samples = [(n, t) for n, t in sample_dates() if n in nums]
    checks = []
    # (a) SST
    f_all, m_all, per_basin = [], [], {k: ([], []) for k in basins(lat, lon)}
    B = basins(lat, lon)
    for n, t in samples:
        p = ROOT / "truth" / "mur" / f"{t:%Y%m%d}.npz"
        if not p.exists(): continue
        k = nums.index(n); mur = np.load(p)["sst"]
        ok = (g["sst_cov"][k] >= MIN_COV) & np.isfinite(g["sst"][k]) & np.isfinite(mur)
        f_all.append(g["sst"][k][ok]); m_all.append(mur[ok])
        for name, m in B.items():
            per_basin[name][0].append(g["sst"][k][ok & m]); per_basin[name][1].append(mur[ok & m])
    f_all, m_all = np.concatenate(f_all), np.concatenate(m_all)
    rho, n = V.spearman(f_all, m_all)
    err = V.errors(f_all, m_all)
    basin_stats = {name: {**V.errors(np.concatenate(a), np.concatenate(b)), "spearman": V.spearman(np.concatenate(a), np.concatenate(b))[0]}
                   for name, (a, b) in per_basin.items()}
    checks.append(V.check(RECORD, "a_sst_mur", "ECCO2 SST (decoded from frames) vs MUR25 SST, same dates", kind="model-vs-obs",
                          source="MUR25-JPL-L4-GLOB-v04.2 (PO.DAAC)", threshold="Spearman ≥ 0.9 (provisional)", passed=rho >= 0.9,
                          metrics={"spearman": rho, "n_cells": n, "dates": len(samples), "median_abs_C": err["median_abs"], "bias_C": err["bias"],
                                   "per_basin": basin_stats}, note="Model vs observation: differences include real ECCO2–MUR differences."))
    say(f"(a) SST vs MUR: Spearman {rho:.3f} (n {n}); median |Δ| {err['median_abs']:.2f} °C; bias {err['bias']:+.2f} °C")
    # (b) directions in strong currents
    res = {b: {"drift": [], "axis": [], "combined": [], "speed_pairs": []} for b in BOXES}
    for n, t in samples:
        p = ROOT / "truth" / "oscar" / f"{t:%Y%m%d}.npz"
        if not p.exists(): continue
        k = nums.index(n); o = np.load(p); ou, ov = o["u"], o["v"]
        sp = np.hypot(ou, ov)
        du, dv = g["drift_u"][k], g["drift_v"][k]
        axis = (np.degrees(np.arctan2(g["axis_s2"][k], g["axis_c2"][k])) / 2) % 180
        comb = flow.sign_axis(axis, du, dv)
        odir = flow.compass(ou, ov)
        for b, box in BOXES.items():
            m = in_box(lat, lon, box) & (sp >= STRONG) & np.isfinite(du) & np.isfinite(axis) & (g["axis_w"][k] > 0)
            res[b]["drift"] += list(V.angle_diff(flow.compass(du[m], dv[m]), odir[m]))
            res[b]["axis"] += list(V.angle_diff(axis[m], odir[m] % 180, axial=True))
            res[b]["combined"] += list(V.angle_diff(comb[m], odir[m]))
            res[b]["speed_pairs"] += list(zip(np.hypot(du[m], dv[m]) / 86.4, sp[m]))          # km/day → m/s
    metrics = {}
    for b, r in res.items():
        sp_pairs = np.array(r["speed_pairs"]) if r["speed_pairs"] else np.zeros((0, 2))
        metrics[b] = {"n_cells": len(r["drift"]),
                      "median_deg_drift": float(np.median(r["drift"])) if r["drift"] else None,
                      "median_deg_axis": float(np.median(r["axis"])) if r["axis"] else None,
                      "median_deg_combined": float(np.median(r["combined"])) if r["combined"] else None,
                      "drift_speed_vs_oscar_spearman": V.spearman(sp_pairs[:, 0], sp_pairs[:, 1])[0] if len(sp_pairs) else None,
                      "median_drift_speed_m_s": float(np.median(sp_pairs[:, 0])) if len(sp_pairs) else None,
                      "median_oscar_speed_m_s": float(np.median(sp_pairs[:, 1])) if len(sp_pairs) else None}
    allv = lambda key: float(np.median(sum((res[b][key] for b in res), [])))
    overall = {"median_deg_drift": allv("drift"), "median_deg_axis": allv("axis"), "median_deg_combined": allv("combined"),
               "chance_deg_direction": 90.0, "chance_deg_axis": 45.0}
    checks.append(V.check(RECORD, "b_direction_oscar", "Flow direction vs OSCAR, strong-current cells", kind="model-vs-obs",
                          source="OSCAR_L4_OC_FINAL_V2.0 (PO.DAAC)", threshold="median ≤ 45° (provisional; directions)",
                          passed=overall["median_deg_combined"] <= 45, metrics={**overall, "regions": metrics},
                          note="Pattern drift = optical flow of the drawn streaks (eddies/meanders moving), not water speed. "
                               "Axis = streak orientation (direction modulo 180°). Combined = axis signed by the drift."))
    say(f"(b) direction vs OSCAR: {overall}")
    # (c) EICC
    eicc = in_box(lat, lon, EICC_BOX)
    oc = np.nanmean(g["ocean_frac"], 0)
    coastal = eicc & (oc > 0.5)
    land = oc < 0.5
    near = np.zeros_like(land)
    for dy in range(-2, 3):
        for dx in range(-2, 3): near |= np.roll(np.roll(land, dy, 0), dx, 1)
    coastal &= near
    ax = np.radians(EICC_AXIS_DEG); e_hat, n_hat = np.sin(ax), np.cos(ax)
    months = {}
    for k, t in enumerate(times):
        key = f"{t:%Y-%m}"
        du, dv = g["drift_u"][k], g["drift_v"][k]
        axis = (np.degrees(np.arctan2(g["axis_s2"][k], g["axis_c2"][k])) / 2) % 180
        comb = np.radians(flow.sign_axis(axis, du, dv))
        m = coastal & np.isfinite(du) & np.isfinite(axis)
        if not m.any(): continue
        d = months.setdefault(key, {"drift": [], "combined": [], "oscar": []})
        d["drift"].append(float(np.mean(du[m] * e_hat + dv[m] * n_hat)))
        d["combined"].append(float(np.mean(np.sin(comb[m]) * e_hat + np.cos(comb[m]) * n_hat)))
        p = ROOT / "truth" / "oscar" / f"{t:%Y%m%d}.npz"
        if p.exists():
            o = np.load(p); mo = m & np.isfinite(o["u"])
            if mo.any(): d["oscar"].append(float(np.mean(o["u"][mo] * e_hat + o["v"][mo] * n_hat)))
    monthly = {k: {kk: (float(np.mean(v)) if v else None) for kk, v in d.items()} for k, d in sorted(months.items())}
    def shown(key):
        sign = lambda m: np.sign(monthly.get(m, {}).get(key) or 0)
        return bool(sum(sign(m) > 0 for m in ("2007-03", "2007-04", "2007-05")) >= 2 and sum(sign(m) < 0 for m in ("2007-10", "2007-11", "2007-12")) >= 2)
    verdict = {"combined": shown("combined"), "drift": shown("drift"), "oscar": shown("oscar")}
    checks.append(V.check(RECORD, "c_eicc_reversal", "Bay of Bengal: East India Coastal Current seasonal reversal", kind="model-vs-obs",
                          source="frames (and OSCAR for context)", threshold="poleward ≥2 of Mar–May and equatorward ≥2 of Oct–Dec",
                          passed=verdict["combined"], metrics={"coastal_cells": int(coastal.sum()), "axis_deg": EICC_AXIS_DEG,
                                                               "monthly_along_shore": monthly, "shown": verdict},
                          note="Along-shore component towards N30°E (positive = poleward). Combined = unit vectors (no speed); "
                               "drift in km/day; OSCAR in m/s."))
    say(f"(c) EICC reversal shown: {verdict}")
    V.save(RECORD, checks)
    (ROOT / "validation_full.json").write_text(json.dumps(V._clean(checks), indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
