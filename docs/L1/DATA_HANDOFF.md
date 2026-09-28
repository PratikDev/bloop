# L1 Data Handoff

This is **the one document** describing L1's data for the team. **L3** loads and decodes the files; **L2**'s engine only receives numbers from L3 (it never loads data files); **L4** uses the wording. Every shape here is typed in `src/types/data-contract.ts` (section numbers given below); if this document and the contract ever disagree, **the contract wins**. Tell L1 and we'll fix this document.

**Where the code lives:** the decoders are already implemented in **`src/lib/data/`** (`latest.ts`, `sequence.ts`, `grid.ts`), and number formatting in **`src/lib/i18n/format.ts`**. The code snippets below are a **reference spec only**, so you can check an implementation against them. **Don't paste them into the app**; there must be only one copy.

---

## 1. Status at a glance

All data is live on the site under **`/data/...`** (source files: `public/data/`).

| Data | Files | Contract | Status for Video 1 (freeze Tue 29, 12:00) |
|---|---|---|---|
| Latest SST frame | `latest/sst.bin`, `sst.json`, `sst.webp` | §1 | **Core, use it** |
| Latest rain frame | `latest/rain.bin`, `rain_phase.bin`, `rain.json`, `rain.png` | §1 | **Core, use it** |
| Storm time-lapse (48 × 30 min) | `sequence/index.json`, `rain_NNN.u8.gz`, `rain_NNN.png`, `rain_NNN.json` | §2 | **Core, use it** |
| Dhaka then vs now (killer demo) | `demo/dhaka_then_now.json` | §9 | **Core, use it** |
| Bangladesh cities then vs now | `demo/cities_then_now.json` | §13 | **Available.** L3 builds a `ThenNowInput` per city and calls `playThenNow`; no L2 change (see `docs/L2/AUDIO_API.md`) |
| Climate context (GISTEMP, GPCP, GPCC) | `context/gistemp_bd.json`, `gpcp_bd.json`, `gpcc_bd.json` | §4 | Available (History/Compare) |
| GRACE water | `context/grace.json` | §5 | Available (demo water, bass voice) |
| FIRMS fires | `context/firms.json` | §6 | Available |
| NDVI | `context/ndvi.json` | §7 | Available |
| GLOBE observations | `context/globe_bd.json` | §8 | Available |
| Bangladesh ensemble | `context/ensemble_bd.json` | §11 | **Cut for Video 1** (decision D11, `docs/L2/BUILD_PLAN.md` §12). The file stays; after the freeze |
| GLOBE duet teaser | `context/globe_duet.json` | §12 | **Cut for Video 1** (D11, `docs/L2/BUILD_PLAN.md` §12). The file stays; after the freeze |
| Global history cube | `global/*` | §14 | **Post-freeze.** Optional, load lazily |
| Truth-panel images | `truth/sst_compare.png`, `rain_compare.png`, `crosscheck.png` | not typed (images) | Core |

Not used anywhere: **NASA POWER** (it failed our cross-check against independent records).

---

## 2. Rules for every lane

