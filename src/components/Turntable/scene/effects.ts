// Motion that never adds a second encoding: the groove (the needle's latitude),
// a swatch in the frame's own pixel colour at the contact point, one ring per
// sound there, raindrops / snowflakes at exactly the voice's drops per second,
// and a sparkle on the extreme cell.

import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  CircleGeometry,
  Mesh,
  Points,
  PointsMaterial,
  Quaternion,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import { parallel, pathsGeometry } from "./geometry";
import { onOverlay } from "./layers";

const MAX_PARTICLES = 96;
const FALL_SEC = 0.5;
const FALL_HEIGHT = 0.32;
/** The contact swatch, on screen: about 10 px across at any zoom. */
const SWATCH = { radiusPx: 5, outlinePx: 2 };
/** A sound's ring spreads from the swatch to about 3× its size. */
const RING = { fromPx: 5, toPx: 15, seconds: 0.4, halfWidthPx: 1, minGapSec: 1 / 3, pool: 3 };
/** The disc mesh is a little larger than what's drawn on it: the shader cuts the shape in pixels. */
const DISC_PADDING_PX = 2;
const SPARKLE_SEC = 0.9;
const SPARKLE_POINTS = 24;
const GROOVE_RADIUS = 1.004;
/** Dot sizes in CSS pixels. */
const RAIN_PX = 4;
const SNOW_PX = 6;
const SPARKLE_PX = 7;

export type ParticleKind = "rain" | "snow";

export interface Effects {
  group: Group;
  /** The needle's latitude, drawn as a flat ring that doesn't turn. */
  setGroove(lat: number): void;
  /** Where the needle touches (world space) and the surface normal there. */
  setNeedle(point: Vector3, normal: Vector3): void;
  /** The swatch: the frame pixel under the needle, or null for an empty paper disc (land or no data). */
  setSwatchColor(rgb: [number, number, number] | null): void;
  swatchColor(): [number, number, number] | null;
  /** One ring spreading from the contact point (at most 3 per second). */
  ring(): void;
  /** Particles per second (the voice's own drops/s) and their kind; 0 = none. */
  setParticles(perSecond: number, kind: ParticleKind): void;
  sparkle(): void;
  /**
   * Advance by dt seconds; `zoom` (0..1, camera height) keeps the particles the same size on screen at any zoom,
   * and `worldPerPx` does the same for the swatch and rings. Returns how many particles were spawned (for the debug count).
   */
  update(dt: number, zoom: number, worldPerPx: number): number;
  setMotion(on: boolean): void;
  dispose(): void;
}

function dotTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  return new CanvasTexture(c);
}

const DISC_VERTEX = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** A flat disc with an outline, cut in pixels so its edge stays crisp. Unlit: the fill is exactly the colour it's given. */
const SWATCH_FRAGMENT = /* glsl */ `
uniform vec3 fill;
uniform vec3 edge;
uniform float radius;
uniform float outline;
uniform float halfSize;
varying vec2 vP;
void main() {
  float d = length(vP) * halfSize;
  float a = 1.0 - smoothstep(radius + outline - 0.5, radius + outline + 0.5, d);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(mix(fill, edge, smoothstep(radius - 0.5, radius + 0.5, d)), a);
  #include <colorspace_fragment>
}`;

/** A thin ring that fades as it spreads. */
const RING_FRAGMENT = /* glsl */ `
uniform vec3 edge;
uniform float radius;
uniform float halfWidth;
uniform float opacity;
uniform float halfSize;
varying vec2 vP;
void main() {
  float a = (1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, abs(length(vP) * halfSize - radius))) * opacity;
  if (a <= 0.0) discard;
  gl_FragColor = vec4(edge, a);
  #include <colorspace_fragment>
}`;

