"""The daily refresh of the live related items (svs.onboard.LIVE: 5624 smoke forecast, 5650 IMERG NRT): each is
re-onboarded from today's frames; a failure leaves yesterday's record in place and is reported, never fatal.
Run by run_all.py --cadence daily (its products/registry.py rows carry this module). Usage: python -m svs.onboard.daily"""
import sys
from core.log import say
from . import LIVE
from .__main__ import run

def main():
    failed = []
    for sid in LIVE:
        try: run(sid, n_frames=3)
        except Exception as e:
            failed.append(sid); say(f"daily onboarding {sid}: {e.__class__.__name__}: {str(e)[:200]}")
    sys.exit(1 if failed and len(failed) == len(LIVE) else 0)

if __name__ == "__main__":
    main()