1. **Never hard-code numbers.** Every number shown or played comes from these files (truth panel, captions, then vs now).
2. **Read `width`/`height` from the matching `.json`.** Never hard-code grid sizes.
3. **Missing data is `null`, never `NaN`** (the contract's `ValueAtResult`). Missing data plays as **silence**.
4. **Negative numbers use the true minus sign "−" (U+2212), and a value that rounds to zero has no sign** (`0%`, `0.00`, never `−0`), exactly as the pipeline writes captions. Format any number you show yourself with **`src/lib/i18n/format.ts`**. The reference spec below shows the required behaviour.
5. **Captions are shown as-is.** They already follow TEAM_BUILD_PLAN Section 16. Don't re-format them.
6. **Always show each frame's own time** (`frame_time_utc`). Rain `frame_time_utc` is **the start** of the 30-minute period.
7. **Show credits:** every JSON has a `credit` string; put them in the footer or credits panel.
8. **Same grid cell = same record.** Where a file says `same_record_as` / `shares_cell_with`, don't present those places as separate findings.

```ts
// REFERENCE SPEC ONLY. The app's implementation is src/lib/i18n/format.ts; check it behaves like this.
// Same rules as pipeline/build_demo.py signed().
export function fmtSigned(x: number, digits: number): string {   // "+1.37", "−9", "0", "0.00"
  const s = (x >= 0 ? "+" : "") + x.toFixed(digits);
  return Number(s) === 0 ? Math.abs(x).toFixed(digits) : s.replace("-", "\u2212");
}
export function fmtNumber(x: number, digits: number): string {   // "−4", "34", "0" (no plus sign, never "−0")
  const s = x.toFixed(digits);
  return Number(s) === 0 ? Math.abs(x).toFixed(digits) : s.replace("-", "\u2212");
}
// Expected: fmtSigned(-9,0) "−9" · fmtSigned(1.37,2) "+1.37" · fmtSigned(-0.001,2) "0.00"
//           fmtNumber(-4,0) "−4" · fmtNumber(-0.4,0) "0" · fmtNumber(-0.001,2) "0.00"
```

---

## 3. Latest frames: decoding (reference spec; implemented in `src/lib/data/`: `latest.ts`, `sequence.ts`, `grid.ts`)

Grids: little-endian, row 0 = 90°N, column 0 = 180°W, equirectangular.

| File | Size (read from JSON) | Encoding |
|---|---|---|
| `latest/sst.bin` | 1024 × 512, Uint16 | °C = code / 1000 − 5; **65535 = land/no data** |
| `latest/rain.bin` | 1800 × 900, Uint16 | 0 = dry; 65535 = no data; else mm/h = 10^((code − 1)/20000 − 1) |
| `latest/rain_phase.bin` | 1800 × 900, Uint8 | 0 dry, 1 liquid, 2 frozen (no "no data" code: check `rain.bin` first) |
| `sequence/rain_NNN.u8.gz` | 1200 × 600, Uint8, gzip | 0 dry; 255 no data; 1–127 liquid, 128–254 frozen (formula below) |

```ts
// REFERENCE SPEC ONLY: the app's code is in src/lib/data/ (latest.ts, sequence.ts, grid.ts). Don't paste a second copy.
import type { RainPhase, RainValue } from "@/types/data-contract";

export async function loadU16(url: string): Promise<Uint16Array> {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const out = new Uint16Array(buf.byteLength / 2);
  for (let i = 0; i < out.length; i++) out[i] = dv.getUint16(i * 2, true); // explicit little-endian
  return out;
}

export async function loadU8(url: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

export function cellIndex(lat: number, lon: number, width: number, height: number): number {
  const row = Math.min(height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * height)));
  const col = Math.min(width - 1, Math.max(0, Math.floor(((lon + 180) / 360) * width)));
  return row * width + col;
}

// °C; null = land/no data
export const decodeSst = (u: number): number | null => (u === 65535 ? null : u / 1000 - 5);

// mm/h; 0 = dry, null = no data
export const decodeRain = (u: number): number | null =>
  u === 0 ? 0 : u === 65535 ? null : Math.pow(10, (u - 1) / 20000 - 1);

// Phase: check rain.bin first (rain_phase.bin has no "no data" code)
export const rainPhase = (rainCode: number, phaseByte: number): RainPhase =>
  rainCode === 65535 ? "nodata" : rainCode === 0 ? "dry" : phaseByte === 2 ? "frozen" : "liquid";

// Time-lapse frame: 1 byte per cell, gzipped. Width/height from sequence/index.json.
export async function loadSequenceFrame(url: string): Promise<Uint8Array> {
  const stream = (await fetch(url)).body!.pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Returns the contract's RainValue shape.
export function decodeRainU8(code: number): RainValue {
  if (code === 0) return { track: "rain", mmPerHour: 0, phase: "dry" };
  if (code === 255) return { track: "rain", mmPerHour: null, phase: "nodata" };
  const frozen = code >= 128;
  const base = frozen ? 128 : 1;
  return { track: "rain", mmPerHour: Math.pow(10, -1 + ((code - base) / 126) * Math.log10(500)), phase: frozen ? "frozen" : "liquid" };
}
```

**Display images:** `latest/sst.webp` (2048 × 1024), `latest/rain.png` (keeps transparency: draw it over the basemap), `sequence/rain_NNN.png` (palette-compressed, display only). **Values always come from the grids, never from image pixels.**

**Time-lapse:** `sequence/index.json` lists 48 frames, oldest → newest, normally 30 minutes apart. Show each frame's own `time_utc`, because steps can be irregular.

---

## 4. Truth panel (data-driven wording)

Read from `latest/sst.json`: `verified`, `calibration`, `latest_check` (optional: only present if the frame was re-checked).
Read from `latest/rain.json`: `verified`, `latest_check` (optional).

**SST template:**
> "Colour scale checked against NASA MUR SST: the frame's colours match {lo}…{hi} °C (the legend reads {legend}). Median error {verified.value} °C ({verified.n_points} points)."

- `{lo}`, `{hi}` = `calibration.value_at_ticks_C[0]` and `[1]`, formatted with `src/lib/i18n/format.ts` (no plus sign, minus as "−"), which currently gives **−4** and **34**.
- `{legend}` = `calibration.legend_labels` formatted for display: `legend_labels.replace(" C", "").replace("..", "…").replace(/-/g, "\u2212")`, which turns "-5..35 C" into "−5…35".
- If `latest_check?.pass`, append: *" Also checked on the {latest_check.date} frame: median error {latest_check.median_abs.toFixed(2)} °C."*
- **Current values (as of the last refresh):** `verified.value` 0.31 °C (60 points); `latest_check` 0.32 °C on 2026-09-25. **They change with each refresh**, which is why they're read, not typed.

**Rain template:**
> "Checked against NASA {verified.matched_run} run: typically within ~{verified.approx_percent}% ({verified.n_points} rain points, one frame); agreed on where it was raining at every sampled point."

- Use the last clause only if `verified.agreement === 1`. Otherwise say *"agreed on rain vs no rain at {Math.round(verified.agreement*100)}% of sampled points"*.
- If `latest_check?.pass`, append: *" The newest frame was also checked against IMERG {latest_check.imerg_run} and passed."*
- **Current values:** `matched_run` "IMERG Late", `approx_percent` 27, `n_points` 150, `agreement` 1.0. The newest frames usually match **IMERG Early** (`latest_check.imerg_run`).

**Truth images:** `truth/sst_compare.png` (Check C scatter), `truth/rain_compare.png` (D2 scatter), `truth/crosscheck.png` (why POWER was dropped).

---

## 5. Then vs Now

**Dhaka demo (`demo/dhaka_then_now.json`, §9):** show `heat.caption`, `rain.caption`, `water.caption` **as-is**. Current text (exactly Section 16):
- "Dhaka, April–May: +1.37 °C (NASA GISTEMP, 1981–1990 vs 2016–2025, 10 years each)."
- "Dhaka, June–September: not wetter. GPCP −9% (1981–1990 vs 2016–2025); rain gauges (GPCC) −12% (1981–1990 vs 2010–2019)."
- "Water storage (GRACE): Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm (2003–06 vs 2021–24). Silence = no satellite measurements (Jul 2017–May 2018)."

The optional `honesty_beat` can be shown as one caption. `not_claimed` lists what we don't claim ("more erratic rain").

**Cities (`demo/cities_then_now.json`, §13):** Dhaka, Chattogram, Rajshahi, Sylhet. Same windows and caption templates as Dhaka.
- **Only Dhaka is `cross_checked: true`.** Label the others "computed, same method as Dhaka".
- **Shared cells:** Chattogram's **heat** is the same record as Dhaka's, and Sylhet's **rain** is the same record as Dhaka's. Their captions already say *"… this is the same record."*, and `same_record_as` names Dhaka.
- The rain phrase is data-driven: "not wetter." / "wetter." / "no clear change."
- The Dhaka entry is identical to `dhaka_then_now.json`.
- Water is national only: use the demo's `water`.

---

## 6. Context files (History / Compare)

| File (§) | Content | Notes |
|---|---|---|
| `gistemp_bd.json` (§4) | Monthly heat anomaly vs 1951–1980, 4 cities | Dhaka and Chattogram are the **same cell** |
| `gpcp_bd.json` (§4) | Monthly rain, mm/day, 1979 → | Dhaka and Sylhet are the **same cell**; `caveat`: before 1988 GPCP uses a coarser estimate |
| `gpcc_bd.json` (§4) | Monthly gauge rain, mm/day, to 2019 | Same cells as GPCP |
| `grace.json` (§5) | Monthly water, cm, Bangladesh + NW India boxes | `null` = gap (Jul 2017–May 2018) → **silence** |
| `firms.json` (§6) | Daily fire counts, CHT (Mar–Apr) and Punjab (Oct–Nov) | Compare **MODIS with MODIS only**; single years are "example years" |
| `ndvi.json` (§7) | 16-day NDVI, 3 points, 2001–03 vs 2021–23 | Single 250 m pixels |
| `globe_bd.json` (§8) | GLOBE cloud observations (Bangladesh area, 2025) | Two perspectives, not right vs wrong |

---

## 7. Optional files cut for Video 1 (D11)

- `context/ensemble_bd.json` (§11): heat, rain and water on one monthly timeline since 1981.
- `context/globe_duet.json` (§12): ground vs satellite cloud cover, Bangladesh only, reports on the same date within 1 km merged. **Show only if `status === "ok"`.**

Cut by decision **D11** (`docs/L2/BUILD_PLAN.md` §12). Both files stay and are kept up to date by the pipeline. We'll agree an API after the freeze.

---

## 8. Global history cube (optional, post-freeze, §14)

**Where:** `/data/global/`. **Load lazily** (only when the global view opens): about 10–15 MB.

- **Layers:** `heat` (GISTEMP, **land only**, oceans silent), `rain` (GPCP), `water` (GRACE, 3° cells). Each has:
  - a `.json`: grid, `cells`, `month_start`, `n_months`, `scale`, units, credit;
  - a `.i16.gz`: int16 little-endian `[cell][month]`; value = int16 / `scale`; **−32768 = no data → `null` (silence)**.
- **`places.json`:** 42 named places.
  - **Heat and rain are annual** (`heat_annual_then_now`, `rain_annual_then_now`). **Always label them "annual"**: for Bangladesh cities they differ on purpose from the Section 16 demo (April–May heat, June–September rain). See `basis` and `demo_note`.
  - **Water:** Bangladesh places use the **national box**, the same record as the demo (+0.83 → −5.82 cm). Other places use their 3° cell; show `water_region.label`.
  - `heat_cell_is_neighbour: true` = the nearest land cell was used.
  - **Same cell/box = same record** (`<layer>_same_record_as`).
- **`confidence.json`:** a rain badge per cell (high / medium / low / satellite-only).
- Show `manifest.disclosure`. Outside Dhaka, label numbers "computed from NASA GISTEMP / GPCP / GRACE (same method as Dhaka)".
- **Sound:** no new L2 API. L3 passes the decoded monthly numbers to L2's existing **`playSeries()`** (the ensemble is cut, so there's no three-voice ensemble API to reuse).

