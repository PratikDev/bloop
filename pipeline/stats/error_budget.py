"""The cents error budget: for every pitch axis, semitones per unit of its value -> pitch rule, the record's measured
error, and cents = 100 x st/unit x error, flagged when over 100 cents (a pitch step smaller than that carries no meaning).
Writes public/data/meta/error_budget.json (read by the app's "What the jukebox read" panel and record details).

The rules come from public/mapping.json and public/mapping-official.json, with the same maths as the app's
semitonesPerUnit() (src/lib/audio/mapping-maths.ts): 12 x log2(max/min) / input span; a log input counts per decade.
Each error is read from the file named next to its axis (docs/official/VALIDATION_TABLE.md or the data file), never typed
here. Log axes turn a median relative error e into decades as log10(1 + e) (an assumption: the table gives no log-space
error). Sound terrain's zoomed axis is dynamic: the app computes its cents live from that day's span.

Run from the repo root: python pipeline/stats/error_budget.py   (first written for the CV/ML build, docs/cvml/BUILD.md)"""
import json
import math
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "public" / "data" / "meta" / "error_budget.json"
TABLE = REPO / "docs" / "official" / "VALIDATION_TABLE.md"
FLAG_CENTS = 100

# (axis id, what it is, rule file, voice id, records it describes, error source, error kind, dynamic zoom?)
# Error sources: ("table", record, check id, key) | ("json", file, [path]) | ("grace", box) | None (no validation source).
AXES = [
    ("sst_global", "Ocean temperature, whole ocean (live SVS 5101)", "app", "ocean", ["ocean"],
     ("json", "public/data/latest/sst.json", ["verified", "value"]), "median |error| vs NASA MUR"),
    ("sst_global_p90", "Ocean temperature, whole ocean, 90th percentile error", "app", "ocean", [],
     ("json", "public/data/latest/sst.json", ["verified", "p90_abs_error_C"]), "90th percentile |error| vs NASA MUR"),
    ("sst_3912", "Ocean temperature, ECCO2 (SVS 3912)", "app", "ocean", ["currents_3912"],
     ("table", "currents_3912", "a_sst_mur", "median_abs_C"), "median |model - MUR25|"),
    ("sst_terrain_zoom", "Ocean temperature, Sound terrain zoom (today's span)", "app", "ocean", ["terrain"],
     ("json", "public/data/latest/sst.json", ["verified", "value"]), "median |error| vs NASA MUR", True),
    ("sst_anomaly", "Ocean temperature against normal (live SVS 5176)", "app", "normalTone", ["normalTone"],
     ("json", "public/data/latest/sst_anom.json", ["verified", "median_abs_offset_C"]), "median |offset| vs NOAA Coral Reef Watch"),
    ("grace_bangladesh", "Water storage, Bangladesh box (GRACE)", "app", "water", ["water"],
     ("grace", "Bangladesh"), "median 1-sigma (JPL mascon)"),
    ("grace_nw_india", "Water storage, NW India box (GRACE)", "app", "water", [],
     ("grace", "NW_India"), "median 1-sigma (JPL mascon)"),
    ("gistemp_heat", "Heat anomaly (GISTEMP)", "app", "heat", ["heat"], None, "no uncertainty in the repo"),
    ("ndvi_vegetation", "Vegetation index (NDVI)", "app", "vegetation", ["vegetation"], None, "no validation source"),
    ("eic5147", "Near-surface temperature (SVS 5147)", "official", "eic5147", ["eic_5147"],
     ("table", "eic_5147", "a_same_model", "median_abs"), "median |error| vs GEOS-FP"),
    ("eic5148", "Near-surface wind speed (SVS 5148)", "official", "eic5148", ["eic_5148"],
     ("table", "eic_5148", "a_same_model", "median_abs"), "median |error| vs GEOS-FP"),
    ("eic5149", "Precipitation (SVS 5149)", "official", "eic5149", ["eic_5149"],
     ("table", "eic_5149", "a_same_model", "median_abs"), "median |error| vs GEOS-FP"),
    ("eic5150", "Near-surface humidity (SVS 5150)", "official", "eic5150", ["eic_5150"],
     ("table", "eic_5150", "a_same_model", "median_abs"), "median |error| vs GEOS-FP"),
    ("eic5151", "PM2.5 (SVS 5151, log axis)", "official", "eic5151", ["eic_5151"],
     ("table", "eic_5151", "a_same_model", "median_rel_error"), "median relative error vs GEOS-CF, as log10(1 + e) decades"),
    ("eic5152", "Ozone (SVS 5152)", "official", "eic5152", ["eic_5152"],
     ("table", "eic_5152", "a_same_model", "median_abs"), "median |error| vs GEOS-CF"),
    ("eic5153", "Carbon monoxide (SVS 5153)", "official", "eic5153", ["eic_5153"],
     ("table", "eic_5153", "a_same_model", "median_abs"), "median |error| vs GEOS-CF"),
    ("eic5154", "Nitrogen oxides (SVS 5154, log axis)", "official", "eic5154", ["eic_5154"],
     ("table", "eic_5154", "a_same_model", "median_rel_error"), "median relative error vs GEOS-CF, as log10(1 + e) decades"),
    ("ocean2_temperature", "Ocean temperature at depth (SVS 5425)", "official", "ocean2Temperature", ["ocean2_5425"],
     ("table", "ocean2_5425", "a_temperature_mur", "median_difference"), "|median difference| vs MUR (frames show depth)"),
    ("co2", "CO2 (SVS 5196)", "official", "co2Ppm", ["co2_5196"],
     ("table", "co2_5196", "a_synthetic_round_trip", "median_abs_ppm"), "synthetic round trip only (not vs observations)"),
    ("forest_height", "Forest height (SVS 4950)", "official", "forestHeight", ["forest_4950"],
     ("table", "forest_4950", "a_l2b_frame_cells", "median_diff_m"), "|median difference| vs GEDI L2B"),
]