export function createEffects(palette: Palette): Effects {
  const group = new Group();
  const accent = new Color(palette.shapla);
  const dot = dotTexture();

  // A one-pixel line, so the groove stays thin at any zoom.
  const grooveMaterial = new LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9, depthWrite: false });
  let grooveLat = Number.NaN;
  const groove = new LineSegments(new BufferGeometry(), grooveMaterial);
  groove.renderOrder = 4;

  const navy = new Color(palette.moon);
  const paper = new Color(palette.star);
  const discGeometry = new CircleGeometry(1, 48);
  const swatchHalfSize = SWATCH.radiusPx + SWATCH.outlinePx + DISC_PADDING_PX;
  const swatchUniforms = {
    fill: { value: paper.clone() },
    edge: { value: navy },
    radius: { value: SWATCH.radiusPx },
    outline: { value: SWATCH.outlinePx },
    halfSize: { value: swatchHalfSize },
  };
  const swatchMaterial = new ShaderMaterial({ uniforms: swatchUniforms, vertexShader: DISC_VERTEX, fragmentShader: SWATCH_FRAGMENT, transparent: true, depthWrite: false });
  const swatch = new Mesh(discGeometry, swatchMaterial);
  swatch.renderOrder = 6;
  let swatchRgb: [number, number, number] | null = null;

  const ringHalfSize = RING.toPx + DISC_PADDING_PX;
  const rings = Array.from({ length: RING.pool }, () => {
    const uniforms = { edge: { value: navy }, radius: { value: RING.fromPx }, halfWidth: { value: RING.halfWidthPx }, opacity: { value: 0 }, halfSize: { value: ringHalfSize } };
    const material = new ShaderMaterial({ uniforms, vertexShader: DISC_VERTEX, fragmentShader: RING_FRAGMENT, transparent: true, depthWrite: false });
    const mesh = new Mesh(discGeometry, material);
    mesh.renderOrder = 5;
    mesh.visible = false;
    return { mesh, material, uniforms, age: Infinity };
  });
  let sinceRing = Infinity;

  const particlePositions = new Float32Array(MAX_PARTICLES * 3);
  const particleGeometry = new BufferGeometry();
  particleGeometry.setAttribute("position", new BufferAttribute(particlePositions, 3));
  // Pixel-sized dots (no size attenuation), so drops look the same at any zoom.
  const particleMaterial = new PointsMaterial({ map: dot, size: RAIN_PX, sizeAttenuation: false, transparent: true, depthWrite: false, color: new Color(palette.moon) });
  const particles = new Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  particles.renderOrder = 6;
  const ages = new Float32Array(MAX_PARTICLES).fill(Infinity);
  const offsets = new Float32Array(MAX_PARTICLES * 2);

  const sparklePositions = new Float32Array(SPARKLE_POINTS * 3);
  const sparkleGeometry = new BufferGeometry();
  sparkleGeometry.setAttribute("position", new BufferAttribute(sparklePositions, 3));
  const sparkleMaterial = new PointsMaterial({ map: dot, size: SPARKLE_PX, sizeAttenuation: false, color: accent, transparent: true, opacity: 0, depthWrite: false });
  const sparkles = new Points(sparkleGeometry, sparkleMaterial);
  sparkles.frustumCulled = false;

  group.add(groove, ...rings.map((r) => r.mesh), swatch, particles, sparkles);
  // Drawn in the overlay pass with the data frame, so their colours are exact.
  onOverlay(group);

  const needlePoint = new Vector3(0, 0, 1);
  const needleNormal = new Vector3(0, 0, 1);
  const tangentA = new Vector3();
  const tangentB = new Vector3();
  const orient = new Quaternion();
  const scratch = new Vector3();
  let zoomNow = 1;
  let rate = 0;
  let kind: ParticleKind = "rain";
  let toSpawn = 0;
  let next = 0;
  let sparkleAge = Infinity;
  let motion = true;

  const updateTangents = () => {
    tangentA.set(0, 1, 0).cross(needleNormal);
    if (tangentA.lengthSq() < 1e-6) tangentA.set(1, 0, 0);
    tangentA.normalize();
    tangentB.copy(needleNormal).cross(tangentA).normalize();
  };

  return {
    group,
    setGroove(lat) {
      if (Math.abs(lat - grooveLat) < 0.02) return;
      grooveLat = lat;
      groove.geometry.dispose();
      groove.geometry = pathsGeometry([parallel(lat, 1)], GROOVE_RADIUS);
    },
    setNeedle(point, normal) {
      needlePoint.copy(point);
      needleNormal.copy(normal).normalize();
      updateTangents();
      orient.setFromUnitVectors(new Vector3(0, 0, 1), needleNormal);
      for (const m of [swatch, ...rings.map((r) => r.mesh)]) {
        m.position.copy(point).addScaledVector(needleNormal, 0.003);
        m.quaternion.copy(orient);
      }
    },
    setSwatchColor(rgb) {
      swatchRgb = rgb;
      if (rgb) swatchUniforms.fill.value.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, SRGBColorSpace);
      else swatchUniforms.fill.value.copy(paper);
    },
    swatchColor: () => swatchRgb,
    ring() {
      if (!motion || sinceRing < RING.minGapSec) return;
      const free = rings.find((r) => r.age >= RING.seconds) ?? rings[0];
      free.age = 0;
      sinceRing = 0;
    },
    setParticles(perSecond, k) {
      rate = Math.max(0, perSecond);
      if (k !== kind) {
        kind = k;
        particleMaterial.size = k === "snow" ? SNOW_PX : RAIN_PX;
      }
    },
    sparkle() {
      if (!motion) return;
      sparkleAge = 0;
      for (let i = 0; i < SPARKLE_POINTS; i++) {
        const a = (i / SPARKLE_POINTS) * Math.PI * 2;
        const r = (0.02 + (0.03 * ((i * 7) % 5)) / 5) * zoomNow;
        const p = needlePoint.clone().addScaledVector(tangentA, Math.cos(a) * r).addScaledVector(tangentB, Math.sin(a) * r).addScaledVector(needleNormal, 0.01);
        sparklePositions.set([p.x, p.y, p.z], i * 3);
      }
      sparkleGeometry.attributes.position.needsUpdate = true;
    },
    update(dt, zoom, worldPerPx) {
      zoomNow = zoom;
      swatch.scale.setScalar(swatchHalfSize * worldPerPx);
      sinceRing += dt;
      for (const r of rings) {
        r.age += dt;
        const t = r.age / RING.seconds;
        r.mesh.visible = motion && t < 1;
        if (!r.mesh.visible) continue;
        r.mesh.scale.setScalar(ringHalfSize * worldPerPx);
        r.uniforms.radius.value = RING.fromPx + (RING.toPx - RING.fromPx) * t;
        r.uniforms.opacity.value = 1 - t;
      }

      // Particles: spawn at the voice's rate (deterministic spacing, so the count equals rate × time).
      let spawned = 0;
      if (motion && rate > 0) {
        toSpawn += rate * dt;
        while (toSpawn >= 1) {
          toSpawn -= 1;
          spawned++;
          const i = next;
          next = (next + 1) % MAX_PARTICLES;
          ages[i] = 0;
          offsets[i * 2] = (Math.random() - 0.5) * 0.06;
          offsets[i * 2 + 1] = (Math.random() - 0.5) * 0.06;
        }
      } else {
        toSpawn = 0;
      }
      for (let i = 0; i < MAX_PARTICLES; i++) {
        ages[i] += dt;
        const t = ages[i] / FALL_SEC;
        // Landed particles are parked just inside the globe (hidden by its depth); falling ones drop along the normal.
        scratch.copy(needlePoint).addScaledVector(needleNormal, t < 1 ? FALL_HEIGHT * zoom * (1 - t) : -0.5);
        if (t < 1) {
          const drift = kind === "snow" ? Math.sin(ages[i] * 9 + i) * 0.01 : 0;
          scratch.addScaledVector(tangentA, (offsets[i * 2] + drift) * zoom).addScaledVector(tangentB, offsets[i * 2 + 1] * zoom);
        }
        particlePositions[i * 3] = scratch.x;
        particlePositions[i * 3 + 1] = scratch.y;
        particlePositions[i * 3 + 2] = scratch.z;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      sparkleAge += dt;
      sparkleMaterial.opacity = sparkleAge < SPARKLE_SEC ? 1 - sparkleAge / SPARKLE_SEC : 0;
      return spawned;
    },
    setMotion(on) {
      motion = on;
      particles.visible = on;
      if (!on) sparkleAge = Infinity;
    },
    dispose() {
      groove.geometry.dispose();
      for (const g of [discGeometry, particleGeometry, sparkleGeometry]) g.dispose();
      for (const m of [grooveMaterial, swatchMaterial, ...rings.map((r) => r.material), particleMaterial, sparkleMaterial]) m.dispose();
      dot.dispose();
    },
  };
}
