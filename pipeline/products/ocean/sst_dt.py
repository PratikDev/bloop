"""MUR `dt_1km_data` → latest/sst_dt.bin (u8 hours, 1024×512) + sst_dt.json: how long ago a 1 km infrared pixel
was seen near each cell (freshness as clarity, C5). Same MUR day as the SST frame check (latest/sst.json latest_check).
Read in latitude slabs (MUR chunks are 1023 rows), so memory stays small.
Usage (from pipeline/): python -m products.ocean.sst_dt"""
import json
from datetime import datetime, timezone
import numpy as np, xarray as xr
from common import PUBLIC, decode_sst
from core.ref import T
from core.grids import GRID_W, GRID_H, U8_NODATA, grid_info
from core.header import header, publish_json, publish_bin, iso
from core.log import say, main_guard

NO_LOOK = 254                   # most pixels in the cell had no 1 km datum in MUR's window
MIN_MEASURED_SHARE = 0.5
SLAB = 1023

def mur_day():
    sst = json.load(open(PUBLIC / "latest" / "sst.json"))
    check = sst.get("latest_check") or {}
    if not check.get("date"):
        raise T.Skip("latest/sst.json has no latest_check yet (run verify_latest.py first): no MUR day to pair with")
    return check["date"]

def main():
    day = mur_day()
    ea, res = T.ed_search("MUR-JPL-L4-GLOB-v4.1", temporal=(day, day))
    granule = next(r for r in res if r.data_links()[0].split("/")[-1].startswith(day.replace("-", "")))
    ds = xr.open_dataset(T.open_remote(ea, [granule])[0], engine="h5netcdf", decode_timedelta=False, mask_and_scale=False)
    var = ds["dt_1km_data"]; fill = int(var.attrs["_FillValue"])
    lat, lon = ds["lat"].values, ds["lon"].values
    col = np.clip(((lon + 180) / 360 * GRID_W).astype(np.int64), 0, GRID_W - 1)
    hours_sum = np.zeros(GRID_W * GRID_H); measured = np.zeros(GRID_W * GRID_H); total = np.zeros(GRID_W * GRID_H)
    for y0 in range(0, len(lat), SLAB):
        a = var.isel(time=0, lat=slice(y0, y0 + SLAB)).values.astype(np.int16)
        row = np.clip(((90 - lat[y0:y0 + SLAB]) / 180 * GRID_H).astype(np.int64), 0, GRID_H - 1)
        cell = (row[:, None] * GRID_W + col[None, :]).ravel()
        ok = (a != fill).ravel()
        total += np.bincount(cell, minlength=GRID_W * GRID_H)
        measured += np.bincount(cell[ok], minlength=GRID_W * GRID_H)
        hours_sum += np.bincount(cell[ok], weights=np.abs(a.ravel()[ok]), minlength=GRID_W * GRID_H)
        say(f"  rows {y0}–{y0 + a.shape[0] - 1} of {len(lat)}")
    ds.close()
    share = (measured / np.maximum(total, 1)).reshape(GRID_H, GRID_W)
    mean_h = (hours_sum / np.maximum(measured, 1)).reshape(GRID_H, GRID_W)
    ocean = np.isfinite(decode_sst(np.fromfile(PUBLIC / "latest" / "sst.bin", "<u2").reshape(GRID_H, GRID_W)))
    out = np.full((GRID_H, GRID_W), U8_NODATA, np.uint8)
    looked = ocean & (share >= MIN_MEASURED_SHARE)
    out[looked] = np.clip(np.round(mean_h[looked]), 0, NO_LOOK - 1).astype(np.uint8)
    out[ocean & ~looked] = NO_LOOK
    say(f"MUR {day}: ocean cells {ocean.sum():,}; with a recent 1 km look {looked.sum() / ocean.sum():.1%}; "
        f"median hours {np.median(out[looked]):.0f}")
    publish_bin("latest/sst_dt.bin", out)
    name = granule.data_links()[0].split("/")[-1]
    publish_json("latest/sst_dt.json", {
        **header("sst_dt", iso(datetime.strptime(name[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc))),
        "mur_date": day, "mur_file": name,
        "units": "hours", "variable": "dt_1km_data", "variable_comment": var.attrs.get("comment"),
        "grid": grid_info(GRID_W, GRID_H, "uint8_hours", nodata=int(U8_NODATA), no_look=NO_LOOK,
                          aggregation=f"mean |hours| over pixels with a 1 km datum; {NO_LOOK} when fewer than "
                                      f"{MIN_MEASURED_SHARE:.0%} of the cell's pixels had one; {U8_NODATA} = land (no SST)"),
        "summary": {"ocean_cells": int(ocean.sum()), "looked_share": round(float(looked.sum() / ocean.sum()), 4),
                    "median_hours": float(np.median(out[looked]))},
    })

if __name__ == "__main__":
    main_guard(main)
