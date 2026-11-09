"""Team decision 29 Oct (A1): compare the decoded PM2.5 with every PM2.5-type variable GEOS-CF v1 serves, at the same 25
validation hours and cells as check a_pm25_geoscf (frame 1° cell means with ≥ MIN_FRAC decoded; model at the 1° cell
centres). Per variable: median ratio frame/model, median relative error, Spearman. A variable that matches at ~1× with
median error ≤ 15 % becomes the reference; otherwise the record ships as relative PM2.5. The colorbar is never rescaled.
Usage (from pipeline/): python -m svs.records.air.pm25_search"""
import json
import numpy as np
from core.log import say
from svs import validate as V
from svs.config import raw_dir
from . import ALT
from .decode import VALID_EVERY
from .truth import OPENDAP, open_dataset, read_centres
from .validate import MIN_FRAC, WORK

BASE = OPENDAP.rsplit("/", 1)[0] + "/"
CANDIDATES = {                                   # (collection, variable): every PM2.5-type field found on 29 Oct
    "chm_tavg pm25_rh35_gcc": ("chm_tavg_1hr_g1440x721_v1", "pm25_rh35_gcc"),
    "chm_tavg pm25_rh35_gocar": ("chm_tavg_1hr_g1440x721_v1", "pm25_rh35_gocar"),
    "chm_inst pm25_rh35_gcc (surface)": ("chm_inst_1hr_g1440x721_v72", "pm25_rh35_gcc"),
    **{f"chm_tavg {c}": ("chm_tavg_1hr_g1440x721_v1", c) for c in
       ("pm25bc_rh35_gcc", "pm25du_rh35_gcc", "pm25ni_rh35_gcc", "pm25oc_rh35_gcc", "pm25soa_rh35_gc", "pm25ss_rh35_gcc", "pm25su_rh35_gcc")},
}
COMPONENTS = [k for k in CANDIDATES if "pm25_rh35" not in k]
OUT = raw_dir(ALT, "truth", "pm25_search")

def start_index(ds, coll):
    """Index of the frame-0 pairing in a collection's own time axis: the hourly mean starting at 2024-07-01T00:00 for
    tavg collections (time stamp 00:30), the instant 2024-07-01T00:00 for inst collections."""
    import datetime as dt
    from svs.records.common import hour_index
    want = dt.datetime(2024, 7, 1, 0, 30 if "tavg" in coll else 0)
    i, got = hour_index(ds.variables["time"], want)       # whole axis decoded: served steps are not uniform
    if (got.year, got.month, got.day, got.hour, got.minute) != (want.year, want.month, want.day, want.hour, want.minute):
        raise RuntimeError(f"{coll}: {want} not on the time axis (nearest {got} at {i})")
    return i

def fetch():
    import netCDF4
    open_ = {}
    for name, (coll, var) in CANDIDATES.items():
        ds = open_.setdefault(coll, open_dataset(BASE + coll))
        v = ds.variables[var]
        i0 = start_index(ds, coll)
        surface = (v.shape[1] - 1) if ("lev" in v.dimensions and v.shape[1] > 1 and ds.variables["lev"][0] < ds.variables["lev"][-1]) else 0
        for k in range(0, 1801, VALID_EVERY):
            path = OUT / f"{var}_{coll.split('_')[0]}_{coll.split('_')[1]}_{k:04d}.npy"
            if path.exists(): continue
            a = read_centres(v, i0 + k, surface)
            a = a * (1e9 if np.nanmax(a) < 1e-3 else 1.0)
            np.save(path, a[::-1].astype(np.float32))                   # row 0 = north, like every frame grid
        say(f"fetched {name}")

def stats(model_of):
    v = np.load(WORK / f"valid_pm25.npz")
    f, m = [], []
    for i, k in enumerate(v["k"]):
        mm = model_of(int(k))
        ok = (v["frac"][i] >= MIN_FRAC) & np.isfinite(v["values"][i]) & np.isfinite(mm) & (mm > 0)
        f.append(v["values"][i][ok]); m.append(mm[ok])
    f, m = np.concatenate(f), np.concatenate(m)
    rho, n = V.spearman(f, m)
    return {"n": n, "median_ratio": float(np.median(f / m)), "median_rel_error": float(np.median(np.abs(f - m) / m)), "spearman": rho}

def main():
    fetch()
    load = lambda name, k: np.load(OUT / f"{CANDIDATES[name][1]}_{'_'.join(CANDIDATES[name][0].split('_')[:2])}_{k:04d}.npy")
    rows = {name: stats(lambda k, n=name: load(n, k)) for name in CANDIDATES}
    rows["sum of the 7 components (bc+du+ni+oc+soa+ss+su)"] = stats(lambda k: sum(load(c, k) for c in COMPONENTS))
    match = [n for n, r in rows.items() if 0.85 <= r["median_ratio"] <= 1.15 and r["median_rel_error"] <= 0.15]
    out = {"candidates": rows, "match": match, "rule": "≈1× (median ratio 0.85–1.15) and median relative error ≤ 15 %"}
    (WORK.parent / "truth" / "pm25_search.json").write_text(json.dumps(V._clean(out), indent=1), encoding="utf-8")
    for n, r in rows.items():
        say(f"{n:55s} ratio {r['median_ratio']:.3f}  rel.err {r['median_rel_error']:.1%}  Spearman {r['spearman']:.3f}  n {r['n']}")
    say(f"match: {match or 'none'}")
    return out

if __name__ == "__main__":
    main()
