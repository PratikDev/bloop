"""data_raw/ disk accounting: current size, the 20 GB cap and the peak (data_raw/_disk.json, shared by every job)."""
import json, os, time, threading
from common import now_utc
from .config import DATA_RAW, RAW_CAP_BYTES

PEAK_FILE = DATA_RAW / "_disk.json"
_lock = threading.Lock()
_cached = (0.0, 0)

def usage(root=DATA_RAW):
    total, stack = 0, [str(root)]
    while stack:
        with os.scandir(stack.pop()) as it:
            for e in it:
                if e.is_dir(follow_symlinks=False): stack.append(e.path)
                elif e.is_file(follow_symlinks=False): total += e.stat().st_size
    return total

def record(force=False):
    """Current data_raw/ size (cached for 5 s) and the all-time peak, merged into _disk.json."""
    global _cached
    with _lock:
        if not force and time.time() - _cached[0] < 5: return _cached[1]
        cur = usage()
        _cached = (time.time(), cur)
        peak = json.loads(PEAK_FILE.read_text()) if PEAK_FILE.exists() else {"peak_bytes": 0}
        if cur > peak["peak_bytes"]:
            peak = {"peak_bytes": cur, "peak_utc": now_utc()}
        peak.update(current_bytes=cur, checked_utc=now_utc(), cap_bytes=RAW_CAP_BYTES)
        PEAK_FILE.write_text(json.dumps(peak, indent=1))
        return cur

def wait_for_room(need_bytes, poll_s=20, timeout_s=6 * 3600):
    """Block until data_raw/ + need fits under the cap (a consumer job is deleting decoded frames)."""
    t0 = time.time()
    while record(force=True) + need_bytes > RAW_CAP_BYTES:
        if time.time() - t0 > timeout_s:
            raise RuntimeError(f"data_raw/ stayed above the {RAW_CAP_BYTES / 1e9:.0f} GB cap for {timeout_s} s")
        time.sleep(poll_s)
