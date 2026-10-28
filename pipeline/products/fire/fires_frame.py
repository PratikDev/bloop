"""SVS 5113 VIIRS active fires → latest/fires.webp (display only: its hot pixels agree only moderately with FIRMS, so
no values are read from it) + fires.json (frame time, source file, credit).
Usage (from pipeline/): python -m products.fire.fires_frame"""
from datetime import datetime
from PIL import Image
from common import PUBLIC
from core.ref import T
from core.header import header, publish_json, iso
from core.log import say, main_guard

DISPLAY_W = 2048

def main():
    info, files, _ = T.svs_pick(5113, prefer=("VIIRS_fires_latest",), exts=(".png",))
    url = next(u for u in files if "VIIRS_fires_latest" in u)
    dest = T.OUT / "samples" / "5113_VIIRS_fires_latest.png"; dest.unlink(missing_ok=True)
    img = Image.open(T.download(url, dest, max_mb=150)).convert("RGBA")
    img.resize((DISPLAY_W, DISPLAY_W // 2), Image.LANCZOS).save(PUBLIC / "latest" / "fires.webp", quality=88)
    say(f"5113 {url.split('/')[-1]} {img.size} → latest/fires.webp; newest dated frame {info.get('newest_time')}")
    t = iso(datetime.fromisoformat(info["newest_time"])) if info.get("newest_time") not in (None, "None") else iso(T.last_modified(url))
    publish_json("latest/fires.json", {
        **header("fires_frame", t), "svs_id": 5113, "svs_page": "https://svs.gsfc.nasa.gov/5113/", "frame_time_utc": t,
        "frame_time_source": f"newest dated file in the SVS 5113 frame folders ({info.get('age_source')})",
        "source_file": url.split("/")[-1], "display": {"file": "fires.webp", "width": DISPLAY_W, "height": DISPLAY_W // 2},
        "values_read": False,
    })

if __name__ == "__main__":
    main_guard(main)
