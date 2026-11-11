"""T2, colormap invariance (the CV/ML gate's c6_colormap_invariance.py promoted to a test; docs/cvml/BUILD.md).

Real NASA MUR SST (the 3912 truth files, data_raw/3912/truth/mur/<date>.npz) in two boxes (src/lib/cv/boxes.json: Bay of
Bengal, Gulf Stream) is drawn with three colour maps over the same range and strip length: the 3912 SVS bar (read by the
pipeline's own colorbar.read), viridis and jet; each render is inverted by pipeline/svs/invert.py against its own bar.
Asserts, on the clean renders (CIELAB inversion):
  - value medians and value modes agree across the three maps within the record's measured error (sigma, the live SST
    median |error| in public/data/latest/sst.json), with the same number of modes;
  - the hue-bin control differs between the 3912 bar and viridis (a hue-based chord would change with the colours).
The JPEG q75 case is reported, not asserted (jet's dark low tail moves under compression, as the gate found).
Writes public/data/meta/colormap_invariance.json and the figures public/images/cvml/colormap_invariance_<box>.png that the
How we know card shows (its numbers are this file's). Needs data_raw (skipped without it).
Run: cd pipeline && python -m unittest tests.test_colormap_invariance   (BLOOP_DATA_RAW points at data_raw)"""
import json
import unittest
from pathlib import Path

import numpy as np

from svs.config import DATA_RAW, REPO

OUT_JSON = REPO / "public" / "data" / "meta" / "colormap_invariance.json"
OUT_FIG = REPO / "public" / "images" / "cvml"
BOXES = {b["id"]: b for b in json.loads((REPO / "src" / "lib" / "cv" / "boxes.json").read_text(encoding="utf8"))["boxes"]}
CASES = [("bayOfBengal", "20071118"), ("gulfStream", "20080213")]   # the gate's dates: unimodal and bimodal
UP = 4
MAX_DE = MAX_RGB = 10.0
HUE_DIFFERS_L1 = 1.0     # L1 between 12-bin hue histograms (0 same, 2 disjoint): "clearly different" (design choice)


def sigma_c():
    return float(json.loads((REPO / "public/data/latest/sst.json").read_text())["verified"]["value"])


