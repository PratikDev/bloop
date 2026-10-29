"""SVS 13786 Data Sonification: Caldwell 73 (SYSTEM Sounds) — measured as method evidence, not Earth data. SVS text: "the
radius of the stars is mapped to pitch, so stars farther from the center are higher pitched … the entire image is
converted to the sound of a choir, while the orange and red stars are represented by a marimba, and the blue stars are
represented by a glockenspiel". Fixed before the pitch track was compared:
  sweep   — the only moving thing is the sweep line: frame minus the movie's median frame (every 10th frame), bright
            residual pixels fitted by a line per frame; the centre is the least-squares intersection of those lines and the
            angle is that of the residual pixels around it (unwrapped → angular speed);
  stars   — local maxima of the median frame's brightness (≥ STAR_MIN, 7 px apart); colour class by hue: red/orange
            (hue < 50° or ≥ 330°, saturation ≥ SAT_MIN), blue (180°–280°), else white;
  crossing— a coloured star is crossed in frame k when the sweep passes its angle between frames k−1 and k;
  audio   — the soundtrack (ffmpeg → mono 22.05 kHz, deleted after) through librosa pYIN (65–2093 Hz); per frame the median
            voiced f0 and the spectral centroid;
  mapping — for frames with exactly one coloured star crossed and voiced audio: Spearman of f0 vs the star's radius and a
            least-squares line of pitch (semitones re 440 Hz) on radius (fraction of the half-diagonal); the spectral centroid
            per colour class (marimba vs glockenspiel). Writes docs/official/13786.md (via doc.py) inputs: data_raw/13786/analysis.json
            and the fitted curve public/data/official/sonification_13786/mapping_fit.json.
Usage (from pipeline/): python -m svs.records.sonification.caldwell"""
import json, subprocess
import cv2
import numpy as np
from core.log import say
from svs import frames
from svs.config import raw_dir
from . import MOVIE, SID

ROOT = raw_dir(SID)
STAR_MIN, SAT_MIN, SR, RING_MIN = 120, 0.35, 22050, 60

def movie():
    return ROOT / "movie" / MOVIE.rsplit("/", 1)[1]

def sweep(path):
    info = frames.probe_movie(path)
    sample = np.stack([f.max(-1) for _, f in frames.movie_frames(path, every=10, size=(960, 960))]).astype(np.float32)
    med = np.median(sample, 0)
    lines, pix = [], []
    for n, f in frames.movie_frames(path, size=(960, 960)):
        d = f.min(-1).astype(np.float32) - med                       # the line is white: all channels up
        ys, xs = np.nonzero(d > 60)
        if len(xs) < 40: lines.append(None); pix.append(None); continue
        P = np.column_stack([xs, ys]).astype(float); c = P.mean(0)
        u = np.linalg.svd(P - c)[2][0]
        lines.append((c, u)); pix.append(P)
    A, b = [], []
    for L in lines:
        if L is None: continue
        c, u = L; nrm = np.array([-u[1], u[0]]); A.append(nrm); b.append(nrm @ c)
    centre = np.linalg.lstsq(np.array(A), np.array(b), rcond=None)[0]
    ang = np.array([np.nan if P is None else float(np.degrees(np.arctan2(*(P - centre).mean(0)[::-1]))) for P in pix])
    return med, centre, ang, info

def stars(path, centre, scale):
    sample = np.stack([f for _, f in frames.movie_frames(path, every=20)]).astype(np.float32)
    img = np.median(sample, 0)
    v = img.max(-1)
    peaks = (v == cv2.dilate(v, np.ones((7, 7), np.uint8))) & (v >= STAR_MIN)
    ys, xs = np.nonzero(peaks)
    hsv = cv2.cvtColor(img.astype(np.uint8)[None, ...][0], cv2.COLOR_RGB2HSV)
    h, s = hsv[ys, xs, 0].astype(float) * 2, hsv[ys, xs, 1] / 255
    cls = np.where(s < SAT_MIN, "white", np.where((h < 50) | (h >= 330), "red/orange", np.where((h >= 180) & (h < 280), "blue", "white")))
    c = centre * scale
    r = np.hypot(xs - c[0], ys - c[1]); a = np.degrees(np.arctan2(ys - c[1], xs - c[0]))
    rmax = np.hypot(*img.shape[:2]) / 2
    return {"x": xs, "y": ys, "r": r / rmax, "angle": a, "cls": cls, "brightness": v[ys, xs]}

def audio(path, fps, n_frames):
    import librosa
    ffmpeg = frames.ffmpeg_tools()[0]
    wav = ROOT / "audio.wav"
    subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(SR), str(wav)], check=True)
    y, sr = librosa.load(str(wav), sr=SR, mono=True)
    wav.unlink()
    hop = 512
    f0, voiced, _ = librosa.pyin(y, fmin=65.0, fmax=2093.0, sr=sr, hop_length=hop)
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    t = librosa.times_like(f0, sr=sr, hop_length=hop)
    per_f0, per_c = np.full(n_frames, np.nan), np.full(n_frames, np.nan)
    for k in range(n_frames):
        m = (t >= k / fps) & (t < (k + 1) / fps)
        vm = m & voiced & np.isfinite(f0)
        if vm.any(): per_f0[k] = float(np.median(f0[vm]))
        if m.any(): per_c[k] = float(np.median(cent[m]))
    return per_f0, per_c, {"duration_s": float(len(y) / sr), "voiced_share": float(np.mean(voiced))}

