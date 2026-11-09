// Builds the Turntable v3 Earth textures once: downloads the NASA sources,
// resizes them, and writes KTX2 (Basis Universal) plus a WebP fallback to
// public/textures/earth/. Nothing is hot-linked at runtime. Every image here is
// decoration: no value, sound or label in the app comes from these files.
//
//   node scripts/build-earth-textures.mjs                 # the live frames' month(s)
//   node scripts/build-earth-textures.mjs --months 09,10  # specific months
//   node scripts/build-earth-textures.mjs --all-months    # all 12 Blue Marble months
//   node scripts/build-earth-textures.mjs --download-only
//   node scripts/build-earth-textures.mjs --force          # re-encode files that exist
//
// The 21600 × 10800 sources decode to ~700 MB; libvips may spill to the temp
// folder, so point TMP/TMPDIR at a drive with a few GB free if yours is small.
//
// Equirectangular, row 0 = 90° N, column 0 = 180° W (like every L1 grid).
// Sources, licences and credits: docs/turntable.md and SOURCES.json.

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { encodeToKTX2 } from "ktx2-encoder";
import { buildAtmosphere } from "./build-atmosphere.mjs";

const ROOT = new URL("../", import.meta.url);
const OUT = fileURLToPath(new URL("public/textures/earth/", ROOT));
const STUDIO_OUT = fileURLToPath(new URL("public/textures/studio/", ROOT));
const BASIS_OUT = fileURLToPath(new URL("public/basis/", ROOT));
const CACHE = fileURLToPath(new URL("node_modules/.cache/earth-textures/", ROOT));
const EO = "https://eoimages.gsfc.nasa.gov/images/imagerecords";

/** Blue Marble Next Generation with topography and bathymetry, 2004 monthly composites (Visible Earth record ids). */
const BLUE_MARBLE_RECORDS = {
  "01": 73580, "02": 73605, "03": 73630, "04": 73655, "05": 73701, "06": 73726,
  "07": 73751, "08": 73776, "09": 73801, "10": 73826, "11": 73884, "12": 73909,
};
const blueMarble = (month) => ({
  url: `${EO}/73000/${BLUE_MARBLE_RECORDS[month]}/world.topo.bathy.2004${month}.3x21600x10800.jpg`,
  credit: "NASA Earth Observatory, Blue Marble Next Generation (Reto Stöckli)",
  licence: "NASA imagery, not subject to US copyright; NASA acknowledged as the source",
});

const SOURCES = {
  elevation: {
    url: `${EO}/73000/73934/gebco_08_rev_elev_21600x10800.png`,
    credit: "Imagery by Jesse Allen, NASA's Earth Observatory, using data from the General Bathymetric Chart of the Oceans (GEBCO) produced by the British Oceanographic Data Centre",
    licence: "NASA imagery; GEBCO data free to use with acknowledgement",
  },
  bathymetry: {
    url: `${EO}/73000/73963/gebco_08_rev_bath_21600x10800.png`,
    credit: "Imagery by Jesse Allen, NASA's Earth Observatory, using data from GEBCO (British Oceanographic Data Centre)",
    licence: "NASA imagery; GEBCO data free to use with acknowledgement",
  },
  night: {
    url: `${EO}/144000/144898/BlackMarble_2016_3km.jpg`,
    credit: "NASA Earth Observatory, Black Marble 2016 (Joshua Stevens, using Suomi NPP VIIRS data from Miguel Román, NASA GSFC)",
    licence: "NASA imagery, not subject to US copyright; NASA acknowledged as the source",
  },
  clouds: {
    url: `${EO}/57000/57747/cloud_combined_8192.tif`,
    credit: "NASA Visible Earth, Blue Marble clouds (Reto Stöckli, NASA GSFC)",
    licence: "NASA imagery, not subject to US copyright; NASA acknowledged as the source",
  },
  studio: {
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr",
    credit: "Poly Haven, studio_small_09 (Sergej Majboroda)",
    licence: "CC0",
  },
};

