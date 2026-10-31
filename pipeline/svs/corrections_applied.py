"""What each of the report's 18 corrections came to once applied (Phase 1, Phase 2), read from the records' own
validation files and the related registry — the 'Applied' column of docs/related/CORRECTIONS.md.
Usage: outcomes() → {number: text}."""
import json
from .config import CACHE, record_dir

def checks(record):
    p = record_dir(record) / "validation.json"
    return {c["id"]: c for c in json.loads(p.read_text(encoding="utf-8"))["checks"]} if p.exists() else {}

def related(sid):
    rows = {r["svs_id"]: r for r in json.loads((CACHE / "related_records.json").read_text(encoding="utf-8"))} if (CACHE / "related_records.json").exists() else {}
    r = rows.get(sid)
    return f"onboarded as `{r['record']}` ({r['status']})" if r else "not onboarded"

def f(x, spec=".2f"):
    return "n/a" if x is None else format(x, spec)

def outcomes():
    fo, co, oc, so, li, ae, air = (checks(r) for r in ("forest_4950", "co2_5196", "ocean2_5425", "sonification_13786", "lightning_5011",
                                                        "aerosols_5669", "air_5533"))
    out = {}
    if "a_l2b_frame_cells" in fo:
        m = fo["a_l2b_frame_cells"]["metrics"]
        good = [v for v in m["per_still"].values() if v["view_iou"] >= 0.9]
        out[1] = (f"stills carry the 0–50 m bar (no mismatch); vs L2B RH100 in the frame's cells ρ {f(m['spearman'])}, {f(m['median_diff_m'], '+.1f')} m "
                  f"(pattern only); where the globe fit is good, ρ {', '.join(f(v['spearman']) for v in good)}")
    if "d_gradient_oco2" in co:
        m = co["d_gradient_oco2"]["metrics"]
        out[2] = f"5436 in use (IoU {f(co['c_georef_surface']['metrics']['iou'], '.3f')}); band gradient vs OCO-2 ρ {f(m['spearman_band_means'])}, N–S {f(m['ns_frame_median'], '+.1f')} vs {f(m['ns_source_median'], '+.1f')} ppm"
    if "d_depth_temperature" in oc:
        t = oc["d_depth_temperature"]["metrics"]
        out[3] = f"5479 ingested; temperature closest to WOA23 at {t['best']} (Δ {f(t['levels'][t['best']]['median_diff'], '+.1f')} °C vs {f(t['levels']['surface']['median_diff'], '+.1f')} at the surface); GLORYS12 pending an account"
    if "d_size_area_flux" in so:
        m = so["d_size_area_flux"]["metrics"]
        out[4] = f"verbatim quote in 13786.md ('…stars farther from the center are higher pitched'); size test ρ area {f(m['single_star']['area']['spearman'])}, flux {f(m['single_star']['flux']['spearman'])}: no relation"
    if "a2_region_rates_isslis" in li:
        m = li["a2_region_rates_isslis"]["metrics"]["per_region"]
        out[5] = (f"V3 in use, V1 noted; rates: Bangladesh ρ {f(m['Bangladesh']['spearman'])}; QC data do not share the 60–90°E gap "
                  f"(view ratio {f(li['f_gap_60_90E']['metrics']['median_view_ratio'])})")
    out[6] = "no change needed: 5533 was already checked against GEOS-CF v1 (to 2 Jan 2026); v2 never spliced"
    if "a2_pm25_variable_search" in air:
        g = air["a2_pm25_variable_search"]["metrics"].get("candidates", {}).get("chm_tavg pm25_rh35_gocar", {})
        out[7] = f"GOCART field was among those tried (kg/m³ × 1e9): ratio {f(g.get('median_ratio'))}, ρ {f(g.get('spearman'))} — worse than GCC; PM2.5 stays relative"
    if "a0_type_geosfp" in ae:
        m = ae["a0_type_geosfp"]["metrics"]["per_type"]
        out[8] = "same model (GEOS-FP) no better than MERRA-2: " + ", ".join(f"{k} {f(v['spearman'])}" for k, v in m.items())
    out[9], out[10], out[12], out[13] = related(5624), related(5650), related(4939), related(4993)
    out[11] = "NEO not used; GIBS colormap record rel_gibs (15 layers, exact decode) replaces it"
    out[14] = "confirmed: 5313 checked against VNP46A4 v2 (Collection 2), sign and rank only"
    out[15] = "no change needed: 3912 already paired by its dates file"
    out[16] = "conflict kept in 5425.md (text 2021–23; 5505 dataset 13 Nov 2022 – 25 Dec 2023; dates layer 2021–23)"
    out[17] = "the Resources tab is drawn by script; NOV13_CHECKLIST.md step 1 diffs it by paste"
    out[18] = "TEMPO items labelled North America; P-Tree not used (no redistribution); TROPOMI/CAMS need accounts"
    return out
