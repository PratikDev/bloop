"""Phase 4, second-agency pipeline test: NOAA OISST v2.1 (NRT) rendered by NOAA CoastWatch ERDDAP, read back by Bloop's
own toolkit, and checked against ERDDAP's numbers for the same day. Fixed 31 Oct before running:
  map      — the latest day ('last'), sst at 0.25°, as ERDDAP's transparent PNG (no axes, alpha = land/no data), palette
             Rainbow, linear −2…34 °C (our request states the scale);
  colorbar — ERDDAP's own legend image: the strip read by svs/colorbar.py (light background normalised to dark); its tiny
             labels do not OCR, so the range is the stated one from the request;
  decode   — exact-mode inversion (svs/invert.py), 1° cell means of decoded pixels;
  check    — ERDDAP's own numbers (the same griddap request as netCDF, every 4th point = 1°): Spearman and median difference;
             provisional pass: Spearman ≥ 0.99 and |median difference| ≤ 0.2 °C (the strip has 330 colours over 36 °C).
Writes rel_oisst (public/data/related/) and docs/related/oisst.md.
Usage (from pipeline/): python -m svs.records.oisst"""
import datetime as dt, io, json, re
import cv2
import netCDF4
import numpy as np
import requests
from PIL import Image
from core.log import say
from svs import colorbar, export, validate as V
from svs.config import REPO, UA, raw_dir
from svs.invert import DEFAULT, Inverter
from svs.onboard import record as rel
from svs.records import common

RECORD = "rel_oisst"
BASE = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21NrtAgg_LonPM180"
RANGE, MAX_DIST = (-2.0, 34.0), 12.0
Q = "sst[(last)][(0.0)][(-89.875):{s}:(89.875)][(-179.875):{s}:(179.875)]"
STYLE = "&.draw=surface&.vars=longitude%7Clatitude%7Csst&.colorBar=Rainbow%7CC%7CLinear%7C{lo:g}%7C{hi:g}%7C9"
CREDIT = "Data: NOAA NCEI OISST v2.1 (Huang et al. 2021), served by NOAA CoastWatch ERDDAP."
DISCLOSURE = "A second agency's rendered map read back by Bloop's colour inversion, checked against that agency's own numbers."

def get(url):
    r = requests.get(url, headers=UA, timeout=300); r.raise_for_status(); return r

