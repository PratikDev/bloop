"""Mentor item 6: the rank correlation (Spearman's rho) and n behind each How we know card, from the pair files the
pipeline already ships. VALIDATION_TABLE.md has the median errors but no rho, so this step adds it, never typed.
Writes public/data/truth/stats.json. Run: cd pipeline && python -m stats.truth_stats"""
import json
from scipy import stats as st
from common import PUBLIC, now_utc, write_json

OUT = PUBLIC / "truth" / "stats.json"


def load(rel):
    return json.load(open(PUBLIC / rel, encoding="utf-8"))


def rho(xs, ys):
    r = st.spearmanr(xs, ys)
    return {"spearman_rho": round(float(r.statistic), 3), "p": float(r.pvalue), "n": len(xs)}


def main():
    sst, rain, globe = load("truth/sst_pairs.json"), load("truth/rain_pairs.json"), load("context/globe_duet.json")
    wet = [p for p in rain["pairs"] if p["kind"] == "rain"]
    out = {
        "title": "How we know: rank correlation of each check's pairs",
        "disclosure": "Spearman's rho between the value read from the frame (or the ground report) and the comparison source, "
                      "computed by the Bloop pipeline from the shipped pair files.",
        "sst": {"source": "truth/sst_pairs.json", "frame_time_utc": sst["frame_time_utc"],
                **rho([p["frame"] for p in sst["pairs"]], [p["file"] for p in sst["pairs"]])},
        "rain": {"source": "truth/rain_pairs.json", "frame_time_utc": rain["frame_time_utc"], "pairs_used": "both rain (kind = rain)",
                 **rho([p["frame"] for p in wet], [p["file"] for p in wet])},
        "globe": {"source": "context/globe_duet.json",
                  **rho([p["ground_pct"] for p in globe["pairs"]], [p["satellite_pct"] for p in globe["pairs"]])},
        "generated_utc": now_utc(),
    }
    write_json(OUT, out)
    for k in ("sst", "rain", "globe"):
        print(f"{k}: rho {out[k]['spearman_rho']} (n {out[k]['n']}, p {out[k]['p']:.2g})")
    print("Wrote public/data/truth/stats.json")


if __name__ == "__main__":
    main()
