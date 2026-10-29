"""Team decision A3: Farnebäck on 20 consecutive 3912 frames (no subsampling, 4.1 h apart) vs NASA OSCAR, with the boxes
and strong-current rule of validate.py (fixed before this test). Reported: the median angle of every consecutive-pair
flow, and of the summed displacement over the 19 pairs. If > 45°, frame motion is not a data claim: the currents voice
plays OSCAR and the frame flow stays only as labelled visual texture.
Usage (from pipeline/): python -m svs.records.currents.flow_test"""
import json
import cv2
import numpy as np
from core.log import say
from svs import acquire, choose, flow, frames, svs_api, validate as V
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.regrid import centres
from . import SID
from .decode import land_mask
from .validate import BOXES, STRONG, in_box

N = 20
OUT = raw_dir(SID, "consecutive")

def cell_mean_1deg(a, valid):
    s = cv2.resize(np.where(valid, a, 0).astype(np.float32), (360, 180), interpolation=cv2.INTER_AREA)
    f = cv2.resize(valid.astype(np.float32), (360, 180), interpolation=cv2.INTER_AREA)
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(f > 0, s / f, np.nan)

def main():
    files = acquire.layer_files(choose.choose(svs_api.fetch_record(SID))["frames"][0])
    acquire.fetch_full(Fetcher(raw_dir(SID) / "manifest.jsonl"), files, range(N), OUT, label="3912 consecutive")
    times = frames.times_from_list((raw_dir(SID) / "dates.txt").read_text(encoding="utf-8"))
    paths = [OUT / f["name"] for f in files[:N]]
    lat, lon = centres(1.0)
    pairs, total_u, total_v, hours = [], 0, 0, 0
    prev = frames.read_rgba(paths[0])[..., :3]; prev_ocean = ~land_mask(prev)
    for a, p in zip(files[:N - 1], paths[1:]):
        rgb = frames.read_rgba(p)[..., :3]; ocean = ~land_mask(rgb)
        t0, t1 = times[frames.frame_number(a["name"])], times[frames.frame_number(p.name)]
        dt_h = (t1 - t0).total_seconds() / 3600
        u, v = flow.to_velocity(flow.farneback(prev, rgb), dt_h)
        both = ocean & prev_ocean
        cu, cv_ = cell_mean_1deg(u, both), cell_mean_1deg(v, both)
        o = np.load(raw_dir(SID, "oscar_daily") / f"{t0:%Y%m%d}.npz")
        pairs.append((cu, cv_, o["u"], o["v"]))
        total_u = total_u + cu * dt_h; total_v = total_v + cv_ * dt_h; hours += dt_h
        prev, prev_ocean = rgb, ocean
    def angles(du, dv, ou, ov):
        sp = np.hypot(ou, ov)
        out = {}
        for b, box in BOXES.items():
            m = in_box(lat, lon, box) & (sp >= STRONG) & np.isfinite(du) & np.isfinite(dv)
            out[b] = V.angle_diff(flow.compass(du[m], dv[m]), flow.compass(ou[m], ov[m]))
        return out
    per_pair = {b: np.concatenate([angles(*p)[b] for p in pairs]) for b in BOXES}
    o_mean_u = np.nanmean([p[2] for p in pairs], 0); o_mean_v = np.nanmean([p[3] for p in pairs], 0)
    summed = angles(total_u / hours, total_v / hours, o_mean_u, o_mean_v)
    res = {"frames": N, "pairs": len(pairs), "hours_per_pair": hours / len(pairs), "first": str(times[frames.frame_number(files[0]["name"])]),
           "median_deg_per_pair": float(np.median(np.concatenate(list(per_pair.values())))),
           "median_deg_summed": float(np.median(np.concatenate(list(summed.values())))),
           "regions_per_pair": {b: float(np.median(a)) if len(a) else None for b, a in per_pair.items()},
           "regions_summed": {b: float(np.median(a)) if len(a) else None for b, a in summed.items()},
           "n_cells_per_pair": int(sum(len(a) for a in per_pair.values())), "threshold_deg": 45, "chance_deg": 90}
    (raw_dir(SID) / "flow_test.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    say(json.dumps(res, indent=1))
    for p in paths: p.unlink()
    return res

if __name__ == "__main__":
    main()
