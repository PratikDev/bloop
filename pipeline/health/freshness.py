"""Freshness: for every record that can update, the source's latest available time (SVS frame folders, HTTP Last-Modified,
CMR latest granule, GIBS GetCapabilities, ERDDAP, FIRMS availability) against what Bloop ships; lag = source − shipped.
Also the S-NPP retirement check (2 Nov 2026): is each S-NPP product still producing, and does any current record read
it. Probes reuse the reference suite's tested access routines (core.ref.T) and fetch_latest's folder rules."""
import datetime as dt, json, re
from concurrent.futures import ThreadPoolExecutor
from core.ref import PIPE, T
from products.registry import PRODUCTS
from .files import manifest
from .inventory import DATA

UTC = dt.timezone.utc
SNPP_RETIRED = dt.datetime(2026, 11, 2, tzinfo=UTC)
NOW = lambda: dt.datetime.now(UTC)

def _iso(s):
    if not s: return None
    d = dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    return d if d.tzinfo else d.replace(tzinfo=UTC)

# ---- probes: each → (latest datetime or None, what was asked) ----
def svs_frames(sid, must=(), must_not=()):
    """Newest frame in an SVS item's frame folders: by the date in its name, else the folder's newest Last-Modified."""
    import fetch_latest as F
    data, dirs = F.frame_folders(sid)
    dirs = F.pick_folder(dirs, must, must_not) or dirs
    best, how = None, ""
    for d in dirs[:4]:
        files = F.list_files(d)
        if not files: continue
        name, when = F.newest(files)
        when = when or T.last_modified(d + sorted(files)[-1])
        if when and (best is None or when > best): best, how = when, f"SVS {sid} {d.rsplit('/frames/', 1)[-1]}{name}"
    if best is None:                                     # a still or movie-only item: its media files' Last-Modified
        urls = [u for u in T.walk_urls(data) if u.lower().endswith((".png", ".jpg", ".tif", ".mp4", ".webm"))][:8]
        times = [(T.last_modified(u), u) for u in urls]
        times = [t for t in times if t[0]]
        if times:
            best, u = max(times)
            how = f"SVS {sid} media Last-Modified {u.rsplit('/', 1)[-1]}"
    return best, how or f"SVS {sid}: no frame folder or media listed"

def svs_core(product):
    """The live frame folders fetch_latest.py reads (lut_params.json rules)."""
    cfg = json.loads((PIPE / "lut_params.json").read_text(encoding="utf-8"))[product]
    return svs_frames(cfg["svs_id"], cfg["folder_must_contain"], cfg["folder_must_not_contain"])

def svs_file(sid, needle):
    js, _ = T.svs_api(sid)
    url = next((u for u in T.walk_urls(js) if needle in u), None)
    return (T.last_modified(url), f"Last-Modified {url.rsplit('/', 1)[-1]}") if url else (None, f"SVS {sid}: {needle} not listed")

def svs_pick_newest(sid, **kw):
    info, _, _ = T.svs_pick(sid, **kw)
    return _iso(info.get("newest_time")) if info.get("newest_time") not in (None, "None") else None, f"SVS {sid} newest dated frame ({info.get('age_source')})"

def cmr(short_name):
    entries = T.cmr_collections(short_name=short_name, page_size=20)
    if not entries: return None, f"CMR {short_name}: no collection"
    best = None
    for e in entries:
        g = T.cmr_latest(e["id"])
        if g:
            t = _iso(g[0].get("time_end") or g[0].get("time_start"))
            if t and (best is None or t > best[0]): best = (t, e["id"])
    return (best[0], f"CMR {short_name} latest granule ({best[1]})") if best else (None, f"CMR {short_name}: no granule")

def gibs_layer(layer):
    from svs import gibs
    inf = gibs.info(layer)
    return _iso((inf.get("default_time") or "")[:10] or None), f"GIBS GetCapabilities {layer} default time"

def erddap(server, dataset):
    js, _ = T.jget(f"{server}/info/{dataset}/index.json", timeout=90)
    rows = js["table"]["rows"]
    cov = next((r[4] for r in rows if r[0] == "attribute" and r[1] == "NC_GLOBAL" and r[2] == "time_coverage_end"), None)
    return _iso(cov), f"ERDDAP {dataset} time_coverage_end"

def firms(source):
    import os
    key = os.environ.get("FIRMS_MAP_KEY", "").strip()
    if not key: return None, "FIRMS_MAP_KEY not set"
    r = T.http(f"https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{key}/{source}", timeout=60)
    lines = [l.split(",") for l in r.text.strip().splitlines()]
    if len(lines) < 2: return None, T.redact(f"FIRMS {source}: {r.text[:80]}")
    head = lines[0]; row = lines[1]
    return _iso(row[head.index("max_date")]), f"FIRMS data availability {source}"

