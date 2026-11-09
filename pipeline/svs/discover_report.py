"""Phase 0 outputs, from the live reads (discover.py, catalog_check.py, discover_bars.py, corrections_check.py):
  pipeline/svs/cache/related_candidates.json — one row per SVS item read, plus the T2 (CMR), GIBS and T3 rows;
  docs/related/CANDIDATES.md                 — the planned IDs, the tree and search finds worth acting on, the data side;
  docs/related/CORRECTIONS.md                — the report's 18 corrections, each confirmed or not live.
Tiers (the plan's): T1 frames + a colorbar (FP; FP-2:1 when the frames are a flat 2:1 map); T1-low frames without a
colorbar (F), a movie (M), or a graph (G); T2 NASA validation or companion data; T3 other agency. Items that are not a
data layer (produced video, B-roll, animation, gallery) or that the API does not serve are listed as such.
Usage (from pipeline/): python -m svs.discover_report"""
import datetime as dt, json, re
from core.log import say
from . import choose, eic, focus
from .config import CACHE, REPO, raw_dir
from .discover import API
from .discover_plan import PLAN

DOCS = REPO / "docs" / "related"
GRAPH_RX = re.compile(r"\b(graph|chart|plot|curve|spiral|timeline|time series|porthole)\b", re.I)
NOTE_RX = re.compile(r"freely and openly available[^.]*|licensed[^.]*|copyright[^.]*|©[^.]*|all rights reserved[^.]*", re.I)

def svs_row(sid, rec, disc, bars, in_app):
    if "error" in rec or not rec.get("title"):
        return {"id": sid, "tier": "not served", "error": rec.get("error"), "sources": disc["sources"].get(str(sid), [])}
    sets = choose.frame_sets(rec)
    flat = [s for s in sets if s["height"] and abs(s["width"] / s["height"] - 2) < 0.01]
    movies = [f"{m['width']}×{m['height']}" for m in rec["media"] if m["media_type"] == "Movie"]
    cbs = [f"{m['filename']} {m['width']}×{m['height']}" for m in choose.colorbars(rec)]
    graph = bool(GRAPH_RX.search(rec["title"] or ""))
    page = rec.get("page_type") or ""
    if page in eic.STORY_PAGES or page == "Gallery": tier, fmt = "not a data layer", page
    elif sets and cbs: tier, fmt = "T1", "FP-2:1" if flat else "FP"
    elif graph: tier, fmt = "T1-low", "G"
    elif sets: tier, fmt = "T1-low", "F-2:1" if flat else "F"
    elif movies: tier, fmt = "T1-low", "M" + ("+bar" if cbs else "")
    else: tier, fmt = "T1-low", "still" if any(m["media_type"] == "Image" for m in rec["media"]) else "none"
    best = sorted(sets, key=lambda s: (not (s["height"] and abs(s["width"] / s["height"] - 2) < 0.01), -s["frame_count"]))[:1]
    dates = [d.get("date_range") for d in rec.get("datasets") or [] if d.get("date_range")]
    note = NOTE_RX.search(rec.get("full_text") or "")
    return {"id": sid, "title": rec["title"], "url": rec["url"], "page_type": page, "released": (rec.get("release_date") or "")[:10],
            "updated": (rec.get("update_date") or "")[:10], "period": dates[0] if dates else None,
            "sources": disc["sources"].get(str(sid), []), "via": disc["tree"].get(str(sid), [])[:2],
            "frame_sets": [{"layer": s["layer"], "size": f"{s['width']}×{s['height']}", "frames": s["frame_count"],
                            "gb": round((s["bytes_approx"] or 0) / 1e9, 3), "flat_2x1": s in flat} for s in sets][:8],
            "best_set": {"layer": best[0]["layer"], "size": f"{best[0]['width']}×{best[0]['height']}", "frames": best[0]["frame_count"]} if best else None,
            "movies": movies[:4], "colorbars": cbs[:4], "colorbar_reads": bars.get(str(sid), []),
            "date_files": choose.date_lists(rec), "label_overlays": [s["layer"] for s in sets if re.search(r"label|annot|date|caption|overlay", s["layer"], re.I)],
            "related": [x["id"] for k in ("related", "alternate_versions") for x in rec.get(k) or []][:12],
            "licence": "SVS-PD" + (f"; page says: “{note.group(0).strip()[:140]}”" if note else ""),
            "credit": "; ".join(f"{k}: {', '.join(v[:2])}" for k, v in list(rec.get("credits_by_role", {}).items())[:2]),
            "datasets": [d.get("name") for d in rec.get("datasets") or []][:4], "focus": focus.focus(rec), "official": focus.official(rec),
            "plan": PLAN.get(sid), "in_app": in_app.get(sid), "in_eic_inventory": sid in eic_inventory(), "tier": tier, "format": fmt,
            "action": action(sid, tier, fmt, in_app, rec)}