def main():
    style = STYLE.format(lo=RANGE[0], hi=RANGE[1])
    rgba = np.asarray(Image.open(io.BytesIO(get(f"{BASE}.transparentPng?{Q.format(s=1)}{style}").content)).convert("RGBA"))
    leg = np.asarray(Image.open(io.BytesIO(get(f"{BASE}.png?{Q.format(s=1)}{style}&.legend=Only").content)).convert("RGBA")).copy()
    rgb = leg[..., :3].astype(int); leg[rgb.min(-1) > 225, :3] = 0; leg[rgb.max(-1) < 60, :3] = 255
    cb = colorbar.read(leg, stated_range=RANGE)
    val, _, _, _ = Inverter(cb, mode="exact", method=DEFAULT).invert(np.ascontiguousarray(rgba[..., :3]), MAX_DIST)
    val[rgba[..., 3] < 128] = np.nan
    ok = np.isfinite(val)
    s = cv2.resize(np.where(ok, val, 0).astype(np.float32), (360, 180), interpolation=cv2.INTER_AREA)
    n = cv2.resize(ok.astype(np.float32), (360, 180), interpolation=cv2.INTER_AREA)
    grid = np.where(n > 0.5, s / np.maximum(n, 1e-9), np.nan)
    path = raw_dir("oisst") / "numbers.nc"; path.write_bytes(get(f"{BASE}.nc?{Q.format(s=4)}").content)
    with netCDF4.Dataset(path) as ds:
        truth = np.ma.filled(ds["sst"][0, 0].astype(float), np.nan)[::-1]          # ERDDAP latitude ascends: row 0 = north
        when = netCDF4.num2date(ds["time"][0], ds["time"].units, only_use_cftime_datetimes=False).replace(tzinfo=dt.timezone.utc)
        licence = getattr(ds, "license", "")
    rho, nn = V.spearman(grid, truth)
    both = np.isfinite(grid) & np.isfinite(truth)
    diff = float(np.median(grid[both] - truth[both]))
    rel.register({"record": RECORD, "svs_id": 0, "title": "NOAA OISST via ERDDAP (second-agency pipeline test)", "badge": "observation",
                  "focus": "water resources", "related_to": [3912], "status": "verified" if rho >= 0.99 and abs(diff) <= 0.2 else "relative",
                  "credit": CREDIT, "disclosure": DISCLOSURE})
    check = V.check(RECORD, "a_erddap_numbers", "ERDDAP-rendered OISST read back by Bloop vs ERDDAP's own numbers, same day, 1° cells",
                    kind="value", source="NOAA OISST v2.1 NRT (ncdcOisst21NrtAgg_LonPM180, CoastWatch ERDDAP)",
                    threshold="Spearman ≥ 0.99 and |median difference| ≤ 0.2 °C (provisional)", passed=bool(rho >= 0.99 and abs(diff) <= 0.2),
                    metrics={"spearman": rho, "n": nn, "median_diff_C": diff, "decoded_share_of_opaque": float(ok[rgba[..., 3] >= 128].mean()),
                             "date": when.strftime("%Y-%m-%d"), "strip_colours": cb.n},
                    note="Second agency, second renderer: a test of the colour inversion, not of OISST.")
    V.save(RECORD, [check])
    for p in rel.record_dir(RECORD).glob("*.u16.gz"): p.unlink()
    lay = export.layer(RECORD, "sst", grid[None].astype(float), [when], (-180, -90, 180, 90), "°C", step=0.01,
                       label="Sea surface temperature (NOAA OISST, read back from ERDDAP's map)", aggregation="mean of decoded 0.25° pixels per 1° cell",
                       time_labels=[when.strftime("%d %b %Y")], display=common.display(cb))
    lay.update(status="verified" if check["pass"] else "relative", status_check=check["id"], statement=None if check["pass"] else f"ρ {rho:.3f}, Δ {diff:+.2f} °C")
    man = {"record": RECORD, "app_title": "Sea surface temperature (NOAA OISST via ERDDAP, observation)", "svs_ids": [], "svs_pages": [],
           "title": "NOAA OISST v2.1 rendered by ERDDAP", "description": DISCLOSURE, "release_date": None,
           "period": {"start": when.strftime("%Y-%m-%dT%H:%M:%SZ"), "end": when.strftime("%Y-%m-%dT%H:%M:%SZ"), "label": common.period_label(when, when)},
           "badge": "observation", "credits_by_role": {"Data": ["NOAA NCEI"], "Server": ["NOAA CoastWatch ERDDAP"]}, "datasets": [],
           "credit_line": CREDIT, "disclosure": DISCLOSURE, "licence": licence[:300] or "NOAA data: free use", "focus": "water resources",
           "related_to": [3912], "frame_times": {"method": "date-list", "approximate": False, "count": 1, "source": "the dataset's own time"},
           "georef": {"projection": "equirectangular (ERDDAP griddap)", "bounds": [-180, -90, 180, 90], "pass_at": 1.0, "shifts_deg": [], "iou": {},
                      "pass": True, "best_is_assumed": True},
           "colorbar": cb.summary(), "layers": [lay], "voices": {"sst": "relOisst"},
           "play": [common.option("sst", "Sea surface temperature (OISST via ERDDAP): higher pitch = warmer", "sst", [("relOisst", ["sst"])], (21.0, 89.5), 1)],
           "validation": common.validation_summary([check]), "size": {"choice": {"cell_deg": 1.0}, "tried": []}}
    export.write_manifest(RECORD, man)
    L = ["# NOAA OISST via ERDDAP (second-agency pipeline test)", "", "Generated by `pipeline/svs/records/oisst.py`.", "",
         f"- Date: {when:%Y-%m-%d}; status **{lay['status']}**", f"- Read-back vs ERDDAP's numbers: Spearman {rho:.4f}, median difference {diff:+.3f} °C, {nn:,} cells",
         f"- Colorbar: ERDDAP's legend strip ({cb.n} colours), range −2…34 °C as stated in the request (its labels are too small to OCR)",
         f"- Credit: {CREDIT}", f"- Licence: {licence[:300]}"]
    (REPO / "docs" / "related" / "oisst.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    rel.write_index()
    say(f"OISST via ERDDAP {when:%Y-%m-%d}: rho {rho:.4f}, diff {diff:+.3f} C, pass {check['pass']}")

if __name__ == "__main__":
    main()
