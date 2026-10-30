"""Method and limit sentences for docs/official/13786.md; every number is a slot filled from the record's files."""
import json, re
from svs.config import CACHE

METHOD = [
    "The page, verbatim: “{verbatim}”",
    "Asset: the 1920×1920 movie ({frames} frames at {fps} fps, {dur} s, AAC stereo), streamed through ffmpeg; the soundtrack is "
    "decoded to mono 22.05 kHz and deleted after analysis. No media is shipped.",
    "Sweep: the only moving thing is the white line, found as each frame minus the movie's median frame; the centre is the "
    "intersection of the fitted lines ({centre} px) and the line turns at {speed} °/s.",
    "Stars: local maxima of the median frame, classed by hue: {stars}.",
    "Three measurements of the SVS text's 'radius → pitch' mapping: (a) pYIN f0 vs the one coloured star the sweep crosses "
    "(planned; Spearman {rho_a}, n {n_a}); (b) the pitch of each note onset (constant-Q, new energy) vs the brightest coloured "
    "star crossed within ±2 frames (Spearman {rho_b}, n {n_b}); (c) the same onsets vs the star the movie circles as it plays "
    "(Spearman {rho_c}, n {n_c}).",
    "Timbre: spectral centroid at single-star crossings: red/orange stars {c_red} Hz, blue stars {c_blue} Hz (SVS: marimba and glockenspiel).",
    "Engine: a generic radial-sweep traversal (src/lib/audio-adapter/radial-sweep.ts, unit tests): centre, angular speed and "
    "radius → pitch (exponential or linear) or radius → time (a growing ring).",
]

LIMITS = [
    "Star size does not explain the pitch either (added 30 Oct, after the related-datasets report read 'radius' as size): "
    "Spearman of pitch with blob area {s_area}, with flux {s_flux} (single-star, onset and ring pairings). The page's own next "
    "words ('so stars farther from the center are higher pitched') mean distance from the centre, the reading tested first.",
    "The stated mapping is not recovered: none of the three measurements shows a relation between radius and pitch. The choir "
    "voices the whole line at once, so pitch trackers follow it, and the field is so dense that pairing a note with one star is "
    "ambiguous. The fitted lines are stored (mapping_fit.json) but none is supported.",
    "This item is method evidence, not Earth data; it has no map layer and is not in the Official tab's list.",
]

def slots(m, checks):
    a, b, c = (checks[k]["metrics"] for k in ("a_single_star_pairing", "b_onset_pairing", "c_ring_pairing"))
    f = lambda x: "n/a" if x is None else f"{x:.2f}"
    an = m["analysis"]
    d = checks["d_size_area_flux"]["metrics"]
    trio = lambda k: " / ".join(f(d[p][k]["spearman"]) for p in ("single_star", "onset", "ring"))
    text = json.loads((CACHE / "13786.json").read_text(encoding="utf-8"))["full_text"]
    verbatim = next(" ".join(s.split()) for s in re.split(r"(?<=[.!?])\s+", re.sub(r"<[^>]+>", " ", text)) if "radius of the stars" in s)
    return {"verbatim": verbatim, "s_area": trio("area"), "s_flux": trio("flux"), "frames": m["frame_times"]["count"], "fps": m["frame_times"]["source"].split()[0], "dur": f"{an['audio']['duration_s']:.0f}",
            "centre": ", ".join(f"{v:.0f}" for v in an["centre_px"]), "speed": f"{an['angular_speed_deg_s']:.1f}",
            "stars": ", ".join(f"{k} {v:,}" for k, v in an["stars"].items()),
            "rho_a": f(a["spearman"]), "n_a": a["n"], "rho_b": f(b["spearman_f0_radius"]), "n_b": b["paired"], "rho_c": f(c["spearman_f0_radius"]),
            "n_c": c["paired"], "c_red": f"{a['centroid_by_class']['red/orange']['median_centroid_hz']:.0f}",
            "c_blue": f"{a['centroid_by_class']['blue']['median_centroid_hz']:.0f}"}
