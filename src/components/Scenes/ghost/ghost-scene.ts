// Ghost Earths, in three.js: a dim Blue Marble core for orientation, the "then"
// window as a silver ghost shell at radius 1, and the "now" window as a solid
// shell raised or lowered by the change (fixed, stated scale) and coloured by
// it on a diverging scale. Cells without data in either window are discarded
// (hollow). Both data shells are drawn in the overlay pass, after tone mapping,
// so the colour scale is never shifted; the core is an occluder.

import {
  DataTexture,
  FloatType,
  Group,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
  type Texture,
} from "three";
import { latLonToSphere } from "@/lib/sphere";
import { globeGeometry } from "../../Turntable/scene/geometry";
import { createStudio } from "../../Turntable/scene/studio";
import { asOccluder, onOverlay } from "../../Turntable/scene/layers";
import { builtMonths, createEarthTextureLoader } from "../../Turntable/textures";
import { scaleUniform, type Rgb } from "../colormaps";
import type { SceneBuildHost, SceneHandle } from "../types";
import type { GhostField } from "./fields";

const CORE_RADIUS = 0.9;
const CORE_DIM = 0.55;
const SEGMENTS = { cols: 360, rows: 180 } as const;
/** The diverging schemes' class count (colormaps.ts); the shader's colour array has this length. */
const SCALE_CLASSES = 11;

/** How a layer is drawn: the colour scale's half-range and the separation per unit of change (globe radii). */
export interface ShellScale {
  /** |change| at which the colour scale saturates. */
  clamp: number;
  /** Radial offset per unit of change. */
  offsetPerUnit: number;
  colours: readonly Rgb[];
}

const COMMON = /* glsl */ `
#define PI 3.141592653589793
uniform sampler2D field; // r = then, g = now, b = then present, a = now present
vec2 fieldUv(vec3 d) {
  float lat = asin(clamp(d.y, -1.0, 1.0));
  float lon = atan(d.x, d.z);
  return vec2((lon + PI) / (2.0 * PI), (0.5 * PI - lat) / PI);
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
`;

const NOW_VERTEX = /* glsl */ `
${COMMON}
uniform float offsetPerUnit;
varying vec3 vDir;
varying vec3 vWorld;
void main() {
  vDir = normalize(position);
  vec4 f = texture2D(field, fieldUv(vDir));
  float change = (f.g - f.r) * f.b * f.a;
  vec4 world = modelMatrix * vec4(position * (1.0 + change * offsetPerUnit), 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const NOW_FRAGMENT = /* glsl */ `
${COMMON}
uniform float clampAt;
uniform vec3 colours[11];
uniform vec3 lightDir;
varying vec3 vDir;
varying vec3 vWorld;
vec3 scaleColour(float t) {
  float x = clamp(t, 0.0, 1.0) * 10.0;
  int i = int(min(9.0, floor(x)));
  return mix(colours[i], colours[i + 1], x - float(i));
}
void main() {
  vec4 f = texture2D(field, fieldUv(normalize(vDir)));
  if (f.b * f.a < 0.5) discard; // no data in a window: hollow
  vec3 c = toLinear(scaleColour((f.g - f.r) / clampAt * 0.5 + 0.5));
  // Lightness only (the hue stays the scale's): faceted, so steps between cells read.
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  float shade = 0.7 + 0.3 * max(dot(n, lightDir), 0.0);
  gl_FragColor = vec4(c * shade, 1.0);
}`;

const GHOST_VERTEX = /* glsl */ `
varying vec3 vDir;
varying vec3 vNormalView;
varying vec3 vViewDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalView = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const GHOST_FRAGMENT = /* glsl */ `
${COMMON}
uniform vec3 silver;
uniform float strength;
varying vec3 vDir;
varying vec3 vNormalView;
varying vec3 vViewDir;
void main() {
  vec4 f = texture2D(field, fieldUv(normalize(vDir)));
  if (f.b < 0.5) discard;
  float fresnel = pow(1.0 - max(dot(vNormalView, vViewDir), 0.0), 2.0);
  float a = strength * (0.06 + 0.4 * fresnel); // a veil at the rim, faint face-on: the change colours stay readable
  gl_FragColor = vec4(toLinear(silver) * a, a); // premultiplied
}`;

export interface GhostLayers {
  ghost: boolean;
  core: boolean;
  stars: boolean;
}

export interface GhostScene extends SceneHandle {
  setField(field: GhostField, scale: ShellScale): void;
  setLayers(layers: GhostLayers): void;
}

