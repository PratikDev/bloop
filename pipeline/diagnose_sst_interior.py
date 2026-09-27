from compare_sst_colorbar import *

P = load_params()
c = P["sst"]
local = PIPE / c["colorbar_file"]
new = RAW / "current_sst_colorbar.png"

v_rgb = row_strip(local, int(c["start"]), int(c["end"]), int(c["across"]))
ds, de, da, _ = detect_strip(local, v_rgb)
ns, ne, na, _ = detect_strip(new, v_rgb)

full_l = row_strip(local, ds, de, da)
full_n = row_strip(new, ns, ne, na)

a = resample(full_l)
b = resample(full_n)
dist = np.sqrt(((a - b) ** 2).sum(1))

for lo, hi in [(0.02,0.98),(0.05,0.95),(0.10,0.90)]:
    i0 = int(lo * 999)
    i1 = int(hi * 999) + 1
    x = dist[i0:i1]
    print(
        f"{lo*100:.0f}-{hi*100:.0f}%: "
        f"median {np.median(x):.2f}, "
        f"P95 {np.percentile(x,95):.2f}, "
        f"max {x.max():.2f}"
    )