const SIZES = { high: [8192, 4096], low: [4096, 2048] };
const NORMAL_SIZES = { high: [4096, 2048], low: [2048, 1024] };
const WEBP = { quality: 86, effort: 5 };

function parseMonths(argv) {
  if (argv.includes("--all-months")) return Object.keys(BLUE_MARBLE_RECORDS);
  const i = argv.indexOf("--months");
  if (i >= 0) return argv[i + 1].split(",").map((m) => m.padStart(2, "0"));
  return null;
}

/** The months of the frames the Turntable shows (SST and rain), from their own JSON. */
async function frameMonths() {
  const months = new Set();
  for (const file of ["public/data/latest/sst.json", "public/data/latest/rain.json"]) {
    const meta = JSON.parse(await readFile(new URL(file, ROOT), "utf8"));
    months.add(meta.frame_time_utc.slice(5, 7));
  }
  return [...months].sort();
}

async function exists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

/** Downloads once into node_modules/.cache; returns the local path and the file's SHA-256. */
async function download(url) {
  const path = CACHE + url.split("/").pop();
  if (!(await exists(path))) {
    console.log(`  downloading ${url}`);
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(url);
      if (res.ok) {
        await writeFile(path, Buffer.from(await res.arrayBuffer()));
        break;
      }
      if (attempt === 3) throw new Error(`${res.status} ${res.statusText}: ${url}`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  const sha256 = createHash("sha256").update(await readFile(path)).digest("hex");
  return { path, sha256 };
}

// ---------------------------------------------------------------------------
// Writers

async function encodeKtx2(raw, width, height, { srgb, uastc = false, normal = false }) {
  return encodeToKTX2(new Uint8Array(0), {
    imageDecoder: async () => ({ width, height, data: new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength) }),
    isUASTC: uastc,
    isNormalMap: normal,
    isPerceptual: srgb,
    isSetKTX2SRGBTransferFunc: srgb,
    generateMipmap: true,
    needSupercompression: uastc,
    enableRDO: uastc,
    rdoQualityLevel: 1,
    qualityLevel: 200,
    compressionLevel: 2,
    isKTX2File: true,
  });
}

/** The WASM Basis encoder caps a texture at 12 Mpix, so larger maps are split into tiles of this size. */
const KTX2_MAX_TILE = { width: 4096, height: 2048 };

/** Cuts a w × h tile at (x0, y0) out of an RGBA raster. */
function cropTile(raw, width, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) raw.copy(out, y * w * 4, ((y0 + y) * width + x0) * 4, ((y0 + y) * width + x0 + w) * 4);
  return out;
}

/**
 * Writes `<name>.webp` and KTX2: one `<name>.ktx2`, or, above the encoder's
 * limit, a grid of `<name>-<row><col>.ktx2` tiles (row 0 = north, col 0 = west)
 * that the app merges back into one compressed texture (textures.ts).
 */
async function writeTexture(name, raw, width, height, opts) {
  const webp = await sharp(raw, { raw: { width, height, channels: 4 } }).removeAlpha().webp(WEBP).toBuffer();
  await writeFile(`${OUT}${name}.webp`, webp);
  const cols = Math.ceil(width / KTX2_MAX_TILE.width);
  const rows = Math.ceil(height / KTX2_MAX_TILE.height);
  const w = width / cols;
  const h = height / rows;
  let ktx2 = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const single = cols * rows === 1;
      const data = await encodeKtx2(single ? raw : cropTile(raw, width, c * w, r * h, w, h), w, h, opts);
      await writeFile(OUT + (single ? `${name}.ktx2` : `${name}-${r}${c}.ktx2`), data);
      ktx2 += data.length;
    }
  }
  console.log(`  wrote ${name} KTX2 ${cols}×${rows} (${(ktx2 / 1e6).toFixed(2)} MB), .webp (${(webp.length / 1e6).toFixed(2)} MB)`);
  return { ktx2, webp: webp.length, tiles: [cols, rows] };
}

