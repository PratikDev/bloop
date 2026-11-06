"""Refresh everything that can update, by hand (npm run refresh:live), e.g. before recording a video or on the morning of
13 Nov. 1) run_all.py --cadence daily: the SVS frames (5101, 4285 + sequence, 5176, 5315, 5584, 5113), the truth pairs
(SST vs MUR, rain vs IMERG, 5176 vs CRW), the daily products and the live related records (5624, 5650); it stops before
spotcheck.py passes and keeps the last good data otherwise. 2) the EIC class-A items (5147–5154 against GEOS-FP and
GEOS-CF v2, 5544): each record is refreshed, and kept only if its truth check did not get worse (a PASS that turns into
a MISS or into no check restores the previous record and its validation rows). 3) meta/freshness.json.
Usage (from pipeline/): python refresh_live.py [--skip-daily] [--skip-eic]"""
import json, shutil, subprocess, sys, tempfile
from pathlib import Path
from svs.config import PUBLIC_OFFICIAL
from svs.records.eic import ITEMS
from svs.validate import _table

def result(record):
    p = PUBLIC_OFFICIAL / record / "validation.json"
    if not p.exists(): return None
    c = json.loads(p.read_text(encoding="utf-8"))["checks"][0]
    return c.get("pass")

def eic():
    kept, restored = [], []
    for sid in ITEMS:
        rec = f"eic_{sid}"
        before = result(rec)
        tmp = Path(tempfile.mkdtemp()) / rec
        shutil.copytree(PUBLIC_OFFICIAL / rec, tmp)
        ok = subprocess.run([sys.executable, "-m", "svs.records.eic.run", str(sid)]).returncode == 0
        after = result(rec) if ok else None
        if not ok or (before is True and after is not True):
            shutil.rmtree(PUBLIC_OFFICIAL / rec); shutil.copytree(tmp, PUBLIC_OFFICIAL / rec)
            _table(rec, json.loads((PUBLIC_OFFICIAL / rec / "validation.json").read_text(encoding="utf-8"))["checks"])
            restored.append((rec, before, after if ok else "run failed"))
        else:
            kept.append((rec, before, after))
        shutil.rmtree(tmp.parent, ignore_errors=True)
    subprocess.run([sys.executable, "-c", "from svs.records.common import write_index; write_index()"])
    return kept, restored

def main(argv):
    if "--skip-daily" not in argv:
        r = subprocess.run([sys.executable, "run_all.py", "--cadence", "daily"])
        print(f"\nrun_all --cadence daily: {'PASSED (spotcheck)' if r.returncode == 0 else 'STOPPED: the last good data stays'}")
    if "--skip-eic" not in argv:
        kept, restored = eic()
        for rec, b, a in kept: print(f"refreshed {rec}: truth {b} → {a}")
        for rec, b, a in restored: print(f"KEPT OLD {rec}: truth {b} → {a} (refresh not shipped)")
    subprocess.run([sys.executable, "build_freshness.py"])
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
