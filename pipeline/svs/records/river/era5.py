"""4960 against ERA5 (reanalysis-era5-single-levels, CC-BY; a second reanalysis, partly independent of MERRA-2). Fixed
1 Nov before reading, the same rules as the MERRA-2 check (validate.py): hourly IVT = |(vertical integral of eastward,
northward water vapour flux)|, its maximum over COAST_BOX, from the first to the last frame date; (d) the hour of the
strongest coastal IVT vs the frame with the most river–land contact; (e) Spearman of the frames' contact with ERA5 IVT
at the frames' hours; (f) ERA5 vs MERRA-2 hourly coastal IVT over the span (how far the two reanalyses agree).
Credentials: CDSAPI_URL / CDSAPI_KEY from .env.local (never printed). Usage (from pipeline/): python -m svs.records.river.era5"""
import datetime as dt, json
import numpy as np
import core.env  # noqa: F401
from core.log import say
from svs import cams, validate as V
from svs.config import raw_dir
from . import COAST_BOX, RECORD, SID

ROOT = raw_dir(SID)
VARS = ("vertical_integral_of_eastward_water_vapour_flux", "vertical_integral_of_northward_water_vapour_flux")

def fetch(days):
    w, s, e, n = COAST_BOX
    months = sorted({(d.year, d.month) for d in days})
    return cams.download("CDSAPI", "reanalysis-era5-single-levels", {
        "product_type": ["reanalysis"], "variable": list(VARS), "year": sorted({str(y) for y, _ in months}),
        "month": sorted({f"{m:02d}" for _, m in months}), "day": [f"{d:02d}" for d in range(1, 32)], "time": [f"{h:02d}:00" for h in range(24)],
        "area": [n, w, s, e], "data_format": "netcdf", "download_format": "unarchived"}, ROOT / "era5" / "ivt.nc")

def main():
    import xarray as xr
    rows = [r for r in json.loads((ROOT / "frames.json").read_text(encoding="utf-8"))["rows"] if r["time"]]
    times = [dt.datetime.fromisoformat(r["time"].replace("Z", "+00:00")) for r in rows]
    first, last = min(times).date(), max(times).date()
    days = [first + dt.timedelta(days=i) for i in range((last - first).days + 1)]
    ds = xr.open_dataset(fetch(days))
    tname = "valid_time" if "valid_time" in ds.coords else "time"
    names = list(ds.data_vars)
    east = next(k for k in names if "east" in ds[k].attrs.get("long_name", "").lower() or k in ("viwve", "p71.162"))
    north = next(k for k in names if "north" in ds[k].attrs.get("long_name", "").lower() or k in ("viwvn", "p72.162"))
    ivt = np.hypot(ds[east], ds[north]).max(dim=[d for d in ds[east].dims if d != tname])
    hourly = {dt.datetime.fromisoformat(str(t)[:19]).replace(tzinfo=dt.timezone.utc): float(x) for t, x in zip(ivt[tname].values, ivt.values)}
    hourly = {t: x for t, x in hourly.items() if first <= t.date() <= last}
    at = lambda t: hourly.get(t.replace(minute=0, second=0, microsecond=0))
    contact = np.array([r["contact_px"] for r in rows], float)
    peak_frame, peak_e5 = times[int(np.argmax(contact))], max(hourly, key=hourly.get)
    rho, n = V.spearman(contact, np.array([at(t) or np.nan for t in times]))
    m2 = {}
    for d in days:
        p = ROOT / "merra2" / f"{d:%Y%m%d}.npy"
        if p.exists():
            for h, x in enumerate(np.load(p)): m2[dt.datetime(d.year, d.month, d.day, h, tzinfo=dt.timezone.utc)] = float(x)
    common = sorted(set(m2) & set(hourly))
    r2, n2 = V.spearman([hourly[t] for t in common], [m2[t] for t in common])
    src = "ERA5 hourly single levels (C3S, CC-BY), vertical integrals of water vapour flux"
    checks = [V.check(RECORD, "d_landfall_timing_era5", "Landfall timing: most river–land contact vs strongest coastal IVT in ERA5", kind="value", source=src,
                      passed=None, metrics={"frame_peak_utc": peak_frame.strftime("%Y-%m-%dT%H:%MZ"), "era5_peak_utc": peak_e5.strftime("%Y-%m-%dT%H:%MZ"),
                                            "difference_hours": (peak_frame - peak_e5).total_seconds() / 3600, "era5_peak_ivt": hourly[peak_e5],
                                            "rung": "second reanalysis"}),
              V.check(RECORD, "e_contact_rank_era5", "River–land contact per frame vs ERA5 coastal IVT at the frame's hour (Spearman)", kind="value",
                      source=src, passed=None, metrics={"spearman": rho, "n": n, "rung": "second reanalysis"}),
              V.check(RECORD, "f_era5_vs_merra2", "ERA5 vs MERRA-2 hourly coastal IVT over the span (reanalysis agreement)", kind="context",
                      source=src + "; MERRA-2 M2T1NXINT", passed=None, metrics={"spearman": r2, "hours": n2})]
    V.save(RECORD, checks)
    say(f"4960 ERA5: peak {peak_e5} ({checks[0]['metrics']['difference_hours']:+.0f} h), contact rank ρ {rho}, ERA5~MERRA-2 ρ {r2:.3f} over {n2} h")

if __name__ == "__main__":
    main()
