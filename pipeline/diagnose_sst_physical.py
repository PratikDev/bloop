from compare_sst_colorbar import *

P = load_params()
c = P["sst"]
local = PIPE / c["colorbar_file"]
new = RAW / "current_sst_colorbar.png"

v_rgb = row_strip(local, int(c["start"]), int(c["end"]), int(c["across"]))

ds, de, da, _ = detect_strip(local, v_rgb)
ns, ne, na, _ = detect_strip(new, v_rgb)

f0, f1 = 0.05, 0.95

ls = int(round(ds + f0 * (de - ds)))
le = int(round(ds + f1 * (de - ds)))
ts = int(round(ns + f0 * (ne - ns)))
te = int(round(ns + f1 * (ne - ns)))

local_rgb = row_strip(local, ls, le, da)
new_rgb = row_strip(new, ts, te, na)

local_vals = strip_values(len(local_rgb), c["vmin"], c["vmax"], "linear")
new_vals = strip_values(len(new_rgb), c["vmin"], c["vmax"], "linear")

idx, dist = nearest(
    new_rgb.astype(np.float32),
    local_rgb.astype(np.float32)
)
implied = local_vals[idx.astype(np.int64)]
expected = new_vals

dT = np.abs(implied - expected)

print(f"Interior local: {ls}..{le}")
print(f"Interior new:   {ts}..{te}")
print("Physical mapping difference:")
print(f"  median |dT| = {np.median(dT):.4f} C")
print(f"  P95          = {np.percentile(dT,95):.4f} C")
print(f"  P99          = {np.percentile(dT,99):.4f} C")
print(f"  max          = {dT.max():.4f} C")
