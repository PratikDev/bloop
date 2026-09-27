"""Step 3: IMERG flatalpha frame -> RGB-only inversion over liquid+frozen colorbars -> 1800x900 mm/h grid + phase.
Usage: python convert_rain.py [path_to_frame --time=YYYY-MM-DDTHH:MM:SSZ]"""
import sys, json
from common import *
from PIL import Image

def rain_luts(P):
    c = P["rain"]; parts = {}
    for phase in ("liquid", "frozen"):
        w = strip(read_rgb(PIPE / c["colorbars"][phase]["white"]), c["orientation"], c["start"], c["end"], c["across"])
        b = strip(read_rgb(PIPE / c["colorbars"][phase]["black"]), c["orientation"], c["start"], c["end"], c["across"])
        a = np.clip(1 - (w - b).mean(axis=1) / 255.0, 0, 1)
        straight = np.clip(b / np.maximum(a, 1e-3)[:, None], 0, 255)
        parts[phase] = {"white": w, "black": b, "straight": straight, "alpha": a,
                        "values": strip_values(len(b), c["vmin"], c["vmax"], c["scale"])}
    return parts

def combined(parts, variant):
    rgb = np.vstack([parts["liquid"][variant], parts["frozen"][variant]])
    val = np.concatenate([parts["liquid"]["values"], parts["frozen"]["values"]])
    ph = np.concatenate([np.ones(len(parts["liquid"]["values"]), np.uint8), np.full(len(parts["frozen"]["values"]), 2, np.uint8)])
    return rgb, val, ph

def read_rgba(path):
    a = np.asarray(Image.open(path).convert("RGBA"))
    return a[:, :, :3], a[:, :, 3]

def choose_variant(P, parts, rgb, alpha):
    v = P["rain"]["rgb_variant"]
    vis = rgb[alpha > 0]
    if len(vis) == 0:
        return (v if v != "auto" else "black"), {}
    rng = np.random.default_rng(0)
    sample = vis[rng.choice(len(vis), size=min(200000, len(vis)), replace=False)].astype(np.float32)
    shares = {}
    for var in ("straight", "black", "white"):
        lut, _, _ = combined(parts, var)
        _, d = nearest(sample, lut)
        shares[var] = float((d <= 3).mean())
    best = max(shares, key=shares.get) if v == "auto" else v
    return best, shares

def invert_rain(path, P, variant=None):
    parts = rain_luts(P)
    rgb, alpha = read_rgba(path)
    shares = {}
    if variant is None:
        variant, shares = choose_variant(P, parts, rgb, alpha)
    lut, val, ph = combined(parts, variant)
    rate, j, d = invert_rgb_image(rgb, lut, val, 1e9)            # nearest always; distance checked below
    phase = ph[j].astype(np.uint8)
    dry = alpha == 0
    rate[dry] = 0.0; phase[dry] = 0
    unmatched = (~dry) & (d > P["rain"]["max_colour_distance"])
    return rgb, alpha, rate.astype(np.float32), phase, d, unmatched, variant, shares

