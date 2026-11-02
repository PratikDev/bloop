"""5533 against CAMS EAC4 (a different model; svs/cams.py). Fixed 1 Nov before reading: the same 25 validation hours and
1° frame cells as the GEOS-CF check (validate.py: cells with ≥ MIN_FRAC decoded); each hour paired with the nearest
3-hourly EAC4 step (≤ 1.5 h); surface fields: PM2.5 (kg/m³ → µg/m³), and CO, O3, NO + NO2 at model level 60 (kg/kg →
ppbv). Per species, pooled: Spearman and median frame/model ratio; no threshold (a different model). Adds checks
e_<species>_cams to air_5533. Usage (from pipeline/): python -m svs.records.air.cams"""
import datetime as dt, json
import numpy as np
import xarray as xr
from core.log import say
from svs import cams, validate as V
from svs.config import raw_dir
from . import ALT
from .truth import OUT as TRUTH
from .validate import MIN_FRAC, RECORD, WORK

SHORT = {"particulate_matter_2.5um": "pm2p5", "carbon_monoxide": "co", "ozone": "go3", "nitrogen_monoxide": "no", "nitrogen_dioxide": "no2"}
GASES = {"co": ("carbon_monoxide",), "o3": ("ozone",), "nox": ("nitrogen_monoxide", "nitrogen_dioxide")}

def hours():
    t = json.loads((TRUTH / "geoscf.json").read_text(encoding="utf-8"))["times"]
    k = np.load(WORK / "valid_pm25.npz")["k"]
    when = [dt.datetime.fromisoformat(t[f"{int(i)}+0"]) - dt.timedelta(minutes=30) for i in k]
    return k, [nearest_step(w) for w in when]

def nearest_step(w):
    """The EAC4 time (00, 03, …, 21 UTC) nearest to w."""
    t = w + dt.timedelta(minutes=90)
    return t.replace(hour=t.hour - t.hour % 3, minute=0, second=0, microsecond=0)

def main():
    k, steps = hours()
    variables = ["particulate_matter_2.5um", *sorted({g for gs in GASES.values() for g in gs})]
    paths = []
    for hh in sorted({s.hour for s in steps}):                        # one request per time of day: only the dates needed
        days = sorted({f"{s:%Y-%m-%d}" for s in steps if s.hour == hh})
        paths.append(cams.retrieve({"variable": variables, "model_level": ["60"], "date": [f"{d}/{d}" for d in days], "time": [f"{hh:02d}:00"]},
                                   raw_dir(ALT, "cams") / f"eac4_{hh:02d}.nc"))
    parts = [cams.load(p) for p in paths]
    tname = "valid_time" if "valid_time" in parts[0].coords else "time"
    ds = xr.concat(parts, dim=tname, combine_attrs="override").sortby(tname)    # each file holds one time of day on many dates
    pick = lambda v, s: ds[v].sel({tname: np.datetime64(s.replace(tzinfo=None))}, method="nearest").squeeze()
    pm_var, gas_var = SHORT["particulate_matter_2.5um"], SHORT
    checks = []
    for sp in ("pm25", "co", "o3", "nox"):
        v = np.load(WORK / f"valid_{sp}.npz")
        F, T = [], []
        for i, s in enumerate(steps):
            if sp == "pm25": m = cams.to_1deg(pick(pm_var, s)) * 1e9
            else: m = sum(cams.ppbv(cams.to_1deg(pick(gas_var[g], s)), g) for g in GASES[sp])
            ok = (v["frac"][i] >= MIN_FRAC) & np.isfinite(v["values"][i]) & np.isfinite(m)
            F.append(v["values"][i][ok]); T.append(m[ok])
        F, T = np.concatenate(F), np.concatenate(T)
        rho, n = V.spearman(F, T)
        pos = (F > 0) & (T > 0)
        checks.append(V.check(RECORD, f"e_{sp}_cams", f"{sp.upper()}: frames vs CAMS EAC4 (a different model), same hours (nearest 3-hourly step)",
                              kind="model-vs-obs", source="CAMS EAC4 reanalysis (ADS, CC-BY)", passed=None,
                              metrics={"spearman": rho, "n": n, "median_ratio": float(np.median(F[pos] / T[pos])) if pos.any() else None,
                                       "hours": len(steps), "rung": "different model"},
                              note="Different model: agreement in pattern, not the same numbers."))
        say(f"5533 {sp} vs CAMS: ρ {rho:.3f}, median ratio {checks[-1]['metrics']['median_ratio']}")
    V.save(RECORD, checks)

if __name__ == "__main__":
    main()