def onset_notes(path, fps):
    """Second analysis (added after the first gave no relation; reported as such): percussive onsets (librosa onset
    detection) and the pitch of the energy that appears at each one (constant-Q spectrum 0–120 ms after minus 120–0 ms
    before, peak bin, 36 bins per octave from C2)."""
    import librosa
    ffmpeg = frames.ffmpeg_tools()[0]
    wav = ROOT / "audio.wav"
    subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(SR), str(wav)], check=True)
    y, sr = librosa.load(str(wav), sr=SR, mono=True); wav.unlink()
    hop = 256
    on = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, backtrack=False, units="frames")
    C = np.abs(librosa.cqt(y, sr=sr, hop_length=hop, fmin=librosa.note_to_hz("C2"), n_bins=36 * 6, bins_per_octave=36))
    freqs = librosa.cqt_frequencies(36 * 6, fmin=librosa.note_to_hz("C2"), bins_per_octave=36)
    w = int(0.12 * sr / hop)
    notes = []
    for o in on:
        if o - w < 0 or o + w >= C.shape[1]: continue
        gain = C[:, o:o + w].mean(1) - C[:, o - w:o].mean(1)
        notes.append({"t": float(o * hop / sr), "f0": float(freqs[int(np.argmax(gain))]), "strength": float(gain.max())})
    return notes

def rings(path, med_rgb, centre_px, line_angle):
    """Third analysis: the movie circles each star as it plays. New coloured residual blobs away from the sweep line
    (frame − median > RING_MIN in saturation-weighted brightness, ≥ 12 px from the line, 30–3000 px area) appearing in a
    frame are the played stars: (frame, radius as a fraction of the half-diagonal, hue class)."""
    out, prev = [], None
    for k, f in frames.movie_frames(path):
        hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
        d = np.abs(f.astype(np.float32) - med_rgb).max(-1) * (hsv[..., 1] / 255)
        m = (d > RING_MIN).astype(np.uint8)
        if np.isfinite(line_angle[k]):
            a = np.radians(line_angle[k]); H, W = m.shape
            yy, xx = np.mgrid[0:H, 0:W]
            dist = np.abs(-(xx - centre_px[0]) * np.sin(a) + (yy - centre_px[1]) * np.cos(a))
            m[dist < 12] = 0
        n, lab, st, cen = cv2.connectedComponentsWithStats(m, connectivity=8)
        here = [(cen[i], i) for i in range(1, n) if 30 <= st[i, 4] <= 3000]
        for (cx, cy), i in here:
            if prev is not None and prev[int(cy), int(cx)]: continue
            hue = float(np.median(hsv[lab == i][:, 0]) * 2)
            cls = "red/orange" if (hue < 50 or hue >= 330) else "blue" if 180 <= hue < 280 else "other"
            out.append({"frame": int(k), "r": float(np.hypot(cx - centre_px[0], cy - centre_px[1]) / (np.hypot(*m.shape) / 2)), "cls": cls})
        prev = cv2.dilate(m, np.ones((9, 9), np.uint8)) > 0
    return out

