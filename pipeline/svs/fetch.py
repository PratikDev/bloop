"""Polite, resumable downloads with a SHA-256 manifest. One Fetcher per record; its manifest (JSON lines, append-only)
survives after the raw files are deleted, so every shipped number traces back to the exact bytes it came from.
Rate limit: one request start per `min_interval` seconds across all threads; retries back off on 429/5xx."""
import hashlib, json, threading, time
from pathlib import Path
import requests
from common import now_utc
from core.log import say
from .config import DATA_RAW, UA
from . import disk

RETRY_STATUS = (429, 500, 502, 503, 504)

class Fetcher:
    def __init__(self, manifest: Path, min_interval=0.4, tries=6, timeout=300):
        self.manifest, self.min_interval, self.tries, self.timeout = Path(manifest), min_interval, tries, timeout
        self.manifest.parent.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session(); self.session.headers.update(UA)
        self._lock, self._last = threading.Lock(), 0.0
        self.done = {}
        if self.manifest.exists():
            for line in self.manifest.read_text(encoding="utf-8").splitlines():
                e = json.loads(line); self.done[(e["url"], e.get("range"))] = e

    def _pace(self):
        with self._lock:
            wait = self._last + self.min_interval - time.time()
            if wait > 0: time.sleep(wait)
            self._last = time.time()

    def _request(self, url, headers=None, stream=True):
        last = None
        for k in range(self.tries):
            self._pace()
            try:
                r = self.session.get(url, headers=headers or {}, stream=stream, timeout=self.timeout)
                if r.status_code in RETRY_STATUS:
                    last = f"HTTP {r.status_code}"; r.close(); time.sleep(min(60, 3 * 2 ** k)); continue
                r.raise_for_status()
                return r
            except requests.RequestException as e:
                last = e; time.sleep(min(60, 3 * 2 ** k))
        raise RuntimeError(f"GET failed after {self.tries} tries: {url} ({last})")

    def _log(self, entry):
        with self._lock:
            with open(self.manifest, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
            self.done[(entry["url"], entry.get("range"))] = entry
        return entry

    def get(self, url, dest, expect_bytes=50_000_000):
        """Whole file to `dest`; resumes a .part with a Range request. Skips files already in the manifest."""
        dest = Path(dest)
        if (url, None) in self.done and dest.exists(): return self.done[(url, None)]
        disk.wait_for_room(expect_bytes)
        part = dest.with_suffix(dest.suffix + ".part"); dest.parent.mkdir(parents=True, exist_ok=True)
        have = part.stat().st_size if part.exists() else 0
        r = self._request(url, headers={"Range": f"bytes={have}-"} if have else None)
        mode = "ab" if have and r.status_code == 206 else "wb"
        with open(part, mode) as f:
            for chunk in r.iter_content(1 << 20): f.write(chunk)
        part.replace(dest)
        disk.record()
        return self._log({"url": url, "path": dest.relative_to(DATA_RAW).as_posix(), "bytes": dest.stat().st_size,
                          "sha256": sha256_file(dest), "range": None, "fetched_utc": now_utc()})

    def head_bytes(self, url, n, start=0):
        """Bytes [start, start+n) in memory (a PNG prefix for row-band decoding). Logged with the prefix's hash."""
        r = self._request(url, headers={"Range": f"bytes={start}-{start + n - 1}"})
        buf = bytearray()
        for chunk in r.iter_content(1 << 16):
            buf += chunk
            if len(buf) >= n: break
        r.close()
        data = bytes(buf[:n])
        total = r.headers.get("Content-Range", "").rsplit("/", 1)[-1]
        self._log({"url": url, "path": None, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                   "range": f"{start}-{start + len(data) - 1}", "file_bytes": int(total) if total.isdigit() else None,
                   "fetched_utc": now_utc()})
        return data, (int(total) if total.isdigit() else None)

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""): h.update(chunk)
    return h.hexdigest()

_SESSION = requests.Session(); _SESSION.headers.update(UA)

def text(url, timeout=120, tries=5):
    """Small text resource (API JSON, listing, dates file) with the same retry policy; not logged."""
    for k in range(tries):
        try:
            r = _SESSION.get(url, timeout=timeout)
            if r.status_code in RETRY_STATUS: time.sleep(3 * 2 ** k); continue
            r.raise_for_status(); r.encoding = r.encoding or "utf-8"
            return r.text
        except requests.RequestException as e:
            say(f"retry {k + 1}: {url} ({e.__class__.__name__})"); time.sleep(3 * 2 ** k)
    raise RuntimeError(f"GET failed after {tries} tries: {url}")