/** Already built by an earlier run (re-encode everything with --force). */
const built = async (name) => !process.argv.includes("--force") && (await exists(`${OUT}${name}.webp`));

const rgba = (pipeline) => pipeline.toColourspace("srgb").ensureAlpha().raw().toBuffer();
const resized = (path, width, height) => sharp(path, { limitInputPixels: false }).resize(width, height, { fit: "fill", kernel: "lanczos3" });

// ---------------------------------------------------------------------------
// Layers

async function buildDay(month, src, files) {
  for (const [width, height] of Object.values(SIZES)) {
    if (await built(`day-${month}-${width}`)) continue;
    const raw = await rgba(resized(src.path, width, height));
    files[`day-${month}-${width}`] = await writeTexture(`day-${month}-${width}`, raw, width, height, { srgb: true });
  }
}

/**
 * Night lights: the Black Marble shows lights over a dim blue-grey Earth. The
 * shader adds them as emission, so the base is faded out by luminance (the
 * Sahara's base is ≈ 38, cities ≥ 120) and only the lights remain; the day map
 * already carries the surface.
 */
function liftNightBase(raw) {
  const { black, white } = NIGHT_LEVELS;
  for (let i = 0; i < raw.length; i += 4) {
    const l = 0.3 * raw[i] + 0.59 * raw[i + 1] + 0.11 * raw[i + 2];
    const t = Math.min(1, Math.max(0, (l - black) / (white - black)));
    const m = t * t * (3 - 2 * t);
    for (let c = 0; c < 3; c++) raw[i + c] = Math.round(raw[i + c] * m);
  }
  return raw;
}

async function buildNight(src, files) {
  for (const [width, height] of Object.values(SIZES)) {
    if (await built(`night-${width}`)) continue;
    const raw = liftNightBase(await rgba(resized(src.path, width, height)));
    files[`night-${width}`] = await writeTexture(`night-${width}`, raw, width, height, { srgb: true });
  }
}

async function buildClouds(src, files) {
  for (const [width, height] of Object.values(SIZES)) {
    if (await built(`clouds-${width}`)) continue;
    // The source is already grey in all three channels.
    const raw = await rgba(resized(src.path, width, height));
    files[`clouds-${width}`] = await writeTexture(`clouds-${width}`, raw, width, height, { srgb: false });
  }
}

/**
 * Heights in metres from the two GEBCO-derived rasters: elevation 0 = sea level
 * up to 255; bathymetry reversed (255 = shallow, 0 = deepest; the open Pacific
 * reads ≈ 126, the North Sea shelf ≈ 253).
 */
async function heights(elevation, bathymetry, width, height) {
  const grey = (path) => resized(path, width, height).greyscale().raw().toBuffer();
  const [land, sea] = await Promise.all([grey(elevation.path), grey(bathymetry.path)]);
  const h = new Float32Array(width * height);
  for (let i = 0; i < h.length; i++) {
    h[i] = land[i] > 0 ? (land[i] / 255) * ELEVATION.maxMetres : -((255 - sea[i]) / 255) * BATHYMETRY.maxDepthMetres;
  }
  return h;
}

/**
 * Tangent-space normal map (x = east, y = north, z = up) from central
 * differences, with the east spacing shrinking with cos(latitude) and wrapping
 * at the antimeridian. Land relief and the sea floor are exaggerated separately
 * (sea floor much less), since the shader only uses them as subtle shading.
 */
