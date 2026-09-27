"""Run the whole L1 pipeline in order. Usage: python run_all.py [--no-sequence] [--no-context]"""
import subprocess, sys
steps = [["fetch_latest.py"], ["convert_sst.py"], ["convert_rain.py"]]
if "--no-sequence" not in sys.argv: steps.append(["fetch_rain_sequence.py"])
if "--no-context" not in sys.argv: steps += [["build_context.py"], ["build_demo.py"], ["build_ensemble.py"], ["build_globe_duet.py"]]
steps.append(["spotcheck.py"])
for s in steps:
    print(f"\n==================== {s[0]} ====================")
    r = subprocess.run([sys.executable] + s)
    if r.returncode != 0:
        sys.exit(f"STOPPED: {s[0]} failed (exit {r.returncode}). Fix it before continuing.")
print("\nALL STEPS PASSED")