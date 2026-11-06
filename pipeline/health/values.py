"""Values: decoded values inside the colorbar (or the physical range for the unit), no all-empty time step, no-value share
equal to the manifest's coverage within 2 points, frame times increasing and inside the period, and the needle starting
on a cell with a value. Also picks three needle points with values for the app test. Decoding follows
src/lib/data/official.ts (officialValueAt): q 65535 = no value, 65534 = below range, value = q·scale + offset (log10: 10^)."""
import datetime as dt
from functools import lru_cache
import numpy as np
from .files import manifest
from svs.playable import BELOW, NODATA, cell, centre, codes
from .result import res

COVERAGE_TOL = 0.02
BAR_TOL = 0.02                         # a top or bottom bin may be open-ended: 2 % of the key's span
# Physical bounds where a unit implies them (a decoded value outside is impossible, not just off the key).
PHYSICAL = {"°C": (-90.0, 70.0), "m/s": (0.0, 150.0), "mm": (0.0, 2000.0), "mm/h": (0.0, 500.0), "g/kg": (0.0, 40.0),
            "µg/m³": (0.0, 5000.0), "ppbv": (0.0, 1e5), "ppm": (0.0, 1e4), "m": (-20.0, 120.0), "psu": (0.0, 45.0),
            "relative (0–1)": (0.0, 1.0), "relative brightness (0–1)": (0.0, 1.0), "relative density (0–1)": (0.0, 1.0),
            "flashes per cell": (0.0, 1e6)}

# Records whose frames are in movie order, not time order, as their doc states (each frame carries its own date label).
MOVIE_ORDER = {"river_4960": "docs/official/4960.md: the narrated movie revisits times between scenes"}

def _iso(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))

@lru_cache(maxsize=4)
def steps(rel, lid):
    """(T, H, W) uint16 codes of one layer (svs.playable.codes, cached for the checks)."""
    m = manifest(rel)
    return codes(m["record"], next(x for x in m["layers"] if x["id"] == lid))

def decode(l, q):
    x = q.astype(np.float64) * l["scale"] + l["offset"]
    v = 10 ** x if l["encoding"] == "log10" else x
    return np.where(q >= BELOW, np.nan, v)

def _layer(rel, l, period):
    q = steps(rel, l["id"])
    out, step = [], l.get("quantisation_step") or 0
    v = decode(l, q)
    finite = np.isfinite(v)
    empty = [i for i in range(q.shape[0]) if not (q[i] < NODATA).any()]
    out.append(res(f"{l['id']}: no empty grid", not empty and q.shape[0] > 0, f"empty steps {empty[:5]}" if empty else f"{q.shape[0]} steps"))
    if finite.any():
        lo, hi = float(np.nanmin(v)), float(np.nanmax(v))
        disp = None if (l.get("display") or {}).get("ramp") or l.get("gibs_layer") else (l.get("display") or {}).get("values")
        bar = (min(disp), max(disp)) if disp else None     # a drawing ramp is not a key; GIBS values are exact colormap entries
        phys = PHYSICAL.get(l["unit"])
        log = l["encoding"] == "log10" and bar and bar[0] > 0
        f = (lambda x: np.log10(max(x, 1e-30))) if log else (lambda x: x)
        def inside(r):
            span = max(f(r[1]) - f(r[0]), 1e-12)
            return f(lo) >= f(r[0]) - BAR_TOL * span and f(hi) <= f(r[1]) + BAR_TOL * span
        if bar or phys:
            ok, ref = (inside(bar), "colorbar") if bar and inside(bar) else (inside(phys), "physical") if phys else (False, "colorbar")
            r = bar if ref == "colorbar" and bar else phys
            out.append(res(f"{l['id']}: values in range", ok, f"{lo:.4g}…{hi:.4g} {l['unit']} vs {ref} {r[0]:.4g}…{r[1]:.4g}"))
        elif l.get("gibs_layer"):
            out.append(res(f"{l['id']}: values in range", True, f"{lo:.4g}…{hi:.4g} {l['unit']}: exact GIBS colormap entries"))
        else:
            vr, tol = l.get("value_range") or [lo, hi], abs(l["scale"]) * 2
            ok = vr[0] - tol <= lo and hi <= vr[1] + tol if l["encoding"] != "log10" else True
            out.append(res(f"{l['id']}: values in range", ok, f"{lo:.4g}…{hi:.4g} {l['unit']} (no colorbar or physical bound; = stated range)"))
    nov, nod = float((q == NODATA).mean()), float((q >= BELOW).mean()) if q.size else 1.0
    stated = 1 - l["coverage"]            # censored cells (below range) count as covered in some exports and not in others
    ok = nov - COVERAGE_TOL <= stated <= nod + COVERAGE_TOL
    out.append(res(f"{l['id']}: no-value share = coverage ±2 pts", ok, f"no-value {nov:.1%} (+{nod - nov:.1%} below range) vs stated {stated:.1%}"))
    try:
        ts = [_iso(t) for t in l["times"]]
        labels = l.get("time_labels") or []
        labelled = len(labels) == len(ts)                   # views of one time or undated frames: equal times, told apart by label
        inc = all(b > a or (b == a and labelled) for a, b in zip(ts, ts[1:]))
        movie = MOVIE_ORDER.get(manifest(rel)["record"]) if labelled else None
        a, b = _iso(period["start"]), _iso(period["end"])
        outside = [t.isoformat()[:16] for t in ts if not (a - dt.timedelta(seconds=1) <= t <= b + dt.timedelta(seconds=1))]
        out.append(res(f"{l['id']}: times increasing, inside period", (inc or bool(movie)) and not outside,
                       ("not increasing; " if not inc and not movie else f"movie order, not time order ({movie}); " if not inc else "")
                       + (f"outside {period['label']}: {outside[:3]}" if outside else f"{len(ts)} times")))
    except (ValueError, KeyError) as e:
        out.append(res(f"{l['id']}: times increasing, inside period", False, e))
    return out

