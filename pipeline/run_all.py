"""Run the whole L1 pipeline in order.
Usage: python run_all.py [--no-sequence] [--no-context] [--with-global]
REQUIRED steps stop the run on failure. OPTIONAL (additive) steps only warn: a problem there never blocks the core data."""
import subprocess, sys

required = [["fetch_latest.py"], ["convert_sst.py"], ["convert_rain.py"]]
if "--no-sequence" not in sys.argv: required.append(["fetch_rain_sequence.py"])
if "--no-context" not in sys.argv: required += [["build_context.py"], ["build_demo.py"]]
optional = [["build_ensemble.py"], ["build_globe_duet.py"], ["build_cities.py"]] if "--no-context" not in sys.argv else []
if "--with-global" in sys.argv: optional.append(["build_global.py"])    # global sources change rarely: rebuild only on request

warnings = []
for s in required:
    print(f"\n==================== {s[0]} (required) ====================")
    if subprocess.run([sys.executable] + s).returncode != 0:
        sys.exit(f"STOPPED: {s[0]} failed. Fix it before continuing.")
for s in optional:
    print(f"\n==================== {s[0]} (optional) ====================")
    if subprocess.run([sys.executable] + s).returncode != 0:
        warnings.append(s[0])
        print(f"WARNING: optional step {s[0]} reported a problem - core data is unaffected. Its output file may be "
              f"missing, stale or marked 'insufficient'; check the lines above.")
print("\n==================== spotcheck.py (required) ====================")
if subprocess.run([sys.executable, "spotcheck.py"]).returncode != 0:
    sys.exit("STOPPED: spotcheck.py failed. Fix it before continuing.")
print("\nALL REQUIRED STEPS PASSED" + (f" - optional steps with warnings: {warnings}" if warnings else " - all optional steps passed"))