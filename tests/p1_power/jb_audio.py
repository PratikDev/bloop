# Small helper: render simple preview sounds to WAV (numpy + standard library only)
import wave, numpy as np
SR = 22050

def freq_map(v, lo, hi, f_lo=220.0, f_hi=880.0):
    """Build-guide mapping: linear in value, exponential in frequency."""
    t = np.clip((np.asarray(v, float) - lo) / (hi - lo), 0, 1)
    return f_lo * (f_hi / f_lo) ** t

def tone(freq, dur, amp=0.25):
    n = int(SR * dur); t = np.arange(n) / SR
    env = np.minimum(1, np.minimum(t / 0.01, (dur - t) / 0.02)).clip(0, 1)
    return amp * env * np.sin(2 * np.pi * freq * t)

def click(amp=0.5, dur=0.012):
    n = int(SR * dur); rng = np.random.default_rng(0)
    return amp * rng.uniform(-1, 1, n) * np.linspace(1, 0, n)

def silence(dur):
    return np.zeros(int(SR * dur))

def sequence(freqs, step=0.12, amps=None, clicks=None):
    """freqs: list (NaN = silence). clicks: list of 0..1 click strengths per step."""
    out = []
    for i, f in enumerate(freqs):
        seg = silence(step) if (f is None or np.isnan(f)) else tone(f, step, 0.25 if amps is None else amps[i])
        if clicks is not None and clicks[i] > 0:
            c = click(0.6 * float(clicks[i])); seg[:len(c)] += c
        out.append(seg)
    return np.concatenate(out) if out else silence(0.1)

def save(path, *parts):
    x = np.concatenate(parts); x = x / max(1e-9, np.abs(x).max()) * 0.8
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(f"Saved preview sound: {path} ({len(x)/SR:.1f} s)")
