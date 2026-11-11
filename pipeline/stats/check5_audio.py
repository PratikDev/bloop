"""Check 5, the audio chain's pitch accuracy (CV/ML build, piece D; docs/audio/MIX.md, docs/cvml/BUILD.md).

Reads the notes qa/e2e/cv/audio-check5.e2e.ts rendered in headless Chromium (OfflineAudioContext; data_raw/_tmp/cv/check5/)
and measures each note's pitch on its steady part: from STEADY_SEC after the note starts (the 30 ms glide is an
exponential approach, 3 time constants long; by 100 ms it is 10 time constants in) to the note's end, with a Hann window,
zero-padded FFT and parabolic interpolation of the log magnitude around the fundamental. Writes docs/audio/check5_results.json:
median, P95 and max |cents| per voice. A voice with a median over 5 cents fails (its cause must be found before mixing).

Run from the repo root, after the render: python pipeline/stats/check5_audio.py"""
import json
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "pipeline"))
from svs.config import DATA_RAW  # noqa: E402

SRC = REPO / "data_raw" / "_tmp" / "cv" / "check5"
OUT = REPO / "docs" / "audio" / "check5_results.json"
STEADY_SEC = 0.1
PAD = 1 << 20
MEDIAN_LIMIT = 5.0


def f0(x, fs, expected):
    """The fundamental near `expected` (within a semitone), by interpolated FFT peak."""
    w = x * np.hanning(len(x))
    mag = np.abs(np.fft.rfft(w, PAD))
    freqs = np.fft.rfftfreq(PAD, 1 / fs)
    lo, hi = np.searchsorted(freqs, [expected * 2 ** (-1 / 12), expected * 2 ** (1 / 12)])
    k = lo + int(np.argmax(mag[lo:hi]))
    a, b, c = np.log(mag[k - 1:k + 2] + 1e-30)
    p = 0.5 * (a - c) / (a - 2 * b + c)
    return (k + p) * fs / PAD


def main():
    src = SRC if SRC.is_dir() else DATA_RAW / "_tmp" / "cv" / "check5"
    meta = json.loads((src / "meta.json").read_text())
    fs, note = meta["fs"], meta["note_sec"]
    out = {"generated_by": "pipeline/stats/check5_audio.py", "render": "qa/e2e/cv/audio-check5.e2e.ts (headless Chromium, OfflineAudioContext)",
           "fs": fs, "note_sec": note, "steady_from_sec": STEADY_SEC, "median_limit_cents": MEDIAN_LIMIT, "voices": {}}
    for vid, v in meta["voices"].items():
        x = np.fromfile(src / f"{vid}.f32", "<f4").astype(float)
        cents = []
        for i, hz in enumerate(v["hz"]):
            a, b = int((i * note + STEADY_SEC) * fs), int((i + 1) * note * fs)
            cents.append(1200 * np.log2(f0(x[a:b], fs, hz) / hz))
        c = np.abs(np.array(cents))
        out["voices"][vid] = {"rule": v["rule"], "kind": v["kind"], "notes": len(c), "hz_range": [round(min(v["hz"]), 2), round(max(v["hz"]), 2)],
                              "median_cents": round(float(np.median(c)), 4), "p95_cents": round(float(np.percentile(c, 95)), 4),
                              "max_cents": round(float(c.max()), 4), "pass": bool(np.median(c) <= MEDIAN_LIMIT)}
        print(vid, out["voices"][vid])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1) + "\n", encoding="utf8")


if __name__ == "__main__":
    main()
