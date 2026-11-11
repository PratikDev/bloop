// Downloads the Turntable's design layers once and writes equirectangular WebP
// textures to public/textures/ (row 0 = 90° N, column 0 = 180° W, like every
// L1 grid). These are decoration only: no value, sound or label comes from them.
//
//   node scripts/fetch-basemap.mjs            # 4096 × 2048 + 2048 × 1024
//   node scripts/fetch-basemap.mjs --hires    # also 8192 × 4096 (day, night)
//
// Sources (see docs/turntable.md for licences and credits):
//   Day:    NASA Blue Marble Next Generation, GIBS WMS layer BlueMarble_NextGeneration
//   Night:  NASA Black Marble 2016,          GIBS WMS layer VIIRS_Black_Marble
//   Relief: Natural Earth 50m shaded relief (public domain), for a subtle bump map

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import sharp from "sharp";

const OUT = fileURLToPath(new URL("../public/textures/", import.meta.url));
const GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
const NE_RELIEF = "https://naciscdn.org/naturalearth/50m/raster/SR_50M.zip";
const TILE = 2048;
const WEBP = { quality: 82, effort: 5 };

const LAYERS = {
  day: { layer: "BlueMarble_NextGeneration", format: "image/jpeg", time: null },
  night: { layer: "VIIRS_Black_Marble", format: "image/png", time: "2016-01-01" },
};

async function fetchBuffer(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 3) throw new Error(`${res.status} ${res.statusText}: ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

/** One GIBS WMS tile, EPSG:4326 (WMS 1.3.0 axis order: lat, lon). */
function wmsUrl({ layer, format, time }, bbox) {
  const q = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: layer,
    STYLES: "",
    CRS: "EPSG:4326",
    BBOX: `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`,
    WIDTH: String(TILE),
    HEIGHT: String(TILE),
    FORMAT: format,
  });
  if (time) q.set("TIME", time);
  return `${GIBS_WMS}?${q}`;
}

/** Fetches a width × height equirectangular image from GIBS in TILE-sized tiles and stitches it. */
async function stitchGibs(spec, width, height) {
  const cols = width / TILE;
  const rows = height / TILE;
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bbox = { west: -180 + (c * 360) / cols, east: -180 + ((c + 1) * 360) / cols, north: 90 - (r * 180) / rows, south: 90 - ((r + 1) * 180) / rows };
      process.stdout.write(`  ${spec.layer} tile ${r * cols + c + 1}/${cols * rows}\n`);
      const input = await sharp(await fetchBuffer(wmsUrl(spec, bbox))).removeAlpha().toBuffer();
      tiles.push({ input, left: c * TILE, top: r * TILE });
    }
  }
  return sharp({ create: { width, height, channels: 3, background: "#000000" } }).composite(tiles).png().toBuffer();
}

async function writeWebp(name, image, width, height, grey = false) {
  let pipeline = sharp(image).resize(width, height, { fit: "fill" });
  if (grey) pipeline = pipeline.greyscale();
  const file = `${OUT}${name}-${width}.webp`;
  await writeFile(file, await pipeline.webp(WEBP).toBuffer());
  console.log(`wrote ${file}`);
}

async function main() {
  const hires = process.argv.includes("--hires");
  await mkdir(OUT, { recursive: true });

  for (const [name, spec] of Object.entries(LAYERS)) {
    const full = hires ? await stitchGibs(spec, 8192, 4096) : await stitchGibs(spec, 4096, 2048);
    if (hires) await writeWebp(`earth-${name}`, full, 8192, 4096);
    await writeWebp(`earth-${name}`, full, 4096, 2048);
    await writeWebp(`earth-${name}`, full, 2048, 1024);
  }

  console.log("  Natural Earth SR_50M shaded relief");
  const zip = unzipSync(new Uint8Array(await fetchBuffer(NE_RELIEF)));
  const tif = Object.entries(zip).find(([path]) => /\.tif$/i.test(path));
  if (!tif) throw new Error("SR_50M.zip has no .tif");
  const relief = Buffer.from(tif[1]);
  await writeWebp("earth-relief", relief, 4096, 2048, true);
  await writeWebp("earth-relief", relief, 2048, 1024, true);

  await writeFile(
    `${OUT}SOURCES.json`,
    JSON.stringify(
      {
        generated_utc: new Date().toISOString(),
        projection: "equirectangular, row 0 = 90N, column 0 = 180W",
        note: "Design layers only. No value, sound or label in the app comes from these images.",
        day: { source: `${GIBS_WMS} LAYERS=${LAYERS.day.layer}`, credit: "NASA Blue Marble", licence: "NASA imagery, open use" },
        night: { source: `${GIBS_WMS} LAYERS=${LAYERS.night.layer} TIME=${LAYERS.night.time}`, credit: "NASA Black Marble", licence: "NASA imagery, open use" },
        relief: { source: NE_RELIEF, credit: "Natural Earth", licence: "Public domain" },
        acknowledgement: "Imagery from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS).",
      },
      null,
      2,
    ),
  );
}

await main();
