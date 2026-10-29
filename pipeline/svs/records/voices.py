"""The official records' plain voices, written to public/mapping-official.json (merged into mapping.json's voices by
src/lib/audio/mapping.ts and validated there). Input ranges are code output: the first and last colorbar labels read by
OCR (air) or the decoded data's own 1st–99th percentile (current drift). Output sides are the book's rules (§5.4):
air = low-pass cutoff 8 kHz → 800 Hz, exponential, across the stated range ("hearing through haze"); rhythm slot =
clicks per second, linear. Scale: the colorbar's own (linear/log); a piecewise bar takes whichever of linear/log fits its
tick positions better (colorbar.fit["rejected"]).
Usage (from pipeline/): python -m svs.records.voices"""
import json
from svs.config import PUBLIC_OFFICIAL, REPO

OUT = REPO / "public" / "mapping-official.json"
CUTOFF = {"param": "cutoff", "unit": "Hz", "min": 800, "max": 8000, "scale": "exponential", "falling": True}
CLICKS = {"param": "clicksPerSecond", "unit": "clicks/s", "min": 1, "max": 12, "scale": "linear"}
AIR_NAMES = {"pm25": "PM2.5", "co": "Carbon monoxide", "nox": "Nitrogen oxides", "o3": "Ozone"}
VOICE_IDS = {"pm25": "airPm25", "co": "airCo", "nox": "airNox", "o3": "airO3"}

def input_scale(cb):
    if cb["scale"] in ("linear", "log"): return cb["scale"]
    rej = cb["fit"]["rejected"]
    return min(("linear", "log"), key=lambda k: rej[k]["max_resid_px"] if k in rej else float("inf"))

def air_voice(sp, cb, unit, record):
    lo, hi = cb["ticks"][0]["value"], cb["ticks"][-1]["value"]
    return {"id": VOICE_IDS[sp], "label": {"en": f"Air: {AIR_NAMES[sp]} (model)", "bn": f"TODO: {AIR_NAMES[sp]}"}, "group": "context",
            "source": {"dataset": "NASA GEOS-CF model (GMAO), via EIC frames SVS 5533 / 5518", "svsId": 5533, "product": record},
            "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": unit, "min": lo, "max": hi, "scale": input_scale(cb)}, "output": CUTOFF},
            "silence": "No value at this point (a drawn outline). Below the colorbar's range plays as its lowest value.",
            "sound": {"timbre": "Soft noise through a low-pass filter: more pollution, more muffled", "attackMs": 40, "releaseMs": 120,
                      "glideMs": 60, "maxGain": 0.2, "family": "model"},
            "pan": "longitude", "legend": [{"value": t["value"], "label": f"{t['text'].replace('^', 'e')} {unit}"} for t in cb["ticks"]],
            "designChoice": True, "note": "The book's air rule (§5.4), one voice per species; range = the SVS colorbar's own labels."}

def drift_voice(rng, record):
    return {"id": "currentDrift", "label": {"en": "Current pattern drift (model)", "bn": "TODO: current drift"}, "group": "context",
            "source": {"dataset": "ECCO2 model, via EIC frames SVS 3912 (optical flow of the drawn streaks)", "svsId": 3912, "product": record},
            "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "km/day", "min": 0, "max": round(rng[1], 1), "scale": "linear"}, "output": CLICKS},
            "silence": "Land, or nothing drawn to follow at this point.",
            "sound": {"timbre": "Plain click train", "attackMs": 1, "releaseMs": 20, "maxGain": 0.15, "family": "model"},
            "pan": "longitude", "legend": [],
            "designChoice": True, "note": "How fast the drawn eddies and meanders move, not the speed of the water; range = the record's 1st–99th percentile."}

def main():
    voices = []
    air = PUBLIC_OFFICIAL / "air_5533" / "manifest.json"
    if air.exists():
        m = json.loads(air.read_text(encoding="utf-8"))
        for sp, d in m["species"].items():
            voices.append(air_voice(sp, d["colorbar"], d["unit"], m["record"]))
    cur = PUBLIC_OFFICIAL / "currents_3912" / "manifest.json"
    if cur.exists():
        m = json.loads(cur.read_text(encoding="utf-8"))
        voices.append(drift_voice(m["drift_speed_range_km_day"], m["record"]))
    OUT.write_text(json.dumps({"generated_by": "pipeline/svs/records/voices.py", "voices": voices}, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")
    print(f"wrote {OUT.name}: {[v['id'] for v in voices]}")

if __name__ == "__main__":
    main()
