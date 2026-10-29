"""Acquire 3912: the per-frame date list and every STEP-th 2048×1024 frame (kept until decoded, then deleted).
Usage (from pipeline/): python -m svs.records.currents.acquire"""
import re
from core.log import say
from svs import acquire, choose, fetch, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import DATES_URL_RX, SID, STEP

ROOT = raw_dir(SID)

def main():
    choice = choose.choose(svs_api.fetch_record(SID))
    fs = choice["frames"][0]
    dates_url = next(u for u in choice["date_lists"] if re.search(DATES_URL_RX, u))
    (ROOT / "dates.txt").write_text(fetch.text(dates_url), encoding="utf-8")
    files = acquire.layer_files(fs)
    say(f"3912: {len(files)} frames listed; fetching every {STEP}th")
    acquire.fetch_full(Fetcher(ROOT / "manifest.jsonl"), files, range(0, len(files), STEP), ROOT / "frames", label="3912")

if __name__ == "__main__":
    main()
