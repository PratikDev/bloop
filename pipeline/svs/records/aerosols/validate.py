"""Validate 5669 (fixed before the model file was read):
(a) per type, on 1° cells: Spearman of the frame's type density (share of pixels of that type × their mean relative
    density) and MERRA-2 extinction AOD of the matching species (sea salt SSEXTTAU, dust DUEXTTAU, sulfate SUEXTTAU,
    smoke BCEXTTAU + OCEXTTAU) at 19 Aug 2025 20:00 UTC. Provisional ≥ 0.6 per type. MERRA-2 is a different model in the
    same GEOS family (GEOS-FP's archive no longer holds the day), so this checks the type pattern, not values;
(b) dominant type per cell where the frame shows a type and MERRA-2's largest species share is clear: agreement;
(c) hand-label confusion check against pipeline/svs/fixtures/5669_labels.json: pending until ≥ 200 labels per class.
Added 30 Oct (report correction 8), same model first, fixed before the GEOS-FP files were read:
(a0) as (a), against GEOS-FP tavg3_2d_aer_Nx (the model the frames were made from) in the 3-hour window holding the frame;
(b0) as (b), against GEOS-FP;
(a3) 5572's label-free 2:1 frames (twin5572.py) against GEOS-FP at their own times, pooled per type.
Rungs of the independence ladder: GEOS-FP = same model; MERRA-2 = same family.
Usage (from pipeline/): python -m svs.records.aerosols.validate"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import validate as V
from svs.config import FIXTURES, raw_dir
from . import GRID_DEG, RECORD, SID, TYPES
from .geosfp import fields
from .truth import main as merra2

ROOT = raw_dir(SID)
SPECIES = {"sea salt": ("SSEXTTAU",), "dust": ("DUEXTTAU",), "sulfate": ("SUEXTTAU",), "smoke": ("BCEXTTAU", "OCEXTTAU")}
LABELS_NEEDED = 200
SOURCE = "MERRA-2 M2T1NXAER (GES DISC), hours 19 and 20 averaged; a different model in the GEOS family"
SOURCE_FP = "GEOS-FP tavg3_2d_aer_Nx (NCCS archive), the 18:00–21:00 UTC mean of 19 Aug 2025; the same model"
WHEN = dt.datetime(2025, 8, 19, 20, tzinfo=dt.timezone.utc)

def type_checks(g, model, ids, source, rung):
    """(a)-style per-type Spearman and (b)-style dominant-type agreement of the 5669 grid against one model's species."""
    per_type = {}
    for t in TYPES:
        rho, n = V.spearman(frame_density(g, t), model[t])
        per_type[t] = {"spearman": rho, "n_cells": n, "frame_cells_with_type": int((g[f"{t.replace(' ', '_')}_share"] > 0).sum())}
    stack_f = np.stack([frame_density(g, t) for t in TYPES]); stack_m = np.stack([model[t] for t in TYPES])
    share_m = stack_m / np.nansum(stack_m, 0)
    keep = (stack_f.max(0) > 0) & (np.nanmax(share_m, 0) >= 0.5) & np.isfinite(share_m).all(0)
    agree = float(np.mean(np.argmax(stack_f[:, keep], 0) == np.argmax(stack_m[:, keep], 0))) if keep.any() else None
    return [V.check(RECORD, ids[0], f"Aerosol type density per 1° cell vs {rung} species AOD (19 Aug 2025 20:00 UTC)",
                    kind="model-vs-obs", source=source, threshold="Spearman ≥ 0.6 per type (provisional)",
                    passed=all(np.isfinite(v["spearman"]) and v["spearman"] >= 0.6 for v in per_type.values()),
                    metrics={"per_type": per_type, "species": {t: "+".join(v) for t, v in SPECIES.items()}, "rung": rung},
                    note="No values in the key: a check of where each type is, not how much."),
            V.check(RECORD, ids[1], f"Dominant type per cell, frame vs {rung} (cells where one species is ≥ 50 % of AOD)",
                    kind="model-vs-obs", source=source, passed=None, metrics={"agreement": agree, "n_cells": int(keep.sum()), "chance": 1 / len(TYPES),
                                                                               "rung": rung})]

def to_cells(field, lat, lon, deg=GRID_DEG):
    """Mean of the model points inside each cell (row 0 = north, col 0 = 180° W)."""
    gh, gw = int(180 / deg), int(360 / deg)
    LA, LO = np.meshgrid(lat, ((lon + 180) % 360) - 180, indexing="ij")
    i = np.clip(((90 - LA) / deg).astype(int), 0, gh - 1); j = np.clip(((LO + 180) / deg).astype(int), 0, gw - 1)
    s, n = np.zeros((gh, gw)), np.zeros((gh, gw))
    ok = np.isfinite(field)
    np.add.at(s, (i[ok], j[ok]), field[ok]); np.add.at(n, (i[ok], j[ok]), 1)
    return np.where(n > 0, s / np.maximum(n, 1), np.nan)

