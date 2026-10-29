"""Decode 5518's species layers. Per species, a rule picks the colour model on a probe frame (frame colours only):
  exact    — ≥ 90 % of pixels within MAX_DIST of the colorbar (PM2.5, CO);
  opacity  — otherwise, when the modal dark colour is a flat background and the opacity fit leaves p99 ≤ 10 (O3, NOx):
             svs/opacity.py, ramp learned from RAMP_FRAMES and frozen; background / under-ramp pixels = below range.
Outputs (data_raw/5518/work/): daily 0.5° means (+ below-range fraction) from the full 3-hourly frames; 1° grids at the
validation frames (k % VALID_EVERY == 0); the Bangladesh box at native resolution for every hourly frame; stills; and
decode.json with every calibration, ramp, georef and coverage number. Full frames are deleted once decoded.
Usage (from pipeline/): python -m svs.records.air.decode [--limit=N]"""
import json, sys
import cv2
import numpy as np
from PIL import Image
from core.log import say
from svs import choose, colorbar, frames, georef, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from svs.opacity import OpacityInverter
from . import ALT, FULL_EVERY, PERIOD, SID, SPECIES

ROOT = raw_dir(ALT)
WORK = raw_dir(ALT, "work")
MAX_DIST, OPACITY_DIST, EXACT_SHARE = 20.0, 10.0, 0.90
RAMP_FRAMES = list(range(0, 1801, 180))            # 11 full frames spread over the period
VALID_EVERY = 75                                   # 24 validation hours, cycling through all 3-hourly times of day
DAILY_DEG, VALID_DEG = 0.5, 1.0

def bars():
    choice = choose.choose(svs_api.fetch_record(SID), alternates=[svs_api.fetch_record(ALT)])
    f = Fetcher(ROOT / "manifest.jsonl")
    out = {}
    for fs in choice["frames"]:
        b = choice["colorbars"][fs["layer"]]
        path = raw_dir(ALT, "bars") / b["filename"]
        entry = f.get(b["url"], path, expect_bytes=50_000)
        out[SPECIES[fs["layer"]]] = (colorbar.read(frames.read_rgba(path)), entry, fs["layer"])
    return out

def full_path(sp, k):
    hits = sorted((ROOT / "full" / sp).glob(f"*_{k:04d}.png"))
    return hits[0] if hits else None

class Species:
    """The decoder chosen for one species, by rule, on a probe frame."""
    def __init__(self, sp, cb, probe_rgb):
        self.sp, self.cb = sp, cb
        u, cnt = np.unique(probe_rgb.reshape(-1, 3), axis=0, return_counts=True)
        _, res, _ = Inverter(cb, method=DEFAULT).project_colours(u)
        share = float(cnt[res <= MAX_DIST].sum() / cnt.sum())
        dark = u.max(1) < 60
        bg = u[dark][np.argmax(cnt[dark])] if dark.any() else None
        self.evidence = {"exact_share_within_max_dist": share, "modal_dark_colour": None if bg is None else bg.tolist()}
        if share >= EXACT_SHARE or bg is None:
            self.mode, self.inv = "exact", Inverter(cb, method=DEFAULT)
        else:
            self.mode, self.inv = "opacity", OpacityInverter(cb, bg)
            _, _, r, _ = self.inv.fit_colours(u)
            self.evidence["opacity_fit_p99"] = float(np.percentile(np.repeat(r, cnt), 99))
            if self.evidence["opacity_fit_p99"] > 10: raise RuntimeError(f"{sp}: neither exact nor opacity model fits: {self.evidence}")

    def learn(self, rgbs):
        if self.mode != "opacity": return None
        u, cnt = np.unique(np.concatenate([r.reshape(-1, 3) for r in rgbs]), axis=0, return_counts=True)
        return self.inv.learn_ramp(u, cnt)

    def decode(self, rgb):
        """→ values (NaN = no value), below-range mask, confidence residual."""
        if self.mode == "exact":
            v, _, res, _ = self.inv.invert(rgb, MAX_DIST)
            return v, np.zeros(v.shape, bool), res
        v, _, res, flag = self.inv.invert(rgb, OPACITY_DIST)
        return v, flag == 2, res

