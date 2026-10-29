"""Frame → date for 5011, which has no burned-in date and does not run at a constant rate (measured: northern-summer peaks
of the marks' mean latitude 660–750 frames apart, while the first and last active frames sit further from them than a
constant rate allows). Model, fixed before any ISS LIS file was read:
  anchors — the smoothed per-frame mean latitude's maxima and minima (prominence ≥ PROMINENCE°) are the northern and
            southern lightning seasons; each gets the day of year at which the independent LIS/OTD monthly climatology
            (HRMC, 1995–2014) peaks or bottoms out (annual harmonic fit to its 12 monthly centroids); the k-th maximum is
            year START.year + k; the first and last active frames are the stated period's ends;
  between — linear in frame number. Labelled approximate everywhere it is shown.
Usage: model(decode_meta, centroid) → {'anchors': [...], 'date_of': f(frame) → datetime}"""
import datetime as dt
import numpy as np
from scipy.ndimage import uniform_filter1d
from scipy.signal import find_peaks
from . import period
from .truth import HRMC, OUT as TRUTH, grid

PROMINENCE, SMOOTH, BAND = 8.0, 9, 55.0           # degrees, samples (every 10th frame), LIS coverage half-width

def climatology_days():
    """Day of year of the HRMC zonal-centroid maximum and minimum (count-weighted within ±BAND°)."""
    import netCDF4
    with netCDF4.Dataset(TRUTH / HRMC[1].rsplit("/", 1)[1]) as ds:
        v = np.ma.filled(ds["HRMC_COM_FR"][:].astype(float), np.nan); lat = np.asarray(ds["Latitude"][:])
    band = np.abs(lat) <= BAND
    w = np.cos(np.radians(lat[band]))[:, None]
    c = np.array([float((np.nansum(v[band, :, m] * w, 1) * lat[band]).sum() / np.nansum(v[band, :, m] * w)) for m in range(12)])
    doy = np.array([15.2 + 30.44 * m for m in range(12)])
    X = np.column_stack([np.ones(12), np.cos(2 * np.pi * doy / 365.25), np.sin(2 * np.pi * doy / 365.25)])
    a, b, s = np.linalg.lstsq(X, c, rcond=None)[0]
    peak = (np.degrees(np.arctan2(s, b)) % 360) / 360 * 365.25
    return {"monthly_centroid": c.tolist(), "peak_doy": float(peak), "trough_doy": float((peak + 365.25 / 2) % 365.25)}

def model(centroid):
    """centroid: (k, 3) rows of (frame, mean latitude, mark pixels) every 10th frame."""
    n, c, t = centroid[:, 0], centroid[:, 1], centroid[:, 2]
    active = t > 0.2 * np.median(t)
    s = uniform_filter1d(np.interp(n, n[active], c[active]), SMOOTH, mode="nearest")
    pk, _ = find_peaks(s, prominence=PROMINENCE); tr, _ = find_peaks(-s, prominence=PROMINENCE)
    clim = climatology_days()
    start, end = period()
    on_day = lambda year, doy: dt.datetime(year, 1, 1, tzinfo=dt.timezone.utc) + dt.timedelta(days=doy)
    anchors = [(float(n[active][0]), start, "first active frame = period start")]
    anchors += [(float(n[i]), on_day(start.year + k, clim["peak_doy"]), "northern lightning season (HRMC peak day)") for k, i in enumerate(pk)]
    first_peak = n[pk[0]]
    trs = [i for i in tr if n[i] > first_peak]
    anchors += [(float(n[i]), on_day(start.year + 1 + k, clim["trough_doy"]), "southern lightning season (HRMC trough day)") for k, i in enumerate(trs)]
    anchors.append((float(n[active][-1]), end, "last active frame = period end"))
    anchors.sort(key=lambda a: a[0])
    fx = np.array([a[0] for a in anchors]); fy = np.array([a[1].timestamp() for a in anchors])
    if np.any(np.diff(fy) <= 0): raise RuntimeError(f"frame-time anchors are not in order: {[(a[0], a[1].date()) for a in anchors]}")
    date_of = lambda f: dt.datetime.fromtimestamp(float(np.interp(f, fx, fy)), dt.timezone.utc)
    rates = [{"frames": [float(fx[i]), float(fx[i + 1])], "days_per_frame": float((fy[i + 1] - fy[i]) / 86400 / (fx[i + 1] - fx[i]))}
             for i in range(len(fx) - 1)]
    return {"anchors": [{"frame": a[0], "date": a[1].strftime("%Y-%m-%d"), "why": a[2]} for a in anchors], "segments": rates,
            "climatology": clim, "date_of": date_of, "active_frames": [float(n[active][0]), float(n[active][-1])]}