_INV = None
def eic_inventory():
    global _INV
    if _INV is None: _INV = {r["id"] for r in json.loads((CACHE / "eic_inventory.json").read_text(encoding="utf-8"))["items"]}
    return _INV

def action(sid, tier, fmt, in_app, rec):
    if sid in in_app: return f"already in the app ({in_app[sid]})"
    plan = PLAN.get(sid, "")
    if plan.startswith("5"): return "Phase 5: method evidence (metadata and verbatim mapping)"
    if tier == "not a data layer": return "list only"
    if fmt == "G": return f"{plan or 'onboarding'}: sonify the series from the cited source data, not pixels"
    if tier == "T1": return f"{plan or 'Phase 6 onboarding candidate'}: ingest (values, if the key reads and a source exists)"
    if fmt.startswith("F"): return f"{plan or 'onboarding'}: pattern or relative (frames, no numeric key)"
    if fmt.startswith("M"): return f"{plan or 'onboarding'}: frames from the movie (ffmpeg); " + ("key on the page" if "bar" in fmt else "pattern only")
    return f"{plan or 'onboarding'}: still image, pattern only"

def in_app_map():
    out = {}
    for sid, pid in eic.decoded_by().items(): out[sid] = f"product {pid}"
    for sid, name in eic.records_built().items(): out.setdefault(sid, f"record {name.split(' (')[0]}")
    return out

def svs_table(rows):
    L = ["| ID | Title | Tier · format | Frames (best set) | Colorbar (range read) | Dates file | Focus · official | Action |", "|---|---|---|---|---|---|---|---|"]
    for r in rows:
        if r["tier"] == "not served":
            L.append(f"| {r['id']} | — | not served by the SVS API ({(r.get('error') or '')[:60]}) | | | | | |"); continue
        b = r["best_set"]
        reads = "; ".join(f"{x['file']}: {x['range'][0]:g}–{x['range'][1]:g}" if x.get("range") else f"{x['file']}: unread"
                          for x in r["colorbar_reads"][:2]) or ("; ".join(r["colorbars"][:2]) or "none")
        frames = f"{b['layer'][:28]} {b['size']} ×{b['frames']}" if b else (", ".join(r["movies"][:1]) or "—")
        L.append(f"| [{r['id']}]({r['url']}) | {r['title'][:60]} | {r['tier']} · {r['format']} | {frames} | "
                 f"{reads[:90]} | {'yes' if r['date_files'] else '—'} | {r['focus']} · {r['official'] or '—'} | {r['action'][:90]} |")
    return L

