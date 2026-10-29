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

AEROSOL_SOUND = {   # one instrument per type (timbre = category); the app has tone, haze and clicks, so smoke and sulfate are tones an octave apart
    "aerosolSeaSalt": ({"param": "cutoff", "unit": "Hz", "min": 800, "max": 8000, "scale": "exponential"}, "Soft noise, opening with more sea salt"),
    "aerosolDust": (CLICKS, "Dry clicks, faster with more dust"),
    "aerosolSmoke": ({"param": "frequency", "unit": "Hz", "min": 110, "max": 220, "scale": "exponential"}, "Low sine, higher with more smoke"),
    "aerosolSulfate": ({"param": "frequency", "unit": "Hz", "min": 440, "max": 880, "scale": "exponential"}, "High sine, higher with more sulfate"),
}

def aerosol_voices(m):
    out = []
    for layer, vid in m["voices"].items():
        l = next(x for x in m["layers"] if x["id"] == layer)
        output, timbre = AEROSOL_SOUND[vid]
        out.append({"id": vid, "label": {"en": l["label"], "bn": f"TODO: {layer}"}, "group": "context",
                    "source": {"dataset": "NASA GEOS-FP model, via EIC still SVS 5669 (type read from the key colours)", "svsId": 5669, "product": m["record"]},
                    "status": "context",
                    "mapping": {"kind": "continuous", "input": {"unit": "relative", "min": 0, "max": round(m["density_range"][layer], 4), "scale": "linear"},
                                "output": output},
                    "silence": f"No {layer.replace('_', ' ')} drawn in this cell.",
                    "sound": {"timbre": timbre, "attackMs": 20, "releaseMs": 80, "maxGain": 0.15, "family": "model"}, "pan": "longitude", "legend": [],
                    "designChoice": True, "note": "Relative density (the key has no values); range = the record's 99th percentile."})
    return out

def ocean2_voices(m):
    out = []
    for k, vid, output in (("temperature", "ocean2Temperature", TONE),
                           ("salinity", "ocean2Salinity", {"param": "cutoff", "unit": "Hz", "min": 800, "max": 8000, "scale": "exponential"})):
        lo, hi = m["ranges"][k]
        out.append({"id": vid, "label": {"en": f"Perpetual Ocean 2 {k} (model)", "bn": f"TODO: {k}"}, "group": "context",
                    "source": {"dataset": "ECCO model, via EIC frames SVS 5425", "svsId": 5425, "product": m["record"]}, "status": "context",
                    "mapping": {"kind": "continuous", "input": {"unit": "°C" if k == "temperature" else "PSU", "min": round(lo, 2), "max": round(hi, 2),
                                                                "scale": "linear"}, "output": output},
                    "silence": "Land, or no colour of the key at this point.",
                    "sound": {"timbre": "Warm sine" if k == "temperature" else "Soft filtered noise", "attackMs": 20, "releaseMs": 80, "maxGain": 0.15,
                              "family": "model"},
                    "pan": "longitude", "legend": [], "designChoice": True, "note": "Temperature → pitch; salinity on the second voice slot."})
    return out

def pattern_voice(m):
    return {"id": "patternScan", "label": {"en": "Picture brightness (pattern, not values)", "bn": "TODO: pattern"}, "group": "context",
            "source": {"dataset": "EIC preview images (class B)", "product": m["record"]}, "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "relative", "min": 0, "max": 1, "scale": "linear"}, "output": TONE},
            "silence": "A black part of the picture.",
            "sound": {"timbre": "Warm sine with a soft attack and a smooth glide", "attackMs": 20, "releaseMs": 80, "glideMs": 30, "maxGain": 0.15},
            "pan": "longitude", "legend": [], "designChoice": True, "note": "Brighter = higher. Pattern, not values."}

def river_voice(m):
    return {"id": "riverTransport", "label": {"en": "Atmospheric river transport (reanalysis, relative)", "bn": "TODO: river"}, "group": "context",
            "source": {"dataset": "NASA MERRA-2, via EIC frames SVS 4960", "svsId": 4960, "product": m["record"]}, "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "relative", "min": 0, "max": 1, "scale": "linear"}, "output": TONE},
            "silence": "No blue shading at this point.",
            "sound": {"timbre": "Warm sine with a soft attack and a smooth glide", "attackMs": 20, "releaseMs": 80, "glideMs": 30, "maxGain": 0.2,
                      "family": "model"},
            "pan": "longitude", "legend": [], "designChoice": True, "note": "Relative (no colorbar): the blue shading's strength."}

def eic_voice(m):
    l = m["layers"][0]; lo, hi = m["colorbar"]["value_range"]
    log = l.get("display", {}).get("scale") == "log" and lo > 0
    model = m["badge"] == "model"
    return {"id": m["voices"]["value"], "label": {"en": l["label"], "bn": f"TODO: {m['record']}"}, "group": "context",
            "source": {"dataset": f"EIC frame SVS {m['svs_ids'][0]}", "svsId": m["svs_ids"][0], "product": m["record"]}, "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": l["unit"], "min": lo, "max": hi, "scale": "log" if log else "linear"}, "output": TONE},
            "silence": "No value at this point (an overlay box or a colour off the key).",
            "sound": {"timbre": "Warm sine with a soft attack and a smooth glide", "attackMs": 20, "releaseMs": 80, "glideMs": 30, "maxGain": 0.2,
                      **({"family": "model"} if model else {})},
            "pan": "longitude", "legend": [], "designChoice": True, "note": "The book's pitch rule over the key's own range."}

