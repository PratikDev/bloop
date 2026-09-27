"""Find the tick marks on an SST colorbar image and draw a check image, so -5 C / 35 C positions come from the
image itself (independent of the MUR fit). Usage: python find_sst_ticks.py <colorbar.png>
Output: printed tick positions + work/ticks_<name>.png (zoomed strip with markers):
  short green marks along the TOP edge = detected tick positions; red dashed lines = where the MUR fit puts -5 C and 35 C."""
import sys, json
from common import *
from PIL import Image, ImageDraw
from compare_sst_colorbar import detect_strip, row_strip

def main():
    if len(sys.argv) < 2: raise SystemExit("Usage: python find_sst_ticks.py <colorbar.png>")
    path = Path(sys.argv[1]); P = load_params(); c = P["sst"]
    tmpl = row_strip(PIPE / c["colorbar_file"], int(c["start"]), int(c["end"]), int(c["across"]))
    det = detect_strip(path, tmpl)
    if det is None: raise SystemExit("Colour strip not found in this image - paste this.")
    xs, xe, across, (top, bot) = det
    im = Image.open(path).convert("RGBA"); a = np.asarray(im).astype(np.float32)
    rgb, alpha = a[:, :, :3], a[:, :, 3]
    H, W = alpha.shape
    results = {}
    for side, rows in (("below", range(bot + 2, min(H, bot + 25))), ("above", range(max(0, top - 25), top - 1))):
        rows = list(rows)
        if not rows: continue
        region = rgb[rows, :, :]; ra = alpha[rows, :]
        bg = np.median(region.reshape(-1, 3), axis=0)
        ink = (np.sqrt(((region - bg) ** 2).sum(2)) > 80) & (ra > 128)
        prof = ink.sum(0).astype(float)                   # ink pixels per column in the band next to the strip
        thr = max(3, 0.5 * prof[xs - 20: xe + 20].max()) if prof[xs - 20: xe + 20].max() > 0 else 1e9
        cols = np.where(prof >= thr)[0]
        cols = cols[(cols >= xs - 30) & (cols <= xe + 30)]
        ticks = []
        for x in cols:                                     # merge neighbouring columns into one tick centre
            if ticks and x - ticks[-1][-1] <= 2: ticks[-1].append(x)
            else: ticks.append([x])
        centres = [float(np.mean(t)) for t in ticks if len(t) <= 12]   # ticks are thin; wide blobs are text
        results[side] = centres
        sp = np.diff(centres) if len(centres) > 1 else []
        print(f"{side:5s} the strip: {len(centres)} thin marks at x = {[round(x,1) for x in centres]}")
        if len(sp): print(f"       spacing: {np.round(sp,1).tolist()}")
    fit = None
    dj = WORK / "sst_strip_diagnosis.json"
    if dj.exists() and path.resolve() == (PIPE / c["colorbar_file"]).resolve():
        f = json.load(open(dj))["fit"]; fit = (f["x_minus5"], f["x_35"])
        print(f"MUR fit (this file): -5 C at x = {fit[0]:.1f}, 35 C at x = {fit[1]:.1f}")
    # check image: crop around the strip, 3x zoom
    pad = 60; x0, x1, y0, y1 = max(0, xs - pad), min(W, xe + pad), max(0, top - pad), min(H, bot + pad)
    crop = im.crop((x0, y0, x1, y1)); bgw = Image.new("RGBA", crop.size, (255, 255, 255, 255)); bgw.alpha_composite(crop)
    z = 2 if crop.size[0] > 2500 else 3
    big = bgw.resize((crop.size[0] * z, crop.size[1] * z), Image.NEAREST); d = ImageDraw.Draw(big)
    for side in results.values():
        for x in side: d.line([((x - x0) * z, 0), ((x - x0) * z, 12)], fill=(0, 170, 0, 255), width=3)
    if fit:
        for x in fit:
            X = (x - x0) * z
            for yy in range(0, big.size[1], 12): d.line([(X, yy), (X, yy + 6)], fill=(220, 0, 0, 255), width=2)
    out = WORK / f"ticks_{path.stem}.png"; big.convert("RGB").save(out)
    print(f"Saved {out} - open it: green marks on the top edge = detected ticks, red dashed = MUR-fit -5/35 positions")
    write_json(WORK / f"ticks_{path.stem}.json", {"file": path.name, "strip": [xs, xe, across, top, bot], "marks": results, "mur_fit": fit})

if __name__ == "__main__":
    main()
