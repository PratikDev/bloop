// The record as the Earth: radius is latitude (outer edge 90° N, inner edge 90° S), angle is longitude. A shader reads
// NASA's own frame images directly, unsmoothed, at each point of the record, and chooses between them by the grids,
// exactly as the swatch does (data-layer.ts pickPixel: rain where it falls, else ocean, else a gap). So every pixel of
// the record is the frame's own colour at that point; gaps are discarded and the bare vinyl shows.

import { Color, DataTexture, NearestFilter, RedFormat, ShaderMaterial, SRGBColorSpace, Texture, type Material } from "three";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import type { Palette } from "@/lib/css-tokens";
import type { LiveFields } from "@/lib/data";
import { drawLabel } from "../scene/deck-textures";
import { GROOVES, grooveRadius } from "../scene/deck";

const RAD = Math.PI / 180;
/** Groove rings every 15° of latitude (12 steps from pole to pole); the equator's is stronger. Half-widths in record units. */
const RING_HALF_WIDTH = { line: 0.0035, equator: 0.008 } as const;
const TRACK_CODE: Record<TrackMode, number> = { ocean: 0, rain: 1, both: 2 };

/** A point on the record for a latitude and longitude, in the record's own frame (x = sin, z = cos, as lib/sphere). */
export function recordPoint(lat: number, lon: number): { x: number; z: number } {
  const r = grooveRadius(lat);
  return { x: r * Math.sin(lon * RAD), z: r * Math.cos(lon * RAD) };
}

const VERTEX = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Images and masks alike are uploaded unflipped (flipY off): row 0 is north. Each lookup fetches the exact texel the
// swatch's reader uses (data-layer.ts pixelIndex: column floor((lon + 180) / 360 · width), row floor((90 − lat) / 180 ·
// height)), with texelFetch, so no filtering or driver rounding can pick a neighbour.
const FRAGMENT = /* glsl */ `
uniform sampler2D sstImage;
uniform sampler2D rainImage;
uniform sampler2D oceanMask;
uniform sampler2D wetMask;
uniform int track;
uniform bool hasRain;
uniform float inner;
uniform float outer;
uniform vec3 ring;
uniform float ringLine;
uniform float ringEquator;
varying vec2 vP;
const float PI = 3.141592653589793;
vec4 fetch(sampler2D t, float lat, float lon) {
  ivec2 size = textureSize(t, 0);
  int col = min(size.x - 1, int(floor((lon + 180.0) / 360.0 * float(size.x))));
  int row = min(size.y - 1, int(floor((90.0 - lat) / 180.0 * float(size.y))));
  return texelFetch(t, ivec2(col, row), 0);
}
float ringAt(float r) {
  float step = (outer - inner) / 12.0;
  float k = (r - inner) / step;
  float near = abs(k - floor(k + 0.5)) * step;
  float onEquator = abs(r - (inner + outer) / 2.0);
  if (onEquator < ringEquator) return 1.0;
  return (k > 0.5 && k < 11.5 && near < ringLine) ? 1.0 : 0.0;
}
void main() {
  float r = length(vP);
  if (r < inner || r > outer) discard;
  vec3 colour = ring;
  if (ringAt(r) < 0.5) {
    float lat = -90.0 + (r - inner) / (outer - inner) * 180.0;
    float lon = atan(vP.x, vP.y) * 180.0 / PI;
    vec4 c = vec4(0.0);
    if (track != 0 && hasRain && fetch(wetMask, lat, lon).r > 0.5) c = fetch(rainImage, lat, lon);
    else if (track != 1 && fetch(oceanMask, lat, lon).r > 0.5) c = fetch(sstImage, lat, lon);
    if (c.a < 0.5) discard;
    colour = c.rgb;
  }
  gl_FragColor = vec4(colour, 1.0);
  #include <colorspace_fragment>
}`;

const imageTexture = (image: HTMLImageElement | null) => {
  if (!image) return null;
  const t = new Texture(image);
  t.flipY = false;
  t.colorSpace = SRGBColorSpace;
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
};

/** A one-byte mask on a grid (255 = yes), row 0 = north, as the grids are stored. */
function maskTexture(width: number, height: number, yes: (i: number) => boolean): DataTexture {
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) data[i] = yes(i) ? 255 : 0;
  const t = new DataTexture(data, width, height, RedFormat);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.needsUpdate = true;
  return t;
}

export interface RecordData {
  material: Material;
  /** New frame data or a different record (track): the shader reads them from now on. */
  set(fields: LiveFields, track: TrackMode, images: { sst: HTMLImageElement | null; rain: HTMLImageElement | null }): void;
  dispose(): void;
}

/** The record's data material: the frame's images, chosen per point by the grids. Invisible until it has data. */
export function createRecordData(palette: Palette): RecordData {
  const empty = maskTexture(1, 1, () => false);
  const uniforms = {
    sstImage: { value: empty as Texture },
    rainImage: { value: empty as Texture },
    oceanMask: { value: empty as Texture },
    wetMask: { value: empty as Texture },
    track: { value: 0 },
    hasRain: { value: false },
    inner: { value: GROOVES.inner },
    outer: { value: GROOVES.outer },
    ring: { value: new Color(palette["arm-edge"]) },
    ringLine: { value: RING_HALF_WIDTH.line },
    ringEquator: { value: RING_HALF_WIDTH.equator },
  };
  const material = new ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, visible: false });
  let owned: { dispose(): void }[] = [];
  return {
    material,
    set(fields, track, images) {
      for (const t of owned) t.dispose();
      const sst = imageTexture(images.sst);
      const rain = imageTexture(images.rain);
      const { width: sw, height: sh, nodata } = fields.sst.meta.grid;
      const ocean = maskTexture(sw, sh, (i) => fields.sst.codes[i] !== nodata);
      // Wet: rain or snow in the grid (data-layer.ts: rainAt's mm/h above 0 and not no-data).
      const rf = fields.rain;
      const wet = rf ? maskTexture(rf.meta.grid.width, rf.meta.grid.height, (i) => rf.codes[i] !== 0 && rf.codes[i] !== 65535) : null;
      owned = [sst, rain, ocean, wet].flatMap((t) => (t ? [t] : []));
      uniforms.sstImage.value = sst ?? empty;
      uniforms.rainImage.value = rain ?? empty;
      uniforms.oceanMask.value = ocean;
      uniforms.wetMask.value = wet ?? empty;
      uniforms.hasRain.value = rain !== null && wet !== null;
      uniforms.track.value = TRACK_CODE[track];
      material.visible = sst !== null || rain !== null;
    },
    dispose() {
      for (const t of owned) t.dispose();
      empty.dispose();
      material.dispose();
    },
  };
}

/** The record's paper label: "Bloop" (the app's name, never translated). */
export function drawBloopLabel(canvas: HTMLCanvasElement, palette: Palette): void {
  drawLabel(canvas, {
    title: "Bloop",
    subtitle: "",
    paper: palette.label,
    ink: palette["label-ink"],
    accent: palette.shapla,
    font: getComputedStyle(document.body).fontFamily,
  });
}