def frame_density(g, t):
    k = t.replace(" ", "_")
    return g[f"{k}_share"] * np.nan_to_num(g[f"{k}_density"])

def labels_status():
    path = FIXTURES / "5669_labels.json"
    if not path.exists(): return {"labels": 0, "per_class": {}, "status": "pending labels"}
    lab = json.loads(path.read_text(encoding="utf-8"))["labels"]
    per = {c: sum(1 for l in lab if l["label"] == c) for c in (*TYPES, "none")}
    return {"labels": len(lab), "per_class": per, "status": "ready" if min(per.values()) >= LABELS_NEEDED else "pending labels"}

def main():
    g, m, fp = np.load(ROOT / "grid.npz"), merra2(), fields(WHEN)
    model = {t: to_cells(sum(m[v] for v in vs), m["lat"], m["lon"]) for t, vs in SPECIES.items()}
    same = type_checks(g, {t: to_cells(sum(fp[v] for v in vs), fp["lat"], fp["lon"]) for t, vs in SPECIES.items()},
                       ("a0_type_geosfp", "b0_dominant_type_geosfp"), SOURCE_FP, "GEOS-FP (same model)")
    per_type = {}
    for t in TYPES:
        f = frame_density(g, t)
        rho, n = V.spearman(f, model[t])
        per_type[t] = {"spearman": rho, "n_cells": n, "frame_cells_with_type": int((g[f"{t.replace(' ', '_')}_share"] > 0).sum())}
    stack_f = np.stack([frame_density(g, t) for t in TYPES]); stack_m = np.stack([model[t] for t in TYPES])
    shown = stack_f.max(0) > 0
    share_m = stack_m / np.nansum(stack_m, 0)
    clear = np.nanmax(share_m, 0) >= 0.5
    keep = shown & clear & np.isfinite(share_m).all(0)
    agree = float(np.mean(np.argmax(stack_f[:, keep], 0) == np.argmax(stack_m[:, keep], 0))) if keep.any() else None
    checks = [V.check(RECORD, "a_type_merra2", "Aerosol type density per 1° cell vs MERRA-2 species AOD (19 Aug 2025 20:00 UTC)",
                      kind="model-vs-obs", source=SOURCE, threshold="Spearman ≥ 0.6 per type (provisional)",
                      passed=all(np.isfinite(v["spearman"]) and v["spearman"] >= 0.6 for v in per_type.values()),
                      metrics={"per_type": per_type, "species": {t: "+".join(v) for t, v in SPECIES.items()}},
                      note="Same family, not the same model (MERRA-2 vs GEOS-FP); no values in the key: where each type is, not how much."),
              V.check(RECORD, "b_dominant_type_merra2", "Dominant type per cell, frame vs MERRA-2 (cells where one species is ≥ 50 % of AOD)",
                      kind="model-vs-obs", source=SOURCE, passed=None, metrics={"agreement": agree, "n_cells": int(keep.sum()), "chance": 1 / len(TYPES)}),
              V.check(RECORD, "c_hand_labels", "Hand-label confusion check (pixels labelled by a person, five classes)", kind="value",
                      source="pipeline/svs/fixtures/5669_labels.json", threshold=f"≥ {LABELS_NEEDED} labels per class before it runs", passed=None,
                      metrics=labels_status(), note="Pending labels: the labelling page is python -m svs.label_aerosols.")]
    tw = ROOT / "twin5572.json"
    if tw.exists():
        t5 = json.loads(tw.read_text(encoding="utf-8"))
        checks.append(V.check(RECORD, "a3_5572_type_geosfp", "5572 label-free 2:1 frames: type density vs GEOS-FP species AOD at each frame's time, pooled",
                              kind="model-vs-obs", source="GEOS-FP tavg3_2d_aer_Nx (NCCS archive); the same model", threshold="Spearman ≥ 0.6 per type (provisional)",
                              passed=all(v["spearman"] is not None and v["spearman"] >= 0.6 for v in t5["pooled"].values()),
                              metrics={"pooled": t5["pooled"], "frames": t5["frames"], "key_max_rgb_difference_vs_5669": t5["key_max_rgb_difference_vs_5669"],
                                       "rung": "GEOS-FP (same model)"}, note=t5["timing"]))
    checks = same + checks
    V.save(RECORD, checks)
    say(f"(a) {per_type}; (b) dominant agreement {agree} (n {int(keep.sum())}); (c) {checks[2]['metrics']}")

if __name__ == "__main__":
    main()
