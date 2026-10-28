"""Logging for products: every line passes through the reference suite's redact(), so no key reaches a log."""
import sys, traceback
from .ref import T

def say(*parts):
    print(T.redact(" ".join(str(p) for p in parts)), flush=True)

class SkipProduct(Exception):
    """A product that can't run here (missing manual file, missing key): reported, exit code 0."""

def main_guard(fn):
    """Entry point for a product module: SKIP = exit 0 with the reason; any error = redacted traceback, exit 1
    (run_all.py treats that as a warning, never a stop)."""
    try:
        fn()
    except (SkipProduct, T.Skip) as s:
        say(f"SKIP: {s}")
    except Exception:
        say(traceback.format_exc())
        sys.exit(1)