def co2_voice(m):
    lo, hi = m["ppm_range"]
    return {"id": "co2Ppm", "label": {"en": "CO₂ nature run (model, relative)", "bn": "TODO: CO2"}, "group": "context",
            "source": {"dataset": "NASA GEOS–MITgcm DYAMOND nature run, via EIC frames SVS 5196 / 5436", "svsId": 5196, "product": m["record"]},
            "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "ppm", "min": round(lo), "max": round(hi), "scale": "linear"}, "output": TONE},
            "silence": "No CO2 drawn along this view (transparent there).",
            "sound": {"timbre": "Warm sine with a soft attack and a smooth glide", "attackMs": 20, "releaseMs": 80, "glideMs": 30, "maxGain": 0.2,
                      "family": "model"},
            "pan": "longitude", "legend": [], "designChoice": True,
            "note": "Model nature run; relative values. Range = the colorbar's invertible part (above its white end)."}

def forest_voice(m):
    lo, hi = m["colorbar"]["value_range"]
    return {"id": "forestHeight", "label": {"en": "Forest height (observation, pattern only)", "bn": "TODO: forest height"}, "group": "context",
            "source": {"dataset": "NASA GEDI, via EIC frames SVS 4950", "svsId": 4950, "product": m["record"]}, "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "m", "min": max(0, round(lo)), "max": round(hi), "scale": "linear"}, "output": TONE},
            "silence": "Ocean, space, or a pixel whose colour is not on the colorbar.",
            "sound": {"timbre": "Warm sine with a soft attack and a smooth glide", "attackMs": 20, "releaseMs": 80, "glideMs": 30, "maxGain": 0.2},
            "pan": "longitude", "legend": [], "designChoice": True,
            "note": "The book's pitch rule; range = the colorbar's own ends. Pattern only: values not verified."}

def lightning_voice(m):
    return {"id": "lightningClicks", "label": {"en": "Lightning flashes (observation)", "bn": "TODO: lightning"}, "group": "context",
            "source": {"dataset": "NASA ISS LIS, via EIC frames SVS 5011 (marks counted once each)", "svsId": 5011, "product": m["record"]},
            "status": "context",
            "mapping": {"kind": "continuous", "input": {"unit": "flashes per cell", "min": 0, "max": round(m["flash_range"][1]), "scale": "linear"},
                        "output": CLICKS},
            "silence": "No flash in this cell in this window.",
            "sound": {"timbre": "Plain click train", "attackMs": 1, "releaseMs": 20, "maxGain": 0.15}, "pan": "longitude", "legend": [],
            "designChoice": True, "note": "More flashes, faster clicks (the rhythm = counts slot); range = the record's 99th percentile."}

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
    ocean2 = PUBLIC_OFFICIAL / "ocean2_5425" / "manifest.json"
    if ocean2.exists(): voices += ocean2_voices(json.loads(ocean2.read_text(encoding="utf-8")))
    patterns = PUBLIC_OFFICIAL / "patterns_eic" / "manifest.json"
    if patterns.exists(): voices.append(pattern_voice(json.loads(patterns.read_text(encoding="utf-8"))))
    river = PUBLIC_OFFICIAL / "river_4960" / "manifest.json"
    if river.exists(): voices.append(river_voice(json.loads(river.read_text(encoding="utf-8"))))
    for eic in sorted(PUBLIC_OFFICIAL.glob("eic_*/manifest.json")): voices.append(eic_voice(json.loads(eic.read_text(encoding="utf-8"))))
    co2 = PUBLIC_OFFICIAL / "co2_5196" / "manifest.json"
    if co2.exists(): voices.append(co2_voice(json.loads(co2.read_text(encoding="utf-8"))))
    forest = PUBLIC_OFFICIAL / "forest_4950" / "manifest.json"
    if forest.exists(): voices.append(forest_voice(json.loads(forest.read_text(encoding="utf-8"))))
    aerosols = PUBLIC_OFFICIAL / "aerosols_5669" / "manifest.json"
    if aerosols.exists(): voices += aerosol_voices(json.loads(aerosols.read_text(encoding="utf-8")))
    lightning = PUBLIC_OFFICIAL / "lightning_5011" / "manifest.json"
    if lightning.exists(): voices.append(lightning_voice(json.loads(lightning.read_text(encoding="utf-8"))))
    lights = PUBLIC_OFFICIAL / "lights_5313" / "manifest.json"
    if lights.exists(): voices += lights_voices(json.loads(lights.read_text(encoding="utf-8")))
    OUT.write_text(json.dumps({"generated_by": "pipeline/svs/records/voices.py", "voices": voices}, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")
    print(f"wrote {OUT.name}: {[v['id'] for v in voices]}")

if __name__ == "__main__":
    main()
