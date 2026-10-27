// The studio around the turntable: a deep, warm, near-black backdrop (a large
// sphere, so it has depth and the atmosphere's limb can glow over it) and a
// faint star field that only shows in the close-up view. Decoration only.

import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  Points,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import type { Palette } from "@/lib/css-tokens";

export const BACKDROP_RADIUS = 40;
const STAR_COUNT = 2400;
const STAR_RADIUS = 38;

const BACKDROP_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const BACKDROP_FRAGMENT = /* glsl */ `
uniform vec3 top;
uniform vec3 bottom;
uniform vec3 glow;
varying vec3 vDir;
void main() {
  float t = smoothstep(-0.6, 0.7, vDir.y);
  vec3 c = mix(bottom, top, t);
  // A soft pool of warm light behind the deck, like a studio sweep.
  c += glow * pow(max(dot(vDir, normalize(vec3(-0.2, 0.15, -1.0))), 0.0), 6.0) * 0.35;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const STAR_VERTEX = /* glsl */ `
attribute float size;
attribute float brightness;
varying float vBrightness;
void main() {
  vBrightness = brightness;
  gl_PointSize = size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const STAR_FRAGMENT = /* glsl */ `
uniform float opacity;
uniform vec3 tint;
varying float vBrightness;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d) * vBrightness * opacity;
  gl_FragColor = vec4(tint * a, a);
}`;

export interface Studio {
  group: Group;
  /** 0 = hidden (Jukebox view), 1 = full (close-up). */
  setStars(opacity: number): void;
  dispose(): void;
}

/** A deterministic pseudo-random sequence, so the sky is the same every visit. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createStudio(palette: Palette): Studio {
  const backdropGeometry = new SphereGeometry(BACKDROP_RADIUS, 64, 32);
  const backdropMaterial = new ShaderMaterial({
    uniforms: {
      top: { value: new Color(palette["studio-top"]) },
      bottom: { value: new Color(palette["studio-bottom"]) },
      glow: { value: new Color(palette["studio-glow"]) },
    },
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    side: BackSide,
    depthWrite: true,
  });
  const backdrop = new Mesh(backdropGeometry, backdropMaterial);

  const random = seeded(20260925);
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const brightness = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const z = random() * 2 - 1;
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    positions.set([r * Math.cos(a) * STAR_RADIUS, z * STAR_RADIUS, r * Math.sin(a) * STAR_RADIUS], i * 3);
    const m = random() ** 3;
    sizes[i] = 1 + m * 2.2;
    brightness[i] = 0.25 + m * 0.75;
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  starGeometry.setAttribute("size", new BufferAttribute(sizes, 1));
  starGeometry.setAttribute("brightness", new BufferAttribute(brightness, 1));
  const starMaterial = new ShaderMaterial({
    uniforms: { opacity: { value: 0 }, tint: { value: new Color(palette.moon) } },
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.visible = false;

  const group = new Group();
  group.add(backdrop, stars);

  return {
    group,
    setStars(opacity) {
      starMaterial.uniforms.opacity.value = opacity;
      stars.visible = opacity > 0.01;
    },
    dispose() {
      backdropGeometry.dispose();
      starGeometry.dispose();
      backdropMaterial.dispose();
      starMaterial.dispose();
    },
  };
}