# ---- what each updatable record is compared with ----
PROBES = {
    "sst": lambda: svs_core("sst"), "rain": lambda: svs_core("rain"), "sequence": lambda: svs_core("rain"),
    "sst_anom": lambda: svs_pick_newest(5176), "fires_frame": lambda: svs_pick_newest(5113, prefer=("VIIRS_fires_latest",), exts=(".png",)),
    "fwi_class": lambda: svs_file(5315, "FWI_forecast_latest"), "fwi_archive": lambda: svs_file(5315, "FWI_forecast_latest"),
    "landslide_class": lambda: svs_file(5584, "landslides_daily"),
    "sst_dt": lambda: cmr("MUR-JPL-L4-GLOB-v4.1"), "sst_pairs": lambda: cmr("MUR-JPL-L4-GLOB-v4.1"), "threeway": lambda: cmr("MUR-JPL-L4-GLOB-v4.1"),
    "rain_pairs": lambda: cmr("GPM_3IMERGHHE"), "nightlights": lambda: cmr("VJ146A2"),
    "firms_daily": lambda: firms("VIIRS_NOAA21_NRT"),
    "rel_5624": lambda: svs_frames(5624), "rel_5650": lambda: svs_frames(5650),
    **{f"eic_{sid}": (lambda s=sid: svs_frames(s)) for sid in (5147, 5148, 5149, 5150, 5151, 5152, 5153, 5154, 5544)},
    "rel_oisst": lambda: erddap("https://coastwatch.pfeg.noaa.gov/erddap", "ncdcOisst21NrtAgg"),
    "oscar_nrt": lambda: cmr("OSCAR_L4_OC_NRT_V2.0"), "ostia": lambda: cmr("OSTIA-UKMO-L4-GLOB-REP-v2.0"),
}
# Companions Bloop does not ship as a record (context for the freshness table only).
COMPANIONS = {"oscar_nrt": "OSCAR NRT surface currents (companion of currents_3912; the record plays OSCAR final 2007–08)",
              "ostia": "OSTIA SST reprocessed (companion SST reference)"}

# S-NPP products a record could read, with their NOAA-20/21 equivalents.
SNPP = [("Black Marble daily (VNP46A2)", lambda: cmr("VNP46A2"), "VJ146A2", lambda: cmr("VJ146A2")),
        ("FIRMS VIIRS S-NPP NRT", lambda: firms("VIIRS_SNPP_NRT"), "VIIRS_NOAA20_NRT / VIIRS_NOAA21_NRT", lambda: firms("VIIRS_NOAA20_NRT")),
        ("VIIRS NDVI 16-day (VNP13A1)", lambda: cmr("VNP13A1"), "VJ113A1", lambda: cmr("VJ113A1")),
        ("VIIRS Deep Blue AOD (AERDB_L2_VIIRS_SNPP)", lambda: cmr("AERDB_L2_VIIRS_SNPP"), "AERDB_L2_VIIRS_NOAA20", lambda: cmr("AERDB_L2_VIIRS_NOAA20"))]

def shipped(rid):
    """(shipped source time, limit days) from freshness.json, or the manifest's period end for records it lacks."""
    f = json.loads((DATA / "meta" / "freshness.json").read_text(encoding="utf-8"))["products"].get(rid)
    if f: return _iso(f.get("source_time_utc")), f.get("limit_days")
    for idx in ("official", "related"):
        p = DATA / idx / rid / "manifest.json"
        if p.exists(): return _iso(manifest(f"{idx}/{rid}/manifest.json")["period"]["end"]), None
    return None, None

def _safe(fn):
    try: return fn()
    except Exception as e: return None, f"probe failed: {e.__class__.__name__}: {T.redact(str(e))[:120]}"

def gibs_rows():
    m = manifest("related/rel_gibs/manifest.json")
    return {f"rel_gibs:{l['id']}": (_iso(l["times"][-1]), l["gibs_layer"]) for l in m["layers"] if l.get("gibs_layer")}

def table():
    """One row per updatable record: shipped, source latest, age and lag (days), limit, stale."""
    jobs = dict(PROBES)
    g = gibs_rows()
    for rid, (_, layer) in g.items(): jobs[rid] = (lambda l=layer: gibs_layer(l))
    with ThreadPoolExecutor(12) as ex:
        got = dict(zip(jobs, ex.map(_safe, jobs.values())))
    now, rows = NOW(), []
    for rid, (latest, how) in got.items():
        ship, limit = (g[rid][0], None) if rid in g else shipped(rid)
        lag = (latest - ship).total_seconds() / 86400 if latest and ship else None
        age = (now - ship).total_seconds() / 86400 if ship else None
        rows.append({"record": rid, "shipped_utc": ship.strftime("%Y-%m-%dT%H:%MZ") if ship else None,
                     "source_latest_utc": latest.strftime("%Y-%m-%dT%H:%MZ") if latest else None, "source": how,
                     "age_days": round(age, 2) if age is not None else None, "lag_days": round(lag, 2) if lag is not None else None,
                     "limit_days": limit, "companion": COMPANIONS.get(rid),
                     "behind_limit": bool(limit is not None and lag is not None and lag > limit)})
    return rows

def snpp():
    """S-NPP retirement: each product's latest granule/date before and after 2 Nov 2026, and its NOAA-20/21 equivalent."""
    out = []
    for name, probe, alt, alt_probe in SNPP:
        (t, how), (a, ahow) = _safe(probe), _safe(alt_probe)
        out.append({"product": name, "snpp_latest_utc": t.strftime("%Y-%m-%d") if t else None, "source": how,
                    "stopped": bool(t and t <= SNPP_RETIRED + dt.timedelta(days=1) and NOW() - t > dt.timedelta(days=2)), "replacement": alt, "replacement_latest_utc": a.strftime("%Y-%m-%d") if a else None,
                    "replacement_source": ahow})
    readers = [p.id for p in PRODUCTS.values() if p.limit_days is not None and any(
        re.search(r"S-NPP|SNPP|VNP\d", d.name) for d in p.datasets)]
    return {"products": out, "current_records_reading_snpp": readers}
