"""Pieces every official record's export shares: the provenance block copied from the SVS cache (title, period label,
credits by role, licence/credit line) and the size-budget search over (space, time) aggregations."""
import datetime as dt, json
import numpy as np
from svs import export, svs_api
from svs.config import PUBLIC_OFFICIAL, record_dir

LICENCE = ("SVS: \"All of our content is in the public domain (unless otherwise noted), meaning that it is free to download, "
           "use, and redistribute for whatever purposes you see fit.\" (https://svs.gsfc.nasa.gov/help/, read 29 Oct 2026)")

def hour_index(tv, when):
    """(index, the axis's own datetime there) of `when` (naive UTC) on an OPeNDAP time variable. The axis is decoded with
    num2date and compared as datetimes: netCDF4.date2num on a Python datetime is 2 days off on GrADS 'days since 1-1-1'
    axes (found 6 Nov 2026: it paired 28 Oct frames with 26 Oct model hours)."""
    import netCDF4
    t = np.asarray(tv[:], np.float64)
    times = netCDF4.num2date(t, tv.units, getattr(tv, "calendar", "standard"))
    when_c = type(times[0])(when.year, when.month, when.day, when.hour, when.minute)   # in the axis's own calendar
    gap = np.array([abs((x - when_c).total_seconds()) for x in times])
    i = int(np.argmin(gap))
    g = times[i]
    return i, dt.datetime(g.year, g.month, g.day, g.hour, g.minute)

def period_label(a: dt.datetime, b: dt.datetime):
    """'25 Mar 2007 – 3 Mar 2008' (en dash, day without a leading zero)."""
    fmt = lambda t: f"{t.day} {t:%b %Y}"
    return f"{fmt(a)} – {fmt(b)}"

def provenance(record, svs_ids, badge, period):
    """Every text field is copied from the cached SVS API records; the credit line is the product registry's (one source);
    nothing typed by hand except the badge vocabulary."""
    from products.registry import PRODUCTS
    recs = [svs_api.fetch_record(i) for i in svs_ids]
    main = recs[0]
    credits = {}
    for r in recs:
        for role, people in r["credits_by_role"].items():
            credits.setdefault(role, [])
            credits[role] += [p for p in people if p not in credits[role]]
    return {"svs_ids": list(svs_ids), "title": main["title"], "svs_pages": [r["url"] for r in recs],
            "description": main["description"], "release_date": main["release_date"],
            "period": {"start": period[0].strftime("%Y-%m-%dT%H:%M:%SZ"), "end": period[1].strftime("%Y-%m-%dT%H:%M:%SZ"),
                       "label": period_label(*period)},
            "badge": badge, "credits_by_role": credits, "datasets": main["datasets"],
            "credit_line": PRODUCTS[record].credit, "disclosure": PRODUCTS[record].disclosure,
            "licence": LICENCE}

def gz_bytes(cube, chunk_t=32, encoding="linear", step=None):
    q, _, _ = export.quantise(cube, encoding, step=step)
    return sum(len(export.gz(q[i:i + chunk_t])) for i in range(0, len(q), chunk_t))

def stream_reduce(read, T, f, tf):
    """(space f, time tf) means of a cube read in time blocks (read(a, b) → float array of days a..b-1), so only tf days
    are in memory at once; the result equals export.block_mean(export.time_mean(cube, tf), f)."""
    return np.stack([export.block_mean(export.time_mean(read(a, a + tf), tf), f)[0] for a in range(0, T - T % tf, tf)])

def budget_search(cubes, options, chunk_t=32, fixed_bytes=0, codecs=None):
    """cubes: {name: (T, H, W) float at the finest grid, or a function (f, tf) → the reduced cube};
    codecs: {name: (encoding, step)} as the export will write them; options: [(space factor, time factor)] in preference order;
    fixed_bytes: layers that are not reduced (e.g. a native-resolution box). Estimates each option's gzip size from the
    real data and returns (option, tried)."""
    def estimate(opt):
        f, tf = opt
        total = fixed_bytes
        for name, c in cubes.items():
            enc, step = (codecs or {}).get(name, ("linear", None))
            red = c(f, tf) if callable(c) else export.block_mean(export.time_mean(c, tf), f)
            total += gz_bytes(red, chunk_t, enc, step)
        return total
    return export.fit(estimate, options)

def colorbar_step(cb_summary):
    """One tenth of a colorbar pixel, in the encoded units the export uses (value units, or decades on a log scale)."""
    if "px_per_unit" in cb_summary: return 0.1 / cb_summary["px_per_unit"]
    if "px_per_decade" in cb_summary: return 0.1 / cb_summary["px_per_decade"]
    lo, hi = cb_summary["value_range"]                       # piecewise: the range over the strip, per pixel
    return 0.1 * ((np.log10(hi) - np.log10(lo)) if lo > 0 else (hi - lo)) / cb_summary["n_samples"]

