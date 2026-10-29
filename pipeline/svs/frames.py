"""Frames: decoding (whole files or a PNG prefix holding only the top rows), movie extraction with ffmpeg, and the
frame → time mapping. Time methods, in order of preference (the method is always recorded):
  a "date-list"  — the SVS per-frame date list (e.g. 3912's flat_ecco2_dates.txt);
  b "ocr"        — a burned-in date label read by OCR (svs/ocr.py), checked by eye on 10 random frames;
  c "linear"     — the stated period ÷ frame count, labelled approximate."""
import datetime as dt, io, json, re, shutil, struct, subprocess, threading, zlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageFile

_TRUNCATED = threading.Lock()        # Pillow's LOAD_TRUNCATED_IMAGES is process-wide: one decode at a time

PNG_SIG = b"\x89PNG\r\n\x1a\n"
CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}       # PNG colour type → samples per pixel

def read_rgba(path):
    """Any frame file → uint8 RGBA array (TIF/PNG/JPG via Pillow)."""
    return np.asarray(Image.open(path).convert("RGBA"))

def png_header(data):
    if data[:8] != PNG_SIG: raise ValueError("not a PNG")
    w, h, depth, ctype, _, _, interlace = struct.unpack(">IIBBBBB", data[16:29])
    return w, h, depth, ctype, interlace

def png_rows_available(data):
    """How many complete rows a PNG prefix holds (non-interlaced, 8-bit): decompress every IDAT byte present."""
    w, h, depth, ctype, interlace = png_header(data)
    if interlace or depth != 8: raise ValueError("row-band decoding needs a non-interlaced 8-bit PNG")
    stride = 1 + w * CHANNELS[ctype]
    d, pos, raw = zlib.decompressobj(), 8, 0
    while pos + 8 <= len(data):
        n, typ = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8: pos + 8 + n]
        if typ == b"IDAT": raw += len(d.decompress(body))
        if typ == b"IEND" or len(body) < n: break
        pos += 12 + n
    return min(h, raw // stride)

def png_top_rows(data):
    """Decode a PNG prefix → (RGBA array of the complete top rows, n_rows). Pillow decodes what is there; the rows
    beyond the prefix are discarded, never guessed."""
    n = png_rows_available(data)
    with _TRUNCATED:
        prev = ImageFile.LOAD_TRUNCATED_IMAGES
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        try:
            im = Image.open(io.BytesIO(data)); im.load()
            arr = np.asarray(im.convert("RGBA"))
        finally:
            ImageFile.LOAD_TRUNCATED_IMAGES = prev
    return arr[:n].copy(), n

def times_linear(start, end, n):
    """Method c: n frames evenly spanning [start, end] (both inclusive)."""
    step = (end - start) / (n - 1)
    return [start + i * step for i in range(n)], step

def times_from_list(text):
    """Method a: '<frame number> <ISO time>' lines → {frame number: datetime (UTC)}."""
    out = {}
    for line in text.splitlines():
        m = re.match(r"\s*(\d+)\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)Z?", line)
        if m:
            t = dt.datetime.fromisoformat(m.group(2)).replace(tzinfo=dt.timezone.utc)
            out[int(m.group(1))] = t
    return out

def frame_number(name):
    """Trailing frame number of a frame file name ('..._0123.png', '...23000.tif')."""
    m = re.search(r"(\d+)\.(?:png|tif|tiff|jpg|exr)$", name, re.I)
    return int(m.group(1)) if m else None

def ffmpeg_tools():
    return shutil.which("ffmpeg"), shutil.which("ffprobe")

def probe_movie(path):
    """Native frame rate and frame count (ffprobe counts packets; no decoding)."""
    _, ffprobe = ffmpeg_tools()
    if not ffprobe: raise RuntimeError("ffprobe not installed")
    out = subprocess.run([ffprobe, "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                          "stream=r_frame_rate,nb_read_packets,width,height", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True)
    s = json.loads(out.stdout)["streams"][0]
    num, den = map(int, s["r_frame_rate"].split("/"))
    return {"fps": num / den, "frames": int(s["nb_read_packets"]), "width": s["width"], "height": s["height"]}

def extract_movie(path, out_dir: Path, start=0, count=None):
    """Frames at the native rate as lossless PNG (frame_%06d.png, numbered from `start`)."""
    ffmpeg, _ = ffmpeg_tools()
    if not ffmpeg: raise RuntimeError("ffmpeg not installed")
    out_dir.mkdir(parents=True, exist_ok=True)
    cmd = [ffmpeg, "-v", "error", "-i", str(path), "-vsync", "0", "-start_number", str(start)]
    if count: cmd += ["-frames:v", str(count)]
    subprocess.run(cmd + [str(out_dir / "frame_%06d.png")], check=True)
    return sorted(out_dir.glob("frame_*.png"))
