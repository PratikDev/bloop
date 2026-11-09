// The Earth's design textures (built by scripts/build-earth-textures.mjs):
// Blue Marble day (the frame's month), Black Marble night lights, a relief
// normal map and clouds. KTX2 (Basis) first, WebP as the fallback. Maps wider
// than the encoder's 4096 px limit come as a 2 × 2 grid of KTX2 tiles that are
// merged here into one compressed texture, mip level by mip level.

import {
  CompressedTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGB_PVRTC_2BPPV1_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGBA_PVRTC_2BPPV1_Format,
  RGBA_PVRTC_4BPPV1_Format,
  SRGBColorSpace,
  TextureLoader,
  type CompressedTextureMipmap,
  type Texture,
  type WebGLRenderer,
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { TIER_SPEC, type Tier } from "./quality";

const BASE = "/textures/earth/";
/** The widest single KTX2 file the build writes; wider maps are tiled (row 0 = north, col 0 = west). */
const KTX2_TILE_WIDTH = 4096;
/** Every compressed format KTX2Loader picks (except PVRTC) stores 4 × 4 pixel blocks in row order. */
const BLOCK = 4;
const PVRTC = new Set<number>([RGB_PVRTC_4BPPV1_Format, RGB_PVRTC_2BPPV1_Format, RGBA_PVRTC_4BPPV1_Format, RGBA_PVRTC_2BPPV1_Format]);

export interface SurfaceTextures {
  day: Texture;
  night: Texture;
  normal: Texture;
  clouds: Texture | null;
  /** KTX2 can't be flipped on upload, so its first row (north) sits at v = 0. */
  flipY: boolean;
  month: string;
}

/** The two-digit month of a frame time ("2026-09-25T00:00:00Z" → "09"). */
export function frameMonth(frameTimeUtc: string): string {
  const month = /^\d{4}-(\d{2})-/.exec(frameTimeUtc)?.[1];
  if (!month) throw new Error(`Not an ISO date: ${frameTimeUtc}`);
  return month;
}

/** The built Blue Marble month to show: the frame's own month, or the nearest built one (months wrap). */
export function surfaceMonth(month: string, built: readonly string[]): string {
  const want = Number(month);
  const distance = (m: string) => Math.min(Math.abs(Number(m) - want), 12 - Math.abs(Number(m) - want));
  return [...built].sort((a, b) => distance(a) - distance(b))[0] ?? month;
}

/** The months the build script produced, from its SOURCES.json. */
export async function builtMonths(): Promise<string[]> {
  const res = await fetch(`${BASE}SOURCES.json`);
  if (!res.ok) return [];
  const json: { months?: unknown } = await res.json();
  return Array.isArray(json.months) ? json.months.filter((m): m is string => typeof m === "string") : [];
}

const bytes = (m: CompressedTextureMipmap) => new Uint8Array(m.data.buffer, m.data.byteOffset, m.data.byteLength);

/**
 * Joins a cols × rows grid of compressed tiles into one texture. Each mip level
 * is copied one block row at a time; levels stop where a tile is no longer a
 * whole number of blocks (the last few, a few pixels wide).
 */
function mergeTiles(tiles: CompressedTexture[], cols: number, rows: number): CompressedTexture {
  const first = tiles[0];
  if (PVRTC.has(first.format)) throw new Error("PVRTC tiles can't be merged");
  const levels: CompressedTextureMipmap[] = [];
  for (let level = 0; level < first.mipmaps.length; level++) {
    const { width, height } = first.mipmaps[level];
    if (width % BLOCK !== 0 || height % BLOCK !== 0) break;
    const blocksY = height / BLOCK;
    const rowBytes = bytes(first.mipmaps[level]).byteLength / blocksY;
    const out = new Uint8Array(rowBytes * blocksY * cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let by = 0; by < blocksY; by++) {
        for (let c = 0; c < cols; c++) {
          const src = bytes(tiles[r * cols + c].mipmaps[level]);
          out.set(src.subarray(by * rowBytes, (by + 1) * rowBytes), ((r * blocksY + by) * cols + c) * rowBytes);
        }
      }
    }
    levels.push({ data: out, width: width * cols, height: height * rows });
  }
  const merged = new CompressedTexture(levels, levels[0].width, levels[0].height, first.format, first.type);
  merged.colorSpace = first.colorSpace;
  for (const t of tiles) t.dispose();
  return merged;
}

function finish(texture: Texture, srgb: boolean): Texture {
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export interface EarthTextureLoader {
  load(tier: Tier, month: string): Promise<SurfaceTextures>;
  dispose(): void;
}

export function createEarthTextureLoader(renderer: WebGLRenderer): EarthTextureLoader {
  const ktx2 = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(renderer);
  const webp = new TextureLoader();

  const ktx2Map = async (name: string, width: number): Promise<Texture> => {
    const n = width / KTX2_TILE_WIDTH;
    if (n <= 1) return ktx2.loadAsync(`${BASE}${name}.ktx2`);
    const urls: string[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) urls.push(`${BASE}${name}-${r}${c}.ktx2`);
    return mergeTiles(await Promise.all(urls.map((u) => ktx2.loadAsync(u))), n, n);
  };

  const loadAll = async (get: (name: string, width: number) => Promise<Texture>, tier: Tier, month: string) => {
    const spec = TIER_SPEC[tier];
    const [day, night, normal, clouds] = await Promise.all([
      get(`day-${month}-${spec.surface}`, spec.surface),
      get(`night-${spec.surface}`, spec.surface),
      get(`normal-${spec.normal}`, spec.normal),
      spec.clouds ? get(`clouds-${spec.surface}`, spec.surface) : Promise.resolve(null),
    ]);
    return { day: finish(day, true), night: finish(night, true), normal: finish(normal, false), clouds: clouds && finish(clouds, false), month };
  };

  return {
    async load(tier, month) {
      try {
        return { ...(await loadAll(ktx2Map, tier, month)), flipY: true };
      } catch {
        // No KTX2 support (or a missing file): every map as WebP, so all share one row order.
        return { ...(await loadAll((name) => webp.loadAsync(`${BASE}${name}.webp`), tier, month)), flipY: false };
      }
    },
    dispose() {
      ktx2.dispose();
    },
  };
}
