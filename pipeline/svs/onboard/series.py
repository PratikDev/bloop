"""Graphs and spirals (Phase 2.8): the item is a curve, so the record sonifies the series the page cites — read from that
source, never from the graph's pixels. One layer: a single global cell (or 1° latitude rows for zonal series), one time
step per point, so the app's player walks the series in time. Status 'observation' (the source's own numbers); the
check row records the source, points and span (no threshold: nothing is decoded).
SERIES: SVS ID → (source key); SOURCES: key → (url, licence/credit, parser → (times, values, unit, rows)).
Usage: python -m svs.onboard <id> routes here when the ID is in SERIES."""
import datetime as dt, re
import numpy as np
import requests
from core.log import say
from .. import export, focus, svs_api, validate as V
from ..config import UA
from ..records import common
from . import record as rel

def decimal_year(y):
    y0 = int(y); start = dt.datetime(y0, 1, 1, tzinfo=dt.timezone.utc)
    return start + (dt.datetime(y0 + 1, 1, 1, tzinfo=dt.timezone.utc) - start) * (y - y0)

def gmsl(text):
    rows = [l.split() for l in text.splitlines() if l.strip() and not l.startswith("HDR")]
    rows = [(float(r[0]), float(r[1])) for r in rows if len(r) >= 2 and float(r[1]) != 99900]
    return [decimal_year(t) for t, _ in rows], np.array([v for _, v in rows]), "cm (GMSL variation, 60-day smoothed, GIA not applied)", None

def gistemp_annual(text):
    rows = [l.split(",") for l in text.splitlines()[2:] if re.match(r"\d{4},", l)]
    rows = [(int(r[0]), r[13]) for r in rows if r[13] not in ("***", "")]
    return [dt.datetime(y, 7, 1, tzinfo=dt.timezone.utc) for y, _ in rows], np.array([float(v) for _, v in rows]), "°C anomaly (vs 1951–1980)", None

def gistemp_monthly(text):
    out_t, out_v = [], []
    for l in text.splitlines()[2:]:
        r = l.split(",")
        if not re.match(r"\d{4}$", r[0]): continue
        for m, v in enumerate(r[1:13], 1):
            if v not in ("***", ""): out_t.append(dt.datetime(int(r[0]), m, 15, tzinfo=dt.timezone.utc)); out_v.append(float(v))
    return out_t, np.array(out_v), "°C anomaly (vs 1951–1980)", None

ZONES = (("64N-90N", 64, 90), ("44N-64N", 44, 64), ("24N-44N", 24, 44), ("EQU-24N", 0, 24), ("24S-EQU", -24, 0), ("44S-24S", -44, -24),
         ("64S-44S", -64, -44), ("90S-64S", -90, -64))

def gistemp_zonal(text):
    lines = text.splitlines(); head = lines[0].split(",")
    t, rows = [], []
    for l in lines[1:]:
        r = l.split(",")
        if not re.match(r"\d{4}$", r[0]): continue
        t.append(dt.datetime(int(r[0]), 7, 1, tzinfo=dt.timezone.utc))
        col = np.full(180, np.nan)
        for name, lo, hi in ZONES:
            v = r[head.index(name)]
            if v not in ("***", ""): col[90 - hi:90 - lo] = float(v)
        rows.append(col)
    return t, np.array(rows), "°C anomaly (vs 1951–1980), per latitude zone", "zonal"

def ohc(text):
    rows = [l.split() for l in text.splitlines()[1:] if l.strip()]
    return [decimal_year(float(r[0])) for r in rows], np.array([float(r[1]) for r in rows]), "10²² J (0–2000 m, world)", None

def keeling(text):
    rows = [l.split() for l in text.splitlines() if l.strip() and not l.startswith("#")]
    return [dt.datetime(int(r[0]), 7, 1, tzinfo=dt.timezone.utc) for r in rows], np.array([float(r[1]) for r in rows]), "ppm (Mauna Loa annual mean)", None

def aggi(text):
    rows = [l.split(",") for l in text.splitlines() if re.match(r"\d{4},", l)]
    return [dt.datetime(int(r[0]), 7, 1, tzinfo=dt.timezone.utc) for r in rows], np.array([float(r[8]) for r in rows]), "AGGI (1990 = 1)", None