def display(cb, n=32):
    """How the app draws a decoded layer: n colours sampled along the SVS colorbar, the value range they span, and the
    scale between them (log when the colorbar's own values are log-spaced)."""
    px = np.linspace(0, cb.n - 1, n)
    rgb = np.stack([np.interp(px, np.arange(cb.n), cb.rgb[:, c]) for c in range(3)], -1).round().astype(int)
    vals = cb.value_at(px)
    logv = bool(np.all(vals > 0) and cb.scale in ("log", "piecewise") and cb.fit.get("segment_interp", "log") == "log")
    return {"colours": ["#%02x%02x%02x" % tuple(c) for c in rgb], "values": [float(v) for v in vals], "scale": "log" if logv else "linear"}

def ramp_display(lo, hi, end_rgb=(255, 255, 255), n=32, start_rgb=(20, 20, 24)):
    """How the app draws a layer that has no colorbar (counts, brightness, relative values): a plain ramp from dark to
    end_rgb over [lo, hi], linear. A drawing choice, not data."""
    t = np.linspace(0, 1, n)[:, None]
    rgb = (np.array(start_rgb) * (1 - t) + np.array(end_rgb) * t).round().astype(int)
    return {"colours": ["#%02x%02x%02x" % tuple(c) for c in rgb], "values": [float(v) for v in np.linspace(lo, hi, n)], "scale": "linear", "ramp": True}

def option(oid, label, map_layer, channels, start, steps_per_second, view="global"):
    """One playable selection for the app: the map layer, its voices (a channel with two layers plays their magnitude),
    the needle's start point and the playback rate (time steps per second; a design choice, stated)."""
    return {"id": oid, "label": label, "view": view, "map": map_layer, "start": {"lat": start[0], "lon": start[1]},
            "steps_per_second": steps_per_second,
            "channels": [{"voice": v, "layers": list(ls), "combine": "magnitude" if len(ls) > 1 else "value"} for v, ls in channels]}

PATTERN_ONLY = "pattern only (values not verified)"

def validation_summary(checks):
    """The manifest's short form of validation.json (the app's provenance card)."""
    return [{**{k: c[k] for k in ("id", "title", "kind", "pass", "threshold")}, **({"decision": c["decision"]} if c.get("decision") else {})}
            for c in checks]

def layer_status(layers, checks, check_of):
    """Each layer's status from the check that covers it (check_of: layer id → check id): a team decision on that check
    wins (records/decisions.py, with its statement); else 'verified' when it passed, 'pattern only' when it missed,
    'no check' otherwise."""
    by_id = {c["id"]: c for c in checks}
    for l in layers:
        c = by_id.get(check_of.get(l["id"], ""))
        if c and c.get("decision"):
            l["status"], l["statement"] = c["decision"]["status"], c["decision"]["statement"]
        else:
            l["status"] = "no check" if c is None or c["pass"] is None else ("verified" if c["pass"] else "pattern only")
            l["statement"] = None if l["status"] in ("verified", "no check") else PATTERN_ONLY
        l["status_check"] = c["id"] if c else None
    return layers

def write_index():
    """public/data/official/index.json: every record's manifest summary (the app's record list)."""
    rows = []
    for m in sorted(PUBLIC_OFFICIAL.glob("*/manifest.json")):
        d = json.loads(m.read_text(encoding="utf-8"))
        if not d.get("play"): continue                    # method evidence (13786): no layers to play, not in the list
        rows.append({"record": d["record"], "title": d["app_title"], "svs_ids": d["svs_ids"], "badge": d["badge"],
                     "period": d["period"]["label"], "manifest": f"{d['record']}/manifest.json"})
    (PUBLIC_OFFICIAL / "index.json").write_text(json.dumps({"records": rows}, indent=1, ensure_ascii=False), encoding="utf-8")
    return rows

def checksums(record, *manifests):
    """Ship every fetched asset's SHA-256 (with byte range for prefix reads) as checksums.tsv.gz next to the manifest;
    return its row count and one digest over all rows (the frames themselves are deleted after decoding)."""
    import gzip, hashlib
    rows = set()
    for m in manifests:
        for line in m.read_text(encoding="utf-8").splitlines():
            e = json.loads(line)
            rows.add(f"{e['url']}\t{e.get('range') or 'whole'}\t{e['bytes']}\t{e['sha256']}")
    body = "url\trange\tbytes\tsha256\n" + "\n".join(sorted(rows)) + "\n"
    record_dir(record).mkdir(parents=True, exist_ok=True)
    (record_dir(record) / "checksums.tsv.gz").write_bytes(gzip.compress(body.encode(), mtime=0))
    return {"file": "checksums.tsv.gz", "rows": len(rows), "sha256_of_list": hashlib.sha256(body.encode()).hexdigest()}
