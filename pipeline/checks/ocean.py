"""latest/sst_anom.* (SVS 5176) and latest/sst_dt.* (MUR dt_1km_data)."""
import numpy as np
from common import PUBLIC, decode_sst
from core.grids import GRID_W, GRID_H, decode_i16
from .common import header_problems, info, load

SIGN_STOP = 0.80                 # "fails badly" (stop and ask) below this sign agreement with CRW

def sst_grid():
    return decode_sst(np.fromfile(PUBLIC / "latest" / "sst.bin", "<u2").reshape(GRID_H, GRID_W))

def sst_anom(check):
    d = load("latest/sst_anom.json")
    if d is None: return
    raw = np.fromfile(PUBLIC / "latest" / "sst_anom.bin", "<i2")
    g = decode_i16(raw.reshape(GRID_H, GRID_W), d["grid"]["scale"]) if raw.size == GRID_W * GRID_H else None
    lo, hi = d["value_range"]; v = d["verified"]
    land_share = float((np.isfinite(g) & ~np.isfinite(sst_grid())).sum() / max(1, np.isfinite(g).sum())) if g is not None else 1
    ok = (g is not None and not header_problems(d, "sst_anom") and np.nanmin(g) >= lo and np.nanmax(g) <= hi
          and v.get("test") == "C5176" and v.get("ticks_found") == 9 and len(d["calibration"]["ticks_px"]) == 9
          and land_share < 0.02 and (PUBLIC / "latest" / "sst_anom.webp").exists())
    check("latest/sst_anom.* (5176): grid, range, 9 ticks, C5176 block, land mask", ok,
          f"{header_problems(d, 'sst_anom')}; size {raw.size}; cells on SST land {land_share:.2%}; ticks {v.get('ticks_found')}")
    check("5176 vs CRW sign agreement not failing badly", (v.get("sign_agreement") or 0) >= SIGN_STOP,
          f"{v.get('sign_agreement')} (stop-and-ask below {SIGN_STOP})")
    info("5176 vs NOAA CRW", f"sign {v['sign_agreement']:.0%} (book 91%), Spearman {v['spearman']:.2f} (book 0.79), offset "
         f"{v['median_offset_C']:+.2f} °C (book −0.31), n {v['n_abs_ge_0_5']} (book 1,101); ticks px {d['calibration']['ticks_px'][0]}…"
         f"{d['calibration']['ticks_px'][-1]} at {d['calibration']['px_per_C']} px/°C (book 127…896, 96.1)")

def sst_dt(check):
    d = load("latest/sst_dt.json")
    if d is None: return
    g = np.fromfile(PUBLIC / "latest" / "sst_dt.bin", "u1")
    ok = g.size == GRID_W * GRID_H and not header_problems(d, "sst_dt")
    if ok:
        g = g.reshape(GRID_H, GRID_W); land = g == d["grid"]["nodata"]
        ok = np.array_equal(land, ~np.isfinite(sst_grid())) and int((g != d["grid"]["nodata"]).sum()) == d["summary"]["ocean_cells"]
    check("latest/sst_dt.* (MUR dt_1km_data): grid, land mask = sst.bin, summary", ok, f"{header_problems(d, 'sst_dt')}; size {g.size}")
    info("MUR dt_1km_data (E1/C5)", f"field present; MUR {d['mur_date']}: {d['summary']['looked_share']:.0%} of ocean cells had a 1 km "
         f"look (median {d['summary']['median_hours']:.0f} h)")

def run(check):
    sst_anom(check); sst_dt(check)
