"""SVS 5176 SST anomaly frame → tick-calibrated colorbar inversion → latest/sst_anom.bin (Int16, 0.001 °C, 1024×512)
+ sst_anom.json + sst_anom.webp. The colorbar strip, tick finder and frame choice are the reference suite's (test
C5176); C5176 itself then runs on the same downloaded frame (vs NOAA Coral Reef Watch) and becomes `verified`.
Usage (from pipeline/): python -m products.ocean.sst_anom"""
import re
from datetime import datetime
import numpy as np
from PIL import Image
from common import PUBLIC, invert_rgb_image, block_nanmean
from core.ref import T, run_test
from core.grids import GRID_W, GRID_H, encode_i16, grid_info
from core.header import header, publish_json, publish_bin, iso
from core.log import say, main_guard

SCALE = 1000                    # Int16 per °C (book §5.3)
VMIN, VMAX, N_TICKS = -4.0, 4.0, 9
MAX_DIST = 20                   # colour distance the C5176 test accepts
GREY_CHROMA, GREY_MAX = 15, 200 # dark, colourless pixels: the bar's border, the frame's land and ice (the bar's white centre is lighter)
DISPLAY_W = 2048

def dark_grey(rgb):
    rgb = np.asarray(rgb, np.int32)
    return (rgb.max(-1) - rgb.min(-1) < GREY_CHROMA) & (rgb.max(-1) < GREY_MAX)

def coloured_span(strip):
    """First and last strip index that is not the bar's dark border (C5176 only samples ocean, so it never needed this)."""
    keep = np.flatnonzero(~dark_grey(strip))
    return int(keep[0]), int(keep[-1])

def pick_files():
    """The frame and colorbar C5176 uses (equirectangular 'nodates most recent'; the labelled bar)."""
    info, files, bars = T.svs_pick(5176)
    plain = [u for u in files if not re.search(r"robinson|pacific", u, re.I)]
    frame = ([u for u in plain if "most_recent" in u and re.search(r"no-?dates", u)] or
             [u for u in plain if "most_recent" in u] or [u for u in plain if re.search(r"no-?dates", u)])
    bars = sorted(bars, key=lambda u: ("print" not in u, not u.endswith(".png"), u))
    if not frame or not bars:
        raise RuntimeError(f"5176: frame or colorbar URL missing (frames {len(files)}, bars {len(bars)})")
    return info, frame[0], bars[0]

def fresh_download(url):
    """Into the suite's sample folder under the name C5176 uses, so the test reads the very same file."""
    dest = T.OUT / "samples" / ("5176_" + url.split("/")[-1])
    dest.unlink(missing_ok=True)
    return T.download(url, dest, max_mb=150)

def calibrate(bar_rgba):
    """Strip colours + the 9 ticks (−4…+4 °C) on the bar's edge rows, as in C5176. No ticks → no product."""
    _, geom = T.detect_colorbar_strip(bar_rgba)
    strip = T.strip_band(bar_rgba, geom, half=2)
    x0, x1, y, vertical = geom
    limit = bar_rgba.shape[1] if vertical else bar_rgba.shape[0]
    for dy in list(range(1, 40)) + list(range(-1, -40, -1)):
        if not 0 <= y - dy < limit:
            continue
        ticks, _ = T.find_ticks(T.strip_band(bar_rgba, (x0, x1, y - dy, vertical), half=0), n_expected=N_TICKS)
        if len(ticks) == N_TICKS:
            return strip, ticks, geom
    raise RuntimeError("5176 colorbar: 9 ticks not found, so the scale can't be calibrated (nothing published)")

