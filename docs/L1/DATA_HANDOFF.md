# L1 Data Handoff

## Where the data is

**L1 data is live on the main site under `/data/...`**

The source files are in `public/data/`.

- **Decoding:** The TypeScript below is intended for `src/lib/data.ts`. It covers `sst.bin` (°C), `rain.bin` + `rain_phase.bin` (mm/h, rain/snow), and the **time-lapse** `sequence/rain_XXX.u8.gz` (1 byte per cell, gzipped; unzip with `DecompressionStream`). Always read width and height from the matching `.json`.

- **Never hard-code numbers.** Read `verified`, `calibration` and `latest_check` from `latest/sst.json` / `latest/rain.json`, and the demo captions from `demo/dhaka_then_now.json`.

- **SST truth panel:** "Colour scale checked against NASA MUR SST: the frame's colours match −4…34 °C (the legend reads −5…35). Median error 0.31 °C (60 points); 0.32 °C on the 25 Sep frame."

- **Rain truth panel:** "Checked against NASA IMERG: typically within about ±27%; the newest frame matched IMERG Early similarly, and agreed on where it was raining at every sampled point."

- **For L4:** the SST frame lags about 2 days, so say "the latest ocean data", not "today's ocean".

- **Please update Section 16** of the team plan with this wording.

- **Quick test for L3:** a tropical ocean point (e.g. 0°, 160°W) should read about 29 °C from `sst.bin`.

## How to decode (TypeScript for `src/lib/data.ts`)

```ts
// All binary grids: little-endian, row 0 = 90°N, column 0 = 180°W, equirectangular.
export async function loadU16(url: string): Promise<Uint16Array> {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const out = new Uint16Array(buf.byteLength / 2);

  for (let i = 0; i < out.length; i++) {
    out[i] = dv.getUint16(i * 2, true); // explicit little-endian
  }

  return out;
}

export async function loadU8(url: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

export function cellIndex(
  lat: number,
  lon: number,
  width: number,
  height: number
): number {
  const row = Math.min(
    height - 1,
    Math.max(0, Math.floor(((90 - lat) / 180) * height))
  );

  const col = Math.min(
    width - 1,
    Math.max(0, Math.floor(((lon + 180) / 360) * width))
  );

  return row * width + col;
}

export const decodeSst = (u: number): number =>
  u === 65535 ? NaN : u / 1000 - 5;
// °C; NaN = land/no data

export const decodeRain = (u: number): number =>
  u === 0
    ? 0
    : u === 65535
      ? NaN
      : Math.pow(10, (u - 1) / 20000 - 1);

// Phase (rain_phase.bin): 0 dry, 1 liquid, 2 frozen.

// Time-lapse frames (sequence/rain_XXX.u8.gz):
// 1 byte per cell, gzipped.
// Read width/height from sequence/index.json.
export async function loadSequenceFrame(
  url: string
): Promise<Uint8Array> {
  const stream = (await fetch(url)).body!.pipeThrough(
    new DecompressionStream("gzip")
  );

  return new Uint8Array(
    await new Response(stream).arrayBuffer()
  );
}

export function decodeRainU8(
  code: number
): { mmh: number; phase: 0 | 1 | 2 } {
  if (code === 0) return { mmh: 0, phase: 0 };
  if (code === 255) return { mmh: NaN, phase: 0 };

  const frozen = code >= 128;
  const base = frozen ? 128 : 1;

  return {
    mmh: Math.pow(
      10,
      -1 + ((code - base) / 126) * Math.log10(500)
    ),
    phase: frozen ? 2 : 1
  };
}
```

## Grid sizes

- `latest/sst.bin` is 1024×512.
- `latest/rain.bin` + `rain_phase.bin` are 1800×900.
- `sequence/rain_XXX.u8.gz` are 1200×600, one byte per cell (rain + phase), gzipped.

**Always read `width`/`height` from the matching `.json` rather than hard-coding them.**

## Truth-panel numbers

Read:

- `verified`
- `calibration`
- `latest_check`

from `latest/sst.json`.

Read:

- `verified`
- `latest_check`

from `latest/rain.json`.

### SST truth wording

Use:

> "Colour scale checked against NASA MUR SST: the frame's colours match −4…34 °C (legend reads −5…35). Median error {verified.value} °C; {latest_check.median_abs} °C on the {latest_check.date} frame."

### Demo captions

Read the captions from:

`demo/dhaka_then_now.json`

Specifically:

- `heat.caption`
- `rain.caption`
- `water.caption`

**No numbers are hard-coded in the app.**

## Test values for L3

So L3 can check `valueAt()`, pick 3 points from:

`pipeline/inputs/reference/checkC_points.csv`

after running:

```bash
python convert_sst.py inputs/reference/checkC_frame.exr --time=2026-09-22T00:00:00Z
```

Alternatively, ask L1 to print `decode_sst` at any latitude/longitude.

## Completion

**Done when:** L2 and L3 confirm they can load `sst.json` + `sst.bin` and read a sensible value at a test point (e.g. tropical ocean about 28 °C).