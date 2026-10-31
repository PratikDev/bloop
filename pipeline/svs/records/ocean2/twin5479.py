"""5479 (Ocean Currents in equirectangular projection, for SOS): the same ECCO2 run as 5425 as 4096×2048 2:1 maps
(temperature/, salinity/, beauty/; 3,601 frames numbered on 5425's 19,001-frame sequence). Report correction 3, fixed
31 Oct before any comparison field was read:
  frames   — N_FRAMES files evenly spaced in the temperature list, the same frame numbers from salinity; the date is read
             from each frame's burned-in date box (bottom left) by the built-in date OCR;
  masks    — land and ice: Natural Earth land dilated by LAND_PAD px, and |lat| > POLAR; the label rows at the bottom;
             white flows (the page: 'flows above 600 meters deep are white'): min(R, G, B) ≥ WHITE_MIN; the dark ocean
             background: within BG_DIST of the frame's median ocean colour;
  colours  — 5425's own temperature (0–25 °C) and salinity (33–36 PSU) bars (5479 lists none): exact mode within MAX_DIST;
             the share of remaining flow pixels within MAX_DIST is the evidence that the bars are reused;
  grid     — 1° cell means of decoded pixels (≥ MIN_PX per cell);
  depth    — which water do the colours describe? Spearman and median difference against the surface (MUR25 SST, SMAP RSS
             8-day SSS, same day) and against NOAA WOA23 1991–2020 annual means at 600 m and 1000 m (independent
             observations, a climatology); the best-matching level is reported, not assumed.
Writes data_raw/5479/twin.json and data_raw/5479/grids.npz.
Usage (from pipeline/): python -m svs.records.ocean2.twin5479"""
import datetime as dt, json
import cv2
import netCDF4
import numpy as np
from core.log import say
from svs import colorbar, frames, georef, ocr_dates, svs_api, validate as V
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from . import COLORBARS
from .decode import frame_date
from .truth import SOURCES, dap, granule

TWIN = 5479
ROOT = raw_dir(TWIN)
FOLDER = "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005479/frames/4096x2048_2x1_30p/{layer}/"
N_FRAMES, LAND_PAD, POLAR, WHITE_MIN, BG_DIST, MAX_DIST, MIN_PX = 6, 3, 70.0, 200, 20.0, 12.0, 5
WOA = {"temperature": "https://www.ncei.noaa.gov/thredds-ocean/dodsC/woa23/DATA/temperature/netcdf/decav91C0/1.00/woa23_decav91C0_t00_01.nc",
       "salinity": "https://www.ncei.noaa.gov/thredds-ocean/dodsC/woa23/DATA/salinity/netcdf/decav91C0/1.00/woa23_decav91C0_s00_01.nc"}
SURFACE = {"temperature": "mur", "salinity": "smap"}

def woa(layer, depth):
    ds = netCDF4.Dataset(WOA[layer]); d = np.asarray(ds["depth"][:])
    a = np.ma.filled(ds[layer[0] + "_an"][0, int(np.argmin(np.abs(d - depth)))].astype(float), np.nan)
    return a[::-1]                                                  # WOA latitude ascends: row 0 = north, 1°, lon −180…180

def surface(layer, day):
    """The same day's surface field on 1° cells (row 0 = north, col 0 = 180° W)."""
    cid, var, offset = SOURCES[SURFACE[layer]]
    title = granule(cid, day)
    ds = dap(cid, title, "/lat;/lon"); lat, lon = np.asarray(ds["lat"][:]), np.asarray(ds["lon"][:])
    ds = dap(cid, title, f"/{var}")                                     # the whole field (MUR25: 1 × 720 × 1440)
    a = np.ma.filled(ds[var][:].astype(np.float64), np.nan).squeeze() + offset
    LA, LO = np.meshgrid(lat, (lon + 180) % 360 - 180, indexing="ij")
    i, j = np.clip((90 - LA).astype(int), 0, 179), np.clip((LO + 180).astype(int), 0, 359)
    s, n = np.zeros((180, 360)), np.zeros((180, 360)); ok = np.isfinite(a)
    np.add.at(s, (i[ok], j[ok]), a[ok]); np.add.at(n, (i[ok], j[ok]), 1)
    return np.where(n > 0, s / np.maximum(n, 1), np.nan)

def masks(rgb):
    H, W = rgb.shape[:2]
    land = cv2.dilate(georef.rasterise_land(W, H).astype(np.uint8), np.ones((2 * LAND_PAD + 1,) * 2, np.uint8)) > 0
    lat = 90 - (np.arange(H) + 0.5) * 180 / H
    land[np.abs(lat) > POLAR] = True
    land[int(0.965 * H):] = True                                     # the date and frame-number labels
    white = rgb.min(-1) >= WHITE_MIN
    ocean = ~land
    bg = np.median(rgb[ocean & ~white].reshape(-1, 3), 0)
    background = np.linalg.norm(rgb.astype(np.float32) - bg, axis=-1) < BG_DIST
    return ocean, white, background, bg

