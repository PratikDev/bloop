"""Onboarding, export: one related record 'rel_<id>' under the data contract, in public/data/related/ (≤ 25 MB each,
≤ 150 MB together), plus its registry row (pipeline/svs/cache/related_records.json: products/registry.py and the voices
read it, so a new item needs no code), validation rows, docs/related/<id>.md and the related index the app lists.
Usage: write(...) from svs/onboard/__main__.py."""
import datetime as dt, importlib, json
import numpy as np
from core.log import say
from .. import export, focus, validate as V
from ..config import CACHE, PUBLIC_RELATED, RELATED_BUDGET_BYTES, REPO, record_dir
from ..eic import MODEL_RX
from ..records import common
from . import HIDDEN, LIVE

REGISTRY = CACHE / "related_records.json"
DOCS = REPO / "docs" / "related"

def badge(rec):
    w = focus.words(rec) + " " + (rec.get("description") or "")
    return "reanalysis" if "reanalysis" in w.lower() or "MERRA" in w else ("model" if MODEL_RX.search(w) else "observation")

def register(row):
    rows = json.loads(REGISTRY.read_text(encoding="utf-8")) if REGISTRY.exists() else []
    rows = [r for r in rows if r["record"] != row["record"]] + [row]
    REGISTRY.write_text(json.dumps(sorted(rows, key=lambda r: r["record"]), indent=1, ensure_ascii=False), encoding="utf-8")
    import products.registry
    importlib.reload(products.registry)                         # the new row must be a product before provenance reads it

def write_index():
    rows = []
    for m in sorted(PUBLIC_RELATED.glob("rel_*/manifest.json")):
        d = json.loads(m.read_text(encoding="utf-8"))
        if not d.get("play"): continue
        rows.append({"record": d["record"], "title": d["app_title"], "svs_ids": d["svs_ids"], "badge": d["badge"], "period": d["period"]["label"],
                     "manifest": f"{d['record']}/manifest.json", "focus": d["focus"], "related_to": d["related_to"],
                     **({"hidden": HIDDEN[d["record"]]} if d["record"] in HIDDEN else {})})
    total = sum(p.stat().st_size for p in PUBLIC_RELATED.rglob("*") if p.is_file())
    if total > RELATED_BUDGET_BYTES: raise RuntimeError(f"public/data/related/ is {total:,} bytes > {RELATED_BUDGET_BYTES:,}")
    (PUBLIC_RELATED / "index.json").write_text(json.dumps({"records": rows}, indent=1, ensure_ascii=False), encoding="utf-8")
    return rows, total

