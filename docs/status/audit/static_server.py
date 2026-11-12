"""Serves the static export (`next build` with output: "export" writes ./out) for the browser checks, the way a static
host does: /listen → listen.html, /how/ → how/index.html, an unknown path → 404.html with status 404. Standard library
only (no install).
Usage: python -m health.static_server <dir> <port>   (or serve(dir, port) in a thread)"""
import functools, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class ExportHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):                       # quiet: the checks print their own progress
        pass

    def _route(self) -> tuple[Path | None, int]:
        root = Path(self.directory)
        rel = unquote(urlsplit(self.path).path).lstrip("/")
        base = (root / rel).resolve()
        if root.resolve() not in (base, *base.parents):
            return None, 404                              # outside the export
        for candidate in (base, base.with_name(base.name + ".html") if rel else base, base / "index.html"):
            if candidate.is_file():
                return candidate, 200
        return root / "404.html", 404

    def send_head(self):
        path, status = self._route()
        if path is None or not path.is_file():
            self.send_error(404)
            return None
        f = open(path, "rb")
        self.send_response(status)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Content-Length", str(path.stat().st_size))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        return f


def server(directory, port) -> ThreadingHTTPServer:
    """A server for `directory` on localhost:`port` (call serve_forever(); shutdown() stops it)."""
    return ThreadingHTTPServer(("127.0.0.1", port), functools.partial(ExportHandler, directory=str(directory)))


if __name__ == "__main__":
    server(sys.argv[1], int(sys.argv[2])).serve_forever()
