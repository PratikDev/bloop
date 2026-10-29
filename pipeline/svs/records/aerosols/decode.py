"""Decode the 5669 still into aerosol type and relative density (CIELAB, OpenCV 8-bit). Fixed before any model field was
read, from the still and its key alone:
  key     — the four swatches of Aerosols_cbar.png (saturated connected regions, left to right), each named by matching its
            hue to the colour words of the SVS text ("sea salt (blue), dust (pink/magenta), smoke … (orange/red), sulfates … (green)");
  floor   — the open ocean's own colour (OCEAN_BOX): its 99th-percentile chroma and lightness are the background ceiling;
  type    — a pixel above the chroma floor takes the key whose hue angle is nearest; a pixel below it but brighter than the
            ocean's ceiling and in the sea-salt hue sector is sea salt (the swirls are pale); everything else is none;
  density — relative: lightness above the ocean's median, 0–1 (no values in the key);
  georef  — the still is a 16:9 stretch of the world map. Aerosols hide much of the land, so the check is precision: the
            share of bare grey base-map pixels (chroma < BARE_C, lightness BARE_L) that fall on Natural Earth land, at the
            full-globe bounds and at bounds shifted by ±1° / ±2° (pass: ≥ 0.9 and the assumed bounds best).
Writes data_raw/5669/grid.npz (per 1° cell and type: share of pixels and mean density) and decode.json.
Usage (from pipeline/): python -m svs.records.aerosols.decode"""
import json, re
import cv2
import numpy as np
from PIL import Image
from core.log import say
from svs import frames, georef, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import BASE, GRID_DEG, KEY, SID, STILL, TYPES

ROOT = raw_dir(SID)
OCEAN_BOX = (-130, -30, -110, -15)                  # W, S, E, N: open South Pacific
BARE_C, BARE_L = 8.0, (15.0, 70.0)
WORD_HUE = {"blue": 220, "pink": 330, "magenta": 300, "orange": 30, "red": 0, "green": 120}   # CIELAB hue of the colour words
Image.MAX_IMAGE_PIXELS = None

def lab(rgb):
    x = cv2.cvtColor(np.ascontiguousarray(rgb), cv2.COLOR_RGB2LAB).astype(np.float32)
    L, a, b = x[..., 0] * 100 / 255, x[..., 1] - 128, x[..., 2] - 128
    return L, np.hypot(a, b), np.degrees(np.arctan2(b, a)) % 360

def hue_gap(h1, h2):
    d = np.abs(np.asarray(h1) - h2) % 360
    return np.minimum(d, 360 - d)

def key_colours():
    path = ROOT / "assets" / KEY
    Fetcher(ROOT / "manifest.jsonl").get(BASE + KEY, path, expect_bytes=10_000)
    k = frames.read_rgba(path); rgb = k[..., :3].astype(int)
    m = ((rgb.max(-1) - rgb.min(-1) > 20) & (k[..., 3] > 250)).astype(np.uint8)
    n, labels, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    big = sorted((st[i, 0], i) for i in range(1, n) if st[i, 4] > 0.2 * st[1:, 4].max())
    colours = [np.median(rgb[labels == i], 0).astype(np.uint8) for _, i in big]
    text = svs_api.fetch_record(SID)["full_text"]
    words = {name: re.search(rf"{re.escape(phrase)}[^(]*\(([a-z/]+)\)", text).group(1).split("/")
             for name, phrase in (("sea salt", "sea salt"), ("dust", "dust"), ("smoke", "smoke"), ("sulfate", "sulfates"))}
    out = {}
    for c in colours:
        _, _, h = lab(c[None, None])
        name = min(words, key=lambda t: min(hue_gap(h[0, 0], WORD_HUE[w]) for w in words[t]))
        out[name] = {"rgb": c.tolist(), "hue": float(h[0, 0]), "words": words[name]}
    if sorted(out) != sorted(TYPES): raise RuntimeError(f"key swatches did not map one-to-one onto the four types: {out}")
    return out

def box_px(box, W, H):
    w, s, e, n = box
    return slice(int((90 - n) / 180 * H), int((90 - s) / 180 * H)), slice(int((w + 180) / 360 * W), int((e + 180) / 360 * W))

