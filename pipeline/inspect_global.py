"""End-to-end check of the PUBLISHED global files, decoded the same way the browser will (independent of build_global.py's
in-memory arrays). Works on the local folder or on the live site.
Usage:  python inspect_global.py --place Dhaka
        python inspect_global.py --lat 78.2 --lon 15.6
        python inspect_global.py --place "Svalbard (Longyearbyen)" --base https://<your-site>/data/global
Checks: the then/now numbers recomputed from the decoded files equal places.json (for --place)."""
import sys, json, gzip, urllib.request
import numpy as np, pandas as pd
from pathlib import Path

args = sys.argv[1:]
def arg(k, d=None): return args[args.index(k) + 1] if k in args else d
base = arg("--base")
LOCAL = Path(__file__).resolve().parent.parent / "public" / "data" / "global"
def get(name):
    if base:
        with urllib.request.urlopen(urllib.request.Request(f"{base.rstrip('/')}/{name}", headers={"User-Agent": "jukebox-inspect"}), timeout=120) as r:
            return r.read()
    return (LOCAL / name).read_bytes()

def layer(name):
    js = json.loads(get(f"{name}.json"))
    raw = get(js["file"])
    try: raw = gzip.decompress(raw)
    except OSError: pass                         # some servers decompress .gz for you
    v = np.frombuffer(raw, dtype="<i2").reshape(len(js["cells"]), js["n_months"]).astype(np.float32)
    nod = v == -32768; v = v / js["scale"]; v[nod] = np.nan
    return js, v

def cell_of(js, lat, lon, steps):
    la, lo = np.array(js["grid"]["lat"]), np.array(js["grid"]["lon"]); W = len(lo)
    r = int(np.argmin(np.abs(la - lat))); c = int(np.argmin(np.abs(((lo - lon + 180) % 360) - 180)))
    cells = {cid: i for i, cid in enumerate(js["cells"])}; best = None
    for dr in range(-steps, steps + 1):
        for dc in range(-steps, steps + 1):
            rr, cc = r + dr, (c + dc) % W
            if 0 <= rr < len(la) and rr * W + cc in cells and (best is None or dr*dr+dc*dc < best[0]):
                best = (dr*dr+dc*dc, cells[rr * W + cc], la[rr], lo[cc])
    return best

places = json.loads(get("places.json"))["places"]
if arg("--place"):
    p = next((x for x in places if x["name"].lower() == arg("--place").lower()), None)
    if p is None: sys.exit(f"Unknown place. Available: {[x['name'] for x in places]}")
    lat, lon = p["lat"], p["lon"]
else:
    p = None; lat, lon = float(arg("--lat")), float(arg("--lon"))
print(f"Location {lat}, {lon} ({'from ' + base if base else 'local files'})")
mismatch = []
for name, steps, (w0, w1) in (("heat", 1, ((1981, 1990), (2016, 2025))), ("rain", 0, ((1981, 1990), (2016, 2025))), ("water", 0, ((2003, 2006), (2021, 2024)))):
    js, v = layer(name); b = cell_of(js, lat, lon, steps)
    if b is None: print(f"  {name:5s}: no data here (plays as silence)"); continue
    s = v[b[1]]; ms = pd.period_range(js["month_start"], periods=js["n_months"], freq="M"); ys = np.array([m.year for m in ms])
    def win(a, z):
        x = s[(ys >= a) & (ys <= z)]; return None if np.isfinite(x).sum() < 24 else round(float(np.nanmean(x)), 2)
    A, B = win(*w0), win(*w1)
    last = next((f"{ms[i]} = {s[i]:.2f}" for i in range(len(s) - 1, -1, -1) if np.isfinite(s[i])), "none")
    print(f"  {name:5s}: cell ({b[2]}, {b[3]}); {np.isfinite(s).sum()} months with data; latest {last} {js['units']}; "
          f"then {A} -> now {B}")
    if p is not None and f"{name}_then_now" in p and p[f"{name}_then_now"] != [A, B]:
        mismatch.append(f"{name}: places.json {p[name + '_then_now']} vs decoded {[A, B]}")
if p is not None:
    print(f"  rain confidence: {p.get('rain_confidence')}")
    print("RESULT: " + ("PASS - decoded files match places.json" if not mismatch else f"FAIL - {mismatch}"))
    sys.exit(1 if mismatch else 0)