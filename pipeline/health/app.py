"""The browser check's results: data_raw/_tmp/health/app-<browser>/<record>.json (one file per record per browser, written
by e2e/health-records.e2e.ts). Read here once for the health report (__main__) and the feature inventory (features)."""
import json
from svs.config import DATA_RAW

APP = DATA_RAW / "_tmp" / "health"
BROWSERS = ("chromium", "firefox")

def results():
    """{record: {browser: result}}."""
    out = {}
    for b in BROWSERS:
        for p in sorted((APP / f"app-{b}").glob("*.json")):
            out.setdefault(p.stem, {})[b] = json.loads(p.read_text(encoding="utf-8"))
    return out
