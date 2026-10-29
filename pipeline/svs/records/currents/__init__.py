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