def _eroded(ok, r):
    """Cells whose (2r+1)² neighbourhood is all True (an integral image: fast on 3600-wide grids)."""
    s = np.pad(ok.astype(np.int32), ((r + 1, r), (r + 1, r))).cumsum(0).cumsum(1)
    k = 2 * r + 1
    box = s[k:, k:] - s[:-k, k:] - s[k:, :-k] + s[:-k, :-k]
    return box == k * k

def _plays(rel, m, opt):
    """Start cell has a value on the map and every channel layer at step 0; three more points with values."""
    layers = {l["id"]: l for l in m["layers"]}
    ids = [opt["map"], *[x for c in opt["channels"] for x in c["layers"]]]
    # Points with a value at every step (the record plays on through its steps while the needle is dropped), else at step 0.
    every, first0 = np.ones(steps(rel, opt["map"]).shape[1:], bool), np.ones(steps(rel, opt["map"]).shape[1:], bool)
    for i in dict.fromkeys(ids):
        q = steps(rel, i)
        if q.shape[1:] != every.shape: continue                 # a voice layer on another grid: judged at the start only
        every &= (q < NODATA).all(0) if q.shape[0] else False
        first0 &= q[0] < NODATA if q.shape[0] else False
    sparse = not every.any()
    ok = first0 if sparse else every
    # Prefer cells inside a block of cells with values: Firefox's clicks land ~1.5 px from Chromium's (0.35–0.45° on a
    # world map), which is several cells on a fine grid. The block is ~0.4 % of the map's width, smaller when none fits.
    for r in range(max(1, int(np.ceil(0.004 * ok.shape[1]))), 0, -1):
        core = _eroded(ok, r)
        if core.sum() >= 3: ok = core; break                 # three distinct points
    rc = cell(layers[opt["map"]], opt["start"]["lat"], opt["start"]["lon"])
    first = [opt["map"], *(opt["channels"][0]["layers"] if opt["channels"] else [])]
    def has(i):
        c = cell(layers[i], opt["start"]["lat"], opt["start"]["lon"])
        q = steps(rel, i)
        return c is not None and q.shape[0] > 0 and bool(q[0][c] < NODATA)
    starts = rc is not None and all(has(i) for i in dict.fromkeys(first))
    flat = np.flatnonzero(ok)
    m_ = layers[opt["map"]]
    w, s_, e, n = m_["grid"]["bounds"]
    def point(r, c):
        p = centre(m_, r, c)
        return {**p, "fx": round((p["lon"] - w) / (e - w), 5), "fy": round((n - p["lat"]) / (n - s_), 5)}
    pts = [point(*divmod(int(flat[int(k * (len(flat) - 1))]), ok.shape[1])) for k in (0.2, 0.5, 0.8)] if len(flat) else []
    return starts, pts, sparse

def plan_for(rel):
    """App-test plan of one manifest: per play option, whether the start has a value and three points with values;
    plus what the provenance card must show."""
    m = manifest(rel)
    opts = {}
    for opt in m.get("play", []):
        starts, pts, sparse = _plays(rel, m, opt)
        opts[opt["id"]] = {"start_has_value": starts, "sparse": sparse, "points": pts}
    statuses = sorted({l.get("status", "") for l in m["layers"]})
    return {"manifest": rel, "record": m["record"], "options": opts, "period": m["period"]["label"], "badge": m["badge"],
            "credit": m.get("credit_line", ""), "licence_start": (m.get("licence") or "")[:40], "statuses": statuses,
            "pattern_only": statuses == ["pattern only"], "checks": [c["title"] for c in m.get("validation", [])]}

def check(rec):
    """(results, plan) for a contract-15 record; plan = {option id: {start_has_value, points}} for the app test."""
    if rec.kind not in ("official", "voice") or not rec.manifest: return [], {}
    m = manifest(rec.manifest)
    out = []
    for l in m["layers"]:
        if rec.layer in (None, l["id"]) and rec.kind != "voice": out += _layer(rec.manifest, l, m["period"])
    plan = {}
    if rec.layer is None and rec.kind != "voice":
        for opt in m.get("play", []):
            starts, pts, sparse = _plays(rec.manifest, m, opt)
            plan[opt["id"]] = {"start_has_value": starts, "sparse": sparse, "points": pts}
        if plan:
            silent = [k for k, v in plan.items() if not v["start_has_value"]]
            out.append(res("needle starts on a value", not silent, f"silent start: {silent}" if silent else f"{len(plan)} play options"))
    return out, plan