/** then/now per cell → an RGBA float texture on the layer's grid (row 0 = north). */
function fieldTexture(field: GhostField): DataTexture {
  const { lat, lon } = field.layer.meta.grid;
  const data = new Float32Array(lat.length * lon.length * 4);
  for (let id = 0; id < field.then.length; id++) {
    const a = field.then[id];
    const b = field.now[id];
    data.set([Number.isNaN(a) ? 0 : a, Number.isNaN(b) ? 0 : b, Number.isNaN(a) ? 0 : 1, Number.isNaN(b) ? 0 : 1], id * 4);
  }
  const tex = new DataTexture(data, lon.length, lat.length, RGBAFormat, FloatType);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createGhostScene(host: SceneBuildHost): GhostScene {
  const { renderer, scene, palette } = host;
  const root = new Group();
  const globe = new Group();
  const studio = createStudio(palette);
  studio.setStars(1);
  root.add(studio.group, globe);
  scene.add(root);

  // The core: Blue Marble (the Low set), dimmed, for orientation only.
  const coreMaterial = new MeshBasicMaterial({ color: 0xffffff });
  coreMaterial.color.multiplyScalar(CORE_DIM);
  const core = new Mesh(globeGeometry(CORE_RADIUS), coreMaterial);
  asOccluder(core);
  globe.add(core);
  const loader = createEarthTextureLoader(renderer);
  let disposed = false;
  void builtMonths()
    .then((months) => loader.load("low", months[0] ?? "09"))
    .then((t) => {
      for (const tex of [t.night, t.normal, t.clouds]) tex?.dispose();
      if (disposed) {
        t.day.dispose();
        return;
      }
      // KTX2 rows are north-first at v = 0: flip through the texture transform (compressed data can't be flipped).
      if (t.flipY) {
        t.day.repeat.set(1, -1);
        t.day.offset.set(0, 1);
      }
      coreMaterial.map = t.day;
      coreMaterial.needsUpdate = true;
    })
    .catch(() => undefined); // the core stays a plain dim sphere

  const empty = new DataTexture(new Float32Array(4), 1, 1, RGBAFormat, FloatType);
  const geometry = globeGeometry(1, SEGMENTS.cols, SEGMENTS.rows);
  const nowMaterial = new ShaderMaterial({
    vertexShader: NOW_VERTEX,
    fragmentShader: NOW_FRAGMENT,
    uniforms: {
      field: { value: empty as Texture },
      offsetPerUnit: { value: 0 },
      clampAt: { value: 1 },
      colours: { value: Array.from({ length: SCALE_CLASSES }, () => new Vector3()) },
      lightDir: { value: new Vector3(0.4, 0.6, 0.7).normalize() },
    },
  });
  const ghostMaterial = new ShaderMaterial({
    vertexShader: GHOST_VERTEX,
    fragmentShader: GHOST_FRAGMENT,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: { field: { value: empty as Texture }, silver: { value: new Vector3(0.86, 0.89, 0.95) }, strength: { value: 1 } },
  });
  const now = new Mesh(geometry, nowMaterial);
  const ghost = new Mesh(geometry, ghostMaterial);
  ghost.renderOrder = 1;
  onOverlay(now);
  onOverlay(ghost);
  globe.add(now, ghost);

  let texture: DataTexture | null = null;

  return {
    globe,
    setField(field, scale) {
      texture?.dispose();
      texture = fieldTexture(field);
      nowMaterial.uniforms.field.value = texture;
      ghostMaterial.uniforms.field.value = texture;
      nowMaterial.uniforms.offsetPerUnit.value = scale.offsetPerUnit;
      nowMaterial.uniforms.clampAt.value = scale.clamp;
      const flat = scaleUniform(scale.colours);
      (nowMaterial.uniforms.colours.value as Vector3[]).forEach((v, i) => v.set(flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]));
    },
    setLayers(l) {
      ghost.visible = l.ghost;
      core.visible = l.core;
      studio.setStars(l.stars ? 1 : 0);
    },
    update() {},
    dispose() {
      disposed = true;
      scene.remove(root);
      texture?.dispose();
      empty.dispose();
      geometry.dispose();
      nowMaterial.dispose();
      ghostMaterial.dispose();
      core.geometry.dispose();
      coreMaterial.map?.dispose();
      coreMaterial.dispose();
      loader.dispose();
      studio.dispose();
    },
  };
}

/** A lat/lon as a unit vector (the orbit camera looks at the globe centre from here). */
export const directionOf = (lat: number, lon: number) => {
  const p = latLonToSphere(lat, lon);
  return new Vector3(p.x, p.y, p.z);
};
