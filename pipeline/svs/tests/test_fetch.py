import hashlib, http.server, json, os, tempfile, threading, unittest
from pathlib import Path
from svs import fetch

BODY = os.urandom(300_000)

class RangeHandler(http.server.BaseHTTPRequestHandler):
    """Serves BODY with Range support; the first request for /flaky answers 503 (a retry must follow)."""
    seen = {}
    def do_GET(self):
        n = RangeHandler.seen[self.path] = RangeHandler.seen.get(self.path, 0) + 1
        if self.path == "/flaky" and n == 1:
            self.send_response(503); self.end_headers(); return
        rng = self.headers.get("Range")
        if rng:
            a, b = rng.split("=")[1].split("-")
            a = int(a); b = int(b) if b else len(BODY) - 1
            part = BODY[a:b + 1]
            self.send_response(206); self.send_header("Content-Range", f"bytes {a}-{a + len(part) - 1}/{len(BODY)}")
        else:
            part = BODY; self.send_response(200)
        self.send_header("Content-Length", str(len(part))); self.end_headers(); self.wfile.write(part)
    def log_message(self, *a): pass

class FetcherTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), RangeHandler)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"

    @classmethod
    def tearDownClass(cls): cls.srv.shutdown()

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.f = fetch.Fetcher(self.tmp / "manifest.jsonl", min_interval=0, tries=3)
        fetch.time.sleep = lambda s: None                  # no back-off waits in tests

    def test_resume_and_manifest(self):
        dest = self.tmp / "a.bin"
        Path(str(dest) + ".part").write_bytes(BODY[:100_000])      # an interrupted earlier download
        e = self.f.get(f"{self.base}/a", dest, expect_bytes=0)
        self.assertEqual(dest.read_bytes(), BODY)
        self.assertEqual(e["sha256"], hashlib.sha256(BODY).hexdigest())
        line = json.loads((self.tmp / "manifest.jsonl").read_text().splitlines()[-1])
        self.assertEqual(line["bytes"], len(BODY))
        again = fetch.Fetcher(self.tmp / "manifest.jsonl").get(f"{self.base}/a", dest)   # skipped: already in manifest
        self.assertEqual(again["sha256"], e["sha256"])

    def test_retry_then_success(self):
        e = self.f.get(f"{self.base}/flaky", self.tmp / "b.bin", expect_bytes=0)
        self.assertEqual(e["bytes"], len(BODY))

    def test_prefix(self):
        data, total = self.f.head_bytes(f"{self.base}/c", 1000, start=500)
        self.assertEqual(data, BODY[500:1500]); self.assertEqual(total, len(BODY))

if __name__ == "__main__":
    unittest.main()