```ts
// REFERENCE SPEC ONLY: when the global view is built, implement this once in src/lib/data/ alongside the other decoders.
import type { GlobalLayerFile } from "@/types/data-contract";

// Missing data follows the contract: no data -> null (never NaN).
export async function loadGlobalLayer(name: "heat" | "rain" | "water") {
  const meta: GlobalLayerFile = await (await fetch(`/data/global/${name}.json`)).json();
  const stream = (await fetch(`/data/global/${meta.file}`)).body!.pipeThrough(new DecompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  const dv = new DataView(buf);
  const index = new Map(meta.cells.map((id, i) => [id, i]));

  // Monthly series for the cell nearest (lat, lon); null = no data here (silence).
  function series(lat: number, lon: number): (number | null)[] | null {
    const r = meta.grid.lat.reduce((b, v, i) => (Math.abs(v - lat) < Math.abs(meta.grid.lat[b] - lat) ? i : b), 0);
    const d = (v: number) => Math.abs(((v - lon + 540) % 360) - 180);
    const c = meta.grid.lon.reduce((b, v, i) => (d(v) < d(meta.grid.lon[b]) ? i : b), 0);
    const i = index.get(r * meta.grid.lon.length + c);
    if (i === undefined) return null;
    const out: (number | null)[] = [];
    for (let m = 0; m < meta.n_months; m++) {
      const v = dv.getInt16((i * meta.n_months + m) * 2, true); // explicit little-endian
      out.push(v === -32768 ? null : v / meta.scale);
    }
    return out; // month m = month_start + m
  }
  return { meta, series };
}
```

