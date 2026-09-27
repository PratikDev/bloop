"""Step 2: SST frame (EXR or PNG) -> verified colorbar inversion -> 1024x512 °C grid + display image + metadata.
Usage: python convert_sst.py [path_to_frame --time=YYYY-MM-DDTHH:MM:SSZ]   (default: the file in raw/manifest.json)"""
import os, sys, json
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
from common import *
from PIL import Image

def srgb_encode(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)

def read_frame(path, exr_encoding):
    """Returns (rgb uint8 HxWx3, transparent mask or None)."""
    path = str(path)
    if path.lower().endswith(".exr"):
        import cv2
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise SystemExit(f"OpenCV could not read {path}")
        img = img.astype(np.float32)
        if img.ndim == 2: img = np.dstack([img] * 3)
        alpha = img[:, :, 3] if img.shape[2] == 4 else None
        rgb = np.nan_to_num(img[:, :, [2, 1, 0]])
        if exr_encoding == "srgb": enc = srgb_encode(rgb)
        elif exr_encoding == "raw": enc = np.clip(rgb, 0, 1)
        elif exr_encoding in ("gamma2.2", "gamma1.8"): enc = np.power(np.clip(rgb, 0, 1), 1 / float(exr_encoding[5:]))
        else: raise SystemExit(f"Unknown exr_encoding '{exr_encoding}' (use srgb, raw, gamma2.2 or gamma1.8)")
        u8 = (enc * 255 + 0.5).astype(np.uint8)
        return u8, (alpha < 0.5) if alpha is not None else None
    im = Image.open(path)
    if im.mode == "RGBA":
        a = np.asarray(im)
        return a[:, :, :3].copy(), a[:, :, 3] == 0
    return np.asarray(im.convert("RGB")), None

def sst_lut(P):
    c = P["sst"]
    s = strip(read_rgb(PIPE / c["colorbar_file"]), c["orientation"], int(c["start"]), int(c["end"]), int(c["across"]))
    return s, strip_values(len(s), c["vmin"], c["vmax"], c["scale"])

def invert_sst(path, P):
    lut_rgb, lut_val = sst_lut(P)
    rgb, transp = read_frame(path, P["sst"]["exr_encoding"])
    vals, _, dist = invert_rgb_image(rgb, lut_rgb, lut_val, P["sst"]["max_colour_distance"], transp)
    return rgb, vals, dist

def main():
    P = load_params()
    man = json.load(open(RAW / "manifest.json")) if (RAW / "manifest.json").exists() else {"products": {}}
    args = [a for a in sys.argv[1:] if not a.startswith("--time")]
    tflag = [a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--time=")]
    src = Path(args[0]) if args else PIPE / man["products"]["sst"]["local"]
    frame_time = tflag[0] if tflag else (man.get("products", {}).get("sst", {}).get("frame_time_utc") if not args else None)
    if frame_time is None:
        raise SystemExit("Frame time unknown: pass --time=YYYY-MM-DDTHH:MM:SSZ when converting a file by path.")
    rgb, vals, dist = invert_sst(src, P)
    H, W = vals.shape
    if W != 2 * H: raise SystemExit(f"Unexpected frame size {W}x{H}: expected 2:1 equirectangular")
    gw = P["sst"]["grid_width"]
    if W % gw: raise SystemExit(f"Frame width {W} not divisible by grid width {gw}")
    grid = block_nanmean(vals, W // gw)
    ocean = np.isfinite(vals)
    print(f"Frame {src.name}: {W}x{H}; ocean pixels {ocean.mean()*100:.1f}% (land/no-data {100-ocean.mean()*100:.1f}%)")
    print(f"  colour distance on ocean: median {np.median(dist[ocean]):.2f}, 99th pct {np.percentile(dist[ocean], 99):.2f}")
    v = vals[ocean]
    print(f"  SST °C: min {v.min():.2f}  median {np.median(v):.2f}  max {v.max():.2f}")
    # sanity bands: tropical ocean (10S-10N) should be warm, polar ocean (>60) cold
    lat = 90 - (np.arange(H) + 0.5) * 180 / H
    trop = vals[(np.abs(lat) < 10)][:, :]; pol = vals[np.abs(lat) > 60]
    print(f"  sanity: tropical median {np.nanmedian(trop):.2f} °C (expect ~26–30); polar median {np.nanmedian(pol):.2f} °C (expect < 5)")
    np.save(WORK / "sst_fullres.npy", vals)
    out = PUBLIC / "latest"
    encode_sst(grid).tofile(out / "sst.bin")
    Image.fromarray(rgb).resize((P["sst"]["display_width"], P["sst"]["display_width"] // 2), Image.LANCZOS).save(out / "sst.webp", quality=90)
    meta = {"product": "sst", "svs_id": P["sst"]["svs_id"], "svs_page": P["sst"]["svs_page"],
            "frame_time_utc": frame_time, "source_file": src.name,
            "source_dataset": P["sst"]["source_dataset"],
            "grid": {"width": gw, "height": gw // 2, "encoding": "uint16_offset", "scale": 1000, "offset": -5, "nodata": 65535,
                     "byte_order": "little", "row0": "north (90N)", "col0": "180W", "aggregation": f"mean of {W//gw}x{W//gw} source pixels"},
            "units": "degC", "value_range": [P["sst"]["vmin"], P["sst"]["vmax"]],
            "verified": P["sst"]["verified"], "calibration": P["sst"].get("calibration"),
            "credit": P["sst"]["credit"], "generated_utc": now_utc()}
    write_json(out / "sst.json", meta)
    print(f"Wrote public/data/latest/sst.bin ({(out/'sst.bin').stat().st_size} bytes), sst.webp, sst.json (frame time {frame_time})")

if __name__ == "__main__":
    main()