function normalMap(h, width, height) {
  const out = Buffer.alloc(width * height * 4);
  const metresPerPixel = (2 * Math.PI * EARTH_RADIUS_M) / width;
  for (let y = 0; y < height; y++) {
    const lat = (90 - ((y + 0.5) * 180) / height) * (Math.PI / 180);
    const dx = 2 * metresPerPixel * Math.max(0.05, Math.cos(lat));
    const dy = 2 * metresPerPixel;
    const up = Math.max(0, y - 1);
    const down = Math.min(height - 1, y + 1);
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const left = y * width + ((x - 1 + width) % width);
      const right = y * width + ((x + 1) % width);
      const k = h[i] >= 0 ? RELIEF_EXAGGERATION.land : RELIEF_EXAGGERATION.sea;
      const sx = (-(h[right] - h[left]) / dx) * k;
      const sy = (-(h[up * width + x] - h[down * width + x]) / dy) * k;
      const len = Math.hypot(sx, sy, 1);
      out[i * 4] = Math.round(((sx / len) * 0.5 + 0.5) * 255);
      out[i * 4 + 1] = Math.round(((sy / len) * 0.5 + 0.5) * 255);
      out[i * 4 + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      out[i * 4 + 3] = 255;
    }
  }
  return out;
}

async function buildNormals(elevation, bathymetry, files) {
  for (const [width, height] of Object.values(NORMAL_SIZES)) {
    if (await built(`normal-${width}`)) continue;
    const raw = normalMap(await heights(elevation, bathymetry, width, height), width, height);
    files[`normal-${width}`] = await writeTexture(`normal-${width}`, raw, width, height, { srgb: false, uastc: true, normal: true });
  }
}

// Calibration of the source rasters (checked by inspecting them; see SOURCES.json).
const EARTH_RADIUS_M = 6_371_000;
const ELEVATION = { maxMetres: 6400 };
const BATHYMETRY = { maxDepthMetres: 8000 };
const RELIEF_EXAGGERATION = { land: 18, sea: 3 };
const NIGHT_LEVELS = { black: 48, white: 120 };

async function main() {
  const argv = process.argv.slice(2);
  const months = parseMonths(argv) ?? (await frameMonths());
  await Promise.all([OUT, STUDIO_OUT, BASIS_OUT, CACHE].map((d) => mkdir(d, { recursive: true })));

  console.log(`Blue Marble month(s): ${months.join(", ")}`);
  const downloaded = {};
  for (const month of months) downloaded[`day-${month}`] = { ...blueMarble(month), ...(await download(blueMarble(month).url)) };
  for (const [key, spec] of Object.entries(SOURCES)) downloaded[key] = { ...spec, ...(await download(spec.url)) };
  if (argv.includes("--download-only")) return;

  const files = {};
  for (const month of months) await buildDay(month, downloaded[`day-${month}`], files);
  await buildNight(downloaded.night, files);
  await buildClouds(downloaded.clouds, files);
  await buildNormals(downloaded.elevation, downloaded.bathymetry, files);

  await copyFile(downloaded.studio.path, `${STUDIO_OUT}studio_small_09_1k.hdr`);
  const basis = fileURLToPath(new URL("node_modules/three/examples/jsm/libs/basis/", ROOT));
  for (const f of ["basis_transcoder.js", "basis_transcoder.wasm"]) await copyFile(basis + f, BASIS_OUT + f);
  await buildAtmosphere();

  const previous = (await exists(`${OUT}SOURCES.json`)) ? JSON.parse(await readFile(`${OUT}SOURCES.json`, "utf8")) : { files: {} };
  await writeFile(
    `${OUT}SOURCES.json`,
    JSON.stringify(
      {
        generated_utc: new Date().toISOString(),
        projection: "equirectangular, row 0 = 90N, column 0 = 180W",
        note: "Design layers only. No value, sound or label in the app comes from these images.",
        months,
        sources: Object.fromEntries(Object.entries(downloaded).map(([k, v]) => [k, { url: v.url, sha256: v.sha256, credit: v.credit, licence: v.licence }])),
        calibration: { ELEVATION, BATHYMETRY, RELIEF_EXAGGERATION, NIGHT_LEVELS },
        files: { ...previous.files, ...files },
      },
      null,
      2,
    ),
  );
}

await main();