(Heat is land only: a coastal click can return `null`; try the neighbouring cells. For **named places**, use the cells stored in `places.json`, because Bangladesh places are pinned to the same cells as the demo files.)

---

## 9. Test values (so L3 can check `valueAt()`)

From `pipeline/` (Git Bash), print the published SST at a point using exactly the math in section 3. It's read-only and changes no data:
```bash
python -c "import json,numpy as np;from common import PUBLIC;lat,lon=0,-160;m=json.load(open(PUBLIC/'latest/sst.json'));W,H=m['grid']['width'],m['grid']['height'];r=min(H-1,max(0,int(np.floor((90-lat)/180*H))));c=min(W-1,max(0,int(np.floor((lon+180)/360*W))));u=int(np.fromfile(PUBLIC/'latest/sst.bin',dtype='<u2')[r*W+c]);print(m['frame_time_utc'],'null' if u==65535 else round(u/1000-5,3))"
```
It prints the frame time and the value. Tropical Pacific (0°, 160°W): about 28–29 °C, depending on the frame. L3's `valueAt()` (`src/lib/data/`) at the same point and frame must give the **same number**. Change `lat,lon=0,-160` to test other points; land prints `null`.

Global (after the freeze):
```bash
python inspect_global.py --place Dhaka
```
L3's `series(23.81, 90.41)` on `heat` must give the same latest value.

