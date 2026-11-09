// Precomputed atmosphere tables for the Turntable (no 10 s GPU precompute on
// first load). Takram's package ships Bruneton's tables for the default Earth
// atmosphere as raw half-float RGBA; scattering is linear in the sun's
// irradiance, so the scattering and irradiance tables are scaled by SUN_MATCH
// (transmittance is not) and written to public/atmosphere/.
//
//   node scripts/build-atmosphere.mjs     (also run by build-earth-textures.mjs)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const SRC = fileURLToPath(new URL("node_modules/@takram/three-atmosphere/assets/", ROOT));
const OUT = fileURLToPath(new URL("public/atmosphere/", ROOT));

/**
 * The Earth shader's sun is brighter than the atmosphere model's (relative
 * luminance), so the model's sun is scaled to match. 3.25 (was 5 at look-dev)
 * keeps the blue limb and terminator tones but cuts land haze by ~35%.
 * A design constant: no value or sound depends on it.
 */
export const SUN_MATCH = 3.25;
const TABLES = { "transmittance.bin": 1, "irradiance.bin": SUN_MATCH, "scattering.bin": SUN_MATCH };

const f16 = new Uint16Array(1);
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);

function halfToFloat(h) {
  const s = h & 0x8000 ? -1 : 1;
  const e = (h >> 10) & 0x1f;
  const m = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (m / 1024);
  if (e === 31) return m ? NaN : s * Infinity;
  return s * 2 ** (e - 15) * (1 + m / 1024);
}

function floatToHalf(v) {
  f32[0] = v;
  const x = u32[0];
  const sign = (x >> 16) & 0x8000;
  const exp = ((x >> 23) & 0xff) - 127 + 15;
  const mant = x & 0x7fffff;
  if (exp <= 0) return sign | (exp < -10 ? 0 : (mant | 0x800000) >> (14 - exp));
  if (exp >= 31) return sign | 0x7c00;
  f16[0] = sign | (exp << 10) | (mant >> 13);
  return f16[0] + ((mant >> 12) & 1); // round to nearest
}

export async function buildAtmosphere() {
  await mkdir(OUT, { recursive: true });
  for (const [file, scale] of Object.entries(TABLES)) {
    const src = await readFile(SRC + file);
    const half = new Uint16Array(src.buffer, src.byteOffset, src.byteLength / 2);
    const out = new Uint16Array(half.length);
    for (let i = 0; i < half.length; i++) out[i] = scale === 1 ? half[i] : floatToHalf(halfToFloat(half[i]) * scale);
    await writeFile(OUT + file, Buffer.from(out.buffer));
    console.log(`  wrote atmosphere/${file} (×${scale})`);
  }
  await writeFile(
    `${OUT}SOURCES.json`,
    JSON.stringify(
      {
        source: "@takram/three-atmosphere assets (Bruneton precomputed scattering, default Earth atmosphere)",
        licence: "MIT",
        sun_match: SUN_MATCH,
        note: "Scattering and irradiance scaled by sun_match; transmittance unchanged. Decoration only.",
      },
      null,
      2,
    ),
  );
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) await buildAtmosphere();