def load_json(rel):
    return json.loads((REPO / rel).read_text(encoding="utf8"))


def table_rows():
    """VALIDATION_TABLE.md rows as {(record, check id): {key: number}} from the 'Key numbers' column."""
    rows = {}
    for line in TABLE.read_text(encoding="utf8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 7 or cells[0] in ("Record", "---"):
            continue
        check = cells[1].split(":", 1)[0].strip()
        nums = {}
        for part in cells[4].split(";"):
            m = re.fullmatch(r"\s*(\S+)\s+(-?[\d.]+(?:e-?\d+)?)\s*", part)
            if m:
                nums[m.group(1)] = float(m.group(2))
        rows[(cells[0], check)] = nums
    return rows


def read_error(src, rows):
    """(error value, source text); (None, reason) when there is no source."""
    if src is None:
        return None
    kind = src[0]
    if kind == "table":
        _, record, check, key = src
        return abs(rows[(record, check)][key]), f"docs/official/VALIDATION_TABLE.md {record} {check} {key}"
    if kind == "json":
        _, rel, path = src
        v = load_json(rel)
        for k in path:
            v = v[k]
        return abs(float(v)), f"{rel} {'.'.join(path)}"
    if kind == "grace":
        sig = load_json("public/data/context/grace.json")["boxes"][src[1]]["uncertainty_1sigma_cm"]["median"]
        return float(sig), f"public/data/context/grace.json boxes.{src[1]}.uncertainty_1sigma_cm.median"
    raise ValueError(kind)


def st_per_unit(rule):
    """Semitones per input unit (per decade on a log input): semitonesPerUnit() in mapping-maths.ts."""
    i, o = rule["input"], rule["output"]
    st = 12 * math.log2(o["max"] / o["min"])
    if i["scale"] == "log":
        return st / (math.log10(i["max"]) - math.log10(i["min"])), "decade"
    return st / (i["max"] - i["min"]), i["unit"]


def build():
    voices = {"app": {v["id"]: v for v in load_json("public/mapping.json")["voices"]},
              "official": {v["id"]: v for v in load_json("public/mapping-official.json")["voices"]}}
    rows = table_rows()
    axes = []
    for axis_id, label, src_file, voice, records, err_src, err_kind, *dyn in AXES:
        rule = voices[src_file][voice]["mapping"]
        assert rule["kind"] == "continuous" and rule["output"]["param"] == "frequency", axis_id
        per, unit = st_per_unit(rule)
        read = read_error(err_src, rows)
        dynamic = bool(dyn and dyn[0])
        entry = {"id": axis_id, "label": label, "voice": voice, "rule_file": f"public/mapping{'-official' if src_file == 'official' else ''}.json",
                 "records": records, "log": rule["input"]["scale"] == "log", "unit": unit, "dynamic": dynamic,
                 "st_per_unit": None if dynamic else round(per, 6), "error": None, "error_in_axis_units": None,
                 "error_kind": err_kind, "error_source": None, "cents": None, "flag": None}
        if read is not None:
            err, source = read
            e = math.log10(1 + err) if entry["log"] else err
            entry.update(error=round(err, 6), error_in_axis_units=round(e, 6), error_source=source)
            if not dynamic:
                cents = 100 * per * e
                entry.update(cents=round(cents, 2), flag=cents > FLAG_CENTS)
        axes.append(entry)
    return {"generated_by": "pipeline/stats/error_budget.py", "flag_cents": FLAG_CENTS,
            "formula": "cents = 100 x semitones per unit x measured error", "axes": axes}


def main():
    doc = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
    for a in doc["axes"]:
        print(f"{a['id']:20s} st/unit {a['st_per_unit']!s:10s} err {a['error']!s:9s} cents {a['cents']!s:8s} {'FLAG' if a['flag'] else ''}")


if __name__ == "__main__":
    main()
