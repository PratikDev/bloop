"""Test of the built-in date OCR on real frames (Part B, 29 Oct 2026): 20 frames spread evenly over SVS 4960's
date-only layer (1920×1080 EXR, white bold text on black). Reported: how many parse and every text read; a contact
sheet (crop + text read) is saved for the by-eye check. 'increasing' is reported but is not a test: the narrated movie
revisits times between scenes (frame 3263 shows an earlier date than 2342).
Writes data_raw/4960/ocr_check.json and data_raw/4960/stills/ocr_check_sheet.png; deletes the 20 frames.
Usage (from pipeline/): python -m svs.ocr_dates_check"""
import json
import numpy as np
from PIL import Image, ImageDraw
from core.log import say
from . import frames, ocr_dates, svs_api
from .config import raw_dir
from .fetch import Fetcher

SID = 4960
FOLDER = "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004960/frames/1920x1080_16x9_60p/atmos_river_DATE_ONLY_rfm23_2021-12-10_1233/"
N = 20

def ink_of(rgba):
    return rgba[..., :3].max(-1).astype(np.float32) / 255

def main():
    files = sorted(svs_api.list_folder(FOLDER)["files"], key=lambda f: frames.frame_number(f["name"]))
    pick = [files[int(round(i))] for i in np.linspace(0, len(files) - 1, N)]
    out_dir, fetch = raw_dir(SID, "ocr_check"), Fetcher(raw_dir(SID) / "manifest.jsonl")
    rows, crops = [], []
    for f in pick:
        p = out_dir / f["name"]
        fetch.get(f["url"], p)
        ink = ink_of(frames.read_rgba(p))
        r = ocr_dates.read_date(ink)
        rows.append({"frame": frames.frame_number(f["name"]), "text": r["text"], "distance": r["distance"],
                     "datetime": r["datetime"].strftime("%Y-%m-%dT%H:%MZ") if r["datetime"] else None})
        ys, xs = np.nonzero(ink > 0.5)
        crops.append((ink[ys.min() - 8:ys.max() + 8, xs.min() - 8:xs.max() + 8], r["text"]))
        p.unlink()
    ok = [r for r in rows if r["datetime"]]
    mins = np.array([np.datetime64(r["datetime"][:-1]).astype("datetime64[m]").astype(np.int64) for r in ok], float)
    res = {"frames": N, "parsed": len(ok), "increasing": bool(np.all(np.diff(mins) > 0)),
           "rows": rows, "engine": "glyph-date"}
    (raw_dir(SID) / "ocr_check.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    sheet = Image.new("L", (1400, 60 * N), 0); d = ImageDraw.Draw(sheet)
    for i, (c, text) in enumerate(crops):
        im = Image.fromarray((c * 255).astype(np.uint8)); im.thumbnail((900, 56))
        sheet.paste(im, (0, 60 * i + 2)); d.text((920, 60 * i + 20), f"{rows[i]['frame']}: {text}", fill=255)
    (raw_dir(SID, "stills")).mkdir(exist_ok=True)
    sheet.save(raw_dir(SID, "stills") / "ocr_check_sheet.png")
    say(f"date OCR: {len(ok)}/{N} parsed; increasing {res['increasing']}")
    return res

if __name__ == "__main__":
    main()
