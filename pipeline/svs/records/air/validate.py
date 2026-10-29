"""Validate 5533/5518 (every choice below was fixed before the comparison numbers were read).
(a) Same model: the frames' 1° cell means (cells with ≥ MIN_FRAC of their pixels decoded) vs GEOS-CF v1 at the 1° cell
    centres, at the 24 validation hours (frame k ↔ the hourly mean starting at its time). Per species, pooled: Spearman
    (provisional ≥ 0.9) and median relative error (provisional ≤ 15 %). PM2.5 against pm25_rh35_gcc; GOCART reported
    as a second reference. Censored (below-range) cells: tied minimum in Spearman, excluded from relative error; their
    agreement (is GEOS-CF also under the bound?) reported. ±1 h: sensitivity only, never used to choose.
(b) Independent: Dhaka ground PM2.5 (OpenAQ; only sensors with data in the period count) vs the frame PM2.5 at the
    station's pixel in the hourly Bangladesh box, weekly means over hours both have. Spearman and bias; no threshold.
Usage (from pipeline/): python -m svs.records.air.validate"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import frames, georef, validate as V
from svs.config import raw_dir
from . import ALT, PERIOD
from .truth import OUT as TRUTH, RADIUS_M

RECORD = "air_5533"
WORK = raw_dir(ALT, "work")
MIN_FRAC = 0.5
REFS = {"pm25": "pm25", "co": "co", "nox": "nox", "o3": "o3"}

def model(name, k, off=0):
    p = TRUTH / f"geoscf_{name}_{k:04d}_{off:+d}.npy"
    return np.load(p) if p.exists() else None

def same_model(sp, ref, off=0):
    v = np.load(WORK / f"valid_{sp}.npz")
    bound = json.loads((WORK / "decode.json").read_text(encoding="utf-8"))["species"][sp].get("ramp") or {}
    bound = bound.get("below_range_bound")
    f_all, m_all, f_dec, m_dec, cens_agree = [], [], [], [], []
    hours = 0
    for i, k in enumerate(v["k"]):
        m = model(ref, int(k), off)
        if m is None: continue
        hours += 1
        dec = (v["frac"][i] >= MIN_FRAC) & np.isfinite(v["values"][i]) & np.isfinite(m)
        cen = (v["below"][i] >= 0.5) & np.isfinite(m) & ~dec if bound else np.zeros_like(dec)
        f_dec.append(v["values"][i][dec]); m_dec.append(m[dec])
        f_all.append(np.concatenate([v["values"][i][dec], np.full(cen.sum(), bound or 0.0)])); m_all.append(np.concatenate([m[dec], m[cen]]))
        if bound: cens_agree.append(m[cen] < bound)
    if not hours: return None
    f_dec, m_dec, f_all, m_all = (np.concatenate(x) for x in (f_dec, m_dec, f_all, m_all))
    rho_dec, n_dec = V.spearman(f_dec, m_dec)
    rho_all, n_all = V.spearman(f_all, m_all)
    err = V.errors(f_dec, m_dec)
    pos = (f_dec > 0) & (m_dec > 0)
    out = {"hours": hours, "spearman_decoded": rho_dec, "n_decoded": n_dec, "spearman_with_censored": rho_all, "n_with_censored": n_all,
           "median_rel_error": err["median_rel"], "median_log10_ratio": float(np.median(np.log10(f_dec[pos] / m_dec[pos]))),
           "median_frame": float(np.median(f_dec)), "median_model": float(np.median(m_dec))}
    if bound:
        ca = np.concatenate(cens_agree) if cens_agree else np.array([])
        out.update(below_bound=bound, censored_cells=int(len(ca)), censored_model_also_below=float(ca.mean()) if len(ca) else None)
    return out

def ground():
    p = TRUTH / "openaq_dhaka.json"
    bdp = WORK / "bd_pm25.npz"
    if not p.exists() or not bdp.exists(): return None
    d = json.loads(p.read_text(encoding="utf-8"))
    bd = np.load(bdp)
    hours, _ = frames.times_linear(PERIOD[0], PERIOD[1], bd["values"].shape[0])
    index = {t.strftime("%Y-%m-%dT%H"): i for i, t in enumerate(hours)}
    out = {}
    for s in d["sensors"]:
        rows = [r for r in d["rows"] if r["sensor"] == s["sensor"]]
        if not rows: continue
        r_ = int(np.argmin(np.abs(bd["lat"] - s["lat"]))); c_ = int(np.argmin(np.abs(bd["lon"] - s["lon"])))
        pairs = []
        for r in rows:
            i = index.get(r["utc_from"][:13])
            if i is None: continue
            fv = bd["values"][i, r_, c_]
            if np.isfinite(fv) and r["value"] >= 0: pairs.append((hours[i], float(fv), float(r["value"])))
        if not pairs: continue
        weeks = {}
        for t, fv, gv in pairs: weeks.setdefault(t.isocalendar()[:2], []).append((fv, gv))
        wf = np.array([np.mean([a for a, _ in w]) for w in weeks.values()]); wg = np.array([np.mean([b for _, b in w]) for w in weeks.values()])
        hf = np.array([p_[1] for p_ in pairs]); hg = np.array([p_[2] for p_ in pairs])
        out[f"{s['location']} (sensor {s['sensor']}, {s['provider']})"] = {
            "pixel": [float(bd["lat"][r_]), float(bd["lon"][c_])], "hours": len(pairs), "weeks": len(weeks),
            "weekly_spearman": V.spearman(wf, wg)[0], "weekly_bias_median": float(np.median(wf - wg)),
            "weekly_ratio_median": float(np.median(wf / np.maximum(wg, 1e-6))), "hourly_spearman": V.spearman(hf, hg)[0],
            "weekly": [[f"{y}-W{w:02d}", float(a), float(b)] for (y, w), a, b in zip(weeks.keys(), wf, wg)]}
    return out

def main():
    checks = []
    for sp, ref in REFS.items():
        r = same_model(sp, ref)
        if r is None: continue
        sens = {f"{off:+d} h": same_model(sp, ref, off) for off in (-1, 1)} if sp in ("pm25", "o3") else {}
        extra = {"gocart": same_model(sp, "pm25_gocart")} if sp == "pm25" else {}
        passed = bool(r["spearman_decoded"] >= 0.9 and r["median_rel_error"] <= 0.15)
        checks.append(V.check(RECORD, f"a_{sp}_geoscf", f"{sp}: frames vs GEOS-CF v1 at the same hours", kind="value",
                              source="GEOS-CF v1 chm_tavg_1hr_g1440x721_v1 (NASA GMAO, OPeNDAP)",
                              threshold="Spearman ≥ 0.9 and median relative error ≤ 15 % (provisional)", passed=passed,
                              metrics={**r, "sensitivity_time_offset": {k: (v and {kk: v[kk] for kk in ("spearman_decoded", "median_rel_error")}) for k, v in sens.items()},
                                       **({"vs_gocart": {kk: extra["gocart"][kk] for kk in ("spearman_decoded", "median_rel_error")}} if extra.get("gocart") else {})},
                              note="Same model, so this tests the decoding. SVS links the GEOS-CF v2 datashare, but no public v2 "
                                   "archive covers Jul–Sep 2024; v1 is the only one that does."))
        say(f"(a) {sp}: Spearman {r['spearman_decoded']:.3f}, median rel. error {r['median_rel_error']:.1%}, n {r['n_decoded']}")
    g = ground()
    if g is not None:
        checks.append(V.check(RECORD, "b_pm25_dhaka_ground", "PM2.5 at Dhaka ground stations vs the frames (weekly)", kind="model-vs-obs",
                              source="OpenAQ v3 (stations within 25 km of Dhaka with data in the period)", passed=None,
                              metrics={"stations": g, "stations_with_data": len(g), "radius_m": RADIUS_M,
                                       "sensors_listed": len(json.loads((TRUTH / "openaq_dhaka.json").read_text(encoding="utf-8"))["sensors"])},
                              note="Model vs ground, no threshold. Only the stations listed had any hours in 1 Jul – 14 Sep 2024."))
        say(f"(b) ground: {[(k, round(v['weekly_spearman'], 3), round(v['weekly_bias_median'], 1)) for k, v in g.items()]}")
    V.save(RECORD, checks)

if __name__ == "__main__":
    main()