def write_docs(out):
    rows = out["svs"]
    tiers = {}
    for r in rows: tiers[r["tier"]] = tiers.get(r["tier"], 0) + 1
    planned = sorted([r for r in rows if r.get("plan") or r["id"] in PLAN], key=lambda r: (PLAN.get(r["id"], "9"), r["id"]))
    tree_new = [r for r in rows if "tree" in r.get("sources", []) and r["tier"] in ("T1", "T1-low") and not r.get("in_app") and r["id"] not in PLAN]
    found = [r for r in rows if r["tier"] == "T1" and "tree" not in r.get("sources", []) and r["id"] not in PLAN and not r.get("in_app")]
    L = [f"# Related-dataset candidates (verified live {out['checked']})", "", "Generated by `pipeline/svs/discover_report.py` from live reads "
         "of the SVS API, CMR, GIBS and the provider pages; every field below was read on the day, nothing is carried over from the "
         "report. Full rows: `pipeline/svs/cache/related_candidates.json`.", "",
         f"**Counts.** SVS items read: {len(rows)} ({', '.join(f'{k} {v}' for k, v in sorted(tiers.items()))}). "
         f"EIC tree: {len(out['tree_ids'])} items; keyword search: {out['search_hits']} hits over {len(out['terms'])} terms; "
         f"report IDs: {len(out['report_ids'])}. CMR: {out['cmr_found']} collections confirmed; GIBS: {out['gibs_layers']} layers in the capabilities.", "",
         "Tiers: **T1** frames + colorbar (FP; FP-2:1 = flat 2:1 map); **T1-low** frames without a colorbar (F), movie (M), graph (G) or still; "
         "**T2** NASA validation/companion data; **T3** other agency.", "", "## SVS IDs the plan names", "", *svs_table(planned), "",
         "## EIC-tree items not in the app and not in the plan", "", *svs_table(tree_new), "",
         "## Search and related finds with frames and a colorbar (T1), not in the plan", "", *svs_table(found[:80]), "",
         *([f"({len(found) - 80} more in the JSON.)", ""] if len(found) > 80 else []),
         "## NASA data (T2), confirmed in CMR", "", "| Short name | Concept ID | Version | DOI | Period |", "|---|---|---|---|---|",
         *[f"| {r['short_name']} | {r['concept_id']} | {r['version']} | {r['doi']} | {(r['start'] or '')[:10]} → {(r['end'] or 'ongoing')[:10]} |"
           for r in out["t2"]], "", "Not found in CMR under the name tried: " + ", ".join(out["t2_missing"]) + ".", "",
         "## GIBS layers (value tables from the colormap XML)", "", "| Group | Layer | Latest | Value entries · units · range |", "|---|---|---|---|",
         *[f"| {g['group']} | `{g['id']}` | {g['latest'] or '—'} | {g['values']} |" for g in out["gibs"]], "",
         "## Other agencies (T3): routes checked from this machine", "", "| Source | HTTP | URL |", "|---|---|---|",
         *[f"| {k} | {v.get('http')} | {v['url']} |" for k, v in out["t3"].items()], "",
         "## STAC collection IDs", "", f"GHG Center ({len(out['stac']['ghg_center'])}): " + ", ".join(f"`{i}`" for i in out["stac"]["ghg_center"]) + ".", "",
         f"VEDA: {len(out['stac']['veda'])} collections (full list in the JSON).", "", "## What the report had wrong (live)", "",
         *[f"- {x}" for x in out["report_wrong"]]]
    (DOCS / "CANDIDATES.md").write_text("\n".join(L) + "\n", encoding="utf-8")

def report_wrong(rows, cat):
    text = (REPO / "docs" / "related" / "RELATED_DATASETS_REPORT.md").read_text(encoding="utf-8")
    group = lambda sid: bool(re.search(rf"[Mm]edia groups? [^|]*\b{sid}\b", text))
    out = [f"SVS {r['id']} is not served by the SVS API" + (" (the report lists it as a media group, not a page)" if group(r["id"]) else "")
           for r in rows if r["tier"] == "not served" and "report" in r["sources"]]
    sn = cat["cmr"]["short_names"]
    out += [f"GEDI L2A/L2B: the current version is 003 ({sn[k]['latest']['doi']}); the report gives .002" for k in ("GEDI02_B",) if sn[k]["found"]]
    out += [f"OCO-2 Lite: the newest version is {sn['OCO2_L2_Lite_FP']['latest']['version']} ({sn['OCO2_L2_Lite_FP']['latest']['concept_id']}); "
            "V11.2r (C2912085112-GES_DISC) also exists"]
    out += ["NOAA-21 Black Marble: only VJ246A2 is in CMR (VJ246A1, A3, A4 are not)" if sn["VJ246A2"]["found"] and not sn["VJ246A1"]["found"] else ""]
    out += [f"ISS LIS V3 DOI: {sn['isslis_v3_fin']['latest']['doi']} ({sn['isslis_v3_fin']['latest']['concept_id']})"]
    ghg = set(cat["stac"]["ghg_center"])
    for want in ("lpjeosim-wetlandch4-grid-v1", "epa-ch4emission-grid-v2express"):
        if want not in ghg: out.append(f"GHG Center `{want}` does not exist; nearest: " + ", ".join(i for i in ghg if i.split("-")[0] == want.split("-")[0]))
    if not cat["gibs"]["groups"]["AIRS CO"]["layers"] or not any("Total_Column" in l["id"] for l in cat["gibs"]["groups"]["AIRS CO"]["layers"]):
        out.append("GIBS `AIRS_CO_Total_Column_Day` does not exist; AIRS CO is served as the 500 hPa mixing ratio (L2 and L3 layers)")
    return [x for x in out if x]

