"""5425 / 5479 against Copernicus GLORYS12 (GLOBAL_MULTIYEAR_PHY_001_030, cmems_mod_glo_phy_my_0.083deg_P1M-m; a
different ocean model, Copernicus Marine licence) at the depths the colours describe. Fixed 1 Nov before reading:
the month of each decoded 5479 frame; thetao and so at the levels nearest 600 m (643.6 m) and 1000 m (1062.4 m); 1°
cell means; Spearman and median difference against the decoded 1° grids (data_raw/5479/grids.npz), per variable and
level, all frames pooled. No threshold (a different model, monthly means vs a snapshot): reported.
Credentials: COPERNICUSMARINE_SERVICE_USERNAME / _PASSWORD from .env.local (read by the toolbox; never printed).
Writes data_raw/5479/glorys.json. Usage (from pipeline/): python -m svs.records.ocean2.glorys"""
import datetime as dt, json
import numpy as np
import core.env  # noqa: F401  (.env.local → the toolbox's credentials)
from core.log import say
from svs import validate as V
from svs.config import raw_dir
from svs.onboard.sources import to_1deg

DATASET = "cmems_mod_glo_phy_my_0.083deg_P1M-m"
LEVELS = {"600 m": 643.6, "1000 m": 1062.4}
VARS = {"temperature": "thetao", "salinity": "so"}

def main():
    import copernicusmarine as cm
    g = np.load(raw_dir(5479) / "grids.npz")
    dates = [dt.date.fromisoformat(str(d)) for d in g["dates"]]
    truth = {k: {lv: [] for lv in LEVELS} for k in VARS}
    for k, v in VARS.items():
        for lv, depth in LEVELS.items():                             # one level per open: a 4-level map chunk stalls the stream
            ds = cm.open_dataset(dataset_id=DATASET, variables=[v], minimum_depth=depth - 1, maximum_depth=depth + 1,
                                 service="arco-geo-series", start_datetime=f"{min(dates):%Y-%m}-01", end_datetime=f"{max(dates):%Y-%m}-28")
            lat, lon = np.meshgrid(ds.latitude.values, ds.longitude.values, indexing="ij")
            for d in dates:
                a = ds[v].sel(time=np.datetime64(f"{d:%Y-%m}-01"), method="nearest").isel(depth=0).values.astype(np.float64)
                truth[k][lv].append(to_1deg(lat.ravel(), lon.ravel(), a.ravel()))
            say(f"GLORYS12 {k} {lv}: {len(dates)} months read")
    out = {"dataset": DATASET, "dates": [str(d) for d in dates], "levels": LEVELS, "results": {}}
    for k in VARS:
        F = g[k].astype(float)
        res = {}
        for lv in LEVELS:
            T = np.stack(truth[k][lv])
            rho, n = V.spearman(F, T)
            ok = np.isfinite(F) & np.isfinite(T)
            res[lv] = {"spearman": rho, "n": n, "median_diff": float(np.median(F[ok] - T[ok])) if ok.any() else None}
        out["results"][k] = {"levels": res, "best": max(res, key=lambda x: res[x]["spearman"] if res[x]["spearman"] is not None else -9)}
        say(f"GLORYS12 {k}: " + "; ".join(f"{lv} ρ {r['spearman']:.2f}, Δ {r['median_diff']:+.2f}" for lv, r in res.items()))
    (raw_dir(5479) / "glorys.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")

if __name__ == "__main__":
    main()
