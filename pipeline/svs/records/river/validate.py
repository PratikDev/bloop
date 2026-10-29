"""Validate 4960 against MERRA-2 M2T1NXINT (GES DISC cloud OPeNDAP, the reanalysis the visualization shows). Fixed before
the MERRA-2 files were read:
  coastal IVT — hourly |(UFLXQV, VFLXQV)| (kg m⁻¹ s⁻¹), its maximum over COAST_BOX, for every day from the first to the
                last frame date (data_raw/4960/merra2/<YYYYMMDD>.npy);
  (a) timing  — the frame time with the most river–land contact vs the MERRA-2 hour of the strongest coastal IVT in the
                same span: difference in hours (no threshold);
  (b) rank    — Spearman of the frames' contact (px) with the coastal IVT at each frame's hour (no threshold);
  (c) landfall latitude — not measurable: the views are perspective 3D shots without a georeference.
Usage (from pipeline/): python -m svs.records.river.validate"""
import datetime as dt, json
from urllib.parse import quote
import numpy as np
from core.log import say
from core.ref import T
from svs import cmr, validate as V
from svs.config import raw_dir
from . import COAST_BOX, MERRA2_INT, RECORD, SID

ROOT = raw_dir(SID)
GRANULE = "M2T1NXINT.5.12.4:MERRA2_{stream}.tavg1_2d_int_Nx.{d:%Y%m%d}.nc4"

def box_index():
    w, s, e, n = COAST_BOX
    return (int((s + 90) / 0.5), int((n + 90) / 0.5)), (int((w + 180) / 0.625), int((e + 180) / 0.625))

def day_ivt(session, d):
    path = ROOT / "merra2" / f"{d:%Y%m%d}.npy"
    if path.exists(): return np.load(path)
    import netCDF4
    (y0, y1), (x0, x1) = box_index()
    stream = 300 if d.year < 2011 else 400
    url = f"https://opendap.earthdata.nasa.gov/collections/{MERRA2_INT}/granules/{quote(GRANULE.format(stream=stream, d=d))}.dap.nc4"
    ce = ";".join(f"/{v}[0:1:23][{y0}:1:{y1}][{x0}:1:{x1}]" for v in ("UFLXQV", "VFLXQV"))
    for attempt in range(5):
        r = session.get(url, params={"dap4.ce": ce}, timeout=300)
        if r.status_code == 200: break
    r.raise_for_status()
    with netCDF4.Dataset("m2", memory=r.content) as ds:
        mag = np.hypot(np.ma.filled(ds["UFLXQV"][:], np.nan), np.ma.filled(ds["VFLXQV"][:], np.nan))
    out = np.nanmax(mag.reshape(24, -1), 1)
    path.parent.mkdir(exist_ok=True); np.save(path, out)
    return out

def main():
    rows = [r for r in json.loads((ROOT / "frames.json").read_text(encoding="utf-8"))["rows"] if r["time"]]
    times = [dt.datetime.fromisoformat(r["time"].replace("Z", "+00:00")) for r in rows]
    s = T.earthdata().get_requests_https_session()
    first, last = min(times).date(), max(times).date()
    days = [first + dt.timedelta(days=i) for i in range((last - first).days + 1)]
    hourly = {}
    for d in days:
        for h, v in enumerate(day_ivt(s, d)): hourly[dt.datetime(d.year, d.month, d.day, h, tzinfo=dt.timezone.utc)] = float(v)
    at = lambda t: hourly.get(t.replace(minute=0, second=0, microsecond=0))
    contact = np.array([r["contact_px"] for r in rows], float)
    ivt = np.array([at(t) or np.nan for t in times])
    peak_frame = times[int(np.argmax(contact))]
    peak_m2 = max(hourly, key=hourly.get)
    rho, n = V.spearman(contact, ivt)
    cmr.citation(MERRA2_INT)
    checks = [V.check(RECORD, "a_landfall_timing_merra2", "Landfall timing: most river–land contact in the frames vs strongest coastal IVT in MERRA-2",
                      kind="value", source="MERRA-2 M2T1NXINT UFLXQV/VFLXQV (GES DISC)", passed=None,
                      metrics={"frame_peak_utc": peak_frame.strftime("%Y-%m-%dT%H:%MZ"), "merra2_peak_utc": peak_m2.strftime("%Y-%m-%dT%H:%MZ"),
                               "difference_hours": (peak_frame - peak_m2).total_seconds() / 3600, "merra2_peak_ivt": hourly[peak_m2],
                               "frames": len(rows), "days": len(days), "box": list(COAST_BOX)},
                      note="The narrated movie revisits times between scenes; frames are dated by their own date layer."),
              V.check(RECORD, "b_contact_rank_merra2", "River–land contact per frame vs coastal IVT at the frame's hour (Spearman)", kind="value",
                      source="MERRA-2 M2T1NXINT", passed=None, metrics={"spearman": rho, "n": n}),
              V.check(RECORD, "c_landfall_latitude", "Landfall latitude", kind="none", passed=None,
                      metrics={"reason": "no georeference (perspective 3D views)"}, note="Not measurable from these frames.")]
    V.save(RECORD, checks)
    say(f"4960: frame peak {peak_frame}, MERRA-2 peak {peak_m2} ({checks[0]['metrics']['difference_hours']:+.0f} h); contact~IVT Spearman {rho}")

if __name__ == "__main__":
    main()
