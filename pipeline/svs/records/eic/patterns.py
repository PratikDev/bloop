"""EIC class-B items as one 'pattern, not values' record (patterns_eic): every class-B item of the inventory that no other
record or Bloop product covers. Per item: its SVS preview still (the smallest image ≥ 1000 px wide, else the largest),
read as brightness (the brightest channel, 0–1) on a picture grid PATTERN_W wide; no colorbar values, no georeference.
One layer and one play option per item; one shared voice (brightness → pitch). Validation: none possible (stated per item).
Usage (from pipeline/): python -m svs.records.eic.patterns"""
import datetime as dt, json
import cv2
import numpy as np
from core.log import say
from svs import eic, frames, svs_api, validate as V
from svs.config import CACHE, PUBLIC_OFFICIAL, raw_dir
from svs.export import layer as export_layer, write_manifest
from svs.fetch import Fetcher
from svs.records import common
from svs.validate import _clean

RECORD = "patterns_eic"
PATTERN_W = 256

def still_of(rec):
    imgs = [m for m in rec["media"] if m["media_type"] == "Image" and m["width"] and m["url"].lower().endswith((".png", ".jpg", ".jpeg", ".tif"))]
    big = sorted([m for m in imgs if m["width"] >= 1000], key=lambda m: m["width"])
    return (big or sorted(imgs, key=lambda m: -m["width"]))[0] if imgs else None

def main():
    inv = json.loads((CACHE / "eic_inventory.json").read_text(encoding="utf-8"))["items"]
    covered = {k for k, v in eic.records_built().items() if not v.startswith(RECORD)} | set(eic.decoded_by())   # not this record itself
    items = [r for r in inv if r["class"] == "B" and r["id"] not in covered]
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    layers, options, checks, ids, now = [], [], [], [], dt.datetime.now(dt.timezone.utc)
    for r in items:
        rec = svs_api.fetch_record(r["id"])
        m = still_of(rec)
        if m is None: continue
        root = raw_dir(r["id"])
        path = root / "assets" / m["url"].rsplit("/", 1)[1]
        try:
            Fetcher(root / "manifest.jsonl", tries=20).get(m["url"], path, expect_bytes=5_000_000)
        except RuntimeError as e:
            say(f"pattern {r['id']}: {e}"); continue
        k = frames.read_rgba(path)[..., :3].max(-1).astype(np.float32) / 255
        H, W = k.shape
        h = max(8, int(round(PATTERN_W * H / W)))
        grid = cv2.resize(k, (PATTERN_W, h), interpolation=cv2.INTER_AREA)
        half = 180 * h / PATTERN_W
        lid = f"svs{r['id']}"
        lay = export_layer(RECORD, lid, grid[None].astype(float), [now], (-180, -half, 180, half), "relative brightness (0–1)", step=0.002,
                           label=f"{r['title']} (pattern, not values)", aggregation=f"brightness of the SVS preview image, {PATTERN_W} cells across",
                           time_labels=["preview image"], svs_id=r["id"], image=m["url"], display=common.ramp_display(0, 1))
        lay["grid"]["space"] = "frame"
        lay.update(status="pattern only", statement="pattern, not values (no numeric key, no map position)", status_check=f"a_{r['id']}")
        layers.append(lay); ids.append(r["id"])
        options.append(common.option(lid, f"SVS {r['id']}: {r['title']}", lid, [("patternScan", [lid])], (0.0, 0.0), 1))
        checks.append(V.check(RECORD, f"a_{r['id']}", f"SVS {r['id']}: {r['title']}", kind="none", passed=None,
                              metrics={"reason": r["reason"], "image": m["url"]}, note="Pattern record: no validation source applies."))
        say(f"pattern {r['id']}: {W}×{H} → {PATTERN_W}×{h}")
    V.save(RECORD, checks)
    prov = common.provenance(RECORD, ids, "observation", (now, now))
    prov.update(svs_ids=ids, svs_pages=[f"https://svs.gsfc.nasa.gov/{i}/" for i in ids], title="EIC Content Database: pattern records (class B)",
                description=f"{len(ids)} EIC items whose pictures have no numeric key or no flat map: each is kept as the brightness pattern "
                            "of its SVS preview image, labelled 'pattern, not values'.")
    man = {"record": RECORD, "app_title": "EIC patterns (pattern, not values)", **prov,
           "frame_times": {"method": "linear", "approximate": True, "count": 1, "source": "preview images (no time)"},
           "georef": {"projection": "none (preview images)", "bounds": [-180, -101.25, 180, 101.25], "pass_at": 0.0, "shifts_deg": [], "iou": {},
                      "pass": False, "best_is_assumed": False},
           "layers": layers, "voices": {"brightness": "patternScan"}, "play": options,
           "validation": common.validation_summary(checks), "size": {"choice": {"width": PATTERN_W}, "tried": []},
           "asset_checksums": common.checksums(RECORD, *[raw_dir(i) / "manifest.jsonl" for i in ids if (raw_dir(i) / "manifest.jsonl").exists()])}
    write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