def main():
    info, frame_url, bar_url = pick_files()
    frame_path, bar_path = fresh_download(frame_url), fresh_download(bar_url)
    strip, ticks, geom = calibrate(T.read_image_rgba(bar_path))
    s0, s1 = coloured_span(strip)
    idx = np.arange(s0, s1 + 1)
    lut_val = np.clip(VMIN + (VMAX - VMIN) * (idx - ticks[0]) / (ticks[-1] - ticks[0]), VMIN, VMAX)
    rgba = T.read_image_rgba(frame_path)
    rgb = np.ascontiguousarray(rgba[:, :, :3])
    H, W = rgb.shape[:2]
    if W != 2 * H or W % GRID_W:
        raise RuntimeError(f"5176 frame is {W}x{H}: expected 2:1 equirectangular divisible by {GRID_W}")
    no_data = (rgba[:, :, 3] < 128) | dark_grey(rgb)
    vals, _, dist = invert_rgb_image(rgb, strip[s0:s1 + 1].astype(np.float32), lut_val, MAX_DIST, no_data)
    ocean = np.isfinite(vals)
    grid = block_nanmean(vals, W // GRID_W)
    say(f"5176 {frame_url.split('/')[-1]}: {W}x{H}; decoded {ocean.mean():.1%} of pixels; anomaly °C "
        f"min {np.nanmin(vals):+.2f} median {np.nanmedian(vals):+.2f} max {np.nanmax(vals):+.2f}; "
        f"saturated at ±{VMAX:g}: {np.mean(np.abs(vals[ocean]) >= VMAX):.2%}")
    publish_bin("latest/sst_anom.bin", encode_i16(grid, SCALE))
    Image.fromarray(rgb).resize((DISPLAY_W, DISPLAY_W // 2), Image.LANCZOS).save(PUBLIC / "latest" / "sst_anom.webp", quality=90)

    status, detail, m = run_test("C5176")
    say(f"C5176 {status}: {detail}")
    if status not in (T.PASS, T.WARN) or m.get("frame") != frame_url:
        raise RuntimeError("C5176 did not run on this frame: no verified block, nothing published as checked")
    x0 = geom[0]
    frame_time = iso(datetime.fromisoformat(info["newest_time"])) if info.get("newest_time") not in (None, "None") else None
    publish_json("latest/sst_anom.json", {
        **header("sst_anom", frame_time), "svs_id": 5176, "svs_page": "https://svs.gsfc.nasa.gov/5176/",
        "frame_time_utc": frame_time, "frame_time_source": f"newest dated file in the SVS 5176 frame folders ({info.get('age_source')})",
        "source_file": frame_url.split("/")[-1], "colorbar_file": bar_url.split("/")[-1], "units": "degC",
        "value_range": [VMIN, VMAX], "saturates_at_range_ends": True,
        "calibration": {"ticks_px": [round(x0 + t, 1) for t in ticks], "px_per_C": round((ticks[-1] - ticks[0]) / (VMAX - VMIN), 2),
                        "value_at_ticks_C": [VMIN + k * (VMAX - VMIN) / (N_TICKS - 1) for k in range(N_TICKS)],
                        "strip_span_px": [round(x0 + s0, 1), round(x0 + s1, 1)], "max_colour_distance": MAX_DIST,
                        "decoded_pixel_share": round(float(ocean.mean()), 4),
                        "saturated_share": round(float(np.mean(np.abs(vals[ocean]) >= VMAX)), 4)},
        "grid": grid_info(GRID_W, GRID_H, "int16_scaled", scale=SCALE, nodata=-32768, aggregation=f"mean of {W // GRID_W}x{W // GRID_W} source pixels"),
        "verified": {"test": "C5176", "status": status, "against": m.get("crw_dataset"), "against_time": m.get("crw_time"),
                     "n_points": m.get("n"), "n_abs_ge_0_5": m.get("n_abs_ge_0_5"), "sign_agreement": m.get("sign_agreement"),
                     "spearman": m.get("spearman"), "median_offset_C": m.get("median_diff_C"),
                     "median_abs_offset_C": m.get("median_abs_diff_C"), "ticks_found": m.get("ticks_found")},
    })

if __name__ == "__main__":
    main_guard(main)