def date_of(rgb, frame_number):
    """The burned-in date (OCR) or, when the small label does not read, 5425's dates for the same frame number (5479 is
    numbered on 5425's sequence: frame 15400 is labelled 04 Jun 2023, as 5425's dates layer gives)."""
    H, W = rgb.shape[:2]
    box = rgb[int(0.97 * H):, :int(0.2 * W)].max(-1).astype(np.float32) / 255
    try:
        r = ocr_dates.read_date(np.where(box > 0.6, box, 0))
        lo, hi = frame_date(0), frame_date(19000)                      # 5425's own span: an OCR date outside it is a misread
        if r["datetime"] and lo - dt.timedelta(days=31) <= r["datetime"] <= hi + dt.timedelta(days=31):
            return r["datetime"], f"date box OCR: {r['text']}"
    except Exception:
        pass
    return frame_date(frame_number), "5425's dates layer, same frame number"

def grid1(val):
    ok = np.isfinite(val)
    s = cv2.resize(np.where(ok, val, 0).astype(np.float32), (360, 180), interpolation=cv2.INTER_AREA)
    n = cv2.resize(ok.astype(np.float32), (360, 180), interpolation=cv2.INTER_AREA) * (val.shape[0] / 180) * (val.shape[1] / 360)
    return np.where(n >= MIN_PX, s / np.maximum(n / ((val.shape[0] / 180) * (val.shape[1] / 360)), 1e-9), np.nan)

def main():
    bars = {k: colorbar.read_labelled_strip(frames.read_rgba(raw_dir(5425, "assets") / n)) for k, n in COLORBARS.items()}
    lists = {k: sorted(svs_api.list_folder(FOLDER.format(layer=k), depth=0)["files"], key=lambda f: f["name"]) for k in bars}
    pick = np.linspace(0, len(lists["temperature"]) - 1, N_FRAMES).round().astype(int)
    fetch = Fetcher(ROOT / "manifest.jsonl", tries=30)
    rows, cubes = [], {k: [] for k in bars}
    done = ROOT / "twin_frames.json"
    if done.exists() and (ROOT / "grids.npz").exists():               # frames already decoded: go straight to the depth test
        rows = json.loads(done.read_text(encoding="utf-8")); g = np.load(ROOT / "grids.npz")
        cubes = {k: list(g[k]) for k in bars}; pick = []
    for i in pick:
        row = {}
        for k in bars:
            f = lists[k][i]
            p = ROOT / "frames" / f["name"]; fetch.get(f["url"], p, expect_bytes=40_000_000)
            rgb = frames.read_rgba(p)[..., :3]
            if k == "temperature":
                num = int(f["name"].rsplit(".", 2)[-2])
                when, text = date_of(rgb, num); row.update(frame=num, date=when.strftime("%Y-%m-%d"), date_source=text)
            ocean, white, background, bg = masks(rgb)
            flow = ocean & ~white & ~background
            val, _, _, _ = Inverter(bars[k], mode="exact", method=DEFAULT).invert(rgb, MAX_DIST)
            val[~flow] = np.nan
            row[k] = {"white_share_of_ocean": float(white[ocean].mean()), "flow_share_of_ocean": float(flow[ocean].mean()),
                      "bar_match_share_of_flow": float(np.isfinite(val)[flow].mean()) if flow.any() else 0.0, "background_rgb": bg.tolist()}
            cubes[k].append(grid1(val))
            p.unlink()
        rows.append(row)
        say(f"5479 frame {row['frame']} ({row['date']}): " + ", ".join(f"{k} bar match {row[k]['bar_match_share_of_flow']:.1%}, white {row[k]['white_share_of_ocean']:.1%}" for k in bars))
    np.savez_compressed(ROOT / "grids.npz", **{k: np.stack(v).astype(np.float32) for k, v in cubes.items()}, dates=np.array([r["date"] for r in rows]))
    done.write_text(json.dumps(rows, default=float), encoding="utf-8")
    depth = {}
    for k in bars:
        F = np.stack(cubes[k])
        surf = np.stack([surface(k, dt.date.fromisoformat(r["date"])) for r in rows])
        levels = {"surface": surf, "600 m": np.broadcast_to(woa(k, 600), F.shape), "1000 m": np.broadcast_to(woa(k, 1000), F.shape)}
        res = {}
        for name, T in levels.items():
            rho, n = V.spearman(F, T)
            ok = np.isfinite(F) & np.isfinite(T)
            res[name] = {"spearman": rho, "n": n, "median_diff": float(np.median(F[ok] - T[ok])) if ok.any() else None}
        depth[k] = {"levels": res, "best": max(res, key=lambda x: res[x]["spearman"] if res[x]["spearman"] is not None else -9)}
        say(f"5479 {k}: " + "; ".join(f"{n} ρ {v['spearman']:.2f}, Δ {v['median_diff']:+.2f}" for n, v in res.items()) + f" → {depth[k]['best']}")
    (ROOT / "twin.json").write_text(json.dumps({"frames": rows, "depth": depth, "bars": {k: b.summary() for k, b in bars.items()}}, indent=1, default=float),
                                    encoding="utf-8")

if __name__ == "__main__":
    main()
