"""Validate 5011 (choices fixed before any ISS LIS flash was read; windows chosen by date in lis.py):
(a) per region (Bangladesh, Congo basin, Lake Maracaibo, Himalayan foothills): flashes counted from the frames in each
    10-day validation window vs ISS LIS V3 science flashes in the same window and box: Spearman across the windows
    (provisional ≥ 0.6 per region);
(b) per window: Spearman of 1° cell counts, frames vs ISS LIS, within ±BAND° (no threshold);
(c) pattern: all frame flashes per 1° cell vs the LIS/OTD HRFC climatology (an independent era and sensors; no threshold);
(d) Bangladesh: pre-monsoon (Mar–May) vs monsoon (Jun–Sep) flashes per year from the frames, with ISS LIS for the
    validation windows that fall in each season (context);
(e) frame times: the seasonal-anchor model (timing.py) and the measured mark lifetime against the stated 10-day window.
Usage (from pipeline/): python -m svs.records.lightning.validate"""
import datetime as dt
import numpy as np
from core.log import say
from svs import validate as V
from svs.config import raw_dir
from . import RECORD, SID, WINDOW_DAYS, regions
from .counts import grid, in_box, load
from .lis import OUT as LIS, TAI93, windows
from .truth import HRFC, OUT as TRUTH, grid as clim_grid

BAND = 50.0
SOURCE = "ISS LIS V3 science flashes (isslis_v3_fin, GHRC DAAC)"
PRE, MONSOON = (3, 4, 5), (6, 7, 8, 9)

def lis_window(w0):
    z = np.load(LIS / f"{w0:%Y%m%d}.npz")
    return z["lat"], z["lon"]

def main():
    c = load()
    regs = regions()
    wins = [w for w in windows() if (LIS / f"{w:%Y%m%d}.npz").exists()]
    rows, spatial = [], []
    for w0 in wins:
        t0, t1 = w0.timestamp(), (w0 + dt.timedelta(days=WINDOW_DAYS)).timestamp()
        sel = (c["when"] >= t0) & (c["when"] < t1)
        la, lo = lis_window(w0)
        row = {"window": f"{w0:%Y-%m-%d}"}
        for name, box in regs.items():
            row[name] = {"frames": float(c["n"][sel & in_box(c["lat"], c["lon"], box)].sum()), "lis": int(in_box(la, lo, box).sum())}
        rows.append(row)
        gf, gl = grid(c["lat"][sel], c["lon"][sel], c["n"][sel]), grid(la, lo, np.ones(len(la)))
        lat_c = 90 - (np.arange(gf.shape[0]) + 0.5)
        band = np.abs(lat_c) <= BAND
        rho, n = V.spearman(gf[band], gl[band]); spatial.append({"window": row["window"], "spearman": rho, "n_cells": n})
    per_region = {name: dict(zip(("spearman", "n_windows"), V.spearman([r[name]["frames"] for r in rows], [r[name]["lis"] for r in rows])))
                  for name in regs}
    checks = [V.check(RECORD, "a_region_counts_isslis", "Flash counts per region and 10-day window vs ISS LIS", kind="value", source=SOURCE,
                      threshold="Spearman ≥ 0.6 per region (provisional)",
                      passed=all(r["spearman"] is not None and np.isfinite(r["spearman"]) and r["spearman"] >= 0.6 for r in per_region.values()),
                      metrics={"per_region": per_region, "windows": rows},
                      note="Frame dates come from the seasonal-anchor model (approximate); a window is the frames dated inside it."),
              V.check(RECORD, "b_spatial_isslis", f"1° cell counts per window vs ISS LIS (|lat| ≤ {BAND:g}°)", source=SOURCE, passed=None,
                      metrics={"median_spearman": float(np.nanmedian([s["spearman"] for s in spatial])), "per_window": spatial})]
    hrfc, lat, lon = clim_grid(TRUTH / HRFC[1].rsplit("/", 1)[1], "HRFC_COM_FR")
    hr = np.nanmean(hrfc.reshape(180, 2, 360, 2), axis=(1, 3))
    total = grid(c["lat"], c["lon"], c["n"])
    band = np.abs(90 - (np.arange(180) + 0.5)) <= BAND
    rho, n = V.spearman(total[band], hr[band])
    checks.append(V.check(RECORD, "c_pattern_hrfc", "All frame flashes per 1° cell vs LIS/OTD HRFC flash rate (1995–2014)",
                          source="LIS/OTD 0.5° HRFC V2.3.2015 (GHRC DAAC)", kind="context", passed=None, metrics={"spearman": rho, "n_cells": n},
                          note="Different years and sensors (TRMM LIS + OTD): a check of the global pattern, not of values."))
    bd = in_box(c["lat"], c["lon"], regs["Bangladesh"])
    months = np.array([dt.datetime.fromtimestamp(t, dt.timezone.utc).month for t in c["when"][bd]])
    years = np.array([dt.datetime.fromtimestamp(t, dt.timezone.utc).year for t in c["when"][bd]])
    season = {int(y): {"pre_monsoon": float(c["n"][bd][(years == y) & np.isin(months, PRE)].sum()),
                  "monsoon": float(c["n"][bd][(years == y) & np.isin(months, MONSOON)].sum())} for y in sorted(set(years))}
    lis_season = {r["window"]: {"season": "pre_monsoon" if int(r["window"][5:7]) in PRE else "monsoon" if int(r["window"][5:7]) in MONSOON else "other",
                                "frames": r["Bangladesh"]["frames"], "lis": r["Bangladesh"]["lis"]} for r in rows}
    checks.append(V.check(RECORD, "d_bangladesh_seasons", "Bangladesh: pre-monsoon (Mar–May) vs monsoon (Jun–Sep) flashes", kind="context",
                          source="frames (all years) and ISS LIS (validation windows)", passed=None,
                          metrics={"frames_by_year": season, "validation_windows": lis_season}))
    m = c["model"]; life = c["meta"]["lifetime_frames"]
    seg = next(s for s in m["segments"] if s["frames"][0] <= life["sample"][0] <= s["frames"][1])
    checks.append(V.check(RECORD, "e_frame_times", "Frame times: seasonal anchors and the mark lifetime", kind="context", source="frames + HRMC",
                          passed=None, metrics={"anchors": m["anchors"], "days_per_frame_range": [min(s["days_per_frame"] for s in m["segments"]),
                                                                                                    max(s["days_per_frame"] for s in m["segments"])],
                                                "lifetime_frames_median": life["median"], "lifetime_days_at_model_rate": life["median"] * seg["days_per_frame"],
                                                "stated_window_days": WINDOW_DAYS},
                          note="The movie has no date; times are approximate. A drawn mark lasts lifetime_frames; at the model's rate that is the "
                               "window the picture shows, compared with the SVS text's 10 days."))
    V.save(RECORD, checks)
    say(f"(a) {per_region}; (b) median {checks[1]['metrics']['median_spearman']:.3f}; (c) {rho:.3f}; (e) lifetime "
        f"{life['median']} frames ≈ {checks[-1]['metrics']['lifetime_days_at_model_rate']:.1f} days")

if __name__ == "__main__":
    main()
