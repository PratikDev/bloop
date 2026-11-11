// Builds the 3D scenes' basemap crops from the sources the Turntable already
// downloads (scripts/build-earth-textures.mjs → node_modules/.cache/earth-textures):
// Blue Marble NG (September) for colour, GEBCO-derived elevation and bathymetry
// for relief. Decoration only: no value, sound or label in the app comes from
// these files. Run build-earth-textures.mjs --download-only first if the cache
// is empty.
//
//   node scripts/build-scene-textures.mjs
//
// Outputs public/textures/scenes/<region>-colour.webp and <region>-height.i16
// (Int16 little-endian metres, row 0 = north, column 0 = west), plus SOURCES.json.

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url);
const CACHE = fileURLToPath(new URL("node_modules/.cache/earth-textures/", ROOT));
const OUT = fileURLToPath(new URL("public/textures/scenes/", ROOT));
const SOURCE_PX_PER_DEG = 60; // 21600 × 10800
const SOURCES = {
  colour: "world.topo.bathy.200409.3x21600x10800.jpg",
  elevation: "gebco_08_rev_elev_21600x10800.png",
  bathymetry: "gebco_08_rev_bath_21600x10800.png",
};
// The rasters' calibration, as in build-earth-textures.mjs (checked against the images).
const ELEVATION_MAX_M = 6400;
const DEPTH_MAX_M = 8000;

/** Scene regions (west, south, east, north in degrees) and output resolutions (pixels per degree). */
const REGIONS = {
  // Bangladesh with a margin (the GRACE box is lon 88–93, lat 20.5–26.7).
  bd: { bounds: [86, 19, 95, 28], colourPxPerDeg: 60, heightPxPerDeg: 30 },
  // The Sound terrain region (5–25° N, 78–100° E) with a margin.
  bay: { bounds: [76, 3, 102, 27], colourPxPerDeg: 40, heightPxPerDeg: 15 },
};

const window = ([w, s, e, n]) => ({
  left: Math.round((w + 180) * SOURCE_PX_PER_DEG),
  top: Math.round((90 - n) * SOURCE_PX_PER_DEG),
  width: Math.round((e - w) * SOURCE_PX_PER_DEG),
  height: Math.round((n - s) * SOURCE_PX_PER_DEG),
});

const crop = (file, bounds, pxPerDeg) => {
  const [w, s, e, n] = bounds;
  return sharp(CACHE + file, { limitInputPixels: false })
    .extract(window(bounds))
    .resize(Math.round((e - w) * pxPerDeg), Math.round((n - s) * pxPerDeg), { fit: "fill", kernel: "lanczos3" });
};

async function buildRegion(name, { bounds, colourPxPerDeg, heightPxPerDeg }) {
  await crop(SOURCES.colour, bounds, colourPxPerDeg).webp({ quality: 86 }).toFile(`${OUT}${name}-colour.webp`);
  const grey = async (file) => {
    const { data, info } = await crop(file, bounds, heightPxPerDeg).greyscale().raw().toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  };
  const [land, sea] = await Promise.all([grey(SOURCES.elevation), grey(SOURCES.bathymetry)]);
  const metres = new Int16Array(land.width * land.height);
  for (let i = 0; i < metres.length; i++) {
    metres[i] = Math.round(land.data[i] > 0 ? (land.data[i] / 255) * ELEVATION_MAX_M : -((255 - sea.data[i]) / 255) * DEPTH_MAX_M);
  }
  await writeFile(`${OUT}${name}-height.i16`, Buffer.from(metres.buffer));
  return { bounds, colour: `${name}-colour.webp`, height: `${name}-height.i16`, height_size: [land.width, land.height] };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const regions = {};
  for (const [name, spec] of Object.entries(REGIONS)) {
    regions[name] = await buildRegion(name, spec);
    console.log(`${name}: ${JSON.stringify(regions[name])}`);
  }
  await writeFile(
    `${OUT}SOURCES.json`,
    JSON.stringify(
      {
        generated_utc: new Date().toISOString(),
        note: "Basemap crops for the 3D scenes. Decoration only: no value, sound or label in the app comes from these files.",
        projection: "equirectangular, row 0 = north, column 0 = west; heights Int16 little-endian metres",
        sources: {
          colour: "NASA Blue Marble Next Generation, September 2004 (Reto Stöckli, NASA Earth Observatory)",
          relief: "GEBCO 2008 elevation and bathymetry rasters (Jesse Allen, NASA Earth Observatory; GEBCO, British Oceanographic Data Centre)",
        },
        calibration: { ELEVATION_MAX_M, DEPTH_MAX_M },
        regions,
      },
      null,
      2,
    ),
  );
}

await main();
