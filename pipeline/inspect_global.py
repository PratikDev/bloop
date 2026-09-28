"""End-to-end check of the PUBLISHED global files, decoded the same way the browser will (independent of build_global.py).
Works on the local folder or on the live site.
Usage:  python inspect_global.py --place Dhaka
        python inspect_global.py --lat 78.2 --lon 15.6
        python inspect_global.py --place "Svalbard (Longyearbyen)" --base https://<your-site>/data/global
For --place: recomputes the annual heat/rain then->now (and the 3-deg water then->now) from the decoded files and compares
with places.json; for Bangladesh places, compares water with the demo's national record (context/grace.json)."""
import sys, json, gzip, urllib.request
import numpy as np, pandas as pd
from pathlib import Path

args = sys.argv[1:]
def arg(k, d=None): return args[args.index(k) + 1] if k in args else d
base = arg("--base")
LOCAL = Path(__file__).resolve().parent.parent / "public" / "data" / "global"
def get(name):
    if base:
        url = f"{base.rstrip('/')}/{name}"
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "jukebox-inspect"}), timeout=120) as r:
            return r.read()
    return (LOCAL / name).read_bytes()

def layer(name):
    js = json.loads(get(f"{name}.json")); raw = get(js["file"])
    try: raw = gzip.decompress(raw)
    except OSError: pass                                          # some servers decompress .gz for you
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

def win(js, s, a, z):
    ms = pd.period_range(js["month_start"], periods=js["n_months"], freq="M"); ys = np.array([m.year for m in ms])
    x = s[(ys >= a) & (ys <= z)]; return None if np.isfinite(x).sum() < 24 else round(float(np.nanmean(x)), 2)

P = json.loads(get("places.json")); places = P["places"]
p = None
if arg("--place"):
    p = next((x for x in places if x["name"].lower() == arg("--place").lower()), None)
    if p is None: sys.exit(f"Unknown place. Available: {[x['name'] for x in places]}")
    lat, lon = p["lat"], p["lon"]
else:
    lat, lon = float(arg("--lat")), float(arg("--lon"))
print(f"Location {lat}, {lon} ({'from ' + base if base else 'local files'})")
print(f"Basis: heat = {P['basis']['heat']}; rain = {P['basis']['rain']}; water = {P['basis']['water']}")
mismatch = []
for name, key, (w0, w1) in (("heat", "heat_annual_then_now", ((1981, 1990), (2016, 2025))), ("rain", "rain_annual_then_now", ((1981, 1990), (2016, 2025))),
                            ("water", "water_then_now", ((2003, 2006), (2021, 2024)))):
    js, v = layer(name)
    if p is not None and p.get(f"{name}_cell"):                      # use exactly the cell places.json used
        c = p[f"{name}_cell"]; idx, clat, clon = c["index"], c["lat"], c["lon"]
    elif p is not None and name == "water" and p.get("water_region", {}) and p["water_region"]["kind"] == "box":
        if base:
            with urllib.request.urlopen(urllib.request.Request(base.rstrip("/").rsplit("/global", 1)[0] + "/context/grace.json",
                                                               headers={"User-Agent": "jukebox-inspect"}), timeout=120) as rr:
                g = json.loads(rr.read())["boxes"]["Bangladesh"]
        else:
            g = json.loads((LOCAL.parent / "context" / "grace.json").read_bytes())["boxes"]["Bangladesh"]
        A, B = round(float(g["mean_A"]), 2), round(float(g["mean_B"]), 2)
        print(f"  water: {p['water_region']['label']}; then {A} -> now {B} {js['units']}")
        if p[key] != [A, B]: mismatch.append(f"water: places.json {p[key]} vs grace.json box {[A, B]}")
        continue
    else:
        b = cell_of(js, lat, lon, 1 if name == "heat" else 0)
        if b is None:
            print(f"  {name:5s}: no data here (plays as silence)")
            if p is not None and p.get(key) is not None: mismatch.append(f"{name}: places.json has values but no cell")
            continue
        idx, clat, clon = b[1], b[2], b[3]
    s = v[idx]; A, B = win(js, s, *w0), win(js, s, *w1)
    last = next((f"{pd.Period(js['month_start'], 'M') + i} = {s[i]:.2f}" for i in range(len(s) - 1, -1, -1) if np.isfinite(s[i])), "none")
    extra = ""
    if p is not None:
        if name == "heat" and p.get("heat_cell_is_neighbour"): extra += " [nearest land cell, not the place's own cell]"
        if p.get(f"{name}_same_record_as"): extra += f" [same record as {p[name + '_same_record_as']}]"
        if name == "water" and p.get("water_region"): extra += f" [{p['water_region']['label']}]"
    print(f"  {name:5s}: cell ({clat}, {clon}); {np.isfinite(s).sum()} months with data; latest {last} {js['units']}; then {A} -> now {B}{extra}")
    if p is not None and p.get(key) != [A, B]: mismatch.append(f"{name}: places.json {p.get(key)} vs decoded {[A, B]}")
if p is not None:
    print(f"  rain confidence: {p.get('rain_confidence')}")
    print("RESULT: " + ("PASS - decoded files match places.json" if not mismatch else f"FAIL - {mismatch}"))
    sys.exit(1 if mismatch else 0)