def cell_mean(v, deg):
    gw, gh = int(360 / deg), int(180 / deg)
    ok = np.isfinite(v)
    s = cv2.resize(np.where(ok, v, 0).astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    f = cv2.resize(ok.astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(f > 0, s / f, np.nan).astype(np.float32), f

def still(rgb, sp, dec, k):
    v, below, res = dec
    cbv = dec_colours(sp, v)
    conf = np.where(np.isfinite(v), np.clip(255 - res * 255 / MAX_DIST, 0, 255), np.where(below, 90, 0)).astype(np.uint8)
    row = np.concatenate([rgb, cbv, np.repeat(conf[..., None], 3, -1)], 1)
    raw_dir(ALT, "stills")
    Image.fromarray(row).resize((row.shape[1] // 2, row.shape[0] // 2), Image.LANCZOS).save(ROOT / "stills" / f"5518_{sp}_{k:04d}.png")

DECODERS = {}
def dec_colours(sp, v):
    """Decoded values drawn back with the colorbar's own colours (dark grey where there is no value)."""
    cb = DECODERS[sp].cb
    grid = np.arange(cb.n, dtype=float); vals = cb.value_at(grid)
    logv = np.all(vals > 0)
    xs, ys = (np.log10(vals), np.log10(np.where(v > 0, v, np.nan))) if logv else (vals, v)
    pos = np.interp(np.nan_to_num(ys, nan=xs[0]), xs, grid).astype(int)
    return np.where(np.isfinite(v)[..., None], cb.rgb[pos], 40).astype(np.uint8)

def main():
    limit = next((int(a.split("=")[1]) for a in sys.argv if a.startswith("--limit=")), None)
    keep = limit is not None
    cbs = bars()
    meta = {"species": {}, "georef": {}, "period": [t.isoformat() for t in PERIOD], "full_every_h": FULL_EVERY}
    n = 1801
    for sp, (cb, entry, layer) in cbs.items():
        probe = frames.read_rgba(full_path(sp, 0))[..., :3]
        DECODERS[sp] = Species(sp, cb, probe)
        ramp = DECODERS[sp].learn([frames.read_rgba(full_path(sp, k))[..., :3] for k in RAMP_FRAMES if full_path(sp, k)])
        meta["species"][sp] = {"layer": layer, "colorbar": cb.summary(), "colorbar_file": entry, "mode": DECODERS[sp].mode,
                               "evidence": DECODERS[sp].evidence, "ramp": ramp, "matcher": DEFAULT}
        say(f"{sp}: {cb.scale} colorbar {[t['text'] for t in cb.ticks]}; mode {DECODERS[sp].mode}; evidence {DECODERS[sp].evidence}")
    with open(WORK / "decoders.pkl", "wb") as fh:                 # frozen decoders (incl. learned ramps) for the hourly box pass
        __import__("pickle").dump(DECODERS, fh)
    for k in (0, 900):
        outlines = np.logical_or.reduce([georef.outline_mask(frames.read_rgba(full_path(sp, k))[..., :3]) for sp in cbs])
        g = georef.verify(georef.ocean_fill(outlines, georef.WATER_SEEDS, grow=0))
        g["grow1_iou"] = georef.iou(georef.ocean_fill(outlines, georef.WATER_SEEDS, grow=1), georef.rasterise_land(2048, 1024))
        meta["georef"][k] = g
        say(f"georef frame {k}: IoU {g['iou']:.4f} (grow 1: {g['grow1_iou']:.4f}); best at assumed bounds: {g['best_is_assumed']}")
    days = (PERIOD[1] - PERIOD[0]).days + 1
    gw, gh = int(360 / DAILY_DEG), int(180 / DAILY_DEG)
    acc = {sp: {"sum": np.zeros((days, gh, gw)), "n": np.zeros((days, gh, gw)), "below": np.zeros((days, gh, gw)), "frames": np.zeros(days)}
           for sp in cbs}
    valid, cover = {sp: {} for sp in cbs}, {sp: [] for sp in cbs}
    ks = [k for k in range(0, n, FULL_EVERY)][:limit]
    for i, k in enumerate(ks):
        day = k // 24
        for sp in cbs:
            p = full_path(sp, k)
            if p is None: continue
            rgb = frames.read_rgba(p)[..., :3]
            v, below, res = DECODERS[sp].decode(rgb)
            cover[sp].append((k, float(np.isfinite(v).mean()), float(below.mean())))
            m, f = cell_mean(v, DAILY_DEG)
            b, _ = cell_mean(below.astype(np.float32), DAILY_DEG)
            a = acc[sp]; ok = np.isfinite(m)
            a["sum"][day][ok] += m[ok]; a["n"][day][ok] += 1; a["below"][day] += np.nan_to_num(b); a["frames"][day] += 1
            if k % VALID_EVERY == 0:
                vm, vf = cell_mean(v, VALID_DEG)
                vb, _ = cell_mean(below.astype(np.float32), VALID_DEG)
                valid[sp][k] = (vm, vf, vb)
            if k in (0, 900): still(rgb, sp, (v, below, res), k)
            if not keep:
                (p.parent / f"{p.name}.done").touch(); p.unlink()
        if i % 40 == 0: say(f"5518 decode {i + 1}/{len(ks)} (frame {k}); coverage {[(sp, round(cover[sp][-1][1], 3)) for sp in cbs if cover[sp]]}")
    for sp in cbs:
        a = acc[sp]
        with np.errstate(invalid="ignore", divide="ignore"):
            daily = np.where(a["n"] > 0, a["sum"] / np.maximum(a["n"], 1), np.nan).astype(np.float32)
            below = (a["below"] / np.maximum(a["frames"][:, None, None], 1)).astype(np.float32)
        np.savez_compressed(WORK / f"daily_{sp}.npz", values=daily, below=below, frames_per_day=a["frames"], deg=DAILY_DEG)
        ks_v = sorted(valid[sp])
        np.savez_compressed(WORK / f"valid_{sp}.npz", k=np.array(ks_v), values=np.stack([valid[sp][k][0] for k in ks_v]),
                            frac=np.stack([valid[sp][k][1] for k in ks_v]), below=np.stack([valid[sp][k][2] for k in ks_v]), deg=VALID_DEG)
        cv_ = np.array([c[1] for c in cover[sp]]); bl = np.array([c[2] for c in cover[sp]])
        meta["species"][sp]["coverage"] = {"decoded_median": float(np.median(cv_)), "decoded_range": [float(cv_.min()), float(cv_.max())],
                                           "below_range_median": float(np.median(bl)), "frames": len(cv_)}
    (WORK / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    say("5518 full-frame decode finished")

if __name__ == "__main__":
    main()