def classify(rgb, keys):
    L, C, h = lab(rgb)
    H, W = L.shape
    ys, xs = box_px(OCEAN_BOX, W, H)
    floor = {"chroma_p99": float(np.percentile(C[ys, xs], 99)), "light_p99": float(np.percentile(L[ys, xs], 99)),
             "light_median": float(np.median(L[ys, xs]))}
    names = list(keys)
    gaps = np.stack([hue_gap(h, keys[t]["hue"]) for t in names])
    t = np.argmin(gaps, 0)
    coloured = C > floor["chroma_p99"]
    salt = names.index("sea salt")
    nearest_salt = np.argmin(np.stack([gaps[salt], *[gaps[i] for i in range(len(names)) if i != salt]]), 0) == 0
    pale_salt = ~coloured & (L > floor["light_p99"]) & nearest_salt
    cls = np.where(coloured, t, np.where(pale_salt, salt, -1)).astype(np.int8)
    density = np.clip((L - floor["light_median"]) / (100 - floor["light_median"]), 0, 1)
    return cls, density, floor, names

def georef_check(rgb):
    small = cv2.resize(rgb, (1920, 1080), interpolation=cv2.INTER_AREA)
    L, C, _ = lab(small)
    bare = georef.majority((C < BARE_C) & (L > BARE_L[0]) & (L < BARE_L[1]), 5)
    path, sha = georef.natural_earth_land()
    prec = lambda b: float((bare & georef.rasterise_land(1920, 1080, b, path)).sum() / max(bare.sum(), 1))
    shifted = {f"{ax}{d:+g}": prec((-180 + d, -90, 180 + d, 90) if ax == "lon" else (-180, -90 + d, 180, 90 + d))
               for ax in ("lon", "lat") for d in (-2, -1, 1, 2)}
    p0 = prec((-180, -90, 180, 90))
    return {"bounds": [-180, -90, 180, 90], "precision": p0, "shifted": shifted, "bare_share": float(bare.mean()),
            "best_is_assumed": p0 >= max(shifted.values()), "pass": bool(p0 >= 0.9 and p0 >= max(shifted.values())),
            "reference": "Natural Earth 1:50m land", "reference_sha256": sha}

def main():
    keys = key_colours()
    path = ROOT / "assets" / STILL
    entry = Fetcher(ROOT / "manifest.jsonl").get(BASE + STILL, path, expect_bytes=20_000_000)
    rgb = np.asarray(Image.open(path).convert("RGB"))
    cls, density, floor, names = classify(rgb, keys)
    geo = georef_check(rgb)
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    out = {}
    for i, t in enumerate(names):
        m = cls == i
        share = cv2.resize(m.astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
        dens = cv2.resize(np.where(m, density, 0).astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
        out[f"{t}_share"], out[f"{t}_density"] = share, np.where(share > 0, dens / np.maximum(share, 1e-9), np.nan)
    np.savez_compressed(ROOT / "grid.npz", **{k.replace(" ", "_"): v for k, v in out.items()}, grid_deg=GRID_DEG)
    (ROOT / "stills").mkdir(exist_ok=True)
    pal = np.array([keys[t]["rgb"] for t in names] + [[30, 30, 30]], np.uint8)
    dec = pal[np.where(cls < 0, len(names), cls)]
    row = np.concatenate([rgb, dec, np.repeat((density * 255).astype(np.uint8)[..., None], 3, -1)], 1)
    Image.fromarray(row).resize((row.shape[1] // 4, row.shape[0] // 4), Image.LANCZOS).save(ROOT / "stills" / "5669_frame_decoded_density.png")
    meta = {"still": entry, "size": list(rgb.shape[:2][::-1]), "keys": keys, "floor": floor, "georef": geo,
            "shares": {t: float((cls == i).mean()) for i, t in enumerate(names)}, "none_share": float((cls < 0).mean()), "order": names}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    say(f"5669: keys {[(t, k['rgb']) for t, k in keys.items()]}; floor {floor}; georef precision {geo['precision']:.3f} (pass {geo['pass']}); shares {meta['shares']}")

if __name__ == "__main__":
    main()
