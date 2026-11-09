"""Synthetic images for the toolkit tests: colorbars with tick marks and labels, and fields drawn with them."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from svs import ocr

def mpl(name):
    """A published matplotlib colormap as t → sRGB 0–255 (the colormaps real figures use)."""
    import matplotlib
    cm = matplotlib.colormaps[name]
    return lambda t: cm(np.clip(np.asarray(t, float), 0, 1))[..., :3] * 255

viridis, plasma, rdbu = mpl("viridis"), mpl("plasma"), mpl("RdBu_r")

def colorbar_image(cmap, labels, length=401, panel=(56, 57, 59), text=(255, 255, 255), font_px=17):
    """labels: [(position 0..1 along the strip, text)]. White outline, white tick marks inside the strip's bottom edge
    under every label, label text centred under its tick."""
    x0, y0, y1 = 100, 40, 74
    x1 = x0 + length - 1
    W, H = x1 + 100, 130
    img = np.zeros((H, W, 4), np.uint8); img[..., :3] = panel; img[..., 3] = 255
    n = x1 - x0 + 1
    img[y0:y1 + 1, x0:x1 + 1, :3] = np.round(cmap(np.arange(n) / (n - 1)))[None].astype(np.uint8)
    img[y0 - 2:y0, x0 - 2:x1 + 3, :3] = 255; img[y1 + 1:y1 + 3, x0 - 2:x1 + 3, :3] = 255
    img[y0 - 2:y1 + 3, x0 - 2:x0, :3] = 255; img[y0 - 2:y1 + 3, x1 + 1:x1 + 3, :3] = 255
    im = Image.fromarray(img); d = ImageDraw.Draw(im)
    font = ImageFont.truetype(ocr._fonts()[0], font_px)
    for t, s in labels:
        x = x0 + t * (n - 1)
        if 2 < t * (n - 1) < n - 3: d.rectangle([round(x) - 1, y1 - 6, round(x) + 1, y1], fill=(255, 255, 255, 255))
        w = d.textlength(s, font=font)
        d.text((x - w / 2, y1 + 8), s, fill=text + (255,), font=font)
    return np.asarray(im)

def field_pixels(cmap, t):
    return np.round(cmap(t)).astype(np.uint8)
