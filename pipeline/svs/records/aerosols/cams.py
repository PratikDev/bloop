"""5669 against CAMS EAC4 (a different model; svs/cams.py). Fixed 1 Nov before reading: the EAC4 step nearest the frame
(19 Aug 2025 21:00 UTC for 20:00), species AOD at 550 nm — dust, sea salt, sulphate, smoke = organic matter + black
carbon — on 1° cells; the same per-type Spearman and dominant-type agreement as the GEOS-FP and MERRA-2 checks
(validate.type_checks). Adds a4_type_cams / b4_dominant_type_cams. Usage (from pipeline/): python -m svs.records.aerosols.cams"""
import numpy as np
from core.log import say
from svs import cams, validate as V
from svs.config import raw_dir
from . import RECORD, SID
from .validate import ROOT, type_checks

AOD = {"sea salt": ("ssaod550",), "dust": ("duaod550",), "sulfate": ("suaod550",), "smoke": ("omaod550", "bcaod550")}
REQUEST = ["dust_aerosol_optical_depth_550nm", "sea_salt_aerosol_optical_depth_550nm", "sulphate_aerosol_optical_depth_550nm",
           "organic_matter_aerosol_optical_depth_550nm", "black_carbon_aerosol_optical_depth_550nm"]

def main():
    path = cams.retrieve({"variable": REQUEST, "date": ["2025-08-19/2025-08-19"], "time": ["21:00"]}, raw_dir(SID, "cams") / "eac4_aod.nc")
    ds = cams.load(path)
    model = {t: sum(cams.to_1deg(ds[v].squeeze()) for v in vs) for t, vs in AOD.items()}
    checks = type_checks(np.load(ROOT / "grid.npz"), model, ("a4_type_cams", "b4_dominant_type_cams"),
                         "CAMS EAC4 reanalysis (ADS, CC-BY), 19 Aug 2025 21:00 UTC", "CAMS EAC4 (different model)")
    V.save(RECORD, checks)
    say(f"5669 vs CAMS: {[(t, round(v['spearman'], 2)) for t, v in checks[0]['metrics']['per_type'].items()]}; "
        f"dominant {checks[1]['metrics']['agreement']}")

if __name__ == "__main__":
    main()
