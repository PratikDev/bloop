"""Probe 5425's camera path: every PROBE_EVERY-th frame of the dates layer (OCR) and of the land mask (land share and a
32×18 signature), streamed (fetch, read, delete). Writes data_raw/5425/probe.json.
Usage (from pipeline/): python -m svs.records.ocean2.probe"""
import json
import cv2
import numpy as np
from core.log import say
from svs import frames, ocr_dates, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import FRAMES, LAYERS, PROBE_EVERY, SID

def listing(layer):
    return sorted(svs_api.list_folder(FRAMES + LAYERS[layer] + "/")["files"], key=lambda f: frames.frame_number(f["name"]))

def main():
    fetch, out = Fetcher(raw_dir(SID) / "manifest.jsonl", tries=30), []
    dates, mask = listing("dates"), listing("land_mask")
    for i in range(0, len(dates), PROBE_EVERY):
        row = {"frame": frames.frame_number(dates[i]["name"])}
        p = raw_dir(SID, "probe") / dates[i]["name"]; fetch.get(dates[i]["url"], p, expect_bytes=1_000_000)
        r = ocr_dates.read_date(frames.read_rgba(p)[..., :3].max(-1).astype(np.float32) / 255); p.unlink()
        row.update(text=r["text"], date=r["datetime"].strftime("%Y-%m-%d") if r["datetime"] else None)
        p = raw_dir(SID, "probe") / mask[i]["name"]; fetch.get(mask[i]["url"], p, expect_bytes=5_000_000)
        m = frames.read_rgba(p)[..., :3].max(-1) > 127; p.unlink()
        row.update(land_share=float(m.mean()), signature=cv2.resize(m.astype(np.float32), (32, 18), interpolation=cv2.INTER_AREA).round(2).tolist())
        out.append(row)
        say(f"5425 probe {row['frame']}: {row['text']} land {row['land_share']:.2f}")
    (raw_dir(SID) / "probe.json").write_text(json.dumps(out), encoding="utf-8")

if __name__ == "__main__":
    main()