def write_rain(rate, phase, rgba_img, factor, out_dir, stem, meta, P, compact=False):
    import gzip
    g, gp = block_max_with_phase(rate, phase, factor)
    H, W = rate.shape
    small = Image.fromarray(rgba_img).resize((W // factor, H // factor), Image.LANCZOS)
    if compact:   # time-lapse: 1 byte/cell (rain+phase) gzipped, palette PNG for display
        with gzip.open(out_dir / f"{stem}.u8.gz", "wb", compresslevel=9) as f:
            f.write(encode_rain_u8(g, gp).tobytes())
        small.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(out_dir / f"{stem}.png", optimize=True)
        meta["grid"] = {"width": W // factor, "height": H // factor, "file": f"{stem}.u8.gz", "compression": "gzip",
                        "encoding": "uint8_log_phase",
                        "formula": "0 dry; 1..127 liquid, 128..254 frozen: mm/h = 10^(-1 + (code-base)/126 * log10(500)) "
                                   "with base 1 (liquid) or 128 (frozen); 255 no data",
                        "row0": "north (90N)", "col0": "180W", "aggregation": f"max of {factor}x{factor} source pixels",
                        "resolution_note": "log steps of about 5% (display image is palette-compressed; values come from the grid)"}
    else:         # latest frame: full-precision contract (unchanged)
        encode_rain(g).tofile(out_dir / f"{stem}.bin")
        gp.astype(np.uint8).tofile(out_dir / f"{stem}_phase.bin")
        small.save(out_dir / f"{stem}.png", optimize=True)
        meta["grid"] = {"width": W // factor, "height": H // factor, "encoding": "uint16_log",
                        "formula": "0 = dry; else mm/h = 10^((code-1)/20000 - 1); 65535 = no data",
                        "phase_file": f"{stem}_phase.bin", "phase_codes": {"0": "dry", "1": "liquid", "2": "frozen"},
                        "byte_order": "little", "row0": "north (90N)", "col0": "180W", "aggregation": f"max of {factor}x{factor} source pixels"}
    write_json(out_dir / f"{stem}.json", meta)
    return g, gp

def main():
    P = load_params()
    man = json.load(open(RAW / "manifest.json")) if (RAW / "manifest.json").exists() else {"products": {}}
    args = [a for a in sys.argv[1:] if not a.startswith("--time")]
    tflag = [a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--time=")]
    src = Path(args[0]) if args else PIPE / man["products"]["rain"]["local"]
    frame_time = tflag[0] if tflag else (man.get("products", {}).get("rain", {}).get("frame_time_utc") if not args else None)
    if frame_time is None:
        raise SystemExit("Frame time unknown: pass --time=YYYY-MM-DDTHH:MM:SSZ when converting a file by path.")
    rgb, alpha, rate, phase, d, unmatched, variant, shares = invert_rain(src, P)
    H, W = rate.shape
    vis = alpha > 0
    print(f"Frame {src.name}: {W}x{H}; transparent (dry) {(~vis).mean()*100:.1f}%; visible {vis.mean()*100:.1f}%")
    if shares: print(f"  colorbar RGB variant chosen: {variant}  (exact-match share: " + ", ".join(f"{k} {v*100:.1f}%" for k, v in shares.items()) + ")")
    print(f"  visible pixels matched within 3 RGB units: {(d[vis] <= 3).mean()*100:.1f}%; unmatched (> {P['rain']['max_colour_distance']}): {unmatched.sum()} px ({unmatched[vis].mean()*100:.2f}% of visible)")
    wet = rate > 0
    if wet.any():
        print(f"  rain mm/h: median {np.median(rate[wet]):.2f}, 99th pct {np.percentile(rate[wet], 99):.1f}, max {rate[wet].max():.1f}; liquid {(phase==1).sum()} px, frozen {(phase==2).sum()} px")
    np.save(WORK / "rain_fullres.npy", rate); np.save(WORK / "rain_phase_fullres.npy", phase)
    write_json(WORK / "rain_variant.json", {"variant": variant, "shares": shares})
    rgba = np.dstack([rgb, alpha]).astype(np.uint8)
    meta = {"product": "rain", "svs_id": P["rain"]["svs_id"], "svs_page": P["rain"]["svs_page"],
            "frame_time_utc": frame_time, "frame_time_meaning": "start of the 30-minute period",
            "source_file": src.name, "source_dataset": P["rain"]["source_dataset"], "units": "mm/h",
            "value_range": [P["rain"]["vmin"], P["rain"]["vmax"]], "scale": "log",
            "verified": P["rain"]["verified"], "credit": P["rain"]["credit"], "generated_utc": now_utc(),
            "colorbar_variant": variant}
    write_rain(rate, phase, rgba, P["rain"]["grid_factor"], PUBLIC / "latest", "rain", meta, P)
    if unmatched[vis].mean() > 0.01:
        print("  WARNING: more than 1% of visible pixels did not match the colorbars - paste this output before publishing.")
    print(f"Wrote public/data/latest/rain.bin, rain_phase.bin, rain.png, rain.json (frame time {frame_time})")

if __name__ == "__main__":
    main()