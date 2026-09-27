from compare_sst_colorbar import *
from PIL import Image

P = load_params()
c = P["sst"]
local = PIPE / c["colorbar_file"]
new = RAW / "current_sst_colorbar.png"

v_rgb = row_strip(local, int(c["start"]), int(c["end"]), int(c["across"]))
dl = detect_strip(local, v_rgb)
dn = detect_strip(new, v_rgb)

ds, de, da, _ = dl
ns, ne, na, _ = dn

full_l = row_strip(local, ds, de, da)
full_n = row_strip(new, ns, ne, na)

a = resample(full_l)
b = resample(full_n)
dist = np.sqrt(((a - b) ** 2).sum(1))

print(f"Local strip: {ds}..{de}")
print(f"New strip:   {ns}..{ne}")
print(f"Median: {np.median(dist):.2f}")
print(f"P95:    {np.percentile(dist,95):.2f}")
print(f"Max:    {dist.max():.2f}")

print("\nWorst 20 positions:")
for d, i in sorted(
    [(float(d), int(i)) for i, d in enumerate(dist)],
    reverse=True
)[:20]:
    print(f"  position {i}/999 ({i/999:.3f})  RGB distance {d:.2f}")

print("\nDistance by 10% segment:")
for j in range(10):
    lo = int(j * 100)
    hi = int((j + 1) * 100)
    x = dist[lo:hi]
    print(
        f"  {j*10:2d}-{(j+1)*10:3d}%: "
        f"median {np.median(x):.2f}, "
        f"P95 {np.percentile(x,95):.2f}, "
        f"max {x.max():.2f}"
    )
