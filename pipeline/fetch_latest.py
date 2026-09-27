"""Step 1: download the newest SST (SVS 5101) and rain (SVS 4285 flatalpha) frames + current colorbars.
Writes pipeline/raw/manifest.json. Usage: python fetch_latest.py [--list-only]"""
import sys, json, re
from html.parser import HTMLParser
from common import *

class Links(HTMLParser):
    def __init__(self): super().__init__(); self.hrefs = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v and not v.startswith(("?", "http", "#")):
                    self.hrefs.append(v)

def walk(obj, out):
    if isinstance(obj, dict):
        for v in obj.values(): walk(v, out)
    elif isinstance(obj, list):
        for v in obj: walk(v, out)
    elif isinstance(obj, str) and obj.startswith("http") and "svs.gsfc.nasa.gov" in obj:
        out.add(obj)

def frame_dir(u):
    base, rest = u.split("/frames/", 1)
    parts = [p for p in rest.split("/") if p]
    if parts and re.search(r"\.[a-z0-9]{2,4}$", parts[-1], re.I):
        parts = parts[:-1]
    return base + "/frames/" + "/".join(parts[:2]) + "/" if parts else None

def frame_folders(svs_id):
    data = json.loads(http_get(f"https://svs.gsfc.nasa.gov/api/{svs_id}"))
    urls = set(); walk(data, urls)
    dirs = sorted({d for d in (frame_dir(u) for u in urls if "/frames/" in u) if d})
    return data, dirs

def list_files(folder):
    p = Links()
    p.feed(http_get(folder).decode("utf-8", "ignore"))
    return [
        h.rsplit("/", 1)[-1]
        for h in p.hrefs
        if re.search(r"\.(png|exr|tif|tiff|jpg)$", h, re.I)
    ]

def pick_folder(dirs, must, must_not):
    ok = [d for d in dirs if all(m in d.lower() for m in must) and not any(x in d.lower() for x in must_not)]
    return ok

def newest(files):
    dated = [(date_in(f), f) for f in files]
    if all(d is not None for d, _ in dated) and dated:
        return max(dated)[1], max(dated)[0]
    return sorted(files)[-1], None

def main():
    P = json.load(open(PIPE / "lut_params.json"))
    manifest = {"fetched_utc": now_utc(), "products": {}}
    for product in ("sst", "rain"):
        cfg = P[product]
        data, dirs = frame_folders(cfg["svs_id"])
        cand = pick_folder(dirs, cfg["folder_must_contain"], cfg["folder_must_not_contain"])
        print(f"\n[{product}] SVS {cfg['svs_id']}: '{data.get('title')}'  (page updated {data.get('update_date')})")
        print(f"  frame folders found: {len(dirs)}; matching {cfg['folder_must_contain']}: {len(cand)}")
        for d in cand: print(f"    {d}")
        if not cand:
            print("  All folders:"); [print("    " + d) for d in dirs]
            raise SystemExit(f"No folder matched for {product}. Paste this output.")
        folder = cand[0]
        files = list_files(folder)
        name, when = newest(files)
        if when is None and "no-dates" in folder:            # frame names carry no date: read it from the dated twin folder
            try:
                twin = folder.replace("_no-dates", "").replace("-no-dates", "")
                tname, when = newest(list_files(twin))
                print(f"  (time taken from dated twin folder: {tname})")
            except Exception as e:
                print(f"  WARNING: could not read the frame time from a dated folder ({e})")
        print(f"  using folder: {folder}\n  files in folder: {len(files)}; newest: {name}  (time {when})")
        if "--list-only" in sys.argv:
            continue
        local = RAW / safe_name(f"{product}_{name}")
        download(folder + name, local)
        age_h = (dt.datetime.now(dt.timezone.utc) - when).total_seconds() / 3600 if when else None
        print(f"  saved {local.name} ({local.stat().st_size/1e6:.1f} MB); age {age_h:.1f} h" if age_h is not None else f"  saved {local.name}")
        manifest["products"][product] = {"svs_id": cfg["svs_id"], "folder": folder, "file_url": folder + name,
                                          "local": str(local.relative_to(PIPE)), "frame_time_utc": when.strftime("%Y-%m-%dT%H:%M:%SZ") if when else None,
                                          "age_hours": round(age_h, 1) if age_h is not None else None, "sha256": sha256(local),
                                          "n_files_in_folder": len(files)}
    if "--list-only" in sys.argv:
        return
    # current colorbars vs the verified local copies
    ref = P["sst"].get("colorbar_online_reference", {}).get("file") or P["sst"]["colorbar_file"]
    checks = [("sst", P["sst"]["colorbar_url"], PIPE / ref)]
    for phase in ("liquid", "frozen"):
        for bg in ("white", "black"):
            f = PIPE / P["rain"]["colorbars"][phase][bg]
            checks.append((f"rain-{phase}-{bg}", P["rain"]["colorbar_url_base"] + f.name, f))
    manifest["colorbars"] = {}
    print("\nColorbar check (current online copy vs the verified local copy):")
    for key, url, local in checks:
        try:
            cur = download(url, RAW / f"current_{local.name}", force=True)
            same = local.exists() and sha256(cur) == sha256(local)
            status = "SAME" if same else ("CHANGED - re-verify before publishing!" if local.exists() else "no local verified copy")
        except Exception as e:
            status = f"could not download ({e}); using the verified local copy"
        manifest["colorbars"][key] = status
        print(f"  {key:22s} {status}")
    write_json(RAW / "manifest.json", manifest)
    print("\nSaved raw/manifest.json")
    changed = [k for k, v in manifest["colorbars"].items() if v.startswith("CHANGED")]
    if changed and "--allow-changed" not in sys.argv:
        print(f"STOP: colorbar(s) changed: {changed}. Re-verify before publishing (see the L1 guide).")
        sys.exit(2)

if __name__ == "__main__":
    main()