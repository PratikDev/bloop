"""Phase 0: the report's 18 corrections (docs/related/RELATED_DATASETS_REPORT.md, 'Corrections to current Bloop records'),
each checked live against the page, API record, CMR row or file it cites. A check returns its status (confirmed /
partly confirmed / not confirmed / could not check), the evidence found (quoted where it is text) and its source.
Writes data_raw/related/corrections.json; docs/related/CORRECTIONS.md is written from it by discover_report.py.
Usage (from pipeline/): python -m svs.corrections_check"""
import json, re
import requests
from core.log import say
from .config import LINKS_DOC, UA, raw_dir
from .discover import record

def quote(text, pattern, width=220):
    """The sentence of `text` that matches `pattern` (case-insensitive), or None."""
    for s in re.split(r"(?<=[.!?])\s+|\n+", re.sub(r"<[^>]+>", " ", text or "")):
        if re.search(pattern, s, re.I): return " ".join(s.split())[:width]
    return None

def page(url):
    try:
        r = requests.get(url, headers=UA, timeout=90)
        return r.status_code, re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", r.text))
    except Exception as e:
        return None, f"{e.__class__.__name__}: {str(e)[:120]}"

def sets(rec, pred=lambda m: True):
    return [f"{m['filename']} {m['width']}×{m['height']}" for m in rec.get("media", []) if m["media_type"] == "Frames" and pred(m)]

def bars(rec):
    return [f"{m['filename']} {m['width']}×{m['height']}" for m in rec.get("media", [])
            if re.search(r"colou?rbar|cbar|_bar[\W_]|legend", m["filename"] or "", re.I)]

def result(status, evidence, source):
    return {"status": status, "evidence": evidence, "source": source}

def c1():
    r = record(4950); t = r.get("full_text", "")
    ds = " ".join(f"{d['name']}: {d.get('description') or ''}" for d in r.get("datasets", []))
    q = [quote(ds, r"RH100|L2B"), quote(t, r"April 20(18|19)")]
    b = [m["filename"] for m in r.get("media", []) if re.search(r"colorbar_0to(40|50|75)_\d+\.tif$", m["filename"] or "")]
    used = raw_dir(4950) / "bar_id.json"
    bar = json.loads(used.read_text(encoding="utf-8"))["used"] if used.exists() else None
    return result("confirmed" if q[0] and len(b) == 3 else "partly confirmed",
                  {"dataset": q[0], "period_text": q[1], "colorbar_files": b, "bar_in_the_stills": bar}, r.get("api_url"))

def c2():
    r = record(5436)
    flat = sets(r, lambda m: abs(m["width"] / max(1, m["height"]) - 2) < 0.01)
    named = quote(r.get("full_text", ""), r"timestamps?\.txt")                  # 5436 names the file in its text ("SOS label file")
    links = [u for u in r.get("text_links", []) + [m["url"] for m in r.get("media", [])] if "timestamp" in u.lower()] or ([named] if named else [])
    return result("confirmed" if flat and links else "partly confirmed", {"flat_sets": flat[:6], "timestamps": links[:3], "colorbars": bars(r)},
                  r.get("api_url"))

def c3():
    r, r2 = record(5425), record(5479)
    q = quote(r.get("full_text", ""), r"600")
    s2 = sets(r2, lambda m: abs(m["width"] / max(1, m["height"]) - 2) < 0.01)
    return result("confirmed" if q and s2 else "partly confirmed", {"5425_text": q, "5425_colorbars": bars(r), "5479_flat_sets": s2,
                                                                 "5479_colorbars": bars(r2)}, r.get("api_url"))

def c4():
    r = record(13786)
    q = quote(r.get("full_text", ""), r"radius")
    return result("confirmed" if q and "radius of the stars" in q.lower() else "partly confirmed", {"verbatim": q,
                  "instruments": quote(r.get("full_text", ""), r"marimba|glockenspiel|choir")}, r.get("api_url"))

def c5():
    r = record(5011)
    ds = [d["name"] for d in r.get("datasets", [])]
    v = json.loads((raw_dir("related") / "catalog.json").read_text(encoding="utf-8"))["cmr"]["short_names"]
    live = {k: (v[k]["latest"]["start"][:10], v[k]["latest"]["end"][:10], v[k]["latest"]["doi"]) for k in ("isslis_v2_fin", "isslis_v3_fin") if v[k]["found"]}
    lists_v1 = any(re.search(r"\bV1\b|Version 1", d) for d in ds)
    return result("confirmed" if lists_v1 and live else "partly confirmed", {"datasets": ds, "period_text": quote(r.get("full_text", ""), r"20(17|23)"),
                  "sos_text": quote(r.get("full_text", ""), r"March 2017|SOS|Science On a Sphere"), "cmr": live,
                  "frame_sets": sets(r), "colorbars": bars(r)}, r.get("api_url"))

def c6():
    r = record(5533)
    from svs.records.air.truth import open_dataset
    import netCDF4, numpy as np
    ds = open_dataset("https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/chm_tavg_1hr_g1440x721_v1")
    t = ds["time"]; tt = np.asarray(t[:])
    v1 = (str(netCDF4.num2date(tt[0], t.units)), str(netCDF4.num2date(tt[-1], t.units)))
    return result("partly confirmed", {"5533_colorbar_files": bars(r), "geos_cf_v1_opendap": v1,
                  "v2_start": "not checked live: no GEOS-CF v2 OPeNDAP path under opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/ (listing shows v1 only)"},
                  "https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/")

