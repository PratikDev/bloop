"""Categorical colour layers (e.g. aerosol type by hue): each pixel goes to the nearest class centroid in CIELAB hue
(a*, b* direction), with chroma as the density proxy; low-chroma pixels are 'none'. Centroids come from the SVS colour
key or legend, never from the frame being segmented. A confusion check against hand-labelled pixels (≥ 200 per class,
saved as a fixture) reports per-class precision/recall."""
import json
import numpy as np
from . import colour

def centroids_from_key(named_rgb):
    """{'dust': (r, g, b), ...} → {'dust': hue angle (rad)} from the legend swatches."""
    return {k: float(np.arctan2(*colour.rgb_to_lab(np.array(v, float))[[2, 1]])) for k, v in named_rgb.items()}

def classify(rgb, hue_centroids, min_chroma=12.0):
    """(H, W, 3) → (class index map, −1 = none; chroma map). Class order = dict order of hue_centroids."""
    lab = colour.rgb_to_lab(rgb)
    hue = np.arctan2(lab[..., 2], lab[..., 1])
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    names = list(hue_centroids)
    d = np.stack([np.abs((hue - hue_centroids[n] + np.pi) % (2 * np.pi) - np.pi) for n in names])
    cls = d.argmin(0).astype(np.int16)
    cls[chroma < min_chroma] = -1
    return cls, chroma

def density(cls, chroma, n_classes):
    """Per-class density grids: chroma where the class is assigned, 0 elsewhere."""
    return np.stack([np.where(cls == k, chroma, 0.0) for k in range(n_classes)])

def confusion(cls, labels, names):
    """labels: [{'x', 'y', 'class'}] (hand-labelled fixture) → confusion matrix + per-class precision/recall."""
    idx = {n: i for i, n in enumerate(names)}
    k = len(names)
    m = np.zeros((k + 1, k + 1), int)                    # last row/col = 'none'
    for l in labels:
        t = idx.get(l["class"], k); p = int(cls[l["y"], l["x"]]); p = k if p < 0 else p
        m[t, p] += 1
    prec = {n: float(m[i, i] / max(1, m[:, i].sum())) for n, i in idx.items()}
    rec = {n: float(m[i, i] / max(1, m[i, :].sum())) for n, i in idx.items()}
    return {"matrix": m.tolist(), "labels": names + ["none"], "precision": prec, "recall": rec,
            "n_per_class": {n: int(m[i].sum()) for n, i in idx.items()}}

def load_fixture(path):
    return json.loads(open(path, encoding="utf-8").read())
