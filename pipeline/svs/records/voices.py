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
OSCAR_PRODUCT = "oscar_3912"                     # products/registry.py: an observation product, so not the model timbre

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
    return {"id": "currentDrift", "label": {"en": "Drawn streak motion (visual texture, not water speed)", "bn": "TODO: current drift"}, "group": "context",
            "source": {"dataset": "ECCO2 model, via EIC frames SVS 3912 (optical flow of the drawn streaks)", "svsId": 3912, "product": record},
            "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "km/day", "min": 0, "max": round(rng[1], 1), "scale": "linear"}, "output": CLICKS},
            "silence": "Land, or nothing drawn to follow at this point.",
            "sound": {"timbre": "Plain click train", "attackMs": 1, "releaseMs": 20, "maxGain": 0.15, "family": "model"},
            "pan": "longitude", "legend": [],
            "designChoice": True, "note": "Pattern of the drawing, not water speed: how fast the drawn eddies and meanders move, not the speed of the water; range = the record's 1st–99th percentile."}

def oscar_voice(rng, src):
    return {"id": "oscarCurrent", "label": {"en": f"{src['label']} (observation)", "bn": "TODO: OSCAR currents"}, "group": "context",
            "source": {"dataset": f"{src['label']}, {src['period']}: {src['citation']['text']}", "svsId": 3912, "product": OSCAR_PRODUCT},
            "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "m/s", "min": 0, "max": round(rng[1], 2), "scale": "linear"}, "output": CLICKS},
            "silence": "Land, or no OSCAR current for this day.",
            "sound": {"timbre": "Plain click train", "attackMs": 1, "releaseMs": 20, "maxGain": 0.15},
            "pan": "longitude", "legend": [],
            "designChoice": True, "note": "Surface current speed from NASA OSCAR for the record's days (team decision A3: the frames' "
                                          "motion is not a data claim); range = the record's 1st–99th percentile."}

TONE = {"param": "frequency", "unit": "Hz", "min": 220, "max": 880, "scale": "exponential"}

def lights_voices(m):
    """Change: −1 … +1 → 220 … 880 Hz (no change = the middle, 440 Hz); brightness: 0 … its 99th percentile → the same tone."""
    src = {"dataset": "NASA Black Marble (S-NPP VIIRS), via EIC frames SVS 5313 / 5276 / 5475", "svsId": 5313, "product": m["record"]}
    base = {"group": "context", "source": src, "status": "context", "pan": "longitude", "designChoice": True,
            "sound": {"timbre": "Warm sine with a soft attack and a smooth glide", "attackMs": 20, "releaseMs": 80, "glideMs": 30, "maxGain": 0.2}}
    change = next(l for l in m["layers"] if l["id"] == "change")
    lo, hi = change["display"]["values"][0], change["display"]["values"][-1]
    return [{**base, "id": "lightsChange", "label": {"en": "Night lights change (relative)", "bn": "TODO: night lights change"},
             "mapping": {"kind": "continuous", "input": {"unit": "relative", "min": lo, "max": hi, "scale": "linear"}, "output": TONE},
             "silence": "No light at this point in either year, or too dim to read its colour.",
             "legend": [{"value": lo, "label": "lights out"}, {"value": (lo + hi) / 2, "label": "no change"}, {"value": hi, "label": "new lights"}],
             "note": "Higher = new lights, lower = lights out (the colorbar's words; no numbers)."},
            {**base, "id": "lightsBrightness", "label": {"en": "Night lights, annual (relative)", "bn": "TODO: night lights"},
             "mapping": {"kind": "continuous", "input": {"unit": "relative", "min": 0, "max": round(m["brightness_range"][1], 3), "scale": "linear"},
                         "output": TONE},
             "silence": "No light at this point this year.", "legend": [],
             "note": "The picture's own brightness (no colorbar), not radiance; range = the record's 99th percentile."}]

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
        if "oscarCurrent" in m.get("voice_sources", {}):
            voices.append(oscar_voice(m["oscar_speed_range_m_s"], m["voice_sources"]["oscarCurrent"]))
    lights = PUBLIC_OFFICIAL / "lights_5313" / "manifest.json"
    if lights.exists(): voices += lights_voices(json.loads(lights.read_text(encoding="utf-8")))
    OUT.write_text(json.dumps({"generated_by": "pipeline/svs/records/voices.py", "voices": voices}, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")
    print(f"wrote {OUT.name}: {[v['id'] for v in voices]}")

if __name__ == "__main__":
    main()
