# Test 2: can we automatically find the latest frames (and colorbars) for each EIC product?
# Uses only the Python standard library. Run:  python t2_frame_list.py
import json, re, time, urllib.request, urllib.error, datetime as dt
from html.parser import HTMLParser

PRODUCTS = {   # SVS ID: short name (from the EIC Daily Visualizations gallery)
    5101: "Sea surface temperature (MUR)",
    4285: "Precipitation (IMERG)",
    5113: "Active fires (VIIRS)",
    5151: "PM2.5 (GEOS-CF)",
    5152: "Ozone (GEOS-CF)",
    5153: "Carbon monoxide (GEOS-CF)",
    5154: "Nitrogen oxides (GEOS-CF)",
    5147: "Near-surface temperature (GEOS-FP)",
    5148: "Near-surface wind (GEOS-FP)",
    5150: "Near-surface humidity (GEOS-FP)",
    5544: "NDVI (vegetation)",
    5176: "Sea surface temperature (second item)",
    5315: "Fire weather (experimental)",
    5584: "Landslide exposure",
}
MAX_DIRS_PER_PRODUCT = 6
HEADERS = {"User-Agent": "EarthJukebox-feasibility-test/0.1"}
TODAY = dt.datetime.now(dt.timezone.utc).date()

def get(url, timeout=60):
    t0 = time.time()
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        body = r.read()
        return body, r.headers, round(time.time() - t0, 2)

def walk(obj, found):
    if isinstance(obj, dict):
        for v in obj.values(): walk(v, found)
    elif isinstance(obj, list):
        for v in obj: walk(v, found)
    elif isinstance(obj, str) and obj.startswith("http") and "svs.gsfc.nasa.gov" in obj:
        found.add(obj)

class Links(HTMLParser):
    def __init__(self): super().__init__(); self.hrefs = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v:
                    self.hrefs.append(v)

def date_in(name):
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", name) or re.search(r"(20\d{2})(\d{2})(\d{2})", name)
    if not m: return None
    try: return dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError: return None

def frame_dir(u):
    base, rest = u.split("/frames/", 1)
    parts = [p for p in rest.split("/") if p]
    if parts and re.search(r"\.[a-z0-9]{2,4}$", parts[-1], re.I):
        parts = parts[:-1]                      # drop a file name
    return base + "/frames/" + "/".join(parts[:2]) + "/" if parts else None

inventory, rows = {}, []
for sid, name in PRODUCTS.items():
    print(f"\n=== {sid} {name}")
    rec = {"name": name}
    try:
        body, _, secs = get(f"https://svs.gsfc.nasa.gov/api/{sid}")
        data = json.loads(body)
    except Exception as e:
        print(f"  API FAILED: {e}"); rec["error"] = str(e); inventory[sid] = rec
        rows.append((sid, name, "API fail", "", "", "", "", "", "")); continue
    rec["title"] = data.get("title"); rec["update_date"] = data.get("update_date")
    print(f"  title: {rec['title']}\n  API ok in {secs}s; page update_date: {rec['update_date']}")
    urls = set(); walk(data, urls)
    frame_dirs = sorted({d for d in (frame_dir(u) for u in urls if "/frames/" in u) if d})
    colorbars = sorted(u for u in urls if re.search(r"(colorbar|bar[^/]*\.(png|tif))", u.split("/")[-1], re.I))
    images = [u for u in urls if re.search(r"\.(png|jpg|tif|tiff|exr)$", u, re.I)]
    rec.update(frame_dirs=frame_dirs, colorbars=colorbars, n_images=len(images))
    print(f"  frame folders found: {len(frame_dirs)}; colorbar files: {len(colorbars)}; image links: {len(images)}")
    for c in colorbars[:4]: print(f"    colorbar: {c}")
    newest = None; flags = set(); rec["dirs"] = []
    for d in frame_dirs[:MAX_DIRS_PER_PRODUCT]:
        try:
            body, _, secs = get(d)
            p = Links(); p.feed(body.decode("utf-8", "ignore"))
            files = [h for h in p.hrefs if re.search(r"\.(png|jpg|tif|tiff|exr)$", h, re.I)]
        except Exception as e:
            print(f"    {d} -> listing FAILED: {e}"); rec["dirs"].append({"dir": d, "error": str(e)}); continue
        last = files[-1] if files else None
        ld = date_in(last) if last else None
        tags = [t for t in ("2x1", "no-date", "nodate", "alpha", "flat") if t in d.lower()]
        flags.update(tags)
        if ld and (newest is None or ld > newest): newest = ld
        print(f"    {d}\n      {len(files)} files; last: {last}; date: {ld}; tags: {tags}; listing {secs}s")
        rec["dirs"].append({"dir": d, "n_files": len(files), "first": files[0] if files else None,
                            "last": last, "last_date": str(ld) if ld else None, "tags": tags})
    age = (TODAY - newest).days if newest else None
    rec["newest_frame_date"] = str(newest) if newest else None; rec["age_days"] = age
    inventory[sid] = rec
    rows.append((sid, name, "yes" if frame_dirs else "no", "yes" if "2x1" in flags else "?",
                 "yes" if flags & {"no-date", "nodate"} else "?", "yes" if flags & {"alpha", "flat"} else "?",
                 "yes" if colorbars else "no", str(newest) if newest else "?", str(age) if age is not None else "?"))

json.dump(inventory, open("frame_inventory.json", "w"), indent=2)
print("\n\nSUMMARY (paste this into the chat)")
print("ID | product | frames | 2:1 flat | no-date | data-only/alpha | colorbar | newest frame | age (days)")
for r in rows: print(" | ".join(map(str, r)))
print("\nSaved frame_inventory.json")