---

## 10. Notes for L4 (video wording)

- The SST frame lags about **2 days**: say "the latest ocean data", not "today's ocean".
- Rain frames arrive **a few hours** after observation: say "the latest rain", not "live this minute".
- The sound is generated **live** from the frames; the data is near-real-time.
- Only the Section 16 captions and the truth-panel templates above go on screen. Don't retype numbers into the video; take them from the app.

---

## 11. Requests to the TEAM_BUILD_PLAN owner (Section 16)

1. Replace the SST and rain truth-panel wording with the templates in section 4 above (the SST colour scale was recalibrated: median error 0.31 °C, was 0.85 °C).
2. Add the city caption rule: "Other cities use the same templates with the city name; rain phrase 'not wetter.' / 'wetter.' / 'no clear change.' from the signs of the GPCP and GPCC changes; a city in the same grid cell as an earlier city adds 'Same … grid cell(s) as <city>: this is the same record.'"
3. (Post-freeze) Global place values are **annual**; label them "annual".

---

## Completion

**Core (before the freeze):** done when **L3** confirms `src/lib/data/` loads `sst.json` + `sst.bin` and reads at `0°, 160°W` the **same value** the command in section 9 prints (tropical ocean, about 28–29 °C). (L2 needs no check: its engine only receives numbers from L3.)

**Post-freeze:** done when L3 reads the same latest Dhaka heat value from `global/heat` as `inspect_global.py --place Dhaka` prints.