"""latest/fwi_class.* + the FWI archive (SVS 5315), latest/fires.* (SVS 5113), context/firms.json `daily` (FIRMS NRT)."""
import gzip
import numpy as np
from common import PUBLIC
from core.grids import GRID_W, GRID_H
from .common import header_problems, info, load

def fwi(check):
    d = load("latest/fwi_class.json")
    if d is None: return
    g = np.fromfile(PUBLIC / "latest" / "fwi_class.bin", "u1")
    ok = g.size == GRID_W * GRID_H and not header_problems(d, "fwi_class") and len(d["classes"]) == 7 and g.max() <= 6
    check("latest/fwi_class.* (5315): grid, 7 codes, C5315 block", ok and d["verified"]["test"] == "C5315",
          f"{header_problems(d, 'fwi_class')}; size {g.size}; max code {g.max()}")
    idx = load("context/fwi_archive_index.json")
    if idx is not None:
        bad = [x["file"] for x in idx["days"] if len(gzip.decompress((PUBLIC / x["file"]).read_bytes())) != GRID_W * GRID_H]
        on_disk = sorted(p.name for p in (PUBLIC / "archive" / "fwi").glob("FWI_*.u8.gz"))
        listed = sorted(x["file"].split("/")[-1] for x in idx["days"])
        check("FWI archive: index = files on disk, each a full grid", not bad and on_disk == listed and not header_problems(idx, "fwi_archive"),
              f"bad {bad}; unlisted {sorted(set(on_disk) - set(listed))}; {len(listed)} days")
    info("5315 FWI (C5315)", f"decoded {d['verified']['decoded_share']:.0%} of coloured pixels (book 93%); Bangladesh codes "
         f"{d['bangladesh']['places']} (1 = very low; book: all 'very low')")

def fires_frame(check):
    d = load("latest/fires.json")
    if d is None: return
    check("latest/fires.* (5113): display only", not header_problems(d, "fires_frame") and d["values_read"] is False
          and (PUBLIC / "latest" / d["display"]["file"]).exists(), f"{header_problems(d, 'fires_frame')}")

def firms_daily(check):
    f = load("context/firms.json")
    if f is None or "daily" not in f:
        print("[WARN] optional context/firms.json daily block missing (optional)"); return
    d = f["daily"]; probs = header_problems(d, "firms_daily")
    for k, s in d["series"].items():
        n = len(s["days"])
        if not (len(s["counts"]) == len(s["frp_sum_MW"]) == n and s["days"] == sorted(s["days"]) and all(c >= 0 for c in s["counts"])):
            probs.append(f"{k} inconsistent")
        if "SNPP" in k:
            probs.append(f"{k} is S-NPP")
    check("context/firms.json daily: NOAA-20/21 + MODIS series consistent; cases untouched", not probs and "cases" in f, f"{probs}")
    last = {k: sum(s["counts"][-d["query_days"]:]) for k, s in d["series"].items() if k.startswith("Bangladesh")}
    info("FIRMS NRT (E12/K4)", f"Bangladesh, last {d['query_days']} days: {last} (book K4: 0 in the October off-season)")

def run(check):
    fwi(check); fires_frame(check); firms_daily(check)