def write(sid, rec, d):
    """d: the onboarding decisions and results (see __main__.run). Returns the manifest path."""
    record = f"rel_{sid}"
    rel = focus.official(rec)
    b = badge(rec)
    register({"record": record, "svs_id": sid, "title": rec["title"], "badge": b, "focus": focus.focus(rec),
              "related_to": [int(rel)] if rel else [], "status": d["status"],
              **({"cadence": "daily", "module": "svs.onboard.daily", "limit_days": LIVE[sid]} if sid in LIVE else {})})
    for p in record_dir(record).glob("*.u16.gz"): p.unlink()
    when = [t or dt.datetime.fromisoformat(rec["release_date"].replace("Z", "+00:00")).astimezone(dt.timezone.utc) for t in d["times"]]
    cube, cb = d["cube"], d["cb"]
    flat = d["georef"]["projection"].startswith("equirectangular")
    bounds = (-180, -90, 180, 90) if flat else (-180, -101.25, 180, 101.25)
    unit = d.get("unit") or ("relative (0–1)" if d["relative"] or cb is None else "colorbar units")
    lay = export.layer(record, "value", np.nan_to_num(cube, nan=np.nan), when, bounds, unit,
                       step=common.colorbar_step(cb.summary()) if cb is not None else 0.001,
                       label=f"{rec['title']} ({d['status']})", aggregation="mean of decoded pixels per cell",
                       time_labels=[t.strftime("%d %b %Y") if t else "undated" for t in d["times"]],
                       display=common.display(cb) if cb is not None else common.ramp_display(0, 1))
    if not flat: lay["grid"]["space"] = "frame"
    res = d["check"]
    checks = [V.check(record, "a_auto_source", f"{rec['title']}: decoded values vs {res['source']}", kind="value", source=res["source"],
                      threshold="Spearman ≥ 0.9 and median relative error ≤ 15 % → verified; ρ ≥ 0.9 → values with stated error; "
                                "ρ ≥ 0.6 → relative (provisional, onboarding defaults)",
                      passed=d["status"] == "verified", metrics={k: v for k, v in res.items() if k != "source"},
                      note=f"Rung: {res['rung']}. Onboarding run, {d['frames_used']} frames.")
              if res else V.check(record, "a_no_validation_source", f"{rec['title']}: no validation source", kind="none", passed=None,
                                  metrics={"reason": d["check_reason"]}, note=d["check_reason"])]
    (record_dir(record) / "validation.json").unlink(missing_ok=True)       # an onboarding run replaces the record's checks
    V.save(record, checks)
    lay.update(status=d["status"], status_check=checks[0]["id"],
               statement=None if d["status"] == "verified" else f"{d['status']}" + (f": ρ {res['spearman']:.2f} vs {res['source']}" if res else ""))
    times_ok = [t for t in d["times"] if t]
    period = (min(times_ok), max(times_ok)) if times_ok else (when[0], when[-1])
    man = {"record": record, "app_title": f"{rec['title']} ({b})", **common.provenance(record, [sid], b, period),
           "focus": focus.focus(rec), "related_to": [int(rel)] if rel else [],
           "frame_times": {"method": "date-list" if "date file" in d["times_how"] else ("ocr" if "OCR" in d["times_how"] else "linear"),
                           "approximate": any(w in d["times_how"] for w in ("linear", "undated", "estimated")), "count": len(d["times"]),
                           "source": d["times_how"]},
           "georef": {"projection": d["georef"]["projection"], "bounds": list(bounds), "pass_at": 0.9, "shifts_deg": [],
                      "iou": {"land": d["georef"].get("iou")} if d["georef"].get("iou") is not None else {}, "pass": bool(d["georef"].get("pass")),
                      "best_is_assumed": bool(d["georef"].get("best_is_assumed"))},
           "colorbar": cb.summary() if cb is not None else None, "colorbar_source": d["cb_source"], "asset": d["asset"], "twins": d["twins"],
           "decode": d["decode"], "layers": [lay], "voices": {"value": f"rel{sid}"},
           "play": [common.option("value", f"{rec['title']}: higher pitch = higher value", "value", [(f"rel{sid}", ["value"])],
                                  d["start"], 1)],
           "validation": common.validation_summary(checks), "size": {"choice": {"frames": d["frames_used"]}, "tried": []},
           "onboarding": {"timings_s": d["timings"], "status": d["status"]},
           "asset_checksums": common.checksums(record, d["manifest_file"])}
    if not times_ok:                                       # never show the release date as if it were the data's period
        man["period"]["label"] = f"undated (no frame dates found; SVS release {when[0]:%d %b %Y})"
    path = export.write_manifest(record, man)
    write_doc(sid, rec, man, checks)
    rows, total = write_index()
    say(f"{record}: {d['status']}; related index {len(rows)} records, {total / 1e6:.1f} MB")
    return path

def write_doc(sid, rec, man, checks):
    c = checks[0]
    L = [f"# SVS {sid}: {rec['title']}", "", "Generated by `pipeline/svs/onboard/` (`python -m svs.onboard {sid}`); do not edit by hand.", "",
         f"- Page: {rec['url']}", f"- Status: **{man['onboarding']['status']}**", f"- Badge: {man['badge']}; period {man['period']['label']}",
         f"- EIC focus area: {man['focus']}; beside official SVS {', '.join(map(str, man['related_to'])) or '—'}",
         f"- Credit: {man['credit_line']}", f"- Licence: {man['licence']}", "", "## How", "",
         f"- Asset: {man['asset']['kind']} from SVS {man['asset']['owner']} ({man['asset']['what']}); twins found: "
         + (", ".join(f"{t['id']} ({t['reason']})" for t in man["twins"]) or "none"),
         f"- Frame times: {man['frame_times']['source']}", f"- Georeference: {man['georef']['projection']}"
         + (f", land IoU {man['georef']['iou']['land']:.3f}" if man["georef"]["iou"] else ""),
         f"- Colorbar: {man['colorbar_source']}" + (f" (ticks {', '.join(t['text'] for t in man['colorbar']['ticks'])})" if man["colorbar"] else ""),
         f"- Decode: {man['decode']}", "", "## Validation", "", f"- {c['title']}: " + (
             f"Spearman {c['metrics']['spearman']:.2f}, median relative error {c['metrics']['median_rel_error']:.1%} ({c['metrics']['rung']})"
             if c["kind"] != "none" else c["metrics"]["reason"]), "",
         "## Onboarding times (s)", "", ", ".join(f"{k} {v:.0f}" for k, v in man["onboarding"]["timings_s"].items())]
    DOCS.mkdir(parents=True, exist_ok=True)
    (DOCS / f"{sid}.md").write_text("\n".join(L) + "\n", encoding="utf-8")
