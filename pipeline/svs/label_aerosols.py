"""Hand-labelling page for SVS 5669 (team request, Part B): shows one random pixel of the 5669 still at a time (a zoomed
crop with a crosshair, and where it is on the map) with five buttons: sea salt / dust / smoke / sulfate / none. Each
answer is appended to pipeline/svs/fixtures/5669_labels.json at once (atomic write), so stopping loses nothing.
Pixels are drawn at random within colour strata (hue family of the raw pixel, plus 'dark'), so rare colours get enough
labels; the stratum is stored with each label and the confusion check weights by it. The page never shows a guess.
Target: ≥ 200 labels per class. Keys: 1–5 answer, u undoes the last answer, s skips.
Usage (from pipeline/): python -m svs.label_aerosols   then open http://127.0.0.1:8765"""
import base64, io, json, os, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import numpy as np
from PIL import Image, ImageDraw
from .config import FIXTURES, raw_dir

SID = 5669
STILL = raw_dir(SID, "probe") / "Aerosols_2025-08-19T20_00_00_3840x2160.png"
OUT = FIXTURES / "5669_labels.json"
CLASSES = ("sea salt", "dust", "smoke", "sulfate", "none")
TARGET, CROP, ZOOM, PORT = 200, 48, 6, 8765
_LOCK = threading.Lock()

def strata(rgb):
    """Colour family of each pixel from its own RGB (no decoder): dark, red/orange, purple/pink, green, blue/grey."""
    f = rgb.astype(np.float32)
    mx, mn = f.max(-1), f.min(-1)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (f[..., 1] - f[..., 2]), 2 * f[..., 0] - f[..., 1] - f[..., 2])) % 360
    s = np.full(rgb.shape[:2], "blue/grey", object)
    s[(mx - mn > 25) & ((hue < 50) | (hue >= 330))] = "red/orange"
    s[(mx - mn > 25) & (hue >= 270) & (hue < 330)] = "purple/pink"
    s[(mx - mn > 25) & (hue >= 70) & (hue < 160)] = "green"
    s[mx < 45] = "dark"
    return s

URL = "https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005669/" + STILL.name

class State:
    def __init__(self):
        if not STILL.exists():
            from .fetch import Fetcher
            Fetcher(raw_dir(SID) / "manifest.jsonl").get(URL, STILL)
        self.rgb = np.asarray(Image.open(STILL).convert("RGB"))
        self.strata = strata(self.rgb)
        self.names = sorted(set(self.strata.ravel()))
        self.rng = np.random.default_rng(int.from_bytes(os.urandom(4), "little"))
        self.labels = json.loads(OUT.read_text(encoding="utf-8"))["labels"] if OUT.exists() else []

    def sample(self):
        H, W = self.strata.shape
        name = self.names[self.rng.integers(len(self.names))]                 # equal draws per stratum
        while True:
            y, x = int(self.rng.integers(CROP, H - CROP)), int(self.rng.integers(CROP, W - CROP))
            if self.strata[y, x] == name: break
        crop = Image.fromarray(self.rgb[y - CROP:y + CROP, x - CROP:x + CROP]).resize((2 * CROP * ZOOM,) * 2, Image.NEAREST)
        d = ImageDraw.Draw(crop); c = CROP * ZOOM
        for r, col in ((ZOOM + 3, "white"), (ZOOM + 4, "black")): d.rectangle((c - r, c - r, c + ZOOM + r, c + ZOOM + r), outline=col)
        ctx = Image.fromarray(self.rgb).resize((640, 360)); dc = ImageDraw.Draw(ctx)
        cx, cy = x * 640 / W, y * 360 / H; dc.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), outline="white", width=2)
        return {"x": x, "y": y, "stratum": name, "crop": _png(crop), "context": _png(ctx), "counts": self.counts()}

    def counts(self):
        return {c: sum(1 for l in self.labels if l["label"] == c) for c in CLASSES}

    def save(self):
        doc = {"image": STILL.name, "svs_id": SID, "classes": list(CLASSES), "target_per_class": TARGET,
               "strata": self.names, "labels": self.labels}
        tmp = OUT.with_suffix(".tmp"); tmp.write_text(json.dumps(doc, indent=0), encoding="utf-8"); os.replace(tmp, OUT)

def _png(im):
    b = io.BytesIO(); im.save(b, format="PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

PAGE = """<!doctype html><meta charset=utf-8><title>5669 aerosol labels</title>
<style>body{background:#111;color:#eee;font:16px system-ui;margin:16px}button{font:16px system-ui;margin:4px;padding:10px 16px}
img{image-rendering:pixelated;margin-right:12px;vertical-align:top}#c{margin:8px 0}</style>
<h1>What aerosol is at the centre square?</h1><p>SVS 5669 still (GEOS model, 19 Aug 2025 20:00 UTC). Legend: black carbon
(smoke) red, dust purple, sea salt grey-teal, sulfate green. Keys 1–5, u = undo, s = skip.</p>
<div><img id=crop width=576 height=576><img id=ctx width=640 height=360></div><div id=b></div><div id=c></div>
<script>
const C=%s;let cur=null;
const b=document.getElementById('b');C.forEach((c,i)=>{const e=document.createElement('button');e.textContent=(i+1)+' '+c;e.onclick=()=>send(c);b.appendChild(e)});
async function next(){cur=await (await fetch('/sample')).json();crop.src=cur.crop;ctx.src=cur.context;show(cur.counts)}
function show(n){document.getElementById('c').textContent=C.map(c=>c+': '+n[c]+'/%d').join('   ')}
async function send(label){const r=await fetch('/label',{method:'POST',body:JSON.stringify({x:cur.x,y:cur.y,stratum:cur.stratum,label})});show(await r.json());next()}
document.onkeydown=async e=>{const i=+e.key-1;if(i>=0&&i<C.length)send(C[i]);if(e.key=='s')next();if(e.key=='u'){show(await (await fetch('/undo',{method:'POST'})).json())}};
next();
</script>""" % (json.dumps(CLASSES), TARGET)

def handler(state):
    class H(BaseHTTPRequestHandler):
        def _send(self, body, ctype="application/json"):
            data = body.encode() if isinstance(body, str) else body
            self.send_response(200); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(data)))
            self.end_headers(); self.wfile.write(data)
        def do_GET(self):
            if self.path == "/": return self._send(PAGE, "text/html; charset=utf-8")
            if self.path == "/sample":
                with _LOCK: return self._send(json.dumps(state.sample()))
            self.send_error(404)
        def do_POST(self):
            with _LOCK:
                if self.path == "/label":
                    d = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                    if d.get("label") not in CLASSES: return self.send_error(400)
                    state.labels.append({k: d[k] for k in ("x", "y", "stratum", "label")}); state.save()
                elif self.path == "/undo" and state.labels:
                    state.labels.pop(); state.save()
                return self._send(json.dumps(state.counts()))
        def log_message(self, *a): pass
    return H

def main():
    FIXTURES.mkdir(parents=True, exist_ok=True)
    state = State()
    print(f"5669 labelling page: http://127.0.0.1:{PORT}  ({len(state.labels)} labels so far, saved to {OUT})")
    ThreadingHTTPServer(("127.0.0.1", PORT), handler(state)).serve_forever()

if __name__ == "__main__":
    main()
