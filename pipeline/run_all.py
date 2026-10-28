"""Run the whole L1 pipeline in order.
Usage: python run_all.py [--no-sequence] [--no-context] [--with-global] [--cadence daily|weekly|static|all]
REQUIRED steps stop the run on failure. OPTIONAL (additive) steps only warn: a problem there never blocks the core data.
--cadence is what the GitHub Actions jobs run: daily = the frame steps, verify_latest and the daily products;
weekly / static / all = only those products (no frame steps; no context rebuild, whose inputs are local files).
Without --cadence: the original run, then verify_latest and the daily products. build_freshness.py always runs last."""
import subprocess, sys
from products.registry import CADENCES, by_cadence

def arg(name):
    for i, a in enumerate(sys.argv):
        if a == f"--{name}" and i + 1 < len(sys.argv): return sys.argv[i + 1]
        if a.startswith(f"--{name}="): return a.split("=", 1)[1]
    return None

cadence = arg("cadence")
if cadence is not None and cadence not in (*CADENCES, "all"):
    sys.exit(f"--cadence must be one of {(*CADENCES, 'all')}")
products = lambda c: [["-m", m] for m in by_cadence(c)]

frames = [["fetch_latest.py"], ["convert_sst.py"], ["convert_rain.py"]]
if "--no-sequence" not in sys.argv: frames.append(["fetch_rain_sequence.py"])
if cadence is None:
    required = frames + ([["build_context.py"], ["build_demo.py"]] if "--no-context" not in sys.argv else [])
    optional = [["build_ensemble.py"], ["build_globe_duet.py"], ["build_cities.py"]] if "--no-context" not in sys.argv else []
    if "--with-global" in sys.argv: optional.append(["build_global.py"])    # global sources change rarely: rebuild only on request
    optional += [["verify_latest.py"]] + products("daily")
elif cadence == "daily":
    required, optional = frames, [["verify_latest.py"]] + products("daily")
else:
    required, optional = [], products(cadence)
optional.append(["build_freshness.py"])

warnings = []
for s in required:
    print(f"\n==================== {s[-1]} (required) ====================")
    if subprocess.run([sys.executable] + s).returncode != 0:
        sys.exit(f"STOPPED: {s[-1]} failed. Fix it before continuing.")
for s in optional:
    print(f"\n==================== {s[-1]} (optional) ====================")
    if subprocess.run([sys.executable] + s).returncode != 0:
        warnings.append(s[-1])
        print(f"WARNING: optional step {s[-1]} reported a problem - core data is unaffected. Its output file may be "
              f"missing, stale or marked 'insufficient'; check the lines above.")
print("\n==================== spotcheck.py (required) ====================")
if subprocess.run([sys.executable, "spotcheck.py"]).returncode != 0:
    sys.exit("STOPPED: spotcheck.py failed. Fix it before continuing.")
print("\nALL REQUIRED STEPS PASSED" + (f" - optional steps with warnings: {warnings}" if warnings else " - all optional steps passed"))
