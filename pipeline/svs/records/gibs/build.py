"""Build rel_gibs (see __init__.py). Per layer: its latest date in the capabilities (or the date asked for), the whole
globe at tile level 1 (0.28°), decoded exactly through the colormap XML, 0.5° cell means. Checks, fixed before running:
(a) per layer, decode exactness: the share of opaque pixels whose colour is a colormap entry (≥ 99 %, provisional);
(b) pipeline test: GIBS-decoded MUR SST against MUR25 read directly from PO.DAAC (OPeNDAP) on the same day, 1° cells
    (the source 3912 is validated with): Spearman and median difference (≥ 0.99 and ≤ 0.2 °C, provisional; the colormap
    steps by ~0.15 °C).
Usage (from pipeline/): python -m svs.records.gibs.build   (or python -m svs.onboard gibs:<Layer>[@YYYY-MM-DD])"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import export, gibs, validate as V
from svs.config import record_dir
from svs.onboard import record as rel
from svs.records import common
from . import GRID_DEG, PIPELINE_TEST, PRESET, RECORD

EXACT_MIN = 0.99
DHAKA = (23.8, 90.4)
CREDIT = "Imagery: NASA Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System."
DISCLOSURE = "Values read exactly from each layer's published colormap; one date per layer."

def display(cmap_url):
    cm = gibs.colormap(cmap_url)
    items = sorted(cm["values"].items(), key=lambda kv: kv[1])[:: max(1, len(cm["values"]) // 48)]
    return {"colours": ["#%02x%02x%02x" % rgb for rgb, _ in items], "values": [v for _, v in items], "scale": "linear"} if items else None

def layer_entry(layer, date=None):
    inf = gibs.info(layer)
    date = date or (inf["default_time"] or "")[:10]
    vals, meta = gibs.field(layer, date)
    grid = gibs.regrid(vals, GRID_DEG)
    when = dt.datetime.fromisoformat(date).replace(tzinfo=dt.timezone.utc)
    name, area = PRESET.get(layer, (inf["title"], "other"))
    lay = export.layer(RECORD, layer, grid[None].astype(float), [when], (-180, -90, 180, 90), meta["units"] or "index",
                       step=max(1e-4, float(np.nanmax(np.abs(grid))) / 30000) if np.isfinite(grid).any() else 0.001,
                       label=f"{name} — GIBS {layer}", aggregation=f"mean of exactly decoded 0.28° pixels per {GRID_DEG}° cell",
                       time_labels=[date], display=display(inf["colormap"]), gibs_layer=layer, focus=area)
    check = V.check(RECORD, f"a_exact_{layer}", f"{name}: colours matched to colormap entries", kind="value",
                    source=f"GIBS {layer} colormap XML", threshold=f"≥ {EXACT_MIN:.0%} of opaque pixels (provisional)",
                    passed=bool(meta["matched_share_of_opaque"] >= EXACT_MIN),
                    metrics={"matched_share_of_opaque": meta["matched_share_of_opaque"], "entries": meta["entries"], "kind": meta["kind"], "date": date})
    lay.update(status="verified" if meta["kind"] == "values" and check["pass"] else "pattern only", status_check=check["id"],
               statement=None if meta["kind"] == "values" else "classes, not values")
    return lay, check, start_near(grid, DHAKA)

def start_near(grid, at):
    """The decoded cell nearest `at` (lat, lon): the needle starts where the layer has a value, not on an empty cell."""
    yy, xx = np.nonzero(np.isfinite(grid))
    if not len(yy): return at
    lat, lon = 90 - (yy + 0.5) * GRID_DEG, -180 + (xx + 0.5) * GRID_DEG
    k = int(np.argmin(np.hypot(lat - at[0], (lon - at[1]) * np.cos(np.radians(at[0])))))
    return float(lat[k]), float(lon[k])

def pipeline_test(date):
    from svs.records.ocean2.twin5479 import surface                  # MUR25 straight from PO.DAAC, 1° cells
    vals, _ = gibs.field(PIPELINE_TEST, date)
    g = gibs.regrid(vals, 1.0)
    m = surface("temperature", dt.date.fromisoformat(date))
    rho, n = V.spearman(g, m)
    ok = np.isfinite(g) & np.isfinite(m)
    diff = float(np.median(g[ok] - m[ok]))
    return V.check(RECORD, "b_pipeline_mur", "Pipeline test: GIBS-decoded MUR SST vs MUR25 read directly (PO.DAAC OPeNDAP), same day, 1° cells",
                   kind="value", source="MUR25-JPL-L4-GLOB-v04.2 (C2036880657-POCLOUD)", threshold="Spearman ≥ 0.99 and |median difference| ≤ 0.2 °C (provisional)",
                   passed=bool(rho >= 0.99 and abs(diff) <= 0.2), metrics={"spearman": rho, "n": n, "median_diff_C": diff, "date": date},
                   note="GIBS draws MUR (0.01°) through a stepped colormap; MUR25 is the 0.25° product. Same mission family: a test of "
                        "the decoder, not of MUR.")

def build(layers):
    """(Re)write rel_gibs with the given {layer: date or None}."""
    entries, checks, skipped, starts = [], [], {}, {}
    for layer, date in layers.items():
        try:
            lay, c, starts[layer] = layer_entry(layer, date); entries.append(lay); checks.append(c)
            say(f"GIBS {layer} {lay['times'][0][:10]}: {c['metrics']['matched_share_of_opaque']:.4f} exact")
        except Exception as e:
            skipped[layer] = f"{e.__class__.__name__}: {str(e)[:120]}"; say(f"GIBS {layer}: skipped ({skipped[layer]})")
    mur = next((l for l in entries if l["id"] == PIPELINE_TEST), None)
    if mur: checks.append(pipeline_test(mur["times"][0][:10]))
    V.save(RECORD, checks)
    rel.register({"record": RECORD, "svs_id": 0, "title": "Any GIBS layer (Worldview), decoded from its colormap", "badge": "observation",
                  "focus": "other", "related_to": [], "status": "verified", "credit": CREDIT, "disclosure": DISCLOSURE})
    times = [dt.datetime.fromisoformat(l["times"][0].replace("Z", "+00:00")) for l in entries]
    man = {"record": RECORD, "app_title": "Any GIBS layer (Worldview, decoded exactly)", "svs_ids": [], "svs_pages": [],
           "title": "NASA GIBS layers embedded in the EIC dashboards", "description": "Worldview / GIBS raster layers decoded "
           "value-by-value from each layer's colormap XML.", "release_date": None,
           "period": {"start": min(times).strftime("%Y-%m-%dT%H:%M:%SZ"), "end": max(times).strftime("%Y-%m-%dT%H:%M:%SZ"),
                      "label": common.period_label(min(times), max(times))},
           "badge": "observation", "credits_by_role": {"Imagery": ["NASA GIBS / Worldview (EOSDIS)"]}, "datasets": [],
           "credit_line": CREDIT, "disclosure": DISCLOSURE,
           "licence": "NASA EOSDIS data: openly shared, without restriction (EOSDIS data policy); credit the source product.",
           "focus": "other", "related_to": [], "frame_times": {"method": "date-list", "approximate": False, "count": len(entries),
                                                                 "source": "the WMTS capabilities' default (latest) date per layer"},
           "georef": {"projection": "equirectangular (EPSG:4326 WMTS)", "bounds": [-180, -90, 180, 90], "pass_at": 1.0, "shifts_deg": [],
                      "iou": {}, "pass": True, "best_is_assumed": True},
           "layers": entries, "voices": {l["id"]: f"gibs_{i}" for i, l in enumerate(entries)}, "skipped": skipped,
           "play": [common.option(l["id"], l["label"].split(" — ")[0], l["id"], [(f"gibs_{i}", [l["id"]])], starts[l["id"]], 1)
                    for i, l in enumerate(entries)],
           "validation": common.validation_summary(checks), "size": {"choice": {"cell_deg": GRID_DEG}, "tried": []}}
    for p in record_dir(RECORD).glob("*.u16.gz"):
        if not any(p.name.startswith(l["id"] + "_") for l in entries): p.unlink()
    export.write_manifest(RECORD, man)
    rel.write_index()

def add_layer(layer, date=None):
    """Add or refresh one layer, keeping the others (the onboarding path for a GIBS layer)."""
    path = record_dir(RECORD) / "manifest.json"
    have = {l["id"]: l["times"][0][:10] for l in json.loads(path.read_text(encoding="utf-8"))["layers"]} if path.exists() else {}
    build({**have, layer: date})

def main():
    build({layer: None for layer in PRESET})

if __name__ == "__main__":
    main()