def main():
    path = movie()
    med, centre, ang, info = sweep(path)
    scale = info["width"] / 960
    st = stars(path, centre, scale)
    unwrapped = np.degrees(np.unwrap(np.radians(np.nan_to_num(ang, nan=np.nanmean(ang)))))
    ok = np.isfinite(ang)
    speed = float(np.polyfit(np.arange(len(ang))[ok], unwrapped[ok], 1)[0]) * info["fps"]
    f0, cent, a_meta = audio(path, info["fps"], info["frames"])
    coloured = st["cls"] != "white"
    rows = []
    for k in range(1, len(ang)):
        if not (np.isfinite(ang[k]) and np.isfinite(ang[k - 1])): continue
        a0, a1 = ang[k - 1], ang[k]
        d = (a1 - a0 + 540) % 360 - 180
        rel = (st["angle"] - a0 + 540) % 360 - 180
        hit = (np.sign(rel) == np.sign(d)) & (np.abs(rel) <= abs(d)) & coloured
        if hit.sum() == 1 and np.isfinite(f0[k]):
            i = int(np.nonzero(hit)[0][0])
            rows.append({"frame": k, "r": float(st["r"][i]), "cls": str(st["cls"][i]), "f0": float(f0[k]), "centroid": float(cent[k])})
    r = np.array([x["r"] for x in rows]); f = np.array([x["f0"] for x in rows])
    from scipy import stats
    rho = float(stats.spearmanr(r, f).statistic) if len(r) >= 8 else None
    semis = 12 * np.log2(f / 440.0) if len(f) else f
    slope, icpt = (np.polyfit(r, semis, 1) if len(r) >= 3 else (None, None))
    by = {c: {"frames": int(sum(1 for x in rows if x["cls"] == c)),
              "median_centroid_hz": float(np.median([x["centroid"] for x in rows if x["cls"] == c])) if any(x["cls"] == c for x in rows) else None}
          for c in ("red/orange", "blue")}
    out = {"movie": info, "centre_px": (centre * scale).tolist(), "angular_speed_deg_s": speed, "stars": {c: int((st["cls"] == c).sum()) for c in ("red/orange", "blue", "white")},
           "audio": a_meta, "crossings_used": len(rows), "spearman_f0_radius": rho,
           "fit": {"semitones_re_A440_per_radius": None if slope is None else float(slope), "semitones_at_centre": None if icpt is None else float(icpt),
                   "radius_unit": "fraction of the frame's half-diagonal"},
           "centroid_by_class": by, "rows": rows}
    notes = onset_notes(path, info["fps"])
    pairs = []
    for nt in notes:
        k = int(round(nt["t"] * info["fps"]))
        best = None
        for kk in range(max(1, k - 2), min(len(ang), k + 3)):
            if not (np.isfinite(ang[kk]) and np.isfinite(ang[kk - 1])): continue
            d = (ang[kk] - ang[kk - 1] + 540) % 360 - 180
            rel = (st["angle"] - ang[kk - 1] + 540) % 360 - 180
            hit = np.nonzero((np.sign(rel) == np.sign(d)) & (np.abs(rel) <= abs(d)) & coloured)[0]
            for i in hit:
                if best is None or st["brightness"][i] > st["brightness"][best]: best = i
        if best is not None: pairs.append({"t": nt["t"], "f0": nt["f0"], "r": float(st["r"][best]), "cls": str(st["cls"][best])})
    pr, pf = np.array([x["r"] for x in pairs]), np.array([x["f0"] for x in pairs])
    out["onsets"] = {"notes": len(notes), "paired": len(pairs),
                     "spearman_f0_radius": float(stats.spearmanr(pr, pf).statistic) if len(pr) >= 8 else None,
                     "fit": dict(zip(("semitones_re_A440_per_radius", "semitones_at_centre"),
                                     map(float, np.polyfit(pr, 12 * np.log2(pf / 440.0), 1)))) if len(pr) >= 3 else None,
                     "by_class": {c: {"n": int(sum(1 for x in pairs if x["cls"] == c)),
                                      "spearman": (float(stats.spearmanr([x["r"] for x in pairs if x["cls"] == c], [x["f0"] for x in pairs if x["cls"] == c]).statistic)
                                                   if sum(1 for x in pairs if x["cls"] == c) >= 8 else None)} for c in ("red/orange", "blue")},
                     "pairs": pairs, "note": "Added after the planned single-star pairing showed no relation (the choir dominates pYIN)."}
    med_rgb = np.median(np.stack([f for _, f in frames.movie_frames(path, every=20)]).astype(np.float32), 0)
    angle_full = np.array([ang[k] for k in range(len(ang))])
    rg = rings(path, med_rgb, centre * scale, angle_full)
    onset_t = np.array([n["t"] for n in notes]); onset_f = np.array([n["f0"] for n in notes])
    rp = []
    for r_ in rg:
        if not len(onset_t): break
        j = int(np.argmin(np.abs(onset_t - r_["frame"] / info["fps"])))
        if abs(onset_t[j] - r_["frame"] / info["fps"]) <= 2 / info["fps"]: rp.append({**r_, "f0": float(onset_f[j])})
    rr, rf = np.array([x["r"] for x in rp]), np.array([x["f0"] for x in rp])
    out["rings"] = {"rings": len(rg), "paired": len(rp), "spearman_f0_radius": float(stats.spearmanr(rr, rf).statistic) if len(rr) >= 8 else None,
                    "fit": dict(zip(("semitones_re_A440_per_radius", "semitones_at_centre"), map(float, np.polyfit(rr, 12 * np.log2(rf / 440.0), 1))))
                           if len(rr) >= 3 else None,
                    "by_class": {c: int(sum(1 for x in rp if x["cls"] == c)) for c in ("red/orange", "blue", "other")}, "pairs": rp,
                    "note": "Added after the first two analyses: the movie circles each star as it plays; these are its own markers."}
    (ROOT / "analysis.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    say(f"13786: centre {out['centre_px']}, {speed:.1f}°/s; {len(rows)} single-star crossings; Spearman f0~radius {rho}; fit {out['fit']}; {by}; "
        f"rings {out['rings']['rings']}, paired {out['rings']['paired']}, Spearman {out['rings']['spearman_f0_radius']}, fit {out['rings']['fit']}, {out['rings']['by_class']}; "
        f"onsets {out['onsets']['notes']}, paired {out['onsets']['paired']}, Spearman {out['onsets']['spearman_f0_radius']}, fit {out['onsets']['fit']}, {out['onsets']['by_class']}")

if __name__ == "__main__":
    main()
