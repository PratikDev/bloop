"""The reference suite (pipeline/reference/bloop_data_tests.py) as a library: its tested access routines, constants and
acceptance tests. Products call these instead of keeping copies; the suite stays runnable on its own."""
import os, sys
from pathlib import Path
from . import env  # noqa: F401  (.env.local must be loaded before the suite reads secrets)

PIPE = Path(__file__).resolve().parents[1]
os.environ.setdefault("BLOOP_OUT", str(PIPE / "work" / "ref"))
(PIPE / "work").mkdir(exist_ok=True)
sys.path.insert(0, str(PIPE / "reference"))
import bloop_data_tests as T  # noqa: E402

def run_test(tid):
    """Run one acceptance test; returns (status, detail, metrics) with secrets redacted, like the suite's run()."""
    fn = next(t["fn"] for t in T.REGISTRY if t["id"] == tid)
    try:
        status, detail, metrics = fn()
    except T.Skip as s:
        status, detail, metrics = T.SKIP, str(s), {}
    import json
    return status, T.redact(detail), json.loads(T.redact(json.dumps(metrics, default=str))) if metrics else {}
