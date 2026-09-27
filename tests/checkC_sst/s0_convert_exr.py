# Step C1b: convert the EXR frames into PNG files the other scripts can read
import os
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"   # must be set BEFORE importing cv2
import numpy as np
from PIL import Image

MAIN_EXR = "sst_mur_20260922_no-dates.exr"    # main frame (no date)
DATED_EXR = "sst_mur_20260922.exr"            # dated frame (only to read the date)

def read_exr(path):
    img = None
    try:
        import cv2
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if img is not None:
            if img.ndim == 2:
                img = np.dstack([img] * 3)
            elif img.shape[2] == 4:
                img = img[:, :, [2, 1, 0, 3]]      # BGRA -> RGBA
            else:
                img = img[:, :, [2, 1, 0]]         # BGR -> RGB
            print(f"  read with OpenCV")
    except ImportError:
        pass
    if img is None:
        import OpenEXR                               # fallback: pip install OpenEXR
        with OpenEXR.File(path) as f:
            ch = f.channels()
            if "RGBA" in ch:
                img = ch["RGBA"].pixels
            elif "RGB" in ch:
                img = ch["RGB"].pixels
            else:
                img = np.dstack([ch[k].pixels for k in ("R", "G", "B")])
        print(f"  read with OpenEXR")
    return img.astype(np.float32)

def srgb_encode(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)

def convert(path, out_srgb, out_raw=None):
    print(f"\n{path}")
    img = read_exr(path)
    h, w, c = img.shape
    print(f"  size {w} x {h}, channels {c}, dtype {img.dtype}")
    rgb = img[:, :, :3]
    for i, name in enumerate("RGB"):
        ch = rgb[:, :, i]
        print(f"  {name}: min {np.nanmin(ch):.4f}  median {np.nanmedian(ch):.4f}  max {np.nanmax(ch):.4f}")
    alpha = None
    if c == 4:
        alpha = img[:, :, 3]
        print(f"  alpha: min {alpha.min():.3f} max {alpha.max():.3f}  "
              f"transparent pixels: {(alpha < 0.5).mean()*100:.1f}%")
    if np.nanmax(rgb) > 1.05:
        print("  WARNING: values above 1.0 - paste this output into the chat before continuing")
    rgb = np.nan_to_num(rgb)
    s = (srgb_encode(rgb) * 255 + 0.5).astype(np.uint8)
    r = (np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8)
    if alpha is not None:                            # mark transparent pixels as neutral grey
        s[alpha < 0.5] = 128; r[alpha < 0.5] = 128
    Image.fromarray(s).save(out_srgb); print(f"  saved {out_srgb} (sRGB-encoded)")
    if out_raw:
        Image.fromarray(r).save(out_raw); print(f"  saved {out_raw} (values used as-is)")

convert(MAIN_EXR, "sst_frame.png", "sst_frame_raw.png")
convert(DATED_EXR, "sst_dated_view.png")
print("\nOpen sst_dated_view.png to read the printed date.")