SOURCES = {
    "gmsl": ("https://zenodo.org/api/records/7702315/files/GMSL_NASA_Trajectory_Extrapolation_2022_V101.txt/content",
             "Willis, Hamlington and Fournier, GMSL Trajectory and Extrapolation (Zenodo 7702315, CC BY 4.0), NASA GSFC TPJAOS", gmsl),
    "gistemp": ("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", "NASA GISS GISTEMP v4 (public domain)", gistemp_annual),
    "gistemp_monthly": ("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", "NASA GISS GISTEMP v4 (public domain)", gistemp_monthly),
    "gistemp_zonal": ("https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv", "NASA GISS GISTEMP v4 (public domain)", gistemp_zonal),
    "ohc": ("https://www.ncei.noaa.gov/data/oceans/woa/DATA_ANALYSIS/3M_HEAT_CONTENT/DATA/basin/pentad/pent_h22-w0-2000m.dat",
            "NOAA NCEI ocean heat content, pentadal 0–2000 m (NOAA, free use)", ohc),
    "keeling": ("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt", "NOAA GML Mauna Loa CO2 (Lan, Keeling; free use with credit)", keeling),
    "aggi": ("https://gml.noaa.gov/aggi/AGGI_Table.csv", "NOAA GML Annual Greenhouse Gas Index (free use with credit)", aggi),
}
SERIES = {5611: "gmsl", 5221: "gmsl", 5516: "gmsl", 5235: "gmsl", 5207: "gistemp", 5191: "gistemp", 5190: "gistemp_monthly",
          5209: "gistemp_zonal", 5111: "ohc", 5119: "keeling", 5126: "aggi"}

def run(sid):
    rec = svs_api.fetch_record(sid, refresh=True)
    key = SERIES[sid]; url, credit, parse = SOURCES[key]
    when, vals, unit, shape = parse(requests.get(url, headers=UA, timeout=180).text)
    record = f"rel_{sid}"
    b = "observation"
    rel.register({"record": record, "svs_id": sid, "title": rec["title"], "badge": b, "focus": focus.focus(rec),
                  "related_to": [int(o)] if (o := focus.official(rec)) else [], "status": "observation"})
    cube = vals[:, :, None].astype(float) if shape == "zonal" else vals[:, None, None].astype(float)
    for p in rel.record_dir(record).glob("*.u16.gz"): p.unlink()
    lay = export.layer(record, "series", cube, when, (-180, -90, 180, 90), unit, step=max(1e-4, float(np.nanmax(np.abs(vals))) / 30000),
                       label=f"{rec['title']}: the cited source series", aggregation="one value per time step (the source's own numbers)",
                       time_labels=[t.strftime("%Y" if (t.month, t.day) == (7, 1) else "%b %Y") for t in when],
                       display=common.ramp_display(float(np.nanmin(vals)), float(np.nanmax(vals)), (255, 190, 90)), series_source=url)
    check = V.check(record, "a_source_series", f"{rec['title']}: values are the cited source's series (not decoded from the graph)",
                    kind="context", source=credit, passed=None,
                    metrics={"points": len(when), "first": when[0].strftime("%Y-%m-%d"), "last": when[-1].strftime("%Y-%m-%d"), "url": url},
                    note="A graph or spiral is drawn from these numbers; the record plays the numbers, not the picture.")
    V.save(record, [check])
    lay.update(status="observation", status_check=check["id"], statement="the source's own numbers")
    man = {"record": record, "app_title": f"{rec['title']} (series)", **common.provenance(record, [sid], b, (when[0], when[-1])),
           "focus": focus.focus(rec), "related_to": [int(o)] if (o := focus.official(rec)) else [],
           "frame_times": {"method": "date-list", "approximate": False, "count": len(when), "source": f"the series' own dates ({url})"},
           "georef": {"projection": "none (a time series)" if shape != "zonal" else "latitude zones", "bounds": [-180, -90, 180, 90],
                      "pass_at": 0.0, "shifts_deg": [], "iou": {}, "pass": shape == "zonal", "best_is_assumed": False},
           "colorbar": None, "series": {"source": credit, "url": url}, "layers": [lay], "voices": {"series": f"rel{sid}"},
           "play": [common.option("series", f"{rec['title']}: higher pitch = higher value, in time order", "series", [(f"rel{sid}", ["series"])],
                                  (23.8, 90.4), 8)],
           "validation": common.validation_summary([check]), "size": {"choice": {"points": len(when)}, "tried": []},
           "onboarding": {"status": "observation", "route": "series", "timings_s": {}}}
    export.write_manifest(record, man)
    L = [f"# SVS {sid}: {rec['title']}", "", "Generated by `pipeline/svs/onboard/series.py`; do not edit by hand.", "",
         f"- Page: {rec['url']}", "- Status: **observation** (the cited source's own numbers; the graph is not decoded)",
         f"- Source: {credit} — {url}", f"- Series: {len(when)} points, {when[0]:%Y-%m-%d} – {when[-1]:%Y-%m-%d}, {unit}",
         f"- EIC focus area: {man['focus']}; beside official SVS {', '.join(map(str, man['related_to'])) or '—'}", f"- Credit: {man['credit_line']}"]
    (rel.DOCS / f"{sid}.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    rows, total = rel.write_index()
    say(f"{record}: series of {len(when)} points from {key}; related {len(rows)} records, {total / 1e6:.1f} MB")
