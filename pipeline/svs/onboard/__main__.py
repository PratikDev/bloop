"""Rapid onboarding: one command from a new SVS ID (or SVS URL, or a GIBS layer) to a related record in the app.
  python -m svs.onboard 5624                 # an SVS ID
  python -m svs.onboard https://svs.gsfc.nasa.gov/4993/
  python -m svs.onboard gibs:IMERG_Precipitation_Rate@2026-10-30
  options: --frames N (default 4), --skip-check (no validation download)
Steps, each timed: API fetch → twin finder → asset choice → frames (ffmpeg if movie-only) → frame times → georef →
colorbar → inversion → validation-source lookup and check → status (fallback chain) → export, manifest, doc, validation
row, registry entry, index. It never stops on a missing source: the record ships with the status it earned, or is listed
as not usable. GIBS layers go to the GIBS record (svs/records/gibs).
Usage (from pipeline/): python -m svs.onboard <target> [--frames N]"""
import argparse, json, re, sys, time
import numpy as np
from core.log import say
from .. import focus, svs_api
from ..config import raw_dir
from . import assets, record, series, sources, stages, twins

def resolve(target):
    if target.startswith("gibs:"): return "gibs", target[5:]
    m = re.search(r"(\d{3,6})", target)
    if not m: raise SystemExit(f"not an SVS ID, SVS URL or gibs:Layer: {target}")
    return "svs", int(m.group(1))

def run(sid, n_frames=4, skip_check=False):
    t, d = {}, {}
    clock = time.perf_counter()
    def lap(name):
        nonlocal clock
        now = time.perf_counter(); t[name] = round(now - clock, 1); clock = now
    rec = svs_api.fetch_record(sid, refresh=True); lap("api")
    tw = twins.find(rec); lap("twins")
    kind, owner, asset = assets.pick(rec, tw); lap("asset choice")
    if kind is None:
        say(f"SVS {sid}: no frames, movie or still: not usable"); return {"status": "not usable", "timings": t}
    picked = assets.fetch_frames(owner, kind, asset, n_frames); lap("frames")
    owner_rec = svs_api.fetch_record(owner) if owner != sid else rec
    when, how = stages.times(owner_rec if owner != sid else rec, picked); lap("frame times")
    geo = stages.georef_of(np.ascontiguousarray(picked[0][0][..., :3])); lap("georef")
    cb, cb_src, relative = stages.colorbar_of(rec, owner_rec, owner, picked); lap("colorbar")
    flat = geo["projection"].startswith("equirectangular")
    cube, dec = stages.decode(picked, cb, flat); lap("inversion")
    src = None if skip_check else sources.lookup(focus.words(rec) + " " + (rec.get("description") or "")[:400])
    if cb is None: res, reason = None, "no key: brightness pattern only, nothing to compare with values"
    elif src: res, reason = stages.check(cube, when, src, flat)
    else: res, reason = None, "validation skipped" if skip_check else "no validation source matches the item's words"
    lap("validation")
    status = stages.status(cb, relative, cube, res)
    if cube is None:
        cube = np.full((len(picked), *(stages.FRAME_GRID[::-1])), np.nan, np.float32)
    first = cube[0]
    yy, xx = np.nonzero(np.isfinite(first))
    k = int(np.argmin(np.hypot(yy - first.shape[0] / 2, xx - first.shape[1] / 2))) if len(yy) else None
    lat = 0.0 if k is None else 90 - (yy[k] + 0.5) * 180 / first.shape[0]
    lon = 0.0 if k is None else -180 + (xx[k] + 0.5) * 360 / first.shape[1]
    d.update(status=status, times=when, times_how=how, georef=geo, cb=cb, cb_source=cb_src, relative=relative, cube=cube, decode=dec,
             check=res, check_reason=reason, frames_used=len(picked), twins=tw, start=(float(lat), float(lon)),
             asset={"kind": kind, "owner": owner, "what": asset.get("layer") or asset.get("filename") or asset.get("url", "")[-60:]},
             manifest_file=raw_dir(owner) / "manifest.jsonl")
    if status == "not usable":
        say(f"SVS {sid}: nothing decoded ({cb_src}): not usable"); d["timings"] = t; return d
    d["timings"] = t
    record.write(sid, rec, d); lap("export")
    d["timings"] = t
    (raw_dir("related", "onboard") / f"{sid}.json").write_text(json.dumps({"timings_s": t, "status": status, "asset": d["asset"],
                                                                            "times": how, "colorbar": cb_src, "check": res, "reason": reason},
                                                                           indent=1, default=str), encoding="utf-8")
    say(f"SVS {sid}: {status}; " + ", ".join(f"{k} {v:.0f}s" for k, v in t.items()))
    return d

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("target"); ap.add_argument("--frames", type=int, default=4); ap.add_argument("--skip-check", action="store_true")
    a = ap.parse_args(argv)
    kind, what = resolve(a.target)
    if kind == "gibs":
        from ..records.gibs.build import add_layer
        layer, _, date = what.partition("@"); add_layer(layer, date or None)
    elif what in series.SERIES:
        series.run(what)                                           # a graph: the cited source series, not pixels
    else:
        run(what, a.frames, a.skip_check)

if __name__ == "__main__":
    main(sys.argv[1:])