def run_case(box_id, date, sigma):
    import cv2
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy import ndimage, signal
    from svs import colorbar, frames
    from svs.invert import Inverter

    box = BOXES[box_id]
    w, s, e, n = box["bounds"]
    z = np.load(DATA_RAW / "3912" / "truth" / "mur" / f"{date}.npz")["sst"]
    H, W = z.shape
    lat = 90 - (np.arange(H) + .5) * 180 / H
    lon = -180 + (np.arange(W) + .5) * 360 / W
    f = z[np.ix_(np.nonzero((lat >= s) & (lat <= n))[0], np.nonzero((lon >= w) & (lon <= e))[0])].astype(float)
    mask = np.isfinite(f)
    truth = ndimage.zoom(np.where(mask, f, np.nanmean(f)), UP, order=1)
    ocean = ndimage.zoom(mask.astype(np.uint8), UP, order=0).astype(bool)
    truth[~ocean] = np.nan

    cb_svs = colorbar.read(frames.read_rgba(DATA_RAW / "3912" / "sst_ecco2_cbar.png"), stated_range=(0.0, 32.0))
    nn = cb_svs.n
    t = np.linspace(0, 1, nn)
    like = lambda rgb: colorbar.Colorbar(rgb=rgb, alpha=np.ones(len(rgb)), geometry={"synthetic": True}, ticks=cb_svs.ticks, scale=cb_svs.scale, fit=dict(cb_svs.fit))
    cbs = {"3912 SVS bar": cb_svs, "viridis": like(255 * plt.get_cmap("viridis")(t)[:, :3]), "jet": like(255 * plt.get_cmap("jet")(t)[:, :3])}
    vlo, vhi = [float(v) for v in cb_svs.value_at(np.array([0.0, nn - 1.0]))]
    grid = np.linspace(vlo, vhi, 3201)

    def render(cb):
        pos = np.clip((truth - cb.fit["a"]) / cb.fit["b"], 0, nn - 1)
        rgb = np.stack([np.interp(np.nan_to_num(pos), np.arange(nn), cb.rgb[:, k]) for k in range(3)], -1)
        rgb[~np.isfinite(truth)] = 0
        return np.round(rgb).astype(np.uint8)

    def jpeg(rgb):
        _, buf = cv2.imencode(".jpg", rgb[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 75])
        return cv2.imdecode(buf, cv2.IMREAD_COLOR)[..., ::-1]

    def kde(v):
        v = v[np.isfinite(v)]
        h, ed = np.histogram(v, bins=len(grid) - 1, range=(vlo, vhi))
        return ndimage.gaussian_filter1d(h.astype(float), sigma / (ed[1] - ed[0])), (ed[:-1] + ed[1:]) / 2

    def modes(v):
        d, x = kde(v)
        p, _ = signal.find_peaks(d, prominence=0.05 * d.max())
        return sorted(round(float(x[i]), 3) for i in p[np.argsort(d[p])[::-1]][:2])

    def summary(v):
        vv = v[ocean]
        ok = np.isfinite(vv)
        p10, p50, p90 = np.percentile(vv[ok], [10, 50, 90])
        return {"median": round(float(p50), 3), "p10": round(float(p10), 3), "p90": round(float(p90), 3), "modes": modes(vv),
                "abs_err_median": round(float(np.nanmedian(np.abs(v - truth)[ocean])), 4)}

    def hue_hist(rgb):
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV_FULL)
        hue = hsv[..., 0].astype(float) * 360 / 256
        h, _ = np.histogram(hue[ocean & (hsv[..., 1] > 50)], bins=12, range=(0, 360))
        return h / max(h.sum(), 1)

    maps, inv, renders, hues = {}, {}, {}, {}
    for name, cb in cbs.items():
        img = render(cb)
        renders[name], hues[name] = img, hue_hist(img)
        entry = {}
        for variant, im in (("clean", img), ("jpeg75", jpeg(img))):
            v, *_ = Inverter(cb, mode="exact", method="lab-curve").invert(im, MAX_DE)
            entry[variant] = summary(v)
            if variant == "clean":
                inv[name] = v
        maps[name] = entry
    names = list(cbs)

    def spread(variant):
        meds = [maps[m][variant]["median"] for m in names]
        md = [maps[m][variant]["modes"] for m in names]
        same = len({len(x) for x in md}) == 1
        return {"median_spread_C": round(max(meds) - min(meds), 3), "p10_spread_C": round(max(maps[m][variant]["p10"] for m in names) - min(maps[m][variant]["p10"] for m in names), 3),
                "mode_counts": [len(x) for x in md], "mode_spread_C": [round(max(x[i] for x in md) - min(x[i] for x in md), 3) for i in range(len(md[0]))] if same else None}

    res = {"box": box_id, "region": box["name"], "bounds": box["bounds"], "date": f"{date[:4]}-{date[4:6]}-{date[6:]}", "pixels": int(ocean.sum()),
           "sigma_C": sigma, "truth": {"median": round(float(np.nanmedian(truth)), 3), "modes": modes(truth[ocean])},
           "maps": {m: {"median": maps[m]["clean"]["median"], "modes": maps[m]["clean"]["modes"], "abs_err_median": maps[m]["clean"]["abs_err_median"]} for m in names},
           "clean": spread("clean"), "jpeg75_reported": spread("jpeg75"),
           "hue_L1": {f"{a} vs {b}": round(float(np.abs(hues[a] - hues[b]).sum()), 3) for i, a in enumerate(names) for b in names[i + 1:]}}

    # Figure: the three renders, and each recovered density (dashed) over the MUR truth (grey).
    OUT_FIG.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(2, 3, figsize=(12.0, 6.4), dpi=100, gridspec_kw={"height_ratios": [1.15, 1]})
    dt, xt = kde(truth[ocean])
    for j, m in enumerate(names):
        a = ax[0, j]
        a.imshow(renders[m], extent=[w, e, s, n])
        a.set_title(m, fontsize=11)
        b = ax[1, j]
        dr, xr = kde(inv[m][ocean])
        b.plot(xt, dt / dt.max(), color="#8c959f", lw=4, label="MUR truth")
        b.plot(xr, dr / dt.max(), color="#2a6fdb", lw=1.6, ls=(0, (4, 2)), label="recovered values")
        b.set_xlim(np.nanpercentile(truth, 0.5) - 1, np.nanpercentile(truth, 99.5) + 1)
        b.set_yticks([])
        b.set_xlabel("°C")
        b.text(0.02, 0.97, f"median {maps[m]['clean']['median']:.2f} °C\nmodes {', '.join(f'{x:.2f}' for x in maps[m]['clean']['modes'])}", transform=b.transAxes, va="top", fontsize=8.5)
        if j == 0:
            b.legend(loc="center left", bbox_to_anchor=(0, 0.55), fontsize=8, frameon=False)
    fig.suptitle(f"Same sea temperatures, three colour maps: MUR SST, {box['name']}, {res['date']}", fontsize=12)
    fig.tight_layout()
    fig.savefig(OUT_FIG / f"colormap_invariance_{box_id}.png")
    plt.close(fig)
    res["figure"] = f"/images/cvml/colormap_invariance_{box_id}.png"
    return res


@unittest.skipUnless((DATA_RAW / "3912" / "truth" / "mur").is_dir(), "needs data_raw/3912/truth/mur")
class ColormapInvariance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sigma = sigma_c()
        cls.sigma = sigma
        cls.results = [run_case(b, d, sigma) for b, d in CASES]
        OUT_JSON.write_text(json.dumps({"generated_by": "pipeline/tests/test_colormap_invariance.py", "sigma_source": "public/data/latest/sst.json verified.value",
                                        "cases": cls.results}, indent=1) + "\n", encoding="utf8")
        for r in cls.results:
            print(f"\n{r['region']} {r['date']}: clean {r['clean']}, jpeg75 (reported) {r['jpeg75_reported']}, hue L1 {r['hue_L1']}")

    def test_value_modes_and_medians_agree_within_the_error(self):
        for r in self.results:
            c = r["clean"]
            self.assertLessEqual(c["median_spread_C"], self.sigma, r["region"])
            self.assertEqual(len(set(c["mode_counts"])), 1, r["region"])
            self.assertLessEqual(max(c["mode_spread_C"]), self.sigma, r["region"])

    def test_hue_control_differs_with_viridis(self):
        for r in self.results:
            self.assertGreaterEqual(r["hue_L1"]["3912 SVS bar vs viridis"], HUE_DIFFERS_L1, r["region"])


if __name__ == "__main__":
    unittest.main()