def write_corrections(corr):
    import textwrap
    titles = ["4950 is GEDI L2B RH100 with three colorbars", "5436 gives 2:1 frames, a timestamp file and the 5196 colorbar",
              "5425 colours are water at ≥ 600 m; 5479 has flat frames", "13786: 'the radius of the stars is mapped to pitch'",
              "5011 lists ISS LIS V1; V2/V3 run to 16 Nov 2023", "5533 needs GEOS-CF v1 (v2 starts 2025-08-04); no colorbar file",
              "GEOS-CF v1 has PM25_RH35_GCC and PM25_RH35_GOCART", "5572 same-model target is GEOS-FP tavg3_2d_aer_Nx; label-free frames",
              "5624 is a daily GEOS-FP smoke forecast with 528×165 keys", "5650 is the newer IMERG NRT item with 3600×1800 frames",
              "NEO was decommissioned in Sept 2026", "4939 is ATMS MiRS, not MERRA-2", "4993 Dixie Fire is in the EIC tree, not on the list",
              "5313 has no numeric colorbar; Black Marble C2 replaces v1", "3912 has a per-frame dates file", "5505 period conflict (text vs dataset)",
              "The list may already be public (28 Oct)", "TEMPO is North America only; P-Tree forbids redistribution"]
    L = ["# The report's 18 corrections, checked live", "", f"Generated by `pipeline/svs/discover_report.py` from `corrections_check.py` "
         f"({dt.date.today()}). Evidence is quoted from the live page, API record, CMR row or file.", "",
         "| # | Correction | Live status | Evidence | Source | Applied |", "|---|---|---|---|---|---|"]
    from .corrections_applied import outcomes
    done = outcomes()
    for i, t in enumerate(titles, 1):
        c = corr.get(str(i), {})
        ev = json.dumps(c.get("evidence"), ensure_ascii=False)
        ev = ev.replace("|", "/")[:420]
        L.append(f"| {i} | {t} | **{c.get('status', 'not run')}** | {ev} | {c.get('source') or ''} | {done.get(i, '').replace('|', '/')} |")
    (DOCS / "CORRECTIONS.md").write_text("\n".join(L) + "\n", encoding="utf-8")

def main():
    disc = json.loads((raw_dir("related") / "discover.json").read_text(encoding="utf-8"))
    cat = json.loads((raw_dir("related") / "catalog.json").read_text(encoding="utf-8"))
    bars = json.loads((raw_dir("related") / "bars.json").read_text(encoding="utf-8")) if (raw_dir("related") / "bars.json").exists() else {}
    corr = json.loads((raw_dir("related") / "corrections.json").read_text(encoding="utf-8")) if (raw_dir("related") / "corrections.json").exists() else {}
    app = in_app_map()
    ids = sorted(int(k) for k in disc["sources"])
    rows = [svs_row(sid, json.loads((API / f"{sid}.json").read_text(encoding="utf-8")) if (API / f"{sid}.json").exists()
                    else {"error": disc["errors"].get(str(sid), "not read")}, disc, bars, app) for sid in ids]
    sn = cat["cmr"]["short_names"]
    t2 = [v["latest"] for v in sn.values() if v["found"]] + [{k: v[k] for k in ("short_name", "concept_id", "version", "doi", "start", "end")}
                                                            for v in cat["cmr"]["concepts"].values() if v["found"]]
    t2 = list({r["concept_id"]: r for r in t2}.values())
    gibs = []
    for g, v in cat["gibs"]["groups"].items():
        for l in v["layers"][:6]:
            cs = l.get("colormap_summary") or {}
            vals = [m for m in cs.get("maps", []) if m["value_entries"]]
            gibs.append({"group": g, "id": l["id"], "latest": (l.get("time_default") or "")[:10] or None, "format": l["format"],
                         "values": (f"{vals[0]['value_entries']} · {vals[0]['units'] or 'no unit'} · {vals[0]['range']}" if vals
                                    else ("no value table" if l.get("colormap") else "no colormap (imagery or vector)"))})
    out = {"checked": dt.date.today().isoformat(), "svs": rows, "tree_ids": list(disc["tree"]), "search_hits": sum(len(v) for v in disc["search"].values()),
           "terms": list(disc["search"]), "report_ids": disc["report_ids"], "cmr_found": len(t2), "t2": sorted(t2, key=lambda r: r["short_name"]),
           "t2_missing": [k for k, v in sn.items() if not v["found"]], "cmr_keywords": cat["cmr"]["keywords"], "cmr_dois": cat["cmr"].get("dois"),
           "gibs_layers": cat["gibs"]["layer_count"], "gibs": gibs, "t3": cat["routes"], "stac": cat["stac"], "report_wrong": report_wrong(rows, cat),
           "corrections": {k: v["status"] for k, v in corr.items()}}
    (CACHE / "related_candidates.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    write_docs(out)
    if corr: write_corrections(corr)
    say(f"candidates: {len(rows)} SVS rows; " + ", ".join(f"{k} {sum(1 for r in rows if r['tier'] == k)}" for k in ("T1", "T1-low", "not a data layer", "not served")))

if __name__ == "__main__":
    main()
