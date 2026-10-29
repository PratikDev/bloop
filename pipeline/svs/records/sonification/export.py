"""Export 13786 as method evidence: public/data/official/sonification_13786/ holds manifest.json (kind 'method': no layers,
so it is not listed in the Official tab), validation.json (the three measurements of the stated radius → pitch mapping)
and mapping_fit.json (the fitted curves, small). No media is shipped.
Usage (from pipeline/): python -m svs.records.sonification.export"""
import datetime as dt, json
from svs import svs_api, validate as V
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from svs.export import write_manifest
from . import RECORD, SID

ROOT = raw_dir(SID)

def main():
    a = json.loads((ROOT / "analysis.json").read_text(encoding="utf-8"))
    sources = "the movie's own frames and soundtrack (pYIN, onsets, constant-Q)"
    checks = [V.check(RECORD, "a_single_star_pairing", "Pitch (pYIN f0) vs radius of the one coloured star the sweep crosses (planned)",
                      kind="value", source=sources, passed=None,
                      metrics={"spearman": a["spearman_f0_radius"], "n": a["crossings_used"], **a["fit"], "centroid_by_class": a["centroid_by_class"]},
                      note="Planned measurement. The soundtrack is polyphonic (a choir for the whole line), which a single f0 cannot separate."),
              V.check(RECORD, "b_onset_pairing", "Pitch of each note onset vs the brightest coloured star crossed within ±2 frames",
                      kind="value", source=sources, passed=None,
                      metrics={k: a["onsets"][k] for k in ("notes", "paired", "spearman_f0_radius", "fit", "by_class")}, note=a["onsets"]["note"]),
              V.check(RECORD, "c_ring_pairing", "Pitch of each onset vs the radius of the star the movie circles as it plays",
                      kind="value", source=sources, passed=None,
                      metrics={k: a["rings"][k] for k in ("rings", "paired", "spearman_f0_radius", "fit", "by_class")}, note=a["rings"]["note"])]
    V.save(RECORD, checks)
    fit = {"source": "SVS 13786 Caldwell 73, measured by pipeline/svs/records/sonification/caldwell.py", "centre_px": a["centre_px"],
           "angular_speed_deg_s": a["angular_speed_deg_s"], "radius_unit": a["fit"]["radius_unit"],
           "curves": {"single_star_pYIN": a["fit"], "onset": a["onsets"]["fit"], "ring": a["rings"]["fit"]},
           "spearman": {"single_star_pYIN": a["spearman_f0_radius"], "onset": a["onsets"]["spearman_f0_radius"], "ring": a["rings"]["spearman_f0_radius"]},
           "verdict": "the stated radius → pitch mapping is not recovered by these measurements (no curve is supported)"}
    (PUBLIC_OFFICIAL / RECORD).mkdir(parents=True, exist_ok=True)
    (PUBLIC_OFFICIAL / RECORD / "mapping_fit.json").write_text(json.dumps(_clean(fit), indent=1), encoding="utf-8")
    t = dt.datetime.fromisoformat(svs_api.fetch_record(SID)["release_date"].replace("Z", "+00:00"))
    prov = common.provenance(RECORD, [SID], "observation", (t, t))
    man = {"record": RECORD, "kind": "method", "app_title": "Caldwell 73 sonification (method evidence)", **prov,
           "frame_times": {"method": "linear", "approximate": False, "count": a["movie"]["frames"], "source": f"{a['movie']['fps']:g} fps movie"},
           "georef": {"projection": "none (sky image)", "bounds": [0, 0, 0, 0], "pass_at": 0, "shifts_deg": [], "iou": {}, "pass": False, "best_is_assumed": False},
           "layers": [], "voices": {}, "play": [], "mapping_fit": "mapping_fit.json", "analysis": {k: a[k] for k in ("centre_px", "angular_speed_deg_s", "stars", "audio")},
           "validation": common.validation_summary(checks), "size": {"choice": {}, "tried": []},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
