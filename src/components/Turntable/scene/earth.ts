// The realistic Earth (decoration) and the data frame above it (the sonified
// layer). Day/night blend with a soft terminator from the sun direction, relief
// shading on land, sun glint on oceans (ocean = the SST grid's own mask, so the
// grid wins), a Fresnel atmosphere, and the frame image at an adjustable opacity.

import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DataTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  RedFormat,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector3,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import { globeGeometry } from "./geometry";

export const EARTH_RADIUS = 1;
const DATA_RADIUS = 1.0015;
const ATMOSPHERE_RADIUS = 1.06;

const EARTH_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const EARTH_FRAGMENT = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D reliefMap;
uniform sampler2D oceanMask;
uniform vec3 sunDir;       // object space
uniform vec3 cameraLocal;  // camera position, object space
uniform float alwaysDay;
uniform float reliefStrength;
uniform float hasTextures;
uniform vec3 glintColor;
uniform vec3 fallbackColor;
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vPos);
  float ocean = texture2D(oceanMask, vUv).r;
  vec3 day = mix(fallbackColor, texture2D(dayMap, vUv).rgb, hasTextures);
  vec3 night = texture2D(nightMap, vUv).rgb * hasTextures;
  float relief = texture2D(reliefMap, vUv).r;
  day *= mix(1.0, clamp(relief / 0.82, 0.55, 1.3), reliefStrength * (1.0 - ocean) * hasTextures);
  float ndl = dot(n, sunDir);
  float lit = mix(smoothstep(-0.12, 0.22, ndl), 1.0, alwaysDay);
  vec3 dayLit = day * mix(0.6 + 0.55 * clamp(ndl, 0.0, 1.0), 1.0, alwaysDay);
  vec3 viewDir = normalize(cameraLocal - vPos);
  vec3 halfDir = normalize(sunDir + viewDir);
  float glint = pow(max(dot(n, halfDir), 0.0), 70.0) * ocean * (1.0 - alwaysDay) * step(0.0, ndl) * 0.55;
  // The night side keeps a faint, moonlit day surface under the city lights, so continents stay readable.
  vec3 nightSide = night * 1.5 + day * 0.22;
  gl_FragColor = vec4(mix(nightSide, dayLit, lit) + glintColor * glint, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const ATMOSPHERE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normalize(position));
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 color;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float rim = 1.0 - max(dot(vNormal, vView), 0.0);
  gl_FragColor = vec4(color, pow(rim, 4.0) * 0.85);
  #include <colorspace_fragment>
}`;

export interface EarthTextures {
  day: Texture;
  night: Texture;
  relief: Texture;
}

export interface Earth {
  /** Spins with the globe: earth, data frame and everything drawn on the surface. */
  surface: Group;
  /** Doesn't spin (it's round): the atmosphere. */
  atmosphere: Mesh;
  setTextures(t: EarthTextures): void;
  /** Ocean = 255 where the SST grid has a value (the grid decides land and ocean). */
  setOceanMask(mask: Uint8Array, width: number, height: number): void;
  /** Sun direction in the globe's own frame; null = always day. */
  setSun(dir: Vector3 | null): void;
  setCameraLocal(p: Vector3): void;
  setRelief(on: boolean): void;
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
  const geometry = globeGeometry(EARTH_RADIUS);
  const dataGeometry = globeGeometry(DATA_RADIUS);
  const atmosphereGeometry = globeGeometry(ATMOSPHERE_RADIUS, 96, 48);
  let textures: EarthTextures | null = null;
  let oceanMask: DataTexture = placeholder();
  const empty = placeholder();

  const uniforms = {
    dayMap: { value: empty as Texture },
    nightMap: { value: empty as Texture },
    reliefMap: { value: empty as Texture },
    oceanMask: { value: oceanMask as Texture },
    sunDir: { value: new Vector3(0, 0, 1) },
    cameraLocal: { value: new Vector3(0, 0, 5) },
    alwaysDay: { value: 0 },
    reliefStrength: { value: 1 },
    hasTextures: { value: 0 },
    glintColor: { value: new Color(palette["sun-glint"]) },
    fallbackColor: { value: new Color(palette.tide) },
  };
  const earthMaterial = new ShaderMaterial({ uniforms, vertexShader: EARTH_VERTEX, fragmentShader: EARTH_FRAGMENT });
  const earth = new Mesh(geometry, earthMaterial);

  const dataTexture = new CanvasTexture(dataCanvas);
  dataTexture.colorSpace = SRGBColorSpace;
  dataTexture.anisotropy = anisotropy;
  const dataMaterial = new MeshBasicMaterial({ map: dataTexture, transparent: true, opacity: 0.85, depthWrite: false });
  const data = new Mesh(dataGeometry, dataMaterial);
  data.renderOrder = 1;

  const surface = new Group();
  surface.add(earth, data);

  const atmosphereMaterial = new ShaderMaterial({
    uniforms: { color: { value: new Color(palette.atmosphere) } },
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.renderOrder = 3;

  return {
    surface,
    atmosphere,
    setTextures(t) {
      // A new quality replaces the old textures: free those first.
      if (textures) for (const old of [textures.day, textures.night, textures.relief]) old.dispose();
      textures = { day: t.day, night: t.night, relief: t.relief };
      t.day.colorSpace = SRGBColorSpace;
      t.night.colorSpace = SRGBColorSpace;
      for (const tex of [t.day, t.night, t.relief]) tex.anisotropy = anisotropy;
      uniforms.dayMap.value = t.day;
      uniforms.nightMap.value = t.night;
      uniforms.reliefMap.value = t.relief;
      uniforms.hasTextures.value = 1;
    },
    setOceanMask(mask, width, height) {
      oceanMask.dispose();
      oceanMask = new DataTexture(mask, width, height, RedFormat);
      oceanMask.magFilter = LinearFilter;
      oceanMask.needsUpdate = true;
      uniforms.oceanMask.value = oceanMask;
    },
    setSun(dir) {
      uniforms.alwaysDay.value = dir ? 0 : 1;
      if (dir) uniforms.sunDir.value.copy(dir).normalize();
    },
    setCameraLocal(p) {
      uniforms.cameraLocal.value.copy(p);
    },
    setRelief(on) {
      uniforms.reliefStrength.value = on ? 1 : 0;
    },
    dataChanged() {
      dataTexture.needsUpdate = true;
    },
    setDataOpacity(opacity) {
      dataMaterial.opacity = opacity;
      data.visible = opacity > 0;
    },
    dispose() {
      for (const g of [geometry, dataGeometry, atmosphereGeometry]) g.dispose();
      for (const m of [earthMaterial, dataMaterial, atmosphereMaterial]) m.dispose();
      for (const t of [dataTexture, oceanMask, empty]) t.dispose();
      if (textures) for (const t of [textures.day, textures.night, textures.relief]) t.dispose();
    },
  };
}
