"""SVS 3912 Global Sea Surface Currents and Temperature (ECCO2 model, 25 Mar 2007 – 3 Mar 2008).
Frames: the 2048×1024 'orig' set (asset rule); times: SVS's per-frame date list (method a).
Subsample: every STEP-th frame (24.75 h). Consecutive frames move by ~0.03 px (measured, lags 1–32 on 23000…23128,
before any validation data was read), so the daily sequence is the 'consecutive frames' optical flow runs on."""
import numpy as np

SID = 3912
STEP = 6
MIN_COV = 0.2                       # a 1° SST cell needs this share of its pixels on streaks (export and validation)
DATES_URL_RX = r"flat_ecco2_dates\.txt$"

def grids():
    """The decoded daily grids as memory-mapped arrays (data_raw/3912/grids/<name>.npy), unpacked once from grids.npz:
    an .npz re-inflates a whole array on every access, and all of them together do not fit in memory."""
    from svs.config import raw_dir
    root = raw_dir(SID, "grids")
    packed = raw_dir(SID) / "grids.npz"
    if packed.exists():
        with np.load(packed) as z:
            for name in z.files:
                np.save(root / f"{name}.npy", z[name])
        packed.unlink()
    return {p.stem: np.load(p, mmap_mode="r") for p in root.glob("*.npy")}

FLOOR_BINS = (0.0, 6.0, 0.05)        # °C: where the floor is looked for, and the histogram bin

def sst_floor(g, every=7):
    """The render's floor as decoded (team decision A6, 29 Oct 2026; frames only): the mode of the cell SST histogram
    (every 7th day, FLOOR_BINS). Water colder than the colorbar's 0 °C is drawn in its bottom colour, so it piles up
    here; in hue mode that dark-blue end decodes ~2 °C high, so the floor is measured, not assumed to be 0 °C."""
    v = np.asarray(g["sst"][::every]); c = np.asarray(g["sst_cov"][::every])
    v = v[(c >= MIN_COV) & np.isfinite(v)]
    lo, hi, w = FLOOR_BINS
    h, e = np.histogram(v[(v >= lo) & (v < hi)], bins=np.arange(lo, hi + w / 2, w))
    i = int(h.argmax())
    return {"value_C": float((e[i] + e[i + 1]) / 2), "bin_C": w, "share_within_0.1C": float(np.mean(np.abs(v - (e[i] + e[i + 1]) / 2) <= 0.1))}

def sst_cells(g, a, b, limit=None):
    """SST for days a..b-1 per cell with streak coverage ≥ MIN_COV. limit (°C): cells at or below it are at the colorbar's
    bottom and are left out (NaN); None keeps them (the with/without comparison)."""
    v = np.where(np.asarray(g["sst_cov"][a:b]) >= MIN_COV, g["sst"][a:b], np.nan)
    return v if limit is None else np.where(v <= limit, np.nan, v)

def sst_at_limit(g, a, b, limit):
    """Cells that read "≤ 0 °C (colorbar limit)": enough streak pixels, and a decoded SST at or below `limit`."""
    with np.errstate(invalid="ignore"):
        return (np.asarray(g["sst_cov"][a:b]) >= MIN_COV) & (np.asarray(g["sst"][a:b]) <= limit)

def limit_C(g, cb_summary):
    """The floor plus one colorbar pixel: the cut between 'at the colorbar's bottom' and a value."""
    return sst_floor(g)["value_C"] + 1 / cb_summary["px_per_unit"]