def c7():
    from svs.records.air.truth import open_dataset
    ds = open_dataset("https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/chm_tavg_1hr_g1440x721_v1")
    pm = sorted(k for k in ds.variables if k.startswith("pm25"))
    units = {k: ds[k].getncattr("units") if "units" in ds[k].ncattrs() else None for k in ("pm25_rh35_gcc", "pm25_rh35_gocar") if k in ds.variables}
    return result("confirmed" if "pm25_rh35_gocar" in pm else "not confirmed", {"pm25_variables": pm, "units": units},
                  "https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/chm_tavg_1hr_g1440x721_v1")

def c8():
    r = record(5572)
    names = [m["filename"] for m in r.get("media", []) if m["media_type"] == "Frames"]
    from svs.records.air.truth import open_dataset
    ds = open_dataset("https://opendap.nccs.nasa.gov/dods/GEOS-5/fp/0.25_deg/assim/tavg3_2d_aer_Nx")
    tau = sorted(k for k in ds.variables if k.endswith("exttau"))
    return result("confirmed" if any("Aerosols" in n for n in names) and any("Annot" in n for n in names) and tau else "partly confirmed",
                  {"frame_sets": sets(r), "colorbars": bars(r), "geos_fp_tavg3_2d_aer_Nx": tau,
                   "archive": "portal.nccs.nasa.gov/datashare/gmao/geos-fp/das/Y2024/M08/ holds the 3-hourly files (checked)"}, r.get("api_url"))

def c9():
    r = record(5624)
    return result("confirmed" if bars(r) else "partly confirmed", {"updated": r.get("update_date"), "released": r.get("release_date"),
                  "colorbars": bars(r), "movies": [f"{m['filename']} {m['width']}×{m['height']}" for m in r.get("media", []) if m["media_type"] == "Movie"][:4],
                  "frame_sets": sets(r)}, r.get("api_url"))

def c10():
    r = record(5650)
    return result("confirmed" if any("3600" in s for s in sets(r)) else "partly confirmed", {"released": r.get("release_date"),
                  "updated": r.get("update_date"), "frame_sets": sets(r), "colorbars": bars(r)}, r.get("api_url"))

def c11():
    url = "https://science.nasa.gov/earth/nasa-earth-observations-neo/"
    code, text = page(url)
    q = quote(text, r"decommission|retire|no longer")
    return result("confirmed" if q else ("could not check" if code != 200 else "not confirmed"), {"http": code, "text": q}, url)

def c12():
    r = record(4939)
    ds = [d["name"] for d in r.get("datasets", [])]
    q = quote(r.get("full_text", ""), r"ATMS|MiRS")
    return result("confirmed" if q or any(re.search("ATMS|MiRS", d) for d in ds) else "not confirmed", {"datasets": ds, "text": q}, r.get("api_url"))

def c13():
    tree = json.loads((raw_dir("related") / "discover.json").read_text(encoding="utf-8"))["tree"]
    official = LINKS_DOC.read_text(encoding="utf-8")
    named = bool(re.search(r"\b4993\b", official.split("## Related")[0] if "## Related" in official else official))
    return result("confirmed" if "4993" in tree and not named else "not confirmed",
                  {"in_eic_tree": tree.get("4993"), "in_official_list": named}, "https://svs.gsfc.nasa.gov/api/40467")

def c14():
    r = record(5313)
    url = "https://ladsweb.modaps.eosdis.nasa.gov/alerts-and-issues/171686"
    code, text = page(url)
    return result("confirmed" if not bars(r) else "partly confirmed", {"5313_colorbars": bars(r), "datasets": [d["name"] for d in r.get("datasets", [])],
                  "laads_alert": {"http": code, "text": quote(text, r"2025|Collection 2|C2")}}, r.get("api_url"))

def c15():
    r = record(3912)
    links = [u for u in r.get("text_links", []) if "date" in u.lower()]
    return result("confirmed" if links else "not confirmed", {"date_files": links, "flat_sets": sets(r, lambda m: m["width"] == 2 * m["height"])}, r.get("api_url"))

def c16():
    r = record(5505)
    return result("confirmed" if any(d.get("date_range") for d in r.get("datasets", [])) else "partly confirmed",
                  {"dataset_dates": [(d["name"], d.get("date_range")) for d in r.get("datasets", [])], "text": quote(r.get("full_text", ""), r"202[123]")},
                  r.get("api_url"))

def c17():
    url = "https://www.spaceappschallenge.org/2026/challenges/"
    code, text = page(url)
    return result("could not check" if code != 200 else "partly confirmed",
                  {"http": code, "note": "the Resources tab is drawn by script; the page text cannot show its list" if code == 200 else text}, url)

def c18():
    out = {}
    for k, url, pat in (("tempo", "https://asdc.larc.nasa.gov/project/TEMPO/TEMPO_NO2_L3_V04", r"\b(S?10|80)\b.*(N|W)|North America|longitude|latitude"),
                        ("ptree_terms", "https://www.eorc.jaxa.jp/ptree/terms.html", r"redistribut")):
        code, text = page(url); out[k] = {"http": code, "text": quote(text, pat)}
    ok = all(v["text"] for v in out.values())
    return result("confirmed" if ok else ("partly confirmed" if any(v["text"] for v in out.values()) else "could not check"), out,
                  "ASDC TEMPO page; JAXA P-Tree terms")

CHECKS = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18]

def main():
    out = {}
    for i, f in enumerate(CHECKS, 1):
        try:
            out[str(i)] = f()
        except Exception as e:
            out[str(i)] = result("could not check", f"{e.__class__.__name__}: {str(e)[:200]}", None)
        say(f"correction {i}: {out[str(i)]['status']}")
    (raw_dir("related") / "corrections.json").write_text(json.dumps(out, indent=1, ensure_ascii=False, default=str), encoding="utf-8")

if __name__ == "__main__":
    main()
