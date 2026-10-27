// The realistic Earth (decoration) and the data frame above it (the sonified
// layer). Earth: Blue Marble × sun-lit Lambert with a relief normal map, a soft
// warm terminator, GGX sun glint and a Fresnel sheen on the ocean (ocean = the
// SST grid's own mask, so the grid wins), Black Marble city lights on the night
// side (HDR, so only they reach the bloom threshold) and cloud shadows. The
// atmosphere is takram's aerial perspective (post.ts). The data frame sits on
// its own sphere in the overlay pass: its hue is never changed, only an
// optional lightness factor so it sits in the light.

import {
  CanvasTexture,
  Color,
  DataTexture,
  Group,
  LinearFilter,
  Mesh,
  RedFormat,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import type { SurfaceTextures } from "../textures";
import { globeGeometry } from "./geometry";
import { asOccluder, onOverlay } from "./layers";

export const EARTH_RADIUS = 1;
const DATA_RADIUS = 1.0015;
const CLOUD_RADIUS = 1.006;
const SEGMENTS = { cols: 512, rows: 256 } as const;

/** Look-dev values (design, not data). */
export interface EarthLook {
  sunIntensity: number;
  nightGain: number;
  normalStrength: number;
  /** Faint surface on the night side (earthshine), so continents stay readable. */
  nightAmbient: number;
  /** How much the data layer follows the light: 0 = flat, 1 = lightness 0.8 on the night side. */
  dataShade: number;
}

export const DEFAULT_LOOK: EarthLook = { sunIntensity: 1.6, nightGain: 3.2, normalStrength: 1, nightAmbient: 0.035, dataShade: 1 };

const SURFACE_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** Shared GLSL: the sphere's east/north frame and the surface texture coordinates. */
const SURFACE_COMMON = /* glsl */ `
uniform vec3 sunDir;       // object space
uniform float alwaysDay;
uniform float flipY;
varying vec2 vUv;
varying vec3 vPos;
vec2 surfaceUv() { return vec2(vUv.x, mix(vUv.y, 1.0 - vUv.y, flipY)); }
float daylight(float ndl) { return mix(smoothstep(-0.1, 0.14, ndl), 1.0, alwaysDay); }
`;

const EARTH_FRAGMENT = /* glsl */ `
#define PI 3.141592653589793
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D normalMap;
uniform sampler2D cloudMap;
uniform sampler2D oceanMask;
uniform vec3 cameraLocal;
uniform float hasTextures;
uniform float cloudShadow;
uniform float sunIntensity;
uniform float nightGain;
uniform float normalStrength;
uniform float nightAmbient;
uniform vec3 fallbackColor;
uniform vec3 terminatorTint;
uniform vec3 oceanSheen;
${SURFACE_COMMON}

float ggx(float noh, float a) {
  float a2 = a * a;
  float d = noh * noh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

void main() {
  vec3 n = normalize(vPos);
  vec2 uv = surfaceUv();
  vec3 east = vec3(n.z, 0.0, -n.x);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(n, east);

  vec3 t = texture2D(normalMap, uv).xyz * 2.0 - 1.0;
  t.xy *= normalStrength * hasTextures;
  vec3 N = normalize(t.x * east + t.y * north + max(t.z, 0.05) * n);

  float ocean = texture2D(oceanMask, vUv).r;
  vec3 day = mix(fallbackColor, texture2D(dayMap, uv).rgb, hasTextures);
  float ndl = dot(n, sunDir);
  float lit = daylight(ndl);

  // Cloud shadows: the cloud map seen from here toward the sun (clouds ≈ 6 km up, exaggerated).
  float slant = 0.006 / max(ndl, 0.2);
  vec2 toSun = vec2(dot(sunDir, east) / (2.0 * PI * max(el, 0.05)), dot(sunDir, north) / PI * (1.0 - 2.0 * flipY));
  float shadow = cloudShadow * texture2D(cloudMap, uv + toSun * slant).r * (1.0 - alwaysDay);

  float lambert = mix(max(dot(N, sunDir), 0.0), 1.0, alwaysDay);
  vec3 color = day * lambert * (1.0 - 0.6 * shadow) * sunIntensity;

  // A soft, slightly warm band along the terminator.
  float band = exp(-ndl * ndl / 0.012) * (1.0 - alwaysDay);
  color *= mix(vec3(1.0), terminatorTint, band * 0.55);

  // Ocean: GGX sun glint and a Fresnel sheen at grazing angles.
  vec3 v = normalize(cameraLocal - vPos);
  vec3 h = normalize(sunDir + v);
  float nov = max(dot(n, v), 1e-3);
  float nol = max(ndl, 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(v, h), 0.0), 5.0);
  float k = 0.09;
  float vis = 0.25 / ((nov * (1.0 - k) + k) * (nol * (1.0 - k) + k));
  float glint = ggx(max(dot(n, h), 0.0), 0.18) * vis * fresnel * nol;
  float grazing = pow(1.0 - nov, 4.0);
  color += ocean * (1.0 - alwaysDay) * (glint * sunIntensity * (1.0 - shadow) * vec3(1.0, 0.96, 0.88) + oceanSheen * grazing * nol * 0.35);

  // Night: city lights (HDR) and a faint earthshine surface.
  vec3 night = texture2D(nightMap, uv).rgb * hasTextures * nightGain + day * nightAmbient;
  gl_FragColor = vec4(mix(night, color, lit), 1.0);
  #include <colorspace_fragment>
}`;

const CLOUD_FRAGMENT = /* glsl */ `
uniform sampler2D cloudMap;
uniform float opacity;
uniform float sunIntensity;
${SURFACE_COMMON}
void main() {
  vec3 n = normalize(vPos);
  float density = texture2D(cloudMap, surfaceUv()).r;
  float ndl = dot(n, sunDir);
  float light = mix(max(ndl, 0.0) * 0.95 + 0.03, 1.0, alwaysDay) * sunIntensity;
  gl_FragColor = vec4(vec3(light), smoothstep(0.08, 0.9, density) * opacity);
  #include <colorspace_fragment>
}`;

const DATA_FRAGMENT = /* glsl */ `
uniform sampler2D dataMap;
uniform float opacity;
uniform float shade;
${SURFACE_COMMON}
void main() {
  vec4 texel = texture2D(dataMap, vUv);
  float ndl = dot(normalize(vPos), sunDir);
  // Lightness only (a scalar), so the colormap's hue is unchanged.
  float lightness = mix(1.0, mix(0.8, 1.0, daylight(ndl)), shade * (1.0 - alwaysDay));
  gl_FragColor = vec4(texel.rgb * lightness, texel.a * opacity);
  #include <colorspace_fragment>
}`;

export interface Earth {
  /** Spins with the globe: earth, clouds and the data frame. */
  surface: Group;
  setTextures(t: SurfaceTextures): void;
  /** Ocean = 255 where the SST grid has a value (the grid decides land and ocean). */
  setOceanMask(mask: Uint8Array, width: number, height: number): void;
  /** Sun direction in the globe's own frame; null = always day. */
  setSun(dir: Vector3 | null): void;
  setCameraLocal(p: Vector3): void;
  /** Cloud opacity 0..1 (they fade in the close-up and while a value is read). */
  setClouds(opacity: number): void;
  setLook(look: Partial<EarthLook>): void;
  /** Which surface textures are showing (null until loaded). */
  textureInfo(): { month: string; ktx2: boolean; clouds: boolean } | null;
  dataChanged(): void;
  setDataOpacity(opacity: number): void;
  dispose(): void;
}

function placeholder(): DataTexture {
  const t = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

export function createEarth(palette: Palette, dataCanvas: HTMLCanvasElement, anisotropy: number): Earth {
  const geometry = globeGeometry(EARTH_RADIUS, SEGMENTS.cols, SEGMENTS.rows);
  const cloudGeometry = globeGeometry(CLOUD_RADIUS, SEGMENTS.cols / 2, SEGMENTS.rows / 2);
  const dataGeometry = globeGeometry(DATA_RADIUS, SEGMENTS.cols / 2, SEGMENTS.rows / 2);
  const empty = placeholder();
  let textures: SurfaceTextures | null = null;
  let oceanMask: DataTexture = placeholder();
  let look = DEFAULT_LOOK;

  // Shared by all three shells, so the sun and the texture orientation can't disagree.
  const shared = {
    sunDir: { value: new Vector3(0, 0, 1) },
    alwaysDay: { value: 0 },
    flipY: { value: 0 },
    sunIntensity: { value: look.sunIntensity },
  };
  const cloudMap = { value: empty as Texture };
  const uniforms = {
    ...shared,
    dayMap: { value: empty as Texture },
    nightMap: { value: empty as Texture },
    normalMap: { value: empty as Texture },
    cloudMap,
    oceanMask: { value: oceanMask as Texture },
    cameraLocal: { value: new Vector3(0, 0, 5) },
    hasTextures: { value: 0 },
    cloudShadow: { value: 0 },
    nightGain: { value: look.nightGain },
    normalStrength: { value: look.normalStrength },
    nightAmbient: { value: look.nightAmbient },
    fallbackColor: { value: new Color(palette.tide) },
    terminatorTint: { value: new Color(palette["terminator-warm"]) },
    oceanSheen: { value: new Color(palette.atmosphere) },
  };
  const earthMaterial = new ShaderMaterial({ uniforms, vertexShader: SURFACE_VERTEX, fragmentShader: EARTH_FRAGMENT });
  const earth = new Mesh(geometry, earthMaterial);
  asOccluder(earth);

  const cloudUniforms = { ...shared, cloudMap, opacity: { value: 0 } };
  const cloudMaterial = new ShaderMaterial({
    uniforms: cloudUniforms,
    vertexShader: SURFACE_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  const clouds = new Mesh(cloudGeometry, cloudMaterial);
  clouds.renderOrder = 1;
  clouds.visible = false;

  const dataTexture = new CanvasTexture(dataCanvas);
  dataTexture.colorSpace = SRGBColorSpace;
  dataTexture.anisotropy = anisotropy;
  const dataUniforms = { ...shared, dataMap: { value: dataTexture as Texture }, opacity: { value: 0.85 }, shade: { value: look.dataShade } };
  const dataMaterial = new ShaderMaterial({
    uniforms: dataUniforms,
    vertexShader: SURFACE_VERTEX,
    fragmentShader: DATA_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  const data = new Mesh(dataGeometry, dataMaterial);
  onOverlay(data);

  const surface = new Group();
  surface.add(earth, clouds, data);

  const disposeTextures = () => {
    if (textures) for (const t of [textures.day, textures.night, textures.normal, textures.clouds]) t?.dispose();
  };

  return {
    surface,
    setTextures(t) {
      // A new tier or month replaces the old textures: free those first.
      disposeTextures();
      textures = t;
      for (const tex of [t.day, t.night, t.normal, t.clouds]) if (tex) tex.anisotropy = anisotropy;
      uniforms.dayMap.value = t.day;
      uniforms.nightMap.value = t.night;
      uniforms.normalMap.value = t.normal;
      cloudMap.value = t.clouds ?? empty;
      shared.flipY.value = t.flipY ? 1 : 0;
      uniforms.hasTextures.value = 1;
      clouds.visible = t.clouds !== null && cloudUniforms.opacity.value > 0;
    },
    setOceanMask(mask, width, height) {
      oceanMask.dispose();
      oceanMask = new DataTexture(mask, width, height, RedFormat);
      oceanMask.magFilter = LinearFilter;
      oceanMask.needsUpdate = true;
      uniforms.oceanMask.value = oceanMask;
    },
    setSun(dir) {
      shared.alwaysDay.value = dir ? 0 : 1;
      if (dir) shared.sunDir.value.copy(dir).normalize();
    },
    setCameraLocal(p) {
      uniforms.cameraLocal.value.copy(p);
    },
    setClouds(opacity) {
      cloudUniforms.opacity.value = opacity;
      uniforms.cloudShadow.value = opacity * 0.6;
      clouds.visible = textures?.clouds != null && opacity > 0.005;
    },
    setLook(l) {
      look = { ...look, ...l };
      shared.sunIntensity.value = look.sunIntensity;
      uniforms.nightGain.value = look.nightGain;
      uniforms.normalStrength.value = look.normalStrength;
      uniforms.nightAmbient.value = look.nightAmbient;
      dataUniforms.shade.value = look.dataShade;
    },
    textureInfo: () => textures && { month: textures.month, ktx2: textures.flipY, clouds: textures.clouds !== null },
    dataChanged() {
      dataTexture.needsUpdate = true;
    },
    setDataOpacity(opacity) {
      dataUniforms.opacity.value = opacity;
      data.visible = opacity > 0;
    },
    dispose() {
      for (const g of [geometry, cloudGeometry, dataGeometry]) g.dispose();
      for (const m of [earthMaterial, cloudMaterial, dataMaterial]) m.dispose();
      for (const t of [dataTexture, oceanMask, empty]) t.dispose();
      disposeTextures();
    },
  };
